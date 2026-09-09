import { Category } from './index';

export interface ProductRecipe {
  id: number;
  name: {
    ar: string;
    en: string;
  };
  status: boolean;
  stock: number;
  category_id: number;
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface ProductRecipeFormData {
  name: {
    ar: string;
    en: string;
  };
  status: boolean;
  stock: number;
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
  };
}

export interface SingleProductRecipeResponse {
  status: boolean;
  data: ProductRecipe;
  select_options: {
    categories: Category[];
  };
}

export interface ProductRecipeSelectOptionsResponse {
  status: boolean;
  data: {
    categories: Category[];
  };
}
