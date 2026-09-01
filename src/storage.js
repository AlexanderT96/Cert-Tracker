// Cert Tracker — validated persistence, backup, recovery and undo.
(function initStorage(global) {
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.store)throw new Error('state-core.js must load before storage.js');
  const C=CT.config;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const safeParse=(raw,fallback)=>{try{return raw==null?fallback:JSON.parse(raw);}catch{return fallback;}};
  const validIds=new Set(CERTS.map(cert=>cert.id));

  function migrate(){
    SK.myPath=C.myPathKey;
    if(!localStorage.getItem(C.myPathKey))for(const key of C.legacyMyPathKeys){const raw=localStorage.getItem(key);if(raw){localStorage.setItem(C.myPathKey,raw);break;}}
    localStorage.setItem(C.storageSchemaKey,String(CT.version.storage));
  }

  function serializableState(){
    return {
      version:CT.version.backup,appVersion:CT.version.app,dataVersion:CT.version.data,storageVersion:CT.version.storage,
      exportedAt:new Date().toISOString(),changedAt:localStorage.getItem(C.lastChangeKey)||new Date().toISOString(),
      passes:clone(state.passes||{}),exams:clone(state.exams||{}),notes:clone(state.notes||{}),studyLog:clone(state.studyLog||[]),skipped:clone(state.skipped||{}),
      myPath:clone(state.myPath||{}),filter:state.filter||'my-path',currentSalary:Number(state.currentSalary||0),pace2:Number(state.pace2||0),
      expLog:clone(state.expLog||[]),eventsDismissed:clone(state.eventsDismissed||[]),artifacts:clone(state.artifacts||{}),partners:clone(state.partners||{}),
      certOrder:clone(state.certOrder||{}),phaseOverrides:clone(state.phaseOverrides||{}),activities:clone(state.activities||[]),gates:clone(state.gates||{}),
      objectiveProgress:clone(state.objectiveProgress||{}),competencyEvidence:clone(state.competencyEvidence||{}),capabilityEvidence:clone(state.capabilityEvidence||{}),customization:clone(state.customization||{}),plannerSettings:clone(state.plannerSettings||{}),
      goalProfile:localStorage.getItem(C.goalKey)||'convergence'
    };
  }

  function readPersistedSnapshot(){return serializableState();}
  function isObj(value){return CT.util.isPlainObject(value);}
  function validateCertKeyObject(obj,field,{dateValues=false,boolValues=false,numberRange=null}={}){
    const errors=[];if(obj==null)return errors;if(!isObj(obj))return [`${field} must be an object.`];
    for(const [id,value] of Object.entries(obj)){
      if(!validIds.has(id))errors.push(`${field}.${id} references an unknown certification.`);
      if(dateValues&&value&&!CT.util.validIsoDate(value))errors.push(`${field}.${id} must be YYYY-MM-DD.`);
      if(boolValues&&typeof value!=='boolean')errors.push(`${field}.${id} must be boolean.`);
      if(numberRange){const values=isObj(value)?Object.entries(value):[[null,value]];for(const [domain,raw] of values){const n=Number(raw);if(!Number.isFinite(n)||n<numberRange[0]||n>numberRange[1])errors.push(`${field}.${id}${domain?`.${domain}`:''} must be ${numberRange[0]}-${numberRange[1]}.`);}}
    }
    return errors;
  }
  function validateArrayRecords(value,field,validator,{allowPrimitives=false}={}){if(value==null)return[];if(!Array.isArray(value))return [`${field} must be an array.`];const errors=[];value.forEach((row,i)=>{if(!isObj(row)){if(!allowPrimitives)errors.push(`${field}[${i}] must be an object.`);return;}validator?.(row,i,errors);});return errors;}
  function validateCapabilityEvidence(value){
    const errors=[];if(value==null)return errors;if(!isObj(value))return ['capabilityEvidence must be an object.'];
    const levels=new Set(['NONE','LAB','USED','DESIGNED','OWNED']);
    for(const [id,row] of Object.entries(value)){
      if(!isObj(row)){errors.push(`capabilityEvidence.${id} must be an object.`);continue;}
      if(!levels.has(row.level))errors.push(`capabilityEvidence.${id}.level is invalid.`);
      if(row.note!=null&&typeof row.note!=='string')errors.push(`capabilityEvidence.${id}.note must be text.`);
      if(row.updatedAt!=null&&typeof row.updatedAt!=='string')errors.push(`capabilityEvidence.${id}.updatedAt must be text.`);
    }
    return errors;
  }
  function validateCustomization(value){
    const errors=[];if(value==null)return errors;if(!isObj(value))return ['customization must be an object.'];
    for(const field of ['colors','phaseColors','visibility','tabLabels'])if(value[field]!=null&&!isObj(value[field]))errors.push(`customization.${field} must be an object.`);
    if(value.tabOrder!=null&&(!Array.isArray(value.tabOrder)||value.tabOrder.some(x=>typeof x!=='string')) )errors.push('customization.tabOrder must be an array of strings.');
    for(const field of ['fontScale','density','radius','cardRadius','controlRadius','contentWidth','panelOpacity','shadowStrength','glowStrength','borderWidth'])if(value[field]!=null&&!Number.isFinite(Number(value[field])))errors.push(`customization.${field} must be numeric.`);
    return errors;
  }

  function validateBackup(data){
    const errors=[];if(!isObj(data))return {ok:false,errors:['Backup root must be an object.']};
    const version=Number(data.version);if(!Number.isInteger(version)||version<1)errors.push('Missing or invalid backup version.');else if(version>CT.version.backup)errors.push(`Backup version ${version} is newer than this app supports (${CT.version.backup}).`);
    errors.push(...validateCertKeyObject(data.passes,'passes',{dateValues:true}),...validateCertKeyObject(data.exams,'exams',{dateValues:true}),...validateCertKeyObject(data.skipped,'skipped',{dateValues:true}),...validateCertKeyObject(data.myPath,'myPath',{boolValues:true}),...validateCertKeyObject(data.objectiveProgress,'objectiveProgress',{numberRange:[0,100]}));
    for(const field of ['notes','artifacts','partners','certOrder','phaseOverrides','gates','competencyEvidence','plannerSettings'])if(data[field]!=null&&!isObj(data[field]))errors.push(`${field} must be an object.`);
    errors.push(...validateCapabilityEvidence(data.capabilityEvidence),...validateCustomization(data.customization));
    if(isObj(data.phaseOverrides))for(const [id,value] of Object.entries(data.phaseOverrides)){if(!validIds.has(id))errors.push(`phaseOverrides.${id} references an unknown certification.`);const n=Number(value);if(!Number.isInteger(n)||n<1||n>6)errors.push(`phaseOverrides.${id} must be an integer from 1 to 6.`);}
    if(isObj(data.notes))for(const [id,note] of Object.entries(data.notes)){if(!validIds.has(id))errors.push(`notes.${id} references an unknown certification.`);if(!isObj(note))errors.push(`notes.${id} must be an object.`);else{for(const key of ['text','link','imageData'])if(note[key]!=null&&typeof note[key]!=='string')errors.push(`notes.${id}.${key} must be text.`);}}
    errors.push(...validateArrayRecords(data.studyLog,'studyLog',(row,i,out)=>{if(row.date&&!CT.util.validIsoDate(row.date))out.push(`studyLog[${i}].date is invalid.`);const h=Number(row.hours);if(!Number.isFinite(h)||h<0||h>24)out.push(`studyLog[${i}].hours must be 0-24.`);if(row.certId&&!validIds.has(row.certId))out.push(`studyLog[${i}].certId is unknown.`);}),...validateArrayRecords(data.expLog,'expLog'),...validateArrayRecords(data.eventsDismissed,'eventsDismissed',null,{allowPrimitives:true}),...validateArrayRecords(data.activities,'activities'));
    const salary=Number(data.currentSalary??0);if(!Number.isFinite(salary)||salary<0||salary>10000000)errors.push('currentSalary is outside the supported range.');
    const pace=Number(data.pace2??0);if(!Number.isFinite(pace)||pace<0||pace>168)errors.push('pace2 must be between 0 and 168 hours/week.');
    if(data.goalProfile!=null&&!CT.competency?.GOALS?.[data.goalProfile])errors.push('goalProfile is not recognised.');
    if(isObj(data.plannerSettings)){const p=data.plannerSettings;if(p.weeklyHours!=null&&(!Number.isFinite(Number(p.weeklyHours))||Number(p.weeklyHours)<=0||Number(p.weeklyHours)>168))errors.push('plannerSettings.weeklyHours must be 0-168.');if(p.budget!=null&&p.budget!==''&&(!Number.isFinite(Number(p.budget))||Number(p.budget)<0))errors.push('plannerSettings.budget must be non-negative.');if(p.targetDate&&!CT.util.validIsoDate(p.targetDate))errors.push('plannerSettings.targetDate is invalid.');}
    return {ok:errors.length===0,errors};
  }

  function persistAll(options={}){
    save.passes();save.exams();save.notes();save.study();save.skipped();save.myPath();save.cpe();save.gates();save.objectives();save.evidence();save.capabilityEvidence();save.customization?.();save.planner();
    localStorage.setItem(SK.filter,state.filter||'my-path');localStorage.setItem(SK.salary,String(Number(state.currentSalary||0)));localStorage.setItem(SK.pace2,String(Number(state.pace2||0)));localStorage.setItem(SK.explog,JSON.stringify(state.expLog||[]));localStorage.setItem(SK.eventsDis,JSON.stringify(state.eventsDismissed||[]));
    localStorage.setItem('ct2-artifacts',JSON.stringify(state.artifacts||{}));localStorage.setItem('ct2-partners',JSON.stringify(state.partners||{}));localStorage.setItem('ct2-order',JSON.stringify(state.certOrder||{}));localStorage.setItem('ct2-phase-ovr',JSON.stringify(state.phaseOverrides||{}));localStorage.setItem(C.storageSchemaKey,String(CT.version.storage));
    if(options.changedAt!==false)localStorage.setItem(C.lastChangeKey,options.changedAt||new Date().toISOString());
  }

  function assignBackup(data){
    state.passes=clone(data.passes||{});state.exams=clone(data.exams||{});state.notes=clone(data.notes||{});state.studyLog=clone(data.studyLog||[]);state.skipped=clone(data.skipped||{});if(data.myPath)state.myPath=clone(data.myPath);
    if(typeof data.filter==='string')state.filter=data.filter;if(data.currentSalary!=null)state.currentSalary=Number(data.currentSalary);if(data.pace2!=null)state.pace2=Number(data.pace2);
    state.expLog=clone(data.expLog||[]);state.eventsDismissed=clone(data.eventsDismissed||[]);state.artifacts=clone(data.artifacts||{});state.partners=clone(data.partners||{});state.certOrder=clone(data.certOrder||{});state.phaseOverrides=clone(data.phaseOverrides||{});state.activities=clone(data.activities||[]);state.gates=clone(data.gates||{});
    state.objectiveProgress=clone(data.objectiveProgress||{});state.competencyEvidence=clone(data.competencyEvidence||{});state.capabilityEvidence=clone(data.capabilityEvidence||{});state.customization=clone(data.customization||{});state.plannerSettings={...state.plannerSettings,...clone(data.plannerSettings||{})};if(typeof data.goalProfile==='string')localStorage.setItem(C.goalKey,data.goalProfile);
  }

  function applyBackup(data,options={}){
    const validation=validateBackup(data);if(!validation.ok)throw new Error(validation.errors.join(' '));const rollback=serializableState();
    try{assignBackup(data);persistAll({changedAt:data.changedAt||data.exportedAt||new Date().toISOString()});CT.personalization?.apply?.();if(!options.silent){CT.events.emit('state-restored',{source:options.source||'backup'});if(typeof renderApp==='function')renderApp();}return true;}
    catch(error){try{assignBackup(rollback);persistAll({changedAt:rollback.changedAt||rollback.exportedAt});}catch{}throw error;}
  }

  function downloadJson(data,filename){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function exportBackup(){const data=serializableState();downloadJson(data,`cert-tracker-backup-${new Date().toISOString().slice(0,10)}.json`);localStorage.setItem(C.lastBackupKey,new Date().toISOString());localStorage.setItem(C.recoveryKey,JSON.stringify(data));CT.events.emit('backup-exported',data);if(typeof showToast==='function')showToast('Backup exported');return data;}
  function importBackupFile(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=event=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=e=>{try{applyBackup(JSON.parse(e.target.result),{source:'file'});if(typeof showToast==='function')showToast('Backup restored');}catch(error){console.error('[CertTracker] backup restore rejected',error);if(typeof showToast==='function')showToast('Error: invalid or incompatible backup');}};reader.readAsText(file);};input.click();}

  let lastUndoCapture=0,lastRecoveryWrite=0;
  function captureUndoPoint(reason='change'){const now=Date.now();if(now-lastUndoCapture<900)return;lastUndoCapture=now;const snapshot=serializableState();snapshot.undoReason=reason;snapshot.undoCapturedAt=new Date().toISOString();localStorage.setItem(C.undoKey,JSON.stringify(snapshot));}
  function undoLastChange(){const data=safeParse(localStorage.getItem(C.undoKey),null);if(!data){if(typeof showToast==='function')showToast('Nothing to undo');return false;}applyBackup(data,{source:'undo'});localStorage.removeItem(C.undoKey);if(typeof showToast==='function')showToast(`Undid ${data.undoReason||'last change'}`);return true;}
  function recordRecoveryPoint(){if(Date.now()-lastRecoveryWrite<30000)return;lastRecoveryWrite=Date.now();try{localStorage.setItem(C.recoveryKey,JSON.stringify(serializableState()));}catch{}}
  function wrapSaves(){Object.keys(save).forEach(key=>{if(typeof save[key]!=='function'||save[key].__ctWrapped)return;const original=save[key];const wrapped=function(...args){captureUndoPoint(key);const result=original.apply(this,args);const changedAt=new Date().toISOString();localStorage.setItem(C.lastChangeKey,changedAt);recordRecoveryPoint();CT.events.emit('state-saved',{key,at:changedAt});return result;};wrapped.__ctWrapped=true;save[key]=wrapped;});}

  migrate();wrapSaves();recordRecoveryPoint();exportJSON=exportBackup;importJSON=importBackupFile;
  CT.storage=Object.freeze({migrate,serializableState,readPersistedSnapshot,validateBackup,applyBackup,persistAll,exportBackup,importBackupFile,captureUndoPoint,undoLastChange,recordRecoveryPoint,lastBackupAt:()=>localStorage.getItem(C.lastBackupKey),lastChangedAt:()=>localStorage.getItem(C.lastChangeKey)});
})(window);
