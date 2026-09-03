// Cert Tracker — constraint-aware, dual-pillar certification sequence planner.
(function initPlanner(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT?.competency) throw new Error('competency-engine.js must load before planner.js');

  function settings(overrides={}) {
    const current = state.plannerSettings || {};
    const weeklyHours = Math.max(.5, Number(overrides.weeklyHours ?? current.weeklyHours ?? state.pace2 ?? 6));
    const rawBudget = overrides.budget ?? current.budget;
    const budget = rawBudget === '' || rawBudget == null ? Infinity : Math.max(0,Number(rawBudget)||0);
    const targetDate = String(overrides.targetDate ?? current.targetDate ?? '');
    const maxCerts = Math.max(1,Math.min(30,Number(overrides.maxCerts ?? current.maxCerts ?? 8)||8));
    return Object.freeze({ weeklyHours,budget,targetDate,maxCerts });
  }

  function horizonHours(cfg) {if (!cfg.targetDate || !CT.util.validIsoDate(cfg.targetDate)) return Infinity;const days = Math.max(0, CT.dates.daysUntil(cfg.targetDate));return Math.max(0, days/7*cfg.weeklyHours);}
  function effectiveCost(cert) {const r=CT.credentials.record(cert);return r.funding==='employer'?0:r.cost!=null?Number(r.cost):cert.free?0:cert.costNum>0?Number(cert.costNum):Infinity;}

  function plan(options={}) {
    const cfg=settings(options); const goal=options.goal || CT.recommendations.currentGoal();
    const completed=new Set(Object.keys(state.passes||{}).filter(id=>state.passes[id]));
    const chosen=[]; let usedHours=0,usedBudget=0; const maxHours=horizonHours(cfg); let passes={...(state.passes||{})};

    for (let step=0;step<cfg.maxCerts;step++) {
      const lockedNext=CT.focusedRoute?.enabled()?CT.focusedRoute.next(passes):null;
      const pool=CERTS.filter(cert=>(!CT.focusedRoute?.enabled()||cert.id===lockedNext?.id)&&CT.credentials.eligibility(cert,passes).eligible&&!completed.has(cert.id)&&!state.skipped?.[cert.id]&&(!state.myPath||state.myPath[cert.id]));
      const feasible=pool.filter(cert=>(cert.deps||[]).every(id=>completed.has(id)));
      const ranked=feasible.map(cert=>{
        const rec=CT.recommendations.score(cert,{goal,passes,horizon:'now'});
        const marginal=CT.marketValue.marginalContribution(cert,[...completed].map(id=>CERTS.find(c=>c.id===id)).filter(Boolean));
        const ready=CT.competency.readiness(cert,goal);
        const hours=Math.max(1,ready.remainingHours||Math.round(CT.util.averageHours(cert))||1);
        const cost=effectiveCost(cert);
        const coverage=CT.competency.goalFit(cert,goal).score;
        const market=Number(rec.career?.M||0),knowledge=Number(rec.career?.K||0);
        const tandemWeaker=Number(rec.tandem?.weaker??Math.min(market,knowledge));
        const tandemStrength=Number(rec.tandem?.strength??Math.sqrt(Math.max(0,market*knowledge)));
        const curriculum=Number(rec.breakdown?.curriculum||0);
        // The planner optimises durable earning power: market access and the capability
        // to perform after hire rise together. Readiness and curriculum continuity then
        // determine sequencing among otherwise strong dual-pillar options.
        const score=rec.score + tandemWeaker*4 + tandemStrength*2 + coverage*.30 + ready.score*.20 + curriculum*.50;
        return {cert,rec,marginal,ready,hours,cost,score,market,knowledge,tandemWeaker,tandemStrength,curriculum};
      }).filter(x=>Number.isFinite(x.cost)&&(!x.rec.experienceGate||x.rec.experienceGate.ready||x.rec.career.T!=='T3')&&usedHours+x.hours<=maxHours&&usedBudget+x.cost<=cfg.budget)
        .sort((a,b)=>b.score-a.score||b.tandemWeaker-a.tandemWeaker||b.tandemStrength-a.tandemStrength||b.curriculum-a.curriculum||a.hours-b.hours||a.cost-b.cost);
      if (!ranked.length) break;
      const pick=ranked[0]; completed.add(pick.cert.id); passes[pick.cert.id]='2099-01-01'; usedHours+=pick.hours; usedBudget+=pick.cost;
      const weeks=usedHours/cfg.weeklyHours; const eta=new Date(); eta.setDate(eta.getDate()+Math.ceil(weeks*7));
      chosen.push(Object.freeze({position:chosen.length+1,id:pick.cert.id,name:pick.cert.name,hours:pick.hours,cost:pick.cost,readiness:pick.ready.score,marketValue:pick.market,knowledgeValue:pick.knowledge,tandemStrength:pick.tandemStrength,pillarFloor:pick.tandemWeaker,goalFit:pick.rec.relevance.score,marginalValue:pick.marginal.contributionRange.midpoint,marginalLabel:pick.marginal.contributionLabel,score:Math.round(pick.score),cumulativeHours:Math.round(usedHours),cumulativeCost:Math.round(usedBudget),eta:CT.dates.localDateStamp(eta),portfolioClass:pick.rec.portfolioClass,reasons:pick.rec.reasons.slice(0,4)}));
    }

    const baseline=CT.competency.goalCoverage(goal).score;
    const simulated={...(state.passes||{})}; chosen.forEach(item=>{simulated[item.id]='2099-01-01';});
    const projected=CT.competency.goalCoverage(goal,simulated).score;
    const blocked=CERTS.filter(cert=>state.myPath?.[cert.id]&&!state.passes?.[cert.id]&&!state.skipped?.[cert.id]&&(cert.deps||[]).some(id=>!completed.has(id))).length;
    return Object.freeze({ unknownCosts:CERTS.filter(c=>state.myPath?.[c.id]&&!Number.isFinite(effectiveCost(c))).map(c=>c.id),costBasis:'Indicative exam-only budget; verify regional prices and required training. Employer funding must be confirmed per credential.',goal,goalLabel:CT.competency.GOALS[goal]?.label||goal,settings:cfg,sequence:Object.freeze(chosen),usedHours:Math.round(usedHours),usedBudget:Math.round(usedBudget),baselineCoverage:baseline,projectedCoverage:projected,coverageGain:projected-baseline,blocked,withinTarget:usedHours<=maxHours&&usedBudget<=cfg.budget,optimisation:'dual-pillar' });
  }

  function saveSettings(next) { return CT.store.setPlanner(settings(next)); }
  CT.planner=Object.freeze({ settings,plan,saveSettings,effectiveCost });
})(window);
