import { money, imageUrl } from './content.js';
import { loadMenu } from './menu-data.js';

export const BATCH_SIZE = 12;
const normal = value => String(value).toLocaleLowerCase('ru').replaceAll('ё', 'е').trim();
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
};

export function createDishCard(dish) {
  const card = element('article', `dish-card reveal${dish.available ? '' : ' dish-unavailable'}`);
  const figure = element('figure', 'image-frame');
  const image = element('img');
  image.src = imageUrl(dish.image);
  image.alt = String(dish.image_alt || dish.title);
  image.width = 960; image.height = 720; image.loading = 'lazy'; image.decoding = 'async';
  figure.append(image, element('figcaption', 'image-label', dish.image_alt || dish.title));
  const body = element('div', 'dish-content');
  const heading = element('div', 'dish-title');
  heading.append(element('h3', '', dish.title), element('span', 'price', money(dish.price)));
  body.append(heading, element('p', '', dish.description));
  if (!dish.available) body.append(element('span', 'availability', 'Сейчас нет в наличии'));
  card.append(figure, body);
  return card;
}

export function mountMenu({ categories, dishes }, root = document) {
  const content = root.querySelector('[data-menu-sections]');
  const navigation = root.querySelector('[data-categories]');
  const search = root.querySelector('#dish-search');
  const count = root.querySelector('[data-menu-count]');
  const progress = root.querySelector('[data-menu-progress]');
  const sentinel = root.querySelector('#menu-sentinel');
  const more = root.querySelector('[data-menu-more]');
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const supportsObservers = typeof IntersectionObserver !== 'undefined';
  let filtered = [], cursor = 0;
  const sections = new Map();

  const revealObserver = supportsObservers ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.12 }) : null;

  const batchObserver = supportsObservers ? new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) appendBatch();
  }, { rootMargin: '200px' }) : null;

  function appendBatch() {
    batchObserver?.unobserve(sentinel);
    content.setAttribute('aria-busy', 'true');
    const batch = filtered.slice(cursor, cursor + BATCH_SIZE);
    for (const dish of batch) {
      const section = sections.get(dish.category);
      section.wrapper.hidden = false;
      const card = createDishCard(dish);
      section.grid.append(card);
      if (reducedMotion.matches || !revealObserver) card.classList.add('is-visible');
      else revealObserver.observe(card);
    }
    cursor += batch.length;
    content.setAttribute('aria-busy', 'false');
    const hasMore = cursor < filtered.length;
    sentinel.hidden = !hasMore; more.hidden = !hasMore;
    progress.textContent = filtered.length ? `Показано ${cursor} из ${filtered.length}` : '';
    if (hasMore) batchObserver?.observe(sentinel);
  }

  function ensureCategory(id) {
    const index = filtered.findIndex(dish => dish.category === id);
    if (index < 0) return;
    while (cursor <= index) appendBatch();
    sections.get(id).wrapper.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  }

  function render() {
    batchObserver?.disconnect(); revealObserver?.disconnect();
    content.replaceChildren(); navigation.replaceChildren(); sections.clear(); cursor = 0;
    const query = normal(search.value);
    const matching = dishes.filter(dish => normal(dish.title).includes(query));
    filtered = sortedCategories.flatMap(category => matching.filter(dish => dish.category === category.id).sort((a, b) => a.order - b.order));
    for (const category of sortedCategories) {
      const items = filtered.filter(dish => dish.category === category.id);
      const link = element('a', items.length ? '' : 'is-empty', category.title);
      link.href = `#${category.id}`; link.dataset.category = category.id;
      link.setAttribute('aria-disabled', String(!items.length)); navigation.append(link);
      const wrapper = element('section', 'menu-category'); wrapper.id = category.id; wrapper.hidden = true;
      const heading = element('div', 'category-heading');
      heading.append(element('h2', '', category.title), element('p', '', category.description), element('span', '', String(items.length).padStart(2, '0')));
      const grid = element('div', 'dish-grid'); wrapper.append(heading, grid); content.append(wrapper);
      sections.set(category.id, { wrapper, grid });
    }
    count.textContent = `Найдено блюд: ${filtered.length}`;
    if (!filtered.length) content.append(element('p', 'empty-state', 'Ничего не нашли. Попробуйте другое название или очистите поиск.'));
    appendBatch();
  }

  function navigate(event) {
    const link = event.target.closest('[data-category]');
    if (!link) return;
    event.preventDefault();
    if (link.getAttribute('aria-disabled') === 'true') return;
    const id = link.dataset.category;
    history.replaceState(null, '', `#${encodeURIComponent(id)}`); ensureCategory(id);
  }
  function reduceMotion(event) {
    if (!event.matches) return;
    revealObserver?.disconnect(); content.querySelectorAll('.reveal').forEach(card => card.classList.add('is-visible'));
  }
  search.addEventListener('input', render); navigation.addEventListener('click', navigate);
  more.addEventListener('click', appendBatch); reducedMotion.addEventListener('change', reduceMotion);
  render();
  try { if (location.hash) ensureCategory(decodeURIComponent(location.hash.slice(1))); } catch { /* Invalid fragments do not break the menu. */ }
  return { destroy() {
    batchObserver?.disconnect(); revealObserver?.disconnect(); search.removeEventListener('input', render);
    navigation.removeEventListener('click', navigate); more.removeEventListener('click', appendBatch);
    reducedMotion.removeEventListener('change', reduceMotion);
  } };
}

if (document.body.dataset.page === 'menu') {
  try { mountMenu(await loadMenu()); }
  catch (error) {
    const notice = element('p', 'notice error-state', 'Не удалось загрузить меню. Обновите страницу или свяжитесь с рестораном через раздел «Контакты».');
    notice.setAttribute('role', 'alert'); document.querySelector('[data-menu-sections]').replaceChildren(notice);
    document.querySelector('[data-menu-count]').textContent = 'Меню временно недоступно'; console.error(error);
  }
}
