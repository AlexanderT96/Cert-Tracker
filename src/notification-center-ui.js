// Cert Tracker — consolidated in-app notification centre.
// Keeps deadline/market banners at the top of the active workspace and replaces
// per-banner close buttons with one durable "Clear all" action.
(function initNotificationCenter(global){
  'use strict';

  const STORAGE_KEY='ct-ui-dismissed-notifications-v1';
  let decorating=false;
  let scheduled=false;

  function readDismissed(){
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      return Array.isArray(value)?value.filter(item=>typeof item==='string'):[];
    }catch{return[];}
  }

  function writeDismissed(values){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(values.slice(-120)));}catch{}
  }

  function fingerprint(banner){
    const clone=banner.cloneNode(true);
    clone.querySelectorAll('button').forEach(button=>button.remove());
    return (clone.textContent||'').replace(/\s+/g,' ').trim().slice(0,500);
  }

  function directBannerChildren(content){
    return Array.from(content.children).filter(node=>node.classList?.contains('banner'));
  }

  function makeCenter(){
    const center=document.createElement('section');
    center.className='ct-notification-center';
    center.setAttribute('aria-label','Notifications');
    center.innerHTML=`
      <div class="ct-notification-head">
        <div class="ct-notification-title-wrap">
          <span class="ct-notification-title">Notifications</span>
          <span class="ct-notification-count" aria-live="polite"></span>
        </div>
        <button type="button" class="ct-notification-clear">Clear all</button>
      </div>
      <div class="ct-notification-stack"></div>`;
    center.querySelector('.ct-notification-clear')?.addEventListener('click',clearAll);
    return center;
  }

  function decorate(){
    if(decorating)return;
    decorating=true;
    try{
      const content=document.getElementById('tab-content');
      if(!content)return;

      let center=Array.from(content.children).find(node=>node.classList?.contains('ct-notification-center'))||null;
      const stack=center?.querySelector('.ct-notification-stack')||null;
      const banners=[
        ...directBannerChildren(content),
        ...(stack?Array.from(stack.children).filter(node=>node.classList?.contains('banner')):[])
      ];

      if(!banners.length){
        center?.remove();
        return;
      }

      const dismissed=new Set(readDismissed());
      const visible=[];
      banners.forEach(banner=>{
        const key=fingerprint(banner);
        if(key&&dismissed.has(key)){
          banner.remove();
          return;
        }
        // The centre owns dismissal now; individual close buttons caused mobile clipping.
        banner.querySelectorAll('.banner-x').forEach(button=>button.remove());
        banner.dataset.ctNotificationKey=key;
        visible.push(banner);
      });

      if(!visible.length){
        center?.remove();
        return;
      }

      if(!center){
        center=makeCenter();
      }
      if(content.firstElementChild!==center)content.prepend(center);

      const target=center.querySelector('.ct-notification-stack');
      visible.forEach(banner=>{
        if(banner.parentElement!==target)target.appendChild(banner);
      });
      const count=center.querySelector('.ct-notification-count');
      if(count)count.textContent=String(visible.length);
    }finally{
      decorating=false;
    }
  }

  function clearAll(){
    const center=document.querySelector('#tab-content > .ct-notification-center');
    if(!center)return;
    const dismissed=new Set(readDismissed());
    center.querySelectorAll('.ct-notification-stack > .banner').forEach(banner=>{
      const key=banner.dataset.ctNotificationKey||fingerprint(banner);
      if(key)dismissed.add(key);
    });
    writeDismissed(Array.from(dismissed));
    center.remove();
  }

  function scheduleDecorate(){
    if(scheduled)return;
    scheduled=true;
    queueMicrotask(()=>{scheduled=false;decorate();});
  }

  // Workspace-shell is already installed when this module loads. Wrapping here means
  // every full render is corrected synchronously after all dashboard decorators run.
  const originalRenderApp=global.renderApp;
  if(typeof originalRenderApp==='function'){
    global.renderApp=function notificationAwareRenderApp(...args){
      const result=originalRenderApp.apply(this,args);
      decorate();
      return result;
    };
  }

  // Some legacy paths update only #tab-content. Observe those so the centre stays
  // consistent without depending on every caller to remember a notification hook.
  const observer=new MutationObserver(scheduleDecorate);
  function start(){
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
    decorate();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();

  global.clearTrackerNotifications=clearAll;
  global.CertTrackerNotificationCenter=Object.freeze({decorate,clearAll});
})(window);
