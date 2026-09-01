// Cert Tracker — subject-depth and learning-resource UI for every certification.
(function initLearningResourcesUI(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.learningResources)return;
  const esc=CT.util.escapeHtml;

  function resource(row){
    const free=row.free===true?'<span class="ct-resource-free">FREE</span>':row.free===false?'<span class="ct-resource-paid">PAID</span>':'';
    return `<a class="ct-resource-link ct-resource-${esc(row.kind||'resource')}" href="${esc(row.url)}" target="_blank" rel="noopener noreferrer" title="${esc(row.purpose||'Open resource')}"><span>${esc(row.label)}</span>${free}<span aria-hidden="true">↗</span></a>`;
  }
  function gauge(depth){
    return `<div class="ct-depth-gauge" role="meter" aria-valuemin="1" aria-valuemax="5" aria-valuenow="${depth}" aria-label="Required exam depth ${depth} of 5">${[1,2,3,4,5].map(i=>`<i class="${i<=depth?'on':''}"></i>`).join('')}</div>`;
  }
  function subject(row,index){
    return `<details class="ct-subject-item" ${index===0?'open':''}>
      <summary>
        <div class="ct-subject-title"><strong>${esc(row.topic)}</strong><span>${esc(row.emphasis)} exam emphasis</span></div>
        <div class="ct-subject-depth">${gauge(row.depth)}<span>D${row.depth} · ${esc(row.depthInfo.label)}</span></div>
      </summary>
      <div class="ct-subject-body">
        <p><strong>Exam standard:</strong> ${esc(row.depthInfo.description)}</p>
        <div class="ct-topic-resource-label">Best-fit learning resources for this topic</div>
        <div class="ct-resource-grid">${row.resources.map(resource).join('')}</div>
      </div>
    </details>`;
  }
  function render(cert){
    const p=CT.learningResources.profile(cert);
    const model=p.curated
      ? '<span class="ct-coverage-status curated">CURATED COVERAGE</span>'
      : '<span class="ct-coverage-status derived">DERIVED COVERAGE</span>';
    const note=p.curated
      ? 'Depth is purpose-fit guidance curated for this certification. Always treat the current official blueprint as the final authority if the vendor changes the exam.'
      : 'This certification did not yet have a fully audited topic blueprint in the catalogue. Depth is derived from its recorded subjects, scope and difficulty; use the linked official blueprint to validate exact exam weighting.';
    return `<details class="ct-learning-resources-panel">
      <summary class="ct-learning-resources-summary">
        <div><span class="ct-learning-resources-kicker">LEARNING INTELLIGENCE</span><strong>Subject coverage, exam depth & clickable resources</strong></div>
        <div class="ct-learning-resources-summary-meta">${model}<span>${p.subjects.length} subjects</span></div>
      </summary>
      <div class="ct-learning-resources-body">
        <div class="ct-resource-note">${esc(note)}</div>
        <section class="ct-study-stack">
          <div class="ct-study-stack-head"><div><span>Recommended study stack</span><strong>Use each resource for the job it does best</strong></div><small>Official scope → structured teaching → visual reinforcement → labs → practice</small></div>
          <div class="ct-resource-grid ct-resource-grid-primary">${p.stack.map(resource).join('')}</div>
          ${p.legacy?`<div class="ct-legacy-material"><strong>Existing catalogue note:</strong> ${esc(p.legacy)}</div>`:''}
        </section>
        <section class="ct-subject-coverage-list">
          <div class="ct-depth-legend">
            ${Object.entries(CT.learningResources.DEPTH).map(([n,d])=>`<span><b>D${n}</b> ${esc(d.label)}</span>`).join('')}
          </div>
          ${p.subjects.map(subject).join('')}
        </section>
      </div>
    </details>`;
  }
  function mount(root=document){
    root.querySelectorAll?.('.cert-row[data-cid]').forEach(row=>{
      const details=row.querySelector('.cert-details');
      if(!details||details.querySelector('.ct-learning-resources-panel'))return;
      const cert=CERTS.find(c=>c.id===row.dataset.cid);if(!cert)return;
      const host=document.createElement('div');host.className='ct-learning-resources-host';host.innerHTML=render(cert);
      const inputs=details.querySelector('.cert-inputs');
      if(inputs)details.insertBefore(host,inputs);else details.appendChild(host);
    });
  }
  let queued=false;
  function queueMount(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;mount(document);});}
  const app=document.getElementById('app');
  if(app)new MutationObserver(queueMount).observe(app,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queueMount,{once:true});else queueMount();

  CT.learningResourcesUI=Object.freeze({render,mount,gauge,resource});
})(window);
