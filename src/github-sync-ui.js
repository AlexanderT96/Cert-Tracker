// Cert Tracker — UI for encrypted GitHub private-repository device sync.
(function initGitHubSyncUI(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.githubSync||!CT?.ux)return;
  const esc=CT.util.escapeHtml;

  function injectStyle(){
    if(document.getElementById('ct-github-sync-style'))return;
    const s=document.createElement('style');s.id='ct-github-sync-style';
    s.textContent=`#ct-github-sync-launcher{position:fixed;left:18px;bottom:18px;z-index:9997;border:1px solid rgba(255,255,255,.18);background:rgba(23,17,48,.94);color:#fff;border-radius:999px;padding:10px 14px;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.32);cursor:pointer;backdrop-filter:blur(14px)}#ct-github-sync-launcher.connected::before{content:'●';margin-right:6px}.ct-gh-sync-help{font-size:11px;line-height:1.5;color:#aaa4c8}.ct-gh-sync-help strong{color:#e4def9}@media(max-width:640px){#ct-github-sync-launcher{left:12px;bottom:12px}}`;
    document.head.appendChild(s);
  }
  function setLauncherState(){const b=document.getElementById('ct-github-sync-launcher');if(!b)return;b.classList.toggle('connected',CT.githubSync.isConnected());b.textContent='Sync';}
  function show(){
    const cfg=CT.githubSync.getConfig(),connected=CT.githubSync.isConnected();
    const body=`
      <div class="ct3-notice"><strong>Private GitHub sync</strong><br>Your tracker state is encrypted in this browser with AES-GCM before upload. The GitHub token and vault passphrase stay in memory for this browser session only and are never committed to a repository.</div>
      <div class="ct3-notice"><strong>Isolation guardrail</strong><br>Use a dedicated private repository that contains only encrypted tracker-sync data. Do <strong>not</strong> point this at a private repository that contains plaintext career context, notes, documents or other personal files.</div>
      <div class="ct3-field"><label>Dedicated private sync repository (owner/repository)</label><input id="ct-gh-repo" value="${esc(cfg.repo)}" placeholder="your-account/cert-tracker-state" autocomplete="off"></div>
      <div class="ct3-grid">
        <div class="ct3-field"><label>Vault path</label><input id="ct-gh-path" value="${esc(cfg.path)}" placeholder="sync/cert-tracker.ctvault" autocomplete="off"></div>
        <div class="ct3-field"><label>Branch</label><input id="ct-gh-branch" value="${esc(cfg.branch)}" placeholder="main" autocomplete="off"></div>
      </div>
      <div class="ct3-field"><label>Fine-grained GitHub token (session only)</label><input id="ct-gh-token" type="password" autocomplete="off" placeholder="Token scoped only to the dedicated sync repository"></div>
      <div class="ct3-field"><label>Vault passphrase (10+ characters, session only)</label><input id="ct-gh-passphrase" type="password" autocomplete="new-password"></div>
      <div class="ct3-field"><label><input id="ct-gh-isolated" type="checkbox"> I confirm this repository is dedicated to encrypted tracker state and contains no plaintext private career context.</label></div>
      <div class="ct3-field"><label><input id="ct-gh-auto" type="checkbox" ${cfg.autoSync?'checked':''}> Auto-sync after local changes while this browser session stays connected</label></div>
      <div class="ct-gh-sync-help">For least privilege, use a <strong>fine-grained personal access token</strong> restricted to only the dedicated sync repository with <strong>Contents: Read and write</strong>. Do not grant Actions, Administration, Issues, Pull Requests, or access to other repositories just for tracker sync.</div>
      <div class="ct3-actions"><button class="ct3-btn primary" id="ct-gh-connect">${connected?'Reconnect session':'Connect session'}</button><button class="ct3-btn" id="ct-gh-test">Test access</button><button class="ct3-btn" id="ct-gh-smart">Smart sync</button></div>
      <div class="ct3-actions"><button class="ct3-btn" id="ct-gh-push">Push local state</button><button class="ct3-btn" id="ct-gh-pull">Pull remote state</button><button class="ct3-btn danger" id="ct-gh-disconnect">Forget session secrets</button></div>
      <div id="ct-gh-status" class="ct3-muted" style="margin-top:12px">${connected?'Session connected.':'Not connected.'}</div>
      <div class="ct3-notice" style="margin-top:12px">On a new phone or computer, use <strong>Smart sync first</strong>. First-time binding is remote-first so a fresh browser cannot accidentally overwrite an existing vault.</div>`;

    CT.ux.modal({title:'Private device sync',subtitle:'Encrypted state sync through a dedicated private GitHub repository',body,onMount(root){
      const status=root.querySelector('#ct-gh-status');
      const setStatus=text=>status.textContent=text;
      const saveCfg=()=>CT.githubSync.setConfig({repo:root.querySelector('#ct-gh-repo').value,path:root.querySelector('#ct-gh-path').value,branch:root.querySelector('#ct-gh-branch').value,autoSync:root.querySelector('#ct-gh-auto').checked});
      const requireIsolation=()=>{if(!root.querySelector('#ct-gh-isolated').checked)throw new Error('Confirm that the selected repository is dedicated to encrypted tracker state before connecting.');};
      const connect=()=>{requireIsolation();saveCfg();CT.githubSync.connect({token:root.querySelector('#ct-gh-token').value,passphrase:root.querySelector('#ct-gh-passphrase').value});setLauncherState();setStatus('Session connected. Token and passphrase remain in memory only.');};
      const ensure=()=>{requireIsolation();if(!CT.githubSync.isConnected())connect();else saveCfg();};
      root.querySelector('#ct-gh-connect').addEventListener('click',()=>{try{connect();}catch(e){setStatus(e.message);}});
      root.querySelector('#ct-gh-test').addEventListener('click',async()=>{try{ensure();setStatus('Checking dedicated private repository access…');const r=await CT.githubSync.testConnection();setStatus(`Access confirmed: ${r.repo} · ${r.branch} · ${r.path}`);}catch(e){setStatus(e.message);}});
      root.querySelector('#ct-gh-smart').addEventListener('click',async()=>{try{ensure();setStatus('Smart syncing encrypted state…');const r=await CT.githubSync.smartSync();setStatus(r.direction==='noop'?'Already in sync.':`Smart sync complete: ${r.direction}.`);}catch(e){setStatus(e.message);}});
      root.querySelector('#ct-gh-push').addEventListener('click',async()=>{try{ensure();setStatus('Uploading encrypted tracker state…');const r=await CT.githubSync.push();setStatus(r.direction==='noop'?'Remote vault already matches this device.':'Push complete.');}catch(e){setStatus(e.message);}});
      root.querySelector('#ct-gh-pull').addEventListener('click',async()=>{try{ensure();setStatus('Downloading and decrypting tracker state…');await CT.githubSync.pull();setStatus('Pull complete.');}catch(e){setStatus(e.message);}});
      root.querySelector('#ct-gh-disconnect').addEventListener('click',()=>{CT.githubSync.disconnect();root.querySelector('#ct-gh-token').value='';root.querySelector('#ct-gh-passphrase').value='';root.querySelector('#ct-gh-isolated').checked=false;setLauncherState();setStatus('Session secrets forgotten. Repository/path settings remain local to this browser.');});
    }});
  }
  function init(){injectStyle();if(document.getElementById('ct-github-sync-launcher'))return;const b=document.createElement('button');b.id='ct-github-sync-launcher';b.type='button';b.textContent='Sync';b.setAttribute('aria-label','Open private cross-device sync');b.addEventListener('click',show);document.body.appendChild(b);setLauncherState();CT.events.on('github-sync-session',setLauncherState);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  CT.githubSyncUI=Object.freeze({show});
})(window);
