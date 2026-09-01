// Cert Tracker — explainable, competency-aware recommendation engine.
(function initRecommendationEngine(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT?.competency) throw new Error('competency-engine.js must load before recommendation-engine.js');

  const GOALS = CT.competency.GOALS;
  const TRACK_WEIGHT = Object.freeze({ CORE:30, FOUNDATION:18, 'ROLE-DRIVEN':22, ARCHITECT:26, 'IDENTITY-SEC':17, CONDITIONAL:12, OPTIONAL:4, 'POST-PLAN':-4 });

  function currentGoal(){const key=localStorage.getItem(CT.config.goalKey)||'convergence';return GOALS[key]?key:'convergence';}
  function setGoal(key){if(!GOALS[key])throw new Error(`Unknown goal profile: ${key}`);localStorage.setItem(CT.config.goalKey,key);CT.events.emit('goal-changed',{key,profile:GOALS[key]});return key;}
  function dependencies(cert,passes=state.passes){const ids=Array.isArray(cert?.deps)?cert.deps:[];const missing=ids.filter(id=>!passes?.[id]);return {ids,missing,satisfied:missing.length===0};}
  function goalRelevance(cert,goalKey=currentGoal()){const fit=CT.competency.goalFit(cert,goalKey);return {matches:fit.matched,score:Math.round(fit.score*.32),percent:fit.score,competencies:fit.competencies};}

  function score(cert,options={}){
    const goalKey=options.goal||currentGoal(); const passes=options.passes||state.passes; const phase=CT.phases?.currentPhase?.()||1;
    const dep=dependencies(cert,passes); const health=CT.dataHealth?.record(cert)||{confidence:70,freshness:'UNKNOWN',sourceLevel:'NONE'};
    const relevance=goalRelevance(cert,goalKey); const portfolio=CERTS.filter(c=>passes?.[c.id]&&c.id!==cert.id);
    const value=CT.marketValue?.marginalContribution(cert,portfolio)||null; const ready=CT.competency.readiness(cert,goalKey); const hours=Math.max(1,ready.remainingHours||CT.util.averageHours(cert));
    const effectivePhase=CT.store.effectivePhase(cert); const phaseDistance=Number(effectivePhase||6)-Number(phase||1); const inPath=CT.phases?.inPath?CT.phases.inPath(cert):!!state.myPath?.[cert.id];
    const breakdown={
      track:TRACK_WEIGHT[cert.track]??0, roi:Math.round(Number(cert.roi||0)*4), competency:relevance.score,
      readiness:Math.round(ready.score*.22), marketSignal:value?Math.min(14,Math.round(value.contributionRange.midpoint/750)):0,
      novelty:value?Math.round((value.novelty-50)/8):0,
      phase:phaseDistance===0?28:phaseDistance===1?11:phaseDistance<0?1:Math.max(-18,5-phaseDistance*6),
      path:inPath?20:-10, employer:cert.employer?12:0, gateway:cert.gateway?12:0,
      efficiency:hours<=20?15:hours<=40?12:hours<=70?8:hours<=110?3:-4,
      scheduled:state.exams?.[cert.id]?10:0, dataConfidence:Math.round((health.confidence-70)/5), dependency:dep.satisfied?8:-90
    };
    let total=Object.values(breakdown).reduce((sum,n)=>sum+n,0); if(passes?.[cert.id])total=-9999;if(state.skipped?.[cert.id])total=-9998;
    const reasons=[];
    if(phaseDistance===0)reasons.push('Current-phase work'); if(cert.employer)reasons.push('Employer-funded'); if(cert.gateway)reasons.push('Gateway certification');
    if(relevance.percent>=35)reasons.push(`${relevance.percent}% target-competency fit`); if(ready.score>=60)reasons.push(`${ready.score}% readiness`);
    if(value?.contributionLabel)reasons.push(`Marginal career-value signal ${value.contributionLabel} after ${value.overlap}% portfolio overlap`);
    if(Number(cert.roi||0)>=8)reasons.push(`High career ROI (${cert.roi}/10)`); if(hours<=40)reasons.push(`~${Math.round(hours)}h remaining effort`);
    if(!dep.satisfied)reasons.push(`Blocked by: ${dep.missing.map(id=>CERTS.find(c=>c.id===id)?.name||id).join(', ')}`);
    if(['STALE','UNKNOWN'].includes(health.freshness))reasons.push('Verify certification data before booking');
    return Object.freeze({cert,id:cert.id,name:cert.name,score:Math.round(total),available:dep.satisfied&&!passes?.[cert.id]&&!state.skipped?.[cert.id],dependencies:dep,relevance,health,marketValue:value,readiness:ready,estimatedHours:hours,phaseDistance,effectivePhase,inPath,breakdown:Object.freeze(breakdown),reasons:Object.freeze(reasons)});
  }

  function recommend(options={}){const limit=Number(options.limit||5);const includeBlocked=!!options.includeBlocked;const goal=options.goal||currentGoal();const passes=options.passes||state.passes;return CERTS.filter(cert=>!passes?.[cert.id]&&!state.skipped?.[cert.id]).map(cert=>score(cert,{goal,passes})).filter(item=>includeBlocked||item.available).sort((a,b)=>b.score-a.score||b.relevance.percent-a.relevance.percent||a.estimatedHours-b.estimatedHours||a.name.localeCompare(b.name)).slice(0,limit);}
  function explainTop(options={}){const goal=options.goal||currentGoal();const picks=recommend({...options,goal,limit:2});if(!picks.length)return null;const [top,runnerUp=null]=picks;const opportunityCost=runnerUp?`${top.name} currently scores ${Math.max(0,top.score-runnerUp.score)} points higher than ${runnerUp.name}, with ${top.marketValue?.novelty||0}% credential novelty.`:'No other currently available certification outranks this choice.';return Object.freeze({goal,goalLabel:GOALS[goal].label,top,runnerUp,opportunityCost});}
  function scenario(goalKey){if(!GOALS[goalKey])throw new Error(`Unknown goal profile: ${goalKey}`);return {goal:goalKey,label:GOALS[goalKey].label,coverage:CT.competency.goalCoverage(goalKey),recommendations:recommend({goal:goalKey,limit:10})};}

  if(typeof priorityScore==='function'){
    const legacyPriority=priorityScore;
    priorityScore=cert=>{if(cert?.gateway)return 5;if(cert?.track==='CORE')return 4;if(['FOUNDATION','ARCHITECT'].includes(cert?.track))return 4;if(cert?.track==='IDENTITY-SEC')return 3;return legacyPriority(cert);};
  }

  CT.recommendations=Object.freeze({GOALS,currentGoal,setGoal,dependencies,goalRelevance,score,recommend,explainTop,scenario});
})(window);
