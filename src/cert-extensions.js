// Cert Tracker — generic certification extensions.
// This file contains no user-specific career context. It exists so the public
// tracker can represent useful structured learning ladders that were missing
// from the original canonical dataset.
(function extendCertifications() {
  'use strict';
  if (typeof CERTS === 'undefined' || !Array.isArray(CERTS)) throw new Error('certs.js must load before cert-extensions.js');

  const existing = new Set(CERTS.map(cert => cert.id));
  const additions = [
    {
      id:'briefcam-tech', name:'BriefCam Technical Certification / Training', code:'BRIEFCAM-TECH',
      phase:1, track:'ROLE-DRIVEN', gateway:false, tier:'D', vendor:'Milestone Systems / BriefCam',
      validity:18, cost:'Vendor / partner training', costNum:0, cvValue:1200, verifiedAt:'2026-09', employer:false, free:false,
      cpe:0, cpePeriod:0, difficulty:4, roi:7, hours:[20,40],
      coverage:'Technical installation, configuration, administration and troubleshooting of BriefCam video analytics; useful for video analytics, forensic search, alerting and VMS integration.',
      prerequisites:'Vendor prerequisites vary by course delivery. Practical VMS, Windows and IP-video experience is useful.',
      studyMaterials:'BriefCam / Milestone official training and product documentation.',
      subjects:['Video analytics','VMS integration','AI-assisted video search','Troubleshooting'],
      skills:['Video analytics','VMS integration','Physical security','Troubleshooting'],
      examFormat:'Vendor technical training and assessment; verify current delivery and recertification rules before booking.',
      projectRec:'Build a lab design that connects VMS recording, analytics search, alerting and operator workflow, documenting data flow and troubleshooting checkpoints.',
      note:'Role-driven technical analytics credential. Treat it as high knowledge value when BriefCam is actually deployed or supported.',
      sourceUrl:'https://www.milestonesys.com/solutions/platform/video-analytics/briefcam/', deps:[]
    },
    {
      id:'az-802', name:'Microsoft Certified: Windows Server Administrator Associate', code:'AZ-802',
      phase:2, track:'CONDITIONAL', gateway:false, tier:'B', vendor:'Microsoft',
      validity:12, cost:'Microsoft role-based exam pricing varies by region', costNum:106, cvValue:2500, verifiedAt:'2026-09', employer:false, free:false,
      cpe:0, cpePeriod:0, difficulty:6, roi:8, hours:[70,120],
      coverage:'Windows Server administration across AD DS, Hyper-V, networking, storage/file services, security, monitoring and troubleshooting.',
      prerequisites:'Practical Windows Server administration experience is strongly recommended.',
      studyMaterials:'Microsoft Learn AZ-802 learning path, Windows Server labs, Active Directory, Hyper-V and storage practice.',
      subjects:['Windows Server','Active Directory','Hyper-V','Storage','Infrastructure troubleshooting','Security'],
      skills:['Windows Server','Active Directory','Virtualisation','Storage','Infrastructure troubleshooting'],
      examFormat:'Single Microsoft role-based exam. AZ-802 is the replacement path after AZ-800/AZ-801 retirement.',
      projectRec:'Build a small Windows Server lab with AD DS, DNS, Hyper-V, file services, certificates and a documented backup/recovery test.',
      note:'Strong infrastructure foundation for workloads that depend on Windows Server. Verify beta/general-availability status before booking.',
      sourceUrl:'https://learn.microsoft.com/en-us/credentials/certifications/windows-server-administrator-associate/', deps:[]
    },
    {
      id:'ccnp-enterprise', name:'Cisco CCNP Enterprise (ENCOR + ENARSI)', code:'350-401 ENCOR + 300-410 ENARSI',
      phase:2, track:'CONDITIONAL', gateway:false, tier:'B', vendor:'Cisco',
      validity:36, cost:'$700 exam fees before tax/FX (ENCOR $400 + ENARSI $300)', costNum:520, cvValue:6000, verifiedAt:'2026-09', employer:false, free:false,
      cpe:0, cpePeriod:36, difficulty:8, roi:9, hours:[220,380],
      coverage:'Enterprise infrastructure, dual-stack architecture, virtualisation, network assurance, security, automation and QoS via ENCOR; advanced Layer 3 routing, VPN services, infrastructure security/services and automation via ENARSI.',
      prerequisites:'No formal Cisco prerequisite, but CCNA-level knowledge and substantial hands-on lab practice are strongly recommended.',
      studyMaterials:'Cisco U / Cisco Press ENCOR and ENARSI material, CML/EVE-NG/GNS3 labs, packet analysis and troubleshooting practice.',
      subjects:['Enterprise networking','Advanced routing','VPNs','Network assurance','Infrastructure security','Automation','QoS'],
      skills:['Routing','Switching','BGP','OSPF','VPN','Network troubleshooting','Automation'],
      examFormat:'Pass 350-401 ENCOR plus one concentration exam. This roadmap entry uses 300-410 ENARSI as the advanced-routing concentration.',
      projectRec:'Design, configure and break/fix a multi-site dual-stack enterprise lab using dynamic routing, route control, VPNs, redundancy and structured troubleshooting evidence.',
      note:'A deep networking curriculum with strong cross-vendor transfer. ENARSI is represented because it maximises advanced routing and troubleshooting depth.',
      sourceUrl:'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccnp-enterprise/index.html', deps:['ccna']
    },
    {
      id:'ccie-enterprise', name:'Cisco CCIE Enterprise Infrastructure', code:'350-401 ENCOR + CCIE Enterprise Infrastructure Lab',
      phase:5, track:'OPTIONAL', gateway:false, tier:'A', vendor:'Cisco',
      validity:36, cost:'ENCOR $400 + lab $1,600 before training/travel', costNum:1480, cvValue:9000, verifiedAt:'2026-09', employer:false, free:false,
      cpe:0, cpePeriod:36, difficulty:10, roi:8, hours:[600,1200],
      coverage:'Expert-level enterprise infrastructure design, deployment, operation and optimisation, including software-defined infrastructure, transport, security/services, automation and programmability.',
      prerequisites:'No formal prerequisite beyond passing the qualifying core exam, but expert-level practical networking capability is expected.',
      studyMaterials:'Cisco U CCIE Enterprise learning matrix, extensive CML/EVE-NG lab practice, design/troubleshooting drills and current lab equipment/software list.',
      subjects:['Expert enterprise networking','Network design','SD infrastructure','Transport','Infrastructure security','Automation','Programmability'],
      skills:['Expert routing','Network architecture','Troubleshooting','Automation','APIs'],
      examFormat:'350-401 ENCOR core exam plus an 8-hour CCIE Enterprise Infrastructure practical lab.',
      projectRec:'Maintain an expert lab portfolio showing timed design, implementation, fault isolation and optimisation of complex enterprise topologies.',
      note:'Expert networking branch. High learning value but very high opportunity cost; best treated as a deliberate specialisation decision rather than an automatic next step after CCNP.',
      sourceUrl:'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccie-enterprise-infrastructure/index.html', deps:['ccnp-enterprise']
    },
    {
      id:'isa95-fund', name:'ISA-95 / IEC 62264 Enterprise-Control System Integration Fundamentals Specialist', code:'IC55 / E-CSI Fundamentals',
      phase:4, track:'CONDITIONAL', gateway:false, tier:'A', vendor:'ISA',
      validity:0, cost:'ISA course + exam; delivery format pricing varies', costNum:1270, cvValue:4500, verifiedAt:'2026-09', employer:false, free:false,
      cpe:0, cpePeriod:0, difficulty:7, roi:9, hours:[35,60],
      coverage:'Enterprise-control integration using ISA-95/IEC 62264: models, terminology, system boundaries, business/manufacturing activities, information flow and integration between enterprise and control domains.',
      prerequisites:'None formally required.',
      studyMaterials:'ISA IC55/IC55M/IC55E/IC55V official training and ISA-95 standards resources.',
      subjects:['ISA-95','IEC 62264','IT/OT integration','Purdue model','MES/ERP integration','Information flows'],
      skills:['OT integration','Architecture','Industrial systems','Enterprise-control boundaries'],
      examFormat:'Complete the designated ISA training course and pass the multiple-choice exam.',
      projectRec:'Create an ISA-95 model for a sample industrial site showing levels, system ownership, information exchanges and integration boundaries.',
      note:'Directly useful for professionals responsible for connecting enterprise and manufacturing/control environments.',
      sourceUrl:'https://www.isa.org/certification/certificate-programs/isa-95-iec-62264-enterprise-control-system-integra', deps:['iec-62443-cfs']
    },
    {
      id:'bcs-arch-found', name:'BCS Foundation Certificate in Architecture Concepts and Domains', code:'BCS ARCH FOUNDATION',
      phase:4, track:'ARCHITECT', gateway:false, tier:'B', vendor:'BCS',
      validity:0, cost:'Exam/training pricing varies by provider', costNum:240, cvValue:2200, verifiedAt:'2026-09', employer:false, free:false,
      cpe:0, cpePeriod:0, difficulty:5, roi:7, hours:[35,60],
      coverage:'Architecture concepts, domains, viewpoints, stakeholders and core practices used as a foundation for later enterprise/solution architecture study.',
      prerequisites:'None formally required for the foundation level.',
      studyMaterials:'BCS accredited architecture foundation training and syllabus.',
      subjects:['Architecture fundamentals','Architecture domains','Stakeholders','Viewpoints','Solution design'],
      skills:['Architecture','Requirements','Stakeholder communication'],
      examFormat:'BCS foundation-level assessment; verify current syllabus and provider format before booking.',
      projectRec:'Produce a lightweight architecture pack with context, stakeholder concerns, viewpoints, constraints and decision records.',
      note:'Useful architecture foundation before the BCS Practitioner Certificate in Enterprise and Solutions Architecture.',
      sourceUrl:'https://www.bcs.org/qualifications-and-certifications/certifications-for-professionals/it-architecture/', deps:[]
    }
  ];

  additions.forEach(cert => { if (!existing.has(cert.id)) { CERTS.push(cert); existing.add(cert.id); } });
})();
