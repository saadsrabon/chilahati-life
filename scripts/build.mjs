import { readFile, writeFile, mkdir, readdir, cp, access } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const out=resolve(root,'dist'); await mkdir(resolve(out,'src'),{recursive:true});
await cp(resolve(root,'public'),out,{recursive:true});
let vendored=false;try{await access(resolve(out,'vendor/three.module.js'));await access(resolve(out,'vendor/three.core.js'));vendored=true;}catch{}
for(const name of await readdir(resolve(root,'src'))){
 if(name.endsWith('.test.ts'))continue;
 const source=await readFile(resolve(root,'src',name),'utf8');
 if(name.endsWith('.ts')){
  let js=stripTypeScriptTypes(source,{mode:'strip'});
  js=js.replace(/import\s+['"]\.\/style\.css['"];?\s*/g,'');
  js=js.replace(/(from\s*['"])(\.\/?[^'"]+)(['"])/g,(_,a,path,b)=>a+(/\.(js|json|css)$/.test(path)?path:path.replace(/\.ts$/,'')+'.js')+b);
  const target=resolve(out,'src',name.replace(/\.ts$/,'.js'));
  await writeFile(target,js);
  const check=spawnSync(process.execPath,['--check',target],{encoding:'utf8'});
  if(check.status!==0)throw new Error(check.stderr);
 }else if(name.endsWith('.css'))await writeFile(resolve(out,'src',name),source);
}
let html=await readFile(resolve(root,'index.html'),'utf8');
html=html.replace('src="/src/main.ts"','src="./src/main.js"').replace('href="/favicon.svg"','href="./favicon.svg"');
const three=vendored?'./vendor/three.module.js':'https://cdn.jsdelivr.net/npm/three@0.181.0/build/three.module.js';
html=html.replace('</head>','<link rel="stylesheet" href="./src/style.css"/><script type="importmap">'+JSON.stringify({imports:{three}})+'</script></head>');
await writeFile(resolve(out,'index.html'),html);
console.log('Built Chilahati Life: syntax-checked native modules; Three.js '+(vendored?'bundled locally':'loaded from pinned CDN')+'.');

// A single-file preview also works when a local server cannot be reached.
const compiled={};
for(const name of ['scene-assets','simulation','world','ui','main'])compiled[name]=await readFile(resolve(out,'src',name+'.js'),'utf8');
const names=code=>[...code.matchAll(/export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)/g)].map(m=>m[1]);
const clean=code=>code.replace(/^import[^\n]*\n/gm,'').replace(/^export\s+/gm,'');
let bundle="import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.181.0/build/three.module.js';\n";
for(const [name,variable]of [['scene-assets','sceneAssets'],['simulation','simulationModule'],['world','worldModule'],['ui','uiModule']]){
 let pre=name==='world'?'const {bicycle,box,cylinder,material,person,sign,sphere,tree}=sceneAssets;\n':'';
 bundle+='const '+variable+'=(()=>{\n'+pre+clean(compiled[name])+'\nreturn {'+names(compiled[name]).join(',')+'};})();\n';
}
bundle+='const {createWorld}=worldModule;\nconst {person,bicycle,motorcycle,box}=sceneAssets;\nconst {createGameState,performAction,advanceSimulation,saveGame,loadGame,formatTime}=simulationModule;\nconst {mountUI}=uiModule;\n'+clean(compiled.main);
const rawHtml=await readFile(resolve(root,'index.html'),'utf8');
const css=await readFile(resolve(root,'src/style.css'),'utf8');
const standalone=rawHtml.replace(/<script type="module"[^>]*><\/script>/,'<script type="module">'+bundle.replace(/<\/script/gi,'<\\/script')+'</script>').replace('</head>','<style>'+css+'</style></head>').replace('href="/favicon.svg"','href="data:,"');
await writeFile(resolve(out,'standalone.html'),standalone);
console.log('Single-file browser preview: dist/standalone.html');


