const hiddenTagSlugs = new Set(['envelope']);

function getSlug(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.slug === 'string') return value.slug;
  return null;
}

export function isTagHidden(tagOrSlug) {
  const slug = getSlug(tagOrSlug);
  if (!slug) return false;
  return hiddenTagSlugs.has(slug);
}

export function filterVisibleTags(list = []) {
  return list.filter(tag => !isTagHidden(tag));
}
