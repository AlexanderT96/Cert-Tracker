// Cert Tracker — private market baseline (salary + current role title).
(function initMarketProfileUI(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.marketReadiness||!CT?.marketDashboardUI)return;
  const TITLE_KEY='ct4-market-role-title';
  let roleRows=null;
  const esc=CT.util?.escapeHtml||((value)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  const normal=value=>String(value||'').toLowerCase().replace(/[^a-z0-9+#]+/g,' ').trim();
  const STOP=new Set(['and','the','for','with','security','engineer','analyst','specialist','manager','uk','cyber','technical']);
  function savedTitle(){try{return localStorage.getItem(TITLE_KEY)||'';}catch{return '';}}
  function saveTitle(value){try{if(value)localStorage.setItem(TITLE_KEY,value);else localStorage.removeItem(TITLE_KEY);}catch{}}
  function words(value){return [...new Set(normal(value).split(/\s+/).filter(word=>word.length>2&&!STOP.has(word)))];}
  function catalogueRoles(){return roleRows||(roleRows=CT.marketReadiness.roles());}
  for(const eventName of ['certtracker:career-options-changed','certtracker:capability-evidence-changed','certtracker:goal-changed','certtracker:state-saved'])global.addEventListener(eventName,()=>{roleRows=null;});
  function matchRole(title){
    const query=normal(title),queryWords=words(title);
    if(!query)return null;
    const ranked=catalogueRoles().map(role=>{
      const label=normal(role.label),roleWords=words(role.label),exact=query===label?1:0;
      const overlap=queryWords.length?queryWords.filter(word=>roleWords.some(other=>word===other||word.includes(other)||other.includes(word))).length/queryWords.length:0;
      return {role,score:Math.max(exact,overlap)};
    }).sort((a,b)=>b.score-a.score||b.role.compatibility-a.role.compatibility);
    return ranked[0]?.score>=.4?ranked[0].role:null;
  }
  function evaluation(title,salary){
    const value=Number(salary)||0,role=matchRole(title);
    if(!title&&!value)return '<p class="ct-market-profile-empty" data-market-profile-message>Enter a role title and annual salary to compare your baseline with realistic tracker ranges.</p>';
    if(!title)return '<p class="ct-market-profile-empty" data-market-profile-message>Add a role title so the tracker can map your baseline to a catalogue pathway.</p>';
    if(!role)return `<p class="ct-market-profile-empty" data-market-profile-message>No catalogue role is close enough to “${esc(title)}”. Keep the title, then compare it manually with the adjacent role cards below.</p>`;
    const live=CT.jobMarket?.liveBand?.(role)||null,band=live||CT.marketReadiness.adjustedRange(role),range=`${CT.marketReadiness.money(band.low)}–${CT.marketReadiness.money(band.high)}`;
    let position='Salary not entered';
    if(value){if(value<band.low)position='Below this modelled band';else if(value>band.high)position='Above this modelled band';else position='Inside this modelled band';}
    const source=live?`${live.samples} live salary samples`:'illustrative model range';
    return `<div class="ct-market-profile-result" data-market-profile-match="${esc(role.id)}"><div><strong>${esc(role.label)}</strong><span>${esc(position)} · ${esc(range)} · ${esc(source)}</span></div><div class="ct-market-profile-metrics"><span>${role.compatibility}% compatibility</span><span>M ${role.marketAccess}%</span><span>K ${role.capability}%</span></div><p>This comparison is directional, not a salary guarantee or hiring probability. Practical evidence and employer requirements still decide readiness.</p></div>`;
  }
  function style(){
    if(document.getElementById('ct-market-profile-style'))return;
    const style=document.createElement('style');style.id='ct-market-profile-style';style.textContent=`
      .ct-market-profile{position:relative;z-index:1;margin-top:13px;padding:12px;border:1px solid rgba(71,232,208,.18);border-radius:11px;background:rgba(2,12,17,.36);overflow:hidden}.ct-market-profile-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.ct-market-profile-head h3{margin:0;font-size:11px;letter-spacing:.1em;color:var(--accent,#47e8d0)}.ct-market-profile-head p{margin:4px 0 0;color:var(--muted,#9eb1bf);font-size:10px;line-height:1.4}.ct-market-profile-form{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:9px;align-items:end;margin-top:10px}.ct-market-profile-form label{display:grid;gap:4px;min-width:0;color:var(--muted,#9eb1bf);font-size:10px}.ct-market-profile-form input{box-sizing:border-box;width:100%;min-height:38px;padding:8px 9px;border:1px solid rgba(71,232,208,.24);border-radius:7px;background:rgba(0,0,0,.2);color:var(--text,#d7edf1);font:inherit}.ct-market-profile-form button{min-height:38px;padding:8px 11px;border:1px solid rgba(71,232,208,.3);border-radius:7px;background:rgba(71,232,208,.1);color:var(--text,#d7edf1);font:700 10px/1.2 ui-monospace,monospace;cursor:pointer}.ct-market-profile-result,.ct-market-profile-empty{margin:10px 0 0;padding:9px;border-top:1px solid rgba(255,255,255,.07);color:var(--muted,#9eb1bf);font-size:10px;line-height:1.45}.ct-market-profile-result>div:first-child{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap}.ct-market-profile-result strong{color:var(--text,#d7edf1);font-size:11px}.ct-market-profile-result span{font-size:9px}.ct-market-profile-metrics{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}.ct-market-profile-metrics span{padding:4px 6px;border:1px solid rgba(255,255,255,.1);border-radius:6px;font:700 9px/1 ui-monospace,monospace;color:var(--text,#d7edf1)}.ct-market-profile-result p{margin:7px 0 0}.ct-market-profile-empty{margin-bottom:0}.ct-market-profile :focus-visible{outline:2px solid #47e8d0;outline-offset:2px}
      @media(max-width:760px){.ct-market-profile-form{grid-template-columns:1fr}.ct-market-profile-form button{width:100%}.ct-market-profile-head{display:block}.ct-market-profile-result>div:first-child{display:block}.ct-market-profile-result>div:first-child span{display:block;margin-top:4px}}
    `;document.head.appendChild(style);
  }
  function markup(){
    const title=savedTitle(),salary=Number(state.currentSalary)||0;
    return `<section class="ct-market-profile" data-market-profile aria-label="Your market baseline"><div class="ct-market-profile-head"><div><h3>YOUR MARKET BASELINE</h3><p>Private on this device. Enter your role title and current annual salary to compare against the tracker’s role model.</p></div></div><div class="ct-market-profile-form"><label>Current role title<input data-market-role-title maxlength="120" value="${esc(title)}" placeholder="e.g. Systems Support Engineer" autocomplete="organization-title"></label><label>Current annual salary (£)<input data-market-salary type="number" min="0" max="10000000" step="500" value="${salary||''}" placeholder="e.g. 42000" inputmode="decimal"></label><button type="button" data-market-profile-save>Save baseline</button></div><div data-market-profile-evaluation>${evaluation(title,salary)}</div></section>`;
  }
  function updateResult(host){
    const title=host.querySelector('[data-market-role-title]')?.value.trim()||'',salary=host.querySelector('[data-market-salary]')?.value||'';
    const target=host.querySelector('[data-market-profile-evaluation]');if(target)target.innerHTML=evaluation(title,salary);
  }
  function bind(host){
    if(!host||host.dataset.marketProfileBound)return;host.dataset.marketProfileBound='1';
    const titleInput=host.querySelector('[data-market-role-title]'),salaryInput=host.querySelector('[data-market-salary]'),saveButton=host.querySelector('[data-market-profile-save]');
    [titleInput,salaryInput].forEach(input=>input?.addEventListener('input',()=>updateResult(host)));
    const save=()=>{
      const title=titleInput?.value.trim()||'',raw=salaryInput?.value.trim()||'',salary=raw===''?0:Number(raw);
      if(!title&&!salary){updateResult(host);return;}
      if(!Number.isFinite(salary)||salary<0||salary>10000000){salaryInput?.focus();return;}
      state.currentSalary=salary?Math.round(salary):null;saveTitle(title);
      try{localStorage.setItem('ct2-salary',state.currentSalary?String(state.currentSalary):'');}catch{}
      CT.storage?.persistAll?.();
      roleRows=null;
      global.renderApp?.();
    };
    saveButton?.addEventListener('click',save);[titleInput,salaryInput].forEach(input=>input?.addEventListener('keydown',event=>{if(event.key==='Enter')save();}));
  }
  function install(){
    style();const dashboard=document.querySelector('[data-market-dashboard]');if(!dashboard||dashboard.querySelector('[data-market-profile]'))return;
    const wrapper=document.createElement('div');wrapper.innerHTML=markup();const panel=wrapper.firstElementChild,anchor=dashboard.querySelector('.ct-market-grid');if(anchor)dashboard.insertBefore(panel,anchor);else dashboard.append(panel);bind(panel);
  }
  const app=document.getElementById('app');if(app)new MutationObserver(install).observe(app,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  CT.marketProfileUI=Object.freeze({install,bind,evaluation});
})(window);
