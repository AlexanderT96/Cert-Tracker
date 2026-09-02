// Cert Tracker — automatic responsive layout selection.
// Uses viewport geometry and input capability rather than brittle user-agent sniffing.
(function initResponsiveLayout(global){
  'use strict';

  const root=document.documentElement;
  const MOBILE_MAX=680;
  const TABLET_MAX=1024;
  let frame=0;
  let current='';

  function metrics(){
    const vv=global.visualViewport;
    const width=Math.round(vv?.width||global.innerWidth||root.clientWidth||1024);
    const height=Math.round(vv?.height||global.innerHeight||root.clientHeight||768);
    const coarse=global.matchMedia?.('(pointer: coarse)').matches===true;
    const hover=global.matchMedia?.('(hover: hover)').matches===true;
    const portrait=height>=width;
    return {width,height,shortSide:Math.min(width,height),coarse,hover,portrait};
  }

  function modeFor(m){
    // A phone rotated landscape can exceed the normal mobile width, so short-side + coarse input
    // keeps it in the mobile shell. Tablets retain their own intermediate layout.
    if(m.width<=MOBILE_MAX||(m.coarse&&m.shortSide<=520))return 'mobile';
    if(m.width<=TABLET_MAX||(m.coarse&&m.portrait&&m.width<=1180))return 'tablet';
    return 'desktop';
  }

  function apply(){
    frame=0;
    const m=metrics();
    const mode=modeFor(m);
    root.dataset.layout=mode;
    root.dataset.pointer=m.coarse?'coarse':'fine';
    root.dataset.orientation=m.portrait?'portrait':'landscape';
    root.style.setProperty('--ct-viewport-width',`${m.width}px`);
    root.style.setProperty('--ct-viewport-height',`${m.height}px`);
    if(mode!==current){
      const previous=current||null;
      current=mode;
      try{global.dispatchEvent(new CustomEvent('certtracker:layout-changed',{detail:{mode,previous,...m}}));}catch{}
    }
    return mode;
  }

  function schedule(){
    if(frame)return;
    frame=global.requestAnimationFrame(apply);
  }

  apply();
  global.addEventListener('resize',schedule,{passive:true});
  global.addEventListener('orientationchange',schedule,{passive:true});
  global.visualViewport?.addEventListener('resize',schedule,{passive:true});
  global.matchMedia?.('(pointer: coarse)').addEventListener?.('change',schedule);

  global.CertTrackerResponsive=Object.freeze({apply,metrics,mode:()=>current,breakpoints:Object.freeze({mobile:MOBILE_MAX,tablet:TABLET_MAX})});
})(window);
