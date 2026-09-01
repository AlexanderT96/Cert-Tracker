import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
const errors=[];
const index=read('index.html');
const icons=read('src/professional-icons.js');
const typography=read('professional-typography.css');
const symbols=read('professional-symbols.css');
const overrides=read('professional-overrides.css');
const depth=read('professional-depth.css');
const renderer=read('src/renderer.js');
const icon=read('icon.svg');

function require(condition,message){if(!condition)errors.push(message);}

for(const asset of ['professional-overrides.css','professional-depth.css','professional-symbols.css','professional-typography.css','src/professional-icons.js'])require(index.includes(asset),`index.html is missing final presentation asset ${asset}`);
require(index.indexOf('professional-typography.css')>index.indexOf('professional-symbols.css'),'professional-typography.css must load after professional-symbols.css');
require(!/\.trimStart\s*\(|\.trimLeft\s*\(/.test(icons),'Professional symbol cleanup must not trim leading inline whitespace.');
require(icons.includes("const leading=/^\\s+/.test(before),trailing=/\\s+$/.test(before)"),'Inline whitespace preservation guard is missing.');
require(renderer.includes('<strong>🎯 Next up:</strong> ${escape(nxt.name)}'),'Next-up markup changed; re-audit spacing around the certification name.');
require(typography.includes('Segoe UI Variable'),'Professional variable-system font stack is missing.');
for(const selector of ['.dash-hero-next > strong','.cert-code','.badge + .badge'])require(typography.includes(selector),`Typography/spacing safeguard missing ${selector}.`);
for(const tier of ['bronze','silver','gold','platinum','diamond']){
  require(symbols.includes(`ct-credential-tier-${tier}`),`Missing professional ${tier} credential emblem styling.`);
  require(icons.includes(`'${tier}'`),`Professional icon adapter does not preserve ${tier} tier.`);
}
for(const badge of ['badge-prio-5','badge-prio-4','badge-prio-3','badge-prio-2','badge-prio-1','badge-gateway','badge-tier-S','badge-tier-A','badge-tier-B','badge-tier-C','badge-tier-D'])require(symbols.includes(badge),`Missing professional badge treatment for ${badge}.`);
for(const control of ['.cert-status-dot','.cert-expand-toggle','.drag-handle','.badge-next'])require(symbols.includes(control),`Missing professional replacement for ${control}.`);
for(const glyph of ['↩','⊘','⠿'])require(icons.includes(glyph),`Professional icon cleanup does not remove legacy control glyph ${glyph}.`);
const finalLayers=(symbols+typography+overrides+depth+icon).toLowerCase();
for(const forbidden of ['#ff7ad9','#c084fc','#9b8cff','#ff6ee0'])require(!finalLayers.includes(forbidden),`Legacy purple/sakura colour ${forbidden} remains in a final presentation layer.`);
require((icon.match(/data-stage=/g)||[]).length===5,'Application icon must encode all five progression stages.');
require(icon.includes('data-goal="true"'),'Application icon is missing its explicit goal marker.');
require(!/[\u{1F300}-\u{1FAFF}]/u.test(typography+symbols),'Professional CSS should not use decorative emoji.');

if(errors.length){console.error(`Formatting gate failed (${errors.length}):`);errors.forEach(e=>console.error(`- ${e}`));process.exit(1);}
console.log('Professional typography, spacing, tier-emblem, cert-control and application-icon checks passed.');
