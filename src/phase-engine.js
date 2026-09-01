// Cert Tracker v3 — one authoritative phase-completion ruleset.
(function initPhaseEngine(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before phase-engine.js');

  function hasConfiguredPath() {
    return !!state.myPath && Object.keys(state.myPath).some(id => state.myPath[id]);
  }

  function inPath(cert) {
    if (!cert || state.skipped?.[cert.id]) return false;
    if (hasConfiguredPath()) return !!state.myPath[cert.id];
    return ['CORE', 'FOUNDATION', 'ROLE-DRIVEN'].includes(cert.track);
  }

  function phaseCerts(phase) {
    return CERTS.filter(cert => cert.phase === phase && inPath(cert));
  }

  function artifactRequired(phase) {
    return !!(typeof PHASES !== 'undefined' && PHASES?.[phase]?.artifact);
  }

  function artifactDone(phase) {
    return !artifactRequired(phase) || !!state.artifacts?.[phase];
  }

  function phaseState(phase) {
    const certs = phaseCerts(phase);
    const gates = certs.filter(cert => cert.track === 'CORE' || cert.gateway);
    const required = gates.length ? gates : certs.filter(cert => cert.track === 'FOUNDATION');
    const passed = required.filter(cert => !!state.passes?.[cert.id]);
    const complete = required.every(cert => !!state.passes?.[cert.id]) && artifactDone(phase);
    return Object.freeze({
      phase,
      certs,
      required,
      passed,
      artifactRequired: artifactRequired(phase),
      artifactDone: artifactDone(phase),
      complete,
      percent: required.length ? Math.round((passed.length / required.length) * 100) : (artifactDone(phase) ? 100 : 0)
    });
  }

  function isPhaseComplete(phase) {
    return phaseState(phase).complete;
  }

  function getCurrentPhase() {
    for (let phase = 1; phase <= 6; phase++) {
      const info = phaseState(phase);
      if (!info.certs.length) continue;
      if (!info.complete) return phase;
    }
    return 6;
  }

  function phaseBlockers(phase = getCurrentPhase()) {
    const info = phaseState(phase);
    const blockers = info.required
      .filter(cert => !state.passes?.[cert.id])
      .map(cert => ({ type: 'cert', id: cert.id, label: cert.name }));
    if (info.artifactRequired && !info.artifactDone) {
      blockers.push({ type: 'artifact', id: `phase-${phase}-artifact`, label: PHASES?.[phase]?.artifact || `Phase ${phase} artifact` });
    }
    return blockers;
  }

  CT.phases = Object.freeze({ inPath, phaseCerts, phaseState, isPhaseComplete, currentPhase: getCurrentPhase, phaseBlockers });

  // Existing UI calls this global in multiple places.
  currentPhase = getCurrentPhase;
})(window);
