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
  const button=page.locator('#ct-data-help');
  await button.waitFor({state:'visible'});
  assert.equal(await button.count(),1);
  assert.equal((await button.textContent()).trim(),'?');
  assert.equal(await button.getAttribute('aria-label'),'Data accuracy and verification');
  const bounds=await button.boundingBox();assert.ok(bounds.width<=45&&bounds.height<=45,'Health control stays compact');
  const icon=await button.locator('span').boundingBox();assert.equal(icon.width,22);assert.equal(icon.height,22);
  assert.ok(bounds.width>=44&&bounds.height>=44,'Small visual retains an accessible tap target');
  const title=await page.locator('.header-title').boundingBox();
  assert.ok(bounds.x>title.x+title.width&&Math.abs(bounds.y+bounds.height/2-(title.y+title.height/2))<=12,'Help aligns with the mobile title row');
  assert.equal(await button.evaluate(el=>getComputedStyle(el).position),'static');
  assert.equal(await button.evaluate(el=>el.parentElement===document.querySelector('.header>div:first-child')),true,'Help stays in the header title row across rerenders');
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
async function healthSpacing(page){
  const issues=await page.locator('.ct3-panel').evaluate(panel=>{
    const problems=[],audit=panel.querySelector('[data-full-audit]'),link=audit.querySelector('a.ct3-btn');
    const before=link.previousElementSibling.getBoundingClientRect(),button=link.getBoundingClientRect(),after=link.nextElementSibling.getBoundingClientRect();
    if(button.top-before.bottom<10||after.top-button.bottom<10)problems.push('Audit action overlaps or crowds neighbouring text');
    if(panel.scrollWidth>panel.clientWidth+1)problems.push('Dialog overflows horizontally');
    for(const el of panel.querySelectorAll('.ct3-btn'))if(el.getClientRects().length&&getComputedStyle(el).display==='inline')problems.push('Padded inline button');
    const tabs=panel.querySelector('[role=tablist]').getBoundingClientRect(),heading=audit.querySelector('h3').getBoundingClientRect();
    if(heading.top<tabs.bottom+8)problems.push('Tabs crowd section heading');
    return problems;
  });
  assert.deepEqual(issues,[],'Dialog spacing and overlap regression');
  await dialogControls(page);
}
async function dialogControls(page){
  const overlaps=await page.locator('.ct3-panel').evaluate(panel=>{
    const issues=[];
    for(const group of panel.querySelectorAll('.ct3-actions,.ct3-row,.ct3-head')){
      const children=[...group.children].filter(el=>el.getClientRects().length).map(el=>({text:el.textContent.slice(0,55),box:el.getBoundingClientRect()}));
      for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++){const a=children[i].box,b=children[j].box;if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)issues.push(children[i].text+' / '+children[j].text);}
    }
    return issues;
  });
  assert.deepEqual(overlaps,[],'Dialog actions, headings and rows must not overlap');
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
  await dialogControls(desktop.page);
  await desktop.page.waitForFunction(()=>document.querySelector('[data-today-market-status]')?.textContent.includes('Checked'));
  assert.ok((await today.textContent()).includes('Recommendations recalculated'));
  await today.locator('[data-act="refresh-today"]').click();
  await desktop.page.waitForFunction(()=>document.querySelector('[data-today-market-status]')?.textContent.includes('Checked'));
  await desktop.page.screenshot({path:`/tmp/certtracker-${engine}-recommendations.png`,animations:'disabled',timeout:30000});
  await today.locator('.ct3-close').click();
  assert.equal(await launcher.evaluate(el=>document.activeElement===el),true,'Closing recommendations restores launcher focus');
  await desktop.page.route('**/data/tracker-audit.json?*',route=>route.fulfill({json:{schemaVersion:1,completedAt:new Date().toISOString(),status:'partial',summary:{certifications:185,roles:70,sources:2839,checked:100,changed:2,newBaselines:98,broken:1,unavailable:1,blocked:1,discoveryLinks:2686,manualReview:0,identityMatches:10,fieldsRequiringReview:1100},sources:[{url:'https://example.com/cert',refs:['cert:test'],status:'checked',changed:true}],facts:[{name:'Example credential',fields:{identity:{status:'source-match'},price:{status:'needs-review'}}}]}}));
  await desktop.page.locator('.ct3-health').click();
  const dataHealth=desktop.page.locator('[data-cert-data-health]');
  await dataHealth.waitFor();
  const healthText=await dataHealth.textContent();
  assert.ok(healthText.includes('100%')&&healthText.includes('187/187 linked'));
  assert.ok(healthText.includes('117 cert-level')&&healthText.includes('70 vendor-level'));
  assert.ok(healthText.includes('Credential retired')&&healthText.includes('Credential in development'));
  assert.ok(healthText.includes('Not currently verified')&&healthText.includes('1100'));
  assert.equal(await dataHealth.locator('.ct3-health-table tbody tr').count(),6);
  assert.ok(healthText.includes('Unchecked does not mean incorrect'));
  await desktop.page.waitForFunction(()=>document.querySelector('[data-full-audit-results]')?.textContent.includes('Pages retrieved'));
  for(const width of [320,390,768,1280]){await desktop.page.setViewportSize({width,height:900});await healthSpacing(desktop.page);}
  assert.ok((await dataHealth.locator('[data-full-audit-results]').textContent()).includes('Changed pages'));
  const connectionsTab=desktop.page.getByRole('tab',{name:'Account Connections',exact:true});
  await connectionsTab.click();
  const connections=desktop.page.locator('#ct3-connections-panel');
  assert.equal(await connections.isVisible(),true);
  await dialogControls(desktop.page);
  assert.equal(await dataHealth.isVisible(),false);
  assert.equal(await connections.locator('input').count(),0,'No credential fields in public tracker');
  assert.ok((await connections.textContent()).includes('not an OAuth connection'));
  assert.equal(await connections.getByRole('link',{name:'Secure setup on GitHub ↗'}).getAttribute('href'),'https://github.com/AlexanderT96/Cert-Tracker-Public/settings/secrets/actions');
  await connectionsTab.press('ArrowLeft');
  assert.equal(await dataHealth.isVisible(),true);
  assert.equal(await connections.isVisible(),false);
  const beforeChecks=await desktop.page.evaluate(async()=>({hash:await CertTrackerV3.sync.digest(CertTrackerV3.storage.serializableState()),facts:JSON.stringify(CERTS.map(c=>c.factChecks))}));
  let refreshRequests=0;
  await desktop.page.route('**/data/job-market.json?*',route=>{refreshRequests++;return route.fulfill({json:{status:'live',fetchedAt:new Date().toISOString(),jobs:[],providerStatus:['Test fixture']}});});
  await dataHealth.locator('#ct3-health-refresh').click();
  await desktop.page.waitForFunction(()=>document.querySelector('#ct3-health-refresh-status')?.textContent.includes('Checks run')&&!document.querySelector('#ct3-health-refresh').disabled);
  const refreshed=await dataHealth.locator('#ct3-health-refresh-status').textContent();
  assert.ok(refreshed.includes('Recent published market data')&&refreshed.includes('matches published metadata'));
  assert.ok(refreshed.includes('Catalogue structure:')&&refreshed.includes('Saved-data structure: valid')&&refreshed.includes('70 role assessments'));
  assert.equal(refreshRequests,1,'Manual check refreshes the feed once');
  await connectionsTab.click();
  await connections.locator('#ct3-connections-check').click();
  await desktop.page.waitForFunction(()=>document.querySelector('[data-connection-market-status]')?.textContent.includes('Recent successful provider snapshot'));
  assert.ok((await connections.locator('[data-connection-market-status]').textContent()).includes('not your account sign-in status'));
  await desktop.page.getByRole('tab',{name:'Accuracy & checks',exact:true}).click();
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
      const filters=page.locator('.ct-map-filter-disclosure'),summary=filters.locator('summary');
      assert.equal(await filters.evaluate(el=>el.open),false,'Map filters start collapsed on phones');
      const selected=await page.evaluate(()=>state.filter);
      await summary.click();assert.equal(await filters.locator('[data-map-filter]').isVisible(),true);
      await page.evaluate(()=>rerenderCurrentTab());
      assert.equal(await filters.evaluate(el=>el.open),true,'Map filter expansion survives rerender');
      await summary.focus();await summary.press('Enter');
      assert.equal(await filters.locator('[data-map-filter]').isVisible(),false);
      assert.equal(await page.evaluate(()=>state.filter),selected,'Collapsing map controls preserves path');
      await page.reload();await page.locator('[data-mobile-tab="roadmap"]').click();
      assert.equal(await filters.evaluate(el=>el.open),false,'Map collapse survives reload');
      const hero=page.locator('.ct-map-hero');
      const emblem=await hero.evaluate(el=>{const s=getComputedStyle(el,'::before');return{position:s.position,width:s.width,transform:s.transform};});
      assert.deepEqual(emblem,{position:'static',width:'64px',transform:'none'},'Mobile emblem must occupy layout space instead of overlaying text');
      await page.screenshot({path:`/tmp/certtracker-${engine}-${tab}-mobile.png`,animations:'disabled',timeout:30000});
    }
    if(tab==='certifications'){
      const disclosure=page.locator('.cert-filter-disclosure'),summary=disclosure.locator('summary');
      assert.equal(await disclosure.getAttribute('open'),null,'Phone filters default collapsed');
      assert.equal(await disclosure.locator('.cert-filter-bar').isVisible(),false);
      const filter=await page.evaluate(()=>state.filter);
      await summary.click();await disclosure.locator('.cert-filter-bar').waitFor({state:'visible'});
      await page.evaluate(()=>rerenderCurrentTab());
      assert.equal(await disclosure.evaluate(el=>el.open),true,'Expansion survives rerenders');
      await summary.focus();await summary.press('Enter');
      await page.waitForFunction(()=>localStorage.getItem('ct-cert-filters-expanded')==='false');
      assert.equal(await disclosure.locator('.cert-filter-bar').isVisible(),false);
      assert.equal(await page.evaluate(()=>state.filter),filter,'Collapsing does not clear selection');
      await page.reload();await page.locator('[data-mobile-tab="certifications"]').click();
      assert.equal(await disclosure.evaluate(el=>el.open),false,'Collapsed preference survives reload');
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
  await healthSpacing(page);
  await page.screenshot({path:`/tmp/certtracker-${engine}-health-mobile.png`,animations:'disabled',timeout:30000});
  assert.ok((await page.locator('[data-cert-data-health]').textContent()).includes('187/187 linked'));
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
  const focused=await open({viewport:{width:390,height:844}});
  await focused.page.evaluate(()=>{
    state.myPath={ccna:true};state.passes=Object.fromEntries(['a-plus','network-plus','mcit','mcde','arcules-csp'].map(id=>[id,'2026-01-01']));
    state.notes={ccna:{text:'Preserve route adoption note'}};CertTrackerV3.storage.persistAll();renderApp();
  });
  await focused.page.getByRole('button',{name:'Apply focused route',exact:true}).click();
  assert.ok((await focused.page.locator('[data-focused-route]').textContent()).includes('5 recorded complete'));
  assert.equal(await focused.page.evaluate(()=>CertTrackerV3.recommendations.recommend()[0].id),'mcie');
  await focused.page.reload();await navigationInViewport(focused.page);
  assert.equal(await focused.page.evaluate(()=>Object.keys(state.myPath).length),25);
  assert.equal(await focused.page.evaluate(()=>state.notes.ccna.text),'Preserve route adoption note');
  await focused.page.locator('[data-focused-route] summary').click();
  assert.equal(await focused.page.locator('[data-focused-route] li').count(),25);
  await focused.page.evaluate(()=>{
    state.myPath=Object.fromEntries(CertTrackerV3.focusedRoute.definition.previousIds.map(id=>[id,true]));
    CertTrackerV3.storage.persistAll();
  });
  await focused.page.reload();await navigationInViewport(focused.page);
  assert.equal(await focused.page.evaluate(()=>Object.keys(state.myPath).length),25,'Previous focused route upgrades without removing milestones');
  assert.equal(await focused.page.evaluate(()=>state.notes.ccna.text),'Preserve route adoption note');
  assert.ok(await focused.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Focused route must not overflow mobile');
  await focused.page.locator('[data-mobile-tab="learning"]').click();
  assert.ok(!(await focused.page.locator('#tab-content').textContent()).includes('OT + convergence engineering'));
  for(const width of [320,390,768,1280]){
    await focused.page.setViewportSize({width,height:900});
    await focused.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.ok(await focused.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Learning layout fits ${width}px`);
    assert.ok(await focused.page.locator('.ct-learning-phase-head').evaluateAll(heads=>heads.every(head=>{
      const title=head.firstElementChild.getBoundingClientRect(),counter=head.lastElementChild.getBoundingClientRect();
      return Math.min(title.right,counter.right)-Math.max(title.left,counter.left)<=1||Math.min(title.bottom,counter.bottom)-Math.max(title.top,counter.top)<=1;
    })),`Phase headings and counters do not overlap at ${width}px`);
  }
  await focused.page.setViewportSize({width:390,height:844});
  await navigationInViewport(focused.page);
  await focused.page.locator('[data-mobile-tab="roadmap"]').click();
  assert.ok(!(await focused.page.locator('#tab-content').textContent()).includes('Principal / professional capstone'));
  await focused.context.close();
  assert.deepEqual(errors,[],'Application errors during browser smoke tests');
  console.log(`${engine}: desktop and phone startup, all primary tabs, scrolling, More and reload passed.`);
}finally{await browser.close();}
