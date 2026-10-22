import { entries, esc, url, dateLabel, picture, markdown, showError, setMeta } from './content.js';
const readingTime=body=>`${Math.max(1,Math.ceil(body.replace(/[#*\[\]()]/g,'').split(/\s+/).filter(Boolean).length/160))} мин чтения`;
const content=document.querySelector('[data-post-content]');
try{
  const posts=(await entries('blog')).sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(content){
    const slug=new URLSearchParams(location.search).get('slug');const index=posts.findIndex(p=>p.slug===slug);const post=posts[index];
    if(!post){document.querySelector('[data-post-title]').textContent='Статья не найдена';document.querySelector('[data-post-description]').textContent='Возможно, адрес изменился. Другие истории ждут вас в журнале.';content.innerHTML=`<a class="button" href="${url('blog/')}">Вернуться в журнал</a>`;setMeta('Статья не найдена','Откройте журнал РУНИКИ и выберите статью о сезонной кухне.');}
    else{
      setMeta(post.title,post.description);document.querySelector('[data-post-title]').textContent=post.title;document.querySelector('[data-post-description]').textContent=post.description;document.querySelector('[data-post-crumb]').textContent=post.title;document.querySelector('[data-post-category]').textContent=post.category;
      document.querySelector('[data-post-meta]').innerHTML=`<time datetime="${esc(post.date)}">${dateLabel(post.date+'T12:00:00+03:00')}</time><span aria-hidden="true">·</span><span>${readingTime(post.body)}</span>`;
      content.innerHTML=`${picture(post.image,post.image_alt,'article-cover')}<div class="prose article-body">${markdown(post.body)}</div>`;
      const neighbors=[posts[index+1],posts[index-1]];
      document.querySelector('[data-post-neighbors]').innerHTML=neighbors.map((p,i)=>p?`<a href="${url('blog/post.html?slug='+encodeURIComponent(p.slug))}"><span class="eyebrow">${i?'Следующая статья →':'← Предыдущая статья'}</span><span class="neighbor-title">${esc(p.title)}</span></a>`:'<span></span>').join('');
    }
  }else{
    let category='Все истории';const categories=['Все истории',...new Set(posts.map(p=>p.category))];
    const filters=document.querySelector('[data-blog-filters]');filters.innerHTML=categories.map((c,i)=>`<button class="filter-button" data-category="${esc(c)}" aria-pressed="${i===0}">${esc(c)}</button>`).join('');
    function render(){const shown=category==='Все истории'?posts:posts.filter(p=>p.category===category);
      document.querySelector('[data-blog-list]').innerHTML=shown.length?shown.map(p=>`<article class="card">${picture(p.image,p.image_alt)}<div class="card-content"><div class="card-meta"><time datetime="${esc(p.date)}">${dateLabel(p.date+'T12:00:00+03:00',{year:undefined})}</time><span aria-hidden="true">·</span><span>${esc(p.category)}</span><span aria-hidden="true">·</span><span>${readingTime(p.body)}</span></div><h3><a class="card-title-link" href="${url('blog/post.html?slug='+encodeURIComponent(p.slug))}">${esc(p.title)}</a></h3><p>${esc(p.description)}</p></div></article>`).join(''):'<p class="empty-state">В этой категории пока нет статей.</p>';
      document.querySelector('[data-blog-count]').textContent=`Историй: ${shown.length}`;filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));
    }
    filters.addEventListener('click',event=>{const b=event.target.closest('button');if(b){category=b.dataset.category;render();}});render();
  }
}catch(error){showError(content||document.querySelector('[data-blog-list]'));console.error(error);}
