// Career opportunity taxonomy and transparent, browser-local comparisons.
(function(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT?.careerFramework)return;
  const cyber='https://www.ukcybersecuritycouncil.org.uk/careers-in-cyber/cyber-career-framework';
  const ncs='https://nationalcareers.service.gov.uk/job-profiles/';
  const family=(label,skills,archetype,source,tasks)=>Object.freeze({label,skills:skills.split(' '),archetype,source,tasks});
  const FAMILIES=Object.freeze({
    infrastructure:family('Infrastructure & IT operations','windows enterpriseInfra linux resilience networking','cloudEngineering',ncs+'network-engineer',[['infra-ad-dns-pki','Troubleshoot identity, DNS and operating-system dependencies'],['infra-ha-dr','Test backup, recovery and service continuity'],['ops-change','Deliver a controlled infrastructure change with rollback']]),
    network:family('Networking & network security','networking routing firewall wireless hybridNetwork','cloudEngineering',ncs+'network-engineer',[['network-routed-topology','Build and validate a routed and switched network'],['network-breakfix','Diagnose a network fault from packet and device evidence'],['security-segmentation','Implement and test segmentation, firewall policy and remote access']]),
    cloud:family('Cloud & platform engineering','cloud azure aws automation iac containers linux','cloudEngineering',ncs+'network-engineer',[['cloud-hybrid-network','Build a resilient cloud workload and explain its network flows'],['automation-infrastructure','Version and test infrastructure automation'],['platform-operations','Operate monitoring, deployment, cost and recovery controls']]),
    defence:family('Security operations & investigation','soc siem incident threat vulnerability networking','securityOperations',cyber,[['security-monitoring','Investigate a realistic alert and produce a defensible timeline'],['detection-quality','Write and tune a detection with false-positive analysis'],['incident-recovery','Contain an incident and validate recovery']]),
    identity:family('Identity & access management','iam zeroTrust pki accessIdentity cloud','identitySecurity',cyber,[['cloud-identity-flow','Trace authentication, federation and authorisation end to end'],['identity-lifecycle','Implement joiner/mover/leaver and access review controls'],['identity-recovery','Test privileged-access controls and identity recovery']]),
    appsec:family('Application, product & AI security','automation python apiIntegration containers aiSecurity offensive','appPlatformSecurity',cyber,[['offensive-api','Threat-model and remediate an application or API weakness'],['appsec-pipeline','Implement tested pipeline, dependency and secrets controls'],['ai-security-governance','Assess data, model/API and software supply-chain risks']]),
    governance:family('Governance, risk & privacy','governance privacy architecture commercial','governanceRisk',cyber,[['risk-assurance','Produce an asset-based risk assessment with defensible controls'],['audit-evidence','Collect and challenge audit evidence against requirements'],['risk-stakeholders','Explain residual risk and obtain accountable decisions']]),
    physical:family('Physical-security systems','physical vms access networking enterpriseInfra apiIntegration','physicalSecurity',ncs+'network-engineer',[['physical-vms-breakfix','Troubleshoot device, VMS, server and network faults end to end'],['physical-interoperability','Integrate VMS/access-control events across systems'],['physical-access-architecture','Document a secure, supportable system design and acceptance test']]),
    industrial:family('OT, industrial & building systems','ot otEngineering industrialProtocols networking resilience physical','otSecurity',cyber,[['ot-protocols','Explain captured industrial-protocol traffic and process impact'],['ot-segmentation','Design and validate industrial zones and conduits'],['ot-risk-assessment','Assess OT risk without compromising safety or availability']]),
    offensive:family('Offensive security & research','offensive pentest vulnerability linux python networking','offensiveSecurity',cyber,[['offensive-ad-path','Demonstrate a scoped attack path in an authorised environment'],['offensive-lateral','Explain prevention, detection and containment for the attack'],['offensive-report','Deliver actionable findings and verify remediation']]),
    software:family('Software, automation & integration','python automation apiIntegration linux database','appPlatformSecurity',ncs+'software-developer',[['software-delivery','Deliver a tested, version-controlled application or automation'],['automation-api-integration','Handle API authentication, errors and structured data'],['software-support','Debug, document and support software used by someone else']]),
    data:family('Data & geospatial systems','data database python apiIntegration architecture','cloudEngineering',ncs+'data-analyst-statistician',[['data-quality','Validate data quality and explain transformations'],['data-delivery','Deliver a reproducible analysis, pipeline or GIS service'],['data-governance','Document access, retention and recovery for the data']]),
    customer:family('Customer-facing technical & commercial','commercial apiIntegration architecture networking cloud','commercialTechnical',ncs+'network-engineer',[['architecture-stakeholders','Run technical discovery and explain trade-offs'],['customer-delivery','Deliver a customer demonstration, adoption plan or implementation'],['commercial-outcomes','Document customer outcomes, constraints and commercial assumptions']]),
    leadership:family('Architecture, delivery & leadership','architecture leadership commercial governance resilience','architectureConsulting',cyber,[['architecture-hld-lld','Defend a requirements-led design or delivery plan'],['architecture-bom-tco','Explain cost, risk, lifecycle and prioritisation decisions'],['architecture-ownership','Own delivery outcomes and coordinate stakeholders']])
  });
  // IDs remain stable for existing saved filters. Stage sets an evidence target,
  // not a universal seniority rank or a claim about the entry level of every vacancy.
  const rows=[
    ['career-support','infrastructure','IT Support Engineer','Diagnose user and service incidents and document repeatable fixes','a-plus network-plus',1],
    ['career-systems','infrastructure','Systems Engineer','Operate servers, identity, storage and resilient services','az-802 server-plus az-104',2],
    ['career-linux','infrastructure','Linux Systems Administrator','Maintain Linux services, permissions, observability and recovery','linux-plus autoops-plus',2],
    ['career-m365','infrastructure','Microsoft 365 Engineer','Administer tenant services, endpoint integrations and identity','sc-300 sc-401 sc-900',2],
    ['career-network','network','Network Engineer','Configure and troubleshoot enterprise routing, switching and connectivity','network-plus ccna ccnp-enterprise',2],
    ['career-netsec','network','Network Security Engineer','Implement and operate firewall, VPN and segmentation controls','ccna pan-ngfw-eng nse-4 security-plus',2],
    ['career-wireless','network','Wireless Network Engineer','Survey, design and troubleshoot wireless coverage and capacity','ccna ccnp-enterprise',2],
    ['career-cloud','cloud','Cloud Engineer','Deploy and support secure, resilient cloud workloads','az-104 aws-saa gcp-ace',2],
    ['career-devops','cloud','DevOps Engineer','Build reliable delivery pipelines and infrastructure automation','terraform az-400 aws-dop autoops-plus',2],
    ['career-sre','cloud','Site Reliability Engineer','Engineer service reliability, observability and incident improvement','linux-plus terraform cka',2],
    ['career-platform','cloud','Platform Engineer','Provide reusable developer platforms and safe deployment paths','terraform cka az-400',2],
    ['career-soc','defence','SOC Analyst','Triage alerts, investigate activity and escalate with useful evidence','security-plus cysa-plus btl1 sc-200',1],
    ['career-security','defence','Cyber Security Engineer','Implement and support security controls across systems','security-plus cysa-plus sc-200',2],
    ['pv-a-cloudsoc','defence','SOC Analyst — cloud specialism','Investigate cloud, identity and workload telemetry','sc-200 cysa-plus aws-security-specialty',2],
    ['pv-c-detection','defence','Detection Engineer','Build, validate and maintain detections and telemetry pipelines','gcda splunk-scda btl2',2],
    ['pv-c-ir','defence','Incident Response Analyst','Scope incidents, preserve evidence and coordinate containment','gcih gcfa btl2',2],
    ['pv-a-ir','defence','Digital Forensics Analyst — cloud specialism','Reconstruct cloud incidents and document evidence limitations','gcfa aws-security-specialty sc-200',2],
    ['pv-c-cti','defence','Threat Intelligence Analyst','Turn adversary information into defensive decisions','cysa-plus mad security-plus',2],
    ['pv-b-insider','defence','Insider Risk Analyst','Investigate insider risk with proportionate technical and governance controls','gcfa sc-300 crisc',2],
    ['pv-b-cpsoc','defence','SOC Analyst — OT specialism','Investigate industrial telemetry with process-impact awareness','gicsp grid sc-200',2],
    ['career-vuln','defence','Vulnerability Management Analyst','Prioritise vulnerabilities and verify remediation with service owners','cysa-plus security-plus pentest-plus',2],
    ['pv-a-iam','identity','Identity & Access Management Engineer','Implement federation, lifecycle, access governance and authentication','sc-300 sc-900 security-plus',2],
    ['career-pam','identity','Privileged Access Management Engineer','Implement privileged-session, credential and least-privilege controls','sc-300 hashicorp-vault',2],
    ['pv-c-appsec','appsec','Application Security Engineer','Help developers prevent and remediate application vulnerabilities','bscp csslp oswe pcap',2],
    ['pv-a-devsecops','appsec','DevSecOps Engineer','Integrate effective security controls into software delivery','az-400 terraform hashicorp-vault cks',2],
    ['pv-a-ai','appsec','AI Security Engineer','Threat-model AI systems and validate data, model and runtime controls','secai-plus caisp gaips',2],
    ['pv-a-k8s','appsec','Platform Security Engineer — Kubernetes specialism','Secure cluster identities, workloads, networks and supply chains','cka kcsa cks',2],
    ['pv-top-platform','appsec','Security Platform Engineer','Build and automate shared security tooling and telemetry services','sc-200 terraform az-400',2],
    ['pv-a-data','appsec','Data Security Engineer','Protect data stores, encryption, access and lifecycle controls','sc-401 cdpse ccsp',2],
    ['pv-c-grc','governance','Governance, Risk & Compliance Analyst','Assess controls and track evidence-led risk treatment','cismp iso-27001-li crisc',1],
    ['career-auditor','governance','IT Auditor','Test technology controls and communicate supported audit findings','cisa iso-27001-li',2],
    ['pv-a-privacy','governance','Privacy Engineer','Translate privacy requirements into technical data-lifecycle controls','cdpse cipp-e cipm',2],
    ['career-privacy','governance','Privacy Analyst','Support privacy assessments, records and operational governance','cipp-e cipm',1],
    ['career-physical-support','physical','Physical Security Systems Support Engineer','Diagnose and support networked video and access-control systems','mcit acp network-plus',1],
    ['career-integration','physical','Security Systems Integration Engineer','Integrate video, access, identity and enterprise systems','mcie lcp genetec-sc-ent',2],
    ['career-physical-design','physical','Security Systems Design Engineer','Translate requirements into VMS/PACS design and acceptance criteria','mcde lcda asis-psp',2],
    ['pv-b-se','customer','Solutions Engineer — physical security','Discover needs and demonstrate integrated physical-security solutions','mcde acp lcp',2],
    ['pv-b-otics','industrial','OT Cyber Security Engineer','Secure industrial networks without compromising process operations','iec-62443-cfs gicsp grid',2],
    ['career-industrial-network','industrial','Industrial Network Engineer','Deliver resilient connectivity for industrial control systems','ccna isa95-fund iec-62443-cfs',2],
    ['pv-b-smartbuilding','industrial','Building Systems Integration Engineer','Integrate and secure building controls, IoT and enterprise networks','network-plus isa95-fund iec-62443-cfs',2],
    ['career-controls','industrial','Control Systems Engineer','Develop and validate PLC/HMI control logic with process and safety discipline','isa-cap-associate isa95-fund',2],
    ['pv-c-offensive','offensive','Penetration Tester','Test authorised systems and report actionable remediation','pnpt htb-cpts oscp',2],
    ['pv-c-redteam','offensive','Red Team Operator','Exercise adversary scenarios to evaluate organisational defences','crto osep oscp',3],
    ['pv-c-malware','offensive','Malware Analyst / Reverse Engineer','Analyse malicious code and derive useful defensive findings','grem osed linux-plus',3],
    ['pv-top-embed','offensive','Embedded Systems Security Engineer','Assess firmware, device protocols and hardware trust boundaries','linux-plus osed security-plus',3],
    ['pv-b-pentest','offensive','Physical Security Penetration Tester','Evaluate authorised physical intrusion and blended attack scenarios','asis-psp pentest-plus network-plus',2],
    ['career-python','software','Python Developer','Deliver maintainable Python applications, services and tests','pcep pcap pcpp1',2],
    ['career-automation','software','IT Automation Engineer','Automate operational tasks with safe failure handling and testing','autoops-plus pcap terraform',2],
    ['career-api','software','Integration Developer','Build and support reliable authenticated API and data integrations','pcap hashicorp-vault',2],
    ['career-test','software','Test Automation Engineer','Build repeatable tests and diagnose failures in delivery pipelines','pcap az-400',2],
    ['career-game','software','Game / XR Developer','Deliver an interactive prototype with performance and usability evidence','pcep pcap',2],
    ['career-data-analyst','data','Data Analyst','Answer business questions through reproducible analysis and visualisation','pcep pcap',1],
    ['career-data-engineer','data','Data Engineer','Build reliable data ingestion, transformation and quality controls','pcap az-104',2],
    ['career-gis','data','GIS Analyst','Analyse spatial data and communicate defensible geospatial results','arcgis-foundation arcgis-associate',1],
    ['career-gis-dev','data','Geospatial Developer','Build and support mapping applications and spatial APIs','arcgis-foundation pcap arcgis-py-api',2],
    ['career-gis-admin','data','GIS Platform Administrator','Operate GIS services, access, capacity and recovery','esri-ent-prof esri-system-design',2],
    ['pv-a-se','customer','Solutions Engineer — cloud security','Translate customer requirements into demonstrable cloud-security solutions','az-104 ccsp aws-saa',2],
    ['pv-c-se','customer','Solutions Engineer — cybersecurity','Discover requirements and demonstrate appropriate security solutions','security-plus pan-ngfw-eng crowdstrike-ccf',2],
    ['career-vendor-support','customer','Technical Support Engineer — vendor products','Resolve complex customer product incidents and feed back defects','network-plus security-plus acp',1],
    ['career-services','customer','Professional Services Consultant','Implement customer solutions and deliver a supportable handover','az-104 mcie prince2-prac',2],
    ['pv-top-tam','customer','Technical Account Manager','Own technical adoption, escalations and customer-success plans','itil-4-foundation az-104',2],
    ['pv-top-ae','customer','Enterprise Account Executive','Own qualification, commercial negotiation and a sales pipeline','meddic-found meddpicc-master',2],
    ['pv-b-consultancy','leadership','Security Consultant','Assess security needs and defend practical recommendations','cismp iso-27001-li cissp',2],
    ['pv-top-csa','leadership','Cloud Solutions Architect','Defend cloud designs across cost, resilience, identity and migration','az-305 aws-sap gcp-pca',3],
    ['career-security-architect','leadership','Security Architect','Own security design decisions and organisational control patterns','cissp issap sc-100',3],
    ['pv-top-pm','leadership','Security Product Manager','Prioritise product outcomes using customer, engineering and risk evidence','pragmatic-pmc pragmatic-pcpm',3],
    ['career-service-manager','leadership','IT Service Delivery Manager','Manage service outcomes, suppliers, incidents and improvement','itil-4-foundation prince2-prac',3],
    ['career-engineering-manager','leadership','Engineering Manager','Lead people, technical delivery and sustainable team performance','prince2-prac itil-4-foundation',3],
    ['pv-b-crisis','leadership','Business Continuity & Resilience Manager','Coordinate continuity, crisis exercises and validated recovery','crisc iso-27001-li prince2-prac',3],
    ['pv-top-ma','leadership','Cybersecurity Due Diligence Consultant','Assess technology risk and integration implications in transactions','cisa crisc cissp',3]
  ];
  const ROLES=Object.freeze(rows.map(([id,family,title,mission,certs,stage])=>Object.freeze({id,family,title,mission,certs:certs.split(' '),stage,source:family==='data'&&/GIS|Geospatial/.test(title)?'https://www.esriuk.com/en-gb/what-is-gis/careers':FAMILIES[family].source})));
  const CONTEXTS=Object.freeze({'pv-b-cni':'Sector: Critical national infrastructure','pv-top-finsec':'Sector: Financial services','pv-top-cleared':'Eligibility: Security-cleared work','pv-top-contractor':'Work model: Contracting'});
  const LEVELS=Object.freeze({UNKNOWN:0,NONE:0,LAB:25,USED:55,DESIGNED:80,OWNED:100});
  const byId=id=>ROLES.find(r=>r.id===id);
  function prefs(){const p=state.customization?.careerOptions;return p&&typeof p==='object'?p:{};}
  function update(patch){const next={...prefs(),...patch};const validation=CT.storage?.validateBackup({version:CT.version.backup,customization:{careerOptions:next}});if(validation&&!validation.ok)throw new Error(validation.errors.join(' '));CT.storage?.captureUndoPoint('career preferences');state.customization={...state.customization,careerOptions:{...prefs(),...patch}};if(patch.evidence&&CT.storage){for(const [id,level]of Object.entries(patch.evidence)){if(level==='UNKNOWN')delete state.capabilityEvidence[id];else state.capabilityEvidence[id]={...state.capabilityEvidence[id],level,updatedAt:new Date().toISOString()};}CT.storage.persistAll();}else save.customization();CT.events.emit('career-options-changed',{});CT.events.emit('state-saved',{key:'customization',at:new Date().toISOString()});}
  function requirements(role){return [...FAMILIES[role.family].tasks.map(([id,label])=>({id,label})),{id:`role:${role.id}`,label:role.mission}].map(r=>({...r,target:role.stage===1?'LAB':role.stage===3?'DESIGNED':'USED'}));}
  function evidenceLevel(id,p=prefs()){const shared=state.capabilityEvidence?.[id]?.level;const own=p.evidence?.[id];return Object.hasOwn(LEVELS,shared)?shared:Object.hasOwn(LEVELS,own)?own:'UNKNOWN';}
  function assess(role,p=prefs()){
    const f=FAMILIES[role.family],background=byId(p.background),ctx=CT.careerFramework.context();
    const weights=background?Object.fromEntries(FAMILIES[background.family].skills.map(k=>[k,1])):CT.careerFramework.ROLE_PROFILES[ctx.current]?.weights||{};
    const overlap=Math.round(f.skills.reduce((s,k)=>s+Math.min(1,weights[k]||0),0)/f.skills.length*100);
    const certs=role.certs.map(id=>CERTS.find(c=>c.id===id)).filter(Boolean),passed=certs.filter(c=>CT.credentials?CT.credentials.active(c):state.passes?.[c.id]),credential=certs.length?Math.round(passed.length/certs.length*100):0;
    const vote=p.interests?.[role.id]??p.families?.[role.family],interest=[0,50,100].includes(vote)?vote:null;
    const compatibility=Math.round(interest===null?overlap*.75+credential*.25:overlap*.6+credential*.2+interest*.2);
    const req=requirements(role).map(r=>{const level=evidenceLevel(r.id,p);return {...r,level,coverage:Math.min(100,LEVELS[level]/LEVELS[r.target]*100)};});
    const recorded=req.filter(r=>r.level!=='UNKNOWN').length,readiness=recorded?Math.round(req.reduce((s,r)=>s+r.coverage*(r.id.startsWith('role:')?.5:1/6),0)):null;
    const gaps=req.filter(r=>r.coverage<100),status=p.eligibility?.[role.id]==='ineligible'?'Eligibility barrier':!recorded?'Not assessed':!gaps.length?'Compare vacancies':readiness>=60?'Close evidence gaps':readiness>=25?'Build next':'Explore / build evidence';
    return {role,overlap,credential,interest,compatibility,provisional:interest===null,readiness,recorded,requirements:req,gaps,status,passed:passed.length,totalCerts:certs.length,shortlisted:!!p.shortlist?.[role.id],background:background?.title||CT.careerFramework.ROLE_PROFILES[ctx.current]?.label||'Unspecified'};
  }
  const normal=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const ALIASES={'career-gis':['gis analyst','geospatial analyst','geographic information systems analyst'],'pv-a-iam':['iam engineer','identity engineer','identity and access management engineer'],'career-support':['it support engineer','systems support engineer','technical support engineer'],'pv-c-se':['cybersecurity engineer','cyber security engineer']};
  function matchesTitle(role,value){const text=' '+normal(value)+' ';return [role.title,...(ALIASES[role.id]||[])].some(alias=>{const tokens=normal(alias).split(' ').filter(x=>!['and','the'].includes(x));return tokens.every(token=>text.includes(' '+token+' '));});}
  function market(role,feed,now=Date.now()){
    const age=now-Date.parse(feed?.lastSuccessfulFetchAt||feed?.fetchedAt),fresh=Number.isFinite(age)&&age>=-60000&&age<=15*60000&&!feed?.refreshError&&['live','ready','ok'].includes(feed?.status);
    const title=normal(role.title),seen=new Set();
    const jobs=(feed?.jobs||[]).filter(j=>{const key=j.id||j.url;if(!key||seen.has(key))return false;const created=Date.parse(j.created),recent=Number.isFinite(created)&&now-created>=-60000&&now-created<=30*86400000;const p=prefs(),locationOk=!p.location||normal(j.location).includes(normal(p.location)),modeOk=!p.workMode||p.workMode==='any'||j.workMode===p.workMode||p.workMode==='remote'&&j.remote===true;if(!locationOk||!modeOk||!recent||!matchesTitle(role,j.title))return false;seen.add(key);return true;});
    const salaries=jobs.map(j=>{const lo=Number(j.salaryMin),hi=Number(j.salaryMax);return lo>0&&hi>=lo&&hi<300000&&(j.currency==='GBP'||feed?.country==='gb')&&(j.salaryPeriod==='year'||j.salaryPeriod==='annual')?(lo+hi)/2:null;}).filter(Boolean).sort((a,b)=>a-b);
    return {usable:fresh,count:fresh?jobs.length:null,jobs:fresh?jobs:[],label:!fresh?'Market evidence unavailable':jobs.length?'Observed in this feed sample':'No matching sample — demand unknown',salary:fresh&&salaries.length>=3?Math.round((salaries[Math.floor((salaries.length-1)/2)]+salaries[Math.floor(salaries.length/2)])/2):null,salarySamples:salaries.length,checkedAt:feed?.fetchedAt||null};
  }
  function learning(role){return role.certs.map(id=>CERTS.find(c=>c.id===id)).filter(c=>c&&(CT.credentials?CT.credentials.availability(c).eligible:!['RETIRED','IN_DEVELOPMENT','UNCONFIRMED'].includes(CT.sourceRegistry?.[c.id]?.credentialStatus)));}
  function options({family='all',search='',shortlist=false,sort='compatibility'}={}){const p=prefs(),q=normal(search);return ROLES.map(r=>assess(r,p)).filter(x=>(family==='all'||x.role.family===family)&&(!shortlist||x.shortlisted)&&(!q||normal(`${x.role.title} ${x.role.mission} ${FAMILIES[x.role.family].label}`).includes(q))).sort((a,b)=>sort==='title'?a.role.title.localeCompare(b.role.title):sort==='readiness'?(b.readiness??-1)-(a.readiness??-1)||b.compatibility-a.compatibility:b.compatibility-a.compatibility||(b.readiness??-1)-(a.readiness??-1));}
  CT.careerOptions=Object.freeze({FAMILIES,ROLES,CONTEXTS,LEVELS,byId,prefs,update,requirements,evidenceLevel,assess,market,matchesTitle,learning,options});
  // Normalise every filter label, keeping all saved IDs and legacy memberships.
  const original=global.getFilterDefs;
  if(original)global.getFilterDefs=function(){const defs=original(),all=[...defs.filters,...Object.values(defs.filterGroups).flatMap(g=>g.chips||[])],prior=new Map(all.map(x=>[x.id,x]));
    const filters=defs.filters.filter(x=>!x.groupToggle&&!byId(x.id)&&!CONTEXTS[x.id]),filterGroups={};
    for(const [id,f]of Object.entries(FAMILIES)){const group=`career-${id}`;filters.push({id:`group-${group}`,label:`${f.label} ▾`,groupToggle:group});filterGroups[group]={label:f.label,chips:ROLES.filter(r=>r.family===id).map(r=>({...prior.get(r.id),id:r.id,label:r.title,test:prior.get(r.id)?.test||((c)=>r.certs.includes(c.id))}))};}
    const contexts=Object.entries(CONTEXTS).filter(([id])=>prior.has(id)).map(([id,label])=>({...prior.get(id),label}));
    if(contexts.length){filters.push({id:'group-career-contexts',label:'Sectors, eligibility & work models ▾',groupToggle:'career-contexts'});filterGroups['career-contexts']={label:'Sectors, eligibility & work models',chips:contexts};}
    return {filters,filterGroups};};
})(window);
