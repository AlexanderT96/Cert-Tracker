// ═══════════════════════════════════════════════════════════════════════════
// CERT TRACKER — STABILITY LAYER
// Compatibility fixes, storage migration, validation and hardened exports.
// Loaded after app.js so the existing UI remains untouched.
// ═══════════════════════════════════════════════════════════════════════════

const APP_VERSION = '2.1.0';
const DATA_VERSION = 57;
const STORAGE_SCHEMA_VERSION = 3;

(function certTrackerStability() {
  const warn = (...args) => console.warn('[CertTracker]', ...args);

  // ───── STORAGE MIGRATION ────────────────────────────────────────────────
  // Older builds accidentally used localStorage key "undefined" because
  // SK.myPath was never defined. Adopt a real key without losing existing data.
  function migrateStorage() {
    try {
      const legacyMyPath = localStorage.getItem('undefined');
      const newKey = 'ct2-mypath';
      if (!localStorage.getItem(newKey) && legacyMyPath) {
        localStorage.setItem(newKey, legacyMyPath);
      }
      SK.myPath = newKey;
      if (state.myPath && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, JSON.stringify(state.myPath));
      }
      localStorage.setItem('ct2-storage-schema', String(STORAGE_SCHEMA_VERSION));
    } catch (err) {
      warn('Storage migration failed', err);
      SK.myPath = 'ct2-mypath';
    }
  }
  migrateStorage();

  // Restore missing persistence handlers referenced by historical backup code.
  save.cpe = () => localStorage.setItem(SK.cpe, JSON.stringify(state.activities || []));
  save.gates = () => localStorage.setItem(SK.gates, JSON.stringify(state.gates || {}));

  // Load legacy CPE/gate state if it exists. These fields are currently dormant,
  // but preserving them keeps old backups round-trippable.
  try { state.activities = JSON.parse(localStorage.getItem(SK.cpe) || '[]'); } catch { state.activities = []; }
  try { state.gates = JSON.parse(localStorage.getItem(SK.gates) || '{}'); } catch { state.gates = {}; }

  // ───── LOCAL DATE HELPERS ───────────────────────────────────────────────
  // Avoid UTC date rollover when the tracker is used around local midnight.
  function parseLocalDate(value) {
    if (value instanceof Date) return new Date(value.getTime());
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0, 0);
    }
    return new Date(value);
  }
  function localDateStamp(value = new Date()) {
    const d = value instanceof Date ? value : new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  today = () => localDateStamp(new Date());
  addMonths = (dateStr, months) => {
    const d = parseLocalDate(dateStr);
    if (Number.isNaN(d.getTime())) return new Date(NaN);
    d.setMonth(d.getMonth() + months);
    return d;
  };
  daysUntil = date => {
    const target = parseLocalDate(date);
    if (Number.isNaN(target.getTime())) return NaN;
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    target.setHours(12, 0, 0, 0);
    return Math.round((target - todayLocal) / 86400000);
  };
  fmt = date => {
    if (!date) return '';
    const d = parseLocalDate(date);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Keep expiryInfo's return type stable even when a malformed pass date exists.
  expiryInfo = (cert, passDate) => {
    if (!passDate) return { status: 'PENDING', days: null, expiry: null };
    if (cert.validity === null) return { status: 'NEVER', days: null, expiry: null };
    if (!cert.validity) return { status: 'NOEXP', days: null, expiry: null };
    const expiry = addMonths(passDate, cert.validity);
    const days = daysUntil(expiry);
    if (Number.isNaN(days)) return { status: 'INVALID', days: null, expiry: null };
    const status = days < 0 ? 'EXPIRED' : days <= 60 ? 'URGENT' : days <= 180 ? 'WARN' : 'OK';
    return { status, days, expiry };
  };
  const originalStatusBadgeHTML = statusBadgeHTML;
  statusBadgeHTML = (status, days) => status === 'INVALID'
    ? '<span class="status-badge status-warn">Invalid date</span>'
    : originalStatusBadgeHTML(status, days);

  // ───── DATA CONTRACT / DIAGNOSTICS ─────────────────────────────────────
  const ALLOWED_TRACKS = new Set(['CORE', 'FOUNDATION', 'CONDITIONAL', 'OPTIONAL', 'ROLE-DRIVEN', 'POST-PLAN']);
  function validateCertData() {
    const errors = [];
    const warnings = [];
    const ids = new Set();

    CERTS.forEach((cert, index) => {
      const label = cert && cert.id ? cert.id : `index ${index}`;
      if (!cert || typeof cert !== 'object') { errors.push(`Invalid cert record at ${index}`); return; }
      if (!cert.id) errors.push(`Missing id at ${index}`);
      else if (ids.has(cert.id)) errors.push(`Duplicate cert id: ${cert.id}`);
      else ids.add(cert.id);
      if (!cert.name) errors.push(`${label}: missing name`);
      if (!Number.isInteger(cert.phase) || cert.phase < 1 || cert.phase > 6) errors.push(`${label}: invalid phase ${cert.phase}`);
      if (!ALLOWED_TRACKS.has(cert.track)) errors.push(`${label}: invalid track ${cert.track}`);
      if (!Array.isArray(cert.deps)) warnings.push(`${label}: deps should be an array`);
      if (!Array.isArray(cert.hours) || cert.hours.length !== 2) warnings.push(`${label}: hours should be [min,max]`);
    });

    CERTS.forEach(cert => (cert.deps || []).forEach(dep => {
      if (!ids.has(dep)) errors.push(`${cert.id}: missing dependency ${dep}`);
      if (dep === cert.id) errors.push(`${cert.id}: self dependency`);
    }));

    return { errors, warnings, certCount: CERTS.length };
  }

  const diagnostics = validateCertData();
  if (diagnostics.errors.length) warn('Certification data validation errors:', diagnostics.errors);
  if (diagnostics.warnings.length) warn('Certification data validation warnings:', diagnostics.warnings);

  // FOUNDATION is a first-class path category. It is deliberately high priority
  // without becoming a phase gate like CORE.
  const originalPriorityScore = priorityScore;
  priorityScore = cert => cert && cert.track === 'FOUNDATION' ? 4 : originalPriorityScore(cert);

  // ───── PHASE PROGRESSION ────────────────────────────────────────────────
  // A phase now reflects the saved path, skipped items and portfolio artifact gate.
  currentPhase = function currentPhaseStable() {
    for (let p = 1; p <= 6; p++) {
      const pathCerts = CERTS.filter(c => c.phase === p && state.myPath && state.myPath[c.id] && !state.skipped[c.id]);
      if (!pathCerts.length) continue;
      const core = pathCerts.filter(c => c.track === 'CORE');
      const coreDone = core.every(c => !!state.passes[c.id]);
      const artifactRequired = !!(PHASES[p] && PHASES[p].artifact);
      const artifactDone = !artifactRequired || !!(state.artifacts && state.artifacts[p]);
      if (!coreDone || !artifactDone) return p;
    }
    return 6;
  };

  // ───── STUDY GUIDANCE CORRECTIONS ──────────────────────────────────────
  const originalWeeklyActions = weeklyActions;
  weeklyActions = cert => originalWeeklyActions(cert).map(action => {
    if (cert && cert.id === 'mcit') {
      return action.replace('on Axis Academy', 'in the Milestone Learning Portal');
    }
    if (cert && cert.id === 'secai-plus') {
      return action.replace('It is 80% of the exam content.', 'Use it as a core reference and verify coverage against the current exam objectives.');
    }
    return action;
  });

  // ───── NOTIFICATIONS ────────────────────────────────────────────────────
  // The old implementation marked a day as checked before a service worker was
  // ready. Clear that false-positive once during migration, then only stamp after
  // a real evaluation has completed.
  try {
    if ('Notification' in window && Notification.permission === 'granted' &&
        navigator.serviceWorker && !navigator.serviceWorker.controller &&
        localStorage.getItem(SK.notify) === today()) {
      localStorage.removeItem(SK.notify);
    }
  } catch {}

  checkAndNotify = async function checkAndNotifyStable() {
    if (!('Notification' in window) || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
    const todayStr = today();
    if (localStorage.getItem(SK.notify) === todayStr) return;

    let registration;
    try { registration = await navigator.serviceWorker.ready; } catch { return; }
    if (!registration) return;

    const urgent = [];
    const warnList = [];
    CERTS.forEach(cert => {
      const pd = state.passes[cert.id];
      if (!pd) return;
      const { status, days, expiry } = expiryInfo(cert, pd);
      if (status === 'EXPIRED') urgent.push(`${cert.name} — expired ${Math.abs(days)}d ago`);
      else if (status === 'URGENT') urgent.push(`${cert.name} — ${days}d left (expires ${fmt(expiry)})`);
      else if (status === 'WARN') warnList.push(`${cert.name} — ${days}d left`);
    });

    try {
      if (urgent.length) {
        const body = urgent.slice(0, 3).join('\n') + (urgent.length > 3 ? `\n+${urgent.length - 3} more` : '');
        await registration.showNotification(`⚠ ${urgent.length} cert${urgent.length > 1 ? 's' : ''} expiring`, {
          body, tag: 'urgent', icon: './icon.svg', badge: './icon.svg'
        });
      } else if (warnList.length) {
        const body = warnList.slice(0, 3).join('\n') + (warnList.length > 3 ? `\n+${warnList.length - 3} more` : '');
        await registration.showNotification(`${warnList.length} cert${warnList.length > 1 ? 's' : ''} renewing soon`, {
          body, tag: 'warn', icon: './icon.svg', badge: './icon.svg'
        });
      }
      localStorage.setItem(SK.notify, todayStr);
    } catch (err) {
      warn('Notification check failed', err);
    }
  };

  // ───── ICALENDAR EXPORT ────────────────────────────────────────────────
  function icsEscape(value) {
    return String(value == null ? '' : value)
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }
  function icsDate(value) {
    const d = parseLocalDate(value);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }
  function nextDateStamp(value) {
    const d = parseLocalDate(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + 1);
    return icsDate(d);
  }

  exportICS = function exportICSStable() {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CertTracker//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    let count = 0;
    const addAllDayEvent = ({ uid, date, summary, description, alarms }) => {
      const start = icsDate(date);
      const end = nextDateStamp(date);
      if (!start || !end) return;
      lines.push('BEGIN:VEVENT', `UID:${icsEscape(uid)}`, `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(summary)}`, `DESCRIPTION:${icsEscape(description)}`);
      alarms.forEach(({ trigger, description: alarmDescription }) => {
        lines.push('BEGIN:VALARM', `TRIGGER:${trigger}`, 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(alarmDescription)}`, 'END:VALARM');
      });
      lines.push('END:VEVENT');
      count++;
    };

    CERTS.forEach(cert => {
      const ed = state.exams[cert.id];
      if (!ed) return;
      addAllDayEvent({
        uid: `cert-${cert.id}-exam@certtracker`, date: ed,
        summary: `📝 EXAM: ${cert.name}`, description: `${cert.name} exam day.`,
        alarms: [
          { trigger: '-P7D', description: `⚠ ${cert.name} exam in 7 days` },
          { trigger: '-P1D', description: `⚠ ${cert.name} exam tomorrow` }
        ]
      });
    });

    CERTS.forEach(cert => {
      const pd = state.passes[cert.id];
      if (!pd || !cert.validity) return;
      const expiry = addMonths(pd, cert.validity);
      addAllDayEvent({
        uid: `cert-${cert.id}-expiry@certtracker`, date: expiry,
        summary: `🔴 EXPIRES: ${cert.name}`, description: `${cert.name} expires today.`,
        alarms: [
          { trigger: '-P90D', description: `⚠ ${cert.name} expires in 90 days` },
          { trigger: '-P30D', description: `⚠ ${cert.name} expires in 30 days` }
        ]
      });
    });

    lines.push('END:VCALENDAR');
    if (!count) { showToast('No dates to export'); return; }
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cert-tracker-calendar.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Exported ${count} events`);
  };

  // ───── SAFE BACKUP RESTORE ──────────────────────────────────────────────
  function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
  function persistRestoredState() {
    localStorage.setItem(SK.passes, JSON.stringify(state.passes));
    localStorage.setItem(SK.exams, JSON.stringify(state.exams));
    localStorage.setItem(SK.notes, JSON.stringify(state.notes));
    localStorage.setItem(SK.study, JSON.stringify(state.studyLog));
    localStorage.setItem(SK.skipped, JSON.stringify(state.skipped));
    localStorage.setItem(SK.myPath, JSON.stringify(state.myPath));
    localStorage.setItem(SK.filter, state.filter || 'my-path');
    localStorage.setItem(SK.salary, String(state.currentSalary));
    localStorage.setItem(SK.pace2, String(state.pace2));
    localStorage.setItem(SK.explog, JSON.stringify(state.expLog));
    localStorage.setItem(SK.eventsDis, JSON.stringify(state.eventsDismissed));
    localStorage.setItem('ct2-artifacts', JSON.stringify(state.artifacts || {}));
    localStorage.setItem('ct2-partners', JSON.stringify(state.partners || {}));
    localStorage.setItem('ct2-order', JSON.stringify(state.certOrder || {}));
    localStorage.setItem('ct2-phase-ovr', JSON.stringify(state.phaseOverrides || {}));
    save.cpe();
    save.gates();
  }

  importJSON = function importJSONStable() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!isPlainObject(data) || !data.version || !isPlainObject(data.passes)) throw new Error('Invalid backup shape');
          if (data.exams != null && !isPlainObject(data.exams)) throw new Error('Invalid exams');
          if (data.notes != null && !isPlainObject(data.notes)) throw new Error('Invalid notes');
          if (data.studyLog != null && !Array.isArray(data.studyLog)) throw new Error('Invalid study log');
          if (data.skipped != null && !isPlainObject(data.skipped)) throw new Error('Invalid skipped state');
          if (data.myPath != null && !isPlainObject(data.myPath)) throw new Error('Invalid path');

          // Validation has completed; only now mutate live state.
          state.passes = data.passes || {};
          state.exams = data.exams || {};
          state.notes = data.notes || {};
          state.studyLog = data.studyLog || [];
          state.skipped = data.skipped || {};
          if (data.myPath) state.myPath = data.myPath;
          if (typeof data.filter === 'string') state.filter = data.filter;
          if (typeof data.currentSalary === 'number' && Number.isFinite(data.currentSalary)) state.currentSalary = data.currentSalary;
          if (typeof data.pace2 === 'number' && Number.isFinite(data.pace2)) state.pace2 = data.pace2;
          if (Array.isArray(data.expLog)) state.expLog = data.expLog;
          if (isPlainObject(data.artifacts)) state.artifacts = data.artifacts;
          if (isPlainObject(data.partners)) state.partners = data.partners;
          if (isPlainObject(data.certOrder)) state.certOrder = data.certOrder;
          if (isPlainObject(data.phaseOverrides)) state.phaseOverrides = data.phaseOverrides;
          if (Array.isArray(data.eventsDismissed)) state.eventsDismissed = data.eventsDismissed;
          if (Array.isArray(data.activities)) state.activities = data.activities;
          if (isPlainObject(data.gates)) state.gates = data.gates;

          Object.entries(state.phaseOverrides || {}).forEach(([id, ph]) => {
            const cert = CERTS.find(c => c.id === id);
            if (cert && Number(ph) >= 1 && Number(ph) <= 6) cert.phase = Number(ph);
          });

          persistRestoredState();
          renderApp();
          showToast('Backup restored');
        } catch (err) {
          warn('Backup restore rejected', err);
          showToast('Error: invalid or incompatible backup');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Extend future backups with dormant legacy fields so a restore is complete.
  const originalExportJSON = exportJSON;
  // Keep original UI behaviour for now; CPE/gates are preserved independently by the
  // migration layer and safe importer. A future data-format bump can formally add them.
  void originalExportJSON;

  // ───── UI CONSISTENCY ───────────────────────────────────────────────────
  function applyVersionLabel() {
    const hs = document.querySelector('.header-sub');
    if (hs) hs.innerHTML = hs.innerHTML.replace(/v24\b/, `v${APP_VERSION}`);
  }
  function patchFoundationTrackRow() {
    const foundation = CERTS.filter(c => c.track === 'FOUNDATION');
    if (!foundation.length || document.querySelector('[data-foundation-track]')) return;
    const card = [...document.querySelectorAll('.card')].find(el =>
      el.querySelector('.card-title') && /Overall & Tracks/.test(el.querySelector('.card-title').textContent || '')
    );
    if (!card) return;
    const passed = foundation.filter(c => state.passes[c.id]).length;
    const pct = Math.round((passed / foundation.length) * 100);
    const row = document.createElement('div');
    row.className = 'track-row';
    row.dataset.foundationTrack = '1';
    row.innerHTML = `<div class="track-row-meta"><span class="badge badge-cond">FOUNDATION</span><span style="font-size:10px;color:var(--dim)">${passed}/${foundation.length}</span></div>${progressBarHTML(pct, 'var(--blue)', '5px')}`;
    card.appendChild(row);
  }
  function applyPostRenderFixes() {
    applyVersionLabel();
    patchFoundationTrackRow();
  }

  const originalRenderApp = renderApp;
  renderApp = function renderAppStable() {
    const result = originalRenderApp();
    applyPostRenderFixes();
    return result;
  };
  const originalRenderTabContent = renderTabContent;
  renderTabContent = function renderTabContentStable() {
    const result = originalRenderTabContent();
    applyPostRenderFixes();
    return result;
  };
  const originalUpdateHeaderCount = updateHeaderCount;
  updateHeaderCount = function updateHeaderCountStable() {
    const result = originalUpdateHeaderCount();
    applyVersionLabel();
    return result;
  };

  window.CertTrackerStability = Object.freeze({
    APP_VERSION,
    DATA_VERSION,
    STORAGE_SCHEMA_VERSION,
    diagnostics,
    validateCertData,
    icsEscape,
    icsDate,
    localDateStamp
  });

  // Re-render once so migrated state, corrected phase logic and version label are visible.
  renderApp();
  checkAndNotify();
})();
