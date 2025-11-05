import { v2 as cloudinary } from 'cloudinary';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill, limitFit } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
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
const OUTPUT_PATH = path.resolve('src', 'data', 'gallery.json');
const cld = new Cloudinary({
  cloud: { cloudName: CLOUDINARY_CLOUD_NAME },
  url: { secure: true }
});

async function fetchAllResources() {
  let resources = [];
  let next_cursor = undefined;
  do {
    const res = await cloudinary.search
      .expression(SEARCH_EXPRESSION)
      .max_results(500)
      .with_field('context')
      .with_field('metadata')
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
  const metadata = resource.metadata || {};
  const metaName = typeof metadata.name === 'string' && metadata.name.trim().length > 0 ? metadata.name.trim() : null;
  const metaDesc = typeof metadata.desc === 'string' && metadata.desc.trim().length > 0 ? metadata.desc.trim() : null;
  const metaAuthor = typeof metadata.author === 'string' && metadata.author.trim().length > 0 ? metadata.author.trim() : null;
  const contextAuthor = typeof context.author === 'string' && context.author.trim().length > 0 ? context.author.trim() : null;
  const author = metaAuthor || contextAuthor || null;
  const preview = cld.image(resource.public_id);
  preview.format('auto').quality('auto');
  preview.resize(limitFit().width(1200));

  const grid = cld.image(resource.public_id);
  grid.format('auto').quality('auto');
  grid.resize(limitFit().width(720));

  const thumb = cld.image(resource.public_id);
  thumb.format('auto').quality('auto');
  thumb.resize(fill().width(480).height(360).gravity(autoGravity()));

  return {
    public_id: resource.public_id,
    format: resource.format,
    width: resource.width,
    height: resource.height,
    bytes: resource.bytes,
    folder: getFolder(resource),
    tags: resource.tags || [],
    title: metaName || context.caption || null,
    description: metaDesc || context.alt || null,
    url: preview.toURL(),
    grid: grid.toURL(),
    thumb: thumb.toURL(),
    metadata: {
      name: metaName,
      desc: metaDesc,
      author
    }
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
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const output = {
    generatedAt: new Date().toISOString(),
    cloudName: CLOUDINARY_CLOUD_NAME,
    root: GALLERY_ROOT,
    total: resources.length,
    folders
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Gallery JSON generated: ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Error building gallery:', err);
  process.exit(1);
});