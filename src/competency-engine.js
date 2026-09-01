// Cert Tracker — competency taxonomy, goal coverage and readiness modelling.
(function initCompetencyEngine(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT?.store) throw new Error('state-core.js must load before competency-engine.js');

  const SKILLS = Object.freeze({
    networking:'Networking fundamentals', routing:'Routing & switching', firewall:'Firewalling & network security', wireless:'Wireless', hybridNetwork:'Hybrid / cloud networking',
    linux:'Linux', windows:'Windows / endpoint administration', enterpriseInfra:'Enterprise infrastructure', storage:'Storage / capacity', database:'Database fundamentals', pki:'PKI / certificates', resilience:'HA / backup / disaster recovery',
    cloud:'Cloud fundamentals', azure:'Microsoft Azure', aws:'AWS', iam:'Identity & access management', zeroTrust:'Zero Trust',
    soc:'SOC operations', siem:'SIEM & telemetry', incident:'Incident response', threat:'Threat detection', vulnerability:'Vulnerability management', pentest:'Offensive security', offensive:'Attack-path understanding', crypto:'Cryptography', governance:'Governance & risk',
    architecture:'Security architecture', commercial:'Commercial / delivery architecture', ot:'OT / ICS security', otEngineering:'OT / control engineering', industrialProtocols:'Industrial protocols',
    vms:'Video management systems', physical:'Physical security', access:'Access control', accessIdentity:'Physical identity / access lifecycle',
    automation:'Automation', python:'Python', apiIntegration:'APIs / systems integration', iac:'Infrastructure as code', containers:'Containers / Kubernetes',
    aiSecurity:'AI security', aiSystems:'AI / analytics systems', data:'Data / analytics', gis:'GIS / spatial systems', leadership:'Security leadership', privacy:'Privacy'
  });

  const RULES = Object.freeze([
    ['networking',['network','tcp','ip','subnet','ethernet'],1], ['routing',['routing','switching','ccna','ccnp','bgp','ospf','vrf'],1],
    ['firewall',['firewall','palo alto','fortinet','ngfw','network security','segmentation','vpn'],1], ['wireless',['wireless','wi-fi','wifi'],.8],
    ['hybridNetwork',['hybrid network','vnet','expressroute','private link','vpn gateway','cloud networking'],1],
    ['linux',['linux','red hat','rhce','bash'],1], ['windows',['windows','endpoint','active directory','ad ds'],.9],
    ['enterpriseInfra',['windows server','active directory','hyper-v','virtualization','server administration','enterprise infrastructure'],1],
    ['storage',['storage','raid','san','nas','iops','retention'],.9], ['database',['sql','database','database recovery'],.8], ['pki',['pki','certificate','tls','certificate authority'],1],
    ['resilience',['high availability','disaster recovery','backup','rpo','rto','clustering','ha/dr'],1],
    ['cloud',['cloud','azure','aws','gcp'],.7], ['azure',['azure','az-','sc-'],1], ['aws',['aws','amazon web services'],1],
    ['iam',['identity','iam','entra','sc-300','pam','access management','oauth','oidc'],1], ['zeroTrust',['zero trust'],1],
    ['soc',['soc','security operations'],1], ['siem',['siem','splunk','sentinel','telemetry'],1], ['incident',['incident','forensic','response'],1],
    ['threat',['threat','detection','hunting','crowdstrike'],1], ['vulnerability',['vulnerability','cysa','scanner'],.9], ['pentest',['pentest','penetration','offensive','oscp'],1],
    ['offensive',['attack path','lateral movement','privilege escalation','credential theft','reconnaissance','ad attack','web vulnerability','api vulnerability'],1],
    ['crypto',['cryptography','encryption','pki'],.9], ['governance',['governance','risk','compliance','iso 27001','crisc','cism','nist','caf'],1],
    ['architecture',['architect','architecture','design','sabsa','issap','hld','lld'],1], ['commercial',['bill of materials','bom','tco','rfp','rfq','tender','capex','opex','statement of work','sow','acceptance criteria'],1],
    ['ot',['ot security','ot/ics','ics security','industrial','scada','62443','gicsp','claroty','nozomi'],1],
    ['otEngineering',['plc','scada','hmi','rtu','dcs','sis','ladder logic','function block','structured text','iec 61131','process control'],1],
    ['industrialProtocols',['modbus','opc ua','mqtt','bacnet','dnp3','profinet','ethernet/ip','industrial protocol'],1],
    ['vms',['milestone','vms','video management','surveillance'],1], ['physical',['physical security','axis','camera','video surveillance','asis'],.9],
    ['access',['access control','lenel','paxton','badge','osdp','wiegand'],1], ['accessIdentity',['cardholder','credential lifecycle','physical identity','anti-passback','visitor management'],1],
    ['automation',['automation','powershell','devops','scripting','ansible'],.8], ['python',['python','pcap','pcep'],1],
    ['apiIntegration',['rest api','api','json','yaml','oauth','oidc','vapiX','integration'],.9], ['iac',['terraform','infrastructure as code','iac'],1],
    ['containers',['kubernetes','container','cka','docker'],1], ['aiSecurity',['ai security','artificial intelligence security','secai','model security'],1],
    ['aiSystems',['computer vision','object detection','classification','inference','model drift','analytics','briefcam'],1],
    ['data',['data','analytics','sql','metadata'],.6], ['gis',['arcgis','esri','gis','spatial'],1], ['leadership',['leadership','management','ciso','principal'],.8], ['privacy',['privacy','cipp','gdpr'],1]
  ]);

  const GOALS = Object.freeze({
    convergence:Object.freeze({ label:'Convergence / OT Security Architect', weights:{ architecture:1,commercial:.7,ot:1,otEngineering:.85,industrialProtocols:.7,networking:.9,routing:.7,firewall:.85,enterpriseInfra:.65,pki:.5,resilience:.5,physical:.8,vms:.7,access:.65,accessIdentity:.5,cloud:.65,hybridNetwork:.6,iam:.6,automation:.55,apiIntegration:.55,aiSystems:.4,offensive:.35,incident:.4,governance:.55 } }),
    cyber:Object.freeze({ label:'Cyber Security Engineer', weights:{ networking:.7,firewall:.7,soc:1,siem:.9,incident:.9,threat:.9,vulnerability:.75,offensive:.65,iam:.65,linux:.6,automation:.5,cloud:.5 } }),
    network:Object.freeze({ label:'Network / Security Engineer', weights:{ networking:1,routing:1,firewall:1,hybridNetwork:.55,wireless:.55,linux:.4,enterpriseInfra:.35,cloud:.35,automation:.4,architecture:.35 } }),
    physical:Object.freeze({ label:'Physical Security Architect', weights:{ physical:1,vms:1,access:.95,accessIdentity:.7,networking:.75,enterpriseInfra:.55,architecture:.85,commercial:.5,cloud:.45,iam:.4,ot:.35,automation:.3,apiIntegration:.45,aiSystems:.45 } }),
    cloud:Object.freeze({ label:'Cloud Security Architect', weights:{ cloud:1,azure:.8,aws:.8,hybridNetwork:.85,iam:1,zeroTrust:.85,architecture:1,networking:.6,automation:.75,apiIntegration:.55,iac:.7,containers:.55,governance:.45 } })
  });

  const cache = new Map();
  function textFor(cert) {
    return [cert?.name,cert?.code,cert?.vendor,cert?.coverage,cert?.note,...(cert?.skills||[]),...(cert?.subjects||[])].filter(Boolean).join(' ').toLowerCase();
  }
  function competencies(cert) {
    if (!cert) return Object.freeze({});
    if (cache.has(cert.id)) return cache.get(cert.id);
    const text = textFor(cert); const result = {};
    for (const [key,terms,weight] of RULES) {
      const hits = terms.filter(term => text.includes(term)).length;
      if (hits) result[key] = Math.min(1, Number((weight * (0.7 + Math.min(3,hits) * 0.1)).toFixed(2)));
    }
    if (!Object.keys(result).length) result.governance = .25;
    const frozen = Object.freeze(result); cache.set(cert.id,frozen); return frozen;
  }

  function studyProgress(cert) {
    const logged = (state.studyLog || []).filter(row => row?.certId === cert.id).reduce((sum,row) => sum + Math.max(0,Number(row.hours)||0),0);
    const target = Math.max(1,CT.util.averageHours(cert));
    return CT.util.clamp(logged / target,0,1);
  }

  function profile(passes = state.passes) {
    const result = Object.fromEntries(Object.keys(SKILLS).map(key => [key,0]));
    for (const cert of CERTS) {
      const passed = !!passes?.[cert.id];
      const progress = passed ? 1 : Math.max(studyProgress(cert) * .45, CT.store.objective(cert.id) / 100 * .55);
      if (!progress) continue;
      for (const [skill,weight] of Object.entries(competencies(cert))) result[skill] = Math.max(result[skill] || 0, weight * progress * (passed ? 1 : .75));
    }
    for (const [skill,value] of Object.entries(state.competencyEvidence || {})) {
      if (skill in result) result[skill] = Math.max(result[skill], CT.util.clamp(Number(value)||0,0,100)/100);
    }
    return Object.freeze(result);
  }

  function similarity(a,b) {
    const keys = new Set([...Object.keys(a||{}),...Object.keys(b||{})]);
    let dot=0,aa=0,bb=0;
    keys.forEach(key => { const x=Number(a?.[key]||0), y=Number(b?.[key]||0); dot+=x*y; aa+=x*x; bb+=y*y; });
    return aa && bb ? CT.util.clamp(dot / Math.sqrt(aa*bb),0,1) : 0;
  }

  function goalFit(cert, goalKey='convergence') {
    const goal = GOALS[goalKey] || GOALS.convergence;
    const comp = competencies(cert); let weighted=0,total=0,matched=[];
    for (const [skill,w] of Object.entries(goal.weights)) {
      total += w;
      if (comp[skill]) { weighted += w * comp[skill]; matched.push(skill); }
    }
    return Object.freeze({ score: total ? Math.round(weighted/total*100) : 0, matched:Object.freeze(matched), competencies:comp });
  }

  function goalCoverage(goalKey='convergence', passes=state.passes) {
    const goal = GOALS[goalKey] || GOALS.convergence; const p = profile(passes); let weighted=0,total=0; const gaps=[];
    for (const [skill,w] of Object.entries(goal.weights)) {
      total += w; weighted += w*(p[skill]||0); gaps.push({ skill,label:SKILLS[skill],weight:w,level:p[skill]||0,gap:1-(p[skill]||0) });
    }
    gaps.sort((a,b)=>(b.weight*b.gap)-(a.weight*a.gap));
    return Object.freeze({ score:Math.round((weighted/Math.max(.001,total))*100), profile:p, gaps:Object.freeze(gaps) });
  }

  function readiness(cert, goalKey='convergence') {
    const deps = cert.deps || []; const depsDone = deps.length ? deps.filter(id=>state.passes?.[id]).length/deps.length : 1;
    const objective = CT.store.objective(cert.id)/100; const study = studyProgress(cert); const p = profile(); const comp=competencies(cert);
    const compKeys=Object.keys(comp); const foundation = compKeys.length ? compKeys.reduce((sum,key)=>sum+Math.min(1,(p[key]||0)/Math.max(.25,comp[key])),0)/compKeys.length : .5;
    const booked = state.exams?.[cert.id] ? 1 : 0; const goal=goalFit(cert,goalKey).score/100;
    const raw = depsDone*.28 + foundation*.27 + objective*.22 + study*.18 + booked*.03 + goal*.02;
    const score = state.passes?.[cert.id] ? 100 : Math.round(CT.util.clamp(raw,0,.99)*100);
    const remainingHours = Math.max(0, Math.round(CT.util.averageHours(cert)*(1-Math.max(study,objective*.8,foundation*.55))));
    return Object.freeze({ score,remainingHours,dependencies:Math.round(depsDone*100),foundation:Math.round(foundation*100),objective:Math.round(objective*100),study:Math.round(study*100),goalFit:Math.round(goal*100) });
  }

  CT.competency = Object.freeze({ SKILLS,GOALS,competencies,profile,similarity,goalFit,goalCoverage,readiness,studyProgress });
})(window);
