import type { ProductRecipe } from './productRecipe';
import type { Material } from './material';
import type { Branch, BranchOption } from './branch';

export interface Waste {
  id: number;
  branch_id?: number;
  branch?: Branch | null;
  product_recipe_id?: number | null;
  product_recipe?: ProductRecipe | null;
  material_id?: number | null;
  material?: Material | null;
  count: number;
  created_at?: string;
  updated_at?: string;
}

export interface WasteFormData {
  branch_id: number;
  product_recipe_id?: number | null;
  material_id?: number | null;
  count: number;
}

export interface WasteUpdateData {
  count: number;
}

export interface WasteSelectOptions {
  branches: BranchOption[];
  materials: Pick<Material, 'id' | 'name' | 'stock'>[];
  product_recipes: Pick<ProductRecipe, 'id' | 'name' | 'stock'>[];
}

export interface WasteListResponse {
  data: Waste[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  select_options: WasteSelectOptions;
}

export interface SingleWasteResponse {
  status: boolean;
  data: Waste;
  select_options: WasteSelectOptions;
}

export interface WasteSelectOptionsResponse {
  status: boolean;
  data: WasteSelectOptions;
}
