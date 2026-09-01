// Cert Tracker v3 — bootstraps the modular core around the existing renderer.
(function bootstrapV3(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('Cert Tracker v3 modules were not loaded correctly.');

  // Correct historical guidance without mutating the canonical catalogue at runtime.
  if (typeof weeklyActions === 'function') {
    const originalWeeklyActions = weeklyActions;
    weeklyActions = cert => originalWeeklyActions(cert).map(action => {
      if (cert?.id === 'mcit') return action.replace('on Axis Academy', 'in the Milestone Learning Portal');
      if (cert?.id === 'secai-plus') return action.replace('It is 80% of the exam content.', 'Use it as a core reference and verify coverage against the current exam objectives.');
      return action;
    });
  }

  function applyVersionLabel() {
    const host = document.querySelector('.header-sub');
    if (!host) return;
    [...host.childNodes].forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) node.textContent = node.textContent.replace(/v\d+(?:\.\d+){0,2}\b/g, `v${CT.version.app}`);
    });
    if (!/v\d/.test(host.textContent || '')) host.insertAdjacentText('afterbegin', `v${CT.version.app} · `);
  }

  function patchMissingTrackRows() {
    const card = [...document.querySelectorAll('.card')].find(el => /Overall & Tracks/i.test(el.querySelector('.card-title')?.textContent || ''));
    if (!card) return;

    const tracks = [
      { track: 'FOUNDATION', colour: 'var(--blue)' },
      { track: 'ARCHITECT', colour: 'var(--purple, var(--blue))' },
      { track: 'IDENTITY-SEC', colour: 'var(--cyan, var(--blue))' }
    ];

    tracks.forEach(({ track, colour }) => {
      const certs = CERTS.filter(cert => cert.track === track);
      if (!certs.length || card.querySelector(`[data-v3-track="${track}"]`)) return;
      const passed = certs.filter(cert => state.passes?.[cert.id]).length;
      const pct = Math.round((passed / certs.length) * 100);
      const row = document.createElement('div');
      row.className = 'track-row';
      row.dataset.v3Track = track;
      row.innerHTML = `<div class="track-row-meta"><span class="badge badge-cond">${CT.util.escapeHtml(track)}</span><span style="font-size:10px;color:var(--dim)">${passed}/${certs.length}</span></div>${typeof progressBarHTML === 'function' ? progressBarHTML(pct, colour, '5px') : ''}`;
      card.appendChild(row);
    });
  }

  function postRender() {
    applyVersionLabel();
    patchMissingTrackRows();
    if (CT.ux && !document.getElementById('ct3-launcher')) CT.ux.init();
  }

  function wrapRenderer(name) {
    const fn = global[name];
    if (typeof fn !== 'function' || fn.__ct3Wrapped) return;
    const wrapped = function (...args) {
      const result = fn.apply(this, args);
      queueMicrotask(postRender);
      return result;
    };
    wrapped.__ct3Wrapped = true;
    global[name] = wrapped;
  }

  wrapRenderer('renderApp');
  wrapRenderer('renderTabContent');
  wrapRenderer('updateHeaderCount');

  global.CertTracker = CT;
  global.CertTrackerStability = Object.freeze({
    APP_VERSION: CT.version.app,
    DATA_VERSION: CT.version.data,
    STORAGE_SCHEMA_VERSION: CT.version.storage,
    diagnostics: CT.validation.diagnostics,
    validateCertData: CT.validation.validateCertData,
    icsEscape: CT.exports.icsEscape,
    icsDate: CT.dates.icsDate,
    localDateStamp: CT.dates.localDateStamp
  });

  // Ensure the service worker is registered even if an older app build omitted it.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('[CertTracker] service worker registration failed', error));
  }

  try {
    if (typeof renderApp === 'function') renderApp();
  } catch (error) {
    console.error('[CertTracker] v3 initial render failed', error);
  }
  postRender();
  CT.notifications.checkAndNotify();
  CT.events.emit('ready', { version: CT.version, diagnostics: CT.validation.diagnostics });
})(window);
