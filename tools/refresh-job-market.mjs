import fs from 'node:fs';
import path from 'node:path';

const appId=process.env.ADZUNA_APP_ID||'';
const appKey=process.env.ADZUNA_APP_KEY||'';
const location=(process.env.JOB_MARKET_LOCATION||'').trim();
const outPath=path.resolve('data/job-market.json');
const now=new Date();

const QUERIES=[
  'systems support engineer','physical security systems engineer','milestone xprotect','axis communications',
  'network engineer','network security engineer','cyber security engineer','SOC analyst',
  'cloud security engineer','identity security engineer','application security engineer','detection engineer',
  'OT security engineer','penetration tester','solutions architect','security architect'
];

function existing(){try{return JSON.parse(fs.readFileSync(outPath,'utf8'));}catch{return {schemaVersion:1,jobs:[]};}}
function cleanText(value=''){return String(value).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
function normalise(job,query){return {
  id:String(job.id||job.redirect_url||`${query}-${job.title}-${job.company?.display_name||''}`),
  title:cleanText(job.title),company:cleanText(job.company?.display_name||''),location:cleanText(job.location?.display_name||''),
  created:job.created||null,salaryMin:Number(job.salary_min)||null,salaryMax:Number(job.salary_max)||null,
  description:cleanText(job.description||'').slice(0,1200),url:String(job.redirect_url||''),category:cleanText(job.category?.label||''),query
};}
function freshEnough(job){if(!job?.created)return true;const t=new Date(job.created).getTime();return Number.isFinite(t)&&(Date.now()-t)<=14*86400000;}
function dedupe(rows){const map=new Map();for(const row of rows){const key=row.id||row.url;if(!key)continue;const prior=map.get(key);if(!prior||String(row.created||'')>String(prior.created||''))map.set(key,row);}return [...map.values()];}

if(!appId||!appKey){console.log('ADZUNA_APP_ID / ADZUNA_APP_KEY are not configured. Keeping existing feed unchanged.');process.exit(0);}

const bucket=Math.floor(now.getUTCMinutes()/15)%4;
const batch=QUERIES.filter((_,index)=>index%4===bucket);
const fetched=[];
for(const query of batch){
  const params=new URLSearchParams({app_id:appId,app_key:appKey,results_per_page:'10',what:query,'content-type':'application/json',sort_by:'date'});
  if(location)params.set('where',location);
  const url=`https://api.adzuna.com/v1/api/jobs/gb/search/1?${params}`;
  const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Cert-Tracker-Market-Pulse/1.0'}});
  if(!response.ok){console.warn(`${query}: HTTP ${response.status}`);continue;}
  const data=await response.json();
  for(const job of data.results||[])fetched.push(normalise(job,query));
  await new Promise(resolve=>setTimeout(resolve,180));
}

const before=existing();
const jobs=dedupe([...(before.jobs||[]).filter(freshEnough),...fetched]).sort((a,b)=>String(b.created||'').localeCompare(String(a.created||''))).slice(0,240);
const feed={
  schemaVersion:1,provider:'Adzuna',providerUrl:'https://www.adzuna.co.uk/',country:'gb',fetchedAt:now.toISOString(),refreshTargetMinutes:15,status:'live',
  location:location||'United Kingdom',queries:QUERIES,lastBatch:batch,jobs
};
fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(feed,null,2)+'\n');
console.log(`Job market refreshed: ${fetched.length} listings fetched in this batch; ${jobs.length} retained.`);
