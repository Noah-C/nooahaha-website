#!/usr/bin/env node
// Generate thumbnails and an index for Projects/Posters
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const postersDir = path.join(__dirname, '..', 'Projects', 'Posters');
const thumbsDir = path.join(postersDir, '_thumbs');
const indexPath = path.join(postersDir, 'index.json');
const validExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

async function ensureDir(dir){
  await fs.promises.mkdir(dir, { recursive: true });
}

async function getImageSize(file){
  try {
    const meta = await sharp(file).metadata();
    return { width: meta.width || null, height: meta.height || null };
  } catch {
    return { width: null, height: null };
  }
}

async function createThumb(srcPath, destPath, width){
  // Higher-quality webp thumbnails at specified width
  await sharp(srcPath)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(destPath);
}

async function main(){
  await ensureDir(thumbsDir);
  const entries = await fs.promises.readdir(postersDir);
  const files = entries.filter(f => !f.startsWith('.') && validExts.has(path.extname(f).toLowerCase()));
  files.sort((a, b) => a.localeCompare(b, 'en'));

  const index = [];
  for (const name of files){
    const fullPath = path.join(postersDir, name);
    const baseName = path.parse(name).name;
    const thumb1xName = baseName + '@1x.webp';
    const thumb2xName = baseName + '@2x.webp';
    const thumb1xPath = path.join(thumbsDir, thumb1xName);
    const thumb2xPath = path.join(thumbsDir, thumb2xName);
    const relThumb1x = `Projects/Posters/_thumbs/${encodeURIComponent(thumb1xName)}`;
    const relThumb2x = `Projects/Posters/_thumbs/${encodeURIComponent(thumb2xName)}`;
    const relFull = `Projects/Posters/${encodeURIComponent(name)}`;

    // Skip thumbnail generation if up-to-date
    let need1x = true, need2x = true;
    try {
      const srcStat = await fs.promises.stat(fullPath);
      try { const dst1 = await fs.promises.stat(thumb1xPath); if (dst1.mtimeMs >= srcStat.mtimeMs) need1x = false; } catch {}
      try { const dst2 = await fs.promises.stat(thumb2xPath); if (dst2.mtimeMs >= srcStat.mtimeMs) need2x = false; } catch {}
    } catch {}
    if (need1x){ await createThumb(fullPath, thumb1xPath, 600); console.log('thumb', path.relative(process.cwd(), thumb1xPath)); }
    if (need2x){ await createThumb(fullPath, thumb2xPath, 1200); console.log('thumb', path.relative(process.cwd(), thumb2xPath)); }

    const { width, height } = await getImageSize(fullPath);
    index.push({ name, full: relFull, thumb: relThumb1x, thumb2x: relThumb2x, width, height });
  }

  await fs.promises.writeFile(indexPath, JSON.stringify(index, null, 2) + '\n');
  console.log(`Wrote ${files.length} items to ${path.relative(process.cwd(), indexPath)}`);
}

main().catch(err => { console.error(err); process.exit(1); });


