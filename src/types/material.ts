import type { PaginatedMeta } from './common';
import type { BranchOption } from './branch';

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

export interface MaterialStockItem {
  branch_id: number;
  branch_name?: { en: string; ar: string } | string;
  stock: number;
}

export interface Material {
  id: number;
  name: MaterialName;
  status: boolean;
  category_id: number;
  category: MaterialCategory;
  stock?: number;
  total_stock?: number;
  stocks?: MaterialStockItem[] | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialFormData {
  name: MaterialName;
  status: boolean;
  category_id: number;
}

export interface MaterialSelectOptions {
  categories: MaterialCategory[];
  branches?: BranchOption[];
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
