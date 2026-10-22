import { url, esc, entries, entry, money, dateLabel, contacts } from './content.js';
import { loadDishes } from './menu-data.js';

const brand = `<a class="brand" href="${url('')}" aria-label="Розалия — на главную"><span class="brand-name">Розалия</span></a>`;
const cutlery = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 3v5c0 3 5 3 5 0V3M7.5 3v18M17 3c-3 4-3 8 0 8h2M19 3v18" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>';
const pin = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" stroke-width="1.1"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="1.1"/></svg>';
const active = document.body.dataset.page;
const primaryLinks = [['menu','МЕНЮ'],['about','РЕСТОРАН'],['events','КАЛЕНДАРЬ СОБЫТИЙ'],['contacts','КОНТАКТЫ']];
const allLinks = [['menu','Меню'],['about','Ресторан'],['events','Календарь событий'],['gallery','Галерея'],['blog','Журнал'],['contacts','Контакты']];
const navigation = (links, className) => links.map(([path, title]) => `<a class="${className}" href="${url(path+'/')}" ${active===path?'aria-current="page"':''}>${title}</a>`).join('');
const contact = name => `<span data-contact-value="${name}"></span>`;

const header = document.querySelector('[data-site-header]');
header.innerHTML = `<div class="container header-top"><div class="header-contact"><span class="contact-icon">${cutlery}</span><div class="header-contact-copy">${contact('email')}${contact('phone')}</div></div>${brand}<div class="header-address"><div class="header-address-copy" data-header-address></div><span class="contact-icon">${pin}</span></div></div><div class="container header-nav-row"><button type="button" class="drawer-toggle" aria-expanded="false" aria-controls="site-drawer" aria-label="Открыть меню"><span></span><span></span><span></span></button><nav class="primary-nav" aria-label="Основная навигация">${navigation(primaryLinks,'nav-link')}</nav></div>`;
const footer = document.querySelector('[data-site-footer]');
footer.innerHTML = `<div class="container"><div class="footer-grid"><div>${brand}<p class="footer-intro">Хорошая еда. Неспешные разговоры.<br>Вечера, к которым хочется вернуться.</p></div><div><p class="footer-heading">Загляните к нам</p><p data-footer-address></p><p data-footer-hours>Вс–чт 12:00–23:00<br>Пт–сб 12:00–00:00</p></div><div><p class="footer-heading">Знакомство с Розалией</p><nav class="footer-links" aria-label="Навигация в подвале">${navigation(allLinks,'footer-link')}</nav></div></div><div class="footer-note"><span>© ${new Date().getFullYear()} Розалия</span><span>Демонстрационный проект. Данные ресторана вымышлены.</span></div></div>`;
const scrim = document.createElement('div'); scrim.className='drawer-scrim'; scrim.hidden=true;
const drawer = document.createElement('aside'); drawer.className='site-drawer'; drawer.id='site-drawer'; drawer.hidden=true;
drawer.setAttribute('role','dialog'); drawer.setAttribute('aria-modal','true'); drawer.setAttribute('aria-label','Навигация по сайту');
drawer.innerHTML = `<button class="drawer-close" type="button" aria-label="Закрыть меню">×</button>${brand}<nav class="drawer-nav" aria-label="Боковое меню">${navigation(allLinks,'drawer-link')}</nav><div class="drawer-contact"><p class="eyebrow">Контакты</p>${contact('email')}${contact('phone')}${contact('address')}<p class="muted" data-drawer-demo>Демонстрационные контакты</p></div>`;
header.after(scrim,drawer);

function renderContacts() {
  for (const node of document.querySelectorAll('[data-contact-value]')) {
    const key=node.dataset.contactValue; node.replaceChildren();
    const value=String(contacts[key]||'');
    let href='';
    if(!contacts.demo&&key==='phone') { const number=value.replace(/[^+\d]/g,''); if(/^\+?\d{7,15}$/.test(number))href='tel:'+number; }
    if(!contacts.demo&&key==='email'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))href='mailto:'+value;
    if(href){const link=document.createElement('a');link.href=href;link.textContent=value;node.append(link);}else node.textContent=value;
  }
  const address=document.querySelector('[data-header-address]'); address.replaceChildren();
  const parts=String(contacts.address).split(',');
  for(const line of [parts.shift(),parts.join(',')]){const row=document.createElement('span');row.textContent=line.trim();address.append(row);}
  document.querySelector('[data-footer-address]').textContent=contacts.address+(contacts.demo?' · Демонстрационный адрес':'');
  document.querySelector('[data-drawer-demo]').hidden=!contacts.demo;
}
renderContacts();
entry(new URL('../../content/pages/contacts.md',import.meta.url)).then(page=>{
  for(const key of ['email','phone','address','demo'])if(page[key]!==undefined)contacts[key]=page[key];
  renderContacts();document.querySelector('[data-footer-hours]').textContent=page.hours;
}).catch(()=>{});

