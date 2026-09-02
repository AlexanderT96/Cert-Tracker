import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const state={customization:{},passes:{},capabilityEvidence:{}},CT={careerFramework:{context:()=>({current:'test'}),ROLE_PROFILES:{test:{label:'Test background',weights:{networking:1}}}},events:{emit(){}}};
let saves=0;
const sandbox={CertTrackerV3:CT,state,save:{customization(){saves++;}},CERTS:[],console};sandbox.window=sandbox;
vm.runInNewContext(fs.readFileSync('src/career-options.js','utf8'),sandbox);
const m=CT.careerOptions;
assert.equal(Object.keys(m.FAMILIES).length,14);
assert.ok(m.ROLES.length>=65);
assert.equal(new Set(m.ROLES.map(r=>r.id)).size,m.ROLES.length);
for(const r of m.ROLES){assert.ok(m.FAMILIES[r.family]);assert.ok(!m.CONTEXTS[r.id]);assert.equal(m.requirements(r).length,4);assert.equal(m.assess(r).readiness,null);}
const r=m.ROLES[0],a=m.assess(r);m.update({interests:{[r.id]:100}});assert.equal(m.assess(r).readiness,null);assert.equal(m.assess(r).provisional,false);assert.equal(saves,1);
const evidence=Object.fromEntries(m.requirements(r).map(q=>[q.id,q.target]));m.update({evidence});assert.equal(m.assess(r).readiness,100);assert.equal(m.assess(r).compatibility,m.assess(r,{interests:{[r.id]:100}}).compatibility);
assert.equal(m.assess(r,{evidence:Object.fromEntries(m.requirements(r).map(q=>[q.id,'NONE']))}).readiness,0);
const now=Date.now(),feed={status:'live',fetchedAt:new Date(now).toISOString(),jobs:[{id:'a',title:r.title,created:new Date(now).toISOString()}]};
assert.equal(m.market(r,feed,now).count,1);assert.equal(m.market(r,{...feed,status:'degraded'},now).count,null);assert.equal(m.market(r,feed,now+3600000).count,null);assert.equal(m.market(r,{...feed,jobs:[]},now).count,0);assert.equal(m.market(r,{...feed,jobs:[...feed.jobs,...feed.jobs]},now).count,1);
m.update({shortlist:{[r.id]:true}});assert.equal(m.options({shortlist:true}).length,1);
assert.equal(m.options({search:r.title}).some(x=>x.role.id===r.id),true);
const index=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');for(const path of ['src/career-options.js','src/career-options-ui.js','career-options.css']){assert.ok(index.includes(path));assert.ok(sw.includes(path));}
console.log(`Career options passed: ${m.ROLES.length} roles, 14 families, independent scores, unknown vs zero evidence, persisted preferences and honest stale/degraded market handling.`);
