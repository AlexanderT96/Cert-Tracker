import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const state={customization:{},passes:{},capabilityEvidence:{}},CT={careerFramework:{context:()=>({current:'test'}),ROLE_PROFILES:{test:{label:'Test background',weights:{networking:1}}}},events:{emit(){}}};
let saves=0;
const catalogue={};vm.createContext(catalogue);vm.runInContext(['certs.js','src/cert-extensions.js','src/catalogue-currentness.js','src/catalogue-policy-normalize.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+'\nglobalThis.catalogue=CERTS;',catalogue);
const sandbox={CertTrackerV3:CT,state,save:{customization(){saves++;}},CERTS:catalogue.catalogue,console};sandbox.window=sandbox;
vm.runInNewContext(fs.readFileSync('src/career-options.js','utf8'),sandbox);
const m=CT.careerOptions;
assert.equal(Object.keys(m.FAMILIES).length,14);
assert.ok(m.ROLES.length>=65);
assert.equal(new Set(m.ROLES.map(r=>r.id)).size,m.ROLES.length);
for(const r of m.ROLES){assert.ok(m.FAMILIES[r.family]);assert.ok(!m.CONTEXTS[r.id]);assert.equal(m.requirements(r).length,4);assert.equal(m.assess(r).readiness,null);}
for(const r of m.ROLES)for(const id of r.certs)assert.ok(sandbox.CERTS.some(c=>c.id===id),`${r.id}: unknown credential ${id}`);
const pathwayAudit=m.pathwayAudit();
assert.equal(pathwayAudit.roles,m.ROLES.length);
assert.equal(pathwayAudit.stages,5);
assert.equal(pathwayAudit.complete,true,`Incomplete career pathways: ${pathwayAudit.missing.join(', ')}`);
assert.ok(pathwayAudit.minCertifications>=10,`Sparse career pathway detected: minimum route has ${pathwayAudit.minCertifications} certifications`);
for(const role of m.ROLES){
  const pathway=m.pathway(role);
  assert.equal(pathway.stages.length,5,`${role.id}: expected entry through endgame stages`);
  assert.equal(new Set(pathway.certIds).size,pathway.certIds.length,`${role.id}: duplicate pathway credential`);
  for(const stage of pathway.stages){
    assert.ok(stage.certIds.length,`${role.id}: ${stage.key} has no certification`);
    assert.ok(stage.plan?.objective&&stage.plan?.practice&&stage.plan?.evidence&&stage.plan?.exit,`${role.id}: ${stage.key} has no attached plan`);
    for(const id of stage.certIds)assert.ok(sandbox.CERTS.some(c=>c.id===id),`${role.id}: pathway references unknown credential ${id}`);
  }
}
const r=m.ROLES[0],a=m.assess(r);m.update({interests:{[r.id]:100}});assert.equal(m.assess(r).readiness,null);assert.equal(m.assess(r).provisional,false);assert.equal(saves,1);
const evidence=Object.fromEntries(m.requirements(r).map(q=>[q.id,q.target]));m.update({evidence});assert.equal(m.assess(r).readiness,100);assert.equal(m.assess(r).compatibility,m.assess(r,{interests:{[r.id]:100}}).compatibility);
assert.equal(m.assess(r,{evidence:Object.fromEntries(m.requirements(r).map(q=>[q.id,'NONE']))}).readiness,0);
const now=Date.now(),feed={status:'live',fetchedAt:new Date(now).toISOString(),jobs:[{id:'a',title:r.title,created:new Date(now).toISOString()}]};
assert.equal(m.market(r,feed,now).count,1);assert.equal(m.market(r,{...feed,status:'degraded'},now).count,null);assert.equal(m.market(r,feed,now+3600000).count,null);assert.equal(m.market(r,{...feed,jobs:[]},now).count,0);assert.equal(m.market(r,{...feed,jobs:[...feed.jobs,...feed.jobs]},now).count,1);
m.update({shortlist:{[r.id]:true}});assert.equal(m.options({shortlist:true}).length,1);
assert.equal(m.options({search:r.title}).some(x=>x.role.id===r.id),true);
const index=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');for(const path of ['src/career-options.js','src/career-options-ui.js','career-options.css']){assert.ok(index.includes(path));assert.ok(sw.includes(path));}
console.log(`Career options passed: ${m.ROLES.length} roles, 14 families, independent scores, unknown vs zero evidence, persisted preferences and honest stale/degraded market handling.`);
