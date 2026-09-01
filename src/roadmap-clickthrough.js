// Cert Tracker — direct study-resource navigation from the Roadmap Map.
// Certification titles and subject titles open the highest-value learning resource
// already selected by the full-catalogue learning-intelligence model.
(function initRoadmapClickthrough(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.learningResources)return;

  function text(row){return `${row?.label||''} ${row?.purpose||''} ${row?.kind||''}`.toLowerCase();}
  function score(row,{subject=false,depth=0}={}){
    if(!row?.url||!/^https:\/\//i.test(row.url))return-1e6;
    const t=text(row),kind=String(row.kind||'').toLowerCase();let s=0;
    if(/\bbest\b/.test(t))s+=120;
    if(/primary|full[- ]course|course spine|guided learning|curriculum/.test(t))s+=75;
    if(/high[- ]value|conceptual|visual|explanation|reinforcement/.test(t))s+=45;
    if(row.free===true)s+=8;
    if(kind==='video')s+=subject?85:65;
    else if(kind==='course')s+=subject?70:72;
    else if(kind==='lab')s+=subject&&depth>=3?68:42;
    else if(kind==='official')s+=52;
    else if(kind==='review')s+=32;
    else if(kind==='practice')s+=18;
    if(subject&&depth>=4&&/troubleshoot|advanced|design|lab|hands-on|scenario/.test(t))s+=35;
    if(subject&&depth<=2&&/video|explain|fundament|overview|introduction/.test(t))s+=28;
    return s;
  }
  function best(rows,opts){return (rows||[]).filter(r=>r?.url).slice().sort((a,b)=>score(b,opts)-score(a,opts))[0]||null;}
  function certForElement(el){const id=el?.closest?.('[data-map-cert]')?.dataset?.mapCert;return CERTS.find(c=>c.id===id)||null;}
  function subjectForElement(el,cert){
    if(!cert)return null;const topic=String(el?.textContent||'').replace(/\s+(?:Learn|Study)\s*↗\s*$/i,'').trim();
    const subjects=CT.learningResources.profile(cert)?.subjects||[];
    return subjects.find(s=>String(s.topic||'').trim()===topic)||subjects.find(s=>topic.startsWith(String(s.topic||'').trim()))||null;
  }
  function bestCertResource(cert){const profile=cert&&CT.learningResources.profile(cert);return profile?best(profile.stack,{subject:false}):null;}
  function bestSubjectResource(cert,subject){
    if(!cert||!subject)return null;return best(subject.resources,{subject:true,depth:Number(subject.depth||0)})||bestCertResource(cert);
  }
  function openResource(row){
    if(!row?.url)return false;const win=global.open(row.url,'_blank','noopener,noreferrer');if(win)try{win.opener=null;}catch{}return true;
  }
  function mark(root=document){
    root.querySelectorAll?.('.ct-map-cert[data-map-cert] .ct-map-cert-main strong:not([data-study-click])').forEach(el=>{
      const cert=certForElement(el),r=bestCertResource(cert);if(!r)return;el.dataset.studyClick='cert';el.tabIndex=0;el.setAttribute('role','link');el.setAttribute('aria-label',`Open best learning resource for ${cert.name}`);el.title=`Open recommended learning resource: ${r.label}`;
    });
    root.querySelectorAll?.('.ct-map-cert[data-map-cert] .ct-map-subject strong:not([data-study-click])').forEach(el=>{
      const cert=certForElement(el),subject=subjectForElement(el,cert),r=bestSubjectResource(cert,subject);if(!r)return;el.dataset.studyClick='subject';el.tabIndex=0;el.setAttribute('role','link');el.setAttribute('aria-label',`Open best learning resource for ${subject?.topic||'this subject'}`);el.title=`Open recommended topic resource: ${r.label}`;
    });
  }
  function activate(el,event){
    const cert=certForElement(el);if(!cert)return;const subject=el.dataset.studyClick==='subject'?subjectForElement(el,cert):null;const row=subject?bestSubjectResource(cert,subject):bestCertResource(cert);if(!row)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();openResource(row);
  }
  document.addEventListener('click',event=>{const el=event.target.closest?.('[data-study-click]');if(el)activate(el,event);},true);
  document.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const el=event.target.closest?.('[data-study-click]');if(el)activate(el,event);},true);
  const observer=new MutationObserver(records=>{for(const record of records){for(const node of record.addedNodes){if(node.nodeType===1&&(node.matches?.('.ct-roadmap-map-workspace')||node.querySelector?.('.ct-roadmap-map-workspace')))mark(node);}}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mark();observer.observe(document.body,{childList:true,subtree:true});},{once:true});else{mark();observer.observe(document.body,{childList:true,subtree:true});}
  CT.roadmapClickthrough=Object.freeze({best,bestCertResource,bestSubjectResource,mark});
})(window);
