import type { LocalizedString } from '../types';

export const renderName = (name: any, lang: 'ar' | 'en' = 'ar'): string => {
  if (name === null || name === undefined) return '';
  
  if (typeof name === 'object') {
    if ('name' in name) {
      return renderName(name.name, lang);
    }
    if ('ar' in name || 'en' in name) {
      return name[lang] || name.ar || name.en || '';
    }
    if ('title' in name) {
      return renderName(name.title, lang);
    }
    if ('label' in name) {
      return renderName(name.label, lang);
    }
    return '';
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
