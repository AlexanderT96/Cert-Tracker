import fs from 'node:fs';

const replacements = [
  [/p1-nwsg-doc/g, 'p1-env-doc'],
  [/current employer's/gi, "a representative organisation's"],
  [/current employer/gi, 'a representative organisation'],
  [/your current role/gi, 'relevant hands-on experience'],
  [/current role/gi, 'relevant hands-on experience'],
  [/your employer's/gi, "the relevant organisation's"],
  [/your employer/gi, 'the relevant organisation'],
  [/your technical director/gi, 'a technical lead'],
  [/technical director/gi, 'technical lead'],
  [/your trajectory/gi, 'the intended career progression'],
  [/your exact target-role theme/gi, 'the target-role theme'],
  [/your target-role theme/gi, 'the target-role theme'],
  [/your background/gi, 'prior experience'],
  [/MSP background/gi, 'prior infrastructure/support experience'],
  [/support-engineer background/gi, 'support/infrastructure experience'],
  [/your CV/gi, 'a CV'],
  [/your portfolio/gi, 'a portfolio'],
  [/your learning plan/gi, 'the learning plan'],
  [/your study plan/gi, 'the study plan'],
  [/your work/gi, 'relevant work'],
  [/your role/gi, 'the role'],
  [/your experience/gi, 'relevant experience'],
  [/your certs/gi, 'relevant certifications'],
  [/your certifications/gi, 'relevant certifications'],
  [/your manager/gi, 'a manager'],
  [/your senior colleague/gi, 'a senior colleague'],
  [/your current salary/gi, 'the optional salary baseline'],
  [/your salary/gi, 'the salary baseline'],
  [/your exact target/gi, 'the target'],
  [/for your trajectory/gi, 'for the intended progression'],
  [/for your path/gi, 'for the selected path'],
  [/for your use case/gi, 'for the selected use case'],
  [/for you\b/gi, 'for this path'],
  [/CNI \/ defence-adjacent client/gi, 'regulated or critical-infrastructure-style scenario'],
  [/defence-adjacent client/gi, 'regulated-industry scenario'],
  [/North-West/gi, 'UK-wide'],
  [/North West/gi, 'UK-wide'],
  [/Manchester chapter \(UK-wide\)/gi, 'UK chapter network'],
  [/Manchester chapter/gi, 'UK chapter network'],
  [/NW median £[\d,.]+k?/gi, 'UK market benchmark'],
  [/NW median [£\d,.k]+/gi, 'UK market benchmark'],
  [/\bNW median\b/gi, 'UK median'],
  [/current strength/gi, 'existing strength'],
  [/current-role/gi, 'role'],
  [/your natural exposure/gi, 'natural hands-on exposure'],
  [/your exact/gi, 'the exact'],
  [/your near-term/gi, 'the near-term'],
  [/your long-term/gi, 'the long-term'],
  [/your Phase/gi, 'the Phase'],
  [/your target/gi, 'the target'],
  [/your application/gi, 'the application'],
  [/your evidence/gi, 'the evidence'],
  [/your referees/gi, 'referees'],
  [/your referee/gi, 'a referee'],
  [/your technical knowledge/gi, 'the applicant’s technical knowledge'],
  [/your cyber/gi, 'cyber'],
  [/your security/gi, 'security'],
  [/your support/gi, 'support'],
  [/your infrastructure/gi, 'infrastructure'],
  [/your physical/gi, 'physical'],
  [/your cloud/gi, 'cloud'],
  [/your networking/gi, 'networking'],
  [/your architecture/gi, 'architecture'],
  [/your situation/gi, 'the situation'],
  [/your timeline/gi, 'the timeline'],
  [/your case/gi, 'the case'],
  [/your likely/gi, 'the likely'],
  [/your existing/gi, 'existing'],
  [/your prior/gi, 'prior'],
  [/your own/gi, 'a personal'],
  [/your first/gi, 'the first'],
  [/your next/gi, 'the next'],
  [/your best/gi, 'the best'],
  [/your strongest/gi, 'the strongest'],
  [/your biggest/gi, 'the biggest'],
  [/your main/gi, 'the main'],
  [/your current/gi, 'current'],
  [/\bcurrentSalary: 30000\b/g, 'currentSalary: 0'],
  [/editable baseline; real value stored only in this browser/g, 'optional baseline; any entered value stays only in this browser'],
  [/Default curated OT-Convergence technical-apex path/g, 'Default curated convergence-security technical path'],
  [/Physical foundation \(existing strength\)/g, 'Physical security foundation'],
  [/site mapping \+ build the camera-analytics pipeline \+ deliver per-customer web COP/g, 'site mapping + camera-analytics pipeline + web common-operating-picture delivery']
];

function sanitize(text) {
  for (const [pattern, replacement] of replacements) text = text.replace(pattern, replacement);
  return text.replace(/\s*[·|]\s*(?:UK-wide|North(?:-| )West)\s+(?:median|salary)[^·\n"]*/gi, '');
}

let certs = sanitize(fs.readFileSync('certs.js', 'utf8'));
fs.writeFileSync('certs.js', certs);

let app = sanitize(fs.readFileSync('app.js', 'utf8'));

// Move the curated path inventory out of the legacy renderer. The extraction is
// source-preserving: the exact array contents are relocated, not re-authored.
const pathMatch = app.match(/\n\s*const defaults = \[(.*?)\];\n\s*defaults\.forEach/s);
if (pathMatch) {
  const arrayBody = pathMatch[1];
  const module = `// Cert Tracker v3.1 — curated default path configuration.\n// Kept outside app.js so the legacy renderer no longer owns product strategy.\n(function initDefaultPath(global) {\n  'use strict';\n  global.CERT_TRACKER_DEFAULT_PATH = Object.freeze([${arrayBody}\n  ]);\n})(window);\n`;
  fs.mkdirSync('src', { recursive: true });
  fs.writeFileSync('src/path-defaults.js', module);
  app = app.replace(/\n\s*const defaults = \[(.*?)\];\n\s*defaults\.forEach/s, '\n    const defaults = window.CERT_TRACKER_DEFAULT_PATH || [];\n    defaults.forEach');
}

fs.writeFileSync('app.js', app);
console.log('Privacy sanitization and legacy path extraction complete.');
