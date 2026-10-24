// Reuse the menu's reveal effect for static and CMS-rendered photographs.
export function startImageReveals(root) {
  if (!root || typeof IntersectionObserver === 'undefined') {
    document.documentElement.classList.remove('image-reveal-pending');
    return;
  }

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pending = new Map();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) reveal(entry.target);
    }
  }, { threshold: 0.12 });

  function finish(target, state) {
    if (pending.get(target) !== state) return;
    target.classList.add('is-visible');
    observer.unobserve(target);
    pending.delete(target);
  }

  async function reveal(target) {
    const state = pending.get(target);
    if (!state || state.started) return;
    state.started = true;
    observer.unobserve(target);
    // Start after decoding, so even a slow or cached photograph fades in.
    const images = target.matches('img') ? [target] : [...target.querySelectorAll('img')];
    await Promise.all(images.map(image => image.decode().catch(() => {})));
    // Give the initial hidden state a paint before starting the transition.
    requestAnimationFrame(() => requestAnimationFrame(() => finish(target, state)));
  }

  function register(node) {
    if (!(node instanceof Element)) return;
    const images = node.matches('img') ? [node] : node.querySelectorAll('img');
    for (const image of images) {
      // Menu cards already have their own observer. Never animate them twice.
      if (image.closest('.reveal, dialog')) continue;
      const target = image.closest('.image-frame, .gallery-button') || image;
      target.classList.add('reveal');
      if (motion.matches) target.classList.add('is-visible');
      else {
        pending.set(target, { started: false });
        observer.observe(target);
      }
    }
  }

  register(root);
  document.documentElement.classList.remove('image-reveal-pending');
  // Lists and filters replace their content after fetching CMS data.
  const mutations = new MutationObserver(records => {
    for (const [target] of pending) {
      if (!root.contains(target)) {
        observer.unobserve(target);
        pending.delete(target);
      }
    }
    for (const record of records) {
      for (const node of record.addedNodes) register(node);
    }
  });
  mutations.observe(root, { childList: true, subtree: true });

  motion.addEventListener('change', event => {
    if (event.matches) {
      for (const [target, state] of pending) finish(target, state);
    }
  });
  root.addEventListener('focusin', event => {
    const target = event.target.closest('.reveal');
    const state = pending.get(target);
    if (state) finish(target, state);
  });
}
