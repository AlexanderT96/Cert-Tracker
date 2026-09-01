import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const freshnessMode = process.argv.includes('--freshness');
const errors = [];
const warnings = [];

const requiredFiles = [
  'index.html','certs.js','app.js','styles.css','sw.js','manifest.json',
  'src/path-defaults.js','src/config.js','src/dates.js','src/storage.js','src/validation.js','src/phase-engine.js',
  'src/source-registry.js','src/data-health.js','src/market-value.js','src/recommendation-engine.js','src/exports.js','src/notifications.js',
  'src/sync.js','src/ux.js','src/market-value-ui.js','src/bootstrap.js','tests.html','tests.js','tools/privacy-check.mjs'
];
for (const file of requiredFiles) if (!fs.existsSync(path.join(root, file))) errors.push(`Missing required file: ${file}`);
if (fs.existsSync(path.join(root, 'stability.js'))) errors.push('stability.js should remain retired.');

const jsFiles = requiredFiles.filter(file => /\.(?:js|mjs)$/.test(file) && fs.existsSync(path.join(root, file)));
for (const file of jsFiles) {
  try { execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' }); }
  catch (error) { errors.push(`Syntax check failed: ${file}\n${error.stderr?.toString() || error.message}`); }
}

let certs = [];
try {
  const source = fs.readFileSync(path.join(root, 'certs.js'), 'utf8');
  const sandbox = { console, Date, Math, JSON, Object, Array, Set, Map, String, Number, Boolean, RegExp, Intl, URL };
  vm.createContext(sandbox);
  vm.runInContext(`${source}\n;globalThis.__CERTS__ = CERTS;`, sandbox, { filename: 'certs.js', timeout: 4000 });
  certs = sandbox.__CERTS__;
  if (!Array.isArray(certs)) errors.push('CERTS did not evaluate to an array.');
} catch (error) { errors.push(`Unable to evaluate certs.js for data tests: ${error.message}`); }

let sourceRegistry = {};
try {
  const source = fs.readFileSync(path.join(root, 'src/source-registry.js'), 'utf8');
  const sandbox = { window: { CertTrackerV3: {} }, Object };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'source-registry.js', timeout: 1000 });
  sourceRegistry = sandbox.window.CertTrackerV3.sourceRegistry || {};
} catch (error) { errors.push(`Unable to evaluate source registry: ${error.message}`); }

