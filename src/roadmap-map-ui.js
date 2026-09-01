// Cert Tracker — dedicated filter-aware certification roadmap flow map.
(function initRoadmapMap(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.learningResources||!CT?.careerFramework||!CT?.capabilityGates||!CT?.store)return;
  const esc=CT.util.escapeHtml;
  const GATE_AFTER=CT.learningPath?.GATE_AFTER||{1:'physicalSystemsEngineer',2:'networkSecurityEngineer',3:'otSecurityEngineer',4:'convergenceEngineer',5:'solutionsArchitect',6:'principalConvergenceArchitect'};
  const PHASES=CT.learningPath?.PHASES||{};
  const timingRank={DONE:0,T0:1,T1:2,T2:3,T3:4};

  function scope(){
    if(typeof global.getScope==='function')return global.getScope();
    const certs=state.filter==='my-path'?CERTS.filter(c=>state.myPath?.[c.id]):CERTS.slice();
    return {certs,label:state.filter==='my-path'?'My Path':'All certs',scoped:state.filter!=='all'};
  }
  function sortCerts(rows){return rows.slice().sort((a,b)=>{
    const ap=!!state.passes?.[a.id],bp=!!state.passes?.[b.id];if(ap!==bp)return ap?-1:1;
    const ad=(a.deps||[]).filter(id=>!state.passes?.[id]).length,bd=(b.deps||[]).filter(id=>!state.passes?.[id]).length;if(ad!==bd)return ad-bd;
    const ac=CT.careerFramework.scoreCard(a),bc=CT.careerFramework.scoreCard(b);
    if((timingRank[ac.T]??9)!==(timingRank[bc.T]??9))return (timingRank[ac.T]??9)-(timingRank[bc.T]??9);
    if(ac.K!==bc.K)return bc.K-ac.K;
    return String(a.name).localeCompare(String(b.name));
  });}
  function phaseCerts(phase,rows=scope().certs){return sortCerts(rows.filter(c=>CT.store.effectivePhase(c)===phase));}
  function gauge(depth){return `<span class="ct-map-depth" title="Required exam depth D${depth}/5">${[1,2,3,4,5].map(n=>`<i class="${n<=depth?'on':''}"></i>`).join('')}</span>`;}
  function subdomain(topic){
    const t=String(topic||'').toLowerCase();
    if(/bgp|ospf|routing|switch|vlan|stp|ip connectivity|network access|wireless|transport|packet/.test(t))return'Networking';
    if(/firewall|threat|vulnerab|incident|forensic|security operations|attack|pentest|mitigat/.test(t))return'Cyber Security';
    if(/identity|entra|authentication|access management|zero trust|credential/.test(t))return'Identity';
    if(/azure|aws|cloud|virtual network|compute|storage/.test(t))return'Cloud / Infrastructure';
    if(/active directory|dns|pki|hyper-v|database|sql|server|recovery|resilience/.test(t))return'Enterprise Infrastructure';
    if(/plc|scada|hmi|iacs|industrial|modbus|opc|mqtt|bacnet|dnp3|sis|sil|automation and control/.test(t))return'OT / Automation';
    if(/architecture|design|requirements|stakeholder|trade-off|integration|lifecycle|governance/.test(t))return'Architecture / Design';
    if(/python|programm|api|terraform|ansible|code|module|package|object-oriented/.test(t))return'Automation / Software';
    if(/video|vms|axis|xprotect|camera|analytics|briefcam|onvif|access control/.test(t))return'Physical Security';
    if(/ai|machine learning|computer vision|model|natural language|data security/.test(t))return'AI / Data';
    if(/risk|compliance|legal|program management|oversight/.test(t))return'Governance / Risk';
    return'Core Domain';
  }
  function tutorAdvice(cert,row){
    if(state.passes?.[cert.id])return null;
    const readiness=Number(CT.competency?.readiness?.(cert)?.score||0),topic=String(row.topic||'');
    const bottleneck=/\b(BGP|OSPF|PKI|certificate|PLC|SCADA|SIL|SIS|control logic|architecture|risk assessment|identity|KQL|packet|troubleshoot|API|object-oriented|automation|segmentation|routing)\b/i.test(topic);
    if(row.depth>=5&&readiness<80)return{level:'strong',label:'Tutor checkpoint',reason:`D5 expert-depth topic while overall exam readiness is ${readiness}%. Use tutor review to challenge reasoning, troubleshooting and design judgement.`};
    if(row.depth>=4&&bottleneck&&readiness<65)return{level:'recommended',label:'Tutor useful',reason:`Likely bottleneck at D${row.depth}. Self-study first, then use a tutor if explanation-to-implementation does not become reliable.`};
    if(row.depth>=4&&bottleneck)return{level:'watch',label:'Tutor if stalled',reason:`High-complexity D${row.depth} subject. Escalate to tutor-led diagnosis if repeated labs or practice questions expose the same misconception.`};
    return null;
  }
  function resourceLinks(row){return (row.resources||[]).slice(0,3).map(r=>`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" title="${esc(r.purpose||'Open learning resource')}">${esc(r.label)} ↗</a>`).join('');}
  function subjectBranch(cert,row){
    const tutor=tutorAdvice(cert,row);
    return `<li class="ct-map-subject ${tutor?'has-tutor':''}"><span class="ct-map-branch-dot"></span><div class="ct-map-subject-main"><div><strong>${esc(row.topic)}</strong><b class="ct-map-domain">${esc(subdomain(row.topic))}</b></div><span>${gauge(row.depth)} D${row.depth} · ${esc(row.depthInfo?.label||'')} · ${esc(row.emphasis||'Supporting')} emphasis</span>${tutor?`<div class="ct-map-tutor ${tutor.level}"><b>🎓 ${esc(tutor.label)}</b><span>${esc(tutor.reason)}</span></div>`:''}<div class="ct-map-resource-mini">${resourceLinks(row)}</div></div></li>`;
  }
  function dependencyLine(cert,scopeIds){const deps=(cert.deps||[]).map(id=>CERTS.find(c=>c.id===id)).filter(Boolean);if(!deps.length)return'';return `<div class="ct-map-deps"><span>Prerequisites</span>${deps.map(d=>`<b class="${state.passes?.[d.id]?'done':scopeIds.has(d.id)?'in-scope':'external'}">${state.passes?.[d.id]?'✓ ':''}${esc(d.code||d.name)}${!scopeIds.has(d.id)&&!state.passes?.[d.id]?' · outside filter':''}</b>`).join('')}</div>`;}
  function tutorSummary(cert,subjects){const rows=subjects.map(s=>({subject:s,advice:tutorAdvice(cert,s)})).filter(x=>x.advice);if(!rows.length)return'';const strong=rows.filter(x=>x.advice.level==='strong').length,rec=rows.filter(x=>x.advice.level==='recommended').length;return `<div class="ct-map-tutor-summary"><span>🎓 Tutor bottleneck scan</span><strong>${strong?`${strong} checkpoint${strong===1?'':'s'}`:rec?`${rec} likely bottleneck${rec===1?'':'s'}`:'Tutor escalation points mapped'}</strong><small>Tutor involvement is targeted at high-depth subjects where independent study commonly stalls; it is not a substitute for labs.</small></div>`;}
  function certNode(cert,scopeIds){
    const card=CT.careerFramework.scoreCard(cert),profile=CT.learningResources.profile(cert),done=!!state.passes?.[cert.id],blocked=(cert.deps||[]).some(id=>!state.passes?.[id]),readiness=CT.competency?.readiness?.(cert)?.score||0;
    const status=done?'Completed':blocked?'Dependency blocked':`${card.T} · K${card.K} · M${card.M}`;
    return `<details class="ct-map-cert ${done?'done':''} ${blocked&&!done?'blocked':''}">
      <summary><span class="ct-map-node-dot"></span><div class="ct-map-cert-main"><strong>${esc(cert.name)}</strong><span>${esc(cert.code||'')} ${cert.code?'· ':''}${esc(status)} · ${readiness}% exam ready</span></div><span class="ct-map-class">${esc(CT.capabilityGates.portfolioClass(cert,card))}</span></summary>
      <div class="ct-map-cert-body">
        ${dependencyLine(cert,scopeIds)}
        <div class="ct-map-cert-metrics"><span>K${card.K} knowledge</span><span>M${card.M} market</span><span>C${card.C} current-role</span><span>N${card.N} next-role</span><span>E${card.E} endgame</span><span>${esc(card.T)} timing</span></div>
        ${tutorSummary(cert,profile.subjects)}
        <div class="ct-map-subject-label">Subject / sub-domain branches · required exam depth · best-fit resources</div>
        <ul class="ct-map-subjects">${profile.subjects.map(s=>subjectBranch(cert,s)).join('')}</ul>
        <button type="button" class="ct-map-open-cert" data-cert-open="${esc(cert.id)}">Open full certification details →</button>
      </div>
    </details>`;
  }
  function evidenceRequirement(id,required){const item=CT.capabilityGates.EVIDENCE.find(x=>x.id===id),actual=CT.capabilityGates.evidenceRecord(id);return `<li class="${actual.score>=(CT.capabilityGates.LEVELS[required]?.score||0)?'met':''}"><b>${esc(item?.label||id)}</b><span>${esc(actual.level)} / ${esc(required)}</span></li>`;}
  function gate(phase){
    const key=GATE_AFTER[phase],g=key?CT.capabilityGates.roleGateStatus(key):null;if(!g)return'';
    const pillarRows=Object.entries(g.requirements.pillars||{}).map(([pillar,required])=>{const snap=CT.capabilityGates.pillarSnapshot()[pillar];return `<li class="${(snap?.score||0)>=required?'met':''}"><b>${esc(snap?.label||pillar)}</b><span>${snap?.score||0}% / ${required}%</span></li>`;}).join('');
    const evidenceRows=Object.entries(g.requirements.evidence||{}).map(([id,required])=>evidenceRequirement(id,required)).join('');
    return `<details class="ct-map-gate ${g.ready?'ready':''}"><summary><span>PHASE ${phase} EXIT / ROLE GATE</span><strong>${esc(g.label)}</strong><b>${g.score}%${g.ready?' ✓':''}</b></summary><div class="ct-map-gate-body"><div><h4>Capability thresholds</h4><ul>${pillarRows}</ul></div><div><h4>Practical evidence thresholds</h4><ul>${evidenceRows}</ul></div>${g.blockers.length?`<div class="ct-map-gate-blockers"><h4>Current blockers</h4>${g.blockers.slice(0,8).map(x=>`<span>→ ${esc(x)}</span>`).join('')}</div>`:'<div class="ct-map-gate-ready">Gate requirements are currently met.</div>'}</div></details>`;
  }
  function phaseSummary(phase,certs){
    const subjects=certs.flatMap(c=>CT.learningResources.profile(c).subjects.map(s=>({cert:c,subject:s,advice:tutorAdvice(c,s)}))),tutors=subjects.filter(x=>x.advice),deep=subjects.filter(x=>x.subject.depth>=4),done=certs.filter(c=>state.passes?.[c.id]).length;
    return `<div class="ct-map-phase-summary"><span><b>${done}/${certs.length}</b> certifications complete</span><span><b>${subjects.length}</b> subject branches</span><span><b>${deep.length}</b> D4/D5 depth areas</span><span><b>${tutors.length}</b> tutor checkpoints / escalation points</span></div>`;
  }
  function render(){
    const s=scope(),rows=s.certs,scopeIds=new Set(rows.map(c=>c.id)),done=rows.filter(c=>state.passes?.[c.id]).length;
    const phases=[];
    for(let p=1;p<=6;p++){
      const certs=phaseCerts(p,rows),spec=PHASES[p]||{title:`Phase ${p}`,sub:''},pc=certs.filter(c=>state.passes?.[c.id]).length;
      phases.push(`<section class="ct-map-phase" data-phase="${p}">
        <header><div class="ct-map-phase-number">P${p}</div><div><strong>${esc(spec.title)}</strong><span>${esc(spec.sub||'')}</span></div><b>${pc}/${certs.length}</b></header>
        ${phaseSummary(p,certs)}
        <div class="ct-map-spine">${certs.length?certs.map(c=>certNode(c,scopeIds)).join(''):'<div class="ct-map-empty">No certifications in this filter for Phase '+p+'.</div>'}</div>
      </section>${gate(p)}${p<6?'<div class="ct-map-phase-arrow" aria-hidden="true">↓</div>':''}`);
    }
    return `<div class="ct-roadmap-map-workspace">
      <div class="ct3-card ct-map-hero"><div><div class="ct3-title">Certification Roadmap Map</div><div class="ct3-sub">The entire selected pathway visualised: phases → certification roadmap → prerequisites → subject/sub-domain branches → D1–D5 exam depth → tutor bottlenecks → practical evidence → role gates.</div></div><div class="ct-map-scope"><span>ACTIVE FILTER</span><strong>${esc(s.label)}</strong><b>${done}/${rows.length} complete</b></div></div>
      <div class="ct3-notice"><strong>Filter-aware:</strong> this map is rebuilt from the currently selected filter chip. Use My Path for the personal certification roadmap, All for the complete catalogue, or select Cloud / Physical / Cyber / role chips to isolate that pathway. Knowledge ROI, dependencies and timing drive sequence before CV value.</div>
      <div class="ct-map-legend"><span><i class="node"></i> Certification</span><span><i class="branch"></i> Subject / sub-domain branch</span><span>${gauge(4)} D1–D5 exam depth</span><span>🎓 Tutor bottleneck / escalation</span><span><i class="gate"></i> Phase + role gate</span></div>
      <div class="ct-roadmap-flow">${phases.join('')}</div>
    </div>`;
  }
  function bind(root=document){root.querySelectorAll?.('[data-cert-open]').forEach(button=>button.addEventListener('click',()=>{const cert=CERTS.find(c=>c.id===button.dataset.certOpen);if(!cert)return;state.searchQuery=cert.name;state.currentTab='certifications';global.renderApp?.();}));}
  CT.roadmapMap=Object.freeze({render,bind,scope,phaseCerts,subdomain,tutorAdvice});
})(window);
