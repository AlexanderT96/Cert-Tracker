// Cert Tracker — authoritative browser state and renderer compatibility.
const SK={passes:'ct2-passes',exams:'ct2-exams',cpe:'ct2-cpe',notify:'ct2-notify',openPh:'ct2-open-phase',notes:'ct2-notes',gates:'ct2-gates',study:'ct2-study',filter:'ct2-filter',skipped:'ct2-skipped',mpDefault:'ct2-mypath-default',backup:'ct2-lastbackup',salary:'ct2-salary',eventsDis:'ct2-events-dismissed',pace2:'ct2-pace2',explog:'ct2-explog',myPath:'ct4-mypath'};
const state={passes:{},skipped:{},exams:{},activities:[],notes:{},gates:{},studyLog:[],openPhase:1,openCerts:{},currentTab:'dashboard',filter:'my-path',searchQuery:'',showStudyForm:false,lastBackup:null,dismissedBackup:false,currentSalary:0,pace2:6,simMode:false,simPasses:{},expLog:[],eventsDismissed:[],artifacts:{},partners:{},certOrder:{},phaseOverrides:{},myPath:{},passedOnly:false,openFilterGroups:{},objectiveProgress:{},competencyEvidence:{},capabilityEvidence:{},customization:{},plannerSettings:{weeklyHours:6,budget:null,targetDate:'',maxCerts:8}};
const save={};