const toggle = document.querySelector('.drawer-toggle');
const main = document.querySelector('main');
function closeMenu(restore=false) {
  drawer.hidden=true;drawer.classList.remove('is-open');scrim.hidden=true;
  header.inert=false;main.inert=false;footer.inert=false;document.body.classList.remove('nav-open');
  toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню');
  if(restore)toggle.focus();
}
function openMenu() {
  drawer.hidden=false;drawer.classList.add('is-open');scrim.hidden=false;
  toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Закрыть меню');
  header.inert=true;main.inert=true;footer.inert=true;document.body.classList.add('nav-open');
  drawer.querySelector('.drawer-close').focus();
}
toggle.addEventListener('click',openMenu);
drawer.querySelector('.drawer-close').addEventListener('click',()=>closeMenu(true));
scrim.addEventListener('click',()=>closeMenu(true));
drawer.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
document.addEventListener('keydown',event=>{
  if(drawer.hidden)return;
  if(event.key==='Escape'){event.preventDefault();closeMenu(true);return;}
  if(event.key==='Tab'){
    const controls=[...drawer.querySelectorAll('button,a[href]')];const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
matchMedia('(min-width:1024px)').addEventListener('change',()=>closeMenu());

if(active==='home'){
  entry('content/pages/home.md').then(page=>{document.querySelector('[data-home-description]').textContent=page.description;const title=document.querySelector('[data-home-title]');const accent=document.createElement('em');accent.textContent=page.title_accent;title.replaceChildren(document.createTextNode(page.title+' '),document.createElement('br'),accent);document.querySelector('[data-home-story-title]').textContent=page.story_title;const story=document.querySelector('[data-home-story]');story.replaceChildren();for(const text of page.story_body.split('\n\n')){const paragraph=document.createElement('p');paragraph.textContent=text;story.append(paragraph);}}).catch(()=>{});
  loadDishes().then(items=>{
    const target=document.querySelector('[data-home-dishes]');target.replaceChildren();
    for(const dish of items.filter(d=>d.available).sort((a,b)=>a.order-b.order).slice(0,3)){
      const article=document.createElement('article');article.className='card';
      const figure=document.createElement('figure');figure.className='image-frame';const img=document.createElement('img');img.src=new URL('../../'+dish.image,import.meta.url);img.alt=dish.image_alt;img.width=960;img.height=720;img.loading='lazy';const caption=document.createElement('figcaption');caption.className='image-label';caption.textContent=dish.image_alt;figure.append(img,caption);
      const body=document.createElement('div');body.className='card-content';const row=document.createElement('div');row.className='home-dish-footer';const h3=document.createElement('h3');const link=document.createElement('a');link.href=url('menu/#'+encodeURIComponent(dish.category));link.textContent=dish.title;h3.append(link);const price=document.createElement('span');price.className='price';price.textContent=money(dish.price);row.append(h3,price);const description=document.createElement('p');description.textContent=dish.description;body.append(row,description);article.append(figure,body);target.append(article);
    }
  }).catch(()=>{document.querySelector('[data-home-dishes]').innerHTML='<p class="notice">Меню временно недоступно. Откройте раздел «Меню» или попробуйте позже.</p>';});
  entries('events').then(items=>{
    const upcoming=items.filter(e=>new Date(e.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,3);
    document.querySelector('[data-home-events]').innerHTML=upcoming.length?upcoming.map(e=>`<a class="event-row" href="${url('events/event.html?slug='+encodeURIComponent(e.slug))}"><time class="event-date" datetime="${esc(e.date)}"><b>${dateLabel(e.date,{day:'2-digit',month:undefined,year:undefined})}</b>${dateLabel(e.date,{day:undefined,month:'short',year:undefined})}</time><div><p>${esc(e.kind)}</p><h3>${esc(e.title)}</h3><p>${dateLabel(e.date,{day:undefined,month:undefined,year:undefined,hour:'2-digit',minute:'2-digit'})} · ${e.price?money(e.price):'Вход свободный'}</p></div><span class="event-row-arrow" aria-hidden="true">↗</span></a>`).join(''):`<p class="notice">Новая афиша скоро появится. А пока выберите вечер для ужина.</p>`;
  }).catch(()=>{document.querySelector('[data-home-events]').innerHTML='<p class="notice">Афиша временно недоступна. Попробуйте открыть раздел «События» позже.</p>';});
}
