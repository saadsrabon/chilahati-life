import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const dist=resolve(import.meta.dirname,'../dist');
let html=await readFile(resolve(dist,'index.html'),'utf8');
const jsMatch=html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/);
if(!jsMatch)throw new Error('Built script was not found');
const js=await readFile(resolve(dist,jsMatch[1].replace(/^\.\//,'')),'utf8');
html=html.replace(jsMatch[0],()=>'<script type="module">'+js.replace(/<\/script/gi,'<\\/script')+'</script>');
const cssMatches=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)];
for(const match of cssMatches){const css=await readFile(resolve(dist,match[1].replace(/^\.\//,'')),'utf8');html=html.replace(match[0],()=>'<style>'+css+'</style>');}
await writeFile(resolve(dist,'standalone.html'),html);
console.log('Created standalone.html: bundled 3D engine, gameplay and styles.');

