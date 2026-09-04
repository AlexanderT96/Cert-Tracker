import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// A minimal mutation-observing DOM exercises the actual adapters without a browser dependency.
// The real-engine smoke jobs still test the complete application independently.
function fixture({loadFeed}={}){
  const jobs=[],observers=[],ready=[],events=new Map();let writes=0,low=30000,loadCount=0;
  class Element{
    constructor(kind='div',html=''){this.kind=kind;this.html=html;this.children=[];this.parent=null;this.listeners=new Map();this.dataset={};this.textContent='Refresh view';}
    get isConnected(){return this===body||!!this.parent?.isConnected;}
    get firstElementChild(){return this.children[0]||null;}
    set innerHTML(html){this.children=[new Element(html.includes('data-dual-pathway=')?'brief':html.includes('data-market-dashboard')?'market':'div',html)];this.children[0].parent=this;}
    querySelector(selector){
      if(selector==='[data-market-refresh]'&&this.kind==='market'){if(!this.button){this.button=new Element('button');this.button.parent=this;}return this.button;}
      return this.querySelectorAll(selector)[0]||null;
    }
    querySelectorAll(selector){const kind=selector.includes('.ct-dual-brief')?'brief':selector==='[data-market-dashboard]'?'market':null;return kind?this.children.filter(n=>n.kind===kind):[];}
    prepend(node){node.parent=this;this.children.unshift(node);changed(this);}
    appendChild(node){node.parent=this;this.children.push(node);changed(this);return node;}
    remove(){if(!this.parent)return;const p=this.parent;p.children=p.children.filter(n=>n!==this);this.parent=null;changed(p);}
    replaceWith(node){const p=this.parent;assert.ok(p);node.parent=p;p.children[p.children.indexOf(this)]=node;this.parent=null;changed(p);}
    insertAdjacentElement(position,node){assert.equal(position,'afterend');const p=this.parent;node.parent=p;p.children.splice(p.children.indexOf(this)+1,0,node);changed(p);}
    insertAdjacentHTML(position,html){const host=new Element();host.innerHTML=html;if(position==='afterbegin')this.prepend(host.firstElementChild);else this.insertAdjacentElement(position,host.firstElementChild);}
    addEventListener(name,callback){this.listeners.set(name,callback);}
  }
  const body=new Element('body'),app=new Element('app');app.parent=body;body.children=[app];
  let content=new Element('content');content.parent=app;app.children=[content];
  function changed(target){
    if(!target.isConnected)return;writes++;
    for(const observer of observers){
      let node=target;while(node&&node!==observer.target)node=node.parent;
      if(!node||observer.pending)continue;
      observer.pending=true;jobs.push(()=>{observer.pending=false;observer.callback([{addedNodes:[]}]);});
    }
  }
  const profile={id:'my-path',label:'Example pathway',topCerts:[],spec:{mission:'Mission',marketOutcome:'Market',capabilityOutcome:'Capability'},metrics:{market:6,knowledge:7,weakerPillar:6,deepSubjects:2},responsibilities:[],evidence:[],roleReadinessRule:'Evidence required',sequenceRule:'Balanced sequencing'};
  const feed={status:'ready',jobs:[],provider:'Fixture',fetchedAt:'2026-09-02T00:00:00Z'};
  const CT={
    util:{escapeHtml:value=>String(value??'')},
    dualPillarDepth:{filterItems:()=>[{id:'my-path'}],pathwayProfile:()=>profile},
    marketReadiness:{money:value=>String(value),currentValue:()=>({low,high:50000,roles:[],applyNow:[],stretch:[],next:[]}),activeAssessment:()=>null},
    jobMarket:{load:options=>{loadCount++;return loadFeed?loadFeed(options):Promise.resolve(feed);},liveBand:()=>null,summary:()=>({bestFit:[]})}
  };
  const document={body,head:new Element('head'),readyState:'loading',createElement:()=>new Element(),querySelector:()=>null,querySelectorAll:()=>[],getElementById:id=>id==='app'?app:id==='tab-content'?content:id.endsWith('-style')?{}:null,addEventListener:(name,callback)=>{if(name==='DOMContentLoaded')ready.push(callback);}};
  const sandbox={console,document,CertTrackerV3:CT,CERTS:[],state:{currentTab:'dashboard',filter:'my-path',passes:{}},queueMicrotask:callback=>jobs.push(callback),MutationObserver:class{constructor(callback){this.callback=callback;}observe(target){this.target=target;observers.push(this);}},addEventListener:(name,callback)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(callback);}};
  sandbox.window=sandbox;vm.createContext(sandbox);
  for(const file of ['src/dual-pillar-ui.js','src/market-dashboard-ui.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
  async function settle(){let work=0,idle=0;while(idle<8){await Promise.resolve();if(jobs.length){assert.ok(++work<100,'UI observers did not settle: adapters are rewriting their own DOM');jobs.shift()();idle=0;}else idle++;}}
  return {CT,profile,feed,state:sandbox.state,ready:()=>ready.forEach(fn=>fn()),settle,get content(){return content;},get writes(){return writes;},get loadCount(){return loadCount;},decorate:node=>node.appendChild(new Element('badge')),changeData:()=>{profile.metrics.market++;low+=1000;feed.provider='Updated fixture';(events.get('certtracker:goal-changed')||[]).forEach(fn=>fn());},replaceContent:()=>{const old=content;content=new Element('content');old.replaceWith(content);return old;}};
}

const page=fixture();page.ready();await page.settle();
const brief=page.content.querySelector('.ct-dual-brief'),market=page.content.querySelector('[data-market-dashboard]');
assert.ok(brief&&market,'Both dashboard adapters must mount');
assert.equal(page.content.children.length,2,'Only one copy of each panel may exist');
const initialWrites=page.writes;
let recalculations=0;const currentValue=page.CT.marketReadiness.currentValue;
page.CT.marketReadiness.currentValue=()=>{recalculations++;return currentValue();};
page.CT.dualPillarUI.mount();await page.CT.marketDashboardUI.mount();await page.settle();
assert.equal(page.writes,initialWrites,'Unchanged mounts must not mutate the DOM');
page.decorate(brief);page.decorate(market);await page.settle();
assert.equal(page.content.querySelector('.ct-dual-brief'),brief,'Decoration must not recreate the pathway');
assert.equal(page.content.querySelector('[data-market-dashboard]'),market,'Decoration must preserve market controls and role badges');
assert.equal(recalculations,0,'Unchanged DOM notifications must not recalculate market readiness');
page.changeData();await page.settle();
assert.ok(recalculations>0,'State/context changes must invalidate readiness input caching');
assert.notEqual(page.content.querySelector('.ct-dual-brief'),brief,'Changed pathway data must render');
assert.notEqual(page.content.querySelector('[data-market-dashboard]'),market,'Changed market data must render');
assert.equal(page.content.children.length,2,'Data refresh must not duplicate panels');
const button=page.content.querySelector('[data-market-dashboard]').querySelector('[data-market-refresh]'),loads=page.loadCount;
await button.listeners.get('click')({currentTarget:button});await page.settle();
assert.equal(page.loadCount,loads+1,'Manual refresh must fetch once, not twice');
assert.equal(button.disabled,false,'An unchanged refresh must re-enable its actual button');

let resolve;
const delayed=fixture({loadFeed:()=>new Promise(r=>{resolve=r;})});
const pending=delayed.CT.marketDashboardUI.mount(),initial=delayed.content.querySelector('[data-market-dashboard]');
assert.ok(initial,'Local dashboard must render before the feed resolves');
const old=delayed.replaceContent();
resolve(delayed.feed);await pending;
assert.equal(old.querySelector('[data-market-dashboard]'),initial,'A late feed must not mutate a detached workspace');
await delayed.settle();
assert.equal(delayed.content.querySelectorAll('[data-market-dashboard]').length,1);
// Navigation ordering must settle too: moving every tab to the end on every
// observer callback leaves the same order but generates another full DOM update.
{
  const keys=['dashboard','learning','roadmap','certifications','strategy','customize'];
  let writes=0;
  const nav={children:keys.map(key=>({dataset:{workspaceTab:key,ctWorkspace:key},textContent:key,style:{}})),
    querySelector(selector){return this.children.find(b=>selector.includes(`"${b.dataset.workspaceTab}"`))||null;},
    querySelectorAll(){return this.children;},
    get lastElementChild(){return this.children.at(-1);},
    appendChild(button){this.children=this.children.filter(b=>b!==button);this.children.push(button);writes++;},
    insertBefore(button,next){this.children=this.children.filter(b=>b!==button);this.children.splice(next?this.children.indexOf(next):this.children.length,0,button);writes++;}
  };
  const CT={store:{}},state={customization:{}};
  const document={readyState:'loading',addEventListener(){},querySelector:selector=>selector==='.tabs'?nav:null};
  const sandbox={CertTrackerV3:CT,state,document};sandbox.window=sandbox;
  vm.runInNewContext(fs.readFileSync('src/personalization.js','utf8'),sandbox);
  CT.personalization.applyNavigation();writes=0;
  CT.personalization.applyNavigation();assert.equal(writes,0,'Already ordered tabs must not mutate the DOM');
  state.customization.tabOrder=[...keys].reverse();CT.personalization.applyNavigation();
  assert.deepEqual(nav.children.map(b=>b.dataset.workspaceTab),[...keys].reverse());
  writes=0;CT.personalization.applyNavigation();assert.equal(writes,0,'Custom tab order must also settle');
}
console.log('UI lifecycle gate passed: panel and navigation observers settle, updates render, refresh fetches once and stale workspaces stay untouched.');

// Notification decoration observes the same subtree it updates. Its count must
// therefore be idempotent or each write schedules another microtask forever.
{
  const source=fs.readFileSync('src/notification-center-ui.js','utf8');
  assert.match(source,/if\(count&&count\.textContent!==nextCount\)count\.textContent=nextCount/,'Notification count writes must settle when the value is unchanged');
  assert.match(source,/observe\(content,\{childList:true,subtree:false\}\)/,'Notification observation must stay scoped to direct workspace replacements');
}

// Deep DOM changes must not trigger whole-document icon and personalization rescans.
{
  const icons=fs.readFileSync('src/professional-icons.js','utf8');
  const personalization=fs.readFileSync('src/personalization.js','utf8');
  const bootstrap=fs.readFileSync('src/bootstrap.js','utf8');
  assert.match(icons,/roots=pending\.filter/,'Nested icon mutation roots must be coalesced');
  assert.match(icons,/pending\.filter\(node=>node\.isConnected\)/,'Detached workspaces must be discarded before icon decoration');
  assert.doesNotMatch(icons,/labelLauncher\(\);replaceMedallions\(\);decorateCertRows\(\);decorateMedalShelf\(\);bannerIcons\(\);stripDecorativeSymbols\(\);/,'Icon mutations must not rescan the entire document every frame');
  assert.match(personalization,/observe\(document\.body,\{childList:true,subtree:false\}\)/,'Personalization must ignore deep content mutations');
  assert.match(bootstrap,/observe\(content,\{childList:true,subtree:false\}\)/,'Bootstrap post-render work must be scoped to workspace replacements');
  const renderer=fs.readFileSync('src/renderer.js','utf8');
  const filterIntelligence=fs.readFileSync('src/filter-intelligence.js','utf8');
  const roleReadiness=fs.readFileSync('src/role-readiness-rank.js','utf8');
  const roleMatchBody=renderer.slice(renderer.indexOf('function roleMatches()'),renderer.indexOf('function renderApp()'));
  assert.doesNotMatch(roleMatchBody,/goalFor\(ch\.id\)/,'Dashboard role ranking must not rebuild the full filter catalogue once per role');
  assert.doesNotMatch(filterIntelligence,/const next=nextFor\(ch\.test/,'Dashboard role ranking must not fully score every role during a tab switch');
  assert.doesNotMatch(roleReadiness,/__rankWrapped/,'Dashboard role rows must not be eagerly decorated with unused readiness detail');
}

// Source freshness is distinct from the time a user clicks Refresh.
{
  const now=Date.parse('2026-09-02T12:00:00Z'),feed={status:'live',fetchedAt:new Date(now).toISOString(),jobs:[]};
  let offline=false,requests=0;
  const CT={marketReadiness:{}};
  const sandbox={CertTrackerV3:CT,console:{warn(){}},AbortController,setTimeout,clearTimeout,fetch:async()=>{requests++;if(offline)throw Error('offline');return{ok:true,json:async()=>feed};}};sandbox.window=sandbox;
  vm.runInNewContext(fs.readFileSync('src/job-market.js','utf8'),sandbox);
  assert.match(CT.jobMarket.freshness(feed,now).label,/Recent/);
  assert.match(CT.jobMarket.freshness(feed,now+3600000).label,/Stale/);
  assert.match(CT.jobMarket.freshness({...feed,fetchedAt:null},now).label,/unverified/);
  assert.match(CT.jobMarket.freshness({...feed,status:'degraded'},now).label,/Partial/);
  await CT.jobMarket.load();offline=true;
  const fallback=await CT.jobMarket.load({force:true});
  assert.equal(requests,2);assert.equal(fallback.fetchedAt,feed.fetchedAt);
  assert.match(CT.jobMarket.freshness(fallback,now).label,/cached/);
  console.log('Recommendations freshness passed: recent, stale, missing, degraded and offline-cache cases.');
}
