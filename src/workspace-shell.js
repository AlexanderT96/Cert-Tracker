// Cert Tracker — professional workspace shell.
// Adds dedicated Learning Path / Roadmap Map / Customize workspaces without putting personal data in public code.
(function initWorkspaceShell(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.personalization||!CT?.learningPath||!CT?.roadmapMap||!CT?.personalizationUI||!CT?.topicEngine||!CT?.recommendations)return;
  const esc=CT.util.escapeHtml;
  const originalRenderApp=global.renderApp;
  if(typeof originalRenderApp!=='function')return;

  const FALLBACK_TABS=['dashboard','learning','roadmap','certifications','strategy','customize'];
  const MOBILE_PRIMARY=[
    ['dashboard','Dashboard'],
    ['learning','Learn'],
    ['roadmap','Map'],
    ['certifications','Certs']
  ];

  function availableTabs(){const order=CT.personalization.tabOrder?.()||FALLBACK_TABS;return order.length?order:FALLBACK_TABS;}
  function ensureActiveTab(){const tabs=availableTabs();if(!tabs.includes(state.currentTab))state.currentTab=tabs.includes('dashboard')?'dashboard':tabs[0];}
  function tabButton(tab){const active=state.currentTab===tab?' active':'';return `<button type="button" class="tab${active}" data-workspace-tab="${esc(tab)}" data-ct-workspace="${esc(tab)}">${esc(CT.personalization.tabLabel(tab))}</button>`;}

  function canonicalTab(button){
    const direct=button?.dataset?.workspaceTab||button?.dataset?.ctWorkspace;
    if(FALLBACK_TABS.includes(direct))return direct;
    const legacy=button?.getAttribute?.('onclick')||'';
    return FALLBACK_TABS.find(tab=>legacy.includes(`'${tab}'`))||null;
  }
  function dedupeNavigation(nav=document.querySelector('.tabs')){
    if(!nav)return;
    const seen=new Set();
    [...nav.querySelectorAll('.tab')].forEach(button=>{
      const tab=canonicalTab(button);if(!tab)return;
      if(seen.has(tab)){button.remove();return;}
      seen.add(tab);
      button.dataset.workspaceTab=tab;
      button.dataset.ctWorkspace=tab;
    });
  }
  function installNavigationGuard(nav=document.querySelector('.tabs')){
    if(!nav||nav.dataset.ctDedupeGuard==='1')return;
    nav.dataset.ctDedupeGuard='1';
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;queued=true;
      queueMicrotask(()=>{queued=false;dedupeNavigation(nav);});
    }).observe(nav,{childList:true});
  }
  function renderNavigation(){
    const nav=document.querySelector('.tabs');if(!nav)return;
    nav.innerHTML=availableTabs().map(tabButton).join('');
    dedupeNavigation(nav);
    installNavigationGuard(nav);
    nav.querySelectorAll('[data-workspace-tab]').forEach(button=>button.addEventListener('click',()=>{state.currentTab=button.dataset.workspaceTab;global.renderApp();}));
  }
  function renderHeader(){const title=document.querySelector('.header-title');if(title)title.textContent=CT.personalization.title();const sub=document.querySelector('.header-sub');if(sub&&/^v24\b/.test(sub.textContent||''))sub.innerHTML=sub.innerHTML.replace(/^v24/,`v${esc(CT.version.app)}`);document.title=CT.personalization.title();}

  function closeMobileMore(){
    const layer=document.getElementById('ct-mobile-more-layer');
    if(layer)layer.hidden=true;
    document.documentElement.classList.remove('ct-mobile-menu-open');
    document.getElementById('ct-mobile-more-button')?.focus?.({preventScroll:true});
  }
  function openMobileMore(){
    const layer=document.getElementById('ct-mobile-more-layer');if(!layer)return;
    const settings=CT.personalization.settings?.()||{};
    const tools=[
      ['ct3-launcher',"Today's Recommendations",'dashboard'],
      ['ct-intel-launcher','Plan','plan'],
      ['ct31-market-launcher','ROI','market'],
      ['ct-github-sync-launcher','Sync','sync'],
      ['ct-career-launcher','Career','career']
    ];
    const body=layer.querySelector('.ct-mobile-more-actions');
    body.innerHTML='';
    const add=(label,handler,active=false)=>{
      const button=document.createElement('button');button.type='button';button.className='ct-mobile-more-action';button.textContent=label;
      if(active)button.setAttribute('aria-current','page');
      button.addEventListener('click',()=>{closeMobileMore();handler();});body.appendChild(button);
    };
    if(availableTabs().includes('strategy'))add(CT.personalization.tabLabel('strategy'),()=>switchTab('strategy'),state.currentTab==='strategy');
    if(availableTabs().includes('customize'))add(CT.personalization.tabLabel('customize'),()=>switchTab('customize'),state.currentTab==='customize');
    tools.forEach(([id,label,visibilityKey])=>{
      if(settings.visibility?.[visibilityKey]===false)return;
      const launcher=document.getElementById(id);if(!launcher)return;
      add(label,()=>launcher.click());
    });
    layer.hidden=false;
    document.documentElement.classList.add('ct-mobile-menu-open');
    layer.querySelector('.ct-mobile-more-close')?.focus?.({preventScroll:true});
  }
  function ensureMobileNavigation(){
    let nav=document.getElementById('ct-mobile-navigation');
    if(!nav){
      nav=document.createElement('nav');nav.id='ct-mobile-navigation';nav.className='ct-mobile-navigation';nav.setAttribute('aria-label','Primary tracker navigation');
      nav.innerHTML=MOBILE_PRIMARY.map(([tab,label])=>`<button type="button" data-mobile-tab="${tab}">${label}</button>`).join('')+'<button type="button" id="ct-mobile-more-button" data-mobile-more="true">More</button>';
      nav.querySelectorAll('[data-mobile-tab]').forEach(button=>button.addEventListener('click',()=>switchTab(button.dataset.mobileTab)));
      nav.querySelector('[data-mobile-more]')?.addEventListener('click',openMobileMore);
      document.body.appendChild(nav);
    }
    let layer=document.getElementById('ct-mobile-more-layer');
    if(!layer){
      layer=document.createElement('div');layer.id='ct-mobile-more-layer';layer.className='ct-mobile-more-layer';layer.hidden=true;
      layer.innerHTML='<div class="ct-mobile-more-backdrop" data-mobile-more-close="true"></div><section class="ct-mobile-more-sheet" role="dialog" aria-modal="true" aria-labelledby="ct-mobile-more-title"><div class="ct-mobile-more-head"><strong id="ct-mobile-more-title">More</strong><button type="button" class="ct-mobile-more-close" aria-label="Close menu">Close</button></div><div class="ct-mobile-more-actions"></div></section>';
      layer.querySelector('.ct-mobile-more-close').addEventListener('click',closeMobileMore);
      layer.querySelector('[data-mobile-more-close]').addEventListener('click',closeMobileMore);
      document.body.appendChild(layer);
    }
    return nav;
  }
  function syncMobileNavigation(){
    const nav=ensureMobileNavigation();
    nav.querySelectorAll('[data-mobile-tab]').forEach(button=>{
      const active=button.dataset.mobileTab===state.currentTab;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    const more=nav.querySelector('[data-mobile-more]');
    const moreActive=['strategy','customize'].includes(state.currentTab);
    more?.classList.toggle('active',moreActive);
    if(moreActive)more?.setAttribute('aria-current','page');else more?.removeAttribute('aria-current');
  }

  function focusHtml(){
    const nextCert=CT.recommendations.recommend({limit:1,horizon:'now'})[0]||null;
    const nextTopic=CT.topicEngine.next({cert:nextCert?.cert||null});
    if(!nextCert&&!nextTopic)return'';
    const cert=nextCert?`<div class="ct-learning-focus"><div class="ct-learning-eyebrow">Recommended certification</div><h2>${esc(nextCert.name)}</h2><p>${esc(nextCert.reasons.slice(0,3).join(' · '))}</p><div class="ct-learning-meta"><span class="ct-learning-chip">K${nextCert.career.K} knowledge</span><span class="ct-learning-chip">M${nextCert.career.M} market</span><span class="ct-learning-chip">${esc(nextCert.career.T)} timing</span><span class="ct-learning-chip">${nextCert.readiness.score}% exam ready</span></div></div>`:'';
    const topic=nextTopic?`<div class="ct-learning-focus"><div class="ct-learning-eyebrow">Study alongside it</div><h2>${esc(nextTopic.topic.title)}</h2><p>${esc(nextTopic.topic.why)}</p><div class="ct-learning-meta"><span class="ct-learning-chip">${nextTopic.mastery}% evidenced</span><span class="ct-learning-chip">${nextTopic.certSynergy}% cert synergy</span><span class="ct-learning-chip">Phase ${nextTopic.phase}</span></div><div style="margin-top:10px">${nextTopic.topic.actions.slice(0,2).map(action=>`<div class="ct3-muted" style="margin-top:5px">→ ${esc(action)}</div>`).join('')}</div></div>`:'';
    return `<section class="ct-dashboard-learning-focus" aria-label="Recommended learning focus"><div class="ct-learning-hero">${cert}${topic}</div></section>`;
  }
  function renderWorkspaceContent(){
    const content=document.getElementById('tab-content');if(!content)return;
    if(state.currentTab==='strategy'&&CT.careerOptionsUI){CT.careerOptionsUI.bind(content);return;}
    if(state.currentTab==='learning'){content.innerHTML=CT.learningPath.render();return;}
    if(state.currentTab==='roadmap'){content.innerHTML=CT.roadmapMap.render();CT.roadmapMap.bind(content);return;}
    if(state.currentTab==='customize'){content.innerHTML=CT.personalizationUI.render();CT.personalizationUI.bind(content);return;}
    if(state.currentTab==='dashboard'){
      const focus=focusHtml();if(focus&&!content.querySelector('.ct-dashboard-learning-focus'))content.insertAdjacentHTML('afterbegin',focus);
    }
  }
  function decorate(){ensureActiveTab();syncMobileNavigation();renderHeader();renderNavigation();renderWorkspaceContent();CT.personalization.organiseDock?.();}
  function renderApp(){ensureActiveTab();originalRenderApp();decorate();}
  function switchTab(tab){const tabs=availableTabs();if(!tabs.includes(tab))return;state.currentTab=tab;renderApp();}

  global.renderApp=renderApp;
  global.switchTab=switchTab;
  global.addEventListener('certtracker:layout-changed',()=>{syncMobileNavigation();if(document.documentElement.dataset.layout!=='mobile')closeMobileMore();});
  global.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.getElementById('ct-mobile-more-layer')?.hidden)closeMobileMore();});
  CT.workspaceShell=Object.freeze({renderApp,switchTab,availableTabs,decorate,focusHtml,dedupeNavigation,syncMobileNavigation});
  // bootstrap.js owns initial rendering. Keeping this module passive prevents duplicate
  // first renders and keeps the browser regression harness lightweight.
})(window);
