(async () => {
  const results = [];
  async function test(name, fn) {
    try {
      const value = await fn();
      const ok = value !== false;
      results.push({ name, status: ok ? 'PASS' : 'FAIL', detail: ok ? '' : 'returned false' });
    } catch (error) {
      results.push({ name, status: 'FAIL', detail: error?.message || String(error) });
    }
  }
  function skip(name, detail) { results.push({ name, status: 'SKIP', detail }); }

  await test('v3.1 namespace and versions load', () => window.CertTrackerV3?.version?.app === '3.1.0');
  await test('Curated path is a separate frozen module', () => Array.isArray(window.CERT_TRACKER_DEFAULT_PATH) && Object.isFrozen(window.CERT_TRACKER_DEFAULT_PATH) && window.CERT_TRACKER_DEFAULT_PATH.length > 20);
  await test('Default salary baseline contains no personal assumption', () => Number(state.currentSalary) === 0 || localStorage.getItem(SK.salary) != null);
  await test('My Path uses versioned storage key', () => SK.myPath === 'ct3-mypath');
  await test('CPE persistence handler exists', () => typeof save.cpe === 'function');
  await test('Gate persistence handler exists', () => typeof save.gates === 'function');
  await test('Certification schema has no hard errors', () => CertTrackerV3.validation.diagnostics.errors.length === 0);
  await test('Certification IDs are unique', () => new Set(CERTS.map(c => c.id)).size === CERTS.length);
  await test('Dependencies resolve', () => { const ids = new Set(CERTS.map(c => c.id)); return CERTS.every(c => (c.deps || []).every(dep => ids.has(dep) && dep !== c.id)); });
  await test('All gateway certifications have audited cert-level official sources', () => CERTS.filter(c => c.gateway).every(c => { const h = CertTrackerV3.dataHealth.record(c); return h.sourceLevel === 'CERT' && h.provenance === 'AUDITED_REGISTRY'; }));
  await test('Core pathway has audited source coverage', () => { const core = CERTS.filter(c => c.track === 'CORE'); const exact = core.filter(c => CertTrackerV3.dataHealth.record(c).sourceLevel === 'CERT').length; return exact >= core.length - 1; });
  await test('Local date stamp is ISO-shaped', () => /^\d{4}-\d{2}-\d{2}$/.test(CertTrackerV3.dates.localDateStamp(new Date())));
  await test('ICS date formatting is stable', () => CertTrackerV3.dates.icsDate('2026-09-01') === '20260901');
  await test('ICS escaping covers reserved characters', () => CertTrackerV3.exports.icsEscape('a,b;c\\d\nx') === 'a\\,b\\;c\\\\d\\nx');
  await test('All-day calendar event has exclusive DTEND', () => {
    const original = state.exams; const cert = CERTS[0]; state.exams = { [cert.id]: '2026-09-01' };
    try { const text = CertTrackerV3.exports.buildICS().content; return text.includes('DTSTART;VALUE=DATE:20260901') && text.includes('DTEND;VALUE=DATE:20260902'); }
    finally { state.exams = original; }
  });
  await test('Invalid expiry dates keep stable object shape', () => CertTrackerV3.dates.expiryInfo({ validity: 36 }, 'not-a-date').status === 'INVALID');
  await test('Current state passes backup validation', () => CertTrackerV3.storage.validateBackup(CertTrackerV3.storage.serializableState()).ok);
  await test('Malformed backups are rejected before restore', () => !CertTrackerV3.storage.validateBackup({ version: 3, passes: [] }).ok);
  await test('Phase engine returns a valid phase', () => Number.isInteger(CertTrackerV3.phases.currentPhase()) && CertTrackerV3.phases.currentPhase() >= 1 && CertTrackerV3.phases.currentPhase() <= 6);
  await test('Data health covers every certification', () => CertTrackerV3.dataHealth.allRecords().length === CERTS.length);
  await test('Data health confidence stays bounded', () => CertTrackerV3.dataHealth.allRecords().every(x => x.confidence >= 0 && x.confidence <= 100));
  await test('Market model returns ordered GBP ranges', () => CERTS.every(cert => { const v = CertTrackerV3.marketValue.contribution(cert); return v.contributionRange.low >= 0 && v.contributionRange.high >= v.contributionRange.low && v.marketBand.high >= v.marketBand.median && v.marketBand.median >= v.marketBand.low; }));
  await test('Market model explicitly disclaims salary guarantees', () => /no certificate guarantees/i.test(CertTrackerV3.marketValue.SNAPSHOT.disclaimer));
  await test('Recommendation engine returns sorted available work', () => { const rows = CertTrackerV3.recommendations.recommend({ limit: 10 }); return rows.every(x => x.available && x.marketValue) && rows.every((x, i) => i === 0 || rows[i - 1].score >= x.score); });
  await test('What-if goal scenarios do not mutate the selected goal', () => { const before = CertTrackerV3.recommendations.currentGoal(); const result = CertTrackerV3.recommendations.scenario('cyber'); return result.goal === 'cyber' && CertTrackerV3.recommendations.currentGoal() === before; });

  if (window.crypto?.subtle) {
    await test('Encrypted vault round-trips with AES-GCM', async () => { const snapshot = CertTrackerV3.storage.serializableState(); const envelope = await CertTrackerV3.sync.encryptPayload(snapshot, 'browser-test-passphrase'); const restored = await CertTrackerV3.sync.decryptPayload(envelope, 'browser-test-passphrase'); return restored.version === snapshot.version && JSON.stringify(restored.passes) === JSON.stringify(snapshot.passes); });
    await test('Encrypted vault rejects the wrong passphrase', async () => { const envelope = await CertTrackerV3.sync.encryptPayload(CertTrackerV3.storage.serializableState(), 'browser-test-passphrase'); try { await CertTrackerV3.sync.decryptPayload(envelope, 'definitely-wrong-passphrase'); return false; } catch { return true; } });
  } else skip('Encrypted vault round-trip', 'Web Crypto unavailable in this context');

  const list = document.getElementById('results');
  results.forEach(result => { const li = document.createElement('li'); li.className = result.status.toLowerCase(); li.textContent = `${result.status} — ${result.name}${result.detail ? ` (${result.detail})` : ''}`; list.appendChild(li); });
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const summary = document.getElementById('summary'); summary.className = failed ? 'fail' : 'pass';
  summary.textContent = failed ? `${failed} of ${results.length} checks failed.` : `All ${results.length - skipped} executed checks passed${skipped ? ` (${skipped} skipped)` : ''}.`;
  console.table(results);
})();
