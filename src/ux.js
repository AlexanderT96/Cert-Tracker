// Cert Tracker v3 — product-quality UX layer: Today, command palette, health and sync.
(function initUX(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before ux.js');
  const esc = CT.util.escapeHtml;

  const STYLE = `
    #ct3-launcher{position:fixed;right:18px;bottom:18px;z-index:9997;border:1px solid rgba(255,255,255,.18);background:rgba(23,17,48,.94);color:#fff;border-radius:999px;padding:10px 14px;font:600 12px/1 IBM Plex Sans,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.32);cursor:pointer;backdrop-filter:blur(14px)}
    #ct3-launcher:hover{transform:translateY(-1px)}
    .ct3-backdrop{position:fixed;inset:0;z-index:9998;background:rgba(5,4,14,.72);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding:8vh 16px 24px;overflow:auto}
    .ct3-panel{width:min(760px,100%);background:#171130;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,.48);color:#f7f4ff;overflow:hidden}
    .ct3-head{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.1)}
    .ct3-title{font:700 18px/1.2 IBM Plex Sans,sans-serif}.ct3-sub{font:500 11px/1.4 IBM Plex Mono,monospace;color:#aaa4c8;margin-top:4px}
    .ct3-close{border:0;background:transparent;color:#c8c1e8;font-size:24px;cursor:pointer;padding:2px 8px}
    .ct3-body{padding:16px 18px 20px;max-height:72vh;overflow:auto}
    .ct3-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ct3-card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:14px}
    .ct3-card h3{font:700 13px IBM Plex Sans,sans-serif;margin:0 0 8px}.ct3-muted{color:#aaa4c8;font-size:12px}.ct3-big{font:700 28px IBM Plex Sans,sans-serif}
    .ct3-list{display:grid;gap:8px}.ct3-row{display:flex;gap:10px;justify-content:space-between;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)}.ct3-row:last-child{border-bottom:0}
    .ct3-pill{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.13);border-radius:999px;padding:3px 7px;font:600 10px IBM Plex Mono,monospace;color:#d8d2f2}.ct3-score{font:700 18px IBM Plex Mono,monospace}
    .ct3-btn{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#fff;border-radius:10px;padding:9px 11px;font:600 12px IBM Plex Sans,sans-serif;cursor:pointer}.ct3-btn:hover{background:rgba(255,255,255,.11)}.ct3-btn.primary{background:#6d5bd0;border-color:#8373dc}.ct3-btn.danger{border-color:#9a5366}
    .ct3-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.ct3-field{display:grid;gap:5px;margin:10px 0}.ct3-field label{font:600 10px IBM Plex Mono,monospace;color:#aaa4c8;text-transform:uppercase}.ct3-field input,.ct3-field select{width:100%;box-sizing:border-box;background:#0f0b22;border:1px solid rgba(255,255,255,.14);color:#fff;border-radius:9px;padding:10px;font:500 13px IBM Plex Sans,sans-serif}
    .ct3-search{width:100%;box-sizing:border-box;background:#0f0b22;border:0;border-bottom:1px solid rgba(255,255,255,.1);color:#fff;padding:15px 18px;font:500 16px IBM Plex Sans,sans-serif;outline:none}.ct3-command{width:100%;text-align:left;border:0;background:transparent;color:#fff;padding:11px 18px;cursor:pointer;display:flex;justify-content:space-between;gap:10px}.ct3-command:hover,.ct3-command.active{background:rgba(255,255,255,.065)}.ct3-command small{color:#9891ba}
    .ct3-health{display:inline-flex;align-items:center;gap:6px;margin-left:8px;vertical-align:middle}.ct3-dot{width:7px;height:7px;border-radius:50%;background:#72d5a1}.ct3-dot.warn{background:#e5bd6d}.ct3-dot.bad{background:#e8798f}
    .ct3-notice{padding:10px 12px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.04);font-size:12px;color:#cbc5e6;margin:10px 0}.ct3-link{color:#b9adff;text-decoration:none}.ct3-link:hover{text-decoration:underline}
    @media(max-width:640px){.ct3-grid{grid-template-columns:1fr}.ct3-backdrop{padding:4vh 10px 18px}.ct3-body{max-height:78vh}#ct3-launcher{right:12px;bottom:12px}}
    @media(prefers-reduced-motion:no-preference){#ct3-launcher,.ct3-btn{transition:.15s ease}}
  `;

  function injectStyle() {
    if (document.getElementById('ct3-style')) return;
    const style = document.createElement('style'); style.id = 'ct3-style'; style.textContent = STYLE; document.head.appendChild(style);
  }

  let activeModal = null;
  let previousFocus = null;
  let todayTimer = null;
  function closeModal() {
    clearInterval(todayTimer);todayTimer=null;
    if (!activeModal) return;
    activeModal.remove(); activeModal = null;
    previousFocus?.focus?.(); previousFocus = null;
  }

  function modal({ title, subtitle = '', body = '', onMount }) {
    closeModal();
    previousFocus = document.activeElement;
    const wrap = document.createElement('div'); wrap.className = 'ct3-backdrop'; wrap.setAttribute('role', 'presentation');
    wrap.innerHTML = `<section class="ct3-panel" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="ct3-head"><div><div class="ct3-title">${esc(title)}</div>${subtitle ? `<div class="ct3-sub">${esc(subtitle)}</div>` : ''}</div><button class="ct3-close" aria-label="Close">×</button></div><div class="ct3-body">${body}</div></section>`;
    wrap.addEventListener('mousedown', e => { if (e.target === wrap) closeModal(); });
    wrap.querySelector('.ct3-close').addEventListener('click', closeModal);
    document.body.appendChild(wrap); activeModal = wrap;
    onMount?.(wrap);
    const focusable = wrap.querySelector('input,select,button,a'); focusable?.focus?.();
    return wrap;
  }

  function dueItems() {
    const exams = CERTS.map(cert => ({ cert, date: state.exams?.[cert.id], days: state.exams?.[cert.id] ? CT.dates.daysUntil(state.exams[cert.id]) : null }))
      .filter(x => x.date && x.days >= 0 && x.days <= 30).sort((a,b) => a.days - b.days);
    const renewals = CERTS.map(cert => ({ cert, info: state.passes?.[cert.id] ? CT.dates.expiryInfo(cert, state.passes[cert.id]) : null }))
      .filter(x => x.info && ['EXPIRED','URGENT','WARN'].includes(x.info.status)).sort((a,b) => (a.info.days ?? 9999) - (b.info.days ?? 9999));
    return { exams, renewals };
  }

  function showToday() {
    const calculatedAt=new Date();
    const explanation = CT.recommendations.explainTop();
    const top = explanation?.top;
    const due = dueItems();
    const health = CT.dataHealth.summary();
    const phase = CT.phases.currentPhase();
    const blockers = CT.phases.phaseBlockers(phase);
    const lastBackup = CT.storage.lastBackupAt();
    const backupAge = lastBackup ? Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000) : null;
    const topic=CT.topicEngine?.next({cert:top?.cert||null});
    const body = `
      <div class="ct3-grid">
        <div class="ct3-card"><h3>Best next move</h3>${top ? `<div class="ct3-big">${esc(top.name)}</div><div class="ct3-muted">Score ${top.score} · M${top.career.M} market · K${top.career.K} capability · ~${Math.round(top.estimatedHours)} focused hours</div><div class="ct3-notice">${esc(top.reasons.slice(0,3).join(' · '))}</div>` : '<div class="ct3-muted">No available recommendation.</div>'}${topic?`<h3>Study alongside it</h3><strong>${esc(topic.topic.title)}</strong><div class="ct3-muted">${esc(topic.topic.actions[0]||topic.topic.why)}</div>`:''}</div>
        <div class="ct3-card"><h3>Phase ${phase}</h3><div class="ct3-big">${blockers.length}</div><div class="ct3-muted">remaining blocker${blockers.length === 1 ? '' : 's'}</div><div class="ct3-list">${blockers.slice(0,3).map(b => `<div class="ct3-row"><span>${esc(b.label)}</span><span class="ct3-pill">${esc(b.type)}</span></div>`).join('') || '<div class="ct3-muted">Phase gate complete.</div>'}</div></div>
        <div class="ct3-card"><h3>Next 30 days</h3><div class="ct3-list">${due.exams.slice(0,4).map(x => `<div class="ct3-row"><span>${esc(x.cert.name)}</span><span>${x.days}d</span></div>`).join('') || '<div class="ct3-muted">No exams due.</div>'}</div></div>
        <div class="ct3-card"><h3>Data confidence</h3><div class="ct3-big">${health.averageConfidence}%</div><div class="ct3-muted">${health.stale} stale · ${health.review} review · ${health.unknown} unknown</div><div class="ct3-muted" style="margin-top:8px">Backup: ${backupAge == null ? 'never exported' : backupAge === 0 ? 'today' : `${backupAge}d ago`}</div></div>
      </div>
      ${due.renewals.length ? `<div class="ct3-card" style="margin-top:12px"><h3>Renewal attention</h3>${due.renewals.slice(0,5).map(x => `<div class="ct3-row"><span>${esc(x.cert.name)}</span><span class="ct3-pill">${esc(x.info.status)} ${x.info.days == null ? '' : `${x.info.days}d`}</span></div>`).join('')}</div>` : ''}
      <div class="ct3-notice" data-today-calculated>Recommendations recalculated ${esc(calculatedAt.toLocaleString())} from your current progress, evidence and bundled certification catalogue. Catalogue sources are not fetched live; check Data health before booking.</div>
      <div class="ct3-card ct-today-market" style="margin-top:12px"><h3>Latest available job-market matches</h3><div data-today-market-status role="status">Checking the published market feed…</div><div data-today-jobs></div></div>
      <div class="ct3-actions"><button class="ct3-btn primary" data-act="refresh-today">Refresh recommendations</button><button class="ct3-btn" data-act="recommend">All recommendations</button><button class="ct3-btn" data-act="health">Data health</button><button class="ct3-btn" data-act="sync">Sync vault</button><button class="ct3-btn" data-act="backup">Export backup</button></div>
      <details class="ct-today-tools"><summary>Additional tools</summary><div class="ct3-actions"><button class="ct3-btn" data-tool="ct-intel-launcher">Plan</button><button class="ct3-btn" data-tool="ct31-market-launcher">Market value</button><button class="ct3-btn" data-tool="ct-career-launcher">Career</button><button class="ct3-btn" data-tool="ct-github-sync-launcher">GitHub sync</button></div></details>`;
    modal({ title: "Today's Recommendations", subtitle: `${explanation?.goalLabel || 'Career plan'} · Cert Tracker v${CT.version.app}`, body, onMount(root) {
      root.dataset.todayRecommendations='true';
      root.querySelector('[data-act="refresh-today"]').addEventListener('click',showToday);
      root.querySelectorAll('[data-tool]').forEach(button=>button.addEventListener('click',()=>{closeModal();document.getElementById(button.dataset.tool)?.click();}));
      root.querySelector('[data-act="recommend"]')?.addEventListener('click', showRecommendations);
      root.querySelector('[data-act="health"]')?.addEventListener('click', showDataHealth);
      root.querySelector('[data-act="sync"]')?.addEventListener('click', showSync);
      root.querySelector('[data-act="backup"]')?.addEventListener('click', () => CT.storage.exportBackup());
      let loading=false;
      const refreshMarket=async()=>{
        if(loading||!root.isConnected)return;loading=true;
        try{
          const feed=await CT.jobMarket.load({force:true});
          if(root!==activeModal||!root.isConnected)return;
          const freshness=CT.jobMarket.freshness(feed),checked=new Date().toLocaleString();
          root.querySelector('[data-today-market-status]').textContent=`${freshness.label}. ${freshness.detail} Checked ${checked}.`;
          const jobs=CT.jobMarket.bestFit(feed,4);
          root.querySelector('[data-today-jobs]').innerHTML=jobs.map(({job,role})=>{
            let url='';try{const parsed=new URL(job.url);if(['https:','http:'].includes(parsed.protocol))url=parsed.href;}catch{}
            return `<div class="ct3-row"><div><strong>${esc(job.title)}</strong><div class="ct3-muted">${esc(job.company||'')} · ${esc(role?.label||'')} · ${esc(job.location||'UK')}</div></div>${url?`<a class="ct3-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">View listing</a>`:''}</div>`;
          }).join('')||'<div class="ct3-muted" style="margin-top:8px">No suitable published matches available. Your learning recommendations still work locally.</div>';
        }catch{if(root===activeModal)root.querySelector('[data-today-market-status]').textContent='Market feed unavailable. Local recommendations remain available.';}
        finally{loading=false;}
      };
      refreshMarket();
      todayTimer=setInterval(()=>{if(document.visibilityState==='visible')refreshMarket();},300000);
    }});
  }

  function showRecommendations() {
    const goal = CT.recommendations.currentGoal();
    const picks = CT.recommendations.recommend({ limit: 8 });
    const options = Object.entries(CT.recommendations.GOALS).map(([key, profile]) => `<option value="${esc(key)}" ${key === goal ? 'selected' : ''}>${esc(profile.label)}</option>`).join('');
    const rows = picks.map((item, index) => `<div class="ct3-card" style="margin-bottom:9px"><div class="ct3-row"><div><strong>${index + 1}. ${esc(item.name)}</strong><div class="ct3-muted">${esc(item.reasons.slice(0,4).join(' · '))}</div></div><div class="ct3-score">${item.score}</div></div><div class="ct3-muted">Effort ~${Math.round(item.estimatedHours)}h · Data confidence ${item.health.confidence}%${item.dependencies.missing.length ? ` · Blocked by ${item.dependencies.missing.length}` : ''}</div></div>`).join('');
    const body = `<div class="ct3-field"><label>Target role</label><select id="ct3-goal">${options}</select></div>${rows || '<div class="ct3-muted">No uncompleted recommendations.</div>'}`;
    modal({ title: 'Recommendation engine', subtitle: 'Scores career relevance, phase, prerequisites, effort, funding and data confidence', body, onMount(root) {
      root.querySelector('#ct3-goal').addEventListener('change', e => { CT.recommendations.setGoal(e.target.value); showRecommendations(); });
    }});
  }

  function showDataHealth() {
    const s = CT.dataHealth.summary();
    const queue = CT.dataHealth.reviewQueue();
    const body = `<div class="ct3-grid"><div class="ct3-card"><h3>Confidence</h3><div class="ct3-big">${s.averageConfidence}%</div><div class="ct3-muted">across ${s.total} certification records</div></div><div class="ct3-card"><h3>Source coverage</h3><div class="ct3-big">${s.total - s.missingSources}/${s.total}</div><div class="ct3-muted">${s.exactSources} cert-level · ${s.vendorSources} vendor-level</div></div></div><div class="ct3-card" style="margin-top:12px"><h3>Review queue</h3>${queue.slice(0,30).map(row => `<div class="ct3-row"><div><strong>${esc(row.name)}</strong><div class="ct3-muted">${esc(row.issues.join(' · '))}</div>${row.sourceUrl ? `<a class="ct3-link" href="${esc(row.sourceUrl)}" target="_blank" rel="noopener">Official source</a>` : ''}</div><span class="ct3-pill">${esc(row.freshness)} · ${row.confidence}%</span></div>`).join('') || '<div class="ct3-muted">No records require review.</div>'}</div><div class="ct3-actions"><button class="ct3-btn" id="ct3-health-export">Export audit CSV</button></div>`;
    modal({ title: 'Certification data health', subtitle: 'Freshness is explicit; unknown data is never silently treated as current', body, onMount(root) { root.querySelector('#ct3-health-export').addEventListener('click', CT.dataHealth.exportAudit); }});
  }

  function showDiagnostics() {
    const d = CT.validation.diagnostics;
    const body = `<div class="ct3-grid"><div class="ct3-card"><h3>Schema</h3><div class="ct3-big">${d.ok ? 'PASS' : 'FAIL'}</div><div class="ct3-muted">${d.certCount} records · ${d.errors.length} errors · ${d.warnings.length} warnings</div></div><div class="ct3-card"><h3>Storage</h3><div class="ct3-big">v${CT.version.storage}</div><div class="ct3-muted">App ${esc(CT.version.app)} · Data ${CT.version.data}</div></div></div>${d.errors.length ? `<div class="ct3-card" style="margin-top:12px"><h3>Errors</h3>${d.errors.map(x => `<div class="ct3-row">${esc(x)}</div>`).join('')}</div>` : ''}${d.warnings.length ? `<div class="ct3-card" style="margin-top:12px"><h3>Warnings</h3>${d.warnings.slice(0,30).map(x => `<div class="ct3-row">${esc(x)}</div>`).join('')}</div>` : ''}`;
    modal({ title: 'Diagnostics', subtitle: 'Runtime schema and migration checks', body });
  }

  function showSync() {
    const cfg = CT.sync.getConfig();
    const connected = CT.sync.isConnected();
    const body = `<div class="ct3-notice">Sync is optional. Vault contents are AES-GCM encrypted in your browser before upload. The vault passphrase and WebDAV password are never written to localStorage.</div><div class="ct3-field"><label>WebDAV vault URL</label><input id="ct3-sync-url" value="${esc(cfg.endpoint)}" placeholder="https://cloud.example.com/remote.php/dav/files/user/cert-tracker.ctvault"></div><div class="ct3-field"><label>Username</label><input id="ct3-sync-user" value="${esc(cfg.username)}"></div><div class="ct3-field"><label>WebDAV password (session only)</label><input id="ct3-sync-password" type="password" autocomplete="current-password"></div><div class="ct3-field"><label>Vault passphrase (10+ chars, session only)</label><input id="ct3-sync-passphrase" type="password" autocomplete="new-password"></div><div class="ct3-field"><label><input id="ct3-sync-auto" type="checkbox" ${cfg.autoSync ? 'checked' : ''}> Auto-sync while this browser session is connected</label></div><div class="ct3-actions"><button class="ct3-btn primary" id="ct3-connect">${connected ? 'Reconnect session' : 'Connect session'}</button><button class="ct3-btn" id="ct3-smart">Smart sync</button><button class="ct3-btn" id="ct3-push">Push</button><button class="ct3-btn" id="ct3-pull">Pull</button></div><div class="ct3-actions"><button class="ct3-btn" id="ct3-vault-export">Encrypted file backup</button><button class="ct3-btn" id="ct3-vault-import">Import encrypted file</button><button class="ct3-btn danger" id="ct3-disconnect">Forget session secrets</button></div><div id="ct3-sync-status" class="ct3-muted" style="margin-top:12px">${connected ? 'Session connected.' : 'Not connected.'}</div>`;
    modal({ title: 'Encrypted sync vault', subtitle: 'WebDAV / Nextcloud / ownCloud compatible', body, onMount(root) {
      const status = root.querySelector('#ct3-sync-status');
      const setStatus = text => status.textContent = text;
      const saveCfg = () => CT.sync.setConfig({ endpoint: root.querySelector('#ct3-sync-url').value, username: root.querySelector('#ct3-sync-user').value, autoSync: root.querySelector('#ct3-sync-auto').checked });
      const connect = () => { saveCfg(); CT.sync.connect({ password: root.querySelector('#ct3-sync-password').value, passphrase: root.querySelector('#ct3-sync-passphrase').value }); setStatus('Session connected. Secrets remain in memory only.'); };
      root.querySelector('#ct3-connect').addEventListener('click', () => { try { connect(); } catch (e) { setStatus(e.message); } });
      root.querySelector('#ct3-smart').addEventListener('click', async () => { try { if (!CT.sync.isConnected()) connect(); setStatus('Syncing…'); const r = await CT.sync.smartSync(); setStatus(`Sync complete: ${r.direction}.`); } catch (e) { setStatus(e.message); } });
      root.querySelector('#ct3-push').addEventListener('click', async () => { try { if (!CT.sync.isConnected()) connect(); setStatus('Uploading encrypted vault…'); await CT.sync.push(); setStatus('Push complete.'); } catch (e) { setStatus(e.message); } });
      root.querySelector('#ct3-pull').addEventListener('click', async () => { try { if (!CT.sync.isConnected()) connect(); setStatus('Downloading encrypted vault…'); await CT.sync.pull(); setStatus('Pull complete.'); } catch (e) { setStatus(e.message); } });
      root.querySelector('#ct3-vault-export').addEventListener('click', async () => { try { const p = root.querySelector('#ct3-sync-passphrase').value; await CT.sync.exportEncryptedVault(p); setStatus('Encrypted backup exported.'); } catch (e) { setStatus(e.message); } });
      root.querySelector('#ct3-vault-import').addEventListener('click', async () => { try { const p = root.querySelector('#ct3-sync-passphrase').value; await CT.sync.importEncryptedVaultFile(p); setStatus('Encrypted backup restored.'); } catch (e) { setStatus(e.message); } });
      root.querySelector('#ct3-disconnect').addEventListener('click', () => { CT.sync.disconnect(); root.querySelector('#ct3-sync-password').value = ''; root.querySelector('#ct3-sync-passphrase').value = ''; setStatus('Session secrets forgotten.'); });
    }});
  }

  const commands = [
    { name: "Today's Recommendations", hint: 'Current progress and latest published market data', action: showToday },
    { name: 'Recommendations', hint: 'Best next certification', action: showRecommendations },
    { name: 'Data health', hint: 'Sources and freshness', action: showDataHealth },
    { name: 'Encrypted sync', hint: 'Multi-device vault', action: showSync },
    { name: 'Undo last change', hint: 'Restore previous saved state', action: () => CT.storage.undoLastChange() },
    { name: 'Export backup', hint: 'JSON recovery copy', action: () => CT.storage.exportBackup() },
    { name: 'Export calendar', hint: 'Exam and expiry ICS', action: () => CT.exports.downloadICS() },
    { name: 'Diagnostics', hint: 'Schema and runtime checks', action: showDiagnostics }
  ];

  function showCertQuickView(cert) {
    const health = CT.dataHealth.record(cert);
    const recommendation = CT.recommendations.score(cert);
    modal({ title: cert.name, subtitle: cert.code || cert.id, body: `<div class="ct3-grid"><div class="ct3-card"><h3>Career score</h3><div class="ct3-big">${recommendation.score}</div><div class="ct3-muted">Goal-aware ranking</div></div><div class="ct3-card"><h3>Data confidence</h3><div class="ct3-big">${health.confidence}%</div><div class="ct3-muted">${esc(health.freshness)} · ${esc(health.sourceLevel)} source</div></div></div><div class="ct3-card" style="margin-top:12px"><h3>Why it ranks here</h3>${recommendation.reasons.map(r => `<div class="ct3-row">${esc(r)}</div>`).join('') || '<div class="ct3-muted">No ranking factors available.</div>'}</div>${health.sourceUrl ? `<div class="ct3-actions"><a class="ct3-btn ct3-link" href="${esc(health.sourceUrl)}" target="_blank" rel="noopener">Open official source</a></div>` : ''}` });
  }

  function showPalette() {
    const body = `<input id="ct3-search" class="ct3-search" placeholder="Search commands or certifications…" autocomplete="off"><div id="ct3-results"></div>`;
    modal({ title: 'Command palette', subtitle: 'Ctrl/⌘ + K', body, onMount(root) {
      const input = root.querySelector('#ct3-search'); const results = root.querySelector('#ct3-results');
      function render() {
        const q = input.value.trim().toLowerCase();
        const commandMatches = commands.filter(c => !q || `${c.name} ${c.hint}`.toLowerCase().includes(q)).slice(0, 8);
        const certMatches = q ? CERTS.filter(c => `${c.name} ${c.code || ''} ${c.vendor || ''}`.toLowerCase().includes(q)).slice(0, 8) : [];
        results.innerHTML = commandMatches.map((c,i) => `<button class="ct3-command" data-command="${i}"><span>${esc(c.name)}</span><small>${esc(c.hint)}</small></button>`).join('') + certMatches.map((c,i) => `<button class="ct3-command" data-cert="${i}"><span>${esc(c.name)}</span><small>${esc(c.code || c.track)}</small></button>`).join('');
        [...results.querySelectorAll('[data-command]')].forEach((el,i) => el.addEventListener('click', () => commandMatches[i].action()));
        [...results.querySelectorAll('[data-cert]')].forEach((el,i) => el.addEventListener('click', () => showCertQuickView(certMatches[i])));
      }
      input.addEventListener('input', render); render(); input.focus();
    }});
  }

  function addLauncher() {
    if (document.getElementById('ct3-launcher')) return;
    const button = document.createElement('button'); button.id = 'ct3-launcher'; button.type = 'button'; button.textContent = "Today's Recommendations"; button.setAttribute('aria-label', "Open Today's Recommendations");button.setAttribute('aria-haspopup','dialog');
    button.addEventListener('click', showToday); document.body.appendChild(button);
  }

  function addHealthBadge() {
    const health = CT.dataHealth.summary();
    const host = document.querySelector('.header-sub');
    if (!host || host.querySelector('.ct3-health')) return;
    const level = health.stale || health.unknown ? 'bad' : health.review ? 'warn' : '';
    const badge = document.createElement('button'); badge.className = 'ct3-health ct3-btn'; badge.type = 'button'; badge.innerHTML = `<span class="ct3-dot ${level}"></span>${health.averageConfidence}% data`;
    badge.addEventListener('click', showDataHealth); host.appendChild(badge);
  }

  function maybeOnboard() {
    if (localStorage.getItem(CT.config.onboardingKey)) return;
    const existing = Object.keys(state.passes || {}).length || Object.keys(state.myPath || {}).length;
    if (existing) { localStorage.setItem(CT.config.onboardingKey, 'migrated'); return; }
    modal({ title: 'Cert Tracker v3', subtitle: 'Your private career operating system', body: `<div class="ct3-card"><h3>What changed</h3><div class="ct3-row">Today view prioritises what matters now.</div><div class="ct3-row">Recommendations adapt to your target role.</div><div class="ct3-row">Certification data exposes freshness and source confidence.</div><div class="ct3-row">Optional encrypted sync keeps devices aligned without a Cert Tracker backend.</div></div><div class="ct3-actions"><button class="ct3-btn primary" id="ct3-onboard-done">Start</button></div>`, onMount(root) { root.querySelector('#ct3-onboard-done').addEventListener('click', () => { localStorage.setItem(CT.config.onboardingKey, '1'); closeModal(); showToday(); }); }});
  }

  function backupReminder() {
    const last = CT.storage.lastBackupAt();
    const age = last ? (Date.now() - new Date(last).getTime()) / 86400000 : Infinity;
    if (age > 14 && typeof showToast === 'function') setTimeout(() => showToast('Backup is overdue — use Today → Export backup'), 1400);
  }

  function init() {
    injectStyle(); addLauncher(); addHealthBadge(); maybeOnboard(); backupReminder();
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); showPalette(); }
      else if (e.key === 'Escape') closeModal();
    });
    CT.events.on('goal-changed', addHealthBadge);
    CT.events.on('state-restored', () => { closeModal(); setTimeout(showToday, 0); });
  }

  CT.ux = Object.freeze({ init, modal, closeModal, showToday, showPalette, showRecommendations, showDataHealth, showSync, showDiagnostics });
})(window);
