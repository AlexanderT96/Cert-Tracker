// Cert Tracker — restrained pointer-responsive material depth.
(function initDepthUI(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT)return;
  const SELECTOR=['.card','.study-hero','.gate-block','.ct3-card','.ct-learning-focus','.ct-learning-phase-body','.ct-map-cert','.ct-map-gate','.cert-row'].join(',');
  let raf=0,pending=null;

  function decorate(root=document){
    root.querySelectorAll?.(SELECTOR).forEach(el=>{
      if(el.classList.contains('ct-depth-surface'))return;
      el.classList.add('ct-depth-surface');
    });
  }
  function clear(el){
    if(!el)return;
    el.dataset.depthActive='false';
    el.style.removeProperty('--ct-rx');el.style.removeProperty('--ct-ry');
    el.style.removeProperty('--ct-depth-x');el.style.removeProperty('--ct-depth-y');
  }
  function applyPointer(){
    raf=0;const data=pending;pending=null;if(!data)return;
    const {el,x,y}=data,rect=el.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const nx=Math.max(0,Math.min(1,(x-rect.left)/rect.width)),ny=Math.max(0,Math.min(1,(y-rect.top)/rect.height));
    const rx=((.5-ny)*1.2).toFixed(2),ry=((nx-.5)*1.45).toFixed(2);
    el.style.setProperty('--ct-depth-x',`${(nx*100).toFixed(1)}%`);
    el.style.setProperty('--ct-depth-y',`${(ny*100).toFixed(1)}%`);
    el.style.setProperty('--ct-rx',`${rx}deg`);el.style.setProperty('--ct-ry',`${ry}deg`);
    el.dataset.depthActive='true';
  }
  function pointerMove(event){
    if(!global.matchMedia?.('(hover:hover) and (pointer:fine)').matches)return;
    if(document.documentElement.dataset.ctAnimations==='off')return;
    const el=event.target.closest?.('.ct-depth-surface');if(!el)return;
    pending={el,x:event.clientX,y:event.clientY};if(!raf)raf=requestAnimationFrame(applyPointer);
  }
  function pointerOut(event){
    const el=event.target.closest?.('.ct-depth-surface');if(!el)return;
    if(event.relatedTarget&&el.contains(event.relatedTarget))return;clear(el);
  }
  function init(){decorate();new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(node=>{if(node.nodeType!==1)return;if(node.matches?.(SELECTOR))node.classList.add('ct-depth-surface');decorate(node);}))).observe(document.body,{childList:true,subtree:true});document.addEventListener('pointermove',pointerMove,{passive:true});document.addEventListener('pointerout',pointerOut,{passive:true});}
  CT.depthUI=Object.freeze({decorate,clear});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
