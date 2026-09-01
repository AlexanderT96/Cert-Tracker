// Cert Tracker — UK role-market and marginal certification-value model.
(function initMarketValue(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before market-value.js');

  const SNAPSHOT = Object.freeze({
    asOf:'2026-08-31',currency:'GBP',geography:'UK',
    disclaimer:'Indicative UK market benchmarks only. Certification value depends on role scope, experience, evidence, employer, sector and hiring conditions; no certificate guarantees a salary increase.',
    sources:Object.freeze([
      Object.freeze({label:'IT Jobs Watch — Cyber Security Engineer',url:'https://www.itjobswatch.co.uk/jobs/uk/cyber%20security%20engineer.do',median:65000}),
      Object.freeze({label:'IT Jobs Watch — Network Security Engineer',url:'https://www.itjobswatch.co.uk/jobs/uk/network%20security%20engineer.do',median:67500}),
      Object.freeze({label:'IT Jobs Watch — Security Architect',url:'https://www.itjobswatch.co.uk/jobs/uk/security%20architect.do',median:85000}),
      Object.freeze({label:'IT Jobs Watch — Solution Architect',url:'https://www.itjobswatch.co.uk/jobs/uk/solutions%20architect.do',median:85000}),
      Object.freeze({label:'IT Jobs Watch — Cloud Solution Architect',url:'https://www.itjobswatch.co.uk/jobs/uk/cloud%20solutions%20architect.do',median:87000}),
      Object.freeze({label:'Barclay Simpson — 2026 Cyber Security Salary Guide',url:'https://www.barclaysimpson.com/salary-guides/2026-cyber-security-salary-guide/'}),
      Object.freeze({label:'UK Government — Cyber Security Sectoral Analysis 2026',url:'https://www.gov.uk/government/publications/cyber-security-sectoral-analysis-2026/cyber-security-sectoral-analysis-2026'})
    ])
  });

  const ROLE_BANDS=Object.freeze({
    infrastructure:Object.freeze({label:'Infrastructure / Systems',low:35000,median:50000,high:70000,confidence:'MEDIUM'}),
    networkSecurity:Object.freeze({label:'Network Security Engineer',low:50000,median:67500,high:90000,confidence:'HIGH'}),
    cyberEngineer:Object.freeze({label:'Cyber Security Engineer',low:50000,median:65000,high:90000,confidence:'HIGH'}),
    securityArchitect:Object.freeze({label:'Security Architect',low:75000,median:85000,high:120000,confidence:'HIGH'}),
    solutionsArchitect:Object.freeze({label:'Solution Architect',low:70000,median:85000,high:110000,confidence:'HIGH'}),
    cloudArchitect:Object.freeze({label:'Cloud / Cloud Security Architect',low:80000,median:95000,high:130000,confidence:'HIGH'}),
    otArchitect:Object.freeze({label:'OT / Convergence Security Architect',low:80000,median:105000,high:135000,confidence:'MEDIUM'}),
    physicalArchitect:Object.freeze({label:'Physical Security Architect / Consultant',low:60000,median:80000,high:110000,confidence:'LOW'}),
    iam:Object.freeze({label:'IAM / Identity Security',low:60000,median:80000,high:110000,confidence:'MEDIUM'}),
    grc:Object.freeze({label:'GRC / Security Risk',low:55000,median:75000,high:105000,confidence:'MEDIUM'}),
    leadership:Object.freeze({label:'Security Leadership',low:95000,median:125000,high:170000,confidence:'MEDIUM'})
  });

  const TRACK_ROLE=Object.freeze({FOUNDATION:'infrastructure',CORE:'cyberEngineer',CONDITIONAL:'cyberEngineer',OPTIONAL:'infrastructure','ROLE-DRIVEN':'physicalArchitect',ARCHITECT:'securityArchitect','IDENTITY-SEC':'iam','POST-PLAN':'securityArchitect'});
  const ROLE_RULES=Object.freeze([
    ['otArchitect',['ot security','ot/ics','ics security','industrial','scada','62443','gicsp','claroty','nozomi','convergence']],
    ['cloudArchitect',['cloud security architect','aws architect','azure architect','az-305','ccsp','cloud architecture']],
    ['securityArchitect',['security architect','architecture','issap','sabsa','security design']],
    ['networkSecurity',['network security','cisco','ccna','ccnp','firewall','palo alto','fortinet','routing','switching']],
    ['iam',['iam','identity','pam','entra','sc-300','zero trust']],['grc',['governance','risk','compliance','cism','crisc','iso 27001','privacy','cipp']],
    ['physicalArchitect',['physical security','milestone','axis','lenel','access control','vms','video surveillance','asis']],
    ['cyberEngineer',['cyber','security','soc','incident','threat','cysa','security+','pentest','detection']]
  ]);

  function money(value){return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(Math.round(Number(value)||0));}
  function roleFor(cert){const text=[cert?.name,cert?.code,cert?.vendor,cert?.coverage,cert?.note,...(cert?.skills||[]),...(cert?.subjects||[])].filter(Boolean).join(' ').toLowerCase();for(const [key,terms] of ROLE_RULES)if(terms.some(term=>text.includes(term)))return key;return TRACK_ROLE[cert?.track]||'cyberEngineer';}
  function dataConfidence(cert){const health=CT.dataHealth?.record?.(cert);return health?CT.util.clamp(Number(health.confidence||0)/100,.35,1):.65;}

  function intrinsic(cert){
    const legacy=Math.max(0,Number(cert?.cvValue||0)); const roi=CT.util.clamp(Number(cert?.roi||0),0,10); const confidence=dataConfidence(cert);
    const hours=Math.max(1,CT.util.averageHours(cert)); const cost=Math.max(0,Number(cert?.costNum||0)); const roleKey=roleFor(cert); const role=ROLE_BANDS[roleKey];
    const seniority=cert?.gateway?1.18:cert?.track==='ARCHITECT'?1.22:cert?.track==='POST-PLAN'?0.82:1;
    const centre=Math.round(legacy*(.72+roi*.04)*seniority); const uncertainty=confidence>=.85?.22:confidence>=.7?.34:.48;
    const low=Math.max(0,Math.round(centre*(1-uncertainty)/100)*100); const high=Math.max(low,Math.round(centre*(1+uncertainty)/100)*100); const midpoint=Math.round((low+high)/2);
    return {roleKey,role,marketBand:{low:role.low,median:role.median,high:role.high,confidence:role.confidence},contributionRange:{low,high,midpoint},confidence:confidence>=.85?'HIGH':confidence>=.7?'MEDIUM':'LOW',hours,cost};
  }

  function overlap(cert,portfolioCerts=[]){
    if(!CT.competency||!portfolioCerts.length)return 0; const target=CT.competency.competencies(cert);
    return portfolioCerts.reduce((max,item)=>Math.max(max,CT.competency.similarity(target,CT.competency.competencies(item))),0);
  }

  function marginalContribution(cert,portfolioCerts=CERTS.filter(c=>state.passes?.[c.id])){
    const base=intrinsic(cert); const overlapScore=overlap(cert,portfolioCerts.filter(c=>c.id!==cert.id));
    const novelty=Math.max(.22,1-overlapScore*.7); const gatewayFloor=cert.gateway?Math.max(novelty,.55):novelty;
    const midpoint=Math.round(base.contributionRange.midpoint*gatewayFloor/100)*100;
    const low=Math.round(base.contributionRange.low*gatewayFloor/100)*100; const high=Math.max(low,Math.round(base.contributionRange.high*gatewayFloor/100)*100);
    return Object.freeze({
      roleKey:base.roleKey,role:base.role,marketBand:Object.freeze(base.marketBand),contributionRange:Object.freeze({low,high,midpoint}),
      contributionLabel:`${money(low)}–${money(high)}`,confidence:base.confidence,overlap:Math.round(overlapScore*100),novelty:Math.round(gatewayFloor*100),
      valuePerStudyHour:Math.round(midpoint/base.hours),valueToCostRatio:base.cost>0?Number((midpoint/base.cost).toFixed(1)):null,selfFundedCost:base.cost,
      evidence:cert?.projectRec?'Certification + portfolio evidence':'Certification signal only',disclaimer:SNAPSHOT.disclaimer
    });
  }

  function contribution(cert){return marginalContribution(cert);}
  function portfolioSummary(certs=CERTS.filter(cert=>state.myPath?.[cert.id]&&!state.skipped?.[cert.id])){
    const passed=certs.filter(cert=>state.passes?.[cert.id]).sort((a,b)=>String(state.passes[a.id]).localeCompare(String(state.passes[b.id]))); const built=[]; let total=0;
    passed.forEach(cert=>{const value=marginalContribution(cert,built);total+=value.contributionRange.midpoint;built.push(cert);});
    const available=certs.filter(cert=>!state.passes?.[cert.id]); const roleCounts=new Map(); certs.forEach(cert=>{const key=roleFor(cert);roleCounts.set(key,(roleCounts.get(key)||0)+1);});
    const dominant=[...roleCounts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||'cyberEngineer';
    return Object.freeze({completedCount:passed.length,remainingCount:available.length,indicativeSignalBuilt:Math.round(total),dominantRole:ROLE_BANDS[dominant],topRemaining:available.map(cert=>({cert,value:marginalContribution(cert,passed)})).sort((a,b)=>b.value.contributionRange.midpoint-a.value.contributionRange.midpoint).slice(0,10),disclaimer:SNAPSHOT.disclaimer});
  }

  CT.marketValue=Object.freeze({SNAPSHOT,ROLE_BANDS,roleFor,intrinsic,overlap,marginalContribution,contribution,portfolioSummary,money});
})(window);
