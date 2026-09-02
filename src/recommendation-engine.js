// Cert Tracker — explainable, dual-pillar, competency-aware, role-aware and experience-gated recommendation engine.
(function initRecommendationEngine(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT?.competency) throw new Error('competency-engine.js must load before recommendation-engine.js');

  const GOALS = CT.competency.GOALS;
  const TRACK_WEIGHT = Object.freeze({ CORE:26, FOUNDATION:18, 'ROLE-DRIVEN':22, ARCHITECT:24, 'IDENTITY-SEC':18, CONDITIONAL:14, OPTIONAL:5, 'POST-PLAN':-4 });
  // Market access and job-performance capability are co-equal. M and K therefore carry
  // the same weight within each horizon; role relevance, timing and readiness sequence
  // otherwise strong options rather than replacing either primary pillar.
  const HORIZONS = Object.freeze({
    now:Object.freeze({label:'Best combined move now',weights:{K:.25,M:.25,C:.20,N:.15,E:.10}}),
    next:Object.freeze({label:'Best combined move for the next role',weights:{K:.25,M:.25,N:.25,E:.10,C:.10}}),
    long:Object.freeze({label:'Best long-term career investment',weights:{K:.30,M:.30,E:.25,N:.10,C:.05}})
  });

  function currentGoal(){const key=localStorage.getItem(CT.config.goalKey)||'convergence';return GOALS[key]?key:'convergence';}
  function setGoal(key){if(!GOALS[key])throw new Error(`Unknown goal profile: ${key}`);localStorage.setItem(CT.config.goalKey,key);CT.events.emit('goal-changed',{key,profile:GOALS[key]});return key;}
  function dependencies(cert,passes=state.passes){const ids=Array.isArray(cert?.deps)?cert.deps:[];const missing=ids.filter(id=>!passes?.[id]);return {ids,missing,satisfied:missing.length===0};}
  function directUnlocks(cert,passes=state.passes){return CERTS.filter(item=>!passes?.[item.id]&&(item.deps||[]).includes(cert.id));}
  function goalRelevance(cert,goalKey=currentGoal()){const fit=CT.competency.goalFit(cert,goalKey);return {matches:fit.matched,score:fit.score,percent:fit.score,competencies:fit.competencies};}
  function timingPoints(t){return t==='T0'?18:t==='T1'?8:t==='T2'?-8:t==='T3'?-28:0;}
  function horizonPoints(card,horizon='now'){const spec=HORIZONS[horizon]||HORIZONS.now;return Math.round(Object.entries(spec.weights).reduce((sum,[key,w])=>sum+Number(card?.[key]||0)*10*w,0));}
  function experiencePoints(gate,horizon){if(!gate)return 0;if(gate.ready)return 12;const penalty=horizon==='long'?-10:horizon==='next'?-45:-80;return penalty+Math.round(gate.score*.12);}
  function curriculumPoints(cert,passes=state.passes){const unlocks=directUnlocks(cert,passes).length;const ladder=unlocks?Math.min(20,6+unlocks*4):0;const continuation=(cert.deps||[]).length?3:0;return ladder+continuation;}
  function tandemProfile(card){
    const M=CT.util.clamp(Number(card?.M||0),0,10),K=CT.util.clamp(Number(card?.K||0),0,10);
    const strength=Number(Math.sqrt(M*K).toFixed(1));
    const balance=Number((10-Math.abs(M-K)).toFixed(1));
    const weaker=Number(Math.min(M,K).toFixed(1));
    const skew=Number((M-K).toFixed(1));
    return Object.freeze({M,K,strength,balance,weaker,skew});
  }
  function tandemPoints(card){const t=tandemProfile(card);return Math.round(t.strength*4+t.weaker*1.5-Math.max(0,8-t.balance));}

  function score(cert,options={}){
    const goalKey=options.goal||currentGoal(); const passes=options.passes||state.passes; const phase=CT.phases?.currentPhase?.()||1;
    const dep=dependencies(cert,passes); const health=CT.dataHealth?.record(cert)||{confidence:70,freshness:'UNKNOWN',sourceLevel:'NONE'};
    const relevance=goalRelevance(cert,goalKey); const portfolio=CERTS.filter(c=>passes?.[c.id]&&c.id!==cert.id);
    const value=CT.marketValue?.marginalContribution(cert,portfolio)||null; const ready=CT.competency.readiness(cert,goalKey); const hours=Math.max(1,ready.remainingHours||CT.util.averageHours(cert));
    const effectivePhase=CT.store.effectivePhase(cert); const phaseDistance=Number(effectivePhase||6)-Number(phase||1); const inPath=CT.phases?.inPath?CT.phases.inPath(cert):!!state.myPath?.[cert.id];
    const career=CT.careerFramework?.scoreCard ? CT.careerFramework.scoreCard(cert) : Object.freeze({M:Number(cert.roi||0),K:Number(cert.roi||0),C:0,N:0,E:0,T:'T2'});
    const tandem=tandemProfile(career); const horizon=options.horizon||'now'; const experienceGate=CT.capabilityGates?.gateForCert?.(cert)||null; const portfolioClass=CT.capabilityGates?.portfolioClass?.(cert,career)||'SUPPORTING';
    const unlocks=directUnlocks(cert,passes);
    const breakdown={
      track:TRACK_WEIGHT[cert.track]??0,
      tandemValue:tandemPoints(career),
      curriculum:curriculumPoints(cert,passes),
      roleValue:horizonPoints(career,horizon),
      timing:timingPoints(career.T),
      experienceGate:experiencePoints(experienceGate,horizon),
      competency:Math.round(relevance.percent*.22),
      readiness:Math.round(ready.score*.15),
      marketSignal:value?Math.min(6,Math.round(value.contributionRange.midpoint/1800)):0,
      novelty:value?Math.max(-2,Math.min(3,Math.round((value.novelty-50)/20))):0,
      phase:phaseDistance===0?20:phaseDistance===1?8:phaseDistance<0?1:Math.max(-16,4-phaseDistance*5),
      path:inPath?18:-8,
      employer:cert.employer?8:0,
      gateway:cert.gateway?8:0,
      effortFit:hours<=20?3:hours<=70?4:hours<=110?3:hours<=180?1:0,
      scheduled:state.exams?.[cert.id]?10:0,
      dataConfidence:Math.round((health.confidence-70)/6),
      dependency:dep.satisfied?8:-90
    };
    let total=Object.values(breakdown).reduce((sum,n)=>sum+n,0); if(passes?.[cert.id])total=-9999;if(state.skipped?.[cert.id])total=-9998;
    const reasons=[];
    if(career.M>=8&&career.K>=8)reasons.push(`Strong combined market and capability value (M${career.M}/K${career.K})`);
    else if(tandem.skew>=2)reasons.push(`Market access currently exceeds capability depth (M${career.M}/K${career.K}); pair this with practical work before a major role jump`);
    else if(tandem.skew<=-2)reasons.push(`Capability depth currently exceeds direct market signal (M${career.M}/K${career.K}); useful learning, but recruiter value may be weaker`);
    else reasons.push(`Market and capability value are closely aligned (M${career.M}/K${career.K})`);
    if(unlocks.length)reasons.push(`Structured rung unlocking ${unlocks.length} downstream credential${unlocks.length===1?'':'s'}`);
    if(phaseDistance===0)reasons.push('Current-phase learning'); if(cert.employer)reasons.push('Employer-funded learning'); if(cert.gateway)reasons.push('Gateway certification');
    reasons.push(portfolioClass.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()));
    if(career.C>=6)reasons.push(`Strong current-role relevance (C${career.C})`); if(career.N>=7)reasons.push(`Strong next-role leverage (N${career.N})`); if(career.E>=7)reasons.push(`Strong long-term alignment (E${career.E})`);
    if(experienceGate&&!experienceGate.ready)reasons.push(`Experience gate ${experienceGate.score}%: ${experienceGate.label} evidence is not mature enough yet`);else if(experienceGate?.ready)reasons.push(`Experience gate met: ${experienceGate.label}`);
    if(career.T==='T3')reasons.push('Experience-gated: keep as a future curriculum target until practical responsibility catches up');
    if(relevance.percent>=35)reasons.push(`${relevance.percent}% target-competency fit`); if(ready.score>=60)reasons.push(`${ready.score}% exam/study readiness`);
    if(value?.contributionLabel)reasons.push(`Indicative career-value signal ${value.contributionLabel} after ${value.overlap}% portfolio overlap`);
    if(hours<=40)reasons.push(`~${Math.round(hours)}h remaining effort`);
    if(!dep.satisfied)reasons.push(`Blocked by: ${dep.missing.map(id=>CERTS.find(c=>c.id===id)?.name||id).join(', ')}`);
    if(['STALE','UNKNOWN'].includes(health.freshness))reasons.push('Verify certification data before booking');
    return Object.freeze({cert,id:cert.id,name:cert.name,score:Math.round(total),available:dep.satisfied&&!passes?.[cert.id]&&!state.skipped?.[cert.id],dependencies:dep,directUnlocks:Object.freeze(unlocks.map(x=>x.id)),relevance,career,tandem,health,marketValue:value,readiness:ready,estimatedHours:hours,phaseDistance,effectivePhase,inPath,horizon,portfolioClass,experienceGate,breakdown:Object.freeze(breakdown),reasons:Object.freeze(reasons)});
  }

  function recommend(options={}){const limit=Number(options.limit||5);const includeBlocked=!!options.includeBlocked;const goal=options.goal||currentGoal();const passes=options.passes||state.passes;const horizon=options.horizon||'now';return CERTS.filter(cert=>!passes?.[cert.id]&&!state.skipped?.[cert.id]).map(cert=>score(cert,{goal,passes,horizon})).filter(item=>includeBlocked||item.available).sort((a,b)=>b.score-a.score||b.tandem.weaker-a.tandem.weaker||b.tandem.strength-a.tandem.strength||b.relevance.percent-a.relevance.percent||a.name.localeCompare(b.name)).slice(0,limit);}
  function recommendForHorizon(horizon='now',options={}){if(!HORIZONS[horizon])throw new Error(`Unknown recommendation horizon: ${horizon}`);return recommend({...options,horizon});}
  function recommendationsByHorizon(options={}){return Object.freeze(Object.fromEntries(Object.keys(HORIZONS).map(key=>[key,recommendForHorizon(key,{...options,limit:options.limit||3})])));}
  function explainTop(options={}){const goal=options.goal||currentGoal();const horizon=options.horizon||'now';const picks=recommend({...options,goal,horizon,limit:2});if(!picks.length)return null;const [top,runnerUp=null]=picks;const opportunityCost=runnerUp?`${top.name} currently scores ${Math.max(0,top.score-runnerUp.score)} points higher than ${runnerUp.name} for ${HORIZONS[horizon]?.label.toLowerCase()||horizon}, with market access and job-performance capability weighted in tandem.`:'No other currently available certification outranks this combined career-and-capability choice.';return Object.freeze({goal,goalLabel:GOALS[goal].label,horizon,horizonLabel:HORIZONS[horizon]?.label,top,runnerUp,opportunityCost});}
  function scenario(goalKey){if(!GOALS[goalKey])throw new Error(`Unknown goal profile: ${goalKey}`);return {goal:goalKey,label:GOALS[goalKey].label,coverage:CT.competency.goalCoverage(goalKey),recommendations:recommend({goal:goalKey,limit:10})};}

  if(typeof priorityScore==='function'){const legacyPriority=priorityScore;priorityScore=cert=>{if(cert?.gateway)return 5;if(cert?.track==='CORE')return 4;if(['FOUNDATION','ARCHITECT'].includes(cert?.track))return 4;if(cert?.track==='IDENTITY-SEC')return 3;return legacyPriority(cert);};}

  CT.recommendations=Object.freeze({GOALS,HORIZONS,currentGoal,setGoal,dependencies,directUnlocks,goalRelevance,curriculumPoints,tandemProfile,tandemPoints,score,recommend,recommendForHorizon,recommendationsByHorizon,explainTop,scenario});
})(window);
