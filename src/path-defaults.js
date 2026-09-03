// Generic focused curriculum. No personal progress or automatic exam passes.
(function(global){
  'use strict';
  const groups=[
    ['Systems and physical-security foundations',['a-plus','network-plus','mcit','mcde','arcules-csp','mcie','acp'],'Windows, DNS, storage, recovery and IP-video integration'],
    ['Networking and programming foundations',['ccna','security-plus','pcep','az-900','pcap'],'Routing, switching, security fundamentals and reusable Python'],
    ['Azure, identity and endpoint security',['az-104','sc-300','crowdstrike-ccfa','sc-500'],'Administer and secure platforms; Falcon deployment and policy management'],
    ['Professional networking and AI foundations',['ccnp-enterprise','ai-901'],'ENCOR + ENARSI routing depth; practical AI foundations'],
    ['Automation, AI applications and cloud design',['ai-103','pcpp1','az-305'],'Python applications, Microsoft Foundry and resilient Azure design'],
    ['Expert networking capstone',['ccie-enterprise'],'Expert practical networking; qualify and book only when ready']
  ];
  const ids=Object.freeze(groups.flatMap(g=>g[1]));
  const phases=Object.freeze(Object.fromEntries(groups.map(([title,certs,sub],i)=>[i+1,Object.freeze({title,name:title,sub,layer:sub,window:'Self-paced',certs:Object.freeze(certs),artifact:null,roles:null,applyOut:null})])));
  global.CERT_TRACKER_FOCUSED_ROUTE=Object.freeze({id:'network-platform-v1',title:'Network, cloud and automation engineering',ids,phases});
  global.CERT_TRACKER_DEFAULT_PATH=ids;
  global.CERT_TRACKER_DEFAULT_ADDITIONS=Object.freeze([]);
})(window);
