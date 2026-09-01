// Cert Tracker — authoritative path and phase-completion rules.
(function initPhaseEngine(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT?.store) throw new Error('state-core.js must load before phase-engine.js');

  function hasConfiguredPath(){return !!state.myPath&&Object.keys(state.myPath).some(id=>state.myPath[id]);}
  function inPath(cert){if(!cert||state.skipped?.[cert.id])return false;if(hasConfiguredPath())return !!state.myPath[cert.id];return ['CORE','FOUNDATION','ROLE-DRIVEN'].includes(cert.track);}
  function effectivePhase(cert){return CT.store.effectivePhase(cert);}
  function phaseCerts(phase){return CERTS.filter(cert=>effectivePhase(cert)===phase&&inPath(cert));}
  function artifactRequired(phase){return !!(typeof PHASES!=='undefined'&&PHASES?.[phase]?.artifact);}
  function artifactDone(phase){return !artifactRequired(phase)||!!state.artifacts?.[phase];}
  function phaseState(phase){
    const certs=phaseCerts(phase);const gates=certs.filter(cert=>cert.track==='CORE'||cert.gateway);const required=gates.length?gates:certs.filter(cert=>cert.track==='FOUNDATION');
    const passed=required.filter(cert=>!!state.passes?.[cert.id]);const complete=required.every(cert=>!!state.passes?.[cert.id])&&artifactDone(phase);
    return Object.freeze({phase,certs,required,passed,artifactRequired:artifactRequired(phase),artifactDone:artifactDone(phase),complete,percent:required.length?Math.round(passed.length/required.length*100):(artifactDone(phase)?100:0)});
  }
  function pathStatus(){
    const active=[];let current=null;
    for(let phase=1;phase<=6;phase++){const info=phaseState(phase);if(!info.certs.length)continue;active.push(info);if(current==null&&!info.complete)current=phase;}
    const complete=active.length>0&&active.every(info=>info.complete);
    return Object.freeze({complete,currentPhase:complete?null:(current||active.at(-1)?.phase||1),activePhases:Object.freeze(active.map(x=>x.phase)),completedPhases:Object.freeze(active.filter(x=>x.complete).map(x=>x.phase)),percent:active.length?Math.round(active.reduce((sum,x)=>sum+x.percent,0)/active.length):0});
  }
  function isPhaseComplete(phase){return phaseState(phase).complete;}
  function getCurrentPhase(){return pathStatus().currentPhase||6;}
  function phaseBlockers(phase=pathStatus().currentPhase){if(phase==null)return[];const info=phaseState(phase);const blockers=info.required.filter(cert=>!state.passes?.[cert.id]).map(cert=>({type:'cert',id:cert.id,label:cert.name}));if(info.artifactRequired&&!info.artifactDone)blockers.push({type:'artifact',id:`phase-${phase}-artifact`,label:PHASES?.[phase]?.artifact||`Phase ${phase} artifact`});return blockers;}

  CT.phases=Object.freeze({inPath,effectivePhase,phaseCerts,phaseState,pathStatus,isPhaseComplete,currentPhase:getCurrentPhase,phaseBlockers});
  currentPhase=getCurrentPhase;
})(window);
