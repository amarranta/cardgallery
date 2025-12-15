import { v2 as cloudinary } from 'cloudinary';

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  GALLERY_ROOT = 'postcards'
} = process.env;

const folderArg = process.argv.slice(2).find(a => !a.startsWith('-')) || 'Countries';
const asJson = process.argv.includes('--json');
const countOnly = process.argv.includes('--count') || process.argv.includes('--summary');

function readLimitArg(argv) {
  const eq = argv.find(a => a.startsWith('--limit='));
  if (eq) {
    const n = Number(eq.slice('--limit='.length));
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }
  const idx = argv.indexOf('--limit');
  if (idx >= 0) {
    const n = Number(argv[idx + 1]);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }
  return null;
}

const limit = readLimitArg(process.argv) ?? 50;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error(
    'Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (e.g. via a local .env and `node -r dotenv/config ...`).'
  );
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true
});

function buildFolderPaths(input) {
  if (input.includes('/')) return [input];
  return [input, `${GALLERY_ROOT}/${input}`];
}

function buildExpression(paths) {
  const clauses = [];
  for (const p of paths) {
    clauses.push(`asset_folder:"${p}"`);
    clauses.push(`folder:"${p}"`);
    clauses.push(`asset_folder:"${p}/*"`);
    clauses.push(`folder:"${p}/*"`);
  }
  return `(${clauses.join(' OR ')}) AND resource_type:image`;
}

async function fetchAll(expression) {
  let resources = [];
  let next_cursor;
  do {
    const res = await cloudinary.search
      .expression(expression)
      .sort_by('created_at', 'desc')
      .max_results(500)
      .with_field('context')
      .with_field('metadata')
      .with_field('tags')
      .next_cursor(next_cursor)
      .execute();

    resources = resources.concat(res.resources || []);
    next_cursor = res.next_cursor;
  } while (next_cursor);

  return resources;
}

function pick(resource) {
  return {
    public_id: resource.public_id,
    folder: resource.asset_folder || resource.folder || null,
    bytes: resource.bytes,
    created_at: resource.created_at,
    format: resource.format,
    width: resource.width,
    height: resource.height,
    tags: resource.tags || [],
    metadata: resource.metadata || {},
    context: resource.context?.custom || {}
  };
}

async function main() {
  const folderPaths = buildFolderPaths(folderArg);
  const expression = buildExpression(folderPaths);

  const resources = await fetchAll(expression);

  if (countOnly) {
    console.log(`Folder query: ${folderArg}`);
    console.log(`Expanded paths: ${folderPaths.join(', ')}`);
    console.log(`Total images: ${resources.length}`);
    const byFolder = new Map();
    for (const r of resources) {
      const folder = r.asset_folder || r.folder || '(unknown)';
      byFolder.set(folder, (byFolder.get(folder) || 0) + 1);
    }
    const rows = Array.from(byFolder.entries())
      .map(([folder, total]) => ({ folder, total }))
      .sort((a, b) => b.total - a.total);
    if (rows.length) console.table(rows);
    return;
  }

  if (asJson) {
    process.stdout.write(
      JSON.stringify(
        {
          folderArg,
          folderPaths,
          total: resources.length,
          items: resources.map(pick)
        },
        null,
        2
      )
    );
    return;
  }

  console.log(`Folder query: ${folderArg}`);
  console.log(`Expanded paths: ${folderPaths.join(', ')}`);
  console.log(`Total images: ${resources.length}`);

  const rows = resources.slice(0, limit).map(r => {
    const meta = r.metadata || {};
    const ctx = r.context?.custom || {};
    const placeId = typeof meta.placeId === 'string' ? meta.placeId : '';
    const desc = typeof meta.desc === 'string' ? meta.desc : '';
    const title = typeof meta.name === 'string' ? meta.name : (typeof ctx.caption === 'string' ? ctx.caption : '');

    return {
      public_id: r.public_id,
      folder: r.asset_folder || r.folder || '',
      created_at: r.created_at,
      bytes: r.bytes,
      placeId,
      title,
      desc
    };
  });

  console.table(rows);
  if (resources.length > limit) {
    console.log(`(Showing first ${limit}. Use --json for full output, or --limit N.)`);
  }
}

main().catch(err => {
  console.error('Cloudinary query failed:', err?.message || err);
  process.exit(1);
});
