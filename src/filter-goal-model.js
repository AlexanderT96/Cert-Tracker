// Cert Tracker — compatibility layer for filter goal labels and current market bands.
// Removes legacy ROI/hour framing so every role/filter describes the same dual-pillar objective.
(function initFilterGoalModel(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.dualPillarDepth||!CT?.marketReadiness||typeof global.goalFor!=='function')return;
  const original=global.goalFor;
  const clean=value=>String(value||'').replace(/[^A-Za-z0-9/&+ .'-]+/g,' ').replace(/\s+/g,' ').trim();
  const k=value=>`£${Math.round(Number(value||0)/1000)}k`;
  const band=market=>market?`${k(market.low)}–${k(market.high)}`:'';
  function itemFor(id){return CT.dualPillarDepth.filterItems().find(item=>item.id===id)||null;}
  function current(filterId){
    const id=filterId||state.filter||'all';
    if(id==='all'||id==='not-passed')return {goal:'Best balanced Market Access + Job-Performance Capability opportunities — market-wide',band:'',track:null};
    if(id==='passed')return {goal:'Credentials already earned — convert them into practical evidence',band:'',track:null};
    if(id==='portfolio')return {goal:'Application-based credentials + demonstrable delivery evidence',band:'',track:null};
    if(id==='group-top-earners')return {goal:'High-earning pathways with balanced market signal and real capability',band:'',track:null};
    if(id==='my-path')return {goal:'OT / Physical-Cyber Convergence Architect',band:'£80k–£135k+',track:null};
    const item=itemFor(id);
    if(item&&typeof item.test==='function'){
      try{
        const path=CT.dualPillarDepth.pathwayProfile(item),role=CT.marketReadiness.roleRowFromPath(path);
        return {goal:clean(path.label)||clean(item.label),band:band(role.market),track:item.group==='cloud'?'A':item.group==='physical'?'B':item.group==='cyber'?'C':null,marketAccess:role.marketAccess,capability:role.capability,readiness:role.score};
      }catch{}
    }
    const fallback=original(id)||{};
    return {...fallback,goal:clean(fallback.goal||id).replace(/Highest £\/hour[^—-]*/i,'Balanced market + capability')};
  }
  global.goalFor=current;
  CT.filterGoals=Object.freeze({current,itemFor});
})(window);
