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
  function completeResources(cert,topic,resources){const q=[cert.code,cert.name,topic].filter(Boolean).join(' '),rows=[...(resources||[])];if(rows.length<3)rows.push(row('Video deep-dive search',yt(`${q} tutorial`),`Find a current visual explanation for ${topic}`,'video',true));if(rows.length<3)rows.push(row('Structured course search',udemy(`${cert.code||cert.name} ${topic}`),`Compare current highly-rated structured courses for ${topic}`,'course',false));if(rows.length<3)rows.push(row('Hands-on walkthrough search',yt(`${q} hands-on lab`),`Find practical implementation or lab material for ${topic}`,'lab',true));if(rows.length<3)rows.push(row('Exam practice search',yt(`${cert.code||cert.name} practice exam questions`),'Use only as a supplementary readiness check; official objectives remain authoritative','practice',true));return Object.freeze(dedupe(rows).slice(0,5));}
  function completeStack(cert,stack){const q=[cert.code,cert.name].filter(Boolean).join(' '),rows=[...(stack||[])];if(rows.length<3)rows.push(row('Current full-course search',yt(`${q} full course`),'Find a current complete video course','video',true));if(rows.length<3)rows.push(row('Structured course search',udemy(q),'Compare current high-rated structured courses','course',false));if(rows.length<3)rows.push(row('Hands-on lab search',yt(`${q} hands-on lab`),'Add practical configuration or scenario work','lab',true));if(rows.length<3)rows.push(row('Practice-question search',yt(`${q} practice exam questions`),'Supplementary readiness testing','practice',true));return Object.freeze(dedupe(rows).slice(0,7));}
  function profile(cert){const p=base.profile(cert);const subjects=Object.freeze(p.subjects.map(s=>Object.freeze({...s,resources:completeResources(cert,s.topic,s.resources)})));return Object.freeze({...p,subjects,stack:completeStack(cert,p.stack)});}
  function subjectCoverage(cert){return profile(cert).subjects;}
  function overallStack(cert){return profile(cert).stack;}
  function topicResources(cert,topic){const p=profile(cert),hit=p.subjects.find(s=>s.topic===topic);return hit?hit.resources:completeResources(cert,topic,base.topicResources(cert,topic));}
  function validate(){return CERTS.every(cert=>{const p=profile(cert);return p.stack.length>=3&&p.subjects.length>0&&p.subjects.every(s=>s.depth>=1&&s.depth<=5&&s.resources.length>=3&&s.resources.every(r=>/^https:\/\//.test(r.url)));});}
  CT.learningResources=Object.freeze({...base,profile,subjectCoverage,overallStack,topicResources,validate});
})(window);
