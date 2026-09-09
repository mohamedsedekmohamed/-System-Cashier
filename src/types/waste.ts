import type { ProductRecipe } from './productRecipe';
import type { Material } from './material';

export interface Waste {
  id: number;
  product_recipe_id: number;
  product_recipe?: ProductRecipe;
  material_id: number;
  material?: Material;
  count: number;
  created_at?: string;
  updated_at?: string;
}

export interface WasteFormData {
  product_recipe_id: number;
  material_id: number;
  count: number;
}

export interface WasteUpdateData {
  count: number;
}

export interface WasteListResponse {
  data: Waste[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  select_options: {
    materials: Pick<Material, 'id' | 'name' | 'stock'>[];
    product_recipes: Pick<ProductRecipe, 'id' | 'name' | 'stock'>[];
  };
}

export interface SingleWasteResponse {
  status: boolean;
  data: Waste;
  select_options: {
    materials: Pick<Material, 'id' | 'name' | 'stock'>[];
    product_recipes: Pick<ProductRecipe, 'id' | 'name' | 'stock'>[];
  };
}

export interface WasteSelectOptionsResponse {
  status: boolean;
  data: {
    materials: Pick<Material, 'id' | 'name' | 'stock'>[];
    product_recipes: Pick<ProductRecipe, 'id' | 'name' | 'stock'>[];
  };
}
