// Cert Tracker v3 — optional encrypted multi-device sync.
// Data is encrypted client-side with AES-GCM before it leaves the browser.
(function initSync(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before sync.js');

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const ITERATIONS = 250000;
  const LAST_COMMON_KEY = 'ct3-sync-last-common-change';
  let session = null; // Secrets deliberately live in memory only.
  let autoTimer = null;

  function bytesToBase64(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function base64ToBytes(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function deriveKey(passphrase, salt, iterations = ITERATIONS) {
    if (!global.crypto?.subtle) throw new Error('Encrypted sync requires Web Crypto (HTTPS/secure context).');
    if (String(passphrase || '').length < 10) throw new Error('Use a sync passphrase of at least 10 characters.');
    const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptPayload(payload, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const plaintext = encoder.encode(JSON.stringify(payload));
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
    return {
      format: 'certtracker-vault',
      version: CT.version.sync,
      algorithm: 'AES-GCM-256',
      kdf: 'PBKDF2-SHA256',
      iterations: ITERATIONS,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(ciphertext)
    };
  }

  async function decryptPayload(envelope, passphrase) {
    if (!envelope || envelope.format !== 'certtracker-vault') throw new Error('Not a Cert Tracker encrypted vault.');
    const salt = base64ToBytes(envelope.salt);
    const iv = base64ToBytes(envelope.iv);
    const ciphertext = base64ToBytes(envelope.ciphertext);
    const key = await deriveKey(passphrase, salt, Number(envelope.iterations || ITERATIONS));
    let plaintext;
    try {
      plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    } catch {
      throw new Error('Unable to decrypt vault. Check the passphrase or file integrity.');
    }
    const payload = JSON.parse(decoder.decode(plaintext));
    const validation = CT.storage.validateBackup(payload);
    if (!validation.ok) throw new Error(`Decrypted vault is invalid: ${validation.errors.join(' ')}`);
    return payload;
  }

  function getConfig() {
    try {
      const value = JSON.parse(localStorage.getItem(CT.config.syncConfigKey) || '{}');
      return {
        endpoint: value.endpoint || '',
        username: value.username || '',
        autoSync: !!value.autoSync
      };
    } catch {
      return { endpoint: '', username: '', autoSync: false };
    }
  }

  function setConfig(config) {
    const endpoint = String(config?.endpoint || '').trim();
    if (endpoint && !/^https:\/\//i.test(endpoint) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(endpoint)) {
      throw new Error('Sync endpoint must use HTTPS (localhost HTTP is allowed for testing).');
    }
    const clean = {
      endpoint,
      username: String(config?.username || '').trim(),
      autoSync: !!config?.autoSync
    };
    localStorage.setItem(CT.config.syncConfigKey, JSON.stringify(clean));
    CT.events.emit('sync-config-changed', clean);
    return clean;
  }

  function connect({ password, passphrase }) {
    if (!password) throw new Error('WebDAV password is required for this session.');
    if (String(passphrase || '').length < 10) throw new Error('Sync passphrase must be at least 10 characters.');
    session = { password: String(password), passphrase: String(passphrase) };
    CT.events.emit('sync-session', { connected: true });
  }

  function disconnect() {
    session = null;
    CT.events.emit('sync-session', { connected: false });
  }

  function isConnected() { return !!session; }

  function basicAuth(username, password) {
    const bytes = encoder.encode(`${username}:${password}`);
    return `Basic ${bytesToBase64(bytes)}`;
  }

  async function webdavRequest(method, body) {
    const config = getConfig();
    if (!config.endpoint) throw new Error('Configure a WebDAV vault URL first.');
    if (!session) throw new Error('Connect this browser session before syncing.');
    const headers = {
      Authorization: basicAuth(config.username, session.password),
      Accept: 'application/json'
    };
    if (body != null) headers['Content-Type'] = 'application/json;charset=utf-8';
    return fetch(config.endpoint, { method, headers, body, cache: 'no-store' });
  }

  async function push() {
    const payload = CT.storage.serializableState();
    const envelope = await encryptPayload(payload, session?.passphrase);
    const response = await webdavRequest('PUT', JSON.stringify(envelope));
    if (!response.ok) throw new Error(`WebDAV upload failed (${response.status}).`);
    localStorage.setItem(LAST_COMMON_KEY, payload.changedAt || new Date().toISOString());
    CT.events.emit('sync-complete', { direction: 'push', changedAt: payload.changedAt });
    return { direction: 'push', changedAt: payload.changedAt };
  }

  async function readRemote() {
    const response = await webdavRequest('GET');
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`WebDAV download failed (${response.status}).`);
    const envelope = await response.json();
    return decryptPayload(envelope, session?.passphrase);
  }

  async function pull() {
    const payload = await readRemote();
    if (!payload) throw new Error('No remote vault exists yet.');
    CT.storage.captureUndoPoint('sync pull');
    CT.storage.applyBackup(payload, { source: 'sync' });
    localStorage.setItem(LAST_COMMON_KEY, payload.changedAt || payload.exportedAt || new Date().toISOString());
    CT.events.emit('sync-complete', { direction: 'pull', changedAt: payload.changedAt });
    return { direction: 'pull', changedAt: payload.changedAt };
  }

  async function smartSync() {
    const remote = await readRemote();
    if (!remote) return push();

    const localChanged = new Date(CT.storage.lastChangedAt() || 0).getTime();
    const remoteChanged = new Date(remote.changedAt || remote.exportedAt || 0).getTime();
    const commonChanged = new Date(localStorage.getItem(LAST_COMMON_KEY) || 0).getTime();
    const localDiverged = localChanged > commonChanged;
    const remoteDiverged = remoteChanged > commonChanged;

    if (localDiverged && remoteDiverged && localChanged !== remoteChanged) {
      const error = new Error('Sync conflict: both this device and the remote vault changed since the last sync. Choose Push or Pull explicitly.');
      error.code = 'SYNC_CONFLICT';
      CT.events.emit('sync-conflict', { localChanged, remoteChanged, commonChanged });
      throw error;
    }

    if (remoteChanged > localChanged) {
      CT.storage.captureUndoPoint('sync pull');
      CT.storage.applyBackup(remote, { source: 'sync' });
      localStorage.setItem(LAST_COMMON_KEY, remote.changedAt || remote.exportedAt || new Date().toISOString());
      CT.events.emit('sync-complete', { direction: 'pull', changedAt: remote.changedAt });
      return { direction: 'pull', changedAt: remote.changedAt };
    }
    return push();
  }

  async function exportEncryptedVault(passphrase) {
    const envelope = await encryptPayload(CT.storage.serializableState(), passphrase);
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cert-tracker-${new Date().toISOString().slice(0, 10)}.ctvault`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return envelope;
  }

  function importEncryptedVaultFile(passphrase) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.ctvault,.json,application/json';
      input.onchange = event => {
        const file = event.target.files?.[0];
        if (!file) return resolve(false);
        const reader = new FileReader();
        reader.onload = async e => {
          try {
            const envelope = JSON.parse(e.target.result);
            const payload = await decryptPayload(envelope, passphrase);
            CT.storage.captureUndoPoint('encrypted vault import');
            CT.storage.applyBackup(payload, { source: 'encrypted-file' });
            resolve(true);
          } catch (error) { reject(error); }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }

  function scheduleAutoSync() {
    const config = getConfig();
    if (!config.autoSync || !session || !config.endpoint) return;
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      smartSync().catch(error => {
        console.warn('[CertTracker] automatic sync skipped', error);
        CT.events.emit('sync-error', { error });
      });
    }, 5000);
  }

  CT.events.on('state-saved', scheduleAutoSync);

  CT.sync = Object.freeze({
    encryptPayload,
    decryptPayload,
    getConfig,
    setConfig,
    connect,
    disconnect,
    isConnected,
    push,
    pull,
    smartSync,
    exportEncryptedVault,
    importEncryptedVaultFile,
    scheduleAutoSync
  });
})(window);
