// Cert Tracker — current UK market-value and realistic-role assessment.
// Personal progress stays in browser state. No user-specific state is sent to market providers.
(function initMarketReadiness(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.dualPillarDepth||!CT?.careerFramework||!CT?.capabilityGates||!CT?.store)return;

  const SNAPSHOT=Object.freeze({
    asOf:'2026-09-02',currency:'GBP',geography:'UK',
    methodology:'Credential/evidence-based application estimate, not a salary guarantee. Passed certifications, recorded objective progress, practical evidence and role-pathway fit are scored separately; the weaker market/capability pillar constrains readiness.'
  });

  const BASE_MARKETS=Object.freeze({
    physicalSecurity:{low:32000,median:45000,high:62000,confidence:'LOW',query:'physical security systems engineer'},
    cloudEngineering:{low:50000,median:70000,high:95000,confidence:'MEDIUM',query:'cloud security engineer'},
    securityOperations:{low:37500,median:50000,high:64000,confidence:'HIGH',query:'SOC analyst'},
    offensiveSecurity:{low:40000,median:60000,high:85000,confidence:'MEDIUM',query:'penetration tester'},
    governanceRisk:{low:42000,median:62000,high:90000,confidence:'MEDIUM',query:'cyber security risk analyst'},
    identitySecurity:{low:50000,median:70000,high:95000,confidence:'MEDIUM',query:'identity security engineer'},
    appPlatformSecurity:{low:55000,median:75000,high:100000,confidence:'MEDIUM',query:'application security engineer'},
    otSecurity:{low:52000,median:75000,high:105000,confidence:'LOW',query:'OT security engineer'},
    architectureConsulting:{low:60000,median:85000,high:105000,confidence:'HIGH',query:'solutions architect'},
    commercialTechnical:{low:48000,median:70000,high:95000,confidence:'LOW',query:'security solutions engineer'},
    leadershipProduct:{low:60000,median:85000,high:115000,confidence:'LOW',query:'security product manager'},
    resilienceInvestigation:{low:45000,median:65000,high:90000,confidence:'MEDIUM',query:'cyber incident response manager'}
  });

  const PATHWAY_MARKETS=Object.freeze({
    'pv-b-se':{low:38000,median:50000,high:65000,confidence:'LOW',query:'physical security systems engineer'},
    'pv-b-otics':{low:52000,median:75000,high:105000,confidence:'LOW',query:'OT security engineer'},
    'pv-b-cpsoc':{low:40000,median:55000,high:75000,confidence:'LOW',query:'SOC analyst OT security'},
    'pv-b-cni':{low:60000,median:85000,high:115000,confidence:'LOW',query:'critical infrastructure cyber security'},
    'pv-a-cloudsoc':{low:40000,median:55000,high:75000,confidence:'MEDIUM',query:'cloud SOC analyst'},
    'pv-a-ai':{low:60000,median:85000,high:115000,confidence:'LOW',query:'AI security engineer'},
    'pv-a-iam':{low:50000,median:70000,high:95000,confidence:'MEDIUM',query:'identity security engineer'},
    'pv-a-k8s':{low:60000,median:80000,high:105000,confidence:'MEDIUM',query:'kubernetes security engineer'},
    'pv-a-ir':{low:45000,median:65000,high:90000,confidence:'MEDIUM',query:'cloud incident response'},
    'pv-c-detection':{low:45000,median:65000,high:90000,confidence:'MEDIUM',query:'detection engineer'},
    'pv-c-offensive':{low:40000,median:60000,high:85000,confidence:'MEDIUM',query:'penetration tester'},
    'pv-c-appsec':{low:55000,median:75000,high:100000,confidence:'MEDIUM',query:'application security engineer'},
    'pv-c-ir':{low:45000,median:65000,high:90000,confidence:'MEDIUM',query:'incident response analyst'},
    'pv-c-malware':{low:50000,median:70000,high:95000,confidence:'LOW',query:'malware analyst reverse engineer'},
    'pv-c-redteam':{low:55000,median:75000,high:105000,confidence:'MEDIUM',query:'red team operator'},
    'pv-top-tam':{low:50000,median:70000,high:95000,confidence:'LOW',query:'technical account manager cyber security'},
    'pv-top-platform':{low:60000,median:80000,high:105000,confidence:'MEDIUM',query:'security platform engineer'},
    'pv-top-finsec':{low:60000,median:80000,high:110000,confidence:'LOW',query:'financial services security engineer'},
    'pv-top-cleared':{low:55000,median:75000,high:100000,confidence:'LOW',query:'cleared cyber security engineer'},
    'pv-top-ma':{low:65000,median:90000,high:120000,confidence:'LOW',query:'cyber security due diligence'},
    'pv-top-csa':{low:65000,median:85000,high:105000,confidence:'HIGH',query:'cloud solutions architect'},
    'pv-top-embed':{low:55000,median:75000,high:105000,confidence:'LOW',query:'embedded systems security engineer'},
    'pv-top-contractor':{low:70000,median:95000,high:130000,confidence:'LOW',query:'cyber security contractor'}
  });

  const BASELINE_ROLES=Object.freeze([
    {id:'baseline-systems-support',label:'Systems Support Engineer',archetype:'physicalSecurity',market:{low:30000,median:45000,high:60000,confidence:'HIGH',query:'systems support engineer'},roleKey:'generalIT'},
    {id:'baseline-physical-support',label:'Physical Security Systems Support',archetype:'physicalSecurity',market:{low:32000,median:45000,high:58000,confidence:'LOW',query:'physical security systems support'},roleKey:'physicalSupport'},
    {id:'baseline-network-engineer',label:'Network Engineer',archetype:'cloudEngineering',market:{low:37500,median:60000,high:80000,confidence:'HIGH',query:'network engineer'},roleKey:'network'},
    {id:'baseline-network-security',label:'Network Security Engineer',archetype:'cloudEngineering',market:{low:50000,median:67500,high:90000,confidence:'HIGH',query:'network security engineer'},roleKey:'networkSecurity'},
    {id:'baseline-cyber-engineer',label:'Cyber Security Engineer',archetype:'securityOperations',market:{low:50000,median:65000,high:90000,confidence:'HIGH',query:'cyber security engineer'},roleKey:'cyber'},
    {id:'baseline-soc',label:'SOC Analyst',archetype:'securityOperations',market:{low:37500,median:50000,high:64000,confidence:'HIGH',query:'SOC analyst'},roleKey:'cyber'},
    {id:'baseline-cloud-security',label:'Cloud Security Engineer',archetype:'cloudEngineering',market:{low:60000,median:77500,high:95000,confidence:'HIGH',query:'cloud security engineer'},roleKey:'cloudArchitect'},
    {id:'baseline-solutions-architect',label:'Solutions Architect',archetype:'architectureConsulting',market:{low:65000,median:85000,high:100000,confidence:'HIGH',query:'solutions architect'},roleKey:'solutionsArchitect'},
    {id:'baseline-security-architect',label:'Security Architect',archetype:'architectureConsulting',market:{low:69750,median:85000,high:100000,confidence:'HIGH',query:'security architect'},roleKey:'securityArchitect'}
  ].map(Object.freeze));

  const PILLAR_BY_ARCHETYPE=Object.freeze({
    physicalSecurity:['physicalSecurity','enterpriseNetworking','enterpriseInfrastructure'],
    cloudEngineering:['cloudIdentity','enterpriseNetworking','enterpriseInfrastructure','automationSoftware'],
    securityOperations:['networkSecurity','enterpriseNetworking','offensiveUnderstanding'],
    offensiveSecurity:['offensiveUnderstanding','networkSecurity','enterpriseNetworking'],
    governanceRisk:['architectureCommercial','networkSecurity'],
    identitySecurity:['cloudIdentity','networkSecurity'],
    appPlatformSecurity:['automationSoftware','cloudIdentity','networkSecurity'],
    otSecurity:['otCybersecurity','otEngineering','enterpriseNetworking','networkSecurity'],
    architectureConsulting:['architectureCommercial','enterpriseNetworking','networkSecurity','cloudIdentity'],
    commercialTechnical:['architectureCommercial','networkSecurity','cloudIdentity'],
    leadershipProduct:['architectureCommercial','aiSystems','networkSecurity'],
    resilienceInvestigation:['networkSecurity','architectureCommercial','enterpriseInfrastructure']
  });

  function clamp(v,min=0,max=100){return Math.min(max,Math.max(min,Number(v)||0));}
  function avg(rows){return rows.length?rows.reduce((a,b)=>a+Number(b||0),0)/rows.length:0;}
  function progress(cert){if(state.passes?.[cert.id])return 1;const objective=clamp(CT.store.objective?.(cert.id)||0)/100;return objective;}
  function certContribution(cert,pillar){const card=CT.careerFramework.scoreCard(cert),p=progress(cert);return (pillar==='market'?card.M:card.K)*p;}
  function pathwayCertScore(path,pillar){const certs=path.members.map(id=>CERTS.find(c=>c.id===id)).filter(Boolean),weight=certs.reduce((sum,c)=>sum+Math.max(1,pillar==='market'?CT.careerFramework.scoreCard(c).M:CT.careerFramework.scoreCard(c).K),0);if(!weight)return 0;const built=certs.reduce((sum,c)=>{const card=CT.careerFramework.scoreCard(c),w=Math.max(1,pillar==='market'?card.M:card.K);return sum+w*progress(c);},0);return clamp(built/weight*100);}
  function practicalScore(archetype){const snap=CT.capabilityGates.pillarSnapshot(),keys=PILLAR_BY_ARCHETYPE[archetype]||[];return clamp(avg(keys.map(k=>snap[k]?.score||0)));}
  function experienceFit(roleKey=null){if(!roleKey)return 50;const ctx=CT.careerFramework.context();if(ctx.current===roleKey)return 100;if(ctx.next===roleKey)return 65;if(ctx.target===roleKey)return 45;return 35;}
  function marketForPath(path){return Object.freeze({...BASE_MARKETS[path.spec.archetype],...(PATHWAY_MARKETS[path.id]||{})});}
  function readinessLabel(score){if(score>=72)return'APPLY NOW';if(score>=58)return'REALISTIC STRETCH';if(score>=45)return'BUILD NEXT';return'NOT YET';}
  function roleRowFromPath(path){const marketCredential=pathwayCertScore(path,'market'),knowledgeCredential=pathwayCertScore(path,'knowledge'),practical=practicalScore(path.spec.archetype);const capability=clamp(knowledgeCredential*.58+practical*.42),marketAccess=clamp(marketCredential*.82+Math.min(100,path.metrics.market*10)*.18);const floor=Math.min(marketAccess,capability),score=clamp(floor*.72+(marketAccess+capability)/2*.28),market=marketForPath(path);return Object.freeze({id:path.id,label:path.label,archetype:path.spec.archetype,marketAccess:Math.round(marketAccess),capability:Math.round(capability),score:Math.round(score),status:readinessLabel(score),market,query:market.query||path.label,missing:marketAccess>capability?'Job-performance capability is the limiting pillar.':'Market access / recognised signal is the limiting pillar.',path});}
  function baselineRow(spec){const certs=CERTS.map(cert=>({cert,fit:CT.careerFramework.profileFit(cert,spec.roleKey),p:progress(cert)})).filter(x=>x.fit>=25&&x.p>0);const marketAccess=clamp(avg(certs.map(x=>x.fit*x.p))*.1+certs.reduce((s,x)=>s+CT.careerFramework.scoreCard(x.cert).M*x.p,0)*2.1);const practical=practicalScore(spec.archetype),experience=experienceFit(spec.roleKey),knowledge=clamp(avg(certs.map(x=>CT.careerFramework.scoreCard(x.cert).K*x.p))*10);const capability=clamp(knowledge*.4+practical*.35+experience*.25);const score=clamp(Math.min(marketAccess,capability)*.7+(marketAccess+capability)/2*.3);return Object.freeze({...spec,marketAccess:Math.round(marketAccess),capability:Math.round(capability),score:Math.round(score),status:readinessLabel(score),query:spec.market.query,missing:marketAccess>capability?'Capability evidence/experience is limiting readiness.':'Recognised role signal is limiting readiness.'});}
  function roles(){const paths=CT.dualPillarDepth.allPathways().filter(p=>p.id.startsWith('pv-')).map(roleRowFromPath),baseline=BASELINE_ROLES.map(baselineRow);const byLabel=new Map();for(const row of [...baseline,...paths]){const key=row.label.toLowerCase(),prior=byLabel.get(key);if(!prior||row.score>prior.score)byLabel.set(key,row);}return Object.freeze([...byLabel.values()].sort((a,b)=>b.score-a.score||b.market.median-a.market.median));}
  function adjustedRange(role){const s=clamp(role.score)/100,m=role.market;const low=Math.round((m.low+(m.median-m.low)*Math.max(0,(s-.35)/.65))/500)*500;const high=Math.round((m.low+(m.high-m.low)*Math.max(.15,(s-.25)/.75))/500)*500;return {low:Math.min(low,high),high:Math.max(low,high)};}
  function currentValue(){const rows=roles(),apply=rows.filter(r=>r.score>=58),anchor=apply[0]||rows[0]||null;if(!anchor)return Object.freeze({low:0,high:0,anchor:null,roles:rows});const top=apply.slice(0,5),ranges=(top.length?top:[anchor]).map(adjustedRange),low=Math.min(...ranges.map(r=>r.low)),high=Math.max(...ranges.map(r=>r.high));return Object.freeze({low,high,anchor,roles:rows,applyNow:Object.freeze(rows.filter(r=>r.score>=72).slice(0,6)),stretch:Object.freeze(rows.filter(r=>r.score>=58&&r.score<72).slice(0,6)),next:Object.freeze(rows.filter(r=>r.score>=45&&r.score<58).slice(0,6)),methodology:SNAPSHOT.methodology});}
  function money(v){return CT.marketValue?.money?.(v)||new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(v||0);}

  CT.marketReadiness=Object.freeze({SNAPSHOT,BASE_MARKETS,PATHWAY_MARKETS,BASELINE_ROLES,PILLAR_BY_ARCHETYPE,progress,pathwayCertScore,practicalScore,roleRowFromPath,baselineRow,roles,currentValue,adjustedRange,readinessLabel,money});
})(window);
