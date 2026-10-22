import { esc, moscowDay } from './content.js';
export function createCalendar(container,events,onSelect,{now=new Date()}={}){
  const today=moscowDay(now);const [year,month]=today.split('-').map(Number);
  let cursor=new Date(Date.UTC(year,month-1,1));let selected='';
  const dates=new Map();events.forEach(event=>{const day=moscowDay(event.date);dates.set(day,[...(dates.get(day)||[]),event]);});
  const fullDate=day=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));
  function render(){
    const y=cursor.getUTCFullYear(),m=cursor.getUTCMonth();
    const title=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric',timeZone:'UTC'}).format(cursor);
    const offset=(cursor.getUTCDay()+6)%7;const length=new Date(Date.UTC(y,m+1,0)).getUTCDate();
    const days=Array.from({length},(_,i)=>{const day=`${y}-${String(m+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;const count=dates.get(day)?.length||0;
      return count?`<button type="button" class="calendar-day has-events ${selected===day?'is-selected':''}" data-day="${day}" aria-pressed="${selected===day}" ${day===today?'aria-current="date"':''} aria-label="${esc(fullDate(day))}, событий: ${count}">${i+1}<span aria-hidden="true">●</span></button>`:`<span class="calendar-day" ${day===today?'aria-current="date"':''} aria-label="${esc(fullDate(day))}, нет событий">${i+1}</span>`;}).join('');
    container.innerHTML=`<div class="calendar-header"><button class="calendar-arrow" type="button" data-month="-1" aria-label="Предыдущий месяц">←</button><h2 class="calendar-title" aria-live="polite">${esc(title)}</h2><button class="calendar-arrow" type="button" data-month="1" aria-label="Следующий месяц">→</button></div><div class="calendar-week" aria-hidden="true">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-days">${'<span aria-hidden="true"></span>'.repeat(offset)}${days}</div>`;
  }
  container.addEventListener('click',event=>{
    const monthButton=event.target.closest('[data-month]');
    if(monthButton){const step=Number(monthButton.dataset.month);cursor=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+step,1));render();container.querySelector(`[data-month="${step}"]`).focus();}
    const dayButton=event.target.closest('[data-day]');
    if(dayButton){selected=dayButton.dataset.day;render();container.querySelector(`[data-day="${selected}"]`).focus();onSelect(selected,dates.get(selected));}
  });
  render();return{reset(){selected='';render();}};
}
