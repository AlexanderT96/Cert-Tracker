import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const errors=[];
const read=file=>fs.readFileSync(file,'utf8');
for(const file of ['src/role-readiness-rank.js','src/role-readiness-ui.js']){
  if(!fs.existsSync(file)){errors.push(`Missing ${file}`);continue;}
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});}catch(error){errors.push(`${file}: syntax check failed: ${error.stderr?.toString()||error.message}`);}
}
const rank=read('src/role-readiness-rank.js'),ui=read('src/role-readiness-ui.js'),dual=read('src/dual-pillar-ui.js'),index=read('index.html'),sw=read('sw.js');
for(let i=1;i<=6;i++)if(!rank.includes(`label:'Level ${i}'`))errors.push(`Role ladder missing neutral Level ${i} label.`);
for(const key of ['R1','R2','R3','R4','R5','R6'])if(!rank.includes(`${key}:Object.freeze`))errors.push(`Role ladder missing ${key}.`);
for(const marker of ['minFloor','minPractical','minUsed','minDesigned','minOwned','minLeadership','evidenceStats','leadershipScore','gapsFor','rankForRole','forPathway','forFilter','active','byArchetype'])if(!rank.includes(marker))errors.push(`Role readiness model missing ${marker}.`);
if(!rank.includes("R5:Object.freeze({key:'R5'")||!rank.includes('minDesigned:3'))errors.push('R5 is not explicitly design-evidence gated.');
if(!rank.includes("R6:Object.freeze({key:'R6'")||!rank.includes('minOwned:3')||!rank.includes('minLeadership:80'))errors.push('R6 is not explicitly ownership/leadership gated.');
if(!rank.includes('floor*.55')||!rank.includes('role?.score')||!rank.includes('evidence.practical'))errors.push('Role level no longer combines dual-pillar floor with practical evidence.');
const archetypes=['physicalSecurity','cloudEngineering','securityOperations','offensiveSecurity','governanceRisk','identitySecurity','appPlatformSecurity','otSecurity','architectureConsulting','commercialTechnical','leadershipProduct','resilienceInvestigation'];
for(const archetype of archetypes){if(!rank.includes(`${archetype}:Object.freeze`))errors.push(`Role title ladder missing ${archetype}.`);}
for(const marker of ['ROLE READINESS','R1','R6','current','Next:'])if(!(`${ui}\n${dual}`).includes(marker))errors.push(`Role-readiness UI missing ${marker}.`);
if(/Beginner \/ Training → Intermediate → Senior → Manager \/ Team Leader → Architect → Director/.test(ui))errors.push('UI still exposes the illustrative global career-label ladder instead of neutral R1-R6 levels.');
if(!ui.includes('Six neutral evidence-gated levels (R1–R6)'))errors.push('Career UI does not explain the neutral readiness-level model.');
if(!index.includes('src/role-readiness-rank.js')||!index.includes('src/role-readiness-ui.js'))errors.push('Production page does not load both role-readiness layers.');
if(index.indexOf('src/role-readiness-rank.js')<index.indexOf('src/market-readiness.js'))errors.push('Role readiness loads before market-readiness dependency.');
if(index.indexOf('src/role-readiness-ui.js')<index.indexOf('src/market-dashboard-ui.js'))errors.push('Role-readiness UI loads before dashboard market surface.');
if(!sw.includes('src/role-readiness-rank.js')||!sw.includes('src/role-readiness-ui.js'))errors.push('Service worker does not cache role-readiness layers.');
if(errors.length){console.error(`Role readiness gate failed (${errors.length}):`);errors.forEach(error=>console.error(`- ${error}`));process.exit(1);}
console.log('Role readiness gate passed: six neutral evidence-gated levels, domain-specific titles, dual-pillar floor and mobile/desktop UI coverage enforced.');
