import type { PaginatedMeta } from './common';
import type { BranchOption } from './branch';
import type { Unit } from './unit';

export interface RecipeInventorySelectOptions {
  branches: BranchOption[];
  units?: Unit[];
}

export interface RecipeInventorySelectOptionsResponse {
  status: boolean;
  data: RecipeInventorySelectOptions;
}

export interface RecipeInventoryListItem {
  id: string | number;
  name: string;
  branch_id: string | number;
  branch_name: string;
  status: string;
  created_at: string;
  date: string;
  created_at_full: string;
  updated_at: string;
}

export interface RecipeInventoryListResponse {
  data: RecipeInventoryListItem[];
  links?: any;
  meta: PaginatedMeta;
}

export interface RecipeInventoryItem {
  id: number;
  inventory_id: number;
  material_id?: number;
  recipe_id?: number;
  material_name?: any;
  recipe_name?: any;
  name?: any;
  stock: number;
  actual_stock: number;
  deficit: number;
  shortage?: number;
  difference?: number;
  unit_id?: number | null;
  unit?: Unit | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeInventoryDetail {
  id: string | number;
  name: string;
  branch_id: string | number;
  branch_name: string;
  status: string;
  created_at: string;
  date: string;
  created_at_full: string;
  updated_at: string;
  total_items: string | number;
  total_deficit: number;
  items: RecipeInventoryItem[];
}

export interface RecipeInventoryDetailResponse {
  status: boolean;
  data: RecipeInventoryDetail;
}

export interface CreateRecipeInventoryPayload {
  name: string;
  branch_id: number;
}

export interface UpdateRecipeInventoryItemsPayload {
  items: Array<{
    id: number;
    actual_stock: number;
    unit_id?: number | null;
  }>;
}

export interface UpdateRecipeInventoryStatusPayload {
  status: 'approve' | 'reject';
}

export interface UpdateSingleRecipeItemPayload {
  actual_stock: number;
  unit_id?: number | null;
}
