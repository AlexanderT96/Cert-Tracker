// Cert Tracker v3 — storage, migrations, backups, recovery and undo.
(function initStorage(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before storage.js');
  const C = CT.config;

  const safeParse = (raw, fallback) => {
    try { return raw == null ? fallback : JSON.parse(raw); } catch { return fallback; }
  };

  function migrate() {
    let migratedPath = null;
    for (const key of C.legacyMyPathKeys) {
      const raw = localStorage.getItem(key);
      if (raw) { migratedPath = raw; break; }
    }
    if (!localStorage.getItem(C.myPathKey) && migratedPath) localStorage.setItem(C.myPathKey, migratedPath);
    SK.myPath = C.myPathKey;
    if (state.myPath && !localStorage.getItem(C.myPathKey)) localStorage.setItem(C.myPathKey, JSON.stringify(state.myPath));
    localStorage.setItem(C.storageSchemaKey, String(CT.version.storage));

    // Preserve dormant fields referenced by older backups.
    if (typeof save.cpe !== 'function') save.cpe = () => localStorage.setItem(SK.cpe, JSON.stringify(state.activities || []));
    if (typeof save.gates !== 'function') save.gates = () => localStorage.setItem(SK.gates, JSON.stringify(state.gates || {}));
    state.activities = safeParse(localStorage.getItem(SK.cpe), state.activities || []);
    state.gates = safeParse(localStorage.getItem(SK.gates), state.gates || {});
  }

  function serializableState() {
    return {
      version: CT.version.backup,
      appVersion: CT.version.app,
      dataVersion: CT.version.data,
      storageVersion: CT.version.storage,
      exportedAt: new Date().toISOString(),
      changedAt: localStorage.getItem(C.lastChangeKey) || new Date().toISOString(),
      passes: { ...(state.passes || {}) },
      exams: { ...(state.exams || {}) },
      notes: { ...(state.notes || {}) },
      studyLog: Array.isArray(state.studyLog) ? [...state.studyLog] : [],
      skipped: { ...(state.skipped || {}) },
      myPath: { ...(state.myPath || {}) },
      filter: state.filter || 'my-path',
      currentSalary: Number(state.currentSalary || 0),
      pace2: Number(state.pace2 || 0),
      expLog: Array.isArray(state.expLog) ? [...state.expLog] : [],
      eventsDismissed: Array.isArray(state.eventsDismissed) ? [...state.eventsDismissed] : [],
      artifacts: { ...(state.artifacts || {}) },
      partners: { ...(state.partners || {}) },
      certOrder: { ...(state.certOrder || {}) },
      phaseOverrides: { ...(state.phaseOverrides || {}) },
      activities: Array.isArray(state.activities) ? [...state.activities] : [],
      gates: { ...(state.gates || {}) },
      goalProfile: localStorage.getItem(C.goalKey) || 'convergence'
    };
  }

  function readPersistedSnapshot() {
    return {
      version: CT.version.backup,
      appVersion: CT.version.app,
      dataVersion: CT.version.data,
      storageVersion: CT.version.storage,
      exportedAt: new Date().toISOString(),
      changedAt: localStorage.getItem(C.lastChangeKey) || new Date().toISOString(),
      passes: safeParse(localStorage.getItem(SK.passes), {}),
      exams: safeParse(localStorage.getItem(SK.exams), {}),
      notes: safeParse(localStorage.getItem(SK.notes), {}),
      studyLog: safeParse(localStorage.getItem(SK.study), []),
      skipped: safeParse(localStorage.getItem(SK.skipped), {}),
      myPath: safeParse(localStorage.getItem(C.myPathKey), state.myPath || {}),
      filter: localStorage.getItem(SK.filter) || state.filter || 'my-path',
      currentSalary: Number(localStorage.getItem(SK.salary) || state.currentSalary || 0),
      pace2: Number(localStorage.getItem(SK.pace2) || state.pace2 || 0),
      expLog: safeParse(localStorage.getItem(SK.explog), []),
      eventsDismissed: safeParse(localStorage.getItem(SK.eventsDis), []),
      artifacts: safeParse(localStorage.getItem('ct2-artifacts'), {}),
      partners: safeParse(localStorage.getItem('ct2-partners'), {}),
      certOrder: safeParse(localStorage.getItem('ct2-order'), {}),
      phaseOverrides: safeParse(localStorage.getItem('ct2-phase-ovr'), {}),
      activities: safeParse(localStorage.getItem(SK.cpe), []),
      gates: safeParse(localStorage.getItem(SK.gates), {}),
      goalProfile: localStorage.getItem(C.goalKey) || 'convergence'
    };
  }

  function validateBackup(data) {
    const errors = [];
    const isObject = CT.util.isPlainObject;
    if (!isObject(data)) errors.push('Backup root must be an object.');
    if (!Number.isFinite(Number(data?.version))) errors.push('Missing backup version.');
    if (!isObject(data?.passes)) errors.push('passes must be an object.');
    for (const field of ['exams', 'notes', 'skipped', 'myPath', 'artifacts', 'partners', 'certOrder', 'phaseOverrides', 'gates']) {
      if (data?.[field] != null && !isObject(data[field])) errors.push(`${field} must be an object.`);
    }
    for (const field of ['studyLog', 'expLog', 'eventsDismissed', 'activities']) {
      if (data?.[field] != null && !Array.isArray(data[field])) errors.push(`${field} must be an array.`);
    }
    if (data?.currentSalary != null && !Number.isFinite(Number(data.currentSalary))) errors.push('currentSalary must be numeric.');
    if (data?.pace2 != null && !Number.isFinite(Number(data.pace2))) errors.push('pace2 must be numeric.');
    return { ok: errors.length === 0, errors };
  }

  function persistAll() {
    localStorage.setItem(SK.passes, JSON.stringify(state.passes || {}));
    localStorage.setItem(SK.exams, JSON.stringify(state.exams || {}));
    localStorage.setItem(SK.notes, JSON.stringify(state.notes || {}));
    localStorage.setItem(SK.study, JSON.stringify(state.studyLog || []));
    localStorage.setItem(SK.skipped, JSON.stringify(state.skipped || {}));
    localStorage.setItem(C.myPathKey, JSON.stringify(state.myPath || {}));
    localStorage.setItem(SK.filter, state.filter || 'my-path');
    localStorage.setItem(SK.salary, String(Number(state.currentSalary || 0)));
    localStorage.setItem(SK.pace2, String(Number(state.pace2 || 0)));
    localStorage.setItem(SK.explog, JSON.stringify(state.expLog || []));
    localStorage.setItem(SK.eventsDis, JSON.stringify(state.eventsDismissed || []));
    localStorage.setItem('ct2-artifacts', JSON.stringify(state.artifacts || {}));
    localStorage.setItem('ct2-partners', JSON.stringify(state.partners || {}));
    localStorage.setItem('ct2-order', JSON.stringify(state.certOrder || {}));
    localStorage.setItem('ct2-phase-ovr', JSON.stringify(state.phaseOverrides || {}));
    save.cpe();
    save.gates();
    localStorage.setItem(C.storageSchemaKey, String(CT.version.storage));
    localStorage.setItem(C.lastChangeKey, new Date().toISOString());
  }

  function applyBackup(data, options = {}) {
    const validation = validateBackup(data);
    if (!validation.ok) throw new Error(validation.errors.join(' '));

    const rollback = serializableState();
    try {
      state.passes = data.passes || {};
      state.exams = data.exams || {};
      state.notes = data.notes || {};
      state.studyLog = data.studyLog || [];
      state.skipped = data.skipped || {};
      if (data.myPath) state.myPath = data.myPath;
      if (typeof data.filter === 'string') state.filter = data.filter;
      if (data.currentSalary != null) state.currentSalary = Number(data.currentSalary);
      if (data.pace2 != null) state.pace2 = Number(data.pace2);
      state.expLog = Array.isArray(data.expLog) ? data.expLog : [];
      state.eventsDismissed = Array.isArray(data.eventsDismissed) ? data.eventsDismissed : [];
      state.artifacts = data.artifacts || {};
      state.partners = data.partners || {};
      state.certOrder = data.certOrder || {};
      state.phaseOverrides = data.phaseOverrides || {};
      state.activities = Array.isArray(data.activities) ? data.activities : [];
      state.gates = data.gates || {};
      if (typeof data.goalProfile === 'string') localStorage.setItem(C.goalKey, data.goalProfile);

      Object.entries(state.phaseOverrides || {}).forEach(([id, ph]) => {
        const cert = CERTS.find(c => c.id === id);
        if (cert && Number(ph) >= 1 && Number(ph) <= 6) cert.phase = Number(ph);
      });

      persistAll();
      if (!options.silent) {
        CT.events.emit('state-restored', { source: options.source || 'backup' });
        if (typeof renderApp === 'function') renderApp();
      }
      return true;
    } catch (error) {
      // Roll back both memory and persistence if any part of the restore fails.
      try {
        state.passes = rollback.passes; state.exams = rollback.exams; state.notes = rollback.notes;
        state.studyLog = rollback.studyLog; state.skipped = rollback.skipped; state.myPath = rollback.myPath;
        state.filter = rollback.filter; state.currentSalary = rollback.currentSalary; state.pace2 = rollback.pace2;
        state.expLog = rollback.expLog; state.eventsDismissed = rollback.eventsDismissed; state.artifacts = rollback.artifacts;
        state.partners = rollback.partners; state.certOrder = rollback.certOrder; state.phaseOverrides = rollback.phaseOverrides;
        state.activities = rollback.activities; state.gates = rollback.gates;
        persistAll();
      } catch {}
      throw error;
    }
  }

  function downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportBackup() {
    const data = serializableState();
    downloadJson(data, `cert-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`);
    localStorage.setItem(C.lastBackupKey, new Date().toISOString());
    localStorage.setItem(C.recoveryKey, JSON.stringify(data));
    CT.events.emit('backup-exported', data);
    if (typeof showToast === 'function') showToast('Backup exported');
    return data;
  }

  function importBackupFile() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json';
    input.onchange = event => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          applyBackup(data, { source: 'file' });
          if (typeof showToast === 'function') showToast('Backup restored');
        } catch (error) {
          console.error('[CertTracker] backup restore rejected', error);
          if (typeof showToast === 'function') showToast('Error: invalid or incompatible backup');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  let lastUndoCapture = 0;
  function captureUndoPoint(reason = 'change') {
    const now = Date.now();
    if (now - lastUndoCapture < 900) return;
    lastUndoCapture = now;
    const snapshot = readPersistedSnapshot();
    snapshot.undoReason = reason;
    snapshot.undoCapturedAt = new Date().toISOString();
    localStorage.setItem(C.undoKey, JSON.stringify(snapshot));
  }

  function undoLastChange() {
    const data = safeParse(localStorage.getItem(C.undoKey), null);
    if (!data) {
      if (typeof showToast === 'function') showToast('Nothing to undo');
      return false;
    }
    applyBackup(data, { source: 'undo' });
    localStorage.removeItem(C.undoKey);
    if (typeof showToast === 'function') showToast(`Undid ${data.undoReason || 'last change'}`);
    return true;
  }

  let lastRecoveryWrite = 0;
  function recordRecoveryPoint() {
    if (Date.now() - lastRecoveryWrite < 30000) return;
    lastRecoveryWrite = Date.now();
    try { localStorage.setItem(C.recoveryKey, JSON.stringify(serializableState())); } catch {}
  }

  function wrapSaves() {
    Object.keys(save).forEach(key => {
      if (typeof save[key] !== 'function' || save[key].__ct3Wrapped) return;
      const original = save[key];
      const wrapped = function (...args) {
        captureUndoPoint(key);
        const result = original.apply(this, args);
        localStorage.setItem(C.lastChangeKey, new Date().toISOString());
        recordRecoveryPoint();
        CT.events.emit('state-saved', { key, at: new Date().toISOString() });
        return result;
      };
      wrapped.__ct3Wrapped = true;
      save[key] = wrapped;
    });
  }

  migrate();
  wrapSaves();
  recordRecoveryPoint();

  // Replace legacy backup handlers with the versioned implementation.
  exportJSON = exportBackup;
  importJSON = importBackupFile;

  CT.storage = Object.freeze({
    migrate,
    serializableState,
    readPersistedSnapshot,
    validateBackup,
    applyBackup,
    persistAll,
    exportBackup,
    importBackupFile,
    captureUndoPoint,
    undoLastChange,
    recordRecoveryPoint,
    lastBackupAt: () => localStorage.getItem(C.lastBackupKey),
    lastChangedAt: () => localStorage.getItem(C.lastChangeKey)
  });
})(window);
