// Cert Tracker — explainable, learning-first, competency-aware, role-aware and experience-gated recommendation engine.
(function initRecommendationEngine(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT?.competency) throw new Error('competency-engine.js must load before recommendation-engine.js');

  const GOALS = CT.competency.GOALS;
  const TRACK_WEIGHT = Object.freeze({ CORE:26, FOUNDATION:18, 'ROLE-DRIVEN':22, ARCHITECT:24, 'IDENTITY-SEC':18, CONDITIONAL:14, OPTIONAL:5, 'POST-PLAN':-4 });
  // Knowledge is deliberately the strongest certification-selection input. Market value
  // remains visible, but is a secondary tie-breaker rather than the curriculum driver.
  const HORIZONS = Object.freeze({
    now:Object.freeze({label:'Best to learn now',weights:{K:.35,C:.30,N:.15,E:.10,M:.10}}),
    next:Object.freeze({label:'Best learning for the next role',weights:{K:.35,N:.30,E:.15,C:.10,M:.10}}),
    long:Object.freeze({label:'Best long-term learning investment',weights:{K:.35,E:.35,N:.15,M:.10,C:.05}})
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

  function score(cert,options={}){
    const goalKey=options.goal||currentGoal(); const passes=options.passes||state.passes; const phase=CT.phases?.currentPhase?.()||1;
    const dep=dependencies(cert,passes); const health=CT.dataHealth?.record(cert)||{confidence:70,freshness:'UNKNOWN',sourceLevel:'NONE'};
    const relevance=goalRelevance(cert,goalKey); const portfolio=CERTS.filter(c=>passes?.[c.id]&&c.id!==cert.id);
    const value=CT.marketValue?.marginalContribution(cert,portfolio)||null; const ready=CT.competency.readiness(cert,goalKey); const hours=Math.max(1,ready.remainingHours||CT.util.averageHours(cert));
    const effectivePhase=CT.store.effectivePhase(cert); const phaseDistance=Number(effectivePhase||6)-Number(phase||1); const inPath=CT.phases?.inPath?CT.phases.inPath(cert):!!state.myPath?.[cert.id];
    const career=CT.careerFramework?.scoreCard ? CT.careerFramework.scoreCard(cert) : Object.freeze({M:Number(cert.roi||0),K:Number(cert.roi||0),C:0,N:0,E:0,T:'T2'});
    const horizon=options.horizon||'now'; const experienceGate=CT.capabilityGates?.gateForCert?.(cert)||null; const portfolioClass=CT.capabilityGates?.portfolioClass?.(cert,career)||'SUPPORTING';
    const unlocks=directUnlocks(cert,passes);
    const breakdown={
      track:TRACK_WEIGHT[cert.track]??0,
      knowledgeValue:Math.round(career.K*4),
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
    if(career.K>=8)reasons.push(`High curriculum / practical knowledge value (K${career.K})`);
    if(unlocks.length)reasons.push(`Structured rung unlocking ${unlocks.length} downstream credential${unlocks.length===1?'':'s'}`);
    if(phaseDistance===0)reasons.push('Current-phase learning'); if(cert.employer)reasons.push('Employer-funded learning'); if(cert.gateway)reasons.push('Gateway certification');
    reasons.push(portfolioClass.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()));
    if(career.C>=6)reasons.push(`Strong current-role relevance (C${career.C})`); if(career.N>=7)reasons.push(`Strong next-role leverage (N${career.N})`); if(career.E>=7)reasons.push(`Strong long-term alignment (E${career.E})`);
    if(experienceGate&&!experienceGate.ready)reasons.push(`Experience gate ${experienceGate.score}%: ${experienceGate.label} evidence is not mature enough yet`);else if(experienceGate?.ready)reasons.push(`Experience gate met: ${experienceGate.label}`);
    if(career.T==='T3')reasons.push('Experience-gated: keep as a future curriculum target until practical responsibility catches up');
    if(relevance.percent>=35)reasons.push(`${relevance.percent}% target-competency fit`); if(ready.score>=60)reasons.push(`${ready.score}% exam/study readiness`);
    if(career.M>=8)reasons.push(`Strong secondary market signal (M${career.M})`);
    if(value?.contributionLabel)reasons.push(`Indicative career-value signal ${value.contributionLabel} after ${value.overlap}% portfolio overlap`);
    if(hours<=40)reasons.push(`~${Math.round(hours)}h remaining effort`);
    if(!dep.satisfied)reasons.push(`Blocked by: ${dep.missing.map(id=>CERTS.find(c=>c.id===id)?.name||id).join(', ')}`);
    if(['STALE','UNKNOWN'].includes(health.freshness))reasons.push('Verify certification data before booking');
    return Object.freeze({cert,id:cert.id,name:cert.name,score:Math.round(total),available:dep.satisfied&&!passes?.[cert.id]&&!state.skipped?.[cert.id],dependencies:dep,directUnlocks:Object.freeze(unlocks.map(x=>x.id)),relevance,career,health,marketValue:value,readiness:ready,estimatedHours:hours,phaseDistance,effectivePhase,inPath,horizon,portfolioClass,experienceGate,breakdown:Object.freeze(breakdown),reasons:Object.freeze(reasons)});
  }

  function recommend(options={}){const limit=Number(options.limit||5);const includeBlocked=!!options.includeBlocked;const goal=options.goal||currentGoal();const passes=options.passes||state.passes;const horizon=options.horizon||'now';return CERTS.filter(cert=>!passes?.[cert.id]&&!state.skipped?.[cert.id]).map(cert=>score(cert,{goal,passes,horizon})).filter(item=>includeBlocked||item.available).sort((a,b)=>b.score-a.score||b.career.K-a.career.K||b.relevance.percent-a.relevance.percent||b.career.M-a.career.M||a.name.localeCompare(b.name)).slice(0,limit);}
  function recommendForHorizon(horizon='now',options={}){if(!HORIZONS[horizon])throw new Error(`Unknown recommendation horizon: ${horizon}`);return recommend({...options,horizon});}
  function recommendationsByHorizon(options={}){return Object.freeze(Object.fromEntries(Object.keys(HORIZONS).map(key=>[key,recommendForHorizon(key,{...options,limit:options.limit||3})])));}
  function explainTop(options={}){const goal=options.goal||currentGoal();const horizon=options.horizon||'now';const picks=recommend({...options,goal,horizon,limit:2});if(!picks.length)return null;const [top,runnerUp=null]=picks;const opportunityCost=runnerUp?`${top.name} currently scores ${Math.max(0,top.score-runnerUp.score)} points higher than ${runnerUp.name} for ${HORIZONS[horizon]?.label.toLowerCase()||horizon}, with curriculum value weighted ahead of market value.`:'No other currently available certification outranks this learning choice.';return Object.freeze({goal,goalLabel:GOALS[goal].label,horizon,horizonLabel:HORIZONS[horizon]?.label,top,runnerUp,opportunityCost});}
  function scenario(goalKey){if(!GOALS[goalKey])throw new Error(`Unknown goal profile: ${goalKey}`);return {goal:goalKey,label:GOALS[goalKey].label,coverage:CT.competency.goalCoverage(goalKey),recommendations:recommend({goal:goalKey,limit:10})};}

  if(typeof priorityScore==='function'){const legacyPriority=priorityScore;priorityScore=cert=>{if(cert?.gateway)return 5;if(cert?.track==='CORE')return 4;if(['FOUNDATION','ARCHITECT'].includes(cert?.track))return 4;if(cert?.track==='IDENTITY-SEC')return 3;return legacyPriority(cert);};}

  CT.recommendations=Object.freeze({GOALS,HORIZONS,currentGoal,setGoal,dependencies,directUnlocks,goalRelevance,curriculumPoints,score,recommend,recommendForHorizon,recommendationsByHorizon,explainTop,scenario});
})(window);
