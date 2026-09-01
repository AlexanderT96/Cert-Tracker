// Cert Tracker v3 — schema, dependency and data-contract validation.
(function initValidation(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before validation.js');

  const allowedTracks = new Set(CT.config.allowedTracks);

  function validateCertData(certs = CERTS) {
    const errors = [];
    const warnings = [];
    const ids = new Set();
    const byId = new Map();

    certs.forEach((cert, index) => {
      const label = cert?.id || `index ${index}`;
      if (!CT.util.isPlainObject(cert)) {
        errors.push(`Invalid certification record at ${index}.`);
        return;
      }
      if (!cert.id || typeof cert.id !== 'string') errors.push(`${label}: missing/invalid id.`);
      else if (ids.has(cert.id)) errors.push(`Duplicate certification id: ${cert.id}.`);
      else { ids.add(cert.id); byId.set(cert.id, cert); }

      if (!cert.name || typeof cert.name !== 'string') errors.push(`${label}: missing name.`);
      if (!Number.isInteger(cert.phase) || cert.phase < 1 || cert.phase > 6) errors.push(`${label}: invalid phase ${cert.phase}.`);
      if (!allowedTracks.has(cert.track)) errors.push(`${label}: invalid track ${cert.track}.`);
      if (!Array.isArray(cert.deps)) warnings.push(`${label}: deps should be an array.`);
      if (!Array.isArray(cert.hours) || cert.hours.length !== 2 || cert.hours.some(n => !Number.isFinite(Number(n)))) {
        warnings.push(`${label}: hours should be [min,max] numeric values.`);
      } else if (Number(cert.hours[0]) > Number(cert.hours[1])) {
        warnings.push(`${label}: minimum study hours exceed maximum.`);
      }
      if (cert.roi != null && (!Number.isFinite(Number(cert.roi)) || Number(cert.roi) < 0 || Number(cert.roi) > 10)) warnings.push(`${label}: ROI should be 0-10.`);
      if (cert.difficulty != null && (!Number.isFinite(Number(cert.difficulty)) || Number(cert.difficulty) < 0 || Number(cert.difficulty) > 10)) warnings.push(`${label}: difficulty should be 0-10.`);
      if (cert.verifiedAt && !/^\d{4}-\d{2}(?:-\d{2})?$/.test(cert.verifiedAt)) warnings.push(`${label}: verifiedAt should be YYYY-MM or YYYY-MM-DD.`);
      if (cert.sourceUrl && !/^https:\/\//i.test(cert.sourceUrl)) warnings.push(`${label}: sourceUrl should use HTTPS.`);
    });

    certs.forEach(cert => (cert?.deps || []).forEach(dep => {
      if (!ids.has(dep)) errors.push(`${cert.id}: missing dependency ${dep}.`);
      if (dep === cert.id) errors.push(`${cert.id}: self dependency.`);
    }));

    // Detect cycles; a dependency graph should remain a DAG.
    const visiting = new Set();
    const visited = new Set();
    function visit(id, trail = []) {
      if (visiting.has(id)) {
        errors.push(`Dependency cycle: ${[...trail, id].join(' -> ')}.`);
        return;
      }
      if (visited.has(id)) return;
      visiting.add(id);
      const cert = byId.get(id);
      (cert?.deps || []).forEach(dep => visit(dep, [...trail, id]));
      visiting.delete(id);
      visited.add(id);
    }
    ids.forEach(id => visit(id));

    return Object.freeze({
      ok: errors.length === 0,
      certCount: certs.length,
      errors: Object.freeze(errors),
      warnings: Object.freeze(warnings)
    });
  }

  const diagnostics = validateCertData();
  if (diagnostics.errors.length) console.error('[CertTracker] data validation errors', diagnostics.errors);
  if (diagnostics.warnings.length) console.warn('[CertTracker] data validation warnings', diagnostics.warnings);

  CT.validation = Object.freeze({ validateCertData, diagnostics });
})(window);
