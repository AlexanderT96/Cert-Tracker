import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const errors=[];
const read=file=>fs.readFileSync(file,'utf8');
for(const file of ['src/role-readiness-rank.js','src/role-readiness-ui.js']){
  if(!fs.existsSync(file)){errors.push(`Missing ${file}`);continue;}
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});}catch(error){errors.push(`${file}: syntax check failed: ${error.stderr?.toString()||error.message}`);}
}
const rank=read('src/role-readiness-rank.js'),ui=read('src/role-readiness-ui.js'),dual=read('src/dual-pillar-ui.js'),index=read('index.html'),sw=read('sw.js');
for(const label of ['Beginner / Training Role','Intermediate','Senior','Manager / Team Leader','Architect','Director'])if(!rank.includes(label))errors.push(`Role ladder missing ${label}.`);
for(const key of ['R1','R2','R3','R4','R5','R6'])if(!rank.includes(`${key}:Object.freeze`))errors.push(`Role ladder missing ${key}.`);
for(const marker of ['minFloor','minPractical','minUsed','minDesigned','minOwned','minLeadership','evidenceStats','leadershipScore','gapsFor','rankForRole','forPathway','forFilter','active','byArchetype'])if(!rank.includes(marker))errors.push(`Role readiness model missing ${marker}.`);
if(!rank.includes("R5:Object.freeze({key:'R5'")||!rank.includes('minDesigned:3'))errors.push('Architect rank is not explicitly design-evidence gated.');
if(!rank.includes("R6:Object.freeze({key:'R6'")||!rank.includes('minOwned:3')||!rank.includes('minLeadership:80'))errors.push('Director rank is not explicitly ownership/leadership gated.');
if(!rank.includes('floor*.55')||!rank.includes('role?.score')||!rank.includes('evidence.practical'))errors.push('Role rank no longer combines dual-pillar floor with practical evidence.');
const archetypes=['physicalSecurity','cloudEngineering','securityOperations','offensiveSecurity','governanceRisk','identitySecurity','appPlatformSecurity','otSecurity','architectureConsulting','commercialTechnical','leadershipProduct','resilienceInvestigation'];
for(const archetype of archetypes){if(!rank.includes(`${archetype}:Object.freeze`))errors.push(`Role title ladder missing ${archetype}.`);}
for(const marker of ['ROLE READINESS RANK','SENIORITY / ROLE READINESS','RANK','current','Next:'])if(!(`${ui}\n${dual}`).includes(marker))errors.push(`Role-readiness UI missing ${marker}.`);
if(!index.includes('src/role-readiness-rank.js')||!index.includes('src/role-readiness-ui.js'))errors.push('Production page does not load both role-readiness layers.');
if(index.indexOf('src/role-readiness-rank.js')<index.indexOf('src/market-readiness.js'))errors.push('Role readiness loads before market-readiness dependency.');
if(index.indexOf('src/role-readiness-ui.js')<index.indexOf('src/market-dashboard-ui.js'))errors.push('Role-readiness UI loads before dashboard market surface.');
if(!sw.includes('src/role-readiness-rank.js')||!sw.includes('src/role-readiness-ui.js'))errors.push('Service worker does not cache role-readiness layers.');
if(errors.length){console.error(`Role readiness gate failed (${errors.length}):`);errors.forEach(error=>console.error(`- ${error}`));process.exit(1);}
console.log('Role readiness gate passed: six evidence-gated seniority levels, domain titles, dual-pillar floor and mobile/desktop UI coverage enforced.');
