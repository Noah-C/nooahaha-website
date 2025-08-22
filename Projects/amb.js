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
    const resp = await fetch('AMB%20Photos/photos.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error('Failed to fetch photo list');
    const files = await resp.json();
    const images = Array.isArray(files)
      ? files.filter(name => /\.(jpe?g|png|gif)$/i.test(name))
             .map(name => `AMB%20Photos/${encodeURIComponent(name)}`)
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
