import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const errors=[];
const require=(condition,message)=>{if(!condition)errors.push(message);};

const index=read('index.html');
const compatJs=read('src/browser-compat.js');
const compatCss=read('browser-compat.css');
const responsive=read('src/responsive-layout.js');
const responsiveCss=read('responsive-layout.css');
const sw=read('sw.js');

for(const file of ['src/browser-compat.js','browser-compat.css','src/responsive-layout.js','responsive-layout.css'])require(index.includes(file),`index.html is missing ${file}.`);
require(index.indexOf('src/browser-compat.js')<index.indexOf('certs.js'),'Browser compatibility layer must load before application code.');
require(index.indexOf('browser-compat.css')>index.indexOf('mechanical-chassis.css'),'Compatibility CSS must load after the primary mechanical theme.');
for(const capability of ['colorMix','clipPath','backdropFilter','dvh','sticky','grid','webCrypto','serviceWorker','visualViewport'])require(compatJs.includes(capability),`Capability detection is missing ${capability}.`);
for(const fallback of ['ct-no-color-mix','ct-no-clip-path','ct-no-backdrop-filter','ct-no-sticky','ct-no-grid'])require(compatCss.includes(fallback),`CSS fallback is missing ${fallback}.`);
require(compatCss.includes('-webkit-backdrop-filter'),'Safari/WebKit backdrop-filter prefix is missing.');
require(compatCss.includes('@media(forced-colors:active)'),'Windows forced-colours fallback is missing.');
require(responsive.includes('visualViewport'),'Responsive detector must account for visualViewport.');
require(responsive.includes('(pointer: coarse)'),'Responsive detector must account for coarse pointers.');
require(responsiveCss.includes('env(safe-area-inset'),'iOS safe-area handling is missing.');
require(responsiveCss.includes('touch-action:pan-x pan-y')||read('roadmap-map.css').includes('touch-action:pan-x pan-y'),'Touch roadmap panning is missing.');
for(const cached of ['browser-compat.css','src/browser-compat.js','src/security-hardening.js','responsive-layout.css','src/responsive-layout.js'])require(sw.includes(cached),`Service worker must cache ${cached}.`);

if(errors.length){console.error(`Browser compatibility gate failed (${errors.length}):`);errors.forEach(e=>console.error(`- ${e}`));process.exit(1);}
console.log('Browser compatibility checks passed for the supported major-engine contract.');
