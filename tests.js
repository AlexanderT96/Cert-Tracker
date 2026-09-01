(() => {
  const results = [];
  const test = (name, fn) => {
    try {
      const ok = !!fn();
      results.push({ name, ok, detail: ok ? '' : 'returned false' });
    } catch (err) {
      results.push({ name, ok: false, detail: err && err.message ? err.message : String(err) });
    }
  };

  test('My Path uses the real storage key', () => SK.myPath === 'ct2-mypath');
  test('CPE persistence handler exists', () => typeof save.cpe === 'function');
  test('Gate persistence handler exists', () => typeof save.gates === 'function');
  test('Certification data has no hard validation errors', () => window.CertTrackerStability.diagnostics.errors.length === 0);
  test('Certification IDs are unique', () => new Set(CERTS.map(c => c.id)).size === CERTS.length);
  test('All dependencies resolve', () => {
    const ids = new Set(CERTS.map(c => c.id));
    return CERTS.every(c => (c.deps || []).every(d => ids.has(d) && d !== c.id));
  });
  test('Local date stamp is ISO-shaped', () => /^\d{4}-\d{2}-\d{2}$/.test(window.CertTrackerStability.localDateStamp(new Date())));
  test('ICS date formatting is stable', () => window.CertTrackerStability.icsDate('2026-09-01') === '20260901');
  test('ICS escaping covers reserved characters', () => window.CertTrackerStability.icsEscape('a,b;c\\d\nx') === 'a\\,b\\;c\\\\d\\nx');
  test('Invalid expiry dates keep object return shape', () => {
    const probe = expiryInfo({ validity: 36 }, 'not-a-date');
    return probe && typeof probe === 'object' && probe.status === 'INVALID';
  });

  const list = document.getElementById('results');
  results.forEach(r => {
    const li = document.createElement('li');
    li.className = r.ok ? 'pass' : 'fail';
    li.textContent = `${r.ok ? 'PASS' : 'FAIL'} — ${r.name}${r.detail ? ` (${r.detail})` : ''}`;
    list.appendChild(li);
  });

  const failed = results.filter(r => !r.ok).length;
  const summary = document.getElementById('summary');
  summary.className = failed ? 'fail' : 'pass';
  summary.textContent = failed
    ? `${failed} of ${results.length} checks failed.`
    : `All ${results.length} checks passed.`;

  console.table(results);
})();
