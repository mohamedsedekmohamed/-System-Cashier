import type { PaginatedMeta } from './common';

export interface ManufacturingName {
  ar: string;
  en: string;
}

export interface ManufacturingProduct {
  id: number;
  name: ManufacturingName;
  stock?: number;
}

export interface ManufacturingProductRecipe {
  id: number;
  name: ManufacturingName;
  stock?: number;
}

export interface ManufacturingMaterial {
  id: number;
  name: ManufacturingName;
  stock?: number;
}

export interface ManufacturingRecipeItem {
  id: number;
  manufacturing_list_id: number;
  material_id: number | null;
  material: ManufacturingMaterial | null;
  product_recipe_id: number | null;
  product_recipe: ManufacturingProductRecipe | null;
  count: number;
  created_at: string;
  updated_at: string;
}

export interface ManufacturingList {
  id: number;
  product_id: number | null;
  product: ManufacturingProduct | null;
  product_recipe_id: number | null;
  product_recipe: ManufacturingProductRecipe | null;
  count: number;
  recipes: ManufacturingRecipeItem[];
  created_at: string;
  updated_at: string;
}

export interface ManufacturingRecipePayload {
  material_id: number | null;
  product_recipe_id: number | null;
  count: number;
}

export interface ManufacturingFormData {
  product_id: number | null;
  product_recipe_id: number | null;
  count: number;
  recipes: ManufacturingRecipePayload[];
}

export interface ManufacturingSelectOptions {
  products: ManufacturingProduct[];
  product_recipes: ManufacturingProductRecipe[];
  materials: ManufacturingMaterial[];
}

export interface ManufacturingListResponse {
  data: ManufacturingList[];
  meta: PaginatedMeta;
  links: any;
  select_options?: ManufacturingSelectOptions;
}

export interface SingleManufacturingResponse {
  status: boolean;
  data: ManufacturingList;
}

export interface ManufacturingSelectOptionsResponse {
  status: boolean;
  data: ManufacturingSelectOptions;
}

export interface ManufacturingSpecificationResponse {
  status: boolean;
  data: any; // We can type this based on the provided JSON
}
