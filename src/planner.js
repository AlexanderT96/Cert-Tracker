// Cert Tracker — constraint-aware, learning-first certification sequence planner.
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
  function effectiveCost(cert) {return cert.employer ? 0 : Math.max(0,Number(cert.costNum||0));}

  function plan(options={}) {
    const cfg=settings(options); const goal=options.goal || CT.recommendations.currentGoal();
    const completed=new Set(Object.keys(state.passes||{}).filter(id=>state.passes[id]));
    const chosen=[]; let usedHours=0,usedBudget=0; const maxHours=horizonHours(cfg); let passes={...(state.passes||{})};

    for (let step=0;step<cfg.maxCerts;step++) {
      const pool=CERTS.filter(cert=>!completed.has(cert.id)&&!state.skipped?.[cert.id]&&(!state.myPath||state.myPath[cert.id]));
      const feasible=pool.filter(cert=>(cert.deps||[]).every(id=>completed.has(id)));
      const ranked=feasible.map(cert=>{
        const rec=CT.recommendations.score(cert,{goal,passes,horizon:'now'});
        const marginal=CT.marketValue.marginalContribution(cert,[...completed].map(id=>CERTS.find(c=>c.id===id)).filter(Boolean));
        const ready=CT.competency.readiness(cert,goal);
        const hours=Math.max(1,ready.remainingHours||Math.round(CT.util.averageHours(cert))||1);
        const cost=effectiveCost(cert);
        const coverage=CT.competency.goalFit(cert,goal).score;
        const knowledge=Number(rec.career?.K||0);
        const curriculum=Number(rec.breakdown?.curriculum||0);
        // The planner optimises learning sequence first. Market value is deliberately
        // a small final signal and never outranks curriculum depth or useful ladder continuity.
        const marketTieBreak=Math.min(6,(marginal.contributionRange.midpoint/Math.max(1,hours))/250);
        const score=rec.score + knowledge*4 + coverage*.40 + ready.score*.20 + curriculum*.75 + marketTieBreak;
        return {cert,rec,marginal,ready,hours,cost,score,knowledge,curriculum};
      }).filter(x=>(!x.rec.experienceGate||x.rec.experienceGate.ready||x.rec.career.T!=='T3')&&usedHours+x.hours<=maxHours&&usedBudget+x.cost<=cfg.budget)
        .sort((a,b)=>b.score-a.score||b.knowledge-a.knowledge||b.curriculum-a.curriculum||a.hours-b.hours||a.cost-b.cost);
      if (!ranked.length) break;
      const pick=ranked[0]; completed.add(pick.cert.id); passes[pick.cert.id]='2099-01-01'; usedHours+=pick.hours; usedBudget+=pick.cost;
      const weeks=usedHours/cfg.weeklyHours; const eta=new Date(); eta.setDate(eta.getDate()+Math.ceil(weeks*7));
      chosen.push(Object.freeze({position:chosen.length+1,id:pick.cert.id,name:pick.cert.name,hours:pick.hours,cost:pick.cost,readiness:pick.ready.score,knowledgeValue:pick.knowledge,goalFit:pick.rec.relevance.score,marginalValue:pick.marginal.contributionRange.midpoint,marginalLabel:pick.marginal.contributionLabel,score:Math.round(pick.score),cumulativeHours:Math.round(usedHours),cumulativeCost:Math.round(usedBudget),eta:CT.dates.localDateStamp(eta),portfolioClass:pick.rec.portfolioClass,reasons:pick.rec.reasons.slice(0,4)}));
    }

    const baseline=CT.competency.goalCoverage(goal).score;
    const simulated={...(state.passes||{})}; chosen.forEach(item=>{simulated[item.id]='2099-01-01';});
    const projected=CT.competency.goalCoverage(goal,simulated).score;
    const blocked=CERTS.filter(cert=>state.myPath?.[cert.id]&&!state.passes?.[cert.id]&&!state.skipped?.[cert.id]&&(cert.deps||[]).some(id=>!completed.has(id))).length;
    return Object.freeze({ goal,goalLabel:CT.competency.GOALS[goal]?.label||goal,settings:cfg,sequence:Object.freeze(chosen),usedHours:Math.round(usedHours),usedBudget:Math.round(usedBudget),baselineCoverage:baseline,projectedCoverage:projected,coverageGain:projected-baseline,blocked,withinTarget:usedHours<=maxHours&&usedBudget<=cfg.budget,optimisation:'learning-first' });
  }

  function saveSettings(next) { return CT.store.setPlanner(settings(next)); }
  CT.planner=Object.freeze({ settings,plan,saveSettings,effectiveCost });
})(window);
