import rawGallery from './gallery.json';
import tagLabels from './tags.json';
import albumOrder from './album-order.json';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill, limitFit } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';

const galleryData = rawGallery || {};
const dataRoot = galleryData.root || '';
const cloudName = galleryData.cloudName || deriveCloudName(galleryData);
const cld = cloudName ? new Cloudinary({ cloud: { cloudName } }) : null;

function deriveCloudName(data) {
  const folders = Object.values(data.folders || {});
  const cloudNames = new Set();
  for (const folder of folders) {
    for (const item of folder) {
      const match = typeof item?.url === 'string' && item.url.match(/res\.cloudinary\.com\/([^/]+)\//);
      if (match) cloudNames.add(match[1]);
      if (cloudNames.size > 1) return null;
    }
  }
  return cloudNames.size === 1 ? Array.from(cloudNames)[0] : null;
}

function slugify(input = '') {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'collection'
  );
}

function escapeRegExp(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanFolderId(folder) {
  if (!folder) return 'collection';
  const stripped = dataRoot ? folder.replace(new RegExp(`^${escapeRegExp(dataRoot)}/?`), '') : folder;
  return stripped || folder;
}

function humanizeFolder(folder) {
  const cleaned = cleanFolderId(folder);
  const base = cleaned
    .split('/')
    .filter(Boolean)
    .pop();
  return base
    ? base
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
    : 'Album';
}

function buildUrls(publicId, rawItem) {
  const fallbackPreview = rawItem?.url || '';
  const fallbackGrid = rawItem?.grid || fallbackPreview;
  const fallbackThumb = rawItem?.thumb || fallbackPreview;

  if (!publicId || !cld) {
    return {
      previewUrl: fallbackPreview,
      gridUrl: fallbackGrid,
      thumbUrl: fallbackThumb
    };
  }

  const previewImage = cld.image(publicId);
  previewImage.format('auto').quality('auto');
  previewImage.resize(limitFit().width(1200));

  const gridImage = cld.image(publicId);
  gridImage.format('auto').quality('auto');
  gridImage.resize(limitFit().width(720));

  const thumbImage = cld.image(publicId);
  thumbImage.format('auto').quality('auto');
  thumbImage.resize(fill().width(480).height(360).gravity(autoGravity()));

  return {
    previewUrl: previewImage.toURL(),
    gridUrl: gridImage.toURL(),
    thumbUrl: thumbImage.toURL()
  };
}

function inferTitle(publicId = '') {
  const base = publicId.split('/').pop() || 'Untitled';
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function normaliseItem(item = {}, folder) {
  const metadata = item && typeof item.metadata === 'object' && item.metadata !== null ? item.metadata : {};
  const metadataName = typeof metadata.name === 'string' ? metadata.name.trim() : '';
  const metadataDesc = typeof metadata.desc === 'string' ? metadata.desc.trim() : '';
  const metadataAuthor = typeof metadata.author === 'string' ? metadata.author.trim() : '';
  const fallbackTitle = (item.title || '').trim();
  const fallbackDescription = (item.description || '').trim();
  const title = metadataName || fallbackTitle || inferTitle(item.public_id);
  const description = metadataDesc || fallbackDescription;
  const tags = Array.isArray(item.tags) ? item.tags.filter(Boolean) : [];
  const urls = buildUrls(item.public_id, item);
  const width = Number.isFinite(Number(item.width)) ? Number(item.width) : null;
  const height = Number.isFinite(Number(item.height)) ? Number(item.height) : null;
  const aspectRatio = width && height ? Number((width / height).toFixed(5)) : null;
  const tagDetails = tags.map(code => ({
    code,
    label: tagLabels[code] || code,
    slug: slugify(code)
  }));

  return {
    id: item.public_id,
    folder,
    title,
    description,
    tags,
    author: metadataAuthor,
    metadata: {
      name: metadataName,
      desc: metadataDesc,
      author: metadataAuthor
    },
    tagDetails,
    width,
    height,
    aspectRatio,
    gridUrl: urls.gridUrl,
    previewUrl: urls.previewUrl,
    thumbUrl: urls.thumbUrl
  };
}

function buildTagIndex(albums) {
  const map = new Map();
  albums.forEach(album => {
    album.items.forEach(item => {
      item.tags.forEach(tag => {
        if (!map.has(tag)) map.set(tag, []);
        map.get(tag).push(item);
      });
    });
  });
  const list = Array.from(map.entries()).map(([code, items]) => ({
    code,
    label: tagLabels[code] || code,
    slug: slugify(code),
    items
  }));
  list.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  return { map, list };
}

const toOrderKey = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const manualOrderList = Array.isArray(albumOrder) ? albumOrder : [];
const manualOrderMap = new Map(
  manualOrderList
    .map((entry, index) => [toOrderKey(entry), index])
);

const getOrderIndex = (id, name) => {
  const idKey = toOrderKey(id);
  if (manualOrderMap.has(idKey)) return manualOrderMap.get(idKey);
  const nameKey = toOrderKey(name);
  if (manualOrderMap.has(nameKey)) return manualOrderMap.get(nameKey);
  return null;
};

function buildAlbums() {
  const entries = Object.entries(galleryData.folders || {});
  const albums = entries
    .map(([folder, rawItems]) => {
      const cleanedId = cleanFolderId(folder);
      const items = (rawItems || []).map(item => normaliseItem(item, cleanedId));
      const name = humanizeFolder(folder);
      const displayName = name === 'Main Album' ? 'Main Folder' : name;
      const orderIndex = getOrderIndex(cleanedId, displayName);
      return {
        id: cleanedId,
        slug: slugify(cleanedId),
        name: displayName,
        items,
        orderIndex
      };
    })
    .filter(album => album.items.length > 0)
    .sort((a, b) => {
      const indexA = typeof a.orderIndex === 'number' ? a.orderIndex : Number.POSITIVE_INFINITY;
      const indexB = typeof b.orderIndex === 'number' ? b.orderIndex : Number.POSITIVE_INFINITY;
      if (indexA !== indexB) {
        return indexA - indexB;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

  const { map: tagMap, list: tags } = buildTagIndex(albums);

  return {
    albums,
    tags,
    tagMap
  };
}

const { albums, tags, tagMap } = buildAlbums();

export function getAlbums() {
  return albums;
}

export function getAlbumBySlug(slug) {
  return albums.find(album => album.slug === slug);
}

export function getAlbumPaths() {
  return albums.map(album => ({
    params: { album: album.slug }
  }));
}

export function getTags() {
  return tags;
}

export function getTagBySlug(slug) {
  return tags.find(tag => tag.slug === slug);
}

export function getTagPaths() {
  return tags.map(tag => ({
    params: { tag: tag.slug }
  }));
}

export function getItemsForTag(code) {
  const existing = tagMap.get(code);
  return existing ? [...existing] : [];
}

export function getAllItems() {
  return albums.flatMap(album =>
    album.items.map((item, index) => ({
      ...item,
      albumId: album.id,
      albumSlug: album.slug,
      albumName: album.name,
      albumIndex: index,
      albumOrderIndex: typeof album.orderIndex === 'number' ? album.orderIndex : Number.POSITIVE_INFINITY
    }))
  );
}

export function getItemById(id) {
  const allItems = getAllItems();
  return allItems.find(item => item.id === id);
}

export function getItemPaths() {
  const allItems = getAllItems();
  return allItems.map(item => ({
    params: { id: item.id }
  }));
}

export const hero = {
  title: "amarantha's postcards for swap",
  subtitle: 'collected with love, shared with joy'
};

export const site = {
  title: "amarantha's postcards",
  description: 'Postcards waiting for new journeys'
};
