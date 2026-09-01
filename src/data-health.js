// Cert Tracker v3.1 — provenance/freshness health for certification data.
(function initDataHealth(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before data-health.js');

  function normaliseVerifiedDate(value) {
    if (!value || typeof value !== 'string') return null;
    if (/^\d{4}-\d{2}$/.test(value)) return new Date(`${value}-15T12:00:00`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00`);
    return null;
  }

  function vendorSource(cert) {
    const vendor = cert?.vendor || '';
    if (CT.vendorSources[vendor]) return CT.vendorSources[vendor];
    const haystack = `${cert?.name || ''} ${cert?.coverage || ''}`.toLowerCase();
    for (const [name, url] of Object.entries(CT.vendorSources)) {
      if (haystack.includes(name.toLowerCase())) return url;
    }
    return null;
  }

  function record(cert) {
    const audited = CT.sourceRegistry?.[cert?.id] || null;
    const verifiedValue = audited?.verifiedAt || cert?.verifiedAt || null;
    const verified = normaliseVerifiedDate(verifiedValue);
    const ageDays = verified ? Math.max(0, Math.floor((Date.now() - verified.getTime()) / 86400000)) : null;
    const embeddedExactSource = cert?.sourceUrl || cert?.officialUrl || null;
    const fallbackSource = vendorSource(cert);
    const sourceUrl = audited?.url || embeddedExactSource || fallbackSource;
    const sourceLevel = audited?.level || (embeddedExactSource ? 'CERT' : fallbackSource ? 'VENDOR' : 'NONE');
    const provenance = audited ? 'AUDITED_REGISTRY' : embeddedExactSource ? 'CATALOGUE' : fallbackSource ? 'VENDOR_FALLBACK' : 'NONE';

    let freshness = 'UNKNOWN';
    if (ageDays != null) {
      freshness = ageDays <= CT.config.freshness.freshDays
        ? 'FRESH'
        : ageDays <= CT.config.freshness.reviewDays ? 'REVIEW' : 'STALE';
    }

    const priceVerified = normaliseVerifiedDate(cert?.priceCheckedAt || cert?.verifiedAt);
    const priceAgeDays = priceVerified ? Math.max(0, Math.floor((Date.now() - priceVerified.getTime()) / 86400000)) : null;
    const confidence = CT.util.clamp(
      100
      - (freshness === 'REVIEW' ? 15 : freshness === 'STALE' ? 35 : freshness === 'UNKNOWN' ? 45 : 0)
      - (sourceLevel === 'VENDOR' ? 10 : sourceLevel === 'NONE' ? 30 : 0)
      - (provenance === 'AUDITED_REGISTRY' && sourceLevel === 'CERT' ? 0 : 5)
      - (priceAgeDays != null && priceAgeDays > 365 ? 10 : 0),
      0,
      100
    );

    const issues = [];
    if (!verifiedValue) issues.push('No verification date');
    if (freshness === 'REVIEW') issues.push('Verification due for review');
    if (freshness === 'STALE') issues.push('Verification is stale');
    if (sourceLevel === 'NONE') issues.push('No official source');
    else if (sourceLevel === 'VENDOR') issues.push(audited ? 'Audited vendor-level source; cert-specific source still required' : 'Only vendor-level source mapped');
    if (!cert?.code) issues.push('No exam/cert code');
    if (cert?.costNum > 0 && priceAgeDays != null && priceAgeDays > 365) issues.push('Price may be stale');

    return Object.freeze({
      id: cert?.id,
      name: cert?.name,
      verifiedAt: verifiedValue,
      ageDays,
      freshness,
      sourceUrl,
      sourceLevel,
      provenance,
      sourceNote: audited?.note || null,
      priceAgeDays,
      confidence,
      issues: Object.freeze(issues)
    });
  }

  function allRecords() { return CERTS.map(record); }

  function summary() {
    const rows = allRecords();
    const count = status => rows.filter(row => row.freshness === status).length;
    const exactSources = rows.filter(row => row.sourceLevel === 'CERT').length;
    const auditedExactSources = rows.filter(row => row.sourceLevel === 'CERT' && row.provenance === 'AUDITED_REGISTRY').length;
    const vendorSources = rows.filter(row => row.sourceLevel === 'VENDOR').length;
    const missingSources = rows.filter(row => row.sourceLevel === 'NONE').length;
    const averageConfidence = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.confidence, 0) / rows.length) : 0;
    return Object.freeze({
      total: rows.length,
      fresh: count('FRESH'), review: count('REVIEW'), stale: count('STALE'), unknown: count('UNKNOWN'),
      exactSources, auditedExactSources, vendorSources, missingSources, averageConfidence,
      healthy: rows.filter(row => row.freshness === 'FRESH' && row.sourceLevel !== 'NONE').length
    });
  }

  function reviewQueue() {
    const order = { STALE: 0, UNKNOWN: 1, REVIEW: 2, FRESH: 3 };
    return allRecords().filter(row => row.issues.length).sort((a, b) => order[a.freshness] - order[b.freshness] || a.confidence - b.confidence || a.name.localeCompare(b.name));
  }

  function toCsv() {
    const esc = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [['id', 'name', 'verifiedAt', 'freshness', 'sourceLevel', 'provenance', 'sourceUrl', 'confidence', 'issues']];
    allRecords().forEach(row => rows.push([row.id, row.name, row.verifiedAt, row.freshness, row.sourceLevel, row.provenance, row.sourceUrl, row.confidence, row.issues.join('; ')]));
    return rows.map(row => row.map(esc).join(',')).join('\r\n');
  }

  function exportAudit() {
    const blob = new Blob([toCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cert-data-health-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  CT.dataHealth = Object.freeze({ record, allRecords, summary, reviewQueue, exportAudit, normaliseVerifiedDate });
})(window);
