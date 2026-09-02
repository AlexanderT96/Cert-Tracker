// Cert Tracker — evidence-gated role seniority/readiness ladder.
// Generic public logic only. Personal evidence/progress remains in browser state.
(function initRoleReadinessRank(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.marketReadiness||!CT?.dualPillarDepth||!CT?.capabilityGates||!CT?.careerFramework)return;

  const LEVEL_ORDER=Object.freeze(['R1','R2','R3','R4','R5','R6']);
  const EVIDENCE_ORDER=Object.freeze(['NONE','LAB','USED','DESIGNED','OWNED']);
  // R1-R6 are neutral readiness levels. Role-specific titles carry the career meaning;
  // the global ladder deliberately avoids forcing illustrative labels onto every pathway.
  const RANKS=Object.freeze({
    R1:Object.freeze({key:'R1',label:'Level 1',short:'R1',minScore:0,minFloor:0,minPractical:0,minLab:0,minUsed:0,minDesigned:0,minOwned:0,minLeadership:0,description:'Foundation/training stage. Build the vocabulary, safe lab habits and supervised task competence needed to become useful without pretending certification completion equals independent role performance.'}),
    R2:Object.freeze({key:'R2',label:'Level 2',short:'R2',minScore:35,minFloor:30,minPractical:20,minLab:2,minUsed:0,minDesigned:0,minOwned:0,minLeadership:0,description:'Independent contributor on common tasks. Can execute routine work, recognise normal failure modes, gather evidence and escalate intelligently.'}),
    R3:Object.freeze({key:'R3',label:'Level 3',short:'R3',minScore:55,minFloor:50,minPractical:45,minLab:3,minUsed:2,minDesigned:0,minOwned:0,minLeadership:0,description:'Trusted technical contributor. Handles difficult troubleshooting, understands trade-offs, works across adjacent systems and can guide less experienced engineers.'}),
    R4:Object.freeze({key:'R4',label:'Level 4',short:'R4',minScore:68,minFloor:58,minPractical:55,minLab:4,minUsed:3,minDesigned:1,minOwned:1,minLeadership:50,description:'Owns outcomes beyond individual tickets/tasks. Coordinates people or workstreams, makes prioritisation decisions, manages risk/escalation and is accountable for delivery quality.'}),
    R5:Object.freeze({key:'R5',label:'Level 5',short:'R5',minScore:78,minFloor:68,minPractical:62,minLab:5,minUsed:4,minDesigned:3,minOwned:1,minLeadership:62,description:'Design-authority stage. Turns requirements and constraints into supportable cross-domain designs, defends technical/commercial trade-offs and owns architecture quality through delivery.'}),
    R6:Object.freeze({key:'R6',label:'Level 6',short:'R6',minScore:88,minFloor:78,minPractical:72,minLab:6,minUsed:5,minDesigned:5,minOwned:3,minLeadership:80,description:'Strategic-ownership stage. Owns portfolio direction, investment/risk decisions, organisational capability and multi-team outcomes rather than only a single solution or technical domain.'})
  });

  const TITLES=Object.freeze({
    physicalSecurity:Object.freeze({R1:'Physical Security Systems Trainee / Junior Support',R2:'Physical Security Systems Engineer',R3:'Senior Physical Security Systems Engineer',R4:'Physical Security Engineering Team Lead / Manager',R5:'Physical Security Solutions Architect',R6:'Director / Head of Physical Security Technology'}),
    cloudEngineering:Object.freeze({R1:'Cloud / Network Support Trainee',R2:'Cloud / Network Engineer',R3:'Senior Cloud Security / Network Engineer',R4:'Cloud / Platform Engineering Team Lead',R5:'Cloud Security / Solutions Architect',R6:'Director / Head of Cloud & Platform Security'}),
    securityOperations:Object.freeze({R1:'SOC Trainee / Junior Security Analyst',R2:'Security Operations Analyst / Engineer',R3:'Senior SOC / Detection / Incident Engineer',R4:'SOC / Security Operations Team Lead',R5:'Security Operations Architect',R6:'Director / Head of Security Operations'}),
    offensiveSecurity:Object.freeze({R1:'Junior Security Tester / Lab Practitioner',R2:'Penetration Tester / Security Tester',R3:'Senior Penetration Tester / Red Team Engineer',R4:'Offensive Security Team Lead / Manager',R5:'Offensive Security Architect / Principal Consultant',R6:'Director / Head of Offensive Security'}),
    governanceRisk:Object.freeze({R1:'GRC / Risk Trainee',R2:'Security Risk / GRC Analyst',R3:'Senior Security Risk / Assurance Specialist',R4:'Security Risk / GRC Manager',R5:'Security Governance / Risk Architect',R6:'Director / Head of Cyber Risk & Governance'}),
    identitySecurity:Object.freeze({R1:'Identity / IAM Support Trainee',R2:'Identity Security / IAM Engineer',R3:'Senior Identity Security Engineer',R4:'IAM / Identity Security Team Lead',R5:'Identity Security Architect',R6:'Director / Head of Identity Security'}),
    appPlatformSecurity:Object.freeze({R1:'Application / Platform Security Trainee',R2:'AppSec / DevSecOps / Platform Security Engineer',R3:'Senior AppSec / Platform Security Engineer',R4:'Application / Platform Security Team Lead',R5:'Application / Platform Security Architect',R6:'Director / Head of Product & Platform Security'}),
    otSecurity:Object.freeze({R1:'OT / ICS Security Trainee',R2:'OT / ICS Security Engineer',R3:'Senior OT / ICS Security Engineer',R4:'OT Security Team Lead / Manager',R5:'OT / Convergence Security Architect',R6:'Director / Head of OT & Convergence Security'}),
    architectureConsulting:Object.freeze({R1:'Junior Technical Consultant / Design Trainee',R2:'Technical Consultant / Solutions Engineer',R3:'Senior Consultant / Lead Engineer',R4:'Consulting / Solutions Team Lead',R5:'Solutions / Security Architect',R6:'Director / Head of Architecture & Consulting'}),
    commercialTechnical:Object.freeze({R1:'Junior Technical Account / Sales Engineer',R2:'Solutions Engineer / Technical Account Manager',R3:'Senior Solutions Engineer / Senior TAM',R4:'Solutions Engineering / Technical Accounts Manager',R5:'Customer / Solutions Architect',R6:'Director / Head of Solutions Engineering'}),
    leadershipProduct:Object.freeze({R1:'Associate Security Product / Programme Role',R2:'Security Product / Programme Manager',R3:'Senior Security Product / Programme Manager',R4:'Product / Programme Team Lead',R5:'Security Product / Platform Architect',R6:'Director / Head of Security Product & Strategy'}),
    resilienceInvestigation:Object.freeze({R1:'Incident / Resilience Trainee',R2:'Incident Response / Resilience Analyst',R3:'Senior Incident / Resilience Specialist',R4:'Incident / Resilience Team Lead / Manager',R5:'Resilience / Incident Architecture Lead',R6:'Director / Head of Cyber Resilience & Response'})
  });

  const LEVEL_NARRATIVE=Object.freeze({
    R1:'Learn safely under guidance; build labs and prove fundamentals.',
    R2:'Perform common work independently and troubleshoot routine failures.',
    R3:'Own complex technical work, cross-domain diagnosis and technical mentoring.',
    R4:'Lead people/workstreams and own operational delivery outcomes.',
    R5:'Design systems, defend trade-offs and own architecture through implementation.',
    R6:'Own strategy, portfolio investment, risk and multi-team organisational outcomes.'
  });

  const rankIndex=level=>Math.max(0,LEVEL_ORDER.indexOf(level));
  const evidenceIndex=level=>Math.max(0,EVIDENCE_ORDER.indexOf(level));
  const evidenceMeets=(actual,required)=>evidenceIndex(actual)>=evidenceIndex(required);
  const clamp=(v,min=0,max=100)=>Math.min(max,Math.max(min,Number(v)||0));
  const avg=rows=>rows.length?rows.reduce((a,b)=>a+Number(b||0),0)/rows.length:0;

  function evidenceStats(archetype){
    const pillars=CT.marketReadiness.PILLAR_BY_ARCHETYPE[archetype]||[];
    const seen=new Set(),records=[];
    for(const pillar of pillars){
      for(const item of CT.capabilityGates.evidenceForPillar(pillar)){
        if(seen.has(item.id))continue;seen.add(item.id);
        records.push({id:item.id,pillar,label:item.label,level:item.record.level,score:item.record.score});
      }
    }
    const counts={NONE:0,LAB:0,USED:0,DESIGNED:0,OWNED:0};
    records.forEach(row=>{counts[row.level]=(counts[row.level]||0)+1;});
    const atLeast=level=>records.filter(row=>evidenceMeets(row.level,level)).length;
    const practical=records.length?Math.round(avg(records.map(row=>row.score))):0;
    return Object.freeze({
      archetype,pillars:Object.freeze([...pillars]),records:Object.freeze(records.map(Object.freeze)),total:records.length,practical,
      counts:Object.freeze(counts),labPlus:atLeast('LAB'),usedPlus:atLeast('USED'),designedPlus:atLeast('DESIGNED'),owned:counts.OWNED||0
    });
  }

  function leadershipScore(){
    const pillar=Number(CT.capabilityGates.pillarScore('architectureCommercial')||0);
    const relevant=CT.capabilityGates.evidenceForPillar('architectureCommercial');
    const evidence=relevant.length?avg(relevant.map(x=>x.record.score)):0;
    return Math.round(pillar*.65+evidence*.35);
  }

  function snapshot(role){
    const market=clamp(role?.marketAccess),capability=clamp(role?.capability),floor=Math.min(market,capability);
    const evidence=evidenceStats(role?.archetype||'architectureConsulting'),leadership=leadershipScore();
    // The role's own dual-pillar readiness remains the main signal. Evidence maturity and
    // leadership/ownership tune seniority, but cannot compensate for a weak M or K pillar.
    const score=Math.round(clamp(floor*.55+clamp(role?.score)*.25+evidence.practical*.15+leadership*.05));
    return Object.freeze({market,capability,floor,evidence,leadership,score});
  }

  function qualifies(rank,snap){
    return snap.score>=rank.minScore&&snap.floor>=rank.minFloor&&snap.evidence.practical>=rank.minPractical&&snap.evidence.labPlus>=rank.minLab&&snap.evidence.usedPlus>=rank.minUsed&&snap.evidence.designedPlus>=rank.minDesigned&&snap.evidence.owned>=rank.minOwned&&snap.leadership>=rank.minLeadership;
  }

  function gapsFor(rank,snap){
    const gaps=[];
    if(snap.score<rank.minScore)gaps.push(`Overall readiness ${snap.score}% / ${rank.minScore}%`);
    if(snap.floor<rank.minFloor)gaps.push(`Market/capability floor ${snap.floor}% / ${rank.minFloor}%`);
    if(snap.evidence.practical<rank.minPractical)gaps.push(`Practical-evidence maturity ${snap.evidence.practical}% / ${rank.minPractical}%`);
    if(snap.evidence.labPlus<rank.minLab)gaps.push(`Lab-or-better evidence ${snap.evidence.labPlus} / ${rank.minLab}`);
    if(snap.evidence.usedPlus<rank.minUsed)gaps.push(`Used-or-better evidence ${snap.evidence.usedPlus} / ${rank.minUsed}`);
    if(snap.evidence.designedPlus<rank.minDesigned)gaps.push(`Designed-or-better evidence ${snap.evidence.designedPlus} / ${rank.minDesigned}`);
    if(snap.evidence.owned<rank.minOwned)gaps.push(`Owned/led evidence ${snap.evidence.owned} / ${rank.minOwned}`);
    if(snap.leadership<rank.minLeadership)gaps.push(`Leadership/architecture-commercial evidence ${snap.leadership}% / ${rank.minLeadership}%`);
    return Object.freeze(gaps);
  }

  function titleFor(archetype,rankKey){return TITLES[archetype]?.[rankKey]||`${rankKey} — ${archetype||'technical'} pathway`;}

  function rankForRole(role){
    if(!role)return null;
    const snap=snapshot(role);let rank=RANKS.R1;
    for(const key of LEVEL_ORDER){const candidate=RANKS[key];if(qualifies(candidate,snap))rank=candidate;else break;}
    const idx=LEVEL_ORDER.indexOf(rank.key),nextKey=LEVEL_ORDER[idx+1]||null,next=nextKey?RANKS[nextKey]:null;
    return Object.freeze({
      ...rank,rankIndex:idx+1,score:snap.score,floor:snap.floor,marketAccess:snap.market,capability:snap.capability,practical:snap.evidence.practical,leadership:snap.leadership,
      archetype:role.archetype,title:titleFor(role.archetype,rank.key),roleId:role.id,roleLabel:role.label,
      evidence:snap.evidence,next:next?Object.freeze({...next,title:titleFor(role.archetype,next.key),gaps:gapsFor(next,snap)}):null,
      achieved:Object.freeze(LEVEL_ORDER.slice(0,idx+1)),
      ladder:Object.freeze(LEVEL_ORDER.map(key=>Object.freeze({key,label:RANKS[key].label,title:titleFor(role.archetype,key),achieved:rankIndex(key)<=idx,current:key===rank.key,description:LEVEL_NARRATIVE[key]})))
    });
  }

  function forPathway(path){if(!path)return null;return rankForRole(CT.marketReadiness.roleRowFromPath(path));}
  function forFilter(filterId=state.filter){const item=CT.marketReadiness.filterItem(filterId);if(!item||!String(item.id).startsWith('pv-'))return null;return forPathway(CT.dualPillarDepth.pathwayProfile(item));}
  function active(){const assessment=CT.marketReadiness.activeAssessment();return assessment?rankForRole(assessment.role):null;}
  function all(){return Object.freeze(CT.marketReadiness.roles().map(role=>Object.freeze({role,rank:rankForRole(role)})).sort((a,b)=>b.rank.rankIndex-a.rank.rankIndex||b.rank.score-a.rank.score||b.role.score-a.role.score||a.role.label.localeCompare(b.role.label)));}
  function byArchetype(){
    const best=new Map();for(const row of all()){const key=row.role.archetype||'other',prior=best.get(key);if(!prior||row.rank.rankIndex>prior.rank.rankIndex||(row.rank.rankIndex===prior.rank.rankIndex&&row.rank.score>prior.rank.score))best.set(key,row);}
    return Object.freeze([...best.values()]);
  }

  function audit(){
    const issues=[];
    for(const archetype of Object.keys(CT.dualPillarDepth.ARCHETYPES||{})){
      if(!TITLES[archetype])issues.push(`${archetype}: no role-rank title map`);
      else for(const key of LEVEL_ORDER)if(!TITLES[archetype][key])issues.push(`${archetype}: missing ${key} title`);
    }
    const paths=CT.dualPillarDepth.allPathways().filter(path=>String(path.id).startsWith('pv-'));
    for(const path of paths){const rank=forPathway(path);if(!rank)issues.push(`${path.id}: no rank`);else if(rank.rankIndex<1||rank.rankIndex>6)issues.push(`${path.id}: invalid rank index`);}
    for(let i=1;i<LEVEL_ORDER.length;i++){const a=RANKS[LEVEL_ORDER[i-1]],b=RANKS[LEVEL_ORDER[i]];if(b.minScore<a.minScore||b.minFloor<a.minFloor||b.minPractical<a.minPractical||b.minLab<a.minLab||b.minUsed<a.minUsed||b.minDesigned<a.minDesigned||b.minOwned<a.minOwned||b.minLeadership<a.minLeadership)issues.push(`Rank thresholds are not monotonic at ${b.key}.`);}
    return Object.freeze({levels:LEVEL_ORDER.length,pathways:paths.length,archetypes:Object.keys(TITLES).length,issues:Object.freeze(issues)});
  }

  // Preserve the legacy roleMatches() contract while attaching the stronger readiness model.
  if(typeof global.roleMatches==='function'&&!global.roleMatches.__rankWrapped){
    const original=global.roleMatches;
    const wrapped=function(){return original().map(row=>{const item=CT.marketReadiness.filterItem(row.id);if(!item)return row;const path=CT.dualPillarDepth.pathwayProfile(item),role=CT.marketReadiness.roleRowFromPath(path),rank=rankForRole(role);return {...row,marketAccess:role.marketAccess,capability:role.capability,readiness:role.score,status:role.status,rank};});};
    wrapped.__rankWrapped=true;global.roleMatches=wrapped;
  }

  CT.roleReadiness=Object.freeze({LEVEL_ORDER,EVIDENCE_ORDER,RANKS,TITLES,LEVEL_NARRATIVE,evidenceStats,leadershipScore,snapshot,qualifies,gapsFor,titleFor,rankForRole,forPathway,forFilter,active,all,byArchetype,audit});
})(window);
