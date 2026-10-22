import { entry, esc, picture, markdown, imageUrl, showError, setMeta } from './content.js';
const name=document.body.dataset.page;
try{
  const page=await entry(`content/pages/${name}.md`);
  document.querySelector('.page-heading h1').textContent=page.title;
  document.querySelector('.page-intro').textContent=page.description;
  setMeta(name==='about'?'О ресторане':name==='contacts'?'Контакты и бронирование':'Галерея',page.description);
  document.querySelector('[data-page-body]').innerHTML=markdown(page.body);
  if(name==='about')document.querySelector('[data-page-image]').innerHTML=picture(page.image,page.image_alt,'about-image');
  if(name==='contacts'){
    document.querySelector('[data-contact-address]').textContent=page.address;
    document.querySelector('[data-contact-hours]').textContent=page.hours;
    document.querySelector('[data-contact-phone]').textContent=page.phone;
    document.querySelector('[data-contact-email]').textContent=page.email;
  }
  if(name==='gallery'){
    document.querySelector('[data-gallery]').innerHTML=(page.images||[]).map((image,i)=>`<figure class="gallery-item"><button class="gallery-button" data-image="${i}" aria-label="Открыть: ${esc(image.title)}"><img src="${esc(imageUrl(image.image))}" alt="${esc(image.alt)}" width="1200" height="960" loading="lazy" decoding="async"><span class="gallery-zoom" aria-hidden="true">↗</span></button><figcaption><span>${esc(image.title)}</span><span class="muted">${esc(image.alt)}</span></figcaption></figure>`).join('');
    const dialog=document.querySelector('.lightbox');let opener;
    document.querySelector('[data-gallery]').addEventListener('click',event=>{const b=event.target.closest('[data-image]');if(!b)return;opener=b;const image=page.images[Number(b.dataset.image)];dialog.querySelector('img').src=imageUrl(image.image);dialog.querySelector('img').alt=image.alt;dialog.querySelector('[data-lightbox-caption]').textContent=image.title+' · '+image.alt;dialog.showModal();});
    dialog.querySelector('button').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});dialog.addEventListener('close',()=>opener?.focus());
  }
}catch(error){showError(document.querySelector('[data-page-body]'));console.error(error);}
