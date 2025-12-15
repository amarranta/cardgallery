import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  GALLERY_ROOT = 'postcards'
} = process.env;

const argv = process.argv.slice(2);

function readArg(name, fallback = null) {
  const eq = argv.find(a => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const idx = argv.indexOf(name);
  if (idx >= 0) {
    const v = argv[idx + 1];
    return v && !v.startsWith('-') ? v : fallback;
  }
  return fallback;
}

function hasFlag(name) {
  return argv.includes(name);
}

const folderArg = readArg('--folder', argv.find(a => !a.startsWith('-')) || 'Countries');
const write = hasFlag('--write');
const dryRun = hasFlag('--dry-run') || !write;
const noGeocode = hasFlag('--no-geocode');
const prune = hasFlag('--prune') || write;
const limit = (() => {
  const raw = readArg('--limit', null);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
})();

const pointsPath = readArg('--points', path.resolve('src', 'data', 'travel-points.json'));
const cachePath = readArg('--cache', path.resolve('src', 'data', 'geocode-cache.json'));

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
  return `(${clauses.join(' OR ')}) AND resource_type:image AND -tags=hidden`;
}

async function fetchAll(expression) {
  let resources = [];
  let next_cursor;
  do {
    const res = await cloudinary.search
      .expression(expression)
      .sort_by('created_at', 'desc')
      .max_results(500)
      .with_field('metadata')
      .with_field('context')
      .with_field('tags')
      .next_cursor(next_cursor)
      .execute();

    resources = resources.concat(res.resources || []);
    next_cursor = res.next_cursor;
  } while (next_cursor);

  return resources;
}