if (Array.isArray(certs)) {
  const allowedTracks = new Set(['CORE','FOUNDATION','CONDITIONAL','OPTIONAL','ROLE-DRIVEN','ARCHITECT','IDENTITY-SEC','POST-PLAN']);
  const ids = new Set();
  const byId = new Map();
  for (const [index, cert] of certs.entries()) {
    const label = cert?.id || `index ${index}`;
    if (!cert?.id) errors.push(`${label}: missing id`);
    else if (ids.has(cert.id)) errors.push(`Duplicate id: ${cert.id}`);
    else { ids.add(cert.id); byId.set(cert.id, cert); }
    if (!cert?.name) errors.push(`${label}: missing name`);
    if (!Number.isInteger(cert?.phase) || cert.phase < 1 || cert.phase > 6) errors.push(`${label}: invalid phase ${cert?.phase}`);
    if (!allowedTracks.has(cert?.track)) errors.push(`${label}: invalid track ${cert?.track}`);
    if (!Array.isArray(cert?.deps)) warnings.push(`${label}: deps is not an array`);
    if (!Array.isArray(cert?.hours) || cert.hours.length !== 2 || cert.hours.some(n => !Number.isFinite(Number(n)))) warnings.push(`${label}: invalid hours range`);
    if (cert?.verifiedAt && !/^\d{4}-\d{2}(?:-\d{2})?$/.test(cert.verifiedAt)) warnings.push(`${label}: malformed verifiedAt ${cert.verifiedAt}`);
    if (!Number.isFinite(Number(cert?.roi)) || Number(cert.roi) < 0 || Number(cert.roi) > 10) warnings.push(`${label}: ROI should be 0-10`);
    if (cert?.cvValue != null && (!Number.isFinite(Number(cert.cvValue)) || Number(cert.cvValue) < 0)) errors.push(`${label}: invalid £ career-value signal`);
  }
  for (const cert of certs) for (const dep of cert?.deps || []) {
    if (!ids.has(dep)) errors.push(`${cert.id}: missing dependency ${dep}`);
    if (dep === cert.id) errors.push(`${cert.id}: self dependency`);
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(id, trail = []) {
    if (visiting.has(id)) { errors.push(`Dependency cycle: ${[...trail, id].join(' -> ')}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of byId.get(id)?.deps || []) visit(dep, [...trail, id]);
    visiting.delete(id); visited.add(id);
  }
  for (const id of ids) visit(id);

  const gateways = certs.filter(cert => cert.gateway);
  for (const cert of gateways) {
    const source = sourceRegistry[cert.id];
    if (!source || source.level !== 'CERT' || !/^https:\/\//.test(source.url || '')) errors.push(`${cert.id}: gateway certification requires audited cert-level HTTPS provenance`);
  }
  const core = certs.filter(cert => cert.track === 'CORE');
  const auditedCore = core.filter(cert => sourceRegistry[cert.id]?.level === 'CERT');
  if (auditedCore.length < core.length - 1) errors.push(`Core provenance coverage too low: ${auditedCore.length}/${core.length} cert-level audited sources`);
  const explicitDebt = core.filter(cert => sourceRegistry[cert.id]?.level !== 'CERT').map(cert => cert.id);
  if (explicitDebt.length) console.log(`Core source debt (explicit): ${explicitDebt.join(', ')}`);

  const now = Date.now();
  const freshness = { fresh: 0, review: 0, stale: 0, unknown: 0 };
  for (const cert of certs) {
    const verifiedAt = sourceRegistry[cert.id]?.verifiedAt || cert.verifiedAt;
    if (!verifiedAt) { freshness.unknown++; continue; }
    const raw = /^\d{4}-\d{2}$/.test(verifiedAt) ? `${verifiedAt}-15T12:00:00Z` : `${verifiedAt}T12:00:00Z`;
    const age = (now - new Date(raw).getTime()) / 86400000;
    if (!Number.isFinite(age)) freshness.unknown++;
    else if (age <= 180) freshness.fresh++;
    else if (age <= 365) freshness.review++;
    else freshness.stale++;
  }
  console.log(`Certification data: ${certs.length} records — ${freshness.fresh} fresh, ${freshness.review} review, ${freshness.stale} stale, ${freshness.unknown} unknown.`);
  if (freshnessMode && (freshness.review || freshness.stale || freshness.unknown)) console.log('Freshness review queue is non-empty; inspect Data Health before changing certification facts.');
}

try {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const expectedOrder = ['certs.js','src/path-defaults.js','app.js','src/config.js','src/dates.js','src/storage.js','src/validation.js','src/phase-engine.js','src/source-registry.js','src/data-health.js','src/market-value.js','src/recommendation-engine.js','src/exports.js','src/notifications.js','src/sync.js','src/ux.js','src/market-value-ui.js','src/bootstrap.js'];
  let last = -1;
  for (const file of expectedOrder) {
    const at = index.indexOf(file);
    if (at < 0) errors.push(`index.html does not load ${file}`);
    else if (at < last) errors.push(`index.html loads ${file} out of order`);
    last = at;
  }
  if (index.includes('stability.js')) errors.push('index.html still references retired stability.js.');
} catch (error) { errors.push(`Unable to validate index.html: ${error.message}`); }

try {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  for (const file of ['src/path-defaults.js','src/config.js','src/storage.js','src/source-registry.js','src/market-value.js','src/recommendation-engine.js','src/sync.js','src/market-value-ui.js','src/bootstrap.js']) if (!sw.includes(file)) errors.push(`Service worker does not cache ${file}`);
  if (!sw.includes('cert-tracker-assets-v3.1.0')) errors.push('Service worker cache version is not v3.1.0.');
  if (sw.includes('stability.js')) errors.push('Service worker still caches retired stability.js.');
} catch (error) { errors.push(`Unable to validate sw.js: ${error.message}`); }

if (warnings.length) {
  console.warn(`\nWarnings (${warnings.length}):`);
  warnings.slice(0, 60).forEach(item => console.warn(`- ${item}`));
  if (warnings.length > 60) console.warn(`- …and ${warnings.length - 60} more`);
}
if (errors.length) {
  console.error(`\nQuality gate failed (${errors.length}):`);
  errors.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
console.log('\nCert Tracker quality gate passed.');
