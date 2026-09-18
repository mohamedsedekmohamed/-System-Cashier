import type { PaginatedMeta } from './common';

export interface MaterialName {
  ar: string;
  en: string;
}

export interface MaterialCategory {
  id: number;
  name: MaterialName;
  type?: string;
  image?: string;
  description?: MaterialName;
  category_id?: number | null;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Material {
  id: number;
  name: MaterialName;
  stock: number;
  status: boolean;
  category_id: number;
  category: MaterialCategory;
  created_at: string;
  updated_at: string;
}

export interface MaterialFormData {
  name: MaterialName;
  stock: number;
  status: boolean;
  category_id: number;
}

export interface MaterialSelectOptions {
  categories: MaterialCategory[];
}

export interface MaterialListResponse {
  data: Material[];
  meta: PaginatedMeta;
  links: any;
  select_options?: MaterialSelectOptions;
}

export interface SingleMaterialResponse {
  status: boolean;
  data: Material;
  select_options?: MaterialSelectOptions;
}

export interface MaterialSelectOptionsResponse {
  status: boolean;
  data: MaterialSelectOptions;
}
