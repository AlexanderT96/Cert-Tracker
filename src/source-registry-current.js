// Cert Tracker — audited source-registry extensions for current role-based programmes.
(function extendSourceRegistry(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT?.sourceRegistry)return;
  const VERIFIED='2026-09-02';
  const extra={
    'pan-netsec-pro':{level:'CERT',verifiedAt:VERIFIED,url:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-netsec-professional',note:'Official Palo Alto Networks Network Security Professional certification page; current Professional-level Network Security credential.'},
    'pan-ngfw-eng':{level:'CERT',verifiedAt:VERIFIED,url:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-ngfw-engineer',note:'Official Palo Alto Networks Next-Generation Firewall Engineer certification page; current Specialist-level NGFW engineering credential.'},
    'pan-sse-eng':{level:'CERT',verifiedAt:VERIFIED,url:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-sse-engineer',note:'Official Palo Alto Networks Security Service Edge Engineer certification page; current Specialist-level SSE credential.'},
    'pan-netsec-arch':{level:'CERT',verifiedAt:VERIFIED,url:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-netsec-architect',note:'Official Palo Alto Networks Network Security Architect page; architect-level target audience states 5+ years architecting for Zero Trust across Network Security and 2+ years Palo Alto Networks hands-on experience.'},
    'pan-secops-arch':{level:'CERT',verifiedAt:VERIFIED,url:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-secops-architect',note:'Official Palo Alto Networks Security Operations Architect page; intended for 5+ years designing security operations/IR/detection-prevention solutions and 2+ years Palo Alto Networks hands-on experience.'}
  };
  CT.sourceRegistry=Object.freeze({...CT.sourceRegistry,...Object.fromEntries(Object.entries(extra).map(([id,row])=>[id,Object.freeze(row)]))});
})(window);
