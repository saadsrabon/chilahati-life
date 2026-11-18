import { createServer } from 'node:http';
import { readFile,stat } from 'node:fs/promises';
import { resolve,extname,sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { watch } from 'node:fs';
const root=resolve(import.meta.dirname,'..'),dist=resolve(root,'dist');
function build(){const r=spawnSync(process.execPath,[resolve(root,'scripts/build.mjs')],{stdio:'inherit'});return r.status===0;}
if(!build())process.exit(1);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.mp3':'audio/mpeg'};
const port=Number(process.env.PORT||4173);
createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(dist,'.'+(path==='/'?'/index.html':path));
  if(file!==dist&&!file.startsWith(dist+sep)){res.writeHead(403);res.end('Forbidden');return;}
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port));
let timer;
for(const dir of ['src','public'])watch(resolve(root,dir),{recursive:true},()=>{clearTimeout(timer);timer=setTimeout(build,180);});

