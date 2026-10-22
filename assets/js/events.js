import { entries, esc, url, dateLabel, moscowDay, money, picture, markdown, showError, setMeta } from './content.js';
import { createCalendar } from './calendar.js';
const detail=document.querySelector('[data-event-detail]');
try{
  const events=(await entries('events')).sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(detail){
    const slug=new URLSearchParams(location.search).get('slug');const event=events.find(e=>e.slug===slug);
    if(!event){document.querySelector('[data-detail-title]').textContent='Событие не найдено';document.querySelector('[data-detail-intro]').textContent='Возможно, адрес изменился. Выберите встречу в нашей афише.';detail.innerHTML=`<a class="button" href="${url('events/')}">Вернуться к афише</a>`;setMeta('Событие не найдено','Вернитесь к афише РУНИКИ и выберите ближайшую встречу.');}
    else{
      const past=new Date(event.date)<new Date();setMeta(event.title,event.description);
      document.querySelector('[data-detail-title]').textContent=event.title;document.querySelector('[data-detail-intro]').textContent=event.description;document.querySelector('[data-detail-crumb]').textContent=event.title;document.querySelector('[data-event-kind]').textContent=event.kind;
      detail.innerHTML=`<div>${picture(event.image,event.image_alt,'detail-image')}<div class="prose">${markdown(event.body)}</div></div><aside class="detail-sidebar"><p class="eyebrow">${past?'Встреча состоялась':'Сохраняйте дату'}</p><time datetime="${esc(event.date)}" class="detail-date">${dateLabel(event.date)}</time><p>${dateLabel(event.date,{day:undefined,month:undefined,year:undefined,hour:'2-digit',minute:'2-digit'})} · Москва (UTC+3)</p><div class="detail-price">${event.price?money(event.price):'Вход свободный'}</div><p>${past?'Ждём вас на следующих событиях.':'Бронь стола — через раздел контактов. Еда и напитки оплачиваются по условиям события.'}</p><a class="button" href="${url(past?'events/':'contacts/#booking')}">${past?'Ближайшие события':'Забронировать стол'} <span aria-hidden="true">↗</span></a></aside>`;
    }
  }else{
    let period='upcoming',selected='';const list=document.querySelector('[data-events-list]');const clear=document.querySelector('[data-clear-date]');
    function render(){const now=new Date();const items=selected?events.filter(e=>moscowDay(e.date)===selected):events.filter(e=>period==='upcoming'?new Date(e.date)>=now:new Date(e.date)<now);if(period==='past'&&!selected)items.reverse();
      list.innerHTML=items.length?items.map(e=>`<article class="card">${picture(e.image,e.image_alt)}<div class="card-content"><div class="card-meta"><time datetime="${esc(e.date)}">${dateLabel(e.date,{year:undefined})}</time><span aria-hidden="true">·</span><span>${esc(e.kind)}</span></div><h3><a class="card-title-link" href="${url('events/event.html?slug='+encodeURIComponent(e.slug))}">${esc(e.title)}</a></h3><p>${esc(e.description)}</p></div></article>`).join(''):'<p class="empty-state">На этот период встреч пока нет. Загляните позже или выберите другой день в календаре.</p>';
      document.querySelector('[data-events-count]').textContent=selected?`${dateLabel(selected+'T12:00:00+03:00')} · событий: ${items.length}`:`${period==='upcoming'?'Ближайших':'Прошедших'} событий: ${items.length}`;clear.hidden=!selected;
      document.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',String(!selected&&b.dataset.period===period)));
    }
    const calendar=createCalendar(document.querySelector('[data-calendar]'),events,day=>{selected=day;render();});
    document.querySelectorAll('[data-period]').forEach(b=>b.addEventListener('click',()=>{period=b.dataset.period;selected='';calendar.reset();render();}));
    clear.addEventListener('click',()=>{selected='';calendar.reset();render();});render();
  }
}catch(error){showError(detail||document.querySelector('[data-events-list]'));console.error(error);}
