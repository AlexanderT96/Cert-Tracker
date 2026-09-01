// Cert Tracker — user-controlled visual and layout personalisation.
// Settings are browser-local state and participate in encrypted backup/sync.
(function initPersonalization(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT?.store)throw new Error('state-core.js must load before personalization.js');

  const PRESETS=Object.freeze({
    professional:Object.freeze({label:'Professional Navy',description:'Default enterprise engineering interface',colors:{bg:'#07111f',surface:'#0c1828',surface2:'#111f32',surface3:'#17283d',border:'#223750',border2:'#31506f',text:'#edf5ff',muted:'#9db0c6',dim:'#6f849d',accent:'#4aa8ff',success:'#38d39f',warning:'#f4bc55',danger:'#f46f7f',secondary:'#9b8cff'}}),
    graphite:Object.freeze({label:'Graphite',description:'Neutral dark operations console',colors:{bg:'#0b0d10',surface:'#11151a',surface2:'#181e25',surface3:'#202832',border:'#2e3945',border2:'#435263',text:'#f3f6f8',muted:'#a7b1bc',dim:'#77838f',accent:'#64a7ff',success:'#4bd0a0',warning:'#e9b85a',danger:'#ed7582',secondary:'#a89cff'}}),
    steel:Object.freeze({label:'Steel Blue',description:'Cool technical architecture workspace',colors:{bg:'#09131a',surface:'#0e1b24',surface2:'#142632',surface3:'#1b3240',border:'#294655',border2:'#3d6272',text:'#eef8fb',muted:'#a6bdc7',dim:'#718e9b',accent:'#53c3df',success:'#41d6a3',warning:'#efbd59',danger:'#ef7583',secondary:'#8fa7ff'}}),
    light:Object.freeze({label:'Executive Light',description:'High-legibility light professional theme',colors:{bg:'#eef3f8',surface:'#ffffff',surface2:'#f5f8fb',surface3:'#e8eef5',border:'#cad5e1',border2:'#aebdcd',text:'#102033',muted:'#52657a',dim:'#7b8da1',accent:'#1769d2',success:'#087e5d',warning:'#9a6500',danger:'#b63f50',secondary:'#6757c7'}}),
    contrast:Object.freeze({label:'High Contrast',description:'Maximum separation and accessibility',colors:{bg:'#000000',surface:'#0b0b0b',surface2:'#151515',surface3:'#202020',border:'#575757',border2:'#858585',text:'#ffffff',muted:'#d2d2d2',dim:'#a8a8a8',accent:'#5bb7ff',success:'#51e3ab',warning:'#ffd166',danger:'#ff7185',secondary:'#b7a6ff'}})
  });

  const DEFAULTS=Object.freeze({
    preset:'professional',appTitle:'Cert Tracker',fontScale:1,density:1,radius:10,cardRadius:12,controlRadius:8,contentWidth:1180,panelOpacity:.97,shadowStrength:.28,glowStrength:.12,borderWidth:1,
    animations:true,glass:true,shadows:true,navStyle:'standard',badgeStyle:'standard',
    colors:{...PRESETS.professional.colors},
    phaseColors:{ph1:'#4aa8ff',ph2:'#5cc8ff',ph3:'#38d39f',ph4:'#f4bc55',ph5:'#9b8cff',ph6:'#8fa2b8'},
    visibility:{header:true,navigation:true,dashboard:true,certifications:true,strategy:true,learning:true,market:true,career:true,plan:true,sync:true},
    tabOrder:['dashboard','learning','certifications','strategy','customize'],
    tabLabels:{dashboard:'Dashboard',learning:'Learning Path',certifications:'Certifications',strategy:'Strategy',customize:'Customize'}
  });

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function merge(base,extra){const out=clone(base);if(!extra||typeof extra!=='object')return out;for(const [k,v]of Object.entries(extra)){if(v&&typeof v==='object'&&!Array.isArray(v)&&out[k]&&typeof out[k]==='object'&&!Array.isArray(out[k]))out[k]={...out[k],...v};else out[k]=v;}return out;}
  function settings(){return merge(DEFAULTS,state.customization||{});}
  function safeColor(value,fallback){return /^#[0-9a-f]{6}$/i.test(String(value||''))?String(value):fallback;}
  function setVar(name,value){document.documentElement.style.setProperty(name,String(value));}
  function tabOrder(){const s=settings();const valid=['dashboard','learning','certifications','strategy','customize'];return [...new Set((s.tabOrder||[]).filter(x=>valid.includes(x)).concat(valid))].filter(tab=>tab==='customize'||s.visibility?.[tab]!==false);}
  function tabLabel(tab){return String(settings().tabLabels?.[tab]||DEFAULTS.tabLabels[tab]||tab);}
  function title(){return String(settings().appTitle||DEFAULTS.appTitle).slice(0,40);}

  function apply(input=settings()){
    const s=merge(DEFAULTS,input);const c=s.colors||DEFAULTS.colors,p=s.phaseColors||DEFAULTS.phaseColors,root=document.documentElement;
    setVar('--bg',safeColor(c.bg,DEFAULTS.colors.bg));setVar('--surface',safeColor(c.surface,DEFAULTS.colors.surface));setVar('--surface-2',safeColor(c.surface2,DEFAULTS.colors.surface2));setVar('--surface-3',safeColor(c.surface3,DEFAULTS.colors.surface3));
    setVar('--border',safeColor(c.border,DEFAULTS.colors.border));setVar('--border-2',safeColor(c.border2,DEFAULTS.colors.border2));setVar('--text',safeColor(c.text,DEFAULTS.colors.text));setVar('--muted',safeColor(c.muted,DEFAULTS.colors.muted));setVar('--dim',safeColor(c.dim,DEFAULTS.colors.dim));
    setVar('--blue',safeColor(c.accent,DEFAULTS.colors.accent));setVar('--green',safeColor(c.success,DEFAULTS.colors.success));setVar('--amber',safeColor(c.warning,DEFAULTS.colors.warning));setVar('--red',safeColor(c.danger,DEFAULTS.colors.danger));setVar('--purple',safeColor(c.secondary,DEFAULTS.colors.secondary));
    setVar('--blue-bg',`color-mix(in srgb, ${safeColor(c.accent,DEFAULTS.colors.accent)} 22%, ${safeColor(c.bg,DEFAULTS.colors.bg)})`);setVar('--blue-text',`color-mix(in srgb, ${safeColor(c.accent,DEFAULTS.colors.accent)} 58%, white)`);
    setVar('--green-bg',`color-mix(in srgb, ${safeColor(c.success,DEFAULTS.colors.success)} 18%, ${safeColor(c.bg,DEFAULTS.colors.bg)})`);setVar('--green-text',`color-mix(in srgb, ${safeColor(c.success,DEFAULTS.colors.success)} 58%, white)`);
    setVar('--amber-bg',`color-mix(in srgb, ${safeColor(c.warning,DEFAULTS.colors.warning)} 18%, ${safeColor(c.bg,DEFAULTS.colors.bg)})`);setVar('--amber-text',`color-mix(in srgb, ${safeColor(c.warning,DEFAULTS.colors.warning)} 60%, white)`);
    setVar('--red-bg',`color-mix(in srgb, ${safeColor(c.danger,DEFAULTS.colors.danger)} 18%, ${safeColor(c.bg,DEFAULTS.colors.bg)})`);setVar('--red-text',`color-mix(in srgb, ${safeColor(c.danger,DEFAULTS.colors.danger)} 60%, white)`);
    setVar('--purple-bg',`color-mix(in srgb, ${safeColor(c.secondary,DEFAULTS.colors.secondary)} 18%, ${safeColor(c.bg,DEFAULTS.colors.bg)})`);setVar('--purple-text',`color-mix(in srgb, ${safeColor(c.secondary,DEFAULTS.colors.secondary)} 58%, white)`);
    Object.keys(p).forEach(key=>setVar(`--${key}`,safeColor(p[key],DEFAULTS.phaseColors[key])));
    setVar('--ct-font-scale',Math.max(.8,Math.min(1.35,Number(s.fontScale)||1)));setVar('--ct-density',Math.max(.72,Math.min(1.3,Number(s.density)||1)));setVar('--ct-radius',`${Math.max(0,Math.min(24,Number(s.radius)||0))}px`);setVar('--ct-card-radius',`${Math.max(0,Math.min(28,Number(s.cardRadius)||0))}px`);setVar('--ct-control-radius',`${Math.max(0,Math.min(20,Number(s.controlRadius)||0))}px`);setVar('--ct-content-width',`${Math.max(760,Math.min(1800,Number(s.contentWidth)||1180))}px`);setVar('--ct-panel-opacity',Math.max(.72,Math.min(1,Number(s.panelOpacity)||.97)));setVar('--ct-shadow-strength',Math.max(0,Math.min(.75,Number(s.shadowStrength)||0)));setVar('--ct-glow-strength',Math.max(0,Math.min(.5,Number(s.glowStrength)||0)));setVar('--ct-border-width',`${Math.max(0,Math.min(3,Number(s.borderWidth)||1))}px`);
    root.dataset.ctAnimations=s.animations===false?'off':'on';root.dataset.ctGlass=s.glass===false?'off':'on';root.dataset.ctShadows=s.shadows===false?'off':'on';root.dataset.ctNav=s.navStyle==='compact'?'compact':'standard';root.dataset.ctBadges=s.badgeStyle==='compact'?'compact':'standard';
    applyVisibility(s.visibility||{});applyNavigation();organiseDock();return s;
  }
  function applyVisibility(v){const rules={header:'.header',navigation:'.tabs',market:'#ct31-market-launcher',career:'#ct-career-launcher',plan:'#ct-intel-launcher',sync:'#ct-github-sync-launcher',learning:'#ct-learning-launcher'};for(const [key,selector]of Object.entries(rules)){document.querySelectorAll(selector).forEach(el=>{el.style.display=v[key]===false?'none':'';});}document.querySelectorAll('#ct-customize-launcher').forEach(el=>{el.style.display='';});}
  function ensureWorkspaceButton(tab){const nav=document.querySelector('.tabs');if(!nav)return null;let button=nav.querySelector(`[data-ct-workspace="${tab}"]`);if(button)return button;
    if(['dashboard','certifications','strategy'].includes(tab)){button=[...nav.querySelectorAll('.tab')].find(b=>(b.getAttribute('onclick')||'').includes(`'${tab}'`));if(button){button.dataset.ctWorkspace=tab;return button;}}
    button=document.createElement('button');button.className='tab';button.type='button';button.dataset.ctWorkspace=tab;button.addEventListener('click',()=>{if(tab==='learning')CT.learningPath?.open?.();else if(tab==='customize')CT.personalizationUI?.open?.();});nav.appendChild(button);return button;
  }
  function applyNavigation(){const nav=document.querySelector('.tabs');if(!nav)return;const s=settings();for(const tab of ['dashboard','learning','certifications','strategy','customize']){const b=ensureWorkspaceButton(tab);if(!b)continue;b.textContent=tabLabel(tab);b.style.display=(tab==='customize'||s.visibility?.[tab]!==false)?'':'none';}
    tabOrder().forEach(tab=>{const b=nav.querySelector(`[data-ct-workspace="${tab}"]`);if(b)nav.appendChild(b);});const titleNode=document.querySelector('.header-title');if(titleNode)titleNode.textContent=title();}
  function update(patch){state.customization=merge(settings(),patch);save.customization?.();apply(state.customization);CT.events.emit('personalization-changed',settings());if(typeof renderApp==='function')renderApp();requestAnimationFrame(()=>apply());return settings();}
  function preset(key){const p=PRESETS[key];if(!p)throw new Error('Unknown preset.');return update({preset:key,colors:{...p.colors}});}
  function reset(){state.customization=clone(DEFAULTS);save.customization?.();apply(state.customization);CT.events.emit('personalization-changed',settings());if(typeof renderApp==='function')renderApp();requestAnimationFrame(()=>apply());return settings();}
  function organiseDock(){
    let dock=document.getElementById('ct-command-dock');if(!dock){dock=document.createElement('div');dock.id='ct-command-dock';dock.className='ct-command-dock';dock.setAttribute('aria-label','Tracker tools');document.body.appendChild(dock);}
    ['ct-learning-launcher','ct-intel-launcher','ct-career-launcher','ct31-market-launcher','ct-github-sync-launcher','ct-customize-launcher'].forEach(id=>{const el=document.getElementById(id);if(el&&el.parentElement!==dock)dock.appendChild(el);});
    const s=settings();const visible=['learning','plan','career','market','sync'].some(k=>s.visibility?.[k]!==false);dock.style.display=(visible||document.getElementById('ct-customize-launcher'))?'':'none';
  }
  function init(){if(!state.customization||typeof state.customization!=='object')state.customization=clone(DEFAULTS);apply();new MutationObserver(()=>{applyVisibility(settings().visibility||{});applyNavigation();organiseDock();}).observe(document.body,{childList:true,subtree:true});}
  CT.personalization=Object.freeze({PRESETS,DEFAULTS,settings,apply,update,preset,reset,tabOrder,tabLabel,title,applyNavigation,organiseDock});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