function stripDiacritics(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

function slugify(value) {
  const ascii = stripDiacritics(value);
  return ascii
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function splitCamel(token) {
  return token.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function parsePlaceFromPublicId(publicId) {
  const base = String(publicId || '').split('/').pop() || '';
  const parts = base.split('_').filter(Boolean);
  if (parts.length < 2) return null;

  const rawCountryCode = parts[0].trim().toUpperCase();
  const countryAliases = {
    KO: 'KR',
    UK: 'GB'
  };
  const countryCode = countryAliases[rawCountryCode] || rawCountryCode;
  if (!/^[A-Z]{2}$/.test(countryCode)) return null;

  // Common pattern: CC_City_hash OR CC_City_Subcity_hash
  // Treat the last segment as a random suffix.
  const rawCityParts = parts.slice(1, Math.max(1, parts.length - 1));
  if (!rawCityParts.length) return null;

  const city = rawCityParts
    .map(p => splitCamel(p))
    .join(' ')
    .replace(/[-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!city) return null;

  return { countryCode, city };
}

function getCountryName(countryCode) {
  try {
    // Node 20 supports Intl.DisplayNames.
    const dn = new Intl.DisplayNames(['en'], { type: 'region' });
    const name = dn.of(countryCode.toUpperCase());
    return typeof name === 'string' && name.trim() ? name.trim() : null;
  } catch {
    return null;
  }
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function normalizeKey(countryCode, city) {
  return `${countryCode.toUpperCase()}:${slugify(city).replace(/-/g, ' ')}`;
}

async function sleep(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function geocode(city, countryCode) {
  const cc = countryCode.toLowerCase();
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '0');
  url.searchParams.set('countrycodes', cc);
  url.searchParams.set('q', city);

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'cardgallery-sync-travel-points/1.0',
      Accept: 'application/json'
    }
  });

  if (!res.ok) return null;
  const json = await res.json();
  const first = Array.isArray(json) ? json[0] : null;
  if (!first) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

function toTravelPointId(countryCode, city) {
  return `${countryCode.toLowerCase()}-${slugify(city)}`;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const folderPaths = buildFolderPaths(folderArg);
  const expression = buildExpression(folderPaths);

  const resources = await fetchAll(expression);
  const picked = limit != null ? resources.slice(0, limit) : resources;

  const points = readJson(pointsPath, []);
  const cache = readJson(cachePath, {});

  const folderKey = String(folderArg || '').trim().toLowerCase();

  const byId = new Map();
  const byPostcardId = new Map();
  const byCountryCity = new Map();
  const byCityInFolder = new Map();
  const cityKeyCountsInFolder = new Map();
  for (const p of Array.isArray(points) ? points : []) {
    if (!p || typeof p !== 'object') continue;
    if (typeof p.id === 'string' && p.id) byId.set(p.id, p);
    if (typeof p.postcardId === 'string' && p.postcardId) byPostcardId.set(p.postcardId, p);
    const cc = typeof p.countryCode === 'string' ? p.countryCode.trim().toUpperCase() : '';
    const city = typeof p.city === 'string' ? p.city.trim() : '';
    if (cc && city) byCountryCity.set(`${cc}:${slugify(city)}`, p);

    const src = typeof p.sourceFolder === 'string' ? p.sourceFolder.trim().toLowerCase() : '';
    if (src && src === folderKey && city) {
      const key = slugify(city);
      cityKeyCountsInFolder.set(key, (cityKeyCountsInFolder.get(key) || 0) + 1);
      if (!byCityInFolder.has(key)) byCityInFolder.set(key, p);
    }
  }

  let added = 0;
  let updated = 0;
  let geocoded = 0;
  let skipped = 0;
  const warnings = [];

  const publicIdsInFolder = new Set();
  const cityConflicts = new Map();

  for (const r of picked) {
    const publicId = r?.public_id;
    if (!publicId) continue;

    publicIdsInFolder.add(publicId);

    const meta = r?.metadata && typeof r.metadata === 'object' ? r.metadata : {};
    const placeIdFromMeta = typeof meta.placeId === 'string' ? meta.placeId.trim() : '';
    const descFromMeta = typeof meta.desc === 'string' ? meta.desc.trim() : '';

    const parsed = parsePlaceFromPublicId(publicId);
    if (!parsed) {
      skipped += 1;
      warnings.push(`Skip (cannot parse place): ${publicId}`);
      continue;
    }

    const countryCode = parsed.countryCode;
    const city = parsed.city;

    const cityKey = slugify(city);
    if (!cityConflicts.has(cityKey)) cityConflicts.set(cityKey, []);
    cityConflicts.get(cityKey).push({ publicId, countryCode });

    const existing =
      (placeIdFromMeta && byId.get(placeIdFromMeta)) ||
      byPostcardId.get(publicId) ||
      byCountryCity.get(`${countryCode}:${slugify(city)}`) ||
      // If this point was previously auto-generated from the same folder,
      // allow country-code fixes by matching on city only (within the same folder).
      (cityKeyCountsInFolder.get(cityKey) === 1 ? byCityInFolder.get(cityKey) : null) ||
      null;

    const id = placeIdFromMeta || (existing?.id ?? toTravelPointId(countryCode, city));

    const countryName = getCountryName(countryCode) || (existing?.countryName ?? null);

    let lat = safeNumber(existing?.lat);
    let lng = safeNumber(existing?.lng);

    if (!(Number.isFinite(lat) && Number.isFinite(lng)) && !noGeocode) {
      const key = normalizeKey(countryCode, city);
      const cached = cache[key];

      if (cached && Number.isFinite(Number(cached.lat)) && Number.isFinite(Number(cached.lng))) {
        lat = Number(cached.lat);
        lng = Number(cached.lng);
      } else {
        const hit = await geocode(city, countryCode);
        if (hit) {
          lat = hit.lat;
          lng = hit.lng;
          cache[key] = { lat, lng, city, countryCode };
          geocoded += 1;
          // Be nice to Nominatim.
          await sleep(1100);
        } else {
          warnings.push(`Geocode failed: ${countryCode} ${city} (${publicId})`);
        }
      }
    }

    if (!(Number.isFinite(lat) && Number.isFinite(lng))) {
      // Can't put on map without coordinates.
      skipped += 1;
      continue;
    }

    if (existing) {
      const existingFolderKey =
        typeof existing.sourceFolder === 'string' ? existing.sourceFolder.trim().toLowerCase() : '';
      const isAutoFromSameFolder = existingFolderKey && existingFolderKey === folderKey;

      const next = {
        ...existing,
        id,
        city: isAutoFromSameFolder ? city : existing.city || city,
        countryCode: (isAutoFromSameFolder ? countryCode : existing.countryCode || countryCode).toUpperCase(),
        countryName: isAutoFromSameFolder
          ? countryName ?? existing.countryName ?? null
          : existing.countryName ?? countryName,
        lat,
        lng,
        postcardId: isAutoFromSameFolder ? publicId : existing.postcardId || publicId,
        description: existing.description ?? (descFromMeta || null),
        sourceFolder: folderArg
      };
      byId.set(id, next);
      byPostcardId.set(next.postcardId, next);
      byCountryCity.set(`${next.countryCode}:${slugify(next.city)}`, next);
      byCityInFolder.set(slugify(next.city), next);
      updated += 1;
    } else {
      const next = {
        id,
        city,
        countryCode,
        countryName,
        lat,
        lng,
        postcardId: publicId,
        description: descFromMeta || null,
        sourceFolder: folderArg
      };
      byId.set(id, next);
      byPostcardId.set(next.postcardId, next);
      byCountryCity.set(`${next.countryCode}:${slugify(next.city)}`, next);
      byCityInFolder.set(slugify(next.city), next);
      added += 1;
    }
  }

  // Warn about duplicates where the same city appears with different country codes.
  for (const [cityKey, entries] of cityConflicts.entries()) {
    if (!Array.isArray(entries) || entries.length < 2) continue;
    const codes = new Set(entries.map(e => e.countryCode));
    if (codes.size <= 1) continue;
    const sample = entries
      .slice(0, 6)
      .map(e => `${e.countryCode}:${e.publicId}`)
      .join(', ');
    warnings.push(`Conflicting country codes for city '${cityKey}': ${sample}`);
  }

  const out = Array.from(byId.values())
    .filter(Boolean)
    .filter(p => {
      if (!prune) return true;
      const src = typeof p.sourceFolder === 'string' ? p.sourceFolder.trim().toLowerCase() : '';
      if (!src || src !== folderKey) return true;
      const pid = typeof p.postcardId === 'string' ? p.postcardId.trim() : '';
      if (!pid) return true;
      return publicIdsInFolder.has(pid);
    })
    // Legacy cleanup: older runs didn't store sourceFolder.
    // If a point has no sourceFolder but we now have an auto-point from this folder
    // for the same city, drop the legacy one (helps with country-code correction renames).
    .filter(p => {
      if (!prune) return true;
      const src = typeof p.sourceFolder === 'string' ? p.sourceFolder.trim().toLowerCase() : '';
      if (src) return true;
      const pid = typeof p.postcardId === 'string' ? p.postcardId.trim() : '';
      if (!pid) return true;
      if (publicIdsInFolder.has(pid)) return true;
      const city = typeof p.city === 'string' ? p.city.trim() : '';
      if (!city) return true;
      const cityKey = slugify(city);
      const replacement = byCityInFolder.get(cityKey);
      if (!replacement) return true;
      if (replacement.id === p.id) return true;
      return false;
    })
    .sort((a, b) => {
      const cc = String(a.countryCode || '').localeCompare(String(b.countryCode || ''));
      if (cc) return cc;
      return String(a.city || '').localeCompare(String(b.city || ''), undefined, { sensitivity: 'base' });
    });

  console.log(`Cloudinary folder query: ${folderArg}`);
  console.log(`Expanded paths: ${folderPaths.join(', ')}`);
  console.log(`Processed images: ${picked.length}${limit != null ? ` (limit=${limit})` : ''}`);
  console.log(`Travel points: ${out.length} (added ${added}, updated ${updated}, skipped ${skipped})`);
  if (!noGeocode) console.log(`Geocoded (new): ${geocoded}`);
  if (prune) console.log('Prune enabled: stale auto-points removed if their postcardId is no longer in the folder.');
  if (warnings.length) {
    console.log('Warnings:');
    for (const w of warnings.slice(0, 20)) console.log(`- ${w}`);
    if (warnings.length > 20) console.log(`(and ${warnings.length - 20} more)`);
  }

  if (dryRun) {
    console.log('Dry run (no files written). Use --write to update JSON files.');
    return;
  }

  writeJson(pointsPath, out);
  writeJson(cachePath, cache);

  console.log(`Wrote: ${pointsPath}`);
  console.log(`Wrote: ${cachePath}`);
}

main().catch(err => {
  console.error('sync-travel-points failed:', err?.stack || err?.message || err);
  process.exit(1);
});
