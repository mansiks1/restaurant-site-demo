// The only owner of reveal classes, visibility observers and their lifecycle.
const controllers = new WeakMap();

export function initReveal(root = document.querySelector('main')) {
  if (!root || controllers.has(root)) return controllers.get(root);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const states = new Map();
  const supportsObserver = typeof IntersectionObserver === 'function';
  function visibilityInset() {
    const header = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
    const toolbar = document.querySelector('.menu-toolbar')?.getBoundingClientRect();
    return Math.round(toolbar && toolbar.top <= header + 1 && toolbar.bottom > header ? toolbar.bottom : header);
  }
  let headerInset = visibilityInset();
  function observeVisibility(entries) {
    for (const entry of entries) {
      const state = states.get(entry.target);
      if (!state) continue;
      state.inView = entry.isIntersecting;
      if (entry.isIntersecting) show(entry.target, state);
      else reset(entry.target, state);
    }
  }
  const createObserver = () => supportsObserver ? new IntersectionObserver(observeVisibility,
    { threshold: 0, rootMargin: `-${headerInset}px 0px -32px 0px` }) : null;
  let observer = createObserver();

  function finish(target, state, run) {
    if (states.get(target) !== state || state.run !== run) return;
    target.classList.add('is-visible');
    state.phase = 'visible';
  }

  function reset(target, state) {
    if (!observer || motion.matches || target.contains(document.activeElement)) return;
    state.run++;
    state.phase = 'hidden';
    target.classList.remove('is-visible');
  }

  async function show(target, state) {
    if (motion.matches || !observer) return finish(target, state, ++state.run);
    if (state.phase !== 'hidden') return;
    state.phase = 'preparing';
    const run = ++state.run;
    // Sections must not wait for lazy photographs in all nested cards.
    const images = target.classList.contains('reveal-group') ? [] :
      target.matches('img') ? [target] : [...target.querySelectorAll('img')];
    state.ready ??= Promise.all(images.map(image => image.decode().catch(() => {})));
    await state.ready;
    requestAnimationFrame(() => requestAnimationFrame(() => finish(target, state, run)));
  }

  function register(node) {
    if (!(node instanceof Element)) return;
    const targets = [...(node.matches('[data-reveal]') ? [node] : []), ...node.querySelectorAll('[data-reveal]')];
    for (const target of targets) {
      if (states.has(target) || target.closest('dialog')) continue;
      target.classList.add('reveal');
      target.classList.toggle('reveal-group', Boolean(target.querySelector('[data-reveal]')));
      const state = { phase: 'hidden', run: 0, inView: false };
      states.set(target, state);
      if (motion.matches || !observer) finish(target, state, state.run);
      else observer.observe(target);
    }
  }

  // Pagination shares this module; menu.js only handles the data event.
  const sentinel = root.querySelector('#menu-sentinel');
  const menuContent = root.querySelector('[data-menu-sections]');
  const batchObserver = supportsObserver && sentinel ? new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting) || sentinel.hidden) return;
    batchObserver.unobserve(sentinel);
    sentinel.dispatchEvent(new Event('menu:load-more'));
  }, { rootMargin: '200px' }) : null;
  let paginationFrame = 0;
  function schedulePagination() {
    if (!batchObserver || paginationFrame) return;
    paginationFrame = requestAnimationFrame(() => {
      paginationFrame = 0;
      batchObserver.unobserve(sentinel);
      if (!sentinel.hidden && menuContent?.getAttribute('aria-busy') !== 'true') batchObserver.observe(sentinel);
    });
  }

  register(root);
  document.documentElement.dataset.revealReady = 'true';
  schedulePagination();
  const mutations = new MutationObserver(records => {
    for (const [target] of states) {
      if (!root.contains(target)) {
        observer?.unobserve(target);
        states.delete(target);
      }
    }
    for (const record of records) for (const node of record.addedNodes) register(node);
    schedulePagination();
  });
  mutations.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-busy'] });

  function changeMotion() {
    observer?.disconnect();
    for (const [target, state] of states) {
      if (motion.matches || !observer) finish(target, state, ++state.run);
      else observer.observe(target);
    }
  }
  function focusIn(event) {
    for (let target = event.target.closest('[data-reveal]'); target; target = target.parentElement?.closest('[data-reveal]')) {
      const state = states.get(target);
      if (state) finish(target, state, ++state.run);
    }
  }
  function focusOut() {
    requestAnimationFrame(() => {
      for (const [target, state] of states) if (!state.inView) reset(target, state);
    });
  }
  function resize() {
    const inset = visibilityInset();
    if (inset === headerInset) return;
    headerInset = inset;
    observer?.disconnect(); observer = createObserver();
    if (!motion.matches) for (const [target] of states) observer?.observe(target);
  }
  let insetFrame = 0;
  function scheduleInset() {
    if (!insetFrame) insetFrame = requestAnimationFrame(() => { insetFrame = 0; resize(); });
  }
  motion.addEventListener('change', changeMotion);
  root.addEventListener('focusin', focusIn);
  root.addEventListener('focusout', focusOut);
  window.addEventListener('resize', scheduleInset);
  window.addEventListener('scroll', scheduleInset, { passive: true });
  const controller = { destroy() {
    observer?.disconnect(); batchObserver?.disconnect(); mutations.disconnect();
    cancelAnimationFrame(paginationFrame);
    cancelAnimationFrame(insetFrame);
    motion.removeEventListener('change', changeMotion);
    root.removeEventListener('focusin', focusIn); root.removeEventListener('focusout', focusOut);
    window.removeEventListener('resize', scheduleInset); window.removeEventListener('scroll', scheduleInset);
    for (const [target, state] of states) finish(target, state, ++state.run);
    states.clear(); controllers.delete(root);
  } };
  controllers.set(root, controller);
  return controller;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initReveal(), { once: true });
else initReveal();
