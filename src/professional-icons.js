// Cert Tracker — professional iconography adapter.
// Replaces legacy emoji/custom-medal presentation without changing the underlying tracker data.
(function initProfessionalIcons(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT)return;

  const ICONS={
    credential:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3.5h8a2 2 0 0 1 2 2v13H6v-13a2 2 0 0 1 2-2Z"/><path d="M9 8h6M9 11.5h4"/><path d="m10 16 1.4 1.4L14.8 14"/></svg>',
    alert:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 3.8 19h16.4L12 4Z"/><path d="M12 9v4.5M12 16.8h.01"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M8 3.5v4M16 3.5v4M4 9h16"/></svg>',
    backup:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h12l2 2v14H5V4Z"/><path d="M8 4v6h8V4M9 16h6"/></svg>',
    info:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 10.5v5M12 7.8h.01"/></svg>'
  };

  const emojiRe=/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;
  const legacySymbols=/[⌘★☆◆◇●○■□▲△▼▽▶▷◀◁]/g;

  function iconSpan(name){const span=document.createElement('span');span.className='ct-line-icon';span.innerHTML=ICONS[name]||ICONS.info;return span;}
  function credentialMark(){const span=document.createElement('span');span.className='ct-credential-mark';span.setAttribute('aria-hidden','true');span.innerHTML=ICONS.credential;return span;}

  function cleanTextNode(node){
    if(!node||node.nodeType!==Node.TEXT_NODE)return;
    const before=node.nodeValue||'';
    let after=before.replace(/Ctrl\/⌘\s*\+\s*K/gi,'Ctrl + K / Command + K').replace(/⌘\s*K/gi,'').replace(emojiRe,'').replace(legacySymbols,'');
    after=after.replace(/\s{2,}/g,' ').replace(/^\s*·\s*/,'').trimStart();
    if(after!==before)node.nodeValue=after;
  }

  function cleanElementText(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
      const p=n.parentElement;if(!p||['SCRIPT','STYLE','CODE','PRE','TEXTAREA'].includes(p.tagName))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(cleanTextNode);
  }

  function replaceMedallions(root=document){
    root.querySelectorAll('.cert-badge-medallion:not([data-ct-replaced])').forEach(old=>{
      old.dataset.ctReplaced='1';
      old.insertAdjacentElement('afterend',credentialMark());
    });
  }

  function labelLauncher(root=document){
    const btn=root.querySelector('#ct3-launcher');
    if(btn&&btn.textContent!=='Today'){
      btn.textContent='Today';
      btn.setAttribute('aria-label','Open Today dashboard');
    }
  }

  function bannerIcons(root=document){
    root.querySelectorAll('.banner').forEach(banner=>{
      const first=banner.firstElementChild;
      if(first?.classList?.contains('ct-line-icon'))return;
      if(first&&first.tagName==='SPAN')first.remove();
      let icon='info';
      if(banner.classList.contains('warn'))icon=banner.classList.contains('backup-banner')?'backup':'alert';
      else if(banner.classList.contains('critical'))icon='alert';
      else if(/data|verified|calendar|date/i.test(banner.textContent||''))icon='calendar';
      banner.insertBefore(iconSpan(icon),banner.firstChild);
    });
  }

  function stripDecorativeSymbols(root=document){
    if(root===document){
      ['.header','.tabs','.content','.ct-command-dock'].forEach(selector=>document.querySelectorAll(selector).forEach(cleanElementText));
      return;
    }
    if(root.matches?.('.header,.tabs,.content,.ct-command-dock'))cleanElementText(root);
    else root.querySelectorAll?.('.header,.tabs,.content,.ct-command-dock').forEach(cleanElementText);
  }

  function apply(root=document){labelLauncher(root);replaceMedallions(root);bannerIcons(root);stripDecorativeSymbols(root);}
  function init(){apply();let queued=false;new MutationObserver(mutations=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;for(const m of mutations){for(const n of m.addedNodes){if(n.nodeType===1)apply(n);}}labelLauncher();replaceMedallions();bannerIcons();stripDecorativeSymbols();});}).observe(document.body,{childList:true,subtree:true});}

  CT.professionalIcons=Object.freeze({apply,icons:ICONS});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
