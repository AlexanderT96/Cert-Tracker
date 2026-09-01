// Cert Tracker — generic practical capability pillars, evidence maturity and role-transition gates.
// Privacy boundary: all definitions here are reusable templates. Personal notes/state stay in browser storage.
(function initCapabilityGates(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.competency||!CT?.store)throw new Error('competency-engine.js and state-core.js must load before capability-gates.js');

  const LEVELS=Object.freeze({
    NONE:Object.freeze({label:'Not evidenced',score:0}),
    LAB:Object.freeze({label:'Labbed / demonstrated',score:25}),
    USED:Object.freeze({label:'Used in real work',score:55}),
    DESIGNED:Object.freeze({label:'Designed / documented',score:80}),
    OWNED:Object.freeze({label:'Owned / led',score:100})
  });
  const levelKeys=Object.freeze(Object.keys(LEVELS));
  const levelScore=level=>LEVELS[level]?.score||0;

  const PILLARS=Object.freeze({
    physicalSecurity:Object.freeze({label:'Physical security',skills:['physical','vms','access','accessIdentity','apiIntegration']}),
    enterpriseNetworking:Object.freeze({label:'Enterprise networking',skills:['networking','routing','wireless','hybridNetwork']}),
    networkSecurity:Object.freeze({label:'Network / cyber security',skills:['firewall','soc','siem','incident','threat','vulnerability','offensive']}),
    enterpriseInfrastructure:Object.freeze({label:'Enterprise infrastructure',skills:['windows','linux','enterpriseInfra','storage','database','pki','resilience']}),
    cloudIdentity:Object.freeze({label:'Cloud + identity',skills:['cloud','azure','aws','hybridNetwork','iam','zeroTrust']}),
    automationSoftware:Object.freeze({label:'Automation + software',skills:['automation','python','apiIntegration','iac','containers']}),
    otCybersecurity:Object.freeze({label:'OT cybersecurity',skills:['ot','firewall','governance','incident','architecture']}),
    otEngineering:Object.freeze({label:'OT engineering',skills:['otEngineering','industrialProtocols','networking','resilience']}),
    architectureCommercial:Object.freeze({label:'Architecture + commercial delivery',skills:['architecture','commercial','governance','leadership','resilience']}),
    offensiveUnderstanding:Object.freeze({label:'Offensive / attack-path understanding',skills:['offensive','pentest','vulnerability','iam','networking']}),
    aiSystems:Object.freeze({label:'AI / analytics systems',skills:['aiSystems','aiSecurity','data','apiIntegration','privacy']})
  });

  const EVIDENCE=Object.freeze([
    {id:'physical-vms-breakfix',pillar:'physicalSecurity',label:'Troubleshoot a VMS/device issue end-to-end and document root cause'},
    {id:'physical-interoperability',pillar:'physicalSecurity',label:'Demonstrate ONVIF/API metadata or event integration across vendors'},
    {id:'physical-access-architecture',pillar:'physicalSecurity',label:'Design an access-control flow covering controllers, readers, OSDP/Wiegand, credentials and VMS integration'},
    {id:'network-routed-topology',pillar:'enterpriseNetworking',label:'Build and verify a routed/switched multi-subnet topology with VLANs and dynamic routing'},
    {id:'network-breakfix',pillar:'enterpriseNetworking',label:'Deliberately break routing/switching and diagnose the fault from symptoms to root cause'},
    {id:'network-packet-analysis',pillar:'enterpriseNetworking',label:'Use packet capture to prove a network problem rather than relying on guesswork'},
    {id:'security-firewall-policy',pillar:'networkSecurity',label:'Implement and troubleshoot firewall policy, NAT and VPN behaviour'},
    {id:'security-segmentation',pillar:'networkSecurity',label:'Design and validate segmentation with explicit permitted data flows'},
    {id:'security-monitoring',pillar:'networkSecurity',label:'Investigate logs/telemetry and explain the security-relevant network behaviour'},
    {id:'infra-ad-dns-pki',pillar:'enterpriseInfrastructure',label:'Build AD DS, DNS and PKI/certificate services in a lab or real environment'},
    {id:'infra-virtual-storage',pillar:'enterpriseInfrastructure',label:'Design compute, virtualization and storage for capacity, performance and resilience'},
    {id:'infra-sql-recovery',pillar:'enterpriseInfrastructure',label:'Demonstrate database connectivity, backup and recovery fundamentals'},
    {id:'infra-ha-dr',pillar:'enterpriseInfrastructure',label:'Define HA, backup, DR, RPO and RTO for a representative service'},
    {id:'cloud-hybrid-network',pillar:'cloudIdentity',label:'Build or design hybrid cloud networking including routing, DNS, private connectivity and security controls'},
    {id:'cloud-identity-flow',pillar:'cloudIdentity',label:'Trace an identity/authentication flow using Entra/IAM and OAuth/OIDC concepts'},
    {id:'automation-api-integration',pillar:'automationSoftware',label:'Integrate two systems through APIs and handle authentication, errors and structured data'},
    {id:'automation-infrastructure',pillar:'automationSoftware',label:'Automate repeatable infrastructure/configuration work with code, Ansible or Terraform'},
    {id:'automation-security',pillar:'automationSoftware',label:'Automate a security or operations task such as inventory, validation, reporting or log parsing'},
    {id:'ot-risk-assessment',pillar:'otCybersecurity',label:'Perform a structured OT risk assessment with assets, zones/conduits, threats and mitigations'},
    {id:'ot-segmentation',pillar:'otCybersecurity',label:'Design an OT segmentation architecture and justify permitted industrial data flows'},
    {id:'ot-monitoring',pillar:'otCybersecurity',label:'Interpret passive OT/network telemetry without disrupting the process'},
    {id:'ot-plc-hmi',pillar:'otEngineering',label:'Build or operate a basic PLC/HMI scenario and explain scan cycle, I/O and control logic'},
    {id:'ot-protocols',pillar:'otEngineering',label:'Capture and explain at least two industrial protocols such as Modbus TCP, OPC UA, MQTT, BACnet/IP or DNP3'},
    {id:'ot-process-literacy',pillar:'otEngineering',label:'Explain a control loop/process, engineering workstation, historian and failure impact in operational terms'},
    {id:'architecture-hld-lld',pillar:'architectureCommercial',label:'Produce HLD and LLD with clear requirements, assumptions, constraints and data flows'},
    {id:'architecture-bom-tco',pillar:'architectureCommercial',label:'Produce BoM/licensing and compare cost/TCO trade-offs'},
    {id:'architecture-delivery',pillar:'architectureCommercial',label:'Define implementation, migration, testing and acceptance criteria'},
    {id:'architecture-stakeholders',pillar:'architectureCommercial',label:'Defend a design trade-off to technical and non-technical stakeholders'},
    {id:'architecture-ownership',pillar:'architectureCommercial',label:'Own or materially lead a multi-domain solution through design and delivery'},
    {id:'offensive-ad-path',pillar:'offensiveUnderstanding',label:'Demonstrate an identity/AD attack path and the defensive controls that break it'},
    {id:'offensive-lateral',pillar:'offensiveUnderstanding',label:'Demonstrate reconnaissance, credential or lateral-movement concepts in a safe lab'},
    {id:'offensive-api',pillar:'offensiveUnderstanding',label:'Identify and remediate a representative web/API weakness in a safe lab'},
    {id:'ai-cv-metrics',pillar:'aiSystems',label:'Explain computer-vision confidence, false positives/negatives and metadata quality'},
    {id:'ai-inference-architecture',pillar:'aiSystems',label:'Design edge-versus-cloud inference and compute/data-flow trade-offs'},
    {id:'ai-security-governance',pillar:'aiSystems',label:'Threat-model an AI/analytics workflow including privacy, model/API and supply-chain risks'}
  ].map(Object.freeze));

  const ROLE_GATES=Object.freeze({
    physicalSystemsEngineer:Object.freeze({label:'Physical Security Systems Engineer / Integrator',pillars:{physicalSecurity:55,enterpriseNetworking:40,enterpriseInfrastructure:35},evidence:{'physical-vms-breakfix':'USED','network-packet-analysis':'LAB','physical-interoperability':'LAB'}}),
    networkSecurityEngineer:Object.freeze({label:'Network Security Engineer',pillars:{enterpriseNetworking:65,networkSecurity:60,enterpriseInfrastructure:45,automationSoftware:25},evidence:{'network-routed-topology':'LAB','network-breakfix':'LAB','network-packet-analysis':'LAB','security-firewall-policy':'LAB','security-segmentation':'LAB'}}),
    otSecurityEngineer:Object.freeze({label:'OT / ICS Security Engineer',pillars:{enterpriseNetworking:60,networkSecurity:60,otCybersecurity:55,otEngineering:35,enterpriseInfrastructure:40},evidence:{'security-segmentation':'USED','ot-risk-assessment':'LAB','ot-segmentation':'LAB','ot-protocols':'LAB'}}),
    convergenceEngineer:Object.freeze({label:'Convergence / Integration Engineer',pillars:{physicalSecurity:65,enterpriseNetworking:65,networkSecurity:60,enterpriseInfrastructure:50,cloudIdentity:40,automationSoftware:40,otCybersecurity:55,otEngineering:45},evidence:{'physical-interoperability':'USED','automation-api-integration':'LAB','security-segmentation':'USED','ot-protocols':'LAB'}}),
    solutionsArchitect:Object.freeze({label:'Solutions / Security Architect',pillars:{architectureCommercial:65,enterpriseNetworking:65,networkSecurity:65,enterpriseInfrastructure:55,cloudIdentity:50,automationSoftware:45},evidence:{'architecture-hld-lld':'DESIGNED','architecture-bom-tco':'DESIGNED','architecture-delivery':'DESIGNED','architecture-stakeholders':'USED'}}),
    principalConvergenceArchitect:Object.freeze({label:'Principal OT-Convergence Architect',pillars:{architectureCommercial:80,physicalSecurity:70,enterpriseNetworking:75,networkSecurity:75,enterpriseInfrastructure:65,cloudIdentity:60,automationSoftware:55,otCybersecurity:75,otEngineering:65,aiSystems:45},evidence:{'architecture-ownership':'OWNED','architecture-hld-lld':'OWNED','architecture-stakeholders':'OWNED','ot-risk-assessment':'USED','ot-segmentation':'DESIGNED'}})
  });

  const CERT_GATE_OVERRIDES=Object.freeze({
    'ccie-enterprise':'networkSecurityEngineer','gicsp':'otSecurityEngineer','bcs-esa':'convergenceEngineer','pan-netsec-arch':'solutionsArchitect',
    'cissp':'convergenceEngineer','issap':'solutionsArchitect','asis-psp':'solutionsArchitect','ukcsc-princ':'solutionsArchitect','ukcsc-chart':'principalConvergenceArchitect','csyp':'principalConvergenceArchitect'
  });

  function evidenceRecord(id){const raw=state.capabilityEvidence?.[id];if(!raw)return Object.freeze({level:'NONE',score:0,note:'',updatedAt:null});if(typeof raw==='string')return Object.freeze({level:LEVELS[raw]?raw:'NONE',score:levelScore(raw),note:'',updatedAt:null});const level=LEVELS[raw.level]?raw.level:'NONE';return Object.freeze({level,score:levelScore(level),note:String(raw.note||''),updatedAt:raw.updatedAt||null});}
  function setEvidence(id,level,note=''){
    if(!EVIDENCE.some(item=>item.id===id))throw new Error(`Unknown capability evidence: ${id}`);
    if(!LEVELS[level])throw new Error(`Unknown evidence maturity: ${level}`);
    state.capabilityEvidence[id]={level,note:String(note||''),updatedAt:new Date().toISOString()};
    save.capabilityEvidence();
    CT.events.emit('capability-evidence-changed',{id,...state.capabilityEvidence[id]});
    return evidenceRecord(id);
  }
  function evidenceForPillar(pillar){return EVIDENCE.filter(item=>item.pillar===pillar).map(item=>Object.freeze({...item,record:evidenceRecord(item.id)}));}
  function pillarScore(pillar){
    const spec=PILLARS[pillar];if(!spec)return 0;const profile=CT.competency.profile();
    const skillValues=spec.skills.map(skill=>Number(profile[skill]||0)*100);const knowledge=skillValues.length?skillValues.reduce((a,b)=>a+b,0)/skillValues.length:0;
    const evidence=evidenceForPillar(pillar);const practical=evidence.length?evidence.reduce((sum,item)=>sum+item.record.score,0)/evidence.length:0;
    return Math.round(knowledge*.55+practical*.45);
  }
  function pillarSnapshot(){return Object.freeze(Object.fromEntries(Object.keys(PILLARS).map(key=>[key,Object.freeze({key,label:PILLARS[key].label,score:pillarScore(key),evidence:evidenceForPillar(key)})])));}
  function levelMeets(actual,required){return levelKeys.indexOf(actual)>=levelKeys.indexOf(required);}
  function roleGateStatus(key){
    const gate=ROLE_GATES[key];if(!gate)throw new Error(`Unknown role gate: ${key}`);const pillars=pillarSnapshot();const blockers=[];let achieved=0,total=0;
    for(const [pillar,required] of Object.entries(gate.pillars)){total++;const actual=pillars[pillar]?.score||0;if(actual>=required)achieved++;else blockers.push(`${PILLARS[pillar]?.label||pillar}: ${actual}% / ${required}%`);}
    for(const [id,required] of Object.entries(gate.evidence)){total++;const actual=evidenceRecord(id);if(levelMeets(actual.level,required))achieved++;else blockers.push(`${EVIDENCE.find(x=>x.id===id)?.label||id}: ${actual.level} / ${required}`);}
    const score=Math.round(achieved/Math.max(1,total)*100);return Object.freeze({key,label:gate.label,score,ready:blockers.length===0,blockers:Object.freeze(blockers),requirements:gate});
  }
  function allRoleGates(){return Object.freeze(Object.keys(ROLE_GATES).map(roleGateStatus));}
  function gateForCert(cert){const override=CERT_GATE_OVERRIDES[cert?.id];if(override)return roleGateStatus(override);const phase=CT.store.effectivePhase(cert);if(phase>=6)return roleGateStatus('principalConvergenceArchitect');if(phase>=5&&CT.careerFramework?.timing(cert)==='T3')return roleGateStatus('solutionsArchitect');if(phase>=4&&CT.careerFramework?.timing(cert)==='T3')return roleGateStatus('otSecurityEngineer');return null;}
  function portfolioClass(cert,card=null){
    const c=card||CT.careerFramework?.scoreCard?.(cert);if(!c)return 'SUPPORTING';
    if(c.T==='T3'||cert.track==='POST-PLAN')return 'CAPSTONE';
    if(c.K>=8&&(c.C>=6||c.N>=7))return 'CORE CAPABILITY';
    if(c.K>=8&&c.E>=8)return 'PRIMARY SPECIALISATION';
    return 'SUPPORTING';
  }
  function nextEvidence(limit=5){return EVIDENCE.map(item=>({...item,record:evidenceRecord(item.id),pillarScore:pillarScore(item.pillar)})).filter(item=>item.record.level!=='OWNED').sort((a,b)=>a.record.score-b.record.score||a.pillarScore-b.pillarScore||a.label.localeCompare(b.label)).slice(0,limit);}

  CT.capabilityGates=Object.freeze({LEVELS,PILLARS,EVIDENCE,ROLE_GATES,CERT_GATE_OVERRIDES,evidenceRecord,setEvidence,evidenceForPillar,pillarScore,pillarSnapshot,roleGateStatus,allRoleGates,gateForCert,portfolioClass,nextEvidence});
})(window);
