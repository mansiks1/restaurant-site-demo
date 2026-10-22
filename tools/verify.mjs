import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { load, JSON_SCHEMA } from '../assets/js/vendor/js-yaml.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=file=>fs.readFile(path.join(root,file),'utf8');
let checks=0;
function check(condition,message){checks++;assert.ok(condition,message);}
async function exists(file){try{await fs.access(path.join(root,file));return true;}catch{return false;}}
async function document(file){const text=await read(file);const match=text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);check(match,`${file}: frontmatter`);return {...load(match[1],{schema:JSON_SCHEMA}),body:match[2]};}
const manifest=JSON.parse(await read('content/index.json'));
const categories=JSON.parse(await read('content/menu/categories.json')).categories;
check(new Set(categories.map(c=>c.id)).size===categories.length,'Unique category IDs');
for(const c of categories){check(/^[a-z][a-z0-9-]*$/.test(c.id),'Valid category anchor');check(c.title&&Number.isFinite(c.order),'Category title/order');}
const dishes=JSON.parse(await read('content/menu/dishes.json')).dishes;
check(Array.isArray(dishes),'Single dishes JSON list');
check(new Set(dishes.map(d=>d.id)).size===dishes.length,'Unique dish IDs');
for(const item of dishes){
  check(item.title&&item.description,'Dish title/description');
  check(categories.some(c=>c.id===item.category),'Known dish category');
  check(Number.isInteger(item.price)&&item.price>=0,'Valid dish price');
  check(typeof item.available==='boolean'&&Number.isFinite(item.order),'Availability/order');
  check(item.image?.endsWith('.webp')&&await exists(item.image),'Local dish WebP');
  check(Boolean(item.image_alt),'Dish image alt');
}
check(!await exists('content/menu/dishes'),'Obsolete Markdown dishes removed');
const menuSource=await read('assets/js/menu.js');
check(!menuSource.includes('innerHTML'),'Menu content uses DOM textContent');
check(menuSource.includes("rootMargin: '200px'"),'Sentinel observer margin');
const documents={};
for(const [group,names] of Object.entries(manifest)){
  const actual=(await fs.readdir(path.join(root,'content',group))).filter(f=>f.endsWith('.md')).map(f=>f.slice(0,-3)).sort();
  check(JSON.stringify([...names].sort())===JSON.stringify(actual),`${group}: complete manifest`);
  check(new Set(names).size===names.length,`${group}: no duplicate slugs`);
  documents[group]=[];
  for(const name of names){
    const file=`content/${group}/${name}.md`,item=await document(file);documents[group].push(item);
    check(item.title&&item.description,`${file}: title/description`);
    check(item.image?.endsWith('.webp')&&await exists(item.image),`${file}: local WebP image`);
    check(item.image_alt?.startsWith('Фото:'),`${file}: demo caption`);
    if(group==='menu/dishes'){
      check(categories.some(c=>c.id===item.category),`${file}: known category`);
      check(Number.isInteger(item.price)&&item.price>=0,`${file}: valid price`);
      check(typeof item.available==='boolean'&&Number.isFinite(item.order),`${file}: availability/order`);
    }else{
      check(Number.isFinite(Date.parse(item.date)),`${file}: valid date`);
      check(item.body.trim().length>100,`${file}: useful text`);
      if(group==='events'){check(/(Z|[+-]\d{2}:\d{2})$/.test(item.date),`${file}: explicit timezone`);check(Number.isInteger(item.price)&&item.price>=0,`${file}: price`);}
      else check(/^\d{4}-\d{2}-\d{2}$/.test(item.date)&&item.category,`${file}: article metadata`);
    }
  }
}
for(const file of ['home','about','contacts','gallery']){const item=await document(`content/pages/${file}.md`);check(item.title&&item.description,`${file}: page content`);}
const html=['index.html','menu/index.html','events/index.html','events/event.html','blog/index.html','blog/post.html','about/index.html','contacts/index.html','gallery/index.html','admin/index.html'];
const titles=new Set();let links=0;
for(const file of html){
  const source=await read(file);const admin=file.startsWith('admin/');
  check((source.match(/<h1\b/g)||[]).length===1,`${file}: exactly one h1`);
  const title=source.match(/<title>(.*?)<\/title>/)?.[1];check(title&&!titles.has(title),`${file}: unique title`);titles.add(title);
  check(/<html lang="ru">/.test(source)&&/<meta name="description" content="[^"]+">/.test(source),`${file}: language/description`);
  for(const image of source.matchAll(/<img\b[^>]*>/g)){const tag=image[0];check(/alt="[^"]+"/.test(tag)&&/width="\d+"/.test(tag)&&/height="\d+"/.test(tag)&&/loading="lazy"/.test(tag),`${file}: image accessibility/dimensions/lazy`);}
  for(const script of source.matchAll(/<script\b[^>]*src="[^"]+"[^>]*>/g))check(/\bdefer\b|type="module"/.test(script[0]),`${file}: nonblocking scripts`);
  for(const m of source.matchAll(/(?:href|src)="([^"]+)"/g)){
    const target=m[1];if(/^(https?:|tel:|mailto:|data:)/.test(target))continue;
    const resolved=new URL(target,'https://local.test/'+file);let local=decodeURIComponent(resolved.pathname.slice(1));if(local.endsWith('/'))local+='index.html';
    check(await exists(local),`${file}: link ${target}`);links++;
    if(resolved.hash&&local.endsWith('.html')){
      const id=decodeURIComponent(resolved.hash.slice(1));const targetSource=await read(local);
      check(targetSource.includes(`id="${id}"`)||(local==='menu/index.html'&&categories.some(c=>c.id===id)),`${file}: anchor ${target}`);
    }
  }
}
for(const file of (await fs.readdir(path.join(root,'assets/js'))).filter(f=>f.endsWith('.js'))){
  const source=await read('assets/js/'+file);
  for(const m of source.matchAll(/from ['"]([^'"]+)['"]/g))check(await exists(path.posix.normalize('assets/js/'+m[1])),`${file}: valid import ${m[1]}`);
}
const config=load(await read('admin/config.yml'));
check(config.backend.repo==='mansiks1/restaurant-site-demo'&&config.backend.branch==='main','Correct CMS repository/branch');
check(config.collections.length===5,'Five CMS collections');check(config.collections.find(c=>c.name==='dishes').files?.[0].file==='content/menu/dishes.json','CMS edits a JSON file');check(config.media_folder==='assets/img/uploads'&&config.public_folder==='assets/img/uploads','Base-path-safe uploads');
function hints(fields){for(const field of fields||[]){check(Boolean(field.hint),`CMS hint: ${field.name}`);hints(field.fields);}}
for(const collection of config.collections){hints(collection.fields);for(const file of collection.files||[])hints(file.fields);}
check(await exists('.nojekyll'),'No Jekyll processing of Markdown');check(await exists('sitemap.xml'),'Sitemap exists');
let imageBytes=0;
for(const file of (await fs.readdir(path.join(root,'assets/img'))).filter(f=>f.endsWith('.webp'))){const bytes=await fs.readFile(path.join(root,'assets/img',file));check(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP',`${file}: real WebP`);imageBytes+=bytes.length;}
check(imageBytes<2500000,'Lightweight placeholder assets');
function luminance(hex){const channels=hex.match(/\w\w/g).map(c=>parseInt(c,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;}
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const pairs=[['text/background','f0ebdf','151914'],['muted/background','bdb6a7','151914'],['muted/raised','bdb6a7','292f24'],['accent/background','d7b584','151914'],['accent/raised','d7b584','292f24'],['button','252a21','d7b584'],['error/background','f2b4a0','151914']];
const contrasts=pairs.map(([pair,a,b])=>{const ratio=contrast(a,b);check(ratio>=4.5,`${pair}: contrast >=4.5`);return{pair,ratio:Number(ratio.toFixed(2))};});
console.log(JSON.stringify({status:'passed',checks,htmlPages:html.length,staticLinks:links,dishes:dishes.length,events:manifest.events.length,posts:manifest.blog.length,imageKB:Math.round(imageBytes/1024),contrasts},null,2));
