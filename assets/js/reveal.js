// Replay photographs and marked content blocks whenever they re-enter the viewport.
export function startImageReveals(root) {
  if (!root || typeof IntersectionObserver === 'undefined') {
    document.documentElement.classList.remove('image-reveal-pending');
    return;
  }

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const states = new Map();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.12) reveal(entry.target);
      else if (!entry.isIntersecting) reset(entry.target);
    }
  }, { threshold: [0, 0.12] });

  function finish(target, state, run) {
    if (states.get(target) !== state || state.run !== run) return;
    target.classList.add('is-visible');
    state.phase = 'visible';
  }

  function reset(target) {
    const state = states.get(target);
    if (!state || motion.matches || target.contains(document.activeElement)) return;
    state.run++;
    state.phase = 'hidden';
    target.classList.remove('is-visible');
  }

  async function reveal(target) {
    const state = states.get(target);
    if (!state || state.phase !== 'hidden') return;
    state.phase = 'preparing';
    const run = ++state.run;
    // Start after decoding, so even a slow or cached photograph fades in.
    state.ready ??= Promise.all((target.matches('img') ? [target] : [...target.querySelectorAll('img')])
      .map(image => image.decode().catch(() => {})));
    await state.ready;
    // Give the initial hidden state a paint before starting the transition.
    requestAnimationFrame(() => requestAnimationFrame(() => finish(target, state, run)));
  }

  function register(node) {
    if (!(node instanceof Element)) return;
    const candidates = [...(node.matches('img, [data-reveal]') ? [node] : []), ...node.querySelectorAll('img, [data-reveal]')];
    for (const candidate of candidates) {
      // Menu cards already have their own observer. Never animate them twice.
      if (candidate.closest('.reveal, dialog')) continue;
      const target = candidate.matches('[data-reveal]') ? candidate : candidate.closest('.image-frame, .gallery-button') || candidate;
      target.classList.add('reveal');
      const state = { phase: 'hidden', run: 0 };
      states.set(target, state);
      if (motion.matches) finish(target, state, state.run);
      else observer.observe(target);
    }
  }

  register(root);
  document.documentElement.classList.remove('image-reveal-pending');
  // Lists and filters replace their content after fetching CMS data.
  const mutations = new MutationObserver(records => {
    for (const [target] of states) {
      if (!root.contains(target)) {
        observer.unobserve(target);
        states.delete(target);
      }
    }
    for (const record of records) {
      for (const node of record.addedNodes) register(node);
    }
  });
  mutations.observe(root, { childList: true, subtree: true });

  motion.addEventListener('change', event => {
    observer.disconnect();
    if (event.matches) {
      for (const [target, state] of states) finish(target, state, ++state.run);
    } else for (const [target] of states) observer.observe(target);
  });
  root.addEventListener('focusin', event => {
    const target = event.target.closest('.reveal');
    const state = states.get(target);
    if (state) finish(target, state, ++state.run);
  });
}
