import fs from 'node:fs';
import path from 'node:path';

const roots=['certs.js','README.md','src'];const files=[];
function collect(target){if(!fs.existsSync(target))return;const stat=fs.statSync(target);if(stat.isDirectory()){for(const name of fs.readdirSync(target))collect(path.join(target,name));return;}if(/\.(?:js|mjs|html|md|json|css)$/i.test(target))files.push(target);}
roots.forEach(collect);
const phraseRules=[
 ['personal employer context',/\bcurrent employer\b/i],['personal role context',/\byour current role\b/i],['personal manager context',/\byour technical director\b/i],['personal career background',/\bMSP background\b/i],['personal trajectory wording',/\byour trajectory\b/i],['personalised target wording',/\byour exact target(?:-role)?\b/i],['sensitive client-context claim',/\bdefence-adjacent client\b/i],['location-specific salary assumption',/\bNW median\b/i],['first-person employer reference',/\bmy (?:current )?employer\b/i],['first-person current-job reference',/\bmy current (?:job|role|workplace)\b/i],['first-person salary reference',/\bmy (?:current )?salary\b/i]
];
const identifierRules=[['email address',/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],['UK telephone number',/(?:\+44\s?\(?0?\)?|\b0)\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b/],['UK postcode',/(?<!#)\b(?:GIR 0AA|[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i]];
const findings=[];for(const file of files){const text=fs.readFileSync(file,'utf8');for(const[label,regex]of[...phraseRules,...identifierRules]){const match=text.match(regex);if(match)findings.push(`${file}: ${label} (${JSON.stringify(match[0])})`);}}
if(fs.existsSync('app.js'))findings.push('app.js: retired root-level renderer must not return.');
if(fs.existsSync('src/renderer.js')){const size=fs.statSync('src/renderer.js').size;const ceiling=290000;if(size>ceiling)findings.push(`src/renderer.js: architecture ceiling exceeded (${size} > ${ceiling} bytes)`);}
if(findings.length){console.error(`Privacy/architecture gate failed (${findings.length}):`);findings.forEach(x=>console.error(`- ${x}`));process.exit(1);}console.log(`Privacy/architecture gate passed across ${files.length} public content files.`);