(function initStateCore(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT)throw new Error('config.js must load before state-core.js');const C=CT.config;SK.myPath=C.myPathKey;
  const basePhases=new Map(CERTS.map(cert=>[cert.id,Number(cert.phase||6)]));
  function parse(key,fallback){try{const raw=localStorage.getItem(key);const value=raw==null?fallback:JSON.parse(raw);if(fallback!==null&&typeof fallback==='object'&&((Array.isArray(fallback)&&!Array.isArray(value))||(!Array.isArray(fallback)&&!CT.util.isPlainObject(value))))return fallback;return value;}catch{return fallback;}}
  function firstPath(){const current=parse(C.myPathKey,null);if(CT.util.isPlainObject(current))return current;for(const key of C.legacyMyPathKeys){const value=parse(key,null);if(CT.util.isPlainObject(value))return value;}return null;}
  function pruneCertMap(map){const valid=new Set(CERTS.map(cert=>cert.id));Object.keys(map||{}).forEach(id=>{if(!valid.has(id))delete map[id];});return map||{};}
  const route=global.CERT_TRACKER_FOCUSED_ROUTE;
  function routeEnabled(){const ids=Object.keys(state.myPath||{}).filter(id=>state.myPath[id]);return !!route&&ids.length===route.ids.length&&route.ids.every(id=>state.myPath[id]);}
  function routePhase(id){return Number(Object.keys(route?.phases||{}).find(p=>route.phases[p].certs.includes(id))||0);}
  function effectivePhase(cert){if(routeEnabled()&&routePhase(cert?.id))return routePhase(cert.id);const override=Number(state.phaseOverrides?.[cert?.id]);return Number.isInteger(override)&&override>=1&&override<=6?override:Number(basePhases.get(cert?.id)||6);}
  function installPhaseAccessors(){for(const cert of CERTS){const descriptor=Object.getOwnPropertyDescriptor(cert,'phase');if(descriptor?.get?.__certTrackerPhase)return;const getter=function(){return effectivePhase(cert);};getter.__certTrackerPhase=true;Object.defineProperty(cert,'phase',{configurable:true,enumerable:true,get:getter,set(value){const n=Number(value);if(Number.isInteger(n)&&n>=1&&n<=6)state.phaseOverrides[cert.id]=n;}});}}
  installPhaseAccessors();

  function loadState(){
    state.passes=pruneCertMap(parse(SK.passes,{}));state.exams=pruneCertMap(parse(SK.exams,{}));state.notes=pruneCertMap(parse(SK.notes,{}));state.studyLog=parse(SK.study,[]);state.lastBackup=localStorage.getItem(SK.backup)||null;state.openPhase=Math.min(6,Math.max(1,Number(localStorage.getItem(SK.openPh)||1)));state.filter=localStorage.getItem(SK.filter)||'my-path';state.passedOnly=localStorage.getItem('cert.passedOnly')==='1';state.artifacts=parse('ct2-artifacts',{});state.partners=parse('ct2-partners',{});state.certOrder=parse('ct2-order',{});state.phaseOverrides=pruneCertMap(parse('ct2-phase-ovr',{}));state.skipped=pruneCertMap(parse(SK.skipped,{}));state.openFilterGroups=parse('cert.openFilterGroups',{});state.expLog=parse(SK.explog,[]);state.eventsDismissed=parse(SK.eventsDis,[]);state.activities=parse(SK.cpe,[]);state.gates=parse(SK.gates,{});state.objectiveProgress=pruneCertMap(parse(C.objectiveKey,{}));state.competencyEvidence=parse(C.evidenceKey,{});state.capabilityEvidence=parse(C.capabilityEvidenceKey,{});state.customization=parse(C.personalizationKey,{});state.plannerSettings={...state.plannerSettings,...parse(C.plannerKey,{})};
    const salary=Number(localStorage.getItem(SK.salary));if(Number.isFinite(salary)&&salary>=0)state.currentSalary=salary;const pace=Number(localStorage.getItem(SK.pace2));if(Number.isFinite(pace)&&pace>=0)state.pace2=pace;if(!Number.isFinite(Number(state.plannerSettings.weeklyHours))||Number(state.plannerSettings.weeklyHours)<=0)state.plannerSettings.weeklyHours=state.pace2||6;
    if(state.filter==='passed'){state.filter='all';state.passedOnly=true;localStorage.setItem(SK.filter,'all');localStorage.setItem('cert.passedOnly','1');}
    const savedPath=firstPath();state.myPath=savedPath||{};const defaults=global.CERT_TRACKER_DEFAULT_PATH||[];if(savedPath===null)defaults.forEach(id=>{state.myPath[id]=true;});
    // Additive upgrade for the previous focused preset only. Custom paths and all
    // progress remain untouched. Remember the upgrade so Undo survives a reload.
    const upgradeKey='ct-focused-route-upgrade-'+route?.id;
    const selected=Object.keys(state.myPath).filter(id=>state.myPath[id]);
    if(savedPath&&route?.previousIds?.every(id=>state.myPath[id])&&selected.every(id=>route.ids.includes(id))&&route.additions.some(id=>!state.myPath[id])&&!localStorage.getItem(upgradeKey)){
      CT.storage?.captureUndoPoint('add Azure networking and Windows Server milestones');
      route.additions.forEach(id=>{state.myPath[id]=true;});
      localStorage.setItem(upgradeKey,'1');localStorage.setItem(C.lastChangeKey,new Date().toISOString());
    }
    state.myPath=pruneCertMap(state.myPath);localStorage.setItem(C.myPathKey,JSON.stringify(state.myPath));localStorage.setItem('cert.myPathVersion',String(CT.version.data));return state;
  }

  Object.assign(save,{passes:()=>localStorage.setItem(SK.passes,JSON.stringify(state.passes)),myPath:()=>localStorage.setItem(C.myPathKey,JSON.stringify(state.myPath)),exams:()=>localStorage.setItem(SK.exams,JSON.stringify(state.exams)),notes:()=>localStorage.setItem(SK.notes,JSON.stringify(state.notes)),study:()=>localStorage.setItem(SK.study,JSON.stringify(state.studyLog)),openPh:()=>localStorage.setItem(SK.openPh,String(state.openPhase)),filter:()=>localStorage.setItem(SK.filter,state.filter),skipped:()=>localStorage.setItem(SK.skipped,JSON.stringify(state.skipped)),backup:()=>localStorage.setItem(SK.backup,state.lastBackup||''),cpe:()=>localStorage.setItem(SK.cpe,JSON.stringify(state.activities||[])),gates:()=>localStorage.setItem(SK.gates,JSON.stringify(state.gates||{})),objectives:()=>localStorage.setItem(C.objectiveKey,JSON.stringify(state.objectiveProgress||{})),evidence:()=>localStorage.setItem(C.evidenceKey,JSON.stringify(state.competencyEvidence||{})),capabilityEvidence:()=>localStorage.setItem(C.capabilityEvidenceKey,JSON.stringify(state.capabilityEvidence||{})),customization:()=>localStorage.setItem(C.personalizationKey,JSON.stringify(state.customization||{})),planner:()=>localStorage.setItem(C.plannerKey,JSON.stringify(state.plannerSettings||{}))});

  CT.store=Object.freeze({state,keys:SK,load:loadState,save,basePhase:cert=>Number(basePhases.get(cert?.id)||6),effectivePhase,
    objective(certId){const value=state.objectiveProgress?.[certId];if(CT.util.isPlainObject(value)){const nums=Object.values(value).map(Number).filter(Number.isFinite);return nums.length?CT.util.clamp(nums.reduce((a,b)=>a+b,0)/nums.length,0,100):0;}return CT.util.clamp(Number(value||0),0,100);},
    setObjective(certId,value,domain=null){if(!CERTS.some(cert=>cert.id===certId))throw new Error('Unknown certification.');if(domain){const current=CT.util.isPlainObject(state.objectiveProgress[certId])?state.objectiveProgress[certId]:{};state.objectiveProgress[certId]={...current,[domain]:CT.util.clamp(Number(value)||0,0,100)};}else state.objectiveProgress[certId]=CT.util.clamp(Number(value)||0,0,100);save.objectives();CT.events.emit('state-saved',{key:'objectives',at:new Date().toISOString()});},
    setPlanner(settings){state.plannerSettings={...state.plannerSettings,...settings};save.planner();CT.events.emit('state-saved',{key:'planner',at:new Date().toISOString()});return state.plannerSettings;}
  });
  CT.focusedRoute=Object.freeze({definition:route,enabled:routeEnabled,phase:routePhase,
    scoped:filter=>routeEnabled()&&(filter||state.filter)==='my-path',
    position:id=>route?.ids.indexOf(id)??-1,
    ordered:rows=>rows.slice().sort((a,b)=>(route?.ids.indexOf(a.id)??999)-(route?.ids.indexOf(b.id)??999)),
    next:(passes=state.passes)=>route?.ids.map(id=>CERTS.find(c=>c.id===id)).find(c=>c&&!passes[c.id])||null,
    apply(){
      if(!route||route.ids.some(id=>!CERTS.some(c=>c.id===id)))throw new Error('Focused route catalogue is incomplete.');
      CT.storage?.captureUndoPoint('apply focused route');
      state.myPath=Object.fromEntries(route.ids.map(id=>[id,true]));
      localStorage.setItem(C.goalKey,'network');
      localStorage.setItem('ct4-career-next-role','network');
      localStorage.setItem('ct4-career-target-role','networkPlatform');
      state.filter='my-path';state.openPhase=CT.phases?.currentPhase()||1;
      // One transaction; preserve passes, dates, notes, skipped flags and evidence.
      CT.storage.persistAll();CT.events.emit('state-saved',{key:'focused-route',at:new Date().toISOString()});
      global.renderApp?.();
    }
  });
  global.loadState=loadState;global.CertTrackerState=CT.store;
})(window);
