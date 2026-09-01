// Cert Tracker — application bootstrap and non-invasive renderer integration.
(function bootstrap(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT)throw new Error('Cert Tracker modules were not loaded correctly.');

  function applyVersionLabel(){const host=document.querySelector('.header-sub');if(!host)return;[...host.childNodes].forEach(node=>{if(node.nodeType===Node.TEXT_NODE)node.textContent=node.textContent.replace(/v\d+(?:\.\d+){0,2}\b/g,`v${CT.version.app}`);});if(!/v\d/.test(host.textContent||''))host.insertAdjacentText('afterbegin',`v${CT.version.app} · `);}
  function patchTrackRows(){const card=[...document.querySelectorAll('.card')].find(el=>/Overall & Tracks/i.test(el.querySelector('.card-title')?.textContent||''));if(!card)return;for(const{track,colour}of[{track:'FOUNDATION',colour:'var(--blue)'},{track:'ARCHITECT',colour:'var(--purple,var(--blue))'},{track:'IDENTITY-SEC',colour:'var(--cyan,var(--blue))'}]){const certs=CERTS.filter(cert=>cert.track===track);if(!certs.length||card.querySelector(`[data-track-extension="${track}"]`))continue;const passed=certs.filter(cert=>state.passes?.[cert.id]).length,pct=Math.round(passed/certs.length*100),row=document.createElement('div');row.className='track-row';row.dataset.trackExtension=track;row.innerHTML=`<div class="track-row-meta"><span class="badge badge-cond">${CT.util.escapeHtml(track)}</span><span style="font-size:10px;color:var(--dim)">${passed}/${certs.length}</span></div>${typeof progressBarHTML==='function'?progressBarHTML(pct,colour,'5px'):''}`;card.appendChild(row);}}
  let queued=false;function postRender(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;applyVersionLabel();patchTrackRows();if(CT.ux&&!document.getElementById('ct3-launcher'))CT.ux.init();});}

  const app=document.getElementById('app');if(app){new MutationObserver(postRender).observe(app,{childList:true,subtree:true});if(!app.childNodes.length&&typeof renderApp==='function'){try{renderApp();}catch(error){console.error('[CertTracker] initial render failed',error);}}}
  postRender();
  global.CertTracker=CT;
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('[CertTracker] service worker registration failed',error));
  CT.notifications?.checkAndNotify?.();
  CT.events.emit('ready',{version:CT.version,diagnostics:CT.validation?.diagnostics,path:CT.phases?.pathStatus?.()});
})(window);
