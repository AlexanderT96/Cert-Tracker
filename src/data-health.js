// Cert Tracker v3.1 — provenance/freshness health for certification data.
(function initDataHealth(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before data-health.js');

  function normaliseVerifiedDate(value) {
    if (!value || typeof value !== 'string') return null;
    const day = /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    const parsed = new Date(`${day}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== day || parsed.getTime() > Date.now()) return null;
    return parsed;
  }


  function credentialRecord(cert){return global.CertTrackerV3.store?.state?.customization?.credentials?.[cert?.id]||{};}
  function availability(cert){const status=CT.sourceRegistry?.[cert?.id]?.credentialStatus||(['secot-plus'].includes(cert?.id)?'UNCONFIRMED':null);return {status,eligible:!['RETIRED','IN_DEVELOPMENT','UNCONFIRMED'].includes(status)};}
  function activeCredential(cert,passes=CT.store?.state?.passes||{}){
    if(!cert||!passes[cert.id])return false;const row=credentialRecord(cert);
    if(row.status==='PENDING'||row.status==='ASSOCIATE'||row.status==='EXPIRED')return false;
    if(cert.requiresAwardConfirmation&&row.status!=='ACTIVE')return false;
    const info=CT.dates?.expiryInfo(cert,passes[cert.id]);return !!info&&!['EXPIRED','INVALID','PENDING'].includes(info.status);
  }
  function eligibility(cert,passes=CT.store?.state?.passes||{}){
    const a=availability(cert),missing=(cert?.formalPrerequisites||[]).filter(id=>!passes[id]);
    return {...a,missing,eligible:a.eligible&&!missing.length,reason:!a.eligible?'Credential '+a.status.toLowerCase().replaceAll('_',' '):missing.length?'Formal prerequisite not recorded':'Check issuer booking requirements'};
  }
  CT.credentials=Object.freeze({record:credentialRecord,availability,active:activeCredential,eligibility});
  function vendorSource(cert) {
    const vendor = cert?.vendor || '';
    // Descriptions mention other vendors. Only an explicit issuer is safe.
    return CT.vendorSources[vendor] || null;
  }

  function record(cert) {
    const audited = CT.sourceRegistry?.[cert?.id] || null;
    const verifiedValue = cert?.verifiedAt || null;
    const verified = normaliseVerifiedDate(verifiedValue);
    const ageDays = verified ? Math.max(0, Math.floor((Date.now() - verified.getTime()) / 86400000)) : null;
    const embeddedExactSource = cert?.sourceUrl || cert?.officialUrl || null;
    const fallbackSource = vendorSource(cert);
    const sourceUrl = audited?.url || embeddedExactSource || fallbackSource;
    const sourceLevel = audited?.level || (embeddedExactSource ? 'CERT' : fallbackSource ? 'VENDOR' : 'NONE');
    const provenance = audited ? audited.sourceAudited === false ? 'EXPLICIT_MAPPING' : 'AUDITED_REGISTRY' : embeddedExactSource ? 'CATALOGUE' : fallbackSource ? 'VENDOR_FALLBACK' : 'NONE';
    const sourceCheckedAt = audited?.sourceCheckedAt || audited?.verifiedAt || null;
    const credentialStatus = availability(cert).status;

    let freshness = 'UNKNOWN';
    if (ageDays != null) {
      freshness = ageDays <= CT.config.freshness.freshDays
        ? 'FRESH'
        : ageDays <= CT.config.freshness.reviewDays ? 'REVIEW' : 'STALE';
    }

    const priceVerified = normaliseVerifiedDate(cert?.priceCheckedAt);
    const priceAgeDays = priceVerified ? Math.max(0, Math.floor((Date.now() - priceVerified.getTime()) / 86400000)) : null;
    const fields=['identity','availability','eligibility','blueprint','renewal','price'];
    const fieldChecks=Object.fromEntries(fields.map(key=>{const row=cert?.factChecks?.[key];const date=normaliseVerifiedDate(row?.checkedAt);return [key,!!(date&&row?.source&&Date.now()-date.getTime()<=180*86400000)];}));
    const verifiedFields=Object.values(fieldChecks).filter(Boolean).length;
    const confidence = Math.min(Math.round(verifiedFields/fields.length*100),CT.util.clamp(
      100
      - (freshness === 'REVIEW' ? 15 : freshness === 'STALE' ? 35 : freshness === 'UNKNOWN' ? 45 : 0)
      - (sourceLevel === 'VENDOR' ? 10 : sourceLevel === 'NONE' ? 30 : 0)
      - (provenance === 'AUDITED_REGISTRY' && sourceLevel === 'CERT' ? 0 : 5)
      - (priceAgeDays != null && priceAgeDays > 365 ? 10 : 0),
      0,
      100
    ));

    const issues = [];
    for(const field of fields)if(!fieldChecks[field])issues.push(`${field}: not independently verified recently`);
    if(!priceVerified)issues.push('Regional price not independently dated');
    if (!verified) issues.push(verifiedValue ? 'Invalid or future verification date' : 'No verification date');
    if (freshness === 'REVIEW') issues.push('Verification due for review');
    if (freshness === 'STALE') issues.push('Verification is stale');
    if (sourceLevel === 'NONE') issues.push('No official source');
    else if (sourceLevel === 'VENDOR') issues.push(audited ? 'Audited vendor-level source; cert-specific source still required' : 'Only vendor-level source mapped');
    if (!cert?.code) issues.push('No exam/cert code');
    if (credentialStatus === 'RETIRED') issues.push('Credential retired — not available to new candidates');
    if (credentialStatus === 'IN_DEVELOPMENT') issues.push('Credential in development — not confirmed bookable');
    if (credentialStatus === 'UNCONFIRMED') issues.push('Exact credential title/availability unconfirmed');
    if (audited?.sourceAudited === false) issues.push('Source details still require inspection');
    if (cert?.costNum > 0 && priceAgeDays != null && priceAgeDays > 365) issues.push('Price may be stale');

    return Object.freeze({
      fieldChecks,verifiedFields,totalFields:fields.length,
      id: cert?.id,
      name: cert?.name,
      verifiedAt: verifiedValue,
      ageDays,
      freshness,
      sourceUrl,
      sourceLevel,
      provenance,
      sourceNote: audited?.note || null,
      sourceCheckedAt,
      credentialStatus,
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
      verifiedFacts:rows.reduce((n,r)=>n+r.verifiedFields,0),totalFacts:rows.length*6,priceVerified:rows.filter(r=>r.fieldChecks.price).length,
      total: rows.length,
      fresh: count('FRESH'), review: count('REVIEW'), stale: count('STALE'), unknown: count('UNKNOWN'),
      exactSources, auditedExactSources, vendorSources, missingSources, averageConfidence,
      sourceCoverage: rows.length ? Math.round((rows.length - missingSources) / rows.length * 100) : 0,
      availabilityWarnings: rows.filter(row => row.credentialStatus).length,
      healthy: rows.filter(row => row.issues.length === 0).length
    });
  }

  function reviewQueue() {
    const order = { STALE: 0, UNKNOWN: 1, REVIEW: 2, FRESH: 3 };
    return allRecords().filter(row => row.issues.length).sort((a, b) => Number(!!b.credentialStatus) - Number(!!a.credentialStatus) || order[a.freshness] - order[b.freshness] || a.confidence - b.confidence || a.name.localeCompare(b.name));
  }

  function toCsv() {
    const esc = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [['id', 'name', 'verifiedAt', 'freshness', 'sourceLevel', 'provenance', 'sourceUrl', 'confidence', 'issues', 'sourceCheckedAt', 'credentialStatus', 'sourceNote']];
    allRecords().forEach(row => rows.push([row.id, row.name, row.verifiedAt, row.freshness, row.sourceLevel, row.provenance, row.sourceUrl, row.confidence, row.issues.join('; '), row.sourceCheckedAt, row.credentialStatus, row.sourceNote]));
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
