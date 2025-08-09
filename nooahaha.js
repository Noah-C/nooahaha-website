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
  const allowed = new Set(['p','a','em','strong','span','ul','ol','li','h1','h2','h3','h4','h5','h6','br','div','img','button']);
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
      } else if (name.startsWith('on') || !(name.startsWith('data-') || ['href','target','rel','class','id','src','alt','loading'].includes(name))) {
        el.removeAttribute(attr.name);
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
      wrap.appendChild(img);
      grid.appendChild(wrap);
    });
  } catch (err) {
    console.error(err);
  }
}
function initProjectSlider(){
  const frame = document.querySelector('.projects-frame');
  if (!frame || frame.dataset.inited) return;
  frame.dataset.inited = 'true';
  const slider = frame.querySelector('.projects-slider');
  const panes = slider.querySelectorAll('.project-pane');
  let index = 0;
  function show(idx){
    index = (idx + panes.length) % panes.length;
    slider.style.transform = `translateX(-${index * 100}%)`;
    const activePane = panes[index];
    if (activePane.querySelector('#amb-photo-grid')) initAmbPhotoGrid();
  }
  slider.addEventListener('click', e => {
    if (e.target.classList.contains('project-next')) {
      show(index + 1);
    }
  });
  show(0);
}
async function loadSection(id){
  const sec = document.getElementById(id);
  if (!sec) return;
  if (sec.dataset.loading === 'true') return;
  if (sec.dataset.loaded === 'true') {
    if (id === 'projects') {
      initProjectSlider();
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
    if (id === 'projects') initProjectSlider();
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
}
window.addEventListener('hashchange', () => showRoute(location.hash));
window.addEventListener('resize', () => updateNavIndicator(CURRENT_ROUTE_ID));
showRoute(location.hash || '#about'); 
