// Cert Tracker — filter-wide dual-pillar ordering and recommendation intelligence.
// Every pathway/filter uses the same market-access + job-performance-capability model.
(function initFilterIntelligence(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.recommendations||!CT?.careerFramework||typeof global.getFilterDefs!=='function')return;

  const timingRank={DONE:0,T0:1,T1:2,T2:3,T3:4};
  const originalGetFilterDefs=global.getFilterDefs;

  function cleanLabel(value){return String(value||'').replace(/[^A-Za-z0-9/&+ -]+/g,' ').replace(/\s+/g,' ').trim();}
  function goalForFilter(id,label=''){
    const text=`${id||''} ${cleanLabel(label)}`.toLowerCase();
    if(/\b(ot|ics|cni|industrial|convergence|smart building|smartbuilding)\b/.test(text))return'convergence';
    if(/\bcloud\b|\bdevsecops\b|\bkubernetes\b|\biam\b|\bidentity\b/.test(text))return'cloud';
    if(/\bphysical\b|\bvms\b|\baccess\b/.test(text))return'physical';
    if(/\bnetwork\b|\bfirewall\b/.test(text))return'network';
    if(/\bcyber\b|\bsoc\b|\bdetection\b|\bpentest\b|\boffensive\b|\bgrc\b|\bappsec\b|\bir\b|\bforensic\b|\bthreat\b/.test(text))return'cyber';
    return CT.recommendations.currentGoal?.()||'convergence';
  }
  function activeFilterMeta(){
    const defs=global.getFilterDefs(),all=[...(defs.filters||[]),...Object.values(defs.filterGroups||{}).flatMap(group=>group.chips||[])];
    const hit=all.find(item=>item.id===(state.filter||'all'));
    return {id:hit?.id||state.filter||'all',label:cleanLabel(hit?.label||'All')};
  }
  function learningRank(cert,{filterId=null,label='',passes=state.passes,horizon='now'}={}){
    const meta=filterId?{id:filterId,label}:{...activeFilterMeta()};
    const goal=goalForFilter(meta.id,meta.label);
    const item=CT.recommendations.score(cert,{goal,passes,horizon});
    // Neutralise the personal My Path bonus/penalty while ranking an explicit alternate filter.
    // The filter itself is the temporary decision scope; saved My Path must not distort it.
    const pathBias=Number(item.breakdown?.path||0);
    const dataConfidence=Number(item.health?.confidence??70);
    const freshnessPenalty=item.health?.freshness==='STALE'?-18:item.health?.freshness==='UNKNOWN'?-10:item.health?.freshness==='REVIEW'?-5:0;
    const sourcePenalty=item.health?.sourceLevel==='NONE'?-8:item.health?.sourceLevel==='VENDOR'?-2:0;
    const weakerPillar=Number(item.tandem?.weaker??Math.min(Number(item.career?.M||0),Number(item.career?.K||0)));
    const tandemBonus=Math.round(weakerPillar*2);
    const score=Math.round(item.score-pathBias+freshnessPenalty+sourcePenalty+tandemBonus);
    return Object.freeze({...item,filterGoal:goal,filterScore:score,dataConfidence});
  }
  function compareRank(a,b){
    if(a.available!==b.available)return a.available?-1:1;
    if(a.filterScore!==b.filterScore)return b.filterScore-a.filterScore;
    const aw=Number(a.tandem?.weaker||0),bw=Number(b.tandem?.weaker||0);if(aw!==bw)return bw-aw;
    const as=Number(a.tandem?.strength||0),bs=Number(b.tandem?.strength||0);if(as!==bs)return bs-as;
    const at=timingRank[a.career.T]??9,bt=timingRank[b.career.T]??9;if(at!==bt)return at-bt;
    if(a.career.N!==b.career.N)return b.career.N-a.career.N;
    if(a.career.E!==b.career.E)return b.career.E-a.career.E;
    return a.estimatedHours-b.estimatedHours||a.name.localeCompare(b.name);
  }
  function rankRows(certs,options={}){return certs.map(cert=>learningRank(cert,options)).sort(compareRank);}

  function nextFor(test,options={}){
    let candidates=CERTS.filter(cert=>!state.passes?.[cert.id]&&!state.skipped?.[cert.id]);
    if(typeof test==='function')candidates=candidates.filter(cert=>{try{return !!test(cert);}catch{return false;}});
    if(!candidates.length)return null;
    const meta=options.filterId?{id:options.filterId,label:options.label||''}:activeFilterMeta();
    const ranked=rankRows(candidates,{...options,filterId:meta.id,label:meta.label});
    const available=ranked.filter(item=>item.available&&!item.cert.pending);
    return (available[0]||ranked.find(item=>item.available)||ranked[0]||null)?.cert||null;
  }

  // Function name retained for compatibility with existing callers; semantics are now
  // dual-pillar and filter-aware rather than legacy ROI/hour or knowledge-only ordering.
  function orderPhaseLearningFirst(certs){
    const rows=Array.isArray(certs)?certs.slice():[];if(rows.length<2)return rows;
    const meta=activeFilterMeta(),idSet=new Set(rows.map(cert=>cert.id)),remaining=new Map(),dependents=new Map();
    rows.forEach(cert=>{remaining.set(cert.id,(cert.deps||[]).filter(id=>idSet.has(id)).length);dependents.set(cert.id,[]);});
    rows.forEach(cert=>(cert.deps||[]).forEach(id=>{if(idSet.has(id))dependents.get(id)?.push(cert.id);}));
    const rankMap=new Map(rankRows(rows,{filterId:meta.id,label:meta.label}).map((item,index)=>[item.id,{item,index}]));
    const compare=(a,b)=>{
      const ap=!!state.passes?.[a.id],bp=!!state.passes?.[b.id];if(ap!==bp)return ap?1:-1;
      const ax=rankMap.get(a.id)?.item,bx=rankMap.get(b.id)?.item;
      if(a.pending!==b.pending)return a.pending?1:-1;
      if(a.applicationBased!==b.applicationBased)return a.applicationBased?1:-1;
      if(ax&&bx)return compareRank(ax,bx);
      return (rankMap.get(a.id)?.index??9999)-(rankMap.get(b.id)?.index??9999);
    };
    const result=[],byId=new Map(rows.map(cert=>[cert.id,cert]));let ready=rows.filter(cert=>remaining.get(cert.id)===0).sort(compare);
    while(ready.length){const cert=ready.shift();result.push(cert);for(const id of dependents.get(cert.id)||[]){const count=(remaining.get(id)||0)-1;remaining.set(id,count);if(count===0){const child=byId.get(id);if(child){ready.push(child);ready.sort(compare);}}}}
    if(result.length<rows.length){const present=new Set(result.map(cert=>cert.id));result.push(...rows.filter(cert=>!present.has(cert.id)).sort(compare));}
    return result;
  }

  function augmentFilterDefinitions(defs){
    const seen=new Set();
    for(const item of [...(defs.filters||[]),...Object.values(defs.filterGroups||{}).flatMap(group=>group.chips||[])]){
      if(!item?.id||seen.has(item.id))continue;seen.add(item.id);
      const original=item.test,label=cleanLabel(item.label);
      if(typeof original==='function'&&/OT|ICS|CNI|Smart Building/i.test(label)){
        item.test=cert=>cert?.id==='fortinet-ot-security'||original(cert);
      }
    }
    return defs;
  }
  global.getFilterDefs=function(){return augmentFilterDefinitions(originalGetFilterDefs());};

  // Replace legacy ROI/hour sorters. Existing UI code keeps calling the same functions,
  // but their semantics now reward balanced market access and real capability.
  global.nextCoreCert=function(filterTest){return nextFor(filterTest);};
  global.orderPhaseCerts=orderPhaseLearningFirst;

  // Keep role coverage as a market-facing signal, but choose each role's suggested next cert
  // using the same dual-pillar engine rather than raw cvValue.
  if(typeof global.roleMatches==='function'){
    global.roleMatches=function(){
      const {filterGroups}=global.getFilterDefs(),P=typeof global.effPasses==='function'?global.effPasses():state.passes;
      const chips=Object.entries(filterGroups||{}).flatMap(([gid,group])=>(group.chips||[]).map(ch=>({ch,gid}))).filter(x=>x.ch.id.startsWith('pv-')&&typeof x.ch.test==='function');
      return chips.map(({ch,gid})=>{
        let members=[];try{members=CERTS.filter(ch.test);}catch{}
        const totalWeight=members.reduce((sum,cert)=>sum+Math.max(1,Number(cert.cvValue||0)),0),done=members.filter(cert=>P?.[cert.id]),doneWeight=done.reduce((sum,cert)=>sum+Math.max(1,Number(cert.cvValue||0)),0);
        const coverage=totalWeight?doneWeight/totalWeight:0;
        const next=nextFor(ch.test,{filterId:ch.id,label:ch.label,passes:P});
        const goal=typeof global.goalFor==='function'?global.goalFor(ch.id):{band:''};
        const track=gid==='cloud'?'A':gid==='physical'?'B':gid==='cyber'?'C':'';
        const exp=track?(state.expLog||[]).filter(entry=>entry.g===track).length:0;
        return {id:ch.id,label:cleanLabel(ch.label),cov:coverage,done:done.length,total:members.length,band:goal.band||'',next,exp};
      }).filter(row=>row.total>=4).sort((a,b)=>b.cov-a.cov||b.done-a.done||a.label.localeCompare(b.label));
    };
  }

  function audit(){
    const defs=global.getFilterDefs(),items=[...(defs.filters||[]),...Object.values(defs.filterGroups||{}).flatMap(group=>group.chips||[])],issues=[],ids=new Set();
    for(const item of items){
      if(!item?.id){issues.push('Filter without id');continue;}if(ids.has(item.id))issues.push(`Duplicate filter id: ${item.id}`);ids.add(item.id);
      if(typeof item.test==='function'){
        let members=[];try{members=CERTS.filter(item.test);}catch(error){issues.push(`${item.id}: filter test failed (${error.message})`);continue;}
        if(!members.length&&item.id!=='passed')issues.push(`${item.id}: resolves to zero certifications`);
        for(const cert of members){const profile=CT.learningResources?.profile?.(cert);if(!profile?.subjects?.length||!profile?.stack?.length)issues.push(`${item.id}: ${cert.id} lacks full learning detail`);}
      }
    }
    return Object.freeze({filters:items.length,certifications:CERTS.length,issues:Object.freeze(issues)});
  }

  CT.filterIntelligence=Object.freeze({goalForFilter,learningRank,rankRows,nextFor,orderPhaseLearningFirst,audit});
})(window);
