import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
const errors=[];
const renderer=read('src/renderer.js');
const depth=read('src/dual-pillar-depth.js');
const ui=read('src/dual-pillar-ui.js');
const recommendation=read('src/recommendation-engine.js');
const planner=read('src/planner.js');
const learning=read('src/learning-path-ui.js');
const filter=read('src/filter-intelligence.js');
const index=read('index.html');

const pvIds=[...new Set([...renderer.matchAll(/id:\s*'(pv-[^']+)'/g)].map(m=>m[1]))];
const mapped=[...new Set([...depth.matchAll(/'((?:pv-)[^']+)'\s*:\s*\[/g)].map(m=>m[1]))];
for(const id of pvIds)if(!mapped.includes(id))errors.push(`Job pathway ${id} lacks explicit depth mapping.`);
for(const id of mapped)if(!pvIds.includes(id))errors.push(`Depth map contains obsolete/unknown pathway ${id}.`);
if(pvIds.length<30)errors.push(`Only ${pvIds.length} explicit job pathways detected; expected full pathway catalogue.`);

for(const token of ['certProfile(cert)','pathwayProfile(item)','performanceTasks','completionStandard','marketAccess','capability','roleReadinessRule','sequenceRule','explicitJobPathways'])if(!depth.includes(token))errors.push(`Universal depth model missing ${token}.`);
for(const token of ['CAREER + PERFORMANCE INTELLIGENCE','DUAL-PILLAR PATHWAY','Market-access outcome','Job-performance outcome','Evidence before calling the pathway role-ready'])if(!ui.includes(token))errors.push(`Dual-pillar UI missing ${token}.`);
if(!recommendation.includes("weights:{K:.25,M:.25"))errors.push('Recommendation horizons do not keep M and K co-equal.');
if(!recommendation.includes('tandemPoints'))errors.push('Recommendation engine lacks weaker-pillar/balance scoring.');
if(!filter.includes('tandemWeaker')&&!filter.includes('weakerPillar'))errors.push('Filter-wide ordering is not using the dual-pillar floor.');
if(!planner.includes("optimisation:'dual-pillar'"))errors.push('Planner is not marked as dual-pillar.');
if(!planner.includes('tandemWeaker'))errors.push('Planner does not reward the weaker M/K pillar.');
if(!learning.includes('Next certification · dual-pillar'))errors.push('Learning Path still lacks dual-pillar presentation.');
if(!index.includes('src/dual-pillar-depth.js')||!index.includes('src/dual-pillar-ui.js'))errors.push('Dual-pillar layers are not loaded by the production page.');
if(index.indexOf('src/dual-pillar-depth.js')<index.indexOf('src/filter-intelligence.js'))errors.push('Depth model loads before filter intelligence.');
if(index.indexOf('src/dual-pillar-ui.js')<index.indexOf('src/learning-resources-ui.js'))errors.push('Dual-pillar UI loads before certification detail UI.');

const staleCopy=[
  ['src/learning-path-ui.js',learning],
  ['src/planner.js',planner],
  ['src/filter-intelligence.js',filter]
];
for(const [file,text] of staleCopy)if(/Knowledge value is weighted ahead|Knowledge ROI.*ahead|market value is a secondary|curriculum-first|learning-first optimisation/i.test(text))errors.push(`${file} still contains knowledge-first/market-secondary policy language.`);

if(errors.length){console.error(`Dual-pillar depth gate failed (${errors.length}):`);errors.forEach(e=>console.error(`- ${e}`));process.exit(1);}
console.log(`Dual-pillar depth gate passed: ${pvIds.length} explicit job pathways mapped; certification/pathway depth, balanced ordering and UI coverage enforced.`);
