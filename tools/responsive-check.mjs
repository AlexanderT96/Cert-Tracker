import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
const errors=[];
const index=read('index.html');
const css=read('responsive-layout.css');
const js=read('src/responsive-layout.js');
const sw=read('sw.js');

function require(condition,message){if(!condition)errors.push(message);}

for(const asset of ['responsive-layout.css','src/responsive-layout.js']){
  require(index.includes(asset),`index.html is missing responsive asset ${asset}`);
  require(sw.includes(`./${asset}`),`service worker is missing responsive asset ${asset}`);
}
require(index.indexOf('responsive-layout.css')>index.indexOf('mechanical-chassis.css'),'Responsive CSS must load after the mechanical chassis layer.');
require(js.includes("root.dataset.layout=mode"),'Responsive detector must expose data-layout on the root element.');
require(js.includes("'(pointer: coarse)'"),'Responsive detector must account for coarse/touch input.');
require(js.includes('visualViewport'),'Responsive detector must use visualViewport where available for mobile Safari accuracy.');
require(!/userAgent|navigator\.platform|navigator\.vendor/.test(js),'Responsive detection must not depend on brittle user-agent sniffing.');
for(const mode of ['mobile','tablet'])require(css.includes(`data-layout=\"${mode}\"`),`Missing ${mode} layout rules.`);
for(const token of ['safe-area-inset-top','safe-area-inset-bottom','touch-action:pan-x pan-y pinch-zoom','scroll-snap-type:x','font-size:16px'])require(css.includes(token),`Responsive CSS is missing required mobile behaviour: ${token}`);
require(css.includes('.ct-map-canvas{min-width:900px'),'Roadmap must remain a pan-able canvas on mobile rather than being crushed to viewport width.');
require(css.includes('.ct-command-dock'),'Responsive CSS must explicitly constrain the mobile command dock.');
require(css.includes('.dash-hero'),'Responsive CSS must explicitly recompose the dashboard hero.');

if(errors.length){console.error(`Responsive gate failed (${errors.length}):`);errors.forEach(e=>console.error(`- ${e}`));process.exit(1);}
console.log('Responsive device-layout checks passed.');
