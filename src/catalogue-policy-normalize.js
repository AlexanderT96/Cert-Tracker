// Cert Tracker — post-catalogue policy/currentness normalization (September 2026).
// Keeps sparse secondary-filter records aligned with the dual-pillar policy and applies
// verified vendor-program corrections without changing stable internal certification IDs.
(function normalizeCataloguePolicy(){
  'use strict';
  if(typeof CERTS==='undefined'||!Array.isArray(CERTS))throw new Error('catalogue must load before catalogue-policy-normalize.js');
  const VERIFIED='2026-09-02';
  const byId=Object.fromEntries(CERTS.map(cert=>[cert.id,cert]));
  const patch=(id,values)=>{if(byId[id])Object.assign(byId[id],values);};

  // Remove remaining knowledge-first / market-secondary copy inherited by sparse records.
  for(const cert of CERTS){
    if(typeof cert.note==='string'){
      cert.note=cert.note
        .replace(/market value is secondary\.?/ig,'market access and job-performance capability should be judged together.')
        .replace(/market value is a secondary signal\.?/ig,'market access is a co-equal signal alongside job-performance capability.')
        .replace(/knowledge value comes first\.?/ig,'market access and job-performance capability are co-equal.');
    }
  }

  // Palo Alto Networks' current role-based portfolio. These patches use the current
  // public certification names while retaining stable tracker IDs for saved-state safety.
  patch('pan-apprentice',{name:'Palo Alto Networks Certified Cybersecurity Apprentice',code:'CYBERSECURITY APPRENTICE',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/certification'});
  patch('pan-practitioner',{name:'Palo Alto Networks Certified Cybersecurity Practitioner',code:'CYBERSECURITY PRACTITIONER',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/certification'});
  patch('pan-netsec-pro',{name:'Palo Alto Networks Certified Network Security Professional',code:'NETWORK SECURITY PROFESSIONAL',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-netsec-professional',coverage:'Understand the Palo Alto Networks network-security portfolio and perform entry-level maintenance, configuration, installation and deployment across the platform.',projectRec:'Deploy a representative PAN-OS network-security lab, document baseline configuration and policy, then troubleshoot a deliberately broken connectivity or policy scenario.'});
  patch('pan-ngfw-eng',{name:'Palo Alto Networks Certified Next-Generation Firewall Engineer',code:'NGFW ENGINEER',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-ngfw-engineer',coverage:'Deploy, operate and administer Palo Alto Networks NGFW products, including PAN-OS networking, device settings, integrations, objects, policies and operational management.',projectRec:'Build and troubleshoot an NGFW lab covering interfaces/routing, zones, objects, security/NAT policy, logging, management and one automation/integration task.'});
  patch('pan-sse-eng',{name:'Palo Alto Networks Certified Security Service Edge Engineer',code:'SSE ENGINEER',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-sse-engineer',coverage:'Plan, deploy, configure, manage and troubleshoot Palo Alto Networks security service edge environments, including Prisma Access operational and architecture concepts.',projectRec:'Design a representative SSE/SASE deployment covering user/site connectivity, policy, identity, traffic flow, operational monitoring and a documented troubleshooting scenario.'});
  patch('pan-netsec-arch',{name:'Palo Alto Networks Certified Network Security Architect',code:'NETWORK SECURITY ARCHITECT',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-netsec-architect',coverage:'Translate technical and business requirements into secure, highly available and scalable network-security architectures using the Palo Alto Networks portfolio and relevant third-party integrations.',prerequisites:'Advanced architect-level target. Palo Alto Networks describes the intended audience as experienced network-security architects with 5+ years architecting Zero Trust across the Network Security platform and 2+ years of Palo Alto Networks hands-on experience. Treat these as readiness guidance even where the exam registration flow does not enforce them as formal prerequisites.',projectRec:'Produce and defend a complete network-security architecture package: requirements, Zero Trust design, HA/scalability, central management/IAM, branch/SASE, cloud/IoT/data-security integration, migration, failure domains and operational acceptance criteria.',note:'Architect-level capstone. Do not use the badge to simulate seniority: prioritise it when substantial architecture and Palo Alto hands-on evidence already exists.'});
  patch('pan-secops-arch',{name:'Palo Alto Networks Certified Security Operations Architect',code:'SECURITY OPERATIONS ARCHITECT',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-secops-architect',prerequisites:'Advanced architect-level target. Palo Alto Networks describes the intended audience as security-operations architects with 5+ years designing security operations, incident response and threat detection/prevention solutions plus 2+ years of Palo Alto Networks hands-on experience.',projectRec:'Design and defend a security-operations architecture covering telemetry, detection, investigation, automation/orchestration, incident response, integrations, resilience and measurable operational outcomes.',note:'Architect-level security-operations capstone; experience and design ownership should lead the timing, not exam availability.'});
  // Field-scoped issuer checks: do not refresh untouched facts or prices.
  const fact=(source)=>({source,checkedAt:'2026-09-02'});
  const py='https://pythoninstitute.org/pcpp2';
  patch('pcpp2',{validity:60,formalPrerequisites:[],prerequisites:'No formal prerequisites. PCAP and PCPP1 are recommended background. In development: not confirmed bookable.',factChecks:{identity:fact(py),availability:fact(py),eligibility:fact(py),renewal:fact(py)}});
  const cks='https://www.cncf.io/blog/2026/06/17/expanding-care-passing-cks-can-now-extend-your-cka-certification/';
  patch('cks',{formalPrerequisites:['cka'],prerequisites:'Previously passing CKA is required; it need not still be active. CKS earned on or after 18 June 2026 extends or reinstates previously earned CKA. Practical Kubernetes administration remains essential.',studyMaterials:'Use the current CNCF/LF CKS curriculum and practical labs. Check the official checkout for current regional pricing and included practice access.',factChecks:{eligibility:fact(cks),renewal:fact(cks)}});
  patch('htb-cjca',{name:'HTB Certified Junior Cybersecurity Associate',factChecks:{identity:fact('https://academy.hackthebox.com/preview/certifications/htb-certified-junior-cybersecurity-associate')}});
  patch('cissp',{requiresAwardConfirmation:true,prerequisites:'Full CISSP certification requires qualifying experience and endorsement, not only an exam pass. Candidates without the experience may pursue Associate of ISC2 status. Do not describe this as CISSP Associate.',factChecks:{eligibility:fact('https://www.isc2.org/certifications/associate')}});
  for(const id of ['ccsp','issap','issep','issmp','cisa','cism','crisc','cgeit'])patch(id,{requiresAwardConfirmation:true});
  for(const id of ['jsnad','jsnsd'])patch(id,{factChecks:{availability:fact('https://training.linuxfoundation.org/'+id+'-cert-inactive/')}});
  for(const cert of CERTS){cert.learningDependencies=[...(cert.deps||[])];cert.formalPrerequisites=cert.formalPrerequisites||[];}
})();
