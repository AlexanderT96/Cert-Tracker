// Cert Tracker — professional iconography adapter.
// Replaces legacy emoji/custom-medal presentation without changing the underlying tracker data.
(function initProfessionalIcons(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT)return;

  const ICONS={
    credential:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 4.5h9a2 2 0 0 1 2 2v11h-13v-11a2 2 0 0 1 2-2Z"/><path d="M9 8h6M9 11.5h4.5"/><path d="m9.5 16 1.7 1.7 3.8-4.2"/></svg>',
    alert:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 3.8 19h16.4L12 4Z"/><path d="M12 9v4.5M12 16.8h.01"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M8 3.5v4M16 3.5v4M4 9h16"/></svg>',
    backup:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h12l2 2v14H5V4Z"/><path d="M8 4v6h8V4M9 16h6"/></svg>',
    info:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 10.5v5M12 7.8h.01"/></svg>'
  };

  const emojiRe=/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;
  const legacySymbols=/[⌘★☆◆◇●○■□▲△▼▽▶▷◀◁↩⊘⠿]/g;
  const TIERS=['bronze','silver','gold','platinum','diamond'];
  const RANK_TO_TIER=Object.freeze({S:'diamond',A:'platinum',B:'gold',C:'silver',D:'bronze'});

  function iconSpan(name){const span=document.createElement('span');span.className='ct-line-icon';span.innerHTML=ICONS[name]||ICONS.info;return span;}
  function tierFromMedallion(old){for(const tier of TIERS)if(old.classList.contains(`cbm-tier-${tier}`))return tier;return 'bronze';}
  function credentialMark(tier='bronze'){
    const span=document.createElement('span');
    span.className=`ct-credential-mark ct-credential-tier-${TIERS.includes(tier)?tier:'bronze'}`;
    span.dataset.tier=TIERS.includes(tier)?tier:'bronze';
    span.setAttribute('aria-label',`${span.dataset.tier} progression tier`);
    span.setAttribute('title',`${span.dataset.tier[0].toUpperCase()+span.dataset.tier.slice(1)} progression tier`);
    span.innerHTML=ICONS.credential;
    return span;
  }

  // Preserve intentional whitespace around inline elements while removing decorative glyphs.
  // The old trimStart() behaviour caused strings such as "Next up:CompTIA".
  function cleanTextNode(node){
    if(!node||node.nodeType!==Node.TEXT_NODE)return;
    const before=node.nodeValue||'';
    const leading=/^\s+/.test(before),trailing=/\s+$/.test(before);
    let core=before.replace(/Ctrl\/⌘\s*\+\s*K/gi,'Ctrl + K / Command + K').replace(/⌘\s*K/gi,'').replace(emojiRe,'').replace(legacySymbols,'');
    core=core.replace(/^\s*·\s*/,'').replace(/\s+/g,' ').trim();
    let after=core;
    if(core)after=`${leading?' ':''}${core}${trailing?' ':''}`;
    else if(/\s/.test(before))after=' ';
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
      old.insertAdjacentElement('afterend',credentialMark(tierFromMedallion(old)));
    });
  }

  function matching(root,selector){
    const nodes=[];
    if(root.matches?.(selector))nodes.push(root);
    root.querySelectorAll?.(selector).forEach(node=>nodes.push(node));
    return nodes;
  }

  function tierFromCertRow(row){
    for(const [rank,tier] of Object.entries(RANK_TO_TIER))if(row.querySelector(`.signature-tier-${rank}`))return tier;
    return 'bronze';
  }

  // Every certification keeps its ROI tier visible, including unearned rows. This
  // is presentational only: completion, expansion, drag and learning links remain
  // bound to the original controls and data model.
  function decorateCertRows(root=document){
    matching(root,'.cert-row').forEach(row=>{
      const summary=row.querySelector('.cert-summary');
      if(!summary||summary.querySelector('.ct-credential-mark'))return;
      const mark=credentialMark(tierFromCertRow(row));
      const status=summary.querySelector('.cert-status-dot,.drag-handle');
      if(status)status.insertAdjacentElement('afterend',mark);else summary.prepend(mark);
    });
  }

  function decorateMedalShelf(root=document){
    matching(root,'.trophy-row').forEach(row=>{
      const old=row.querySelector('.trophy-ico');
      if(!old||old.classList.contains('ct-credential-mark'))return;
      const label=(row.querySelector('.trophy-name')?.textContent||'bronze').trim().toLowerCase();
      const mark=credentialMark(TIERS.includes(label)?label:'bronze');
      mark.classList.add('trophy-ico');
      old.replaceWith(mark);
    });
  }

  function labelLauncher(root=document){
    const btn=root.querySelector('#ct3-launcher');
    if(btn&&btn.textContent!=="Today's Recommendations"){
      btn.textContent="Today's Recommendations";
      btn.setAttribute('aria-label',"Open Today's Recommendations");
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

  function apply(root=document){labelLauncher(root);replaceMedallions(root);decorateCertRows(root);decorateMedalShelf(root);bannerIcons(root);stripDecorativeSymbols(root);}
  function init(){
    apply();let queued=false,pending=[];
    new MutationObserver(mutations=>{
      for(const m of mutations)for(const n of m.addedNodes)if(n.nodeType===1)pending.push(n);
      if(queued)return;queued=true;
      requestAnimationFrame(()=>{
        queued=false;
        const roots=pending.filter(node=>node.isConnected).filter((node,index,list)=>!list.some((other,i)=>i!==index&&other.contains?.(node)));
        pending=[];
        roots.forEach(apply);
      });
    }).observe(document.body,{childList:true,subtree:true});
  }

  CT.professionalIcons=Object.freeze({apply,icons:ICONS,tiers:Object.freeze([...TIERS]),rankToTier:RANK_TO_TIER});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
