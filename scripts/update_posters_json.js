#!/usr/bin/env node
// Regenerates Projects/Posters/photos.json from files in the folder.
const fs = require('fs');
const path = require('path');

const folder = path.join(__dirname, '..', 'Projects', 'Posters');
const jsonPath = path.join(folder, 'photos.json');
const exts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

function main(){
  const files = fs.readdirSync(folder)
    .filter(f => !f.startsWith('.') && exts.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'en'));
  const content = JSON.stringify(files, null, 2) + '\n';
  fs.writeFileSync(jsonPath, content);
  console.log(`Wrote ${files.length} entries to ${path.relative(process.cwd(), jsonPath)}`);
}

main();

