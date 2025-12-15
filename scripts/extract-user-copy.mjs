import fs from 'fs';
import path from 'path';

// Use the current working directory (project root) to avoid URL path issues on Windows
const projectRoot = process.cwd();
const dataPath = path.join(projectRoot, 'src', 'data', 'gallery.json');
const outPath = path.join(projectRoot, 'build', 'user-copy.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function humanizeFolderId(folder) {
  if (!folder) return 'Album';
  const base = folder.split('/').filter(Boolean).pop();
  if (!base) return 'Album';
  return base.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const folders = raw.folders || {};

const results = {
  generatedAt: raw.generatedAt || null,
  site: {
    // site strings live in src/data/gallery.js; we'll include known hero/site labels manually if needed
  },
  folders: [],
  tags: [],
  items: []
};

const tagSet = new Set();
const textSet = new Set();

for (const [folderName, items] of Object.entries(folders)) {
  const folderHuman = humanizeFolderId(folderName);
  results.folders.push({ id: folderName, human: folderHuman });
  textSet.add(folderHuman);

  for (const item of items || []) {
    const p = {
      public_id: item.public_id,
      folder: folderName,
      title: item.title || null,
      description: item.description || null,
      metadata_name: item.metadata?.name || null,
      metadata_desc: item.metadata?.desc || null,
      tags: Array.isArray(item.tags) ? item.tags : []
    };

    [p.title, p.description, p.metadata_name, p.metadata_desc].forEach(v => {
      if (v && typeof v === 'string' && v.trim()) textSet.add(v.trim());
    });

    (p.tags || []).forEach(t => { if (t) { tagSet.add(t); textSet.add(t); } });

    results.items.push(p);
  }
}

results.unique_text = Array.from(textSet).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
results.unique_tags = Array.from(tagSet).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));

ensureDir(path.dirname(outPath));
fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
console.log('Wrote', outPath);
