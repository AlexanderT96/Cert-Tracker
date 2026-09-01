// Cert Tracker v3 — explainable, goal-aware career recommendation engine.
(function initRecommendationEngine(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before recommendation-engine.js');

  const GOALS = Object.freeze({
    convergence: Object.freeze({
      label: 'Convergence / OT Security Architect',
      keywords: ['axis','milestone','lenel','access control','video','vms','network','security','cloud','architecture','integration','ot','ics','palo alto','crowdstrike','arcgis','esri','claroty','nozomi'],
      roleTrackBonus: 14
    }),
    cyber: Object.freeze({
      label: 'Cyber Security Engineer',
      keywords: ['security','soc','siem','incident','threat','detection','iam','identity','zero trust','pentest','linux','python','crowdstrike','palo alto','isc2','comptia'],
      roleTrackBonus: 7
    }),
    network: Object.freeze({
      label: 'Network / Security Engineer',
      keywords: ['network','routing','switching','cisco','firewall','wireless','tcp','ip','subnet','palo alto','fortinet','wireshark'],
      roleTrackBonus: 8
    }),
    physical: Object.freeze({
      label: 'Physical Security Architect',
      keywords: ['axis','milestone','lenel','access control','video','camera','vms','intercom','physical security','integration','design'],
      roleTrackBonus: 18
    }),
    cloud: Object.freeze({
      label: 'Cloud Security Architect',
      keywords: ['cloud','azure','aws','iam','identity','security','architecture','zero trust','network','automation','devops'],
      roleTrackBonus: 6
    })
  });

  const TRACK_WEIGHT = Object.freeze({
    CORE: 30,
    FOUNDATION: 18,
    'ROLE-DRIVEN': 25,
    ARCHITECT: 28,
    'IDENTITY-SEC': 18,
    CONDITIONAL: 12,
    OPTIONAL: 4,
    'POST-PLAN': -4
  });

  function currentGoal() {
    const key = localStorage.getItem(CT.config.goalKey) || 'convergence';
    return GOALS[key] ? key : 'convergence';
  }

  function setGoal(key) {
    if (!GOALS[key]) throw new Error(`Unknown goal profile: ${key}`);
    localStorage.setItem(CT.config.goalKey, key);
    CT.events.emit('goal-changed', { key, profile: GOALS[key] });
    return key;
  }

  function dependencies(cert) {
    const ids = Array.isArray(cert?.deps) ? cert.deps : [];
    const missing = ids.filter(id => !state.passes?.[id]);
    return { ids, missing, satisfied: missing.length === 0 };
  }

  function goalRelevance(cert, goalKey = currentGoal()) {
    const profile = GOALS[goalKey] || GOALS.convergence;
    const text = [cert?.name, cert?.vendor, cert?.coverage, cert?.note, ...(cert?.skills || []), ...(cert?.subjects || [])]
      .filter(Boolean).join(' ').toLowerCase();
    const matches = profile.keywords.filter(keyword => text.includes(keyword.toLowerCase()));
    const specialistTrack = ['ROLE-DRIVEN', 'ARCHITECT', 'IDENTITY-SEC'].includes(cert?.track);
    return {
      matches,
      score: Math.min(30, matches.length * 4 + (specialistTrack ? profile.roleTrackBonus : 0))
    };
  }

  function score(cert, options = {}) {
    const goalKey = options.goal || currentGoal();
    const phase = CT.phases?.currentPhase?.() || (typeof currentPhase === 'function' ? currentPhase() : 1);
    const dep = dependencies(cert);
    const health = CT.dataHealth?.record(cert) || { confidence: 70, freshness: 'UNKNOWN', sourceLevel: 'NONE' };
    const relevance = goalRelevance(cert, goalKey);
    const hours = CT.util.averageHours(cert);
    const phaseDistance = Number(cert.phase || 6) - Number(phase || 1);
    const inPath = CT.phases?.inPath ? CT.phases.inPath(cert) : !!state.myPath?.[cert.id];

    const breakdown = {
      track: TRACK_WEIGHT[cert.track] ?? 0,
      roi: Math.round(Number(cert.roi || 0) * 5),
      goal: relevance.score,
      phase: phaseDistance === 0 ? 30 : phaseDistance === 1 ? 12 : phaseDistance < 0 ? 2 : Math.max(-18, 6 - phaseDistance * 6),
      path: inPath ? 20 : -8,
      employer: cert.employer ? 14 : 0,
      gateway: cert.gateway ? 12 : 0,
      efficiency: hours <= 0 ? 0 : hours <= 20 ? 18 : hours <= 40 ? 14 : hours <= 70 ? 9 : hours <= 110 ? 4 : -3,
      scheduled: state.exams?.[cert.id] ? 12 : 0,
      dataConfidence: Math.round((health.confidence - 70) / 5),
      dependency: dep.satisfied ? 8 : -80
    };

    let total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
    if (state.passes?.[cert.id]) total = -9999;
    if (state.skipped?.[cert.id]) total = -9998;

    const reasons = [];
    if (phaseDistance === 0) reasons.push('Current-phase work');
    if (cert.employer) reasons.push('Employer-funded');
    if (cert.gateway) reasons.push('Gateway certification');
    if (Number(cert.roi || 0) >= 8) reasons.push(`High career ROI (${cert.roi}/10)`);
    if (relevance.matches.length) reasons.push(`Goal match: ${relevance.matches.slice(0, 4).join(', ')}`);
    if (hours > 0 && hours <= 40) reasons.push(`Relatively quick (${Math.round(hours)}h midpoint)`);
    if (!dep.satisfied) reasons.push(`Blocked by: ${dep.missing.map(id => CERTS.find(c => c.id === id)?.name || id).join(', ')}`);
    if (health.freshness === 'STALE' || health.freshness === 'UNKNOWN') reasons.push('Verify certification data before booking');

    return Object.freeze({
      cert,
      id: cert.id,
      name: cert.name,
      score: Math.round(total),
      available: dep.satisfied && !state.passes?.[cert.id] && !state.skipped?.[cert.id],
      dependencies: dep,
      relevance,
      health,
      estimatedHours: hours,
      phaseDistance,
      inPath,
      breakdown: Object.freeze(breakdown),
      reasons: Object.freeze(reasons)
    });
  }

  function recommend(options = {}) {
    const limit = Number(options.limit || 5);
    const includeBlocked = !!options.includeBlocked;
    const goal = options.goal || currentGoal();
    return CERTS
      .filter(cert => !state.passes?.[cert.id] && !state.skipped?.[cert.id])
      .map(cert => score(cert, { goal }))
      .filter(item => includeBlocked || item.available)
      .sort((a, b) => b.score - a.score || a.estimatedHours - b.estimatedHours || a.name.localeCompare(b.name))
      .slice(0, limit);
  }

  function explainTop(options = {}) {
    const picks = recommend({ ...options, limit: 2 });
    if (!picks.length) return null;
    const top = picks[0];
    const runnerUp = picks[1] || null;
    const opportunityCost = runnerUp
      ? `Choosing ${top.name} first scores ${Math.max(0, top.score - runnerUp.score)} points higher than ${runnerUp.name} for the current goal profile.`
      : 'No other currently available certification outranks this choice.';
    return Object.freeze({
      goal: currentGoal(),
      goalLabel: GOALS[currentGoal()].label,
      top,
      runnerUp,
      opportunityCost
    });
  }

  function scenario(goalKey) {
    if (!GOALS[goalKey]) throw new Error(`Unknown goal profile: ${goalKey}`);
    return {
      goal: goalKey,
      label: GOALS[goalKey].label,
      recommendations: recommend({ goal: goalKey, limit: 10 })
    };
  }

  // Keep legacy dashboard priority labels consistent with the v3 catalogue.
  if (typeof priorityScore === 'function') {
    const original = priorityScore;
    priorityScore = cert => {
      if (cert?.track === 'FOUNDATION' || cert?.track === 'ARCHITECT') return 4;
      if (cert?.track === 'IDENTITY-SEC') return 3;
      return original(cert);
    };
  }

  CT.recommendations = Object.freeze({ GOALS, currentGoal, setGoal, dependencies, goalRelevance, score, recommend, explainTop, scenario });
})(window);
