// Cert Tracker — privacy-preserving live job-market feed and best-fit matching.
(function initJobMarket(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT?.marketReadiness)return;
  let cache=null,loading=null,loadedAt=0;
  function usable(feed,now=Date.now()){const age=now-Date.parse(feed?.lastSuccessfulFetchAt||feed?.fetchedAt);return !!feed&&!feed.refreshError&&['live','ready','ok'].includes(feed.status)&&Number.isFinite(age)&&age>=-60000&&age<=(feed.refreshTargetMinutes===60?5400000:900000);}
  function recentJob(job){const at=Date.parse(job?.created),seen=Date.parse(job?.lastSeenAt||job?.created),now=Date.now();return Number.isFinite(at)&&Number.isFinite(seen)&&now-at>=-60000&&now-at<=14*86400000&&now-seen>=-60000&&now-seen<=86400000;}
  const FEED='data/job-market.json';
  function freshness(feed,now=Date.now()){
    const at=Date.parse(feed?.fetchedAt||''),age=now-at;
    const source=Number.isFinite(at)?`Source updated ${new Date(at).toLocaleString()}. `:'No verified source timestamp. ';
    if(feed?.refreshError||!feed||['unavailable','awaiting-provider-credentials'].includes(feed.status))return{label:'Unavailable / cached data',detail:source+'A current provider feed could not be verified.'};
    if(!Number.isFinite(at)||age< -60000||age>(feed?.refreshTargetMinutes===60?90:15)*60000)return{label:'Stale or unverified market data',detail:source+'Do not treat these listings as live.'};
    if(!['live','ready','ok'].includes(feed.status))return{label:'Partial market feed',detail:source+'Provider coverage is degraded; listings may be incomplete.'};
    return{label:'Recent published market data',detail:source+'Listings are provider snapshots, not real-time guarantees.'};
  }
  const STOP=new Set(['and','the','for','with','security','engineer','analyst','specialist','manager','uk','cyber']);
  const RANK_INDEX=Object.freeze({R1:1,R2:2,R3:3,R4:4,R5:5,R6:6});
  function words(value){return [...new Set(String(value||'').toLowerCase().replace(/[^a-z0-9+#/. -]+/g,' ').split(/\s+/).filter(x=>x.length>2&&!STOP.has(x)))];}
  function overlap(a,b){const A=words(a),B=new Set(words(b));if(!A.length)return 0;return A.filter(x=>B.has(x)||[...B].some(y=>y.includes(x)||x.includes(y))).length/A.length;}
  function ageScore(created){if(!created)return 30;const days=(Date.now()-new Date(created).getTime())/86400000;if(!Number.isFinite(days))return 20;return Math.max(0,100-days*9);}
  function salaryMid(job){if(job.currency!=='GBP'||!['annual','year'].includes(job.salaryPeriod))return 0;const lo=Number(job.salaryMin)||0,hi=Number(job.salaryMax)||0;return lo&&hi?(lo+hi)/2:lo||hi||0;}
  function providerSearch(role,provider){const q=encodeURIComponent(role?.query||role?.label||'cyber security');if(provider==='indeed')return`https://uk.indeed.com/jobs?q=${q}`;if(provider==='reed')return`https://www.reed.co.uk/jobs/${q.replace(/%20/g,'-')}-jobs`;return`https://www.adzuna.co.uk/search?q=${q}`;}
  async function load({force=false}={}){if(cache&&!force&&Date.now()-loadedAt<60000)return cache;if(loading)return loading;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);loading=fetch(`${FEED}?v=${Date.now()}`,{cache:'no-store',credentials:'same-origin',signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`Market feed HTTP ${r.status}`);return r.json();}).then(data=>{if(!Array.isArray(data.jobs))throw Error('Invalid market feed');cache=data;loadedAt=Date.now();return data;}).catch(error=>{console.warn('[CertTracker job market]',error);if(cache)cache={...cache,refreshError:true};return cache?cache:{schemaVersion:1,status:'unavailable',jobs:[],fetchedAt:null,provider:'Adzuna'};}).finally(()=>{clearTimeout(timer);loading=null;});return loading;}
  function roleForJob(job,roles=CT.marketReadiness.roles()){const text=`${job.query||''} ${job.title||''} ${job.description||''}`;return roles.map(role=>{const direct=Math.max(overlap(role.query,text),overlap(role.label,text)),path=role.path?.spec?.mission?overlap(role.path.spec.mission,text):0;return{role,match:Math.max(direct,path*.8)};}).sort((a,b)=>b.match-a.match||b.role.score-a.role.score)[0]||null;}
  function jobSeniority(job){
    const text=` ${String(job?.title||'').toLowerCase().replace(/[^a-z0-9]+/g,' ')} `;
    if(/\b(?:director|head of|vice president|vp|chief|ciso|cto|cio)\b/.test(text))return Object.freeze({key:'R6',label:'Director'});
    if(/\b(?:architect|architecture lead|principal architect)\b/.test(text))return Object.freeze({key:'R5',label:'Architect'});
    if(/\b(?:manager|team lead|technical lead|engineering lead|practice lead|lead consultant)\b/.test(text))return Object.freeze({key:'R4',label:'Manager / Team Leader'});
    if(/\b(?:senior|sr|principal engineer|principal consultant|staff engineer)\b/.test(text))return Object.freeze({key:'R3',label:'Senior'});
    if(/\b(?:junior|jr|trainee|graduate|apprentice|entry level|entry-level)\b/.test(text))return Object.freeze({key:'R1',label:'Beginner / Training Role'});
    return Object.freeze({key:'R2',label:'Intermediate'});
  }
  function seniorityFit(job,role){
    const required=jobSeniority(job),current=CT.roleReadiness?.rankForRole?.(role)||null,currentIndex=RANK_INDEX[current?.key]||1,requiredIndex=RANK_INDEX[required.key]||2,gap=requiredIndex-currentIndex;
    const status=gap<=0?'READY':gap===1?'STRETCH':'TOO SENIOR';
    return Object.freeze({required,current,gap,status,score:gap<=0?100:gap===1?62:Math.max(0,38-(gap-2)*18)});
  }
  function rankJobs(feed,roles=CT.marketReadiness.roles()){
    if(!usable(feed))return Object.freeze([]);
    return Object.freeze((feed?.jobs||[]).filter(recentJob).map(job=>{
      const linked=roleForJob(job,roles),role=linked?.role,match=linked?.match||0,salary=salaryMid(job),marketMedian=Number(role?.market?.median)||1,salaryFit=salary?Math.min(100,salary/marketMedian*75):50,seniority=role?seniorityFit(job,role):null;
      const score=Math.round((role?.score||0)*.50+match*100*.24+ageScore(job.created)*.09+salaryFit*.05+Number(seniority?.score||0)*.12);
      return Object.freeze({job,role,roleMatch:Math.round(match*100),score,salaryMid:salary,seniorityGap:seniority?.gap??9,seniorityStatus:seniority?.status||'UNKNOWN',requiredRank:seniority?.required||null,currentRank:seniority?.current||null});
    }).filter(x=>x.roleMatch>=22&&x.seniorityGap<=1).sort((a,b)=>a.seniorityGap-b.seniorityGap||b.score-a.score||b.roleMatch-a.roleMatch||String(b.job.created||'').localeCompare(String(a.job.created||''))).slice(0,40));
  }
  function liveBand(role,feed=cache){if(!usable(feed))return null;const rows=rankJobs(feed,[role]).filter(x=>x.roleMatch>=38&&x.seniorityGap<=0).map(x=>x.salaryMid).filter(x=>x>=20000&&x<=250000).sort((a,b)=>a-b);if(rows.length<3)return null;const pct=p=>rows[Math.min(rows.length-1,Math.floor((rows.length-1)*p))];return Object.freeze({low:Math.round(pct(.2)/500)*500,median:Math.round(pct(.5)/500)*500,high:Math.round(pct(.8)/500)*500,samples:rows.length,source:feed?.provider||'live feed',fetchedAt:feed?.fetchedAt||null});}
  function bestFit(feed=cache,limit=10){return rankJobs(feed).filter(x=>x.role?.score>=45&&x.seniorityGap<=0).slice(0,limit);}
  function summary(feed=cache){const roles=CT.marketReadiness.roles(),ranked=rankJobs(feed,roles),best=ranked.filter(x=>x.role?.score>=58&&x.seniorityGap<=0);return Object.freeze({status:feed?.status||'unavailable',provider:feed?.provider||'Adzuna',fetchedAt:feed?.fetchedAt||null,total:Number(feed?.jobs?.length||0),bestFit:Object.freeze(best.slice(0,12)),ranked,roles:Object.freeze(roles.slice(0,12))});}
  CT.jobMarket=Object.freeze({FEED,load,freshness,usable,recentJob,rankJobs,roleForJob,jobSeniority,seniorityFit,liveBand,bestFit,summary,providerSearch,salaryMid});
})(window);
