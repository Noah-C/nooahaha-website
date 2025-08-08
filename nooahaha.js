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
async function loadSection(id){
  const sec = document.getElementById(id);
  if (!sec) return;
  if (sec.dataset.loaded === 'true' || sec.dataset.loading === 'true') return;
  const container = sec.querySelector('.content');
  if (!container) return;
  try {
    sec.dataset.loading = 'true';
    const resp = await fetch(`./${id}.html`, { cache: 'no-cache' });
    if (!resp.ok) throw new Error(`Failed to load ${id}.html`);
    const html = await resp.text();
    container.innerHTML = html;
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
// Preload default route content
loadSection('about'); 