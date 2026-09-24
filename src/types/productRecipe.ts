import type { BranchOption } from './branch';

export interface Category {
  id: number;
  name: {
    ar: string;
    en: string;
  };
}

export interface ProductRecipeStockItem {
  branch_id: number;
  branch_name?: { en: string; ar: string } | string;
  stock: number;
}

export interface ProductRecipe {
  id: number;
  name: {
    ar: string;
    en: string;
  };
  status: boolean;
  category_id: number;
  category?: Category;
  stock?: number;
  total_stock?: number;
  stocks?: ProductRecipeStockItem[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProductRecipeFormData {
  name: {
    ar: string;
    en: string;
  };
  status: boolean;
  category_id: number;
}

export interface ProductRecipeListResponse {
  data: ProductRecipe[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  select_options: {
    categories: Category[];
    branches?: BranchOption[];
  };
}

export interface SingleProductRecipeResponse {
  status: boolean;
  data: ProductRecipe;
  select_options: {
    categories: Category[];
    branches?: BranchOption[];
  };
}

export interface ProductRecipeSelectOptionsResponse {
  status: boolean;
  data: {
    categories: Category[];
    branches?: BranchOption[];
  };
}
