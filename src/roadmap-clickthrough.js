// Cert Tracker — study-resource selection for the Roadmap Map.
// Map summaries remain native expand/collapse controls; explicit links inside each
// expanded subject open the selected learning resources.
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
  function bestCertResource(cert){const profile=cert&&CT.learningResources.profile(cert);return profile?best(profile.stack,{subject:false}):null;}
  function bestSubjectResource(cert,subject){
    if(!cert||!subject)return null;return best(subject.resources,{subject:true,depth:Number(subject.depth||0)})||bestCertResource(cert);
  }
  CT.roadmapClickthrough=Object.freeze({best,bestCertResource,bestSubjectResource});
})(window);
