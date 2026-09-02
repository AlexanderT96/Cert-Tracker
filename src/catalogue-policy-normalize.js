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
})();
