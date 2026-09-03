import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';

const engine=process.argv[2]||'chromium';
const browserType={chromium,firefox,webkit}[engine];
assert.ok(browserType,'Unknown browser engine');
const browser=await browserType.launch({headless:true});
const errors=[];
async function open(options){
  const context=await browser.newContext({ignoreHTTPSErrors:true,...options}),page=await context.newPage();
  page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
  page.on('pageerror',error=>{errors.push(error.message);console.error('Application error:',error.stack||error.message);});
  page.on('console',message=>{if(message.type()==='error'&&message.text().includes('[CertTracker] initial render failed'))errors.push(message.text());});
  page.on('requestfailed',request=>console.error('Request failed:',request.url(),request.failure()?.errorText));
  await page.goto('https://localhost:4173/');
  await page.waitForFunction(()=>!!window.CertTracker?.workspaceShell);
  await page.locator('[data-market-dashboard]').waitFor();
  return{context,page};
}
async function navigationInViewport(page){
  const nav=page.locator('#ct-mobile-navigation');
  await nav.waitFor({state:'visible'});
  assert.equal(await nav.count(),1,'Mobile navigation must not duplicate');
  const box=await nav.boundingBox(),viewport=page.viewportSize();
  assert.ok(box&&box.y>=0&&box.y+box.height<=viewport.height+1,'Mobile navigation must remain inside the visible viewport');
  assert.equal(await nav.locator('button').count(),5,'Expected Dashboard, Learn, Map, Certs and More');
}
async function persistentHealth(page){
  const button=page.locator('.header .ct3-health');
  await button.waitFor({state:'visible'});
  assert.equal(await button.count(),1);
  assert.equal((await button.textContent()).trim(),'?');
  assert.equal(await button.getAttribute('aria-label'),'Data accuracy and verification');
  const bounds=await button.boundingBox();assert.ok(bounds.width<=45&&bounds.height<=45,'Health control stays compact');
  assert.equal(await button.evaluate(el=>el.closest('.header-sub')===null),true);
  const same=await page.evaluate(async()=>{
    const before=document.querySelector('.ct3-health');
    updateHeaderCount();updateHeaderCount();
    await new Promise(resolve=>setTimeout(resolve,300));
    return before===document.querySelector('.ct3-health')&&before.isConnected;
  });
  assert.equal(same,true,'Header updates must not remove or replace the data-health control');
  await button.waitFor({state:'visible'});
}
try{
  console.log(`${engine}: desktop first load`);
  // Deterministic routed refresh fixtures; the phone context below still exercises the service worker.
  const desktop=await open({viewport:{width:1280,height:900},serviceWorkers:'block'});
  await persistentHealth(desktop.page);
  await desktop.page.evaluate(()=>renderApp());
  await desktop.page.locator('[data-workspace-tab="strategy"]').waitFor();
  await persistentHealth(desktop.page);
  assert.equal(await desktop.page.locator('.tabs [data-workspace-tab]').count(),6);
  assert.equal(await desktop.page.locator('#ct-mobile-navigation').isVisible(),false);
  assert.equal(await desktop.page.locator('#ct-command-dock').isVisible(),false,'Retired tool dock must not be visible');
  const launcher=desktop.page.getByRole('button',{name:"Open Today's Recommendations",exact:true});
  assert.equal(await launcher.count(),1);await launcher.waitFor({state:'visible'});
  await launcher.click();
  const today=desktop.page.locator('[data-today-recommendations]');
  await today.waitFor();
  await desktop.page.waitForFunction(()=>document.querySelector('[data-today-market-status]')?.textContent.includes('Checked'));
  assert.ok((await today.textContent()).includes('Recommendations recalculated'));
  await today.locator('[data-act="refresh-today"]').click();
  await desktop.page.waitForFunction(()=>document.querySelector('[data-today-market-status]')?.textContent.includes('Checked'));
  await desktop.page.screenshot({path:`/tmp/certtracker-${engine}-recommendations.png`,animations:'disabled',timeout:30000});
  await today.locator('.ct3-close').click();
  assert.equal(await launcher.evaluate(el=>document.activeElement===el),true,'Closing recommendations restores launcher focus');
  await desktop.page.locator('.ct3-health').click();
  const dataHealth=desktop.page.locator('[data-cert-data-health]');
  await dataHealth.waitFor();
  const healthText=await dataHealth.textContent();
  assert.ok(healthText.includes('100%')&&healthText.includes('185/185 linked'));
  assert.ok(healthText.includes('115 cert-level')&&healthText.includes('70 vendor-level'));
  assert.ok(healthText.includes('Credential retired')&&healthText.includes('Credential in development'));
  assert.ok(healthText.includes('Not currently verified')&&healthText.includes('1100'));
  assert.equal(await dataHealth.locator('.ct3-health-table tbody tr').count(),6);
  assert.ok(healthText.includes('Unchecked does not mean incorrect'));
  const beforeChecks=await desktop.page.evaluate(async()=>({hash:await CertTrackerV3.sync.digest(CertTrackerV3.storage.serializableState()),facts:JSON.stringify(CERTS.map(c=>c.factChecks))}));
  let refreshRequests=0;
  await desktop.page.route('**/data/job-market.json?*',route=>{refreshRequests++;return route.fulfill({json:{status:'live',fetchedAt:new Date().toISOString(),jobs:[],providerStatus:['Test fixture']}});});
  await dataHealth.locator('#ct3-health-refresh').click();
  await desktop.page.waitForFunction(()=>document.querySelector('#ct3-health-refresh-status')?.textContent.includes('Checks run')&&!document.querySelector('#ct3-health-refresh').disabled);
  const refreshed=await dataHealth.locator('#ct3-health-refresh-status').textContent();
  assert.ok(refreshed.includes('Recent published market data')&&refreshed.includes('matches published metadata'));
  assert.ok(refreshed.includes('Catalogue structure:')&&refreshed.includes('Saved-data structure: valid')&&refreshed.includes('70 role assessments'));
  assert.equal(refreshRequests,1,'Manual check refreshes the feed once');
  assert.deepEqual(await desktop.page.evaluate(async()=>({hash:await CertTrackerV3.sync.digest(CertTrackerV3.storage.serializableState()),facts:JSON.stringify(CERTS.map(c=>c.factChecks))})),beforeChecks,'Checks must not mutate private state or verification records');
  await desktop.page.unroute('**/data/job-market.json?*');
  await desktop.page.route('**/data/job-market.json?*',route=>route.abort());
  await dataHealth.locator('#ct3-health-refresh').click();
  await desktop.page.waitForFunction(()=>document.querySelector('#ct3-health-refresh-status')?.textContent.includes('Unavailable / cached data')&&!document.querySelector('#ct3-health-refresh').disabled);
  await desktop.page.unroute('**/data/job-market.json?*');
  await desktop.page.getByRole('dialog',{name:'Certification data health'}).getByRole('button',{name:'Close',exact:true}).click();
  await desktop.page.screenshot({path:`/tmp/certtracker-${engine}-desktop.png`,animations:'disabled',timeout:30000});
  await desktop.page.locator('[data-workspace-tab="strategy"]').click();
  await desktop.page.locator('.career-explorer').waitFor();
  assert.equal(await desktop.page.locator('.ct-dual-brief').count(),0);
  await desktop.page.locator('[data-career-search]').fill('GIS');
  await desktop.page.waitForFunction(()=>{
    const shown=[...document.querySelectorAll('[data-shortlist]')].map(el=>el.dataset.shortlist);
    const expected=window.CertTrackerV3.careerOptions.options({search:'GIS'}).map(a=>a.role.id);
    return shown.length>0&&JSON.stringify(shown)===JSON.stringify(expected);
  });
  assert.ok(await desktop.page.locator('.career-card').count()>0);
  await desktop.page.locator('[data-shortlist]').first().click();
  await desktop.page.locator('[data-career-shortlist]').check();
  assert.equal(await desktop.page.locator('.career-card').count(),1);
  await desktop.page.locator('.career-card summary').click();
  await desktop.page.locator('[data-interest]').selectOption('100');
  await desktop.page.locator('[data-evidence]').first().selectOption('LAB');
  assert.ok(await desktop.page.evaluate(()=>Object.keys(state.customization.careerOptions.evidence).length===1));
  for(const tab of ['learning','roadmap','certifications','customize','dashboard']){await desktop.page.locator(`[data-workspace-tab="${tab}"]`).click();await desktop.page.waitForTimeout(150);assert.equal(await desktop.page.locator('.ct-dual-brief').count(),tab==='dashboard'?1:0);}
  await desktop.context.close();

  console.log(`${engine}: phone first load`);
  const {context,page}=await open({viewport:{width:430,height:932},deviceScaleFactor:3,hasTouch:true,...(engine==='firefox'?{}:{isMobile:true})});
  await page.waitForFunction(()=>document.documentElement.dataset.layout==='mobile');
  await persistentHealth(page);
  await navigationInViewport(page);
  assert.equal(await page.locator('.tabs').isVisible(),false,'Desktop tabs must stay hidden on phones');
  assert.equal(await page.locator('.header-title').evaluate(el=>getComputedStyle(el).textShadow),'none');
  assert.equal(await page.locator('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute('content'),'black','Standalone iOS must not request an overlay status bar');
  const headerEffects=await page.locator('.header').evaluate(el=>{const s=getComputedStyle(el);return {clip:s.clipPath,filter:s.filter,backdrop:s.backdropFilter,transform:s.transform,background:s.backgroundColor};});
  assert.deepEqual(headerEffects,{clip:'none',filter:'none',backdrop:'none',transform:'none',background:'rgb(6, 17, 23)'});
  assert.ok((await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundAttachment)).split(',').every(value=>value.trim()==='scroll'));
  assert.equal(await page.locator('#ct-mobile-navigation').evaluate(el=>getComputedStyle(el).backdropFilter),'none');
  const transforms=await page.locator('.ct-depth-surface').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).transform));
  assert.ok(transforms.every(value=>value==='none'),'Phone panels must not use desktop 3D layers');
  for(const tab of ['learning','roadmap','certifications','dashboard']){
    console.log(`${engine}: mobile tab ${tab}`);
    await page.locator(`[data-mobile-tab="${tab}"]`).click();
    await page.waitForFunction(tab=>state.currentTab===tab,tab);
    assert.equal(await page.locator(`[data-mobile-tab="${tab}"]`).getAttribute('aria-current'),'page');
    await navigationInViewport(page);
    await persistentHealth(page);
    if(tab==='roadmap'){
      const hero=page.locator('.ct-map-hero');
      const emblem=await hero.evaluate(el=>{const s=getComputedStyle(el,'::before');return{position:s.position,width:s.width,transform:s.transform};});
      assert.deepEqual(emblem,{position:'static',width:'64px',transform:'none'},'Mobile emblem must occupy layout space instead of overlaying text');
      await page.screenshot({path:`/tmp/certtracker-${engine}-${tab}-mobile.png`,animations:'disabled',timeout:30000});
    }
    assert.equal(await page.locator('.ct-dual-brief').count(),tab==='dashboard'?1:0);
  }
  console.log(`${engine}: scrolling and More menu`);
  await page.evaluate(()=>window.scrollTo(0,Math.min(1200,document.documentElement.scrollHeight-innerHeight)));
  await page.waitForFunction(()=>scrollY>200);
  await navigationInViewport(page);
  await page.locator('#ct-mobile-more-button').click();
  await page.locator('#ct-mobile-more-layer').waitFor({state:'visible'});
  await page.getByRole('button',{name:"Today's Recommendations",exact:true}).click();
  await page.locator('[data-today-recommendations]').waitFor();
  await page.locator('[data-today-recommendations] [data-act="health"]').click();
  await page.locator('[data-cert-data-health]').waitFor();
  assert.ok((await page.locator('[data-cert-data-health]').textContent()).includes('185/185 linked'));
  await page.getByRole('dialog',{name:'Certification data health'}).getByRole('button',{name:'Close',exact:true}).click();
  await page.locator('#ct-mobile-more-button').click();
  await page.getByRole('button',{name:"Today's Recommendations",exact:true}).click();
  await page.locator('[data-today-recommendations] .ct3-close').click();
  await page.locator('#ct-mobile-more-button').click();
  await page.locator('.ct-mobile-more-close').click();
  await page.locator('#ct-mobile-more-layer').waitFor({state:'hidden'});
  await page.locator('#ct-mobile-more-button').click();
  await page.locator('.ct-mobile-more-action').first().click();
  await page.waitForFunction(()=>state.currentTab==='strategy');
  await page.locator('[data-mobile-tab="dashboard"]').click();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`/tmp/certtracker-${engine}-mobile.png`,animations:'disabled',timeout:30000});
  console.log(`${engine}: phone reload`);
  await page.reload();await navigationInViewport(page);
  await context.close();
  assert.deepEqual(errors,[],'Application errors during browser smoke tests');
  console.log(`${engine}: desktop and phone startup, all primary tabs, scrolling, More and reload passed.`);
}finally{await browser.close();}
