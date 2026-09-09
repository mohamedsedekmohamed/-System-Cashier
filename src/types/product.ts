import type { PaginatedMeta } from './common';

export interface LocalizedName {
  ar: string;
  en: string;
}

export interface ProductTax {
  id: number;
  name: LocalizedName;
  type: 'percentage' | 'value';
  amount: number | string;
  status?: boolean;
}

export interface ProductDiscount {
  id: number;
  name: LocalizedName;
  type: 'percentage' | 'value';
  amount: number | string;
  status?: boolean;
}

export interface ProductCategory {
  id: number;
  name: LocalizedName;
  type: string;
  image?: string;
  description?: LocalizedName;
}

export interface ProductVariationOption {
  id?: number;
  name: LocalizedName;
  price: number;
  status: boolean;
  product_id?: number;
  variation_id?: number;
}

export interface ProductVariation {
  id?: number;
  name: LocalizedName;
  status: boolean;
  required: boolean;
  product_id?: number;
  options: ProductVariationOption[];
}

export interface Product {
  id: number;
  name: LocalizedName;
  description: LocalizedName;
  image: string;
  price: number;
  stock: number;
  tax_id: number | null;
  tax: ProductTax | null;
  discount_id: number | null;
  discount: ProductDiscount | null;
  category_id: number;
  category: ProductCategory;
  sub_category_id: number | null;
  sub_category: ProductCategory | null;
  variations: ProductVariation[];
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: LocalizedName;
  description: LocalizedName;
  price: number;
  image: string;
  stock: number;
  tax_id: number | null;
  discount_id: number | null;
  category_id: number;
  sub_category_id: number | null;
  variations: ProductVariation[];
}

export interface ProductSelectOptions {
  tax: ProductTax[];
  discount: ProductDiscount[];
  parent_categories: ProductCategory[];
  sub_categories: ProductCategory[];
}

export interface ProductListResponse {
  data: Product[];
  meta: PaginatedMeta;
  links: any;
  select_options?: ProductSelectOptions;
}

export interface SingleProductResponse {
  status: boolean;
  data: Product;
  select_options?: ProductSelectOptions;
}

export interface ProductSelectOptionsResponse {
  status: boolean;
  data: ProductSelectOptions;
}
