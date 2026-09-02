// Cert Tracker — browser-side security hardening for the static hosted application.
(function initSecurityHardening(global){
  'use strict';
  const SAFE_PROTOCOLS=new Set(['http:','https:','mailto:']);
  const root=document.documentElement;

  function safeUrl(raw){
    try{
      const url=new URL(String(raw||''),global.location.href);
      if(!SAFE_PROTOCOLS.has(url.protocol))return null;
      return url;
    }catch{return null;}
  }

  function hardenAnchor(anchor){
    if(!(anchor instanceof HTMLAnchorElement))return;
    const raw=anchor.getAttribute('href');
    if(raw){
      const url=safeUrl(raw);
      if(!url){anchor.removeAttribute('href');anchor.setAttribute('aria-disabled','true');return;}
      if(url.origin!==global.location.origin){anchor.referrerPolicy='no-referrer';}
    }
    if(anchor.target==='_blank'){
      const rel=new Set(String(anchor.rel||'').split(/\s+/).filter(Boolean));
      rel.add('noopener');rel.add('noreferrer');anchor.rel=[...rel].join(' ');
    }
  }

  function hardenSensitiveInput(input){
    if(!(input instanceof HTMLInputElement))return;
    const hint=`${input.id||''} ${input.name||''} ${input.placeholder||''}`.toLowerCase();
    const sensitive=input.type==='password'||/(token|passphrase|secret|password|credential)/.test(hint);
    if(!sensitive)return;
    input.spellcheck=false;
    input.autocapitalize='off';
    input.setAttribute('autocorrect','off');
    if(!input.autocomplete||input.autocomplete==='on')input.autocomplete=input.type==='password'?'new-password':'off';
  }

  function harden(rootNode=document){
    if(rootNode instanceof HTMLAnchorElement)hardenAnchor(rootNode);
    if(rootNode instanceof HTMLInputElement)hardenSensitiveInput(rootNode);
    rootNode.querySelectorAll?.('a[href],a[target="_blank"]').forEach(hardenAnchor);
    rootNode.querySelectorAll?.('input').forEach(hardenSensitiveInput);
  }

  function preventUnsafeNavigation(event){
    const anchor=event.target?.closest?.('a[href]');
    if(!anchor)return;
    if(!safeUrl(anchor.getAttribute('href'))){event.preventDefault();event.stopPropagation();}
  }

  // Avoid exposing a reference to a parent/opener when the app is opened from another page.
  try{if(global.opener)global.opener=null;}catch{}
  root.dataset.securityHardening='active';
  document.addEventListener('click',preventUnsafeNavigation,true);

  const start=()=>{
    harden(document);
    if(!document.body)return;
    new MutationObserver(mutations=>{
      for(const mutation of mutations)for(const node of mutation.addedNodes)if(node.nodeType===1)harden(node);
    }).observe(document.body,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

  global.CertTrackerSecurity=Object.freeze({safeUrl,harden});
})(window);
