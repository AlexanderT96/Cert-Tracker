// Cert Tracker — keyboard and dialog accessibility hardening.
(function initAccessibility(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT)return;
  const selector='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function activeDialog(){return [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].at(-1)||null;}
  document.addEventListener('keydown',event=>{
    const dialog=activeDialog();if(!dialog)return;
    if(event.key==='Escape'){const close=dialog.querySelector('.ct3-close,[aria-label="Close"]');if(close){event.preventDefault();close.click();}return;}
    if(event.key!=='Tab')return;const focusable=[...dialog.querySelectorAll(selector)].filter(el=>el.offsetParent!==null);if(!focusable.length){event.preventDefault();dialog.tabIndex=-1;dialog.focus();return;}const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  if(!document.getElementById('ct-live-status')){const live=document.createElement('div');live.id='ct-live-status';live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');live.style.cssText='position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';document.body.appendChild(live);CT.events.on('state-saved',detail=>{live.textContent=`Saved ${detail?.key||'change'}`;});CT.events.on('sync-complete',detail=>{live.textContent=`Sync ${detail?.direction||'complete'} finished`;});}
  CT.accessibility=Object.freeze({activeDialog});
})(window);
