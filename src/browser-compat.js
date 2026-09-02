// Cert Tracker — cross-browser capability detection and tiny safe fallbacks.
// Targets current Chromium, Firefox, Safari/iOS Safari and Edge without user-agent sniffing.
(function initBrowserCompat(global){
  'use strict';
  const root=document.documentElement;

  // Small standards fallbacks used by the app on older-but-still-viable engines.
  if(typeof global.queueMicrotask!=='function')global.queueMicrotask=fn=>Promise.resolve().then(fn).catch(error=>setTimeout(()=>{throw error;},0));
  if(typeof global.CustomEvent!=='function'){
    global.CustomEvent=function CustomEvent(type,params){const event=document.createEvent('CustomEvent');event.initCustomEvent(type,!!params?.bubbles,!!params?.cancelable,params?.detail);return event;};
  }
  if(!global.CSS)global.CSS={};
  if(typeof global.CSS.escape!=='function')global.CSS.escape=value=>String(value).replace(/[^a-zA-Z0-9_-]/g,ch=>`\\${ch.codePointAt(0).toString(16)} `);

  const supports=(property,value)=>{
    try{return typeof global.CSS?.supports==='function'&&global.CSS.supports(property,value);}catch{return false;}
  };
  const capabilities={
    colorMix:supports('color','color-mix(in srgb, #000 50%, #fff)'),
    clipPath:supports('clip-path','polygon(0 0,100% 0,100% 100%,0 100%)'),
    backdropFilter:supports('backdrop-filter','blur(2px)')||supports('-webkit-backdrop-filter','blur(2px)'),
    dvh:supports('height','100dvh'),
    sticky:supports('position','sticky')||supports('position','-webkit-sticky'),
    grid:supports('display','grid'),
    webCrypto:!!global.crypto?.subtle,
    serviceWorker:'serviceWorker' in navigator,
    visualViewport:!!global.visualViewport,
    resizeObserver:'ResizeObserver' in global,
    intersectionObserver:'IntersectionObserver' in global
  };

  for(const[name,ok]of Object.entries(capabilities))root.classList.toggle(`ct-no-${name.replace(/[A-Z]/g,m=>`-${m.toLowerCase()}`)}`,!ok);
  root.dataset.browserCompat='ready';

  // The application remains usable if optional platform features are unavailable.
  // Encrypted sync is the one feature that must not silently downgrade without Web Crypto.
  if(!capabilities.webCrypto)root.dataset.secureSync='unsupported';

  global.CertTrackerBrowserCompat=Object.freeze({capabilities:Object.freeze({...capabilities}),supports});
})(window);
