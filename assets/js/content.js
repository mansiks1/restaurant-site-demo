import { load, JSON_SCHEMA } from './vendor/js-yaml.mjs';
import { marked } from './vendor/marked.esm.js';
import DOMPurify from './vendor/purify.es.mjs';

export const contacts = { email: 'hello@rosalia.example', phone: '+7 (000) 000-00-00', address: 'Москва, ул. Лесная, 12', demo: true };

export const ROOT = new URL('../../', import.meta.url);
export const url = path => new URL(String(path).replace(/^\/+/, ''), ROOT).href;
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money = value => `${new Intl.NumberFormat('ru-RU').format(Number(value) || 0)} ₽`;
export const dateLabel = (value, options = {}) => new Intl.DateTimeFormat('ru-RU', {day:'numeric', month:'long', year:'numeric', timeZone:'Europe/Moscow', ...options}).format(new Date(value));
export const moscowDay = value => new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Moscow', year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
export const picture = (src, alt, cls = '', width = 960, height = 720) => `<figure class="image-frame ${esc(cls)}" data-reveal><img src="${esc(imageUrl(src))}" alt="${esc(alt)}" width="${width}" height="${height}" loading="lazy" decoding="async"><figcaption class="image-label">${esc(alt)}</figcaption></figure>`;
export function imageUrl(path) {
  const clean = String(path || 'assets/img/interior.webp').replace(/^\/+/, '');
  return clean.startsWith('assets/img/') && !clean.includes('..') ? url(clean) : url('assets/img/interior.webp');
}
export function markdown(text) {
  const clean = DOMPurify.sanitize(marked.parse(String(text || ''), {breaks:false}), {USE_PROFILES:{html:true}, FORBID_TAGS:['style','form','iframe'], FORBID_ATTR:['style']});
  const fragment = document.createElement('template'); fragment.innerHTML = clean;
  fragment.content.querySelectorAll('img').forEach(img => { img.src=imageUrl(img.getAttribute('src')); img.loading='lazy'; img.dataset.reveal=''; img.decoding='async'; img.width=960; img.height=720; if(!img.alt)img.alt='Иллюстрация к материалу'; });
  fragment.content.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (/^(javascript|data|vbscript):/i.test(href)) a.removeAttribute('href');
    else if (href.startsWith('/assets/')) a.href = url(href);
  });
  return fragment.innerHTML;
}
const cache = new Map();
let indexPromise;
export function contentIndex(){
  if(indexPromise)return indexPromise;
  indexPromise=(async()=>{
    const fallback=await json('content/index.json');
    // New Decap entries are discovered at runtime after public GitHub Pages publication.
    // Local/private previews use the checked-in manifest; no access token is sent to visitors.
    if(location.hostname!=='mansiks1.github.io')return fallback;
    const key='rosalia-content-index-v1';
    try{
      const saved=JSON.parse(sessionStorage.getItem(key)||'null');
      if(saved&&Date.now()-saved.time<120000)return saved.index;
      const response=await fetch('https://api.github.com/repos/mansiks1/restaurant-site-demo/git/trees/main?recursive=1',{signal:AbortSignal.timeout(5000)});
      if(!response.ok)throw Error('GitHub content index unavailable');
      const result=await response.json();if(result.truncated)throw Error('Repository index truncated');
      const index={};
      for(const group of Object.keys(fallback))index[group]=result.tree.filter(f=>f.type==='blob'&&f.path.startsWith(`content/${group}/`)&&f.path.endsWith('.md')&&!f.path.slice(`content/${group}/`.length).includes('/')).map(f=>f.path.split('/').pop().slice(0,-3));
      try{sessionStorage.setItem(key,JSON.stringify({time:Date.now(),index}));}catch{}
      return index;
    }catch{return fallback;}
  })();return indexPromise;
}
export async function json(path) { const response=await fetch(url(path)); if(!response.ok) throw Error(`Не удалось загрузить ${path}`); return response.json(); }
export async function entry(path) {
  const response=await fetch(url(path)); if(!response.ok) throw Error(`Не удалось загрузить ${path}`);
  const source=await response.text(); const match=source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if(!match) throw Error('Неверный формат Markdown');
  return {...load(match[1],{schema:JSON_SCHEMA}), body:match[2], slug:path.split('/').pop().replace(/\.md$/, '')};
}
export async function entries(group) {
  if(cache.has(group))return cache.get(group);
  const task=(async()=>{
    const manifest=await contentIndex();
    const names=manifest[group] || [];
    const results=await Promise.allSettled(names.map(name=>entry(`content/${group}/${name}.md`)));
    const loaded=results.filter(result=>result.status==='fulfilled').map(result=>result.value);
    if(names.length&&!loaded.length)throw Error(`Не удалось загрузить раздел ${group}`);
    return loaded;
  })(); cache.set(group, task); return task;
}
export function showError(element, message='Не удалось загрузить содержимое. Обновите страницу или свяжитесь с рестораном через раздел «Контакты».') { element.innerHTML=`<p class="notice error-state" role="alert">${esc(message)}</p>`; }
export function setMeta(title, description) {
  document.title=`${title} — Розалия`; document.querySelector('meta[name="description"]').content=description;
  const ogTitle=document.querySelector('meta[property="og:title"]');if(ogTitle)ogTitle.content=document.title;
  const ogDescription=document.querySelector('meta[property="og:description"]');if(ogDescription)ogDescription.content=description;
  const canonical=document.querySelector('link[rel="canonical"]');
  if(canonical){const path=location.pathname.replace(ROOT.pathname,'');canonical.href='https://mansiks1.github.io/restaurant-site-demo/'+path+location.search;}
}
