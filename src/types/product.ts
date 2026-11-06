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

export interface ProductRecipePayloadItem {
  id?: number;
  material_id?: number | null;
  product_recipe_id?: number | null;
  count: number;
  unit_id: number;
}

export interface ProductRecipeResponseItem {
  id: number;
  product_manufact_id?: number;
  material_id: number | null;
  material: { id: number; name: LocalizedName | string } | null;
  product_recipe_id: number | null;
  product_recipe: { id: number; name: LocalizedName | string } | null;
  count: number;
  unit_id: number;
  unit: { id: number; name: LocalizedName | string; value?: number } | null;
}

export interface ProductSelectOptionMaterial {
  id: number;
  name: LocalizedName | string;
}

export interface ProductSelectOptionRecipe {
  id: number;
  name: LocalizedName | string;
}

export interface ProductSelectOptionUnit {
  id: number;
  name: LocalizedName | string;
  value: number;
}

export interface Product {
  id: number;
  name: LocalizedName;
  description: LocalizedName;
  image: string;
  price: number;
  tax_id: number | null;
  tax: ProductTax | null;
  discount_id: number | null;
  discount: ProductDiscount | null;
  category_id: number;
  category: ProductCategory;
  sub_category_id: number | null;
  sub_category: ProductCategory | null;
  variations: ProductVariation[];
  recipes?: ProductRecipeResponseItem[];
  product_manufacturing?: {
    id: number;
    product_id: number;
    recipes: ProductRecipeResponseItem[];
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: LocalizedName;
  description: LocalizedName;
  price: number;
  image: string | File | null;
  tax_id: number | null;
  discount_id: number | null;
  category_id: number;
  sub_category_id: number | null;
  variations: ProductVariation[];
  recipes?: ProductRecipePayloadItem[];
}

export interface ProductSelectOptions {
  tax: ProductTax[];
  discount: ProductDiscount[];
  parent_categories: ProductCategory[];
  sub_categories: ProductCategory[];
  materials?: ProductSelectOptionMaterial[];
  product_recipes?: ProductSelectOptionRecipe[];
  units?: ProductSelectOptionUnit[];
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
