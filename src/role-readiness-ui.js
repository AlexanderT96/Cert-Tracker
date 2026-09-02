// Cert Tracker — presentation layer for the six-level role-readiness ladder.
(function initRoleReadinessUI(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT?.roleReadiness)return;const esc=CT.util.escapeHtml;

  function style(){if(document.getElementById('ct-role-readiness-style'))return;const s=document.createElement('style');s.id='ct-role-readiness-style';s.textContent=`
    .ct-rank-inline{display:inline-flex;align-items:center;gap:5px;margin-left:6px;border:1px solid rgba(71,232,208,.22);border-radius:999px;padding:4px 7px;background:rgba(2,18,23,.35);font:800 9px/1 ui-monospace,monospace;color:var(--accent,#47e8d0);white-space:nowrap}.ct-rank-inline[data-rank="R4"],.ct-rank-inline[data-rank="R5"],.ct-rank-inline[data-rank="R6"]{border-color:rgba(255,190,92,.28);color:var(--amber-text,#f2c36d)}
    .ct-rank-dashboard{margin:0 0 11px;border:1px solid rgba(71,232,208,.14);border-radius:10px;padding:10px;background:rgba(0,0,0,.14)}.ct-rank-dashboard-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start}.ct-rank-dashboard-head strong{display:block;font-size:12px}.ct-rank-dashboard-head small{display:block;margin-top:3px;color:var(--muted,#9eb1bf);font-size:10px;line-height:1.4}.ct-rank-dashboard-score{font:800 10px/1 ui-monospace,monospace;border:1px solid rgba(71,232,208,.22);border-radius:999px;padding:6px 8px;white-space:nowrap}.ct-rank-dashboard-ladder{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;margin-top:9px}.ct-rank-dashboard-step{border:1px solid rgba(255,255,255,.07);border-radius:7px;padding:8px 5px;background:rgba(0,0,0,.12);font:800 9px/1 ui-monospace,monospace;text-align:center;color:var(--muted,#9eb1bf)}.ct-rank-dashboard-step.achieved{color:var(--text,#e8f2f5);border-color:rgba(71,232,208,.2)}.ct-rank-dashboard-step.current{color:var(--accent,#47e8d0);border-color:var(--accent,#47e8d0);box-shadow:0 0 16px rgba(71,232,208,.1)}.ct-rank-dashboard-next{margin-top:8px;color:var(--muted,#9eb1bf);font-size:10px;line-height:1.45}
    .ct-rank-career-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:9px 0;border-top:1px solid rgba(255,255,255,.06)}.ct-rank-career-row:first-child{border-top:0}.ct-rank-career-row strong{display:block;font-size:11px}.ct-rank-career-row small{display:block;color:var(--muted,#9eb1bf);font-size:9px;line-height:1.4;margin-top:3px}.ct-rank-career-badge{font:800 9px/1 ui-monospace,monospace;border:1px solid rgba(71,232,208,.22);border-radius:999px;padding:5px 7px;height:max-content;white-space:nowrap}.ct-rank-all{margin-top:10px;border-top:1px solid rgba(255,255,255,.07);padding-top:8px}.ct-rank-all>summary{cursor:pointer;font-weight:800;font-size:10px;letter-spacing:.06em;color:var(--accent,#47e8d0);padding:4px 0 8px}.ct-rank-all-body{max-height:46vh;overflow:auto;padding-right:3px}
    @media(max-width:700px){.ct-rank-dashboard-head{grid-template-columns:1fr}.ct-rank-dashboard-score{width:max-content}.ct-rank-dashboard-ladder{display:flex;overflow-x:auto;scrollbar-width:none}.ct-rank-dashboard-ladder::-webkit-scrollbar{display:none}.ct-rank-dashboard-step{flex:0 0 58px}.ct-rank-inline{margin-left:0;margin-top:4px}.ct-rank-all-body{max-height:55vh}}
  `;document.head.appendChild(s);}

  function ladderHtml(rank){if(!rank)return'';return `<section class="ct-rank-dashboard" data-role-rank-summary data-rank-signature="${esc(`${rank.roleId}|${rank.key}|${rank.score}|${rank.floor}|${rank.next?.gaps?.join('~')||''}`)}"><div class="ct-rank-dashboard-head"><div><div class="ct-dual-kicker">ROLE READINESS</div><strong>${esc(rank.key)} — ${esc(rank.title)}</strong><small>${esc(rank.description)}</small></div><span class="ct-rank-dashboard-score">${rank.score}% · M/K FLOOR ${rank.floor}%</span></div><div class="ct-rank-dashboard-ladder">${rank.ladder.map(step=>`<span class="ct-rank-dashboard-step${step.achieved?' achieved':''}${step.current?' current':''}" title="${esc(step.title)}">${esc(step.key)}</span>`).join('')}</div><div class="ct-rank-dashboard-next">${rank.next?`<strong>Next: ${esc(rank.next.key)} — ${esc(rank.next.title)}</strong><br>${esc(rank.next.gaps.slice(0,5).join(' · ')||'Hard gates met; continue growing role scope and evidence.')}`:'<strong>Highest readiness gate reached.</strong> Maintain OWNED evidence, strategic scope, commercial judgement and organisational outcomes.'}</div></section>`;}

  function syncActiveRank(market){
    const activeAssessment=CT.marketReadiness.activeAssessment?.(),activeRank=activeAssessment?CT.roleReadiness.rankForRole(activeAssessment.role):null;
    const existing=market.querySelector('[data-role-rank-summary]');
    if(!activeRank){existing?.remove();return;}
    const focus=market.querySelector('[data-market-focus] .ct-market-focus-body');if(!focus)return;
    const signature=`${activeRank.roleId}|${activeRank.key}|${activeRank.score}|${activeRank.floor}|${activeRank.next?.gaps?.join('~')||''}`;
    if(existing?.dataset.rankSignature===signature)return;
    const host=document.createElement('div');host.innerHTML=ladderHtml(activeRank);const next=host.firstElementChild;
    if(existing)existing.replaceWith(next);else focus.insertAdjacentElement('afterbegin',next);
  }

  function syncRoleBadges(market){
    const roles=CT.marketReadiness.roles?.()||[];
    market.querySelectorAll('.ct-market-role').forEach(card=>{
      const label=card.querySelector('strong')?.textContent?.trim();if(!label)return;
      const role=roles.find(x=>x.label===label);if(!role)return;
      const rank=CT.roleReadiness.rankForRole(role),text=rank.key,title=`${rank.title} · ${rank.score}% readiness score`;
      let badge=card.querySelector('.ct-rank-inline');
      if(!badge){badge=document.createElement('span');badge.className='ct-rank-inline';const status=card.querySelector('.ct-market-status');if(status)status.insertAdjacentElement('beforebegin',badge);else card.querySelector('strong')?.insertAdjacentElement('afterend',badge);}
      if(badge.dataset.rank!==rank.key)badge.dataset.rank=rank.key;
      if(badge.textContent!==text)badge.textContent=text;
      if(badge.title!==title)badge.title=title;
    });
  }

  const dashboardInputs=new WeakMap();let revision=0;
  for(const name of ['certtracker:career-context-changed','certtracker:capability-evidence-changed','certtracker:goal-changed'])global.addEventListener(name,()=>{revision++;});
  function dashboard(){if(state.currentTab!=='dashboard')return;const market=document.querySelector('[data-market-dashboard]');if(!market)return;const inputs=JSON.stringify([state,revision]);if(dashboardInputs.get(market)===inputs)return;syncActiveRank(market);syncRoleBadges(market);dashboardInputs.set(market,inputs);}

  function careerRow({role,rank}){return `<div class="ct-rank-career-row"><div><strong>${esc(role.label)}</strong><small>${esc(rank.title)} · readiness ${rank.score}% · M/K floor ${rank.floor}%${rank.next?` · next blocker: ${esc(rank.next.gaps[0]||rank.next.title)}`:''}</small></div><span class="ct-rank-career-badge">${esc(rank.key)}</span></div>`;}
  function career(){
    const modal=document.getElementById('ct-career-modal');if(!modal||modal.querySelector('[data-rank-career-card]'))return;
    const body=modal.querySelector('.ct3-body');if(!body)return;
    const ranked=CT.roleReadiness.all().filter(row=>String(row.role.id||'').startsWith('pv-')),strongest=ranked.slice(0,8);
    const card=document.createElement('div');card.className='ct3-card';card.dataset.rankCareerCard='1';card.style.marginTop='12px';
    card.innerHTML=`<h3>Role readiness</h3><div class="ct3-muted" style="margin-bottom:8px">Six neutral evidence-gated levels (R1–R6) are calculated independently for every role pathway. The role-specific title shows what that level means in the selected domain. Market access and job-performance capability apply at every level; higher levels additionally require progressively stronger USED, DESIGNED and OWNED evidence.</div><div class="ct-dual-kicker" style="margin:8px 0 2px">STRONGEST CURRENT ROLE PATHWAYS</div>${strongest.map(careerRow).join('')}<details class="ct-rank-all"><summary>VIEW ALL ${ranked.length} ROLE PATHWAY LEVELS</summary><div class="ct-rank-all-body">${ranked.map(careerRow).join('')}</div></details>`;
    const roleContext=body.querySelector('.ct3-card');if(roleContext)roleContext.insertAdjacentElement('afterend',card);else body.prepend(card);
  }

  function mount(){style();dashboard();career();}
  let queued=false;function queue(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;mount();});}
  const app=document.getElementById('app');if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true});new MutationObserver(queue).observe(document.body,{childList:true,subtree:false});
  global.addEventListener('certtracker:career-context-changed',queue);global.addEventListener('certtracker:capability-evidence-changed',queue);global.addEventListener('certtracker:goal-changed',queue);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  CT.roleReadinessUI=Object.freeze({ladderHtml,careerRow,mount,syncActiveRank,syncRoleBadges});
})(window);
