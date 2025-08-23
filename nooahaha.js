function ecgValue(t, hr = 72){
  const T0 = 60 / hr;
  const phi = 2 * Math.PI * ((t / T0) % 1);
  const params = [
    [-0.90,  0.12, 0.10],
    [-0.15, -0.05, 0.03],
    [ 0.00,  1.00, 0.02],
    [ 0.08, -0.15, 0.03],
    [ 0.70,  0.35, 0.20],
  ];
  function wrapDelta(a, b){
    const d = a - b;
    return Math.atan2(Math.sin(d), Math.cos(d));
  }
  let y = 0;
  for (const [ph, amp, wid] of params){
    const d = wrapDelta(phi, ph);
    y += amp * Math.exp(-(d * d) / (2 * wid * wid));
  }
  return y;
}

function startHeartBeat(el, baseline = 72){
  const start = performance.now();
  let raf;
  function step(now){
    const t = (now - start) / 1000;
    const hr = baseline + 10 * Math.sin((2 * Math.PI * t) / 10);
    const y = ecgValue(t, hr);
    const scale = 1 + 0.3 * y;
    el.style.transform = `rotate(-45deg) scale(${scale})`;
    raf = requestAnimationFrame(step);
  }
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

document.getElementById('year').textContent = new Date().getFullYear();
const ROUTES = ["about", "writing", "projects", "talks"];
let CURRENT_ROUTE_ID = 'about';
function updateNavIndicator(id){
  const nav = document.querySelector('nav');
  const indicator = document.querySelector('.nav-indicator');
  if (!nav || !indicator) return;
  const activeLink = nav.querySelector(`a[href="#${id}"]`);
  if (!activeLink) { indicator.style.opacity = '0'; return; }
  const linkRect = activeLink.getBoundingClientRect();
  const navRect = nav.getBoundingClientRect();
  const x = linkRect.left - navRect.left;
  const y = linkRect.top - navRect.top;
  indicator.style.width = `${linkRect.width}px`;
  indicator.style.height = `${linkRect.height}px`;
  indicator.style.transform = `translate(${x}px, ${y}px)`;
  const root = getComputedStyle(document.documentElement);
  const colorVar = id === 'about' ? '--about-border' : id === 'writing' ? '--writing-border' : id === 'projects' ? '--projects-border' : '--talks-border';
  const color = root.getPropertyValue(colorVar).trim() || '#000';
  indicator.style.borderColor = color;
  indicator.style.opacity = '1';
}
function sanitizeHTML(html){
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const allowed = new Set([
    'p','a','em','strong','span','ul','ol','li','h1','h2','h3','h4','h5','h6',
    'br','div','img','button','iframe'
  ]);
  const globalAttrs = new Set(['href','target','rel','class','id','src','alt','loading']);
  const iframeAttrs = new Set(['src','title','allow','frameborder','referrerpolicy','allowfullscreen','width','height']);
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  const toRemove = [];
  while (walker.nextNode()){
    const el = walker.currentNode;
    const tag = el.tagName.toLowerCase();
    if (!allowed.has(tag)) { toRemove.push(el); continue; }
    [...el.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();
      if (name === 'href' && tag === 'a') {
        if (/^javascript:/i.test(attr.value)) el.removeAttribute(attr.name);
      } else {
        const allowedAttr = name.startsWith('data-') || globalAttrs.has(name) || (tag === 'iframe' && iframeAttrs.has(name));
        if (name.startsWith('on') || !allowedAttr) {
          el.removeAttribute(attr.name);
        }
      }
    });
    if (tag === 'a' && el.target === '_blank' && !el.rel) {
      el.rel = 'noopener';
    }
  }
  toRemove.forEach(el => el.replaceWith(...el.childNodes));
  return doc.body.innerHTML;
}

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
async function initAmbPhotoGrid(){
  const grid = document.getElementById('amb-photo-grid');
  if (!grid) return;
  try {
    const resp = await fetch('Projects/AMB%20Photos/photos.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error('Failed to fetch photo list');
    const files = await resp.json();
    const images = Array.isArray(files)
      ? files.filter(name => /\.(jpe?g|png|gif)$/i.test(name))
             .map(name => `Projects/AMB%20Photos/${encodeURIComponent(name)}`)
      : [];
    if (images.length === 0) return;
    let selected;
    if (images.length >= 36) {
      shuffle(images);
      selected = images.slice(0, 36);
    } else {
      selected = [];
      for (let i = 0; i < 36; i++) {
        const idx = Math.floor(Math.random() * images.length);
        selected.push(images[idx]);
      }
    }
    grid.innerHTML = '';
    selected.forEach(src => {
      const wrap = document.createElement('div');
      wrap.className = 'photo-wrap';
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Anderson Memorial Bridge photo';
      img.loading = 'lazy';
      wrap.appendChild(img);
      grid.appendChild(wrap);
    });
  } catch (err) {
    console.error(err);
  }
}
function initProjectTabs(){
  const container = document.querySelector('.projects-window');
  if (!container || container.dataset.inited) return;
  container.dataset.inited = 'true';

  const panes = container.querySelectorAll('.project-pane');
  const switches = container.querySelectorAll('.project-switch');
  function show(id){
    panes.forEach(p => {
      const active = p.id === id;
      p.classList.toggle('active', active);
      if (active && p.id === 'amb') initAmbPhotoGrid();
    });
    const url = new URL(window.location);
    if (panes[0] && id === panes[0].id) {
      url.searchParams.delete('p');
    } else {
      url.searchParams.set('p', id);
    }
    history.replaceState(null, '', url);
  }
  switches.forEach(sw => {
    sw.addEventListener('click', () => show(sw.dataset.target));
  });
  const navLink = document.querySelector('nav a[href="#projects"]');
  if (navLink) {
    navLink.addEventListener('click', () => show('overview'));
  }
  if (panes[0]) show(panes[0].id);
}
function initTalkTabs(){
  const container = document.querySelector('.talks-window');
  if (!container || container.dataset.inited) return;
  container.dataset.inited = 'true';
  const panes = container.querySelectorAll('.project-pane');
  const switches = container.querySelectorAll('.project-switch');
  function show(id){
    panes.forEach(p => p.classList.toggle('active', p.id === id));
  }
  switches.forEach(sw => sw.addEventListener('click', () => show(sw.dataset.target)));
  if (panes[0]) show(panes[0].id);
}
function initWindowControls(){
  const screen = document.querySelector('.screen');
  const btnClose = document.querySelector('.win-close');
  if (!screen || !btnClose) return;
  if (screen.dataset.bound) return; screen.dataset.bound = 'true';

  function cleanScreenState(){
    screen.classList.remove('is-minimizing');
    screen.style.transformOrigin = '';
    screen.style.transition = '';
    screen.style.transform = '';
    screen.style.opacity = '';
  }

  // 4-step flow on X: shrink -> 3s heartbeat -> 2s+ float -> typeout
  btnClose.addEventListener('click', () => {
    cleanScreenState();
    screen.classList.add('is-minimizing');
    const safetyShowOverlay = setTimeout(() => {
      if (!document.querySelector('.blank-world-overlay')) showBlankWorldMessage();
    }, 7000);
    setTimeout(() => {
      screen.style.display = 'none';
      const wrap = document.createElement('div');
      wrap.className = 'heart-wrap';
      wrap.style.transform = 'translate(-50%, -50%) scale(2.1)';
      const heart = document.createElement('div');
      heart.className = 'heart';
      wrap.appendChild(heart);
      document.body.appendChild(wrap);
      const stopBeat = startHeartBeat(heart);

      // Heartbeat for ~3 seconds
      setTimeout(() => {
        try {
          stopBeat();
          const rect = wrap.getBoundingClientRect();
          // Fallback to viewport center if the rect is zero-sized (e.g. race condition)
          const cx = rect.width ? rect.left + rect.width / 2 : window.innerWidth / 2;
          const cy = rect.height ? rect.top + rect.height / 2 : window.innerHeight / 2;
          wrap.remove();
          const total = 64;
          for (let i = 0; i < total; i++) {
            const d = document.createElement('div');
            d.className = 'float-dot' + (i % 3 === 0 ? ' light' : '');
            // Inline fallback styles so dots remain visible even if CSS hasn't loaded yet
            d.style.cssText = `position:fixed;width:6px;height:6px;border-radius:50%;background:#ff2b2b;opacity:1;z-index:9999;transform:translate(0,0) scale(1);transition:transform 2500ms cubic-bezier(0.22,1,0.36,1),opacity 2500ms ease;`;
            if (i % 3 === 0) {
              d.style.background = '#ff6b6b';
              d.style.width = '4px';
              d.style.height = '4px';
            }
            d.style.left = `${cx}px`;
            d.style.top = `${cy}px`;
            document.body.appendChild(d);
            // Force a reflow to ensure the browser registers initial styles
            void d.offsetWidth;
            requestAnimationFrame(() => {
              const angle = Math.random() * Math.PI * 2;
              const distance = 120 + Math.random() * 120;
              const driftX = Math.cos(angle) * distance;
              const driftY = Math.sin(angle) * distance;
              d.style.transform = `translate(${driftX}px, ${driftY}px) scale(${0.6 + Math.random()*0.4})`;
              d.style.opacity = '0';
            });
            setTimeout(() => d.remove(), 2600);
          }
          setTimeout(() => { showBlankWorldMessage(); clearTimeout(safetyShowOverlay); }, 2700);
        } catch (e) {
          showBlankWorldMessage(); clearTimeout(safetyShowOverlay);
        }
      }, 3000);
    }, 380);
  });
}

function showBlankWorldMessage(){
  if (document.querySelector('.blank-world-overlay')) {
    console.warn('[overlay] already present; skipping duplicate');
    return;
  }
  console.log('[overlay] create');
  // Reuse typing speeds from typewriter.js
  const SPEED = 15; // per char
  const PUNCT_PAUSE = 150;

  const overlay = document.createElement('div');
  overlay.className = 'blank-world-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: #fff; z-index: 10000;
    display: flex; align-items: center; justify-content: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
    color: #111; padding: 24px; text-align: center;
  `;
  const container = document.createElement('div');
  container.style.maxWidth = '800px';
  const p = document.createElement('p');
  p.style.margin = '0';
  p.style.fontSize = '22px';
  overlay.appendChild(container);
  container.appendChild(p);
  document.body.appendChild(overlay);

  const message = "Now you've reached a blank world without Yedong.";
  let i = 0;
  function typeNext(){
    if (!document.body.contains(overlay)) return; // overlay removed
    if (i >= message.length) {
      console.log('[overlay] typed complete');
      const cursor = document.createElement('span');
      cursor.className = 'clicker';
      p.appendChild(cursor);
      return;
    }
    p.textContent += message[i];
    let delay = SPEED;
    if (/[.,!?;:—–]/.test(message[i])) delay += PUNCT_PAUSE;
    i++;
    setTimeout(typeNext, delay);
  }
  // Start typing next frame
  requestAnimationFrame(typeNext);
}
async function loadSection(id){
  const sec = document.getElementById(id);
  if (!sec) return;
  if (sec.dataset.loading === 'true') return;
  if (sec.dataset.loaded === 'true') {
    if (id === 'projects') {
      initProjectTabs();
    } else if (id === 'talks') {
      initTalkTabs();
    }
    return;
  }
  const container = sec.querySelector('.content');
  if (!container) return;
  try {
    sec.dataset.loading = 'true';
    const resp = await fetch(`./${id}.html`, { cache: 'no-cache' });
    if (!resp.ok) throw new Error(`Failed to load ${id}.html`);
    const html = await resp.text();
    const sanitized = sanitizeHTML(html);
    container.innerHTML = sanitized;
    if (id === 'projects') initProjectTabs();
    if (id === 'talks') initTalkTabs();
    sec.dataset.loaded = 'true';
  } catch (err) {
    container.innerHTML = `<p style="color:#c00">Failed to load content.</p>`;
    console.error(err);
  } finally {
    delete sec.dataset.loading;
  }
}
function showRoute(hash){
  const id = (hash || '#about').replace('#','');
  ROUTES.forEach(r => {
    const el = document.getElementById(r);
    if (el) el.classList.toggle('active', r === id);
  });
  document.querySelectorAll('nav a[data-route]').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + id);
  });
  CURRENT_ROUTE_ID = id;
  updateNavIndicator(id);
  loadSection(id);
  if (id !== 'projects') {
    const url = new URL(window.location);
    if (url.searchParams.has('p')) {
      url.searchParams.delete('p');
      history.replaceState(null, '', url);
    }
  }
}
window.addEventListener('hashchange', () => showRoute(location.hash));
window.addEventListener('resize', () => updateNavIndicator(CURRENT_ROUTE_ID));
showRoute(location.hash || '#about');
initWindowControls();
