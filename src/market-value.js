// Cert Tracker v3.1 — UK market-value and certification ROI model.
// Salary anchors are market benchmarks, not promises of pay or causal cert uplifts.
(function initMarketValue(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before market-value.js');

  const SNAPSHOT = Object.freeze({
    asOf: '2026-08-31',
    currency: 'GBP',
    geography: 'UK',
    disclaimer: 'Indicative UK market benchmarks only. Certification value depends on role scope, experience, evidence, employer, sector and hiring conditions; no certificate guarantees a salary increase.',
    sources: Object.freeze([
      Object.freeze({ label: 'IT Jobs Watch — Cyber Security Engineer', url: 'https://www.itjobswatch.co.uk/jobs/uk/cyber%20security%20engineer.do', median: 65000 }),
      Object.freeze({ label: 'IT Jobs Watch — Network Security Engineer', url: 'https://www.itjobswatch.co.uk/jobs/uk/network%20security%20engineer.do', median: 67500 }),
      Object.freeze({ label: 'IT Jobs Watch — Security Architect', url: 'https://www.itjobswatch.co.uk/jobs/uk/security%20architect.do', median: 85000 }),
      Object.freeze({ label: 'IT Jobs Watch — Solution Architect', url: 'https://www.itjobswatch.co.uk/jobs/uk/solutions%20architect.do', median: 85000 }),
      Object.freeze({ label: 'IT Jobs Watch — Cloud Solution Architect', url: 'https://www.itjobswatch.co.uk/jobs/uk/cloud%20solutions%20architect.do', median: 87000 }),
      Object.freeze({ label: 'Barclay Simpson — 2026 Cyber Security Salary Guide', url: 'https://www.barclaysimpson.com/salary-guides/2026-cyber-security-salary-guide/' }),
      Object.freeze({ label: 'UK Government — Cyber Security Sectoral Analysis 2026', url: 'https://www.gov.uk/government/publications/cyber-security-sectoral-analysis-2026/cyber-security-sectoral-analysis-2026' })
    ])
  });

  // Low / median / high are broad national base-salary anchors for a role family,
  // deliberately wider than a single source so the tracker does not overfit one dataset.
  const ROLE_BANDS = Object.freeze({
    infrastructure: Object.freeze({ label: 'Infrastructure / Systems', low: 35000, median: 50000, high: 70000, confidence: 'MEDIUM' }),
    networkSecurity: Object.freeze({ label: 'Network Security Engineer', low: 50000, median: 67500, high: 90000, confidence: 'HIGH' }),
    cyberEngineer: Object.freeze({ label: 'Cyber Security Engineer', low: 50000, median: 65000, high: 90000, confidence: 'HIGH' }),
    securityArchitect: Object.freeze({ label: 'Security Architect', low: 75000, median: 85000, high: 120000, confidence: 'HIGH' }),
    solutionsArchitect: Object.freeze({ label: 'Solution Architect', low: 70000, median: 85000, high: 110000, confidence: 'HIGH' }),
    cloudArchitect: Object.freeze({ label: 'Cloud / Cloud Security Architect', low: 80000, median: 95000, high: 130000, confidence: 'HIGH' }),
    otArchitect: Object.freeze({ label: 'OT / Convergence Security Architect', low: 80000, median: 105000, high: 135000, confidence: 'MEDIUM' }),
    physicalArchitect: Object.freeze({ label: 'Physical Security Architect / Consultant', low: 60000, median: 80000, high: 110000, confidence: 'LOW' }),
    iam: Object.freeze({ label: 'IAM / Identity Security', low: 60000, median: 80000, high: 110000, confidence: 'MEDIUM' }),
    grc: Object.freeze({ label: 'GRC / Security Risk', low: 55000, median: 75000, high: 105000, confidence: 'MEDIUM' }),
    leadership: Object.freeze({ label: 'Security Leadership', low: 95000, median: 125000, high: 170000, confidence: 'MEDIUM' })
  });

  const TRACK_ROLE = Object.freeze({
    FOUNDATION: 'infrastructure', CORE: 'cyberEngineer', CONDITIONAL: 'cyberEngineer', OPTIONAL: 'infrastructure',
    'ROLE-DRIVEN': 'physicalArchitect', ARCHITECT: 'securityArchitect', 'IDENTITY-SEC': 'iam', 'POST-PLAN': 'securityArchitect'
  });

  const ROLE_RULES = Object.freeze([
    Object.freeze({ key: 'otArchitect', terms: ['ot security','ot/ics','ics security','industrial','scada','62443','gicsp','claroty','nozomi','convergence'] }),
    Object.freeze({ key: 'cloudArchitect', terms: ['cloud security architect','aws architect','azure architect','az-305','ccsp','cloud architecture'] }),
    Object.freeze({ key: 'securityArchitect', terms: ['security architect','architecture','issap','sabsa','security design'] }),
    Object.freeze({ key: 'networkSecurity', terms: ['network security','cisco','ccna','ccnp','firewall','palo alto','fortinet','routing','switching'] }),
    Object.freeze({ key: 'iam', terms: ['iam','identity','pam','entra','sc-300','zero trust'] }),
    Object.freeze({ key: 'grc', terms: ['governance','risk','compliance','cism','crisc','iso 27001','privacy','cipp'] }),
    Object.freeze({ key: 'physicalArchitect', terms: ['physical security','milestone','axis','lenel','access control','vms','video surveillance','asis'] }),
    Object.freeze({ key: 'cyberEngineer', terms: ['cyber','security','soc','incident','threat','cysa','security+','pentest','detection'] })
  ]);

  function money(value) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(Math.round(Number(value) || 0));
  }

  function roleFor(cert) {
    const text = [cert?.name, cert?.code, cert?.vendor, cert?.coverage, cert?.note, ...(cert?.skills || []), ...(cert?.subjects || [])]
      .filter(Boolean).join(' ').toLowerCase();
    for (const rule of ROLE_RULES) if (rule.terms.some(term => text.includes(term))) return rule.key;
    return TRACK_ROLE[cert?.track] || 'cyberEngineer';
  }

  function dataConfidence(cert) {
    const health = CT.dataHealth?.record?.(cert);
    if (!health) return 0.65;
    return CT.util.clamp(Number(health.confidence || 0) / 100, 0.35, 1);
  }

  function contribution(cert) {
    const legacy = Math.max(0, Number(cert?.cvValue || 0));
    const roi = CT.util.clamp(Number(cert?.roi || 0), 0, 10);
    const confidence = dataConfidence(cert);
    const hours = Math.max(1, CT.util.averageHours(cert));
    const cost = Math.max(0, Number(cert?.costNum || 0));
    const roleKey = roleFor(cert);
    const role = ROLE_BANDS[roleKey];

    // cvValue is retained as a historical signal, but converted into a range and
    // tempered by ROI, data confidence and seniority. It is NOT added to salary.
    const seniorityFactor = cert?.gateway ? 1.18 : cert?.track === 'ARCHITECT' ? 1.22 : cert?.track === 'POST-PLAN' ? 0.82 : 1;
    const centre = Math.round(legacy * (0.72 + roi * 0.04) * seniorityFactor);
    const uncertainty = confidence >= 0.85 ? 0.22 : confidence >= 0.7 ? 0.34 : 0.48;
    const low = Math.max(0, Math.round(centre * (1 - uncertainty) / 100) * 100);
    const high = Math.max(low, Math.round(centre * (1 + uncertainty) / 100) * 100);
    const midpoint = Math.round((low + high) / 2);
    const confidenceLabel = confidence >= 0.85 ? 'HIGH' : confidence >= 0.7 ? 'MEDIUM' : 'LOW';

    return Object.freeze({
      roleKey,
      role,
      marketBand: Object.freeze({ low: role.low, median: role.median, high: role.high, confidence: role.confidence }),
      contributionRange: Object.freeze({ low, high, midpoint }),
      contributionLabel: `${money(low)}–${money(high)}`,
      confidence: confidenceLabel,
      valuePerStudyHour: Math.round(midpoint / hours),
      valueToCostRatio: cost > 0 ? Number((midpoint / cost).toFixed(1)) : null,
      selfFundedCost: cost,
      evidence: cert?.projectRec ? 'Certification + portfolio evidence' : 'Certification signal only',
      disclaimer: SNAPSHOT.disclaimer
    });
  }

  function portfolioSummary(certs = CERTS.filter(cert => state.myPath?.[cert.id] && !state.skipped?.[cert.id])) {
    const items = certs.map(cert => ({ cert, value: contribution(cert) }));
    const available = items.filter(x => !state.passes?.[x.cert.id]);
    const completed = items.filter(x => state.passes?.[x.cert.id]);
    const totalIndicative = completed.reduce((sum, x) => sum + x.value.contributionRange.midpoint, 0);
    const roleCounts = new Map();
    items.forEach(x => roleCounts.set(x.value.roleKey, (roleCounts.get(x.value.roleKey) || 0) + 1));
    const dominantRoleKey = [...roleCounts.entries()].sort((a,b) => b[1] - a[1])[0]?.[0] || 'cyberEngineer';
    return Object.freeze({
      completedCount: completed.length,
      remainingCount: available.length,
      indicativeSignalBuilt: totalIndicative,
      dominantRole: ROLE_BANDS[dominantRoleKey],
      topRemaining: available.sort((a,b) => b.value.contributionRange.midpoint - a.value.contributionRange.midpoint).slice(0, 10),
      disclaimer: SNAPSHOT.disclaimer
    });
  }

  CT.marketValue = Object.freeze({ SNAPSHOT, ROLE_BANDS, roleFor, contribution, portfolioSummary, money });
})(window);
