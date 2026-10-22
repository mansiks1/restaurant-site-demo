import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const groups=['menu/dishes','events','blog'];
const index={};
for(const group of groups){
  index[group]=(await fs.readdir(path.join(root,'content',group))).filter(f=>f.endsWith('.md')).map(f=>f.slice(0,-3)).sort();
}
await fs.writeFile(path.join(root,'content/index.json'),JSON.stringify(index,null,2)+'\n');
const origin='https://mansiks1.github.io/restaurant-site-demo/';
const locations=['','menu/','events/','blog/','about/','contacts/','gallery/',
  ...index.events.map(slug=>'events/event.html?slug='+encodeURIComponent(slug)),
  ...index.blog.map(slug=>'blog/post.html?slug='+encodeURIComponent(slug))];
const xml=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
await fs.writeFile(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+locations.map(location=>`  <url><loc>${xml(origin+location)}</loc></url>`).join('\n')+'\n</urlset>\n');
console.log('Индекс и sitemap.xml обновлены. Сборка сайта не требуется.');
