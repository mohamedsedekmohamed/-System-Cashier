import type { LocalizedString } from '../types';

export const renderName = (name: any, lang: 'ar' | 'en' = 'ar'): string => {
  if (!name) return '';
  
  if (typeof name === 'object' && name !== null) {
    if ('ar' in name || 'en' in name) {
      return name[lang] || name.ar || name.en || '';
    }
  }
  
  return String(name);
};

export const getLocalizedString = (
  str: LocalizedString | string | undefined | null,
  lang: 'ar' | 'en' = 'ar'
): string => {
  if (!str) return '';
  if (typeof str === 'string') return str;
  return str[lang] || str.ar || str.en || '';
};
