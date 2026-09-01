(async()=>{
  const results=[];
  async function test(name,fn){try{const value=await fn();const ok=value!==false;results.push({name,status:ok?'PASS':'FAIL',detail:ok?'':'returned false'});}catch(error){results.push({name,status:'FAIL',detail:error?.message||String(error)});}}
  function skip(name,detail){results.push({name,status:'SKIP',detail});}

  await test('Application core loads',()=>window.CertTrackerV3?.version?.app==='4.0.0');
  await test('Renderer state is provided by state-core',()=>window.CertTrackerState?.state===state&&SK.myPath==='ct4-mypath'&&typeof save.passes==='function');
  await test('Curated path is separate and frozen',()=>Array.isArray(window.CERT_TRACKER_DEFAULT_PATH)&&Object.isFrozen(window.CERT_TRACKER_DEFAULT_PATH));
  await test('Certification schema has no hard errors',()=>CertTrackerV3.validation.diagnostics.errors.length===0);
  await test('Certification IDs are unique',()=>new Set(CERTS.map(c=>c.id)).size===CERTS.length);
  await test('Dependencies resolve',()=>{const ids=new Set(CERTS.map(c=>c.id));return CERTS.every(c=>(c.deps||[]).every(dep=>ids.has(dep)&&dep!==c.id));});
  await test('Gateway certifications have audited official sources',()=>CERTS.filter(c=>c.gateway).every(c=>{const h=CertTrackerV3.dataHealth.record(c);return h.sourceLevel==='CERT'&&h.provenance==='AUDITED_REGISTRY';}));
  await test('Local date stamp is ISO-shaped',()=>/^\d{4}-\d{2}-\d{2}$/.test(CertTrackerV3.dates.localDateStamp(new Date())));
  await test('ICS all-day dates use exclusive DTEND',()=>{const original=state.exams;const cert=CERTS[0];state.exams={[cert.id]:'2026-09-01'};try{const text=CertTrackerV3.exports.buildICS().content;return text.includes('DTSTART;VALUE=DATE:20260901')&&text.includes('DTEND;VALUE=DATE:20260902');}finally{state.exams=original;}});
  await test('Deep backup rejects future versions',()=>!CertTrackerV3.storage.validateBackup({...CertTrackerV3.storage.serializableState(),version:999}).ok);
  await test('Deep backup rejects unknown certification IDs',()=>!CertTrackerV3.storage.validateBackup({...CertTrackerV3.storage.serializableState(),passes:{'not-a-cert':'2026-01-01'}}).ok);
  await test('Deep backup rejects invalid nested study hours',()=>!CertTrackerV3.storage.validateBackup({...CertTrackerV3.storage.serializableState(),studyLog:[{date:'2026-01-01',hours:99}]}).ok);
  await test('Deep backup accepts objective-domain progress',()=>{const cert=CERTS[0];const data=CertTrackerV3.storage.serializableState();data.objectiveProgress={[cert.id]:{networking:70,security:85}};return CertTrackerV3.storage.validateBackup(data).ok;});
  await test('Deep backup accepts primitive dismissed event IDs',()=>{const data=CertTrackerV3.storage.serializableState();data.eventsDismissed=['market-event-1'];return CertTrackerV3.storage.validateBackup(data).ok;});
  await test('Current state passes deep backup validation',()=>CertTrackerV3.storage.validateBackup(CertTrackerV3.storage.serializableState()).ok);
  await test('Phase overrides preserve canonical base phase',()=>{const cert=CERTS[0];const original=CertTrackerV3.store.basePhase(cert),prior=state.phaseOverrides[cert.id],target=original===6?5:6;state.phaseOverrides[cert.id]=target;try{return CertTrackerV3.store.basePhase(cert)===original&&CertTrackerV3.phases.effectivePhase(cert)===target&&cert.phase===target;}finally{if(prior==null)delete state.phaseOverrides[cert.id];else state.phaseOverrides[cert.id]=prior;}});
  await test('Path engine exposes explicit completion state',()=>typeof CertTrackerV3.phases.pathStatus().complete==='boolean');
  await test('Competency taxonomy covers the catalogue',()=>CERTS.every(cert=>Object.keys(CertTrackerV3.competency.competencies(cert)).length>0));
  await test('Goal coverage stays bounded',()=>Object.keys(CertTrackerV3.competency.GOALS).every(goal=>{const x=CertTrackerV3.competency.goalCoverage(goal).score;return x>=0&&x<=100;}));
  await test('Readiness stays bounded and supplies remaining effort',()=>CERTS.every(cert=>{const r=CertTrackerV3.competency.readiness(cert);return r.score>=0&&r.score<=100&&r.remainingHours>=0;}));
  await test('Competency similarity detects full self-overlap',()=>{const cert=CERTS[0];return Math.abs(CertTrackerV3.marketValue.overlap(cert,[cert])-1)<0.0001;});
  await test('Marginal value discounts a highly overlapping distinct credential',()=>{let best=null;for(let i=0;i<CERTS.length;i++){if(!Number(CERTS[i].cvValue))continue;for(let j=0;j<CERTS.length;j++){if(i===j)continue;const overlap=CertTrackerV3.marketValue.overlap(CERTS[i],[CERTS[j]]);if(!best||overlap>best.overlap)best={cert:CERTS[i],other:CERTS[j],overlap};}}if(!best||best.overlap<0.2)return true;const solo=CertTrackerV3.marketValue.marginalContribution(best.cert,[]);const marginal=CertTrackerV3.marketValue.marginalContribution(best.cert,[best.other]);return marginal.contributionRange.midpoint<=solo.contributionRange.midpoint&&marginal.novelty<=100;});
  await test('Recommendation engine is competency-aware',()=>{const rows=CertTrackerV3.recommendations.recommend({limit:10});return rows.every(x=>x.available&&x.marketValue&&x.readiness&&Number.isFinite(x.relevance.percent))&&rows.every((x,i)=>i===0||rows[i-1].score>=x.score);});
  await test('Planner respects maximum certification count',()=>CertTrackerV3.planner.plan({maxCerts:3}).sequence.length<=3);
  await test('Planner respects a zero self-funded budget',()=>CertTrackerV3.planner.plan({budget:0,maxCerts:10}).sequence.every(item=>item.cost===0));
  await test('Planner produces ordered cumulative effort',()=>{const rows=CertTrackerV3.planner.plan({maxCerts:8}).sequence;return rows.every((x,i)=>i===0||x.cumulativeHours>=rows[i-1].cumulativeHours);});
  await test('Data health confidence stays bounded',()=>CertTrackerV3.dataHealth.allRecords().every(x=>x.confidence>=0&&x.confidence<=100));

  if(window.crypto?.subtle){
    const fastKdf={iterations:1000};
    await test('Production encrypted vault keeps hardened PBKDF2 default',()=>CertTrackerV3.sync.defaultIterations===250000);
    await test('Encrypted vault round-trips with AES-GCM',async()=>{const snapshot=CertTrackerV3.storage.serializableState();const envelope=await CertTrackerV3.sync.encryptPayload(snapshot,'browser-test-passphrase',fastKdf);const restored=await CertTrackerV3.sync.decryptPayload(envelope,'browser-test-passphrase');return envelope.iterations===1000&&restored.version===snapshot.version&&JSON.stringify(restored.passes)===JSON.stringify(snapshot.passes);});
    await test('Encrypted vault rejects wrong passphrase',async()=>{const envelope=await CertTrackerV3.sync.encryptPayload(CertTrackerV3.storage.serializableState(),'browser-test-passphrase',fastKdf);try{await CertTrackerV3.sync.decryptPayload(envelope,'definitely-wrong-passphrase');return false;}catch{return true;}});
    await test('Sync hash ignores volatile export timestamps',async()=>{const a=CertTrackerV3.storage.serializableState(),b=JSON.parse(JSON.stringify(a));b.exportedAt='2099-12-31T23:59:59.000Z';return await CertTrackerV3.sync.digest(a)===await CertTrackerV3.sync.digest(b);});
    await test('GitHub sync adapter loads',()=>!!CertTrackerV3.githubSync&&CertTrackerV3.githubSync.DEFAULT_PATH==='sync/cert-tracker.ctvault');
    await test('GitHub sync keeps token and passphrase out of localStorage',()=>{const key=CertTrackerV3.githubSync.CONFIG_KEY,prior=localStorage.getItem(key),token='x'.repeat(40),passphrase='browser-test-passphrase';try{CertTrackerV3.githubSync.setConfig({repo:'example/private-state',path:'sync/test.ctvault',branch:'main',autoSync:false});CertTrackerV3.githubSync.connect({token,passphrase});const all=Object.values(localStorage).join('\n');return !all.includes(token)&&!all.includes(passphrase);}finally{CertTrackerV3.githubSync.disconnect();if(prior==null)localStorage.removeItem(key);else localStorage.setItem(key,prior);}});
    await test('GitHub sync rejects traversal and workflow vault paths',()=>{try{CertTrackerV3.githubSync.setConfig({repo:'example/private-state',path:'../vault.ctvault',branch:'main'});return false;}catch{}try{CertTrackerV3.githubSync.setConfig({repo:'example/private-state',path:'.github/workflows/vault.ctvault',branch:'main'});return false;}catch{return true;}});
  }else skip('Encrypted vault tests','Web Crypto unavailable');

  await test('No external font stylesheet is required',()=>![...document.querySelectorAll('link[rel="stylesheet"]')].some(link=>/fonts\.googleapis\.com/i.test(link.href)));
  const list=document.getElementById('results');results.forEach(result=>{const li=document.createElement('li');li.className=result.status.toLowerCase();li.textContent=`${result.status} — ${result.name}${result.detail?` (${result.detail})`:''}`;list.appendChild(li);});
  const failed=results.filter(r=>r.status==='FAIL').length,skipped=results.filter(r=>r.status==='SKIP').length;const summary=document.getElementById('summary');summary.className=failed?'fail':'pass';summary.textContent=failed?`${failed} of ${results.length} checks failed.`:`All ${results.length-skipped} executed checks passed${skipped?` (${skipped} skipped)`:''}.`;console.table(results);
})();
