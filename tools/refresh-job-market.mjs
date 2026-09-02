import fs from 'node:fs';
import path from 'node:path';

const appId=process.env.ADZUNA_APP_ID||'';
const appKey=process.env.ADZUNA_APP_KEY||'';
const location=(process.env.JOB_MARKET_LOCATION||'').trim();
const outPath=path.resolve('data/job-market.json');
const now=new Date();

// Covers every explicit role-path family used by the tracker. Adzuna queries rotate
// to stay API-efficient; Arbeitnow UK supplies a no-key live baseline every run.
const QUERIES=[
  'systems support engineer','physical security systems engineer','physical security solutions engineer','milestone xprotect','axis communications',
  'network engineer','network security engineer','cyber security engineer','SOC analyst','cloud SOC analyst','detection engineer','incident response analyst','threat intelligence analyst','malware analyst','red team operator','penetration tester',
  'cloud security engineer','cloud solutions engineer','cloud solutions architect','identity security engineer','cloud data security engineer','kubernetes security engineer','application security engineer','DevSecOps engineer','security platform engineer','AI security engineer','privacy engineer',
  'OT security engineer','ICS security engineer','critical infrastructure cyber security','smart building security','IoT security engineer','convergence security engineer','security consultant','GRC analyst','cyber risk analyst','crisis resilience manager','insider threat analyst',
  'solutions architect','security architect','technical account manager cyber security','security product manager','financial services security engineer','cleared cyber security engineer','cyber due diligence','embedded systems security engineer','cyber security contractor','security solutions engineer'
];

function existing(){try{return JSON.parse(fs.readFileSync(outPath,'utf8'));}catch{return {schemaVersion:1,jobs:[]};}}
function cleanText(value=''){return String(value).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();}
function normaliseAdzuna(job,query){return {
  id:`adzuna:${String(job.id||job.redirect_url||`${query}-${job.title}-${job.company?.display_name||''}`)}`,
  source:'Adzuna',title:cleanText(job.title),company:cleanText(job.company?.display_name||''),location:cleanText(job.location?.display_name||''),
  created:job.created||null,salaryMin:Number(job.salary_min)||null,salaryMax:Number(job.salary_max)||null,
  description:cleanText(job.description||'').slice(0,1800),url:String(job.redirect_url||''),category:cleanText(job.category?.label||''),query
};}
function normaliseArbeitnow(job){return {
  id:`arbeitnow:${String(job.slug||job.url||`${job.title}-${job.company_name||''}`)}`,
  source:'Arbeitnow UK',title:cleanText(job.title),company:cleanText(job.company_name||''),location:cleanText(job.location||''),
  created:job.created_at||job.created||null,salaryMin:null,salaryMax:null,
  description:cleanText(job.description||'').slice(0,1800),url:String(job.url||''),category:cleanText([...(job.tags||[]),...(job.job_types||[])].join(' · ')),query:cleanText(job.title||'')
};}
function freshEnough(job){if(!job?.created)return true;const t=new Date(job.created).getTime();return Number.isFinite(t)&&(Date.now()-t)<=14*86400000;}
function dedupe(rows){const map=new Map();for(const row of rows){const key=row.id||row.url;if(!key)continue;const prior=map.get(key);if(!prior||String(row.created||'')>String(prior.created||''))map.set(key,row);}return [...map.values()];}
async function fetchJson(url,headers={}){const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Cert-Tracker-Market-Pulse/1.1',...headers}});if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json();}

const fetched=[];
const providerStatus=[];

// Immediate live UK feed with no credentials required. Two pages keeps the request
// footprint small while providing enough breadth for local best-fit matching.
try{
  for(let page=1;page<=2;page++){
    const data=await fetchJson(`https://www.arbeitnow.co.uk/api/job-board-api?page=${page}`);
    for(const job of data.data||[])fetched.push(normaliseArbeitnow(job));
  }
  providerStatus.push('Arbeitnow UK live');
}catch(error){console.warn(`Arbeitnow UK: ${error.message}`);providerStatus.push('Arbeitnow UK unavailable');}

// Optional broader aggregator. Secrets are server-side GitHub Actions secrets only.
// Eight rotating buckets means a five-minute workflow target covers the full query
// catalogue in about forty minutes without exposing API credentials to browsers.
const bucket=Math.floor(now.getTime()/300000)%8;
const batch=QUERIES.filter((_,index)=>index%8===bucket);
if(appId&&appKey){
  for(const query of batch){
    try{
      const params=new URLSearchParams({app_id:appId,app_key:appKey,results_per_page:'10',what:query,'content-type':'application/json',sort_by:'date'});
      if(location)params.set('where',location);
      const data=await fetchJson(`https://api.adzuna.com/v1/api/jobs/gb/search/1?${params}`);
      for(const job of data.results||[])fetched.push(normaliseAdzuna(job,query));
      await new Promise(resolve=>setTimeout(resolve,160));
    }catch(error){console.warn(`Adzuna ${query}: ${error.message}`);}
  }
  providerStatus.push('Adzuna live');
}else providerStatus.push('Adzuna credentials not configured');

const before=existing();
const jobs=dedupe([...(before.jobs||[]).filter(freshEnough),...fetched]).filter(freshEnough).sort((a,b)=>String(b.created||'').localeCompare(String(a.created||''))).slice(0,500);
const liveProviders=[...new Set(jobs.map(j=>j.source).filter(Boolean))];
const feed={
  schemaVersion:2,provider:liveProviders.join(' + ')||'UK market feed',providerUrl:'https://www.arbeitnow.co.uk/',country:'gb',fetchedAt:now.toISOString(),refreshTargetMinutes:5,status:jobs.length?'live':'degraded',
  location:location||'United Kingdom',queries:QUERIES,lastBatch:batch,providerStatus,jobs
};
fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(feed,null,2)+'\n');
console.log(`Job market refreshed: ${fetched.length} fetched this run; ${jobs.length} current listings retained. Providers: ${providerStatus.join(' | ')}`);
