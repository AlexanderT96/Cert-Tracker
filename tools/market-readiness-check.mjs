import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const files=['src/market-readiness.js','src/job-market.js','src/market-dashboard-ui.js','tools/refresh-job-market.mjs'];
const errors=[];
for(const file of files){if(!fs.existsSync(file)){errors.push(`Missing ${file}`);continue;}try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});}catch(error){errors.push(`${file}: syntax check failed: ${error.stderr?.toString()||error.message}`);}}
const index=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8'),workflow=fs.readFileSync('.github/workflows/job-market-refresh.yml','utf8'),market=fs.readFileSync('src/market-readiness.js','utf8'),jobs=fs.readFileSync('src/job-market.js','utf8'),ui=fs.readFileSync('src/market-dashboard-ui.js','utf8'),refresh=fs.readFileSync('tools/refresh-job-market.mjs','utf8');
for(const f of ['src/market-readiness.js','src/job-market.js','src/market-dashboard-ui.js'])if(!index.includes(f))errors.push(`index.html does not load ${f}`);
for(const f of ['src/market-readiness.js','src/job-market.js','src/market-dashboard-ui.js','data/job-market.json'])if(!sw.includes(f))errors.push(`Service worker does not cache ${f}`);
for(const marker of ['currentValue()','activeAssessment(filterId=state.filter)','nextCertGaps','evidenceGaps','APPLY NOW','REALISTIC STRETCH','BUILD NEXT','marketAccess','capability'])if(!market.includes(marker))errors.push(`Market readiness model missing ${marker}`);
for(const marker of ['bestFit','liveBand','providerSearch','roleForJob','rankJobs'])if(!jobs.includes(marker))errors.push(`Job matching engine missing ${marker}`);
for(const marker of ['CURRENT MARKET VALUE / ROLE READINESS','ACTIVE ROLE MARKET VALUE','ACTIVE ROLE FILTER','CURRENT PATHWAY STATE','NEXT CERTIFICATION GAPS','PRACTICAL EVIDENCE GAPS','LIVE BEST-FIT JOBS','LIVE JOBS FOR ACTIVE ROLE FILTER','IN PROGRESS','Indeed search','Reed search','Adzuna search'])if(!ui.includes(marker))errors.push(`Primary dashboard market surface missing ${marker}`);
if(!workflow.includes("cron: '*/5 * * * *'"))errors.push("Automated market refresh is not scheduled at GitHub Actions' five-minute minimum interval.");
for(const secret of ['secrets.ADZUNA_APP_ID','secrets.ADZUNA_APP_KEY'])if(!workflow.includes(secret))errors.push(`Workflow missing optional aggregator secret reference ${secret}`);
if(/ADZUNA_APP_(?:ID|KEY)\s*[:=]\s*['\"][^$]/.test(workflow))errors.push('Job provider credential appears hard-coded in workflow.');
if(!refresh.includes('www.arbeitnow.co.uk/api/job-board-api'))errors.push('No-key live UK fallback feed is missing.');
if(!refresh.includes('index%8===bucket'))errors.push('Adzuna market refresh does not rotate broad role-query batches.');
if(!refresh.includes("sort_by:'date'"))errors.push('Market refresh is not prioritising fresh listings.');
if(!refresh.includes('refreshTargetMinutes:5'))errors.push('Generated feed does not advertise a five-minute refresh target.');
if(!ui.includes('not sent to the jobs provider'))errors.push('Dashboard does not disclose local-only best-fit matching.');
if(errors.length){console.error(`Market readiness gate failed (${errors.length}):`);errors.forEach(e=>console.error(`- ${e}`));process.exit(1);}console.log('Market readiness gate passed: active-filter role depth, current-value modelling, privacy-preserving best-fit jobs and five-minute automation are enforced.');
