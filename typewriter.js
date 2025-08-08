(() => {
  const SPEED = 22;           // base ms per character
  const PUNCT_PAUSE = 140;    // extra pause after . , ! ? ; :
  const PARA_PAUSE = 240;     // pause between paragraphs
  const SHOULD_REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hasMotionOverride(){
    try {
      const qs = new URLSearchParams(location.search);
      return window.forceAboutTyping === true ||
             localStorage.getItem('allowMotion') === 'true' ||
             qs.get('animate') === '1';
    } catch (_) {
      return window.forceAboutTyping === true;
    }
  }

  function ensureOptInUI(){
    if (!SHOULD_REDUCE || hasMotionOverride()) return;
    const container = document.querySelector('#about .content');
    if (!container) return;
    if (container.querySelector('.typing-play')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'typing-play';
    btn.textContent = 'Play typing';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      try { localStorage.setItem('allowMotion', 'true'); } catch(_){ /* ignore */ }
      typeOutAbout();
    });
    container.prepend(btn);
  }

  let typing = false;
  let aborted = false;

  function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
  function getTextNodes(el){
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: n => /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const out = [];
    while (w.nextNode()) out.push(w.currentNode);
    return out;
  }

  function runWhenAboutContentReady(fn){
    const container = document.querySelector('#about .content');
    if (!container) return;
    if (container.querySelectorAll('p').length > 0) { fn(); return; }
    const mo = new MutationObserver(() => {
      if (container.querySelectorAll('p').length > 0) { mo.disconnect(); fn(); }
    });
    mo.observe(container, { childList: true, subtree: true });
  }

  async function typeOutAbout(){
    const container = document.querySelector('#about .content');
    if (!container || container.dataset.typed === 'done') return;

    // Respect OS-level reduced motion unless explicitly overridden
    if (SHOULD_REDUCE && !hasMotionOverride()) { container.dataset.typed = 'done'; return; }

    const paras = Array.from(container.querySelectorAll('p'));
    if (!paras.length) return;

    // Remove any static caret in ABOUT; we'll insert a live one while typing
    paras.forEach(p => p.querySelector('.clicker')?.remove());

    // Prepare: capture text nodes and clear their content once
    paras.forEach(p => {
      if (!p._typedNodes) {
        p._typedNodes = getTextNodes(p).map(n => ({ node: n, full: n.nodeValue }));
        p._typedNodes.forEach(d => d.node.nodeValue = '');
      }
    });

    container.setAttribute('aria-busy', 'true');
    typing = true; aborted = false;

    const caret = document.createElement('span');
    caret.className = 'clicker';

    // Type paragraph by paragraph
    for (const p of paras){
      if (aborted) break;
      p.appendChild(caret);

      for (const d of p._typedNodes){
        const s = d.full;
        for (let i = 0; i < s.length; i++){
          if (aborted) break;
          d.node.nodeValue += s[i];
          let delay = SPEED;
          if (/[.,!?;:—–]/.test(s[i])) delay += PUNCT_PAUSE;
          await sleep(delay);
        }
      }
      await sleep(PARA_PAUSE);
    }

    // Leave caret visible at the end of the last paragraph
    const lastPara = paras[paras.length - 1];
    if (lastPara && caret.parentElement !== lastPara) lastPara.appendChild(caret);

    container.dataset.typed = 'done';
    container.setAttribute('aria-busy', 'false');
    typing = false;
  }

  function cancelTyping(){
    if (!typing) return;
    aborted = true;
    const container = document.querySelector('#about .content');
    if (!container) return;
    const paras = Array.from(container.querySelectorAll('p'));
    paras.forEach(p => {
      if (p._typedNodes) p._typedNodes.forEach(d => d.node.nodeValue = d.full);
    });
    container.dataset.typed = 'done';
    container.setAttribute('aria-busy', 'false');
    typing = false;
  }

  // Hook into your router so typing starts when ABOUT is active
  const originalShowRoute = window.showRoute;
  if (typeof originalShowRoute === 'function') {
    window.showRoute = (hash) => {
      originalShowRoute(hash);
      const id = (hash || '#about').replace('#','');
      if (id === 'about') runWhenAboutContentReady(() => { ensureOptInUI(); typeOutAbout(); }); else cancelTyping();
    };
  } else {
    // Fallback if router isn't present yet
    window.addEventListener('hashchange', () => {
      const id = (location.hash || '#about').replace('#','');
      if (id === 'about') runWhenAboutContentReady(() => { ensureOptInUI(); typeOutAbout(); }); else cancelTyping();
    });
  }

  // Fire once on initial load if ABOUT is already active
  if (document.getElementById('about') && document.getElementById('about').classList.contains('active')) {
    runWhenAboutContentReady(() => { ensureOptInUI(); typeOutAbout(); });
  }

  // Optional: allow users to skip the animation (click or press Esc)
  document.querySelector('#about .content')?.addEventListener('click', cancelTyping);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cancelTyping(); });
})(); 