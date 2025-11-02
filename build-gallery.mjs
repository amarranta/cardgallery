import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  GALLERY_ROOT = 'postcards'
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Missing Cloudinary credentials in environment variables.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true
});

const SEARCH_EXPRESSION = `(asset_folder:"${GALLERY_ROOT}/*" OR folder:"${GALLERY_ROOT}/*") AND resource_type:image AND -tags=hidden`;

async function fetchAllResources() {
  let resources = [];
  let next_cursor = undefined;
  do {
    const res = await cloudinary.search
      .expression(SEARCH_EXPRESSION)
      .max_results(500)
      .with_field('context')
      .with_field('tags')
      .next_cursor(next_cursor)
      .execute();
    resources = resources.concat(res.resources);
    next_cursor = res.next_cursor;
  } while (next_cursor);
  return resources;
}

function getFolder(resource) {
  return resource.asset_folder || resource.folder || '';
}

function mapResource(resource) {
  const context = resource.context?.custom || {};
  return {
    public_id: resource.public_id,
    format: resource.format,
    width: resource.width,
    height: resource.height,
    bytes: resource.bytes,
    folder: getFolder(resource),
    tags: resource.tags || [],
    title: context.caption || null,
    description: context.alt || null,
    url: cloudinary.url(resource.public_id, { secure: true }),
    thumb: cloudinary.url(resource.public_id, {
      secure: true,
      transformation: [
        {
          width: 480,
          height: 360,
          crop: 'fill',
          gravity: 'auto',
          quality: 'auto',
          fetch_format: 'auto'
        }
      ]
    })
  };
}

async function main() {
  const resources = await fetchAllResources();
  const folders = {};
  for (const res of resources) {
    const folder = getFolder(res);
    if (!folders[folder]) folders[folder] = [];
    folders[folder].push(mapResource(res));
  }
  const output = {
    generatedAt: new Date().toISOString(),
    root: GALLERY_ROOT,
    total: resources.length,
    folders
  };

  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  fs.writeFileSync(
    path.join(publicDir, 'gallery.json'),
    JSON.stringify(output, null, 2),
    'utf8'
  );
  console.log(`Gallery JSON generated: ${publicDir}/gallery.json`);
}

main().catch(err => {
  console.error('Error building gallery:', err);
  process.exit(1);
});