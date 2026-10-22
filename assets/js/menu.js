import { json, entries, esc, money, picture, showError } from './content.js';
const content=document.querySelector('[data-menu-sections]');
const normal=value=>String(value).toLocaleLowerCase('ru').replaceAll('ё','е').trim();
try {
  const [data,dishes]=await Promise.all([json('content/menu/categories.json'),entries('menu/dishes')]);
  const categories=data.categories.sort((a,b)=>a.order-b.order);
  document.querySelector('[data-categories]').innerHTML=categories.map(c=>`<a href="#${esc(c.id)}">${esc(c.title)}</a>`).join('');
  const search=document.querySelector('#dish-search');
  function render(){
    const query=normal(search.value);const shown=dishes.filter(d=>normal(d.title).includes(query));
    content.innerHTML=categories.map(c=>{
      const items=shown.filter(d=>d.category===c.id).sort((a,b)=>a.order-b.order);
      return `<section class="menu-category" id="${esc(c.id)}" ${items.length?'':'hidden'}><div class="category-heading"><h2>${esc(c.title)}</h2><p>${esc(c.description)}</p><span>${String(items.length).padStart(2,'0')}</span></div><div class="dish-grid">${items.map(d=>`<article class="dish-card ${d.available?'':'dish-unavailable'}">${picture(d.image,d.image_alt)}<div class="dish-content"><div class="dish-title"><h3>${esc(d.title)}</h3><span class="price">${money(d.price)}</span></div><p>${esc(d.description)}</p>${!d.available?'<span class="availability">Сейчас нет в наличии</span>':''}</div></article>`).join('')}</div></section>`;
    }).join('')+(!shown.length?'<p class="empty-state">Ничего не нашли. Попробуйте другое название или очистите поиск.</p>':'');
    document.querySelector('[data-menu-count]').textContent=`Найдено блюд: ${shown.length}`;
    document.querySelectorAll('[data-categories] a').forEach(a=>{const has=shown.some(d=>d.category===a.hash.slice(1));a.classList.toggle('is-empty',!has);a.setAttribute('aria-disabled',String(!has));});
  }
  search.addEventListener('input',render);render();
  document.querySelector('[data-categories]').addEventListener('click',event=>{const a=event.target.closest('a');if(a?.getAttribute('aria-disabled')==='true')event.preventDefault();});
  if(location.hash){document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();}
}catch(error){showError(content);document.querySelector('[data-menu-count]').textContent='Меню временно недоступно';console.error(error);}
