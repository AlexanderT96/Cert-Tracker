// Cert Tracker — generic certification extensions and current-program corrections.
// This file contains no user-specific career context. It exists so the public
// tracker can represent useful structured learning ladders that are missing
// from the original canonical dataset without rewriting the legacy catalogue.
(function extendCertifications() {
  'use strict';
  if (typeof CERTS === 'undefined' || !Array.isArray(CERTS)) throw new Error('certs.js must load before cert-extensions.js');

  const existing = new Set(CERTS.map(cert => cert.id));
  const additions = [
    {
      id:'crowdstrike-ccfa',name:'CrowdStrike Certified Falcon Administrator',code:'CCFA',phase:3,track:'ROLE-DRIVEN',gateway:false,tier:'B',vendor:'CrowdStrike',validity:36,
      cost:'Verify regional exam and training prices',costNum:0,cvValue:0,employer:false,free:false,cpe:0,cpePeriod:0,difficulty:6,roi:7,hours:[40,80],
      coverage:'Falcon administration: sensors, hosts/groups, users/roles, policies, exclusions, dashboards and workflows.',
      prerequisites:'CrowdStrike recommends six months of production Falcon experience and University access. CCFP is not a mandatory prerequisite.',
      studyMaterials:'Official CCFA examination guide and CrowdStrike University administrator training; authorised Falcon environment.',
      subjects:['Sensor deployment','Host groups','Prevention and update policies','Roles and API access','Exclusions and indicators','Dashboards and workflows'],skills:['Endpoint security','Administration','Automation','Identity'],
      examFormat:'60 questions in 90 minutes; verify the active guide before booking.',
      projectRec:'Practise staged sensor deployment, policy assignment, least-privilege roles and rollback in an authorised environment. Check vendor-supported Defender coexistence before deploying together.',
      note:'Administrator credential only: responder, hunter and SIEM certifications are not prerequisites. Study hours, difficulty and ROI are planning estimates, not issuer facts. Not interchangeable with CCFP.',
      sourceUrl:'https://www.crowdstrike.com/content/dam/crowdstrike/marketing/en-us/documents/pdfs/crowdstrike-university/ccfa-certification-guide.pdf',deps:[]
    },
    {
      id:'ai-103',name:'Microsoft Certified: Azure AI Apps and Agents Developer Associate',code:'AI-103',phase:5,track:'ROLE-DRIVEN',gateway:false,tier:'B',vendor:'Microsoft',validity:12,
      cost:'Microsoft role-based exam; verify regional pricing',costNum:0,cvValue:0,employer:false,free:false,cpe:0,cpePeriod:0,difficulty:7,roi:7,hours:[80,140],
      coverage:'Develop AI applications and agents with Python and Microsoft Foundry, including generative AI, vision, language and information extraction.',
      prerequisites:'Python and Azure familiarity are expected. The route places this after PCAP, Azure administration and AI fundamentals; those are study preparation, not claimed formal prerequisites.',
      studyMaterials:'Microsoft Learn AI-103 study guide, training and Microsoft Foundry documentation.',
      subjects:['Python AI applications','Microsoft Foundry','Agents','Generative AI','Computer vision','Language and information extraction'],skills:['Python','Azure AI','APIs','AI development'],
      examFormat:'Microsoft associate-level certification exam; check current availability and exam policies before booking.',
      projectRec:'Develop and evaluate a small authorised AI application with managed credentials, grounded responses, failure handling and cost limits.',
      note:'Developer-focused AI rung. Estimated hours, difficulty and ROI are planning estimates. AI-103 does not require adding a separate data-science certification ladder.',
      sourceUrl:'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/',deps:[]
    },
    {
      id:'briefcam-tech', name:'BriefCam Technical Certification / Training', code:'BRIEFCAM-TECH', phase:1, track:'ROLE-DRIVEN', gateway:false, tier:'D', vendor:'Milestone Systems / BriefCam',
      validity:18, cost:'Vendor / partner training', costNum:0, cvValue:1200, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:4, roi:7, hours:[20,40],
      coverage:'Technical installation, configuration, administration and troubleshooting of BriefCam video analytics; useful for video analytics, forensic search, alerting and VMS integration.', prerequisites:'Vendor prerequisites vary by course delivery. Practical VMS, Windows and IP-video experience is useful.',
      studyMaterials:'BriefCam / Milestone official training and product documentation.', subjects:['Video analytics','VMS integration','AI-assisted video search','Troubleshooting'], skills:['Video analytics','VMS integration','Physical security','Troubleshooting'],
      examFormat:'Vendor technical training and assessment; verify current delivery and recertification rules before booking.', projectRec:'Build a lab design that connects VMS recording, analytics search, alerting and operator workflow, documenting data flow and troubleshooting checkpoints.',
      note:'Role-driven technical analytics credential. Treat it as high knowledge value when BriefCam is actually deployed or supported.', sourceUrl:'https://www.milestonesys.com/solutions/platform/video-analytics/briefcam/', deps:[]
    },
    {
      id:'ai-901', name:'Microsoft Certified: Azure AI Fundamentals', code:'AI-901', phase:1, track:'FOUNDATION', gateway:false, tier:'C', vendor:'Microsoft', validity:0,
      cost:'Microsoft fundamentals exam; regional pricing', costNum:75, cvValue:900, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:3, roi:6, hours:[20,35],
      coverage:'Current Azure AI fundamentals covering AI concepts and capabilities plus implementation of AI solutions using Microsoft Foundry. The current blueprint expects basic Python syntax, Azure resource familiarity, REST APIs, SDKs and CLIs.',
      prerequisites:'No formal prerequisite. Basic cloud concepts and introductory Python are useful.', studyMaterials:'Microsoft Learn AI-901 learning paths, official study guide and hands-on Microsoft Foundry exercises.',
      subjects:['Responsible AI','Machine learning concepts','Computer vision','NLP','Generative AI','Microsoft Foundry'], skills:['AI fundamentals','Computer vision','Responsible AI','Azure AI'],
      examFormat:'Microsoft fundamentals certification exam; current English blueprint updated 15 April 2026.', projectRec:'Build a small Foundry-based AI proof of concept and document the model/service choice, data flow, security/privacy considerations and limitations.',
      note:'Useful structured AI vocabulary rung. Do it quickly; the real value comes from later analytics/AI-system design and security rather than the badge alone.', sourceUrl:'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/', deps:[]
    },
    {
      id:'az-802', name:'Microsoft Certified: Windows Server Administrator Associate', code:'AZ-802', phase:2, track:'CONDITIONAL', gateway:false, tier:'B', vendor:'Microsoft', validity:12,
      cost:'Microsoft role-based exam pricing varies by region', costNum:106, cvValue:2500, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:6, roi:8, hours:[70,120],
      coverage:'Windows Server administration across AD DS, hybrid management, Hyper-V, networking, storage/file services, security, monitoring and troubleshooting.', prerequisites:'Practical Windows Server administration experience is strongly recommended.',
      studyMaterials:'Microsoft Learn AZ-802 learning path, Windows Server labs, Active Directory, Hyper-V, networking, storage and recovery practice.', subjects:['Windows Server','Active Directory','Hyper-V','Storage','Hybrid networking','Infrastructure troubleshooting','Security'],
      skills:['Windows Server','Active Directory','Virtualisation','Storage','PKI','Infrastructure troubleshooting'], examFormat:'Single Microsoft role-based exam. In September 2026 AZ-802 is the beta/new path; AZ-800/AZ-801 retire 30 September 2026.',
      projectRec:'Build a small Windows Server lab with AD DS, DNS, Hyper-V, file services, certificates and a documented backup/recovery test.', note:'Strong infrastructure foundation for workloads that depend on Windows Server. Recheck beta/general-availability status immediately before booking.',
      sourceUrl:'https://learn.microsoft.com/en-us/credentials/certifications/windows-server-administrator-associate/', deps:[]
    },
    {
      id:'sc-500', name:'Microsoft Certified: Cloud and AI Security Engineer Associate', code:'SC-500', phase:4, track:'IDENTITY-SEC', gateway:false, tier:'B', vendor:'Microsoft', validity:12,
      cost:'Microsoft role-based exam pricing varies by region', costNum:125, cvValue:4000, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:7, roi:8.5, hours:[70,120],
      coverage:'Design, implement and manage security controls across Azure, hybrid and AI-enabled environments, including identity/governance, storage/databases/networking, compute, posture management and AI workload security.',
      prerequisites:'Intermediate cloud/security engineering knowledge; Azure administration and identity experience are strongly useful.', studyMaterials:'Microsoft Learn SC-500 course and study guide plus Azure/Defender/Entra hands-on labs.',
      subjects:['Cloud security','AI workload security','Identity','Networking','Storage/databases','Compute','Security posture'], skills:['Azure security','AI security','Identity','Cloud networking','Security posture'],
      examFormat:'Single Microsoft associate-level role exam. SC-500 replaced the retiring AZ-500 path in 2026.', projectRec:'Secure a representative Azure/hybrid workload end-to-end and document identity, network, data, compute, posture and AI-specific controls.',
      note:'Strong modern Microsoft security-engineering rung; valuable once Azure/identity foundations and real cloud-security practice exist.', sourceUrl:'https://learn.microsoft.com/en-us/credentials/certifications/cloud-and-ai-security-engineer-associate/', deps:['az-104']
    },
    {
      id:'ccnp-enterprise', name:'Cisco CCNP Enterprise (ENCOR + ENARSI)', code:'350-401 ENCOR + 300-410 ENARSI', phase:2, track:'CONDITIONAL', gateway:false, tier:'B', vendor:'Cisco', validity:36,
      cost:'$700 exam fees before tax/FX (ENCOR $400 + ENARSI $300)', costNum:520, cvValue:6000, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:36, difficulty:8, roi:9, hours:[220,380],
      coverage:'Enterprise infrastructure, dual-stack architecture, virtualisation, network assurance, security, automation and QoS via ENCOR; advanced Layer 3 routing, VPN services, infrastructure security/services and automation via ENARSI.',
      prerequisites:'No formal Cisco prerequisite, but CCNA-level knowledge and substantial hands-on lab practice are strongly recommended.', studyMaterials:'Cisco U / Cisco Press ENCOR and ENARSI material, CML/EVE-NG/GNS3 labs, packet analysis and troubleshooting practice.',
      subjects:['Enterprise networking','Advanced routing','VPNs','Network assurance','Infrastructure security','Automation','QoS'], skills:['Routing','Switching','BGP','OSPF','VPN','Network troubleshooting','Automation'],
      examFormat:'Pass 350-401 ENCOR plus one concentration exam. This roadmap uses 300-410 ENARSI as the advanced-routing concentration.', projectRec:'Design, configure and break/fix a multi-site dual-stack enterprise lab using dynamic routing, route control, VPNs, redundancy and structured troubleshooting evidence.',
      note:'A deep networking curriculum with strong cross-vendor transfer. ENARSI is represented because it maximises advanced routing and troubleshooting depth.', sourceUrl:'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccnp-enterprise/index.html', deps:['ccna']
    },
    {
      id:'ccie-enterprise', name:'Cisco CCIE Enterprise Infrastructure', code:'350-401 ENCOR + CCIE Enterprise Infrastructure Lab', phase:5, track:'OPTIONAL', gateway:false, tier:'A', vendor:'Cisco', validity:36,
      cost:'Core exam + expert practical lab before training/travel', costNum:1480, cvValue:9000, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:36, difficulty:10, roi:8, hours:[600,1200],
      coverage:'Expert-level enterprise infrastructure design, deployment, operation and optimisation, including software-defined infrastructure, transport, security/services, automation and programmability.', prerequisites:'No formal prerequisite beyond the qualifying core exam, but expert-level practical networking capability is expected.',
      studyMaterials:'Cisco U CCIE Enterprise learning matrix, extensive CML/EVE-NG lab practice, design/troubleshooting drills and the current lab equipment/software list.', subjects:['Expert enterprise networking','Network design','SD infrastructure','Transport','Infrastructure security','Automation','Programmability'],
      skills:['Expert routing','Network architecture','Troubleshooting','Automation','APIs'], examFormat:'350-401 ENCOR qualifying exam plus CCIE Enterprise Infrastructure practical lab; verify current lab format and fee before booking.',
      projectRec:'Maintain an expert lab portfolio showing timed design, implementation, fault isolation and optimisation of complex enterprise topologies.', note:'Expert networking branch. High learning value but very high opportunity cost; treat as a deliberate specialisation decision rather than an automatic next step after CCNP.',
      sourceUrl:'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccie-enterprise-infrastructure/index.html', deps:['ccnp-enterprise']
    },
    {
      id:'isa-cap-associate', name:'ISA Certified Automation Professional (CAP) Associate Certificate', code:'CAP ASSOCIATE', phase:4, track:'CONDITIONAL', gateway:false, tier:'B', vendor:'ISA', validity:0,
      cost:'ISA EC01 self-paced course/exam; current member/non-member pricing varies', costNum:500, cvValue:2500, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:6, roi:8.5, hours:[45,80],
      coverage:'Broad automation/control-system foundation assessed against the CAP body of knowledge. The official exam-review course can satisfy CAP Associate eligibility and the credential counts as one year of work experience toward eventual CAP eligibility.',
      prerequisites:'Eligibility can be met through relevant education/experience or by successfully completing the official CAP Associate Exam Review Course.', studyMaterials:'ISA EC01/EC01M official CAP Associate Exam Review Course and CAP Body of Knowledge.',
      subjects:['Automation fundamentals','Control systems','Instrumentation','Automation lifecycle','Project execution'], skills:['OT engineering','Automation','Control systems','Industrial systems'],
      examFormat:'ISA CAP Associate exam; official review-course completion can establish exam eligibility.', projectRec:'Build an automation-system architecture pack explaining control loops, PLC/HMI/SCADA roles, I/O, networks, alarms, safety boundaries and lifecycle responsibilities.',
      note:'Strong structured bridge into actual automation engineering knowledge. This is not proof of production automation experience, but it closes a major theory/curriculum gap before deeper OT architecture work.', sourceUrl:'https://www.isa.org/certification/certificate-programs/cap-associate-certificate-program', deps:['iec-62443-cfs']
    },
    {
      id:'isa-cap', name:'ISA Certified Automation Professional (CAP)', code:'CAP', phase:6, track:'POST-PLAN', gateway:false, tier:'A', vendor:'ISA', validity:36,
      cost:'ISA certification exam/application; verify current pricing', costNum:550, cvValue:6000, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:36, difficulty:9, roi:9, hours:[100,180],
      coverage:'Professional automation certification across the full CAP Body of Knowledge, intended for practitioners with substantial documented automation experience and responsible-charge capability.',
      prerequisites:'Strict experience eligibility applies. ISA currently requires five years automation experience with a four-year technical degree, or ten years without a qualifying four-year technical degree, with additional responsible-charge evidence for the latter route. CAP Associate counts as one year toward the experience total.',
      studyMaterials:'ISA CAP Body of Knowledge and current official preparation resources.', subjects:['Automation engineering','Control systems','Lifecycle','Project leadership','Responsible charge'], skills:['OT engineering','Automation architecture','Leadership','Industrial systems'],
      examFormat:'ISA professional certification exam plus documented eligibility requirements.', projectRec:'Only pursue after substantial real automation responsibility; portfolio should show ownership of automation/control-system decisions rather than lab-only work.',
      note:'Experience-gated automation capstone. Keep visible for the long-term OT-engineering branch, but do not schedule it until genuine automation work satisfies ISA eligibility.', sourceUrl:'https://www.isa.org/certification/cap', deps:['isa-cap-associate']
    },
    {
      id:'isa-apm', name:'ISA Automation Project Management Specialist Certificate', code:'APM SPECIALIST', phase:4, track:'CONDITIONAL', gateway:false, tier:'B', vendor:'ISA', validity:0,
      cost:'ISA MT01 course + exam; delivery pricing varies', costNum:1200, cvValue:2800, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:6, roi:8, hours:[35,60],
      coverage:'Automation-project delivery including scope, estimation/justification, multidisciplinary requirements, hardware/software design approaches, coordination, schedule dependencies and change.', prerequisites:'No formal prerequisites.',
      studyMaterials:'ISA MT01/MT01M official Automation Project Management course.', subjects:['Automation project management','Scope','Estimating','Requirements','Multidisciplinary delivery'], skills:['Commercial architecture','Project delivery','Automation','Stakeholder management'],
      examFormat:'Complete the designated ISA Automation Project Management course and pass the certificate exam.', projectRec:'Create a delivery pack for a multi-domain automation/security project: scope, assumptions, estimates, dependencies, risks, change process, implementation stages and acceptance criteria.',
      note:'Useful bridge between technical architecture and real automation-project delivery. Supporting rather than mandatory until project responsibility becomes part of the role.', sourceUrl:'https://www.isa.org/certification/certificate-programs/automation-project-management-specialist-certifica', deps:[]
    },
    {
      id:'isa95-fund', name:'ISA-95 / IEC 62264 Enterprise-Control System Integration Fundamentals Specialist', code:'IC55 / E-CSI Fundamentals', phase:4, track:'CONDITIONAL', gateway:false, tier:'A', vendor:'ISA', validity:0,
      cost:'ISA course + exam; delivery format pricing varies', costNum:1270, cvValue:4500, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:7, roi:9, hours:[35,60],
      coverage:'Enterprise-control integration using ISA-95/IEC 62264: models, terminology, system boundaries, business/manufacturing activities, information flow and integration between enterprise and control domains.', prerequisites:'None formally required.',
      studyMaterials:'ISA IC55/IC55M/IC55E/IC55V official training and ISA-95 standards resources.', subjects:['ISA-95','IEC 62264','IT/OT integration','Purdue model','MES/ERP integration','Information flows'], skills:['OT integration','Architecture','Industrial systems','Enterprise-control boundaries'],
      examFormat:'Complete the designated ISA training course and pass the multiple-choice exam.', projectRec:'Create an ISA-95 model for a sample industrial site showing levels, system ownership, information exchanges and integration boundaries.',
      note:'Directly useful for professionals responsible for connecting enterprise and manufacturing/control environments.', sourceUrl:'https://www.isa.org/certification/certificate-programs/isa-95-iec-62264-enterprise-control-system-integra', deps:['iec-62443-cfs']
    },
    {
      id:'isa-61511-sis-fund', name:'ISA/IEC 61511 SIS Fundamentals Specialist', code:'SFS / EC50', phase:4, track:'ROLE-DRIVEN', gateway:false, tier:'A', vendor:'ISA', validity:0,
      cost:'ISA EC50 course + exam; expensive specialist training', costNum:2500, cvValue:3500, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:7, roi:8, hours:[45,80],
      coverage:'Functional-safety lifecycle and Safety Instrumented Systems under ISA/IEC 61511, including performance requirements, lifecycle activities and SIL concepts.', prerequisites:'No formal prerequisite; familiarity with process safety and ISA/IEC 61511 is recommended.',
      studyMaterials:'ISA EC50/EC50V/EC50E/EC50M official training.', subjects:['Functional safety','SIS','SIL','Safety lifecycle','Process industries'], skills:['OT engineering','Functional safety','Industrial systems','Risk'],
      examFormat:'Complete the designated course and pass the multiple-choice exam.', projectRec:'Model a fictional process-safety lifecycle and explain where SIS, BPCS, alarms, shutdown logic and cybersecurity controls interact.',
      note:'Sector-triggered branch only. Valuable in process, energy and CNI environments; poor timing if the role never touches safety-instrumented systems.', sourceUrl:'https://www.isa.org/certification/certificate-programs/safety-certificates', deps:['isa-cap-associate']
    },
    {
      id:'isa-61511-sil-select', name:'ISA/IEC 61511 SIL Selection Specialist', code:'SSS / EC52', phase:5, track:'ROLE-DRIVEN', gateway:false, tier:'A', vendor:'ISA', validity:0,
      cost:'ISA EC52 course + exam; specialist training', costNum:1600, cvValue:3000, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:8, roi:8, hours:[35,60],
      coverage:'Advanced Safety Integrity Level selection within the ISA/IEC 61511 lifecycle.', prerequisites:'ISA/IEC 61511 SIS Fundamentals Specialist plus the designated EC52 course.', studyMaterials:'ISA EC52/EC52V official training.',
      subjects:['SIL selection','Functional safety','Risk reduction'], skills:['Functional safety','Risk','OT engineering'], examFormat:'Required course plus certificate exam.', projectRec:'Perform a structured fictional SIL-selection exercise and document assumptions, risk reduction requirements and governance.',
      note:'Process-industry specialisation, not a general convergence requirement.', sourceUrl:'https://www.isa.org/certification/certificate-programs/safety-certificates', deps:['isa-61511-sis-fund']
    },
    {
      id:'isa-61511-sil-verify', name:'ISA/IEC 61511 SIL Verification Specialist', code:'SVS / EC54', phase:5, track:'ROLE-DRIVEN', gateway:false, tier:'A', vendor:'ISA', validity:0,
      cost:'ISA EC54 course + exam; specialist training', costNum:1600, cvValue:3000, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:8, roi:8, hours:[35,60],
      coverage:'Advanced design and Safety Integrity Level verification under ISA/IEC 61511.', prerequisites:'ISA/IEC 61511 SIS Fundamentals Specialist plus the designated EC54 course.', studyMaterials:'ISA EC54/EC54V official training.',
      subjects:['SIL verification','Functional safety design','Reliability'], skills:['Functional safety','OT engineering','Design'], examFormat:'Required course plus certificate exam.', projectRec:'Produce a fictional verification pack that explains assumptions, architecture, failure behaviour and required evidence.',
      note:'Process-industry specialisation, not a general convergence requirement.', sourceUrl:'https://www.isa.org/certification/certificate-programs/safety-certificates', deps:['isa-61511-sis-fund']
    },
    {
      id:'isa-61511-expert', name:'ISA/IEC 61511 SIS Expert', code:'SIS EXPERT', phase:5, track:'ROLE-DRIVEN', gateway:false, tier:'A', vendor:'ISA', validity:0,
      cost:'Automatic designation after all three specialist certificates', costNum:0, cvValue:4500, verifiedAt:'2026-09', employer:false, free:true, cpe:0, cpePeriod:0, difficulty:9, roi:8.5, hours:[0,0],
      coverage:'Automatic ISA expert designation after earning SIS Fundamentals, SIL Selection and SIL Verification specialist certificates.', prerequisites:'Hold all three ISA/IEC 61511 specialist certificates.', studyMaterials:'No extra exam beyond the three required certificates.',
      subjects:['Functional safety','SIS lifecycle','SIL selection','SIL verification'], skills:['Functional safety','OT engineering','Architecture'], examFormat:'No additional exam; designation is automatic after all three certificates.', projectRec:'No separate project; evidence should come from the three specialist stages and real process-industry work.',
      note:'Conditional process-safety capstone. Only activate this branch when the industry context makes SIS/SIL knowledge strategically useful.', sourceUrl:'https://www.isa.org/certification/certificate-programs/safety-certificates', deps:['isa-61511-sil-select','isa-61511-sil-verify']
    },
    {
      id:'bcs-arch-found', name:'BCS Foundation Certificate in Architecture Concepts and Domains', code:'BCS ARCH FOUNDATION', phase:4, track:'ARCHITECT', gateway:false, tier:'B', vendor:'BCS', validity:0,
      cost:'£200 exam + VAT in the UK; training optional', costNum:240, cvValue:2200, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:5, roi:7, hours:[18,40],
      coverage:'Architecture concepts, domains, viewpoints, stakeholders, development processes and artefacts used as a foundation for later specialist/practitioner architecture study.', prerequisites:'No formal entry requirement.',
      studyMaterials:'BCS syllabus, specimen paper and accredited/self-study materials.', subjects:['Architecture fundamentals','Architecture domains','Stakeholders','Viewpoints','Architecture artefacts'], skills:['Architecture','Requirements','Stakeholder communication'],
      examFormat:'One-hour closed-book exam with 40 multiple-choice questions; current pass mark 65%.', projectRec:'Produce a lightweight architecture pack with context, stakeholder concerns, viewpoints, constraints and decision records.',
      note:'Useful structured architecture foundation. BCS explicitly positions specialist architecture awards or the Practitioner certificate as the next steps.', sourceUrl:'https://www.bcs.org/qualifications-and-certifications/certifications-for-professionals/it-architecture/bcs-foundation-certificate-in-architecture-concepts-and-domains/', deps:[]
    },
    {
      id:'bcs-arch-solution', name:'BCS Specialist Architecture Award — Solution Architecture', code:'BCS SOLUTION ARCH AWARD', phase:4, track:'ARCHITECT', gateway:false, tier:'B', vendor:'BCS', validity:0,
      cost:'£110 exam + VAT in the UK; training optional', costNum:132, cvValue:1800, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:5, roi:8, hours:[17,35],
      coverage:'Solution-architecture role, problem/risk/opportunity analysis, cross-domain relationships, requirements/constraints, governance and change-management techniques.', prerequisites:'BCS Architecture Foundation or current TOGAF level 2; BCS recommends at least three years in IS/IT including some architecture involvement.',
      studyMaterials:'BCS Specialist Architecture Award syllabus, specimen paper and accredited/self-study materials.', subjects:['Solution architecture','Requirements','Constraints','Governance','Change'], skills:['Solution architecture','Requirements','Stakeholder communication','Governance'],
      examFormat:'30-minute closed-book exam with 20 multiple-choice questions; current pass mark 65%.', projectRec:'Turn a real or fictional technical problem into a solution-architecture pack with requirements, options, constraints, risks, recommendation and governance decisions.',
      note:'A strong intermediate rung between Architecture Foundation and broader Practitioner study when solution-design responsibility is beginning.', sourceUrl:'https://www.bcs.org/qualifications-and-certifications/certifications-for-professionals/it-architecture/bcs-specialist-architecture-awards/', deps:['bcs-arch-found']
    },
    {
      id:'bcs-arch-security', name:'BCS Specialist Architecture Award — Security Architecture', code:'BCS SECURITY ARCH AWARD', phase:4, track:'ARCHITECT', gateway:false, tier:'B', vendor:'BCS', validity:0,
      cost:'£110 exam + VAT in the UK; training optional', costNum:132, cvValue:2000, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:5, roi:8.5, hours:[17,35],
      coverage:'Security architecture role, relationships to other architecture domains, security-architect skills/activities, governance and decision-making.', prerequisites:'BCS Architecture Foundation or current TOGAF level 2; BCS recommends at least three years in IS/IT including some architecture involvement.',
      studyMaterials:'BCS Specialist Architecture Award syllabus, specimen paper and accredited/self-study materials.', subjects:['Security architecture','Architecture governance','Cross-domain security design'], skills:['Security architecture','Governance','Risk','Stakeholder communication'],
      examFormat:'30-minute closed-book exam with 20 multiple-choice questions; current pass mark 65%.', projectRec:'Create a security-architecture view for the same multi-domain solution used in the portfolio project, including trust boundaries, threat assumptions, security principles and decisions.',
      note:'High knowledge fit for a security/convergence architect, but should be taken when architecture involvement is real enough to make the concepts stick.', sourceUrl:'https://www.bcs.org/qualifications-and-certifications/certifications-for-professionals/it-architecture/bcs-specialist-architecture-awards/', deps:['bcs-arch-found']
    },
    {
      id:'bcs-arch-cloud', name:'BCS Specialist Architecture Award — Cloud Infrastructure Architecture', code:'BCS CLOUD INFRA ARCH AWARD', phase:4, track:'OPTIONAL', gateway:false, tier:'B', vendor:'BCS', validity:0,
      cost:'£110 exam + VAT in the UK; training optional', costNum:132, cvValue:1600, verifiedAt:'2026-09', employer:false, free:false, cpe:0, cpePeriod:0, difficulty:5, roi:7.5, hours:[17,35],
      coverage:'Cloud infrastructure architecture role, its relationship to other domains, key activities, skills/knowledge and governance.', prerequisites:'BCS Architecture Foundation or current TOGAF level 2; BCS recommends at least three years in IS/IT including some architecture involvement.',
      studyMaterials:'BCS Specialist Architecture Award syllabus, specimen paper and accredited/self-study materials.', subjects:['Cloud infrastructure architecture','Governance','Cross-domain cloud design'], skills:['Cloud architecture','Infrastructure architecture','Governance'],
      examFormat:'30-minute closed-book exam with 20 multiple-choice questions; current pass mark 65%.', projectRec:'Extend the portfolio architecture with hybrid cloud connectivity, identity, resilience, private connectivity and operational governance.',
      note:'Optional specialist branch. Useful if cloud infrastructure becomes a substantial architecture responsibility; otherwise AZ-305/SC-100 already provide strong coverage.', sourceUrl:'https://www.bcs.org/qualifications-and-certifications/certifications-for-professionals/it-architecture/bcs-specialist-architecture-awards/', deps:['bcs-arch-found']
    }
  ];

  additions.forEach(cert => { if (!existing.has(cert.id)) { CERTS.push(cert); existing.add(cert.id); } });

  // Correct legacy records whose programme status or wording changed after the original catalogue was authored.
  const byId = Object.fromEntries(CERTS.map(cert => [cert.id, cert]));
  if(byId['az-700'])Object.assign(byId['az-700'],{
    name:'Microsoft Certified: Azure Network Engineer Associate',
    sourceUrl:'https://learn.microsoft.com/en-us/credentials/certifications/azure-network-engineer-associate/',
    note:'Cloud-networking specialisation connecting networking foundations with Azure administration, security and architecture. Study after AZ-104; overlap does not imply a fixed reduction in study time. Verify current exam requirements and regional pricing before booking.'
  });
  if (byId['google-cyber']) {
    byId['google-cyber'].note = 'QUICK-WIN bridge before Security+. Google states that graduates can access additional Security+ training and a discounted exam opportunity; verify the current discount/offer before purchase rather than assuming a fixed percentage. Prioritise the Linux, SIEM, packet-analysis and Python-for-security content and do not let this displace deeper networking/security study.';
  }
  if (byId['pcpp2']) {
    Object.assign(byId['pcpp2'], {
      validity:60,
      cost:'Exam from $295 when released', costNum:225, verifiedAt:'2026-09', pending:true,
      examFormat:'Exam PCPP-32-201 is currently listed by Python Institute as in development. Do not book until the vendor marks the exam available.',
      note:'Future general-purpose Python capstone. The published syllabus covers testing, design patterns, multiprocessing/IPC, network programming, SQL/NoSQL and clean-code/maintenance topics, but the current PCPP-32-201 exam remains in development as of September 2026.'
    });
  }
  if (byId['bcs-esa']) {
    Object.assign(byId['bcs-esa'], {
      prerequisites:'Must hold BCS Foundation Certificate in Architecture Concepts and Domains or a current TOGAF 9/10 Level 2 certification. BCS also advises substantial architecture experience before Practitioner study.',
      examFormat:'Current BCS Practitioner syllabus uses a closed-book multiple-choice assessment; verify the active syllabus/version and delivery format before booking.',
      note:'Experience-aware architecture progression. BCS Foundation is a formal route into this credential; relevant Specialist Architecture Awards can be used between Foundation and Practitioner to deepen solution/security/cloud architecture without treating every specialist award as mandatory.'
    });
  }
})();
