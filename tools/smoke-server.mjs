// Serve the production CSP unchanged over HTTPS, including in WebKit.
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
https.createServer({key:fs.readFileSync('/tmp/certtracker-smoke.key'),cert:fs.readFileSync('/tmp/certtracker-smoke.crt')},(req,res)=>{
  try{
    const url=new URL(req.url,'https://localhost'),name=decodeURIComponent(url.pathname);
    const file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    const data=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);
  }catch{res.writeHead(404).end();}
}).listen(4173,()=>console.log('HTTPS smoke server ready'));
