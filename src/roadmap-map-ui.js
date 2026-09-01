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
  function subjectBranch(cert,row){const first=row.resources?.[0];return `<li class="ct-map-subject"><span class="ct-map-branch-dot"></span><div><strong>${esc(row.topic)}</strong><span>${gauge(row.depth)} D${row.depth} · ${esc(row.depthInfo?.label||'')}</span></div>${first?`<a href="${esc(first.url)}" target="_blank" rel="noopener noreferrer" title="${esc(first.purpose||'Open learning resource')}">↗</a>`:''}</li>`;}
  function dependencyLine(cert,scopeIds){const deps=(cert.deps||[]).map(id=>CERTS.find(c=>c.id===id)).filter(Boolean);if(!deps.length)return'';return `<div class="ct-map-deps"><span>Prerequisites</span>${deps.map(d=>`<b class="${state.passes?.[d.id]?'done':scopeIds.has(d.id)?'in-scope':'external'}">${state.passes?.[d.id]?'✓ ':''}${esc(d.code||d.name)}</b>`).join('')}</div>`;}
  function certNode(cert,scopeIds){
    const card=CT.careerFramework.scoreCard(cert),profile=CT.learningResources.profile(cert),done=!!state.passes?.[cert.id],blocked=(cert.deps||[]).some(id=>!state.passes?.[id]);
    const status=done?'Completed':blocked?'Dependency blocked':`${card.T} · K${card.K} · M${card.M}`;
    return `<details class="ct-map-cert ${done?'done':''} ${blocked&&!done?'blocked':''}">
      <summary><span class="ct-map-node-dot"></span><div class="ct-map-cert-main"><strong>${esc(cert.name)}</strong><span>${esc(cert.code||'')} ${cert.code?'· ':''}${esc(status)}</span></div><span class="ct-map-class">${esc(CT.capabilityGates.portfolioClass(cert,card))}</span></summary>
      <div class="ct-map-cert-body">
        ${dependencyLine(cert,scopeIds)}
        <div class="ct-map-subject-label">Subject branches · exam depth</div>
        <ul class="ct-map-subjects">${profile.subjects.map(s=>subjectBranch(cert,s)).join('')}</ul>
        <button type="button" class="ct-map-open-cert" data-cert-open="${esc(cert.id)}">Open certification details →</button>
      </div>
    </details>`;
  }
  function gate(phase){const key=GATE_AFTER[phase],g=key?CT.capabilityGates.roleGateStatus(key):null;if(!g)return'';return `<div class="ct-map-gate ${g.ready?'ready':''}"><span>ROLE GATE</span><strong>${esc(g.label)}</strong><b>${g.score}%${g.ready?' ✓':''}</b></div>`;}
  function render(){
    const s=scope(),rows=s.certs,scopeIds=new Set(rows.map(c=>c.id)),done=rows.filter(c=>state.passes?.[c.id]).length;
    const phases=[];
    for(let p=1;p<=6;p++){
      const certs=phaseCerts(p,rows),spec=PHASES[p]||{title:`Phase ${p}`,sub:''},pc=certs.filter(c=>state.passes?.[c.id]).length;
      phases.push(`<section class="ct-map-phase" data-phase="${p}">
        <header><div class="ct-map-phase-number">P${p}</div><div><strong>${esc(spec.title)}</strong><span>${esc(spec.sub||'')}</span></div><b>${pc}/${certs.length}</b></header>
        <div class="ct-map-spine">${certs.length?certs.map(c=>certNode(c,scopeIds)).join(''):'<div class="ct-map-empty">No certifications in this filter for Phase '+p+'.</div>'}</div>
      </section>${gate(p)}${p<6?'<div class="ct-map-phase-arrow" aria-hidden="true">↓</div>':''}`);
    }
    return `<div class="ct-roadmap-map-workspace">
      <div class="ct3-card ct-map-hero"><div><div class="ct3-title">Certification Roadmap Map</div><div class="ct3-sub">Filter-aware flow chart: certification sequence → prerequisite links → subject branches → exam-depth requirements → role gates.</div></div><div class="ct-map-scope"><span>ACTIVE FILTER</span><strong>${esc(s.label)}</strong><b>${done}/${rows.length} complete</b></div></div>
      <div class="ct3-notice"><strong>Map scope:</strong> this view follows the currently selected certification filter chip. Switch to My Path, All, Cloud, Physical, Cyber, a role filter or another chip and the roadmap map rebuilds around that selection. Certification nodes are ordered by dependencies, timing and Knowledge ROI rather than CV value alone.</div>
      <div class="ct-map-legend"><span><i class="node"></i> Certification</span><span><i class="branch"></i> Subject branch</span><span>${gauge(4)} D1–D5 exam depth</span><span><i class="gate"></i> Career role gate</span></div>
      <div class="ct-roadmap-flow">${phases.join('')}</div>
    </div>`;
  }
  function bind(root=document){root.querySelectorAll?.('[data-cert-open]').forEach(button=>button.addEventListener('click',()=>{const cert=CERTS.find(c=>c.id===button.dataset.certOpen);if(!cert)return;state.searchQuery=cert.name;state.currentTab='certifications';global.renderApp?.();}));}
  CT.roadmapMap=Object.freeze({render,bind,scope,phaseCerts});
})(window);
