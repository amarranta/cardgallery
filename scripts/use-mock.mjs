import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'src', 'data');
const galleryTarget = path.join(dataDir, 'gallery.json');
const tagsTarget = path.join(dataDir, 'tags.json');

const args = process.argv.slice(2);
const dataSource = resolvePath(args[0] || path.join('mock-data', 'sample.json'));
const defaultTags = path.join(rootDir, 'mock-data', 'tags.sample.json');
const tagsSource = args[1] ? resolvePath(args[1]) : (fs.existsSync(defaultTags) ? defaultTags : null);

function resolvePath(input) {
  return path.isAbsolute(input) ? input : path.join(rootDir, input);
}

function exitWithError(message) {
  console.error(message);
  process.exit(1);
}

function ensureJsonReadable(filePath, label) {
  if (!fs.existsSync(filePath)) {
    exitWithError(`${label} not found: ${filePath}`);
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    JSON.parse(raw);
  } catch (err) {
    exitWithError(`${label} is invalid JSON: ${err.message}`);
  }
}

ensureJsonReadable(dataSource, 'Mock gallery');
if (tagsSource) {
  ensureJsonReadable(tagsSource, 'Tag map');
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.copyFileSync(dataSource, galleryTarget);
console.log(`Mock gallery copied to ${galleryTarget}`);

if (tagsSource) {
  fs.copyFileSync(tagsSource, tagsTarget);
  console.log(`Tag map copied to ${tagsTarget}`);
} else if (fs.existsSync(tagsTarget)) {
  console.log('Note: tags.json already exists. Keeping current tag map.');
}
