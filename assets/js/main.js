import { url, esc, entries, entry, picture, money, dateLabel } from './content.js';

const mark=`<svg class="brand-mark" viewBox="0 0 40 48" fill="none" aria-hidden="true"><path d="M20 44V4M20 5L5 16l15 10 15-10L20 5ZM5 28l15 11 15-11M5 16v12m30-12v12" stroke="currentColor" stroke-width="1.2"/></svg>`;
const brand=`<a class="brand" href="${url('')}" aria-label="РУНИКА — на главную">${mark}<span><span class="brand-name">РУНИКА</span><span class="brand-caption">ресторан · вкус · атмосфера</span></span></a>`;
const links=[['menu','Меню'],['events','События'],['about','О ресторане'],['gallery','Галерея'],['blog','Журнал'],['contacts','Контакты']];
const active=document.body.dataset.page;
document.querySelector('[data-site-header]').innerHTML=`<div class="container header-inner">${brand}<nav class="desktop-nav" id="site-navigation" aria-label="Основная навигация">${links.map(([path,title])=>`<a class="nav-link" href="${url(path+'/')}" ${active===path?'aria-current="page"':''}>${title}</a>`).join('')}<a class="button button-small header-book" href="${url('contacts/#booking')}">Забронировать <span aria-hidden="true">↗</span></a></nav><button class="menu-toggle" aria-expanded="false" aria-controls="site-navigation" aria-label="Открыть меню"><span></span><span></span></button></div>`;
document.querySelector('[data-site-footer]').innerHTML=`<div class="container"><div class="footer-grid"><div>${brand}<p style="margin-top:var(--s-5)">Хорошая еда. Неспешные разговоры.<br>Вечера, к которым хочется вернуться.</p></div><div><p class="footer-heading">Загляните к нам</p><p data-footer-address>Москва, ул. Лесная, 12<br>Демонстрационный адрес</p><p data-footer-hours>Вс–чт 12:00–23:00<br>Пт–сб 12:00–00:00</p></div><div><p class="footer-heading">Знакомство с Руникой</p><nav class="footer-links" aria-label="Навигация в подвале">${links.map(([path,title])=>`<a href="${url(path+'/')}">${title}</a>`).join('')}</nav></div></div><div class="footer-note"><span>© ${new Date().getFullYear()} РУНИКА</span><span>Демонстрационный проект. Данные ресторана вымышлены.</span></div></div>`;
const scrim=document.createElement('div');scrim.className='nav-scrim';scrim.hidden=true;document.querySelector('header').after(scrim);
const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('#site-navigation');
function closeMenu(restore=false){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню');nav.classList.remove('is-open');scrim.hidden=true;document.body.classList.remove('nav-open');if(restore)toggle.focus();}
toggle.addEventListener('click',()=>{const opened=toggle.getAttribute('aria-expanded')==='true';if(opened)closeMenu();else{toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Закрыть меню');nav.classList.add('is-open');scrim.hidden=false;document.body.classList.add('nav-open');}});
document.addEventListener('click',event=>{if(!nav.contains(event.target)&&!toggle.contains(event.target))closeMenu();});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true')closeMenu(true);
  if(event.key==='Tab'&&toggle.getAttribute('aria-expanded')==='true'){
    const controls=[...nav.querySelectorAll('a'),toggle];const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
matchMedia('(min-width: 1101px)').addEventListener('change',()=>closeMenu());
entry('content/pages/contacts.md').then(page=>{
  document.querySelector('[data-footer-address]').textContent=page.address+(page.demo?' · Демонстрационный адрес':'');
  document.querySelector('[data-footer-hours]').textContent=page.hours;
}).catch(()=>{});
if(active==='home'){
  entry('content/pages/home.md').then(page=>{document.querySelector('[data-home-description]').textContent=page.description;document.querySelector('[data-home-title]').innerHTML=esc(page.title)+' <br><em>'+esc(page.title_accent)+'</em>';document.querySelector('[data-home-story-title]').textContent=page.story_title;document.querySelector('[data-home-story]').innerHTML=page.story_body.split('\n\n').map(p=>'<p>'+esc(p)+'</p>').join('');}).catch(()=>{});
  entries('menu/dishes').then(items=>{
    document.querySelector('[data-home-dishes]').innerHTML=items.filter(d=>d.available).sort((a,b)=>a.order-b.order).slice(0,3).map(d=>`<article class="card">${picture(d.image,d.image_alt)}<div class="card-content"><div class="home-dish-footer"><h3><a href="${url('menu/#'+encodeURIComponent(d.category))}">${esc(d.title)}</a></h3><span class="price">${money(d.price)}</span></div><p>${esc(d.description)}</p></div></article>`).join('');
  }).catch(()=>{document.querySelector('[data-home-dishes]').innerHTML='<p class="notice">Меню временно недоступно. Откройте раздел «Меню» или попробуйте позже.</p>';});
  entries('events').then(items=>{
    const upcoming=items.filter(e=>new Date(e.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,3);
    document.querySelector('[data-home-events]').innerHTML=upcoming.length?upcoming.map(e=>`<a class="event-row" href="${url('events/event.html?slug='+encodeURIComponent(e.slug))}"><time class="event-date" datetime="${esc(e.date)}"><b>${dateLabel(e.date,{day:'2-digit',month:undefined,year:undefined})}</b>${dateLabel(e.date,{day:undefined,month:'short',year:undefined})}</time><div><p>${esc(e.kind)}</p><h3>${esc(e.title)}</h3><p>${dateLabel(e.date,{day:undefined,month:undefined,year:undefined,hour:'2-digit',minute:'2-digit'})} · ${e.price?money(e.price):'Вход свободный'}</p></div><span class="event-row-arrow" aria-hidden="true">↗</span></a>`).join(''):`<p class="notice">Новая афиша скоро появится. А пока выберите вечер для ужина.</p>`;
  }).catch(()=>{document.querySelector('[data-home-events]').innerHTML='<p class="notice">Афиша временно недоступна. Попробуйте открыть раздел «События» позже.</p>';});
}
