import { getUserLocale, t, tPlural } from '../i18n';

// Localize static text elements
export function localizeStaticText() {
  // Get current locale each time (in case user switched language)
  const locale = getUserLocale();
  
  // For English, only localize tags (to prettify codes like "bluecats" -> "Blue Cats")
  if (locale === 'en') {
    // Localize tags via data-i18n="tags.*"
    document.querySelectorAll('[data-i18n^="tags."]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translated = t(locale, key);
        // Only update if translation exists (not returning the key itself)
        if (translated !== key) {
          el.textContent = translated;
        }
      }
    });
    document.documentElement.classList.add('i18n-ready');
    return;
  }
  
  // Localize navigation and static text
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      const translated = t(locale, key);
      // Only update if translation exists (not returning the key itself)
      if (translated !== key) {
        el.textContent = translated;
      }
    }
  });
  
  // Localize element titles (like back buttons)
  document.querySelectorAll('[data-i18n-back]').forEach(el => {
    const key = 'header.backToFolders';
    el.textContent = t(locale, key);
  });
  
  // Localize tag labels
  document.querySelectorAll('[data-tag-label]').forEach(el => {
    const tagLabel = el.getAttribute('data-tag-label');
    if (tagLabel) {
      const translatedTag = t(locale, `tags.${tagLabel}`);
      // Update text even if translation is same as original
      if (translatedTag && translatedTag !== `tags.${tagLabel}`) {
        el.textContent = translatedTag;
      }
    }
  });
  
  // Localize album titles (data-i18n-title with album name in content)
  document.querySelectorAll('[data-i18n-title="true"]').forEach(el => {
    const i18nType = el.getAttribute('data-i18n-type');
    const text = el.textContent?.trim();
    
    if (!text) return;
    
    if (i18nType === 'tag') {
      // For tags, look in tags.* namespace
      const translatedTag = t(locale, `tags.${text}`);
      if (translatedTag && translatedTag !== text) {
        el.textContent = translatedTag;
      }
    } else if (i18nType === 'page') {
      // For static pages, use direct translation keys
      if (text === 'Postcard Folders') {
        el.textContent = t(locale, 'header.postcardFolders');
      } else if (text === 'All postcards') {
        el.textContent = t(locale, 'header.allPostcardsTitle');
      }
    } else {
      // For albums (default), look in albums.* namespace
      const translatedName = t(locale, `albums.${text}`);
      if (translatedName && translatedName !== text) {
        el.textContent = translatedName;
      }
    }
  });
  
  // Localize subtitles with counts (e.g., "8 postcards")
  document.querySelectorAll('[data-i18n-subtitle="true"]').forEach(el => {
    const i18nType = el.getAttribute('data-i18n-type');
    const text = el.textContent?.trim();
    
    if (!text) return;
    
    if (i18nType === 'page') {
      // Static subtitle text
      if (text === 'A look through my mail shelves') {
        el.textContent = t(locale, 'header.postcardsSubtitle');
      }
      // For postcards.astro page, keep the dynamic count handling below
    }
    
    // Extract count from text like "8 postcards" or "507 postcards across 15 folders"
    const match = text.match(/^(\d+)\s+/);
    if (match) {
      const count = parseInt(match[1]);
      el.textContent = tPlural(locale, 'album.itemsCount', count);
    }
  });
  
  // Localize counts with pluralization
  document.querySelectorAll('[data-count]').forEach(el => {
    const count = parseInt(el.getAttribute('data-count') || '0');
    const key = el.getAttribute('data-count-key');
    if (key) {
      el.textContent = tPlural(locale, key, count);
    }
  });
  
  // Mark as ready to show content
  document.documentElement.classList.add('i18n-ready');
}

// Localize album names
export function localizeAlbumName(albumName: string): string {
  const locale = getUserLocale();
  return t(locale, `albums.${albumName}`) || albumName;
}

// Localize tag labels
export function localizeTagLabel(tagCode: string): string {
  const locale = getUserLocale();
  return t(locale, `tags.${tagCode}`) || tagCode;
}

// Localize plural counts
export function localizeCount(key: string, count: number): string {
  const locale = getUserLocale();
  return tPlural(locale, key, count);
}
