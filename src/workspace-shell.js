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
  function availableTabs(){const order=CT.personalization.tabOrder?.()||FALLBACK_TABS;return order.length?order:FALLBACK_TABS;}
  function ensureActiveTab(){const tabs=availableTabs();if(!tabs.includes(state.currentTab))state.currentTab=tabs.includes('dashboard')?'dashboard':tabs[0];}
  function tabButton(tab){const active=state.currentTab===tab?' active':'';return `<button class="tab${active}" data-workspace-tab="${esc(tab)}">${esc(CT.personalization.tabLabel(tab))}</button>`;}
  function renderNavigation(){const nav=document.querySelector('.tabs');if(!nav)return;nav.innerHTML=availableTabs().map(tabButton).join('');nav.querySelectorAll('[data-workspace-tab]').forEach(button=>button.addEventListener('click',()=>{state.currentTab=button.dataset.workspaceTab;global.renderApp();}));}
  function renderHeader(){const title=document.querySelector('.header-title');if(title)title.textContent=CT.personalization.title();const sub=document.querySelector('.header-sub');if(sub&&/^v24\b/.test(sub.textContent||''))sub.innerHTML=sub.innerHTML.replace(/^v24/,`v${esc(CT.version.app)}`);document.title=CT.personalization.title();}
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
    if(state.currentTab==='learning'){content.innerHTML=CT.learningPath.render();return;}
    if(state.currentTab==='roadmap'){content.innerHTML=CT.roadmapMap.render();CT.roadmapMap.bind(content);return;}
    if(state.currentTab==='customize'){content.innerHTML=CT.personalizationUI.render();CT.personalizationUI.bind(content);return;}
    if(state.currentTab==='dashboard'){
      const focus=focusHtml();if(focus&&!content.querySelector('.ct-dashboard-learning-focus'))content.insertAdjacentHTML('afterbegin',focus);
    }
  }
  function decorate(){ensureActiveTab();renderHeader();renderNavigation();renderWorkspaceContent();CT.personalization.organiseDock?.();}
  function renderApp(){ensureActiveTab();originalRenderApp();decorate();}
  function switchTab(tab){const tabs=availableTabs();if(!tabs.includes(tab))return;state.currentTab=tab;renderApp();}

  global.renderApp=renderApp;
  global.switchTab=switchTab;
  CT.workspaceShell=Object.freeze({renderApp,switchTab,availableTabs,decorate,focusHtml});
  // bootstrap.js owns initial rendering. Keeping this module passive prevents duplicate
  // first renders and keeps the browser regression harness lightweight.
})(window);
