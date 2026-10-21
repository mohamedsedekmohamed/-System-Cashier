import type { LocalizedString } from '../types';

export const renderName = (name: any, lang: 'ar' | 'en' = 'ar'): string => {
  if (name === null || name === undefined) return '';

  if (Array.isArray(name)) {
    const valid = name.filter(Boolean);
    if (valid.length === 0) return '';
    return renderName(valid[0], lang);
  }
  
  if (typeof name === 'object') {
    if ('ar' in name || 'en' in name) {
      return name[lang] || name.ar || name.en || '';
    }
    if ('name' in name) {
      return renderName(name.name, lang);
    }
    if ('branch_name' in name) {
      return renderName(name.branch_name, lang);
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
  return renderName(str, lang);
};
