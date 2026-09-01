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
  'src/config.js','src/dates.js','src/storage.js','src/validation.js','src/phase-engine.js',
  'src/data-health.js','src/recommendation-engine.js','src/exports.js','src/notifications.js',
  'src/sync.js','src/ux.js','src/bootstrap.js','tests.html','tests.js'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing required file: ${file}`);
}
if (fs.existsSync(path.join(root, 'stability.js'))) errors.push('stability.js should be retired in v3.');

const jsFiles = requiredFiles.filter(file => file.endsWith('.js') && fs.existsSync(path.join(root, file)));
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  } catch (error) {
    errors.push(`Syntax check failed: ${file}\n${error.stderr?.toString() || error.message}`);
  }
}

let certs = [];
try {
  const source = fs.readFileSync(path.join(root, 'certs.js'), 'utf8');
  const sandbox = { console, Date, Math, JSON, Object, Array, Set, Map, String, Number, Boolean, RegExp, Intl, URL };
  vm.createContext(sandbox);
  vm.runInContext(`${source}\n;globalThis.__CERTS__ = CERTS;`, sandbox, { filename: 'certs.js', timeout: 4000 });
  certs = sandbox.__CERTS__;
  if (!Array.isArray(certs)) errors.push('CERTS did not evaluate to an array.');
} catch (error) {
  errors.push(`Unable to evaluate certs.js for data tests: ${error.message}`);
}

if (Array.isArray(certs)) {
  const allowedTracks = new Set(['CORE','FOUNDATION','CONDITIONAL','OPTIONAL','ROLE-DRIVEN','POST-PLAN']);
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
  }
  for (const cert of certs) {
    for (const dep of cert?.deps || []) {
      if (!ids.has(dep)) errors.push(`${cert.id}: missing dependency ${dep}`);
      if (dep === cert.id) errors.push(`${cert.id}: self dependency`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(id, trail = []) {
    if (visiting.has(id)) { errors.push(`Dependency cycle: ${[...trail, id].join(' -> ')}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of byId.get(id)?.deps || []) visit(dep, [...trail, id]);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of ids) visit(id);

  const now = Date.now();
  const freshness = { fresh: 0, review: 0, stale: 0, unknown: 0 };
  for (const cert of certs) {
    if (!cert.verifiedAt) { freshness.unknown++; continue; }
    const raw = /^\d{4}-\d{2}$/.test(cert.verifiedAt) ? `${cert.verifiedAt}-15T12:00:00Z` : `${cert.verifiedAt}T12:00:00Z`;
    const age = (now - new Date(raw).getTime()) / 86400000;
    if (!Number.isFinite(age)) freshness.unknown++;
    else if (age <= 180) freshness.fresh++;
    else if (age <= 365) freshness.review++;
    else freshness.stale++;
  }
  console.log(`Certification data: ${certs.length} records — ${freshness.fresh} fresh, ${freshness.review} review, ${freshness.stale} stale, ${freshness.unknown} unknown.`);
  if (freshnessMode && (freshness.review || freshness.stale || freshness.unknown)) {
    console.log('Freshness review queue is non-empty. This scheduled check is informational; inspect the in-app Data Health view before updating certification facts.');
  }
}

try {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const expectedOrder = ['src/config.js','src/dates.js','src/storage.js','src/validation.js','src/phase-engine.js','src/data-health.js','src/recommendation-engine.js','src/exports.js','src/notifications.js','src/sync.js','src/ux.js','src/bootstrap.js'];
  let last = -1;
  for (const file of expectedOrder) {
    const at = index.indexOf(file);
    if (at < 0) errors.push(`index.html does not load ${file}`);
    else if (at < last) errors.push(`index.html loads ${file} out of order`);
    last = at;
  }
  if (index.includes('stability.js')) errors.push('index.html still references retired stability.js.');
} catch (error) {
  errors.push(`Unable to validate index.html: ${error.message}`);
}

try {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  for (const file of ['src/config.js','src/storage.js','src/recommendation-engine.js','src/sync.js','src/bootstrap.js']) {
    if (!sw.includes(file)) errors.push(`Service worker does not cache ${file}`);
  }
  if (!sw.includes('cert-tracker-assets-v3.0.0')) errors.push('Service worker cache version is not v3.0.0.');
  if (sw.includes('stability.js')) errors.push('Service worker still caches retired stability.js.');
} catch (error) {
  errors.push(`Unable to validate sw.js: ${error.message}`);
}

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
