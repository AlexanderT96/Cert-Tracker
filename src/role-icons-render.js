// Cert Tracker — synchronous role/filter icon rendering.
//
// professional-icons.js is deliberately a DOM adapter so it can also clean
// legacy markup produced by older views.  These small render wrappers put the
// same themed emblems in the initial HTML as well, avoiding a paint-timing
// race on slower browsers (especially WebKit and mobile Safari).
(function initRoleIconRender(global){
  'use strict';
  const CT=global.CertTrackerV3,icons=CT?.professionalIcons,model=CT?.careerOptions;
  if(!CT||!icons)return;

  const escaped=CT.util?.escapeHtml||((value)=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])));

  function careerMarkup(html){
    if(!model?.ROLES?.length)return String(html);
    const byTitle=new Map(model.ROLES.map(role=>[escaped(role.title),role]));
    return String(html).replace(/<h3>([^<]*)<\/h3>/g,(match,title)=>{
      const role=byTitle.get(title.trim());
      if(!role)return match;
      return `<h3>${icons.filterIconHTML(role.id,role.title)}${title}</h3>`;
    });
  }

  const originalStrategy=global.renderStrategy;
  if(typeof originalStrategy==='function'&&!originalStrategy.__ctRoleIcons){
    const wrappedStrategy=function(...args){return careerMarkup(originalStrategy.apply(this,args));};
    wrappedStrategy.__ctRoleIcons=true;
    global.renderStrategy=wrappedStrategy;
  }

  // Run the DOM adapter in the same turn as the view render.  This keeps
  // filter chips, status rows and banner icons from briefly showing their
  // legacy glyphs while the MutationObserver is waiting for a frame.
  const originalTabContent=global.renderTabContent;
  if(typeof originalTabContent==='function'&&!originalTabContent.__ctRoleIcons){
    const wrappedTabContent=function(...args){
      const result=originalTabContent.apply(this,args);
      icons.apply(document);
      return result;
    };
    wrappedTabContent.__ctRoleIcons=true;
    global.renderTabContent=wrappedTabContent;
  }

  const originalMap=CT.roadmapMap;
  if(originalMap&&typeof originalMap.render==='function'&&!originalMap.render.__ctRoleIcons){
    const originalRender=originalMap.render;
    const wrappedRender=function(...args){
      const html=String(originalRender.apply(originalMap,args));
      const id=typeof state!=='undefined'&&state.filter?state.filter:'my-path';
      const scopeLabel=typeof state!=='undefined'&&state.filter==='my-path'?'My Path':(typeof global.getFilterDefs==='function'?(global.getFilterDefs().filters||[]).find(item=>item.id===id)?.label||id:id);
      const icon=icons.filterIconHTML(id,String(scopeLabel).replace(/\s*▾$/,''));
      return html
        .replace(/(<div class="ct-map-scope"><span>ACTIVE FILTER<\/span><strong>)/,`$1${icon}`)
        .replace(/(<summary><span>Path filters · )([^<]*)(<\/span>)/,`$1${icon}$2$3`);
    };
    wrappedRender.__ctRoleIcons=true;
    CT.roadmapMap=Object.freeze({...originalMap,render:wrappedRender});
  }
})(window);
