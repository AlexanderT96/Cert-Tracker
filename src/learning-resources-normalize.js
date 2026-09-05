// Cert Tracker — completeness normalizer for learning resources.
// Guarantees every certification and every covered subject has a usable clickable
// study stack even when the catalogue only has sparse vendor metadata.
(function normalizeLearningResources(global){
  'use strict';
  const CT=global.CertTrackerV3,base=CT?.learningResources;if(!base)return;
  function yt(q){return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;}
  function udemy(q){return `https://www.udemy.com/courses/search/?q=${encodeURIComponent(q)}`;}
  function row(label,url,purpose,kind='resource',free=null){return Object.freeze({label,url,purpose,kind,free});}
  function dedupe(rows){const seen=new Set();return rows.filter(x=>x?.url&&/^https:\/\//.test(x.url)&&!seen.has(x.url)&&(seen.add(x.url),true));}
  function markSearch(r){return /youtube\.com\/results|udemy\.com\/courses\/search/.test(r?.url||'')?{...r,label:'Unreviewed search — '+r.label.replace(/search/i,'').trim(),purpose:'Discovery only. Check the creator, date and active exam code before relying on this material.',verified:false}:r;}
  function official(cert){const url=CT.sourceRegistry?.[cert.id]?.url||cert.sourceUrl;return url?row('Official credential and current requirements',url,'Confirm identity, active version, requirements and issuer-provided preparation links','official',true):null;}
  function completeResources(cert,topic,resources){const q=[cert.code,cert.name,topic].filter(Boolean).join(' '),rows=[official(cert),...(resources||[]).map(markSearch),markSearch(row('Video deep-dive search',yt(`${q} tutorial`),'','video',true)),markSearch(row('Structured course search',udemy(`${cert.code||cert.name} ${topic}`),'','course',false)),markSearch(row('Hands-on walkthrough search',yt(`${q} hands-on lab`),'','lab',true))].filter(Boolean);return Object.freeze(dedupe(rows).slice(0,3));}
  function completeStack(cert,stack){const q=[cert.code,cert.name].filter(Boolean).join(' '),rows=[official(cert),...(stack||[]).map(markSearch),markSearch(row('Current full-course search',yt(`${q} full course`),'','video',true)),markSearch(row('Structured course search',udemy(q),'','course',false)),markSearch(row('Hands-on lab search',yt(`${q} hands-on lab`),'','lab',true)),markSearch(row('Practice-question search',yt(`${q} practice questions`),'','practice',true))].filter(Boolean);return Object.freeze(dedupe(rows).slice(0,3));}
  function profile(cert){const p=base.profile(cert);const subjects=Object.freeze(p.subjects.map(s=>Object.freeze({...s,resources:completeResources(cert,s.topic,s.resources)})));return Object.freeze({...p,subjects,stack:completeStack(cert,p.stack)});}
  function subjectCoverage(cert){return profile(cert).subjects;}
  function overallStack(cert){return profile(cert).stack;}
  function topicResources(cert,topic){const p=profile(cert),hit=p.subjects.find(s=>s.topic===topic);return hit?hit.resources:completeResources(cert,topic,base.topicResources(cert,topic));}
  function validate(){return CERTS.every(cert=>{const p=profile(cert);return p.stack.length>=3&&p.subjects.length>0&&p.subjects.every(s=>s.depth>=1&&s.depth<=5&&s.resources.length>=3&&s.resources.some(r=>!/youtube\.com\/results|udemy\.com\/courses\/search/.test(r.url))&&s.resources.every(r=>/^https:\/\//.test(r.url)));});}
  CT.learningResources=Object.freeze({...base,profile,subjectCoverage,overallStack,topicResources,validate});
})(window);
