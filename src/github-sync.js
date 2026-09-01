// Cert Tracker — encrypted cross-device sync using a user-selected private GitHub repository.
// Privacy boundary: repo coordinates may be stored locally, but tokens and vault
// passphrases are session-only and never committed or written to localStorage.
(function initGitHubSync(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.storage||!CT?.sync)throw new Error('storage.js and sync.js must load before github-sync.js');

  const encoder=new TextEncoder(),decoder=new TextDecoder();
  const CONFIG_KEY='ct4-github-sync-config';
  const REVISION_KEY='ct4-github-sync-revision';
  const COMMON_HASH_KEY='ct4-github-sync-common-hash';
  const REMOTE_SHA_KEY='ct4-github-sync-remote-sha';
  const DEFAULT_PATH='sync/cert-tracker.ctvault';
  const DEFAULT_BRANCH='main';
  let session=null,autoTimer=null;

  function bytesToBase64(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary);}
  function base64ToText(value){const clean=String(value||'').replace(/\s+/g,'');const binary=atob(clean),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return decoder.decode(bytes);}
  function normalisePath(value){const path=String(value||DEFAULT_PATH).trim().replace(/^\/+/, '').replace(/\/{2,}/g,'/');if(!path||path.split('/').some(part=>part==='.'||part==='..'))throw new Error('Use a normal repository file path without . or .. segments.');if(path.toLowerCase().startsWith('.github/workflows/'))throw new Error('Sync vaults cannot be stored under .github/workflows.');return path;}
  function validateRepo(value){const repo=String(value||'').trim();if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))throw new Error('Repository must be in owner/repository format.');return repo;}
  function validateBranch(value){const branch=String(value||DEFAULT_BRANCH).trim();if(!branch||/[\s~^:?*\[\\]/.test(branch)||branch.includes('..')||branch.endsWith('.')||branch.endsWith('/'))throw new Error('Invalid Git branch name.');return branch;}

  function getConfig(){
    try{
      const value=JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}');
      return {repo:value.repo||'',path:value.path||DEFAULT_PATH,branch:value.branch||DEFAULT_BRANCH,autoSync:!!value.autoSync};
    }catch{return {repo:'',path:DEFAULT_PATH,branch:DEFAULT_BRANCH,autoSync:false};}
  }
  function setConfig(config){
    const clean={repo:validateRepo(config?.repo),path:normalisePath(config?.path),branch:validateBranch(config?.branch),autoSync:!!config?.autoSync};
    localStorage.setItem(CONFIG_KEY,JSON.stringify(clean));
    CT.events.emit('github-sync-config-changed',clean);
    return clean;
  }
  function connect({token,passphrase}){
    if(String(token||'').trim().length<20)throw new Error('A GitHub access token is required for this browser session.');
    if(String(passphrase||'').length<10)throw new Error('Vault passphrase must be at least 10 characters.');
    session={token:String(token).trim(),passphrase:String(passphrase)};
    CT.events.emit('github-sync-session',{connected:true});
  }
  function disconnect(){session=null;clearTimeout(autoTimer);CT.events.emit('github-sync-session',{connected:false});}
  function isConnected(){return !!session;}
  function requireSession(){if(!session)throw new Error('Connect this browser session before syncing.');return session;}

  function apiUrl(config=getConfig(),includePath=true){
    const [owner,repo]=validateRepo(config.repo).split('/');
    const base=`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    if(!includePath)return base;
    const path=normalisePath(config.path).split('/').map(encodeURIComponent).join('/');
    return `${base}/contents/${path}`;
  }
  async function apiRequest(url,options={}){
    const s=requireSession();
    const headers={Accept:'application/vnd.github+json',Authorization:`Bearer ${s.token}`,...(options.headers||{})};
    return fetch(url,{...options,headers,cache:'no-store'});
  }

  async function testConnection(){
    const config=getConfig();
    const response=await apiRequest(apiUrl(config,false),{method:'GET'});
    if(response.status===401)throw new Error('GitHub rejected the token. Check that it is valid.');
    if(response.status===403)throw new Error('GitHub denied access. Scope the token to the target repository with Contents read/write permission.');
    if(response.status===404)throw new Error('Private repository not found or this token cannot access it.');
    if(!response.ok)throw new Error(`GitHub connection failed (${response.status}).`);
    return {ok:true,repo:config.repo,branch:config.branch,path:config.path};
  }

  async function makePayload(){
    const payload=CT.storage.serializableState();
    const revision=Math.max(0,Number(localStorage.getItem(REVISION_KEY)||0))+1;
    const syncMeta={deviceId:CT.sync.deviceId(),revision,contentHash:await CT.sync.digest(payload),provider:'github-private-repo'};
    return {...payload,syncMeta};
  }
  async function readRemote(){
    const config=getConfig();
    const response=await apiRequest(`${apiUrl(config,true)}?ref=${encodeURIComponent(config.branch)}`,{method:'GET'});
    if(response.status===404)return null;
    if(response.status===401)throw new Error('GitHub rejected the token.');
    if(response.status===403)throw new Error('GitHub denied repository contents access.');
    if(!response.ok)throw new Error(`GitHub vault download failed (${response.status}).`);
    const data=await response.json();
    if(!data?.content||!data?.sha)throw new Error('GitHub returned an invalid vault file response.');
    const envelope=JSON.parse(base64ToText(data.content));
    const payload=await CT.sync.decryptPayload(envelope,session?.passphrase);
    return {payload,sha:data.sha};
  }
  async function writeRemote(envelope,remoteSha=null){
    const config=getConfig();
    const body={message:'Update encrypted Cert Tracker device state',content:bytesToBase64(encoder.encode(JSON.stringify(envelope))),branch:config.branch};
    if(remoteSha)body.sha=remoteSha;
    const response=await apiRequest(apiUrl(config,true),{method:'PUT',headers:{'Content-Type':'application/json;charset=utf-8'},body:JSON.stringify(body)});
    if(response.status===409||response.status===422){const error=new Error('Sync conflict: the GitHub vault changed during upload. Smart sync again before retrying.');error.code='SYNC_CONFLICT';throw error;}
    if(response.status===401)throw new Error('GitHub rejected the token.');
    if(response.status===403)throw new Error('GitHub denied write access. The token needs Contents read/write permission for this repository.');
    if(!response.ok)throw new Error(`GitHub vault upload failed (${response.status}).`);
    const data=await response.json();
    return data?.content?.sha||remoteSha||null;
  }
  function markCommon(payload,sha){
    localStorage.setItem(REVISION_KEY,String(payload?.syncMeta?.revision||0));
    if(payload?.syncMeta?.contentHash)localStorage.setItem(COMMON_HASH_KEY,payload.syncMeta.contentHash);
    if(sha)localStorage.setItem(REMOTE_SHA_KEY,sha);else localStorage.removeItem(REMOTE_SHA_KEY);
  }
  async function applyRemote(remote,direction='pull'){
    CT.storage.captureUndoPoint('GitHub sync pull');
    CT.storage.applyBackup(remote.payload,{source:'github-sync'});
    markCommon(remote.payload,remote.sha);
    CT.events.emit('github-sync-complete',{direction,changedAt:remote.payload.changedAt});
    return {direction,changedAt:remote.payload.changedAt,revision:remote.payload.syncMeta?.revision||0};
  }

  async function push(options={}){
    const remote=await readRemote();
    const localSnapshot=CT.storage.serializableState();
    const localHash=await CT.sync.digest(localSnapshot);
    const common=localStorage.getItem(COMMON_HASH_KEY);
    if(remote&&!common&&!options.force){
      const remoteHash=remote.payload?.syncMeta?.contentHash||await CT.sync.digest(remote.payload);
      if(remoteHash!==localHash){const error=new Error('This device has not been bound to the existing vault yet. Use Smart sync or Pull first to avoid overwriting another device.');error.code='SYNC_UNBOUND';throw error;}
      markCommon(remote.payload,remote.sha);
      return {direction:'noop',changedAt:remote.payload.changedAt,revision:remote.payload.syncMeta?.revision||0};
    }
    if(remote&&!options.force){
      const remoteHash=remote.payload?.syncMeta?.contentHash||await CT.sync.digest(remote.payload);
      if(common&&remoteHash!==common&&localHash!==common&&localHash!==remoteHash){const error=new Error('Sync conflict: remote and local data both changed. Pull or resolve the conflict before pushing.');error.code='SYNC_CONFLICT';throw error;}
    }
    if(common&&localHash===common&&remote){return {direction:'noop',changedAt:localSnapshot.changedAt,revision:Number(localStorage.getItem(REVISION_KEY)||0)};}
    const payload=await makePayload();
    const envelope=await CT.sync.encryptPayload(payload,session?.passphrase);
    const sha=await writeRemote(envelope,remote?.sha||null);
    markCommon(payload,sha);
    CT.events.emit('github-sync-complete',{direction:'push',changedAt:payload.changedAt});
    return {direction:'push',changedAt:payload.changedAt,revision:payload.syncMeta.revision};
  }
  async function pull(){
    const remote=await readRemote();
    if(!remote)throw new Error('No GitHub sync vault exists yet. Push from the device that has the canonical tracker state first.');
    return applyRemote(remote,'pull');
  }
  async function smartSync(){
    const remote=await readRemote();
    if(!remote)return push();
    const localSnapshot=CT.storage.serializableState();
    const localHash=await CT.sync.digest(localSnapshot);
    const remoteHash=remote.payload?.syncMeta?.contentHash||await CT.sync.digest(remote.payload);
    const common=localStorage.getItem(COMMON_HASH_KEY);

    // First connection on a new device is remote-first. This prevents a fresh browser
    // from accidentally overwriting an established vault just because its timestamp is newer.
    if(!common){
      if(localHash===remoteHash){markCommon(remote.payload,remote.sha);return {direction:'noop',changedAt:remote.payload.changedAt,revision:remote.payload.syncMeta?.revision||0};}
      return applyRemote(remote,'pull');
    }

    const localDiverged=localHash!==common,remoteDiverged=remoteHash!==common;
    if(localDiverged&&remoteDiverged&&localHash!==remoteHash){const error=new Error('Sync conflict: both devices changed since the last common revision. Pulling would overwrite local changes and pushing would overwrite remote changes.');error.code='SYNC_CONFLICT';CT.events.emit('github-sync-conflict',{localHash,remoteHash,common});throw error;}
    if(remoteDiverged&&!localDiverged)return applyRemote(remote,'pull');
    if(localDiverged&&!remoteDiverged)return push();
    if(localHash===remoteHash){markCommon(remote.payload,remote.sha);return {direction:'noop',changedAt:remote.payload.changedAt,revision:remote.payload.syncMeta?.revision||0};}
    return {direction:'noop',changedAt:localSnapshot.changedAt,revision:Number(localStorage.getItem(REVISION_KEY)||0)};
  }

  function scheduleAutoSync(){
    const config=getConfig();
    if(!config.autoSync||!session||!config.repo)return;
    clearTimeout(autoTimer);
    autoTimer=setTimeout(()=>smartSync().catch(error=>{console.warn('[CertTracker] GitHub automatic sync skipped',error);CT.events.emit('github-sync-error',{error});}),30000);
  }
  CT.events.on('state-saved',scheduleAutoSync);

  CT.githubSync=Object.freeze({CONFIG_KEY,DEFAULT_PATH,DEFAULT_BRANCH,getConfig,setConfig,connect,disconnect,isConnected,testConnection,readRemote,push,pull,smartSync,scheduleAutoSync});
})(window);
