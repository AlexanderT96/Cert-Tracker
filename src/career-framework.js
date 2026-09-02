// Cert Tracker — generic role-aware career and knowledge ROI framework.
// Privacy boundary: this module contains reusable scoring logic and generic role
// profiles only. It must never contain a named user's employer, history, salary,
// weaknesses, private priorities or personalised score overrides.
(function initCareerFramework(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT?.competency) throw new Error('competency-engine.js must load before career-framework.js');

  const STORAGE = Object.freeze({currentRole:'ct4-career-current-role',nextRole:'ct4-career-next-role',targetRole:'ct4-career-target-role'});

  const ROLE_PROFILES = Object.freeze({
    generalIT:Object.freeze({label:'General IT / Systems Support',weights:{windows:1,enterpriseInfra:.7,networking:.9,linux:.55,cloud:.55,iam:.45,firewall:.4,automation:.35,vms:.2,physical:.15}}),
    physicalSupport:Object.freeze({label:'Physical Security Systems Support',weights:{vms:1,physical:1,networking:.9,windows:.75,enterpriseInfra:.65,access:.65,firewall:.5,apiIntegration:.35,cloud:.4,automation:.3}}),
    physicalSystemsEngineer:Object.freeze({label:'Physical Security Systems Engineer / Integrator',weights:{vms:1,physical:1,access:.85,accessIdentity:.55,networking:.9,enterpriseInfra:.75,firewall:.55,apiIntegration:.6,architecture:.4,aiSystems:.35}}),
    network:Object.freeze({label:'Network Engineer',weights:{networking:1,routing:1,firewall:.65,hybridNetwork:.55,wireless:.55,automation:.45,linux:.35,architecture:.3}}),
    networkSecurity:Object.freeze({label:'Network Security Engineer',weights:{networking:1,routing:.9,firewall:1,hybridNetwork:.55,linux:.55,enterpriseInfra:.5,cloud:.5,iam:.45,automation:.5,offensive:.45,incident:.4,architecture:.35}}),
    cyber:Object.freeze({label:'Cyber Security Engineer',weights:{networking:.7,firewall:.75,soc:1,siem:.9,incident:.9,threat:.9,vulnerability:.75,offensive:.65,iam:.65,linux:.6,automation:.55,cloud:.5}}),
    otSecurity:Object.freeze({label:'OT / ICS Security Engineer',weights:{ot:1,otEngineering:.65,industrialProtocols:.6,networking:.9,firewall:.85,architecture:.7,incident:.6,governance:.6,automation:.45,physical:.35}}),
    convergenceEngineer:Object.freeze({label:'Convergence / Integration Engineer',weights:{physical:.85,vms:.8,access:.65,networking:.9,firewall:.8,enterpriseInfra:.65,cloud:.55,iam:.5,apiIntegration:.7,automation:.6,ot:.75,otEngineering:.55,architecture:.55}}),
    convergence:Object.freeze({label:'OT / Physical-Cyber Convergence Architect',weights:{architecture:1,commercial:.7,ot:1,otEngineering:.85,industrialProtocols:.7,networking:.9,routing:.7,firewall:.85,enterpriseInfra:.65,physical:.8,vms:.7,access:.65,cloud:.65,hybridNetwork:.6,iam:.6,automation:.55,apiIntegration:.55,governance:.55,aiSystems:.45}}),
    solutionsArchitect:Object.freeze({label:'Solutions / Security Architect',weights:{architecture:1,commercial:.75,networking:.75,firewall:.8,enterpriseInfra:.65,cloud:.75,hybridNetwork:.65,iam:.7,governance:.65,automation:.5,apiIntegration:.5,ot:.45,physical:.45}}),
    principalConvergence:Object.freeze({label:'Principal OT-Convergence Architect',weights:{architecture:1,commercial:.9,leadership:.85,ot:1,otEngineering:.9,networking:.9,firewall:.9,enterpriseInfra:.75,physical:.8,cloud:.7,iam:.65,automation:.6,apiIntegration:.6,governance:.75,aiSystems:.55}}),
    securityArchitect:Object.freeze({label:'Security Architect',weights:{architecture:1,commercial:.6,networking:.75,firewall:.8,cloud:.75,iam:.75,zeroTrust:.65,governance:.7,ot:.45,automation:.4}}),
    cloudArchitect:Object.freeze({label:'Cloud Security Architect',weights:{architecture:1,cloud:1,azure:.85,aws:.75,hybridNetwork:.85,iam:1,zeroTrust:.8,networking:.65,automation:.8,iac:.75,containers:.55,governance:.45}})
  });

  const VALUE_OVERRIDES = Object.freeze({
    'a-plus':{market:5,knowledge:6}, 'network-plus':{market:7,knowledge:7.5}, 'ccna':{market:8,knowledge:9.5},
    'ccnp-enterprise':{market:8.5,knowledge:9.5}, 'ccie-enterprise':{market:9.5,knowledge:10},
    'security-plus':{market:8,knowledge:7}, 'cysa-plus':{market:7,knowledge:8}, 'linux-plus':{market:6.5,knowledge:8.5},
    'google-cyber':{market:4,knowledge:6}, 'pcep':{market:3.5,knowledge:7}, 'pcap':{market:4.5,knowledge:8.5},
    'pcpp1':{market:5,knowledge:9}, 'pcpp2':{market:5.5,knowledge:9.5},
    'az-900':{market:5,knowledge:5.5}, 'ai-901':{market:4.5,knowledge:6.5}, 'az-104':{market:8,knowledge:8.5}, 'az-305':{market:8.5,knowledge:9},
    'az-802':{market:7.5,knowledge:9}, 'sc-900':{market:5,knowledge:6}, 'sc-200':{market:7.5,knowledge:8},
    'sc-300':{market:7.5,knowledge:8}, 'sc-500':{market:8,knowledge:9}, 'sc-100':{market:8.5,knowledge:9},
    'acp':{market:6.5,knowledge:9}, 'mcit':{market:5.5,knowledge:8}, 'mcde':{market:6,knowledge:8.5}, 'mcie':{market:6,knowledge:9},
    'briefcam-tech':{market:5.5,knowledge:8}, 'arcules-csp':{market:4,knowledge:5},
    'pan-apprentice':{market:4.5,knowledge:6.5}, 'pan-practitioner':{market:6,knowledge:7.5}, 'pan-netsec-pro':{market:7.5,knowledge:8.5},
    'pan-ngfw-eng':{market:9,knowledge:9.5}, 'pan-cloudsec-pro':{market:8,knowledge:8.5}, 'pan-netsec-arch':{market:9,knowledge:9.5},
    'iec-62443-cfs':{market:8,knowledge:9}, 'iec-62443-cra':{market:8.5,knowledge:9.5}, 'iec-62443-cds':{market:8.5,knowledge:9.5},
    'iec-62443-cms':{market:8.5,knowledge:9.5}, 'iec-62443-expert':{market:9,knowledge:10}, 'isa95-fund':{market:7.5,knowledge:9.5},
    'isa-cap-associate':{market:6.5,knowledge:9}, 'isa-cap':{market:8.5,knowledge:9.5}, 'isa-apm':{market:6.5,knowledge:8.5},
    'isa-61511-sis-fund':{market:7,knowledge:9}, 'isa-61511-sil-select':{market:7.5,knowledge:9}, 'isa-61511-sil-verify':{market:7.5,knowledge:9}, 'isa-61511-expert':{market:8,knowledge:9.5},
    'gicsp':{market:9,knowledge:9}, 'grid':{market:8.5,knowledge:9}, 'ccsk':{market:7,knowledge:8}, 'ccsp':{market:9,knowledge:8.5},
    'cissp':{market:10,knowledge:8}, 'issap':{market:8,knowledge:9.5}, 'crisc':{market:8,knowledge:8}, 'sabsa-found':{market:7.5,knowledge:9},
    'bcs-arch-found':{market:6,knowledge:8}, 'bcs-arch-solution':{market:6.5,knowledge:8.5}, 'bcs-arch-security':{market:6.5,knowledge:9}, 'bcs-arch-cloud':{market:6,knowledge:8},
    'bcs-esa':{market:7,knowledge:9}, 'asis-psp':{market:8,knowledge:8.5}
  });

  const EXPERIENCE_GATED = new Set(['ccie-enterprise','cissp','issap','asis-psp','ukcsc-princ','ukcsc-chart','csyp','pan-netsec-arch','isa-cap','bcs-esa']);

  function selected(key, fallback) {const value = localStorage.getItem(STORAGE[key]);return value && ROLE_PROFILES[value] ? value : fallback;}
  function context() {return Object.freeze({current:selected('currentRole','generalIT'),next:selected('nextRole','cyber'),target:selected('targetRole','convergence')});}
  function setContext(update={}) {for (const [field,value] of Object.entries(update)) {const storageKey = STORAGE[field] || STORAGE[`${field}Role`];if (!storageKey) continue;if (!ROLE_PROFILES[value]) throw new Error(`Unknown role profile: ${value}`);localStorage.setItem(storageKey,value);}CT.events.emit('career-context-changed', context());return context();}

  function profileFit(cert, roleKey) {const role = ROLE_PROFILES[roleKey] || ROLE_PROFILES.generalIT;const comp = CT.competency.competencies(cert); let weighted=0,total=0;Object.entries(role.weights).forEach(([skill,w]) => { total += w; weighted += w * Number(comp[skill] || 0); });return total ? Math.round(weighted / total * 100) : 0;}
  function relevance10(cert, roleKey) { return Number((profileFit(cert,roleKey)/10).toFixed(1)); }

  function values(cert) {const override = VALUE_OVERRIDES[cert.id] || {};const market = CT.util.clamp(Number(override.market ?? cert.marketRoi ?? cert.roi ?? 5),0,10);let knowledge = override.knowledge ?? cert.knowledgeRoi;if (knowledge == null) {const practicalBoost = /lab|troubleshoot|configure|implement|design|hands-on|routing|firewall|server|incident/i.test([cert.coverage,cert.note,cert.projectRec].filter(Boolean).join(' ')) ? 1 : 0;knowledge = CT.util.clamp(Number(cert.roi ?? 5) + practicalBoost,0,10);}return Object.freeze({market:Number(market.toFixed(1)),knowledge:Number(Number(knowledge).toFixed(1))});}

  function timing(cert, ctx=context()) {if (state?.passes?.[cert.id]) return 'DONE';if (EXPERIENCE_GATED.has(cert.id) || cert.track === 'POST-PLAN') return 'T3';const c = relevance10(cert,ctx.current), n = relevance10(cert,ctx.next), e = relevance10(cert,ctx.target);const depsDone = (cert.deps||[]).every(id => state?.passes?.[id]);if (depsDone && c >= 5.5) return 'T0';if (depsDone && (n >= 5.5 || c >= 4)) return 'T1';if (e >= 5) return 'T2';return 'T2';}

  function scoreCard(cert, suppliedContext=context()) {const v = values(cert);const marketValue = CT.marketValue?.marginalContribution ? CT.marketValue.marginalContribution(cert) : null;return Object.freeze({M:v.market,K:v.knowledge,C:relevance10(cert,suppliedContext.current),N:relevance10(cert,suppliedContext.next),E:relevance10(cert,suppliedContext.target),T:timing(cert,suppliedContext),currentRole:ROLE_PROFILES[suppliedContext.current]?.label,nextRole:ROLE_PROFILES[suppliedContext.next]?.label,targetRole:ROLE_PROFILES[suppliedContext.target]?.label,opportunity:marketValue?.contributionLabel || null});}

  function dimensions() {return Object.freeze({M:'Market ROI / credential value to HR and recruiters',K:'Knowledge ROI / real deployment, troubleshooting and design value',C:'Relevance to the selected current role',N:'Leverage toward the selected next role',E:'Alignment to the selected long-term target role',T:'Timing: T0 now, T1 next, T2 build toward, T3 experience-gated'});}

  CT.careerFramework = Object.freeze({STORAGE,ROLE_PROFILES,VALUE_OVERRIDES,context,setContext,profileFit,relevance10,values,timing,scoreCard,dimensions});
})(window);
