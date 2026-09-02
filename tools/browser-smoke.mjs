import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';

const engine=process.argv[2]||'chromium';
const browserType={chromium,firefox,webkit}[engine];
assert.ok(browserType,'Unknown browser engine');
const browser=await browserType.launch({headless:true});
const errors=[];
async function open(options){
  const context=await browser.newContext(options),page=await context.newPage();
  page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
  page.on('pageerror',error=>{errors.push(error.message);console.error('Application error:',error.stack||error.message);});
  page.on('console',message=>{if(message.type()==='error'&&message.text().includes('[CertTracker] initial render failed'))errors.push(message.text());});
  await page.goto('http://localhost:4173/');
  console.log('Startup modules:',await page.evaluate(()=>({modules:Object.keys(window.CertTrackerV3||{}),alias:!!window.CertTracker})));
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
try{
  console.log(`${engine}: desktop first load`);
  const desktop=await open({viewport:{width:1280,height:900}});
  assert.equal(await desktop.page.locator('.tabs [data-workspace-tab]').count(),6);
  assert.equal(await desktop.page.locator('#ct-mobile-navigation').isVisible(),false);
  await desktop.page.screenshot({path:`/tmp/certtracker-${engine}-desktop.png`,animations:'disabled',timeout:30000});
  await desktop.context.close();

  console.log(`${engine}: phone first load`);
  const {context,page}=await open({viewport:{width:430,height:932},deviceScaleFactor:3,hasTouch:true,...(engine==='firefox'?{}:{isMobile:true})});
  await page.waitForFunction(()=>document.documentElement.dataset.layout==='mobile');
  await navigationInViewport(page);
  assert.equal(await page.locator('.tabs').isVisible(),false,'Desktop tabs must stay hidden on phones');
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundAttachment),'scroll');
  assert.equal(await page.locator('#ct-mobile-navigation').evaluate(el=>getComputedStyle(el).backdropFilter),'none');
  const transforms=await page.locator('.ct-depth-surface').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).transform));
  assert.ok(transforms.every(value=>value==='none'),'Phone panels must not use desktop 3D layers');
  for(const tab of ['learning','roadmap','certifications','dashboard']){
    console.log(`${engine}: mobile tab ${tab}`);
    await page.locator(`[data-mobile-tab="${tab}"]`).click();
    await page.waitForFunction(tab=>state.currentTab===tab,tab);
    assert.equal(await page.locator(`[data-mobile-tab="${tab}"]`).getAttribute('aria-current'),'page');
    await navigationInViewport(page);
  }
  console.log(`${engine}: scrolling and More menu`);
  await page.evaluate(()=>window.scrollTo(0,Math.min(1200,document.documentElement.scrollHeight-innerHeight)));
  await page.waitForFunction(()=>scrollY>200);
  await navigationInViewport(page);
  await page.locator('#ct-mobile-more-button').click();
  await page.locator('#ct-mobile-more-layer').waitFor({state:'visible'});
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
