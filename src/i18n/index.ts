import en from './locales/en.json';
import ru from './locales/ru.json';

export type Locale = 'en' | 'ru';

export const locales: Record<Locale, typeof en> = {
  en,
  ru
};

export const defaultLocale: Locale = 'en';

// Get user's preferred language
export function getUserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  const saved = localStorage.getItem('locale');
  if (saved && (saved === 'en' || saved === 'ru')) {
    return saved as Locale;
  }
  
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ru')) {
    return 'ru';
  }
  
  return defaultLocale;
}

// Set locale
export function setLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('locale', locale);
  window.location.reload();
}

// Get translation
export function t(locale: Locale, key: string): string {
  const keys = key.split('.');
  let value: any = locales[locale];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key;
}

// Get translation with parameter substitution
export function tParams(locale: Locale, key: string, params: Record<string, string | number>): string {
  let text = t(locale, key);
  
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, String(params[param]));
  });
  
  return text;
}

// Russian pluralization rules
// Returns 0 for forms like "5 открыток", 1 for "1 открытка", 2 for "2 открытки"
function getRussianPluralForm(n: number): number {
  const mod10 = n % 10;
  const mod100 = n % 100;
  
  if (mod10 === 1 && mod100 !== 11) {
    return 1; // 1, 21, 31... открытка
  }
  
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 2; // 2-4, 22-24... открытки
  }
  
  return 0; // 0, 5-20, 25-30... открыток
}

// English pluralization rules
function getEnglishPluralForm(n: number): number {
  return n === 1 ? 1 : 0;
}

// Get plural form index
function getPluralForm(locale: Locale, n: number): number {
  if (locale === 'ru') {
    return getRussianPluralForm(n);
  }
  return getEnglishPluralForm(n);
}

// Get translation with pluralization
// key should point to an array: ["form0", "form1", "form2"]
export function tPlural(locale: Locale, key: string, count: number): string {
  const keys = key.split('.');
  let value: any = locales[locale];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key;
    }
  }
  
  if (Array.isArray(value)) {
    const formIndex = getPluralForm(locale, count);
    const text = value[formIndex] || value[0] || key;
    return text.replace('{count}', String(count));
  }
  
  return key;
}
