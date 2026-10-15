import type { LocalizedString, LocalizedDescription, PaginatedMeta } from './common';

export type CategoryType = 'product' | 'material' | 'recipe';

export interface CategoryOption {
  id: number;
  name: LocalizedString;
}

export interface Category {
  id: number;
  name: LocalizedString;
  image: string | null;
  description: LocalizedDescription | null;
  category_id: number | null;
  type: CategoryType | null;
  status: boolean;
  parent?: Category | null;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryFormData {
  name: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
  image: File | string | null;
  category_id: number | null;
  type: CategoryType | null;
  status: boolean;
}

export interface CategoryListResponse {
  data: Category[];
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta: PaginatedMeta;
  select_options?: {
    categories: CategoryOption[];
  };
}

export interface SingleCategoryResponse {
  status: boolean;
  data: Category;
  select_options?: {
    categories: CategoryOption[];
  };
}

export interface CategorySelectOptionsResponse {
  status: boolean;
  data: {
    categories: CategoryOption[];
  };
}
