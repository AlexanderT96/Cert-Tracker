import fs from 'node:fs';
import vm from 'node:vm';

const errors=[];
const read=file=>fs.readFileSync(file,'utf8');
const canonical=read('certs.js'),extensions=read('src/cert-extensions.js'),currentness=read('src/catalogue-currentness.js');
const sandbox={console,Date,Math,JSON,Object,Array,Set,Map,String,Number,Boolean,RegExp,Intl,URL};
vm.createContext(sandbox);
try{vm.runInContext(`${canonical}\n${extensions}\n${currentness}\n;globalThis.__CERTS__=CERTS;`,sandbox,{timeout:5000});}catch(error){errors.push(`Unable to evaluate catalogue: ${error.message}`);}
const certs=sandbox.__CERTS__||[],ids=new Set(certs.map(cert=>cert.id));

// Full-card learning data: every certification must have enough structured source material
// for the universal Learning Intelligence panel, even when exact exam weighting is derived.
for(const cert of certs){
  if(!cert.name)errors.push(`${cert.id}: missing name`);
  if(!cert.coverage)errors.push(`${cert.id}: missing coverage narrative`);
  if(!cert.note)errors.push(`${cert.id}: missing learning/career note`);
  if(!(cert.subjects?.length||cert.skills?.length))errors.push(`${cert.id}: missing subject/skill seed data`);
  if(!cert.projectRec)errors.push(`${cert.id}: missing practical evidence/project recommendation`);
}

const renderer=read('src/renderer.js');
const start=renderer.indexOf('function getFilterDefs()');
const end=renderer.indexOf('function renderDashboard()',start);
if(start<0||end<0)errors.push('Unable to locate getFilterDefs for audit.');
else{
  const filterSource=renderer.slice(start,end),filterIds=[...filterSource.matchAll(/\bid:\s*'([^']+)'/g)].map(match=>match[1]);
  const duplicateFilters=filterIds.filter((id,index)=>filterIds.indexOf(id)!==index);
  if(duplicateFilters.length)errors.push(`Duplicate filter ids: ${[...new Set(duplicateFilters)].join(', ')}`);

  // Validate every explicitly enumerated certification used by any role/filter chip.
  const arrays=[...filterSource.matchAll(/\[((?:\s*'[^']+'\s*,?\s*)+)\]\.includes\(c\.id\)/g)];
  for(const match of arrays){
    const members=[...match[1].matchAll(/'([^']+)'/g)].map(row=>row[1]);
    const duplicates=members.filter((id,index)=>members.indexOf(id)!==index);
    if(duplicates.length)errors.push(`Filter membership contains duplicate ids: ${[...new Set(duplicates)].join(', ')}`);
    for(const id of members)if(!ids.has(id))errors.push(`Filter references missing certification id: ${id}`);
  }
  if(filterIds.length<20)errors.push(`Filter audit found only ${filterIds.length} filters; expected the full role/filter catalogue.`);
}

const recommendation=read('src/recommendation-engine.js'),filterIntelligence=read('src/filter-intelligence.js'),index=read('index.html');
if(!/now:Object\.freeze\(\{label:'Best to learn now',weights:\{K:\.35/.test(recommendation))errors.push('Primary recommendation model no longer leads with Knowledge ROI.');
if(!filterIntelligence.includes('global.nextCoreCert=function'))errors.push('Filter intelligence does not replace legacy next-cert ordering.');
if(!filterIntelligence.includes('global.orderPhaseCerts=orderPhaseLearningFirst'))errors.push('Filter intelligence does not replace legacy ROI/hour phase ordering.');
if(!filterIntelligence.includes('pathBias'))errors.push('Alternate filters are still vulnerable to My Path score bias.');
if(!filterIntelligence.includes("freshnessPenalty"))errors.push('Filter recommendations do not account for stale certification data.');
if(index.indexOf('src/filter-intelligence.js')<index.indexOf('src/recommendation-engine.js'))errors.push('Filter intelligence loads before recommendation engine.');
if(!index.includes('src/catalogue-currentness.js'))errors.push('Current-program catalogue refresh layer is not loaded.');

for(const id of ['nse-4','fcss-secops','fcx','crowdstrike-ccf','fortinet-ot-security'])if(!ids.has(id))errors.push(`Current programme audit missing ${id}.`);
const byId=Object.fromEntries(certs.map(cert=>[cert.id,cert]));
if(byId['fcss-secops']&&!/NSE 7/.test(byId['fcss-secops'].name))errors.push('Retired FCSS label is still active.');
if(byId.fcx&&!/NSE 8/.test(byId.fcx.name))errors.push('Retired FCX label is still active.');
if(byId['crowdstrike-ccf']&&byId['crowdstrike-ccf'].code!=='CCFP')errors.push('CrowdStrike entry credential is not current CCFP.');

if(errors.length){console.error(`Filter/catalogue audit failed (${errors.length}):`);errors.forEach(error=>console.error(`- ${error}`));process.exit(1);}
console.log(`Filter/catalogue audit passed: ${certs.length} certifications, full explicit filter references valid, learning-first ordering enforced.`);
