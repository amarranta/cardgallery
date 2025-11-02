import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const targetFile = path.join(publicDir, 'gallery.json');

const [,, mockPathArg] = process.argv;
const mockPath = mockPathArg || path.join(rootDir, 'mock-data', 'sample.json');

function exitWithError(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(mockPath)) {
  exitWithError(`Mock file not found: ${mockPath}`);
}

try {
  const data = fs.readFileSync(mockPath, 'utf8');
  JSON.parse(data);
} catch (err) {
  exitWithError(`Mock JSON is invalid: ${err.message}`);
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.copyFileSync(mockPath, targetFile);
console.log(`Mock gallery copied to ${targetFile}`);
