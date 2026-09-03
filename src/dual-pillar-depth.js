// Cert Tracker — universal dual-pillar depth model.
// Generic public logic only: no named-user career history or private scoring overrides.
(function initDualPillarDepth(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.careerFramework||!CT?.recommendations||!CT?.learningResources||!CT?.capabilityGates)return;

  const clean=value=>String(value||'').replace(/[^A-Za-z0-9/&+ .'-]+/g,' ').replace(/\s+/g,' ').trim();
  const uniq=rows=>[...new Set(rows.filter(Boolean))];
  const avg=rows=>rows.length?rows.reduce((a,b)=>a+Number(b||0),0)/rows.length:0;

  const ARCHETYPES=Object.freeze({
    cloudEngineering:Object.freeze({
      mission:'Design, operate and secure cloud platforms so services are resilient, observable and supportable in production.',
      responsibilities:['Cloud/network architecture and secure service integration','Identity, access and platform-control implementation','Troubleshooting availability, connectivity and configuration failures','Automation, monitoring and lifecycle improvement'],
      evidence:['Build and troubleshoot a representative cloud environment','Document secure network/identity/data flows and failure modes','Produce an implementation or migration artefact with validation evidence'],
      marketOutcome:'Build credentials that are recognised for cloud/platform roles while retaining enough infrastructure depth to perform after hire.',
      capabilityOutcome:'Be able to deploy, diagnose, secure and explain the platform rather than only describe vendor features.'
    }),
    securityOperations:Object.freeze({
      mission:'Detect, investigate and contain security-relevant behaviour using telemetry, repeatable analysis and defensible evidence.',
      responsibilities:['Telemetry onboarding, query development and detection engineering','Triage, investigation and incident scoping','Root-cause analysis across endpoint, identity, cloud and network data','Automation and operational runbook improvement'],
      evidence:['Investigate a realistic incident from alert to timeline and root cause','Write and tune detections or hunting queries with false-positive analysis','Produce an incident report and containment/recovery recommendations'],
      marketOutcome:'Pair recognised defensive-security credentials with evidence that demonstrates analyst/engineer productivity.',
      capabilityOutcome:'Turn alerts and raw telemetry into reliable decisions under time pressure.'
    }),
    offensiveSecurity:Object.freeze({
      mission:'Safely identify exploitable weaknesses and explain the defensive controls that prevent, detect or contain them.',
      responsibilities:['Reconnaissance, attack-path analysis and controlled exploitation','Web, identity, host and network security testing','Evidence collection, impact explanation and remediation advice','Repeatable reporting and retesting'],
      evidence:['Complete a scoped attack path in a legal lab and document every step','Produce a professional finding with evidence, impact and remediation','Retest the weakness and prove the defensive control works'],
      marketOutcome:'Use recognisable practical offensive credentials without letting badge difficulty substitute for professional reporting and systems understanding.',
      capabilityOutcome:'Demonstrate repeatable testing judgement, safe methodology and remediation literacy.'
    }),
    governanceRisk:Object.freeze({
      mission:'Translate technical risk into governance, assurance and business decisions that can be defended and implemented.',
      responsibilities:['Risk assessment, control selection and assurance','Audit evidence, policy and compliance mapping','Stakeholder communication and risk acceptance decisions','Programme governance and remediation tracking'],
      evidence:['Produce a risk assessment with assets, threats, controls and residual risk','Map a representative system to a recognised control framework','Write an executive-ready recommendation with cost/risk trade-offs'],
      marketOutcome:'Combine recognised governance credentials with enough technical literacy to be credible with engineering teams.',
      capabilityOutcome:'Make risk decisions that survive technical challenge and business scrutiny.'
    }),
    identitySecurity:Object.freeze({
      mission:'Design and operate identity controls that make access decisions explicit, observable and resilient.',
      responsibilities:['Authentication, authorisation and privileged-access design','Conditional access, lifecycle and federation integration','Identity threat detection and recovery planning','Policy, audit and access-governance implementation'],
      evidence:['Trace and document an end-to-end authentication/authorisation flow','Implement and test least-privilege/conditional-access controls','Diagnose a broken identity flow using logs and protocol evidence'],
      marketOutcome:'Use identity/cloud credentials to open specialist roles while proving practical IAM design and troubleshooting ability.',
      capabilityOutcome:'Understand identity as a security control plane, not a collection of portal settings.'
    }),
    appPlatformSecurity:Object.freeze({
      mission:'Build security into applications, APIs, containers and delivery pipelines without destroying engineering velocity.',
      responsibilities:['Secure software/API design and threat modelling','CI/CD, secrets and infrastructure-as-code controls','Container/Kubernetes security and runtime hardening','Vulnerability remediation and developer enablement'],
      evidence:['Threat-model and secure a representative application/API','Build a pipeline with security checks and controlled secrets','Demonstrate a container or application weakness and verified remediation'],
      marketOutcome:'Pair engineering-platform credentials with security certifications that recruiters recognise in AppSec/DevSecOps roles.',
      capabilityOutcome:'Operate comfortably across code, pipeline, cloud and runtime boundaries.'
    }),
    physicalSecurity:Object.freeze({
      mission:'Design, integrate and support physical-security platforms as networked enterprise systems rather than isolated appliances.',
      responsibilities:['VMS/access-control architecture and lifecycle support','Networking, storage, identity and integration dependencies','Multi-vendor interoperability, APIs and event flows','Troubleshooting, resilience and operational supportability'],
      evidence:['Troubleshoot a multi-component physical-security fault end to end','Produce a VMS/PACS/network/data-flow design','Demonstrate a standards/API integration and document failure modes'],
      marketOutcome:'Retain strong vendor credibility while adding transferable infrastructure/security credentials that broaden role access.',
      capabilityOutcome:'Be able to diagnose the full system path from device through network, server, identity, storage and application.'
    }),
    otSecurity:Object.freeze({
      mission:'Secure industrial environments without losing sight of process safety, availability, engineering workflows and operational constraints.',
      responsibilities:['Zones/conduits, segmentation and industrial firewall design','OT risk assessment and passive monitoring','Industrial protocol and control-system understanding','Secure IT/OT integration and lifecycle governance'],
      evidence:['Build or model an OT cell/area zone and justify all permitted flows','Capture and explain representative industrial protocol traffic','Produce an OT risk assessment tied to process impact and mitigations'],
      marketOutcome:'Combine scarce OT-security credentials with networking/security signals that make the capability legible to employers.',
      capabilityOutcome:'Understand what the process is doing, why availability matters and how controls affect operations.'
    }),
    architectureConsulting:Object.freeze({
      mission:'Turn requirements and constraints into supportable technical designs with explicit risk, cost and lifecycle trade-offs.',
      responsibilities:['Requirements, HLD/LLD and cross-domain architecture','Commercial, licensing, capacity and lifecycle decisions','Migration, test, acceptance and operational handover','Stakeholder negotiation and design defence'],
      evidence:['Produce a complete HLD/LLD package for a representative solution','Create BoM/licensing/TCO and capacity assumptions','Defend design trade-offs and define migration/acceptance criteria'],
      marketOutcome:'Build architect-level market signals only alongside evidence that shows real design ownership.',
      capabilityOutcome:'Be able to make and defend architecture decisions instead of only recognising architecture terminology.'
    }),
    commercialTechnical:Object.freeze({
      mission:'Translate complex technology into commercially sound customer outcomes while remaining technically credible.',
      responsibilities:['Discovery, qualification and technical requirements','Solution positioning, value articulation and risk management','Customer success, escalation and stakeholder coordination','Commercial trade-offs, roadmap and adoption planning'],
      evidence:['Run a structured discovery and produce a technically defensible solution brief','Explain value, risk and implementation constraints to mixed audiences','Build an adoption/success plan with measurable technical outcomes'],
      marketOutcome:'Use respected technical credentials to increase credibility and earning power in customer-facing roles.',
      capabilityOutcome:'Stay technically deep enough that commercial recommendations remain accurate and executable.'
    }),
    leadershipProduct:Object.freeze({
      mission:'Prioritise security/platform investment using customer need, engineering reality, risk and commercial value.',
      responsibilities:['Product/portfolio strategy and prioritisation','Customer discovery and technical requirement translation','Risk, investment and roadmap decisions','Cross-functional delivery and outcome measurement'],
      evidence:['Create a prioritised product/security roadmap with explicit trade-offs','Write a problem/requirements brief that engineers can implement','Measure whether a delivered change improved security or customer outcome'],
      marketOutcome:'Combine leadership/product signals with enough technical credibility to compete for higher-value product roles.',
      capabilityOutcome:'Make prioritisation decisions grounded in engineering constraints rather than feature-list thinking.'
    }),
    resilienceInvestigation:Object.freeze({
      mission:'Understand failures, incidents and human/technical risk well enough to coordinate recovery and reduce recurrence.',
      responsibilities:['Incident/crisis coordination and evidence gathering','Resilience, continuity and recovery planning','Root-cause and control-gap analysis','Stakeholder communication under uncertainty'],
      evidence:['Run a tabletop or simulated incident with decisions and timeline recorded','Produce an RCA and recovery/improvement plan','Define RTO/RPO, escalation and communication requirements for a service'],
      marketOutcome:'Use recognised security/risk credentials to access resilience and investigation roles while proving operational judgement.',
      capabilityOutcome:'Remain useful when systems, controls or processes are failing rather than only during steady state.'
    })
  });

  // Every explicit job-path filter receives a deliberate mission/archetype rather than a generic badge list.
  const PATHWAY_MAP=Object.freeze({
    'pv-a-se':['cloudEngineering','Cloud Security / Solutions Engineer — customer-facing cloud-security design, technical discovery and implementation credibility.'],
    'pv-a-devsecops':['appPlatformSecurity','DevSecOps Engineer — secure delivery pipelines, cloud platforms, infrastructure as code and runtime controls.'],
    'pv-a-privacy':['governanceRisk','Privacy Engineer — convert privacy requirements into implementable technical controls, evidence and data-lifecycle decisions.'],
    'pv-a-cloudsoc':['securityOperations','Cloud SOC Analyst — investigate cloud, identity and workload telemetry and turn detections into containment decisions.'],
    'pv-a-ai':['appPlatformSecurity','AI Security Engineer — secure AI/ML applications, data flows, model/API dependencies and delivery pipelines.'],
    'pv-a-iam':['identitySecurity','Cloud Identity Engineer — own authentication, authorisation, lifecycle, federation and privileged-access controls.'],
    'pv-a-data':['cloudEngineering','Cloud Data Security Engineer — protect cloud data stores, access paths, encryption, governance and recovery.'],
    'pv-a-k8s':['appPlatformSecurity','Kubernetes Security Specialist — secure clusters, workloads, supply chains, identities, network policy and runtime behaviour.'],
    'pv-a-ir':['securityOperations','Cloud Forensics & IR Specialist — reconstruct cloud incidents, scope impact and coordinate defensible containment/recovery.'],
    'pv-b-se':['physicalSecurity','Physical Security Solutions Engineer — design and explain integrated VMS/PACS/network solutions that can actually be deployed and supported.'],
    'pv-b-otics':['otSecurity','OT/ICS Security Engineer — apply network/security controls with industrial process, protocol and availability awareness.'],
    'pv-b-consultancy':['architectureConsulting','Security Consultant — assess requirements/risk and turn them into defensible technical and commercial recommendations.'],
    'pv-b-cpsoc':['securityOperations','Convergence SOC Analyst — correlate cyber, network, OT and physical-security telemetry during investigations.'],
    'pv-b-cni':['otSecurity','CNI Security Specialist — design and assure resilient security controls for high-consequence industrial/critical environments.'],
    'pv-b-pentest':['offensiveSecurity','Physical Penetration Tester — assess blended physical, network, identity and technical attack paths with professional evidence.'],
    'pv-b-insider':['resilienceInvestigation','Insider Threat Analyst — combine behavioural, identity, forensic and governance evidence to assess insider-risk scenarios.'],
    'pv-b-crisis':['resilienceInvestigation','Crisis & Resilience Manager — coordinate response, continuity, recovery and lessons learned across technical and business teams.'],
    'pv-b-smartbuilding':['otSecurity','Smart Building & IoT Security — secure converged building-control, IoT, network and physical-security systems.'],
    'pv-c-se':['commercialTechnical','Cyber Security Solutions Engineer — connect customer requirements to technically defensible security designs and product choices.'],
    'pv-c-detection':['securityOperations','Detection Engineer — engineer telemetry, detections and response logic that are measurable, maintainable and low-noise.'],
    'pv-c-offensive':['offensiveSecurity','Penetration Tester — identify exploitable weaknesses, prove impact safely and provide actionable remediation.'],
    'pv-c-grc':['governanceRisk','GRC / Audit Analyst — translate controls, risk and evidence into assurance decisions and remediation priorities.'],
    'pv-c-appsec':['appPlatformSecurity','Application Security Engineer — embed security into software, APIs, pipelines and developer workflows.'],
    'pv-c-ir':['securityOperations','Incident Response & DFIR — scope incidents, preserve evidence, reconstruct activity and drive containment/recovery.'],
    'pv-c-cti':['securityOperations','Threat Intelligence Analyst — turn adversary and campaign information into decisions, detections and defensive priorities.'],
    'pv-c-malware':['offensiveSecurity','Malware Analyst & Reverse Engineer — understand malicious code behaviour and convert findings into detection/remediation insight.'],
    'pv-c-redteam':['offensiveSecurity','Red Team Operator — exercise realistic attack paths to test defensive controls, detection and organisational response.'],
    'pv-top-pm':['leadershipProduct','Security Product Manager — prioritise product/security investment using customer need, technical feasibility, risk and commercial impact.'],
    'pv-top-tam':['commercialTechnical','Technical Account Manager — maintain customer trust by combining technical depth, adoption planning and escalation ownership.'],
    'pv-top-platform':['appPlatformSecurity','Security Platform Engineer — build and automate the shared security platforms used by engineering and operations teams.'],
    'pv-top-finsec':['architectureConsulting','Financial Services Security Engineer — design high-assurance controls with strong identity, monitoring, resilience and governance depth.'],
    'pv-top-cleared':['architectureConsulting','Cleared Cyber Engineer — deliver defensible engineering in regulated/high-assurance environments with strong documentation and evidence discipline.'],
    'pv-top-ma':['architectureConsulting','Cyber M&A / Technical Due Diligence — identify security/technology risk, integration cost and hidden technical debt in transactions.'],
    'pv-top-csa':['cloudEngineering','Cloud Solutions Architect — design cloud systems across networking, identity, security, resilience, cost and migration constraints.'],
    'pv-top-embed':['offensiveSecurity','Embedded Systems Security Engineer — assess and secure firmware, devices, protocols and hardware/software trust boundaries.'],
    'pv-top-ae':['commercialTechnical','Enterprise Account Executive — sell complex security outcomes with enough technical credibility to qualify risk and avoid impossible commitments.'],
    'pv-top-contractor':['architectureConsulting','Independent Cyber Contractor / Day-Rate Specialist — deliver useful capability quickly, with market-recognised expertise and evidence of independent ownership.']
  });

  function categoryForLabel(label=''){
    const t=clean(label).toLowerCase();
    if(/physical|vms|access/.test(t))return'physicalSecurity';
    if(/ot|ics|cni|industrial|smart building|iot/.test(t))return'otSecurity';
    if(/pentest|red team|malware|embedded/.test(t))return'offensiveSecurity';
    if(/soc|detection|forensic|incident|threat intelligence/.test(t))return'securityOperations';
    if(/identity|iam/.test(t))return'identitySecurity';
    if(/devsecops|appsec|kubernetes|platform|ai security/.test(t))return'appPlatformSecurity';
    if(/privacy|grc|audit/.test(t))return'governanceRisk';
    if(/product manager/.test(t))return'leadershipProduct';
    if(/account|solutions engineer|technical account|sales/.test(t))return'commercialTechnical';
    if(/crisis|resilience|insider/.test(t))return'resilienceInvestigation';
    if(/architect|consult|due diligence|contractor|financial|cleared/.test(t))return'architectureConsulting';
    if(/cloud|data/.test(t))return'cloudEngineering';
    return'architectureConsulting';
  }

  function expectedEvidence(cert){
    const card=CT.careerFramework.scoreCard(cert),phase=Number(CT.store?.effectivePhase?.(cert)||cert.phase||6);
    if(card.T==='T3'||phase>=6)return'OWNED';
    if(phase>=5)return'DESIGNED';
    if(phase>=3)return'USED';
    return'LAB';
  }

  function topRoleFits(cert,limit=4){
    return Object.entries(CT.careerFramework.ROLE_PROFILES).map(([key,role])=>({key,label:role.label,fit:CT.careerFramework.profileFit(cert,key)})).sort((a,b)=>b.fit-a.fit||a.label.localeCompare(b.label)).slice(0,limit);
  }

  function topicTask(topic,depth,index){
    const verb=depth>=5?'design, troubleshoot and defend':depth>=4?'implement, troubleshoot and explain':depth>=3?'configure, validate and diagnose':'explain and demonstrate';
    return `${index+1}. ${verb} ${topic} to D${depth} standard; record expected behaviour, observed evidence, failure mode and resolution.`;
  }

  function certProfile(cert){
    const card=CT.careerFramework.scoreCard(cert),tandem=CT.recommendations.tandemProfile(card),learning=CT.learningResources.profile(cert),subjects=learning.subjects||[];
    const depths=subjects.map(s=>Number(s.depth||1)),deep=subjects.filter(s=>Number(s.depth||1)>=4).sort((a,b)=>b.depth-a.depth),topSubjects=[...subjects].sort((a,b)=>b.depth-a.depth).slice(0,5);
    const roleFits=topRoleFits(cert),evidenceLevel=expectedEvidence(cert);
    const performanceTasks=uniq([cert.projectRec,...topSubjects.slice(0,3).map((s,i)=>topicTask(s.topic,s.depth,i))]).slice(0,4);
    const imbalance=tandem.skew>=2
      ?`Market signal currently exceeds capability depth by ${Math.abs(tandem.skew).toFixed(1)} points. Treat the certificate as a door-opener, then deliberately close the capability gap with labs, troubleshooting and role evidence.`
      :tandem.skew<=-2
        ?`Capability depth currently exceeds direct market signal by ${Math.abs(tandem.skew).toFixed(1)} points. Keep it when it is a meaningful rung, but pair it with a recognised downstream credential or demonstrable portfolio evidence.`
        :`Market access and practical learning are sufficiently aligned to develop together (balance ${tandem.balance}/10).`;
    const marketAccess=card.M>=8
      ?`High market-access value (M${card.M}/10): useful for recruiter searchability, HR filters and credibility in ${roleFits.slice(0,2).map(r=>r.label).join(' / ')} paths.`
      :card.M>=6
        ?`Moderate market-access value (M${card.M}/10): useful when combined with adjacent credentials and relevant experience.`
        :`Limited standalone market signal (M${card.M}/10): justify it mainly as a curriculum rung, employer requirement or specialist capability builder.`;
    const capability=card.K>=8
      ?`High job-performance value (K${card.K}/10): the curriculum should materially improve implementation, troubleshooting, integration or design judgement.`
      :card.K>=6
        ?`Moderate job-performance value (K${card.K}/10): convert the syllabus into hands-on evidence instead of stopping at exam recall.`
        :`Narrower job-performance value (K${card.K}/10): use it for a specific gap and avoid treating completion as broad role readiness.`;
    return Object.freeze({
      id:cert.id,name:cert.name,card,tandem,learning,
      marketAccess,capability,imbalance,evidenceLevel,
      depth:Object.freeze({subjects:subjects.length,average:Number(avg(depths).toFixed(1)),max:depths.length?Math.max(...depths):1,deepCount:deep.length,deepSubjects:Object.freeze(deep.slice(0,6).map(s=>`${s.topic} (D${s.depth})`))}),
      roleFits:Object.freeze(roleFits),performanceTasks:Object.freeze(performanceTasks),
      completionStandard:`Certification complete = exam passed. Capability rung complete = at least ${evidenceLevel} evidence appropriate to the skill, plus the ability to explain failure modes and trade-offs.`,
      interviewProof:`Be able to explain what the credential covers, show one practical artefact and describe one troubleshooting/design scenario without relying on memorised exam wording.`,
      onJobProof:`Be able to perform the relevant task, recognise when it is failing, gather evidence, recover safely and document the outcome.`
    });
  }

  function filterItems(){
    if(typeof global.getFilterDefs!=='function')return[];
    const defs=global.getFilterDefs();
    return [
      ...(defs.filters||[]).filter(x=>typeof x.test==='function').map(x=>({...x,group:'core'})),
      ...Object.entries(defs.filterGroups||{}).flatMap(([group,g])=>(g.chips||[]).filter(x=>typeof x.test==='function').map(x=>({...x,group})))
    ];
  }

  function pathwaySpec(item){
    if(item.id==='my-path'&&CT.focusedRoute?.enabled())return Object.freeze({...ARCHETYPES.cloudEngineering,archetype:'cloudEngineering',mission:'Build deep networking expertise, supported by secure systems, Azure, Python automation and AI applications. Extend physical-security platform experience into broader engineering work.',responsibilities:['Routing, switching and systematic network troubleshooting','Secure Azure, identity and endpoint deployment','Python/PowerShell automation, APIs and practical integration','Reliable systems, monitoring, recovery and technical collaboration']});
    const role=CT.careerOptions?.byId(item.id);if(role){const f=CT.careerOptions.FAMILIES[role.family],base=ARCHETYPES[f.archetype]||ARCHETYPES.architectureConsulting;return Object.freeze({...base,archetype:f.archetype,mission:role.mission,responsibilities:f.tasks.map(t=>t[1]),evidence:CT.careerOptions.requirements(role).map(t=>t.label)});}
    const mapped=PATHWAY_MAP[item.id],key=mapped?.[0]||categoryForLabel(item.label),base=ARCHETYPES[key]||ARCHETYPES.architectureConsulting;
    return Object.freeze({...base,archetype:key,mission:mapped?.[1]||base.mission});
  }

  function pathwayProfile(item){
    const members=CERTS.filter(cert=>{try{return !!item.test(cert);}catch{return false;}}),spec=pathwaySpec(item);
    const ranked=CT.filterIntelligence?.rankRows?CT.filterIntelligence.rankRows(members,{filterId:item.id,label:item.label,horizon:'now'}):members.map(cert=>CT.recommendations.score(cert,{horizon:'now'}));
    const cards=members.map(cert=>CT.careerFramework.scoreCard(cert)),markets=cards.map(x=>x.M),knowledge=cards.map(x=>x.K),weaker=cards.map(x=>Math.min(x.M,x.K));
    const profiles=members.map(cert=>certProfile(cert)),deepSubjects=profiles.reduce((sum,p)=>sum+p.depth.deepCount,0),subjectCount=profiles.reduce((sum,p)=>sum+p.depth.subjects,0);
    const topCerts=ranked.slice(0,6).map(row=>({id:row.id||row.cert?.id,name:row.name||row.cert?.name,M:row.career?.M,K:row.career?.K,balance:row.tandem?.balance??0,weakerPillar:row.tandem?.weaker??0,timing:row.career?.T||''}));
    const conversionTasks=uniq(profiles.slice(0,8).flatMap(p=>p.performanceTasks.slice(0,1))).slice(0,5);
    return Object.freeze({
      id:item.id,label:clean(item.label),group:item.group||'',members:Object.freeze(members.map(c=>c.id)),count:members.length,spec,
      metrics:Object.freeze({market:Number(avg(markets).toFixed(1)),knowledge:Number(avg(knowledge).toFixed(1)),weakerPillar:Number(avg(weaker).toFixed(1)),subjects:subjectCount,deepSubjects}),
      topCerts:Object.freeze(topCerts),conversionTasks:Object.freeze(conversionTasks),
      responsibilities:Object.freeze(spec.responsibilities),evidence:Object.freeze(spec.evidence),
      roleReadinessRule:'A pathway is not role-ready because its certifications are complete. Market access must be strong enough to win the opportunity and practical evidence must be strong enough to perform after hire.',
      sequenceRule:CT.focusedRoute?.scoped(item.id)?'Follow the locked sequence, one next milestone at a time. Scores do not reorder it. Practical evidence remains separate from certification completion.':'Order certifications by dependencies, balanced M/K value, pathway relevance, timing and evidence gaps. Do not optimise for badge count, salary signal or curriculum depth in isolation.'
    });
  }

  function activePathway(){
    const id=state.filter||'my-path',item=filterItems().find(x=>x.id===id)||filterItems().find(x=>x.id==='my-path');
    return item?pathwayProfile(item):null;
  }

  function allPathways(){return Object.freeze(filterItems().map(pathwayProfile));}

  function audit(){
    const issues=[];
    for(const cert of CERTS){
      const p=certProfile(cert);
      if(!p.depth.subjects)issues.push(`${cert.id}: no learning subjects`);
      if(p.performanceTasks.length<2)issues.push(`${cert.id}: insufficient performance-conversion tasks`);
      if(p.roleFits.length<2)issues.push(`${cert.id}: insufficient role-fit context`);
      if(!p.marketAccess||!p.capability||!p.completionStandard)issues.push(`${cert.id}: incomplete dual-pillar detail`);
    }
    for(const path of allPathways()){
      if(!path.count&&path.id!=='passed')issues.push(`${path.id}: pathway has no certifications`);
      if(path.responsibilities.length<3||path.evidence.length<3)issues.push(`${path.id}: pathway depth is incomplete`);
      if(!path.spec.marketOutcome||!path.spec.capabilityOutcome)issues.push(`${path.id}: pathway lacks both outcome pillars`);
      if(path.count&&path.topCerts.length<Math.min(3,path.count))issues.push(`${path.id}: pathway ordering detail is incomplete`);
    }
    return Object.freeze({certifications:CERTS.length,pathways:filterItems().length,explicitJobPathways:Object.keys(PATHWAY_MAP).length,issues:Object.freeze(issues)});
  }

  CT.dualPillarDepth=Object.freeze({ARCHETYPES,PATHWAY_MAP,certProfile,pathwayProfile,activePathway,allPathways,filterItems,expectedEvidence,topRoleFits,audit});
})(window);
