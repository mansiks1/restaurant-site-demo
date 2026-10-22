import { url, esc, entries, entry, money, dateLabel, contacts } from './content.js';
import { loadDishes } from './menu-data.js';

const brand = `<a class="brand" href="${url('')}" aria-label="Розалия — на главную"><span class="brand-name">Розалия</span></a>`;
const active = document.body.dataset.page;
const primaryLinks = [['menu','Меню'],['about','Ресторан'],['events','События'],['contacts','Контакты']];
const allLinks = [['menu','Меню'],['about','Ресторан'],['events','Календарь событий'],['gallery','Галерея'],['blog','Журнал'],['contacts','Контакты']];
const navigation = (links, className) => links.map(([path, title]) => `<a class="${className}" href="${url(path+'/')}" ${active===path?'aria-current="page"':''}>${title}</a>`).join('');
const contact = name => `<span data-contact-value="${name}"></span>`;

const header = document.querySelector('[data-site-header]');
header.innerHTML = `<div class="container header-inner">${brand}<nav class="primary-nav" aria-label="Основная навигация">${navigation(primaryLinks,'nav-link')}</nav><a class="button header-book" href="${url('contacts/#booking')}">Забронировать</a></div>`;
const footer = document.querySelector('[data-site-footer]');
footer.innerHTML = `<div class="container"><div class="footer-grid"><div>${brand}<p class="footer-intro">Городское бистро для своих.<br>Сезонная кухня и маленькие традиции.</p></div><div><p class="footer-heading">До встречи в Розалии</p><p data-footer-address></p><div class="footer-contact-copy">${contact('phone')}${contact('email')}</div><p data-footer-hours>Вс–чт 12:00–23:00<br>Пт–сб 12:00–00:00</p></div><div><p class="footer-heading">Загляните к нам</p><nav class="footer-links" aria-label="Навигация в подвале">${navigation(allLinks,'footer-link')}</nav></div></div><div class="footer-note"><span>© ${new Date().getFullYear()} Розалия</span><span>Демонстрационный проект. Данные ресторана вымышлены.</span></div></div>`;

function renderContacts() {
  for (const node of document.querySelectorAll('[data-contact-value]')) {
    const key=node.dataset.contactValue; node.replaceChildren();
    const value=String(contacts[key]||'');
    let href='';
    if(!contacts.demo&&key==='phone') { const number=value.replace(/[^+\d]/g,''); if(/^\+?\d{7,15}$/.test(number))href='tel:'+number; }
    if(!contacts.demo&&key==='email'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))href='mailto:'+value;
    if(href){const link=document.createElement('a');link.href=href;link.textContent=value;node.append(link);}else node.textContent=value;
  }
  document.querySelector('[data-footer-address]').textContent=contacts.address+(contacts.demo?' · Демонстрационный адрес':'');
}
renderContacts();
entry(new URL('../../content/pages/contacts.md',import.meta.url)).then(page=>{
  for(const key of ['email','phone','address','demo'])if(page[key]!==undefined)contacts[key]=page[key];
  renderContacts();document.querySelector('[data-footer-hours]').textContent=page.hours;
}).catch(()=>{});

if(active==='home'){
  entry('content/pages/home.md').then(page=>{document.querySelector('[data-home-description]').textContent=page.description;const title=document.querySelector('[data-home-title]');const accent=document.createElement('em');accent.textContent=page.title_accent;title.replaceChildren(document.createTextNode(page.title+' '),document.createElement('br'),accent);document.querySelector('[data-home-story-title]').textContent=page.story_title;const story=document.querySelector('[data-home-story]');story.replaceChildren();for(const text of page.story_body.split('\n\n')){const paragraph=document.createElement('p');paragraph.textContent=text;story.append(paragraph);}}).catch(()=>{});
  loadDishes().then(items=>{
    const target=document.querySelector('[data-home-dishes]');target.replaceChildren();
    const available = items.filter(d=>d.available).sort((a,b)=>a.order-b.order);
    const selection = available.filter(d=>d.chef_choice === true);
    for(const dish of (selection.length ? selection : available).slice(0,3)){
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
