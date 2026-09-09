import { api } from '../lib/axios';
import type { 
  ProductRecipe, 
  ProductRecipeFormData, 
  ProductRecipeListResponse, 
  SingleProductRecipeResponse, 
  ProductRecipeSelectOptionsResponse 
} from '../types';

export const PRODUCT_RECIPES_KEY = 'product_recipes';
export const PRODUCT_RECIPES_SELECT_OPTIONS_KEY = 'product_recipes_select_options';

export const productRecipeApi = {
  /** GET /api/admin/product-recipes/select-options */
  getSelectOptions: async (): Promise<ProductRecipeSelectOptionsResponse> => {
    const { data } = await api.get<ProductRecipeSelectOptionsResponse>('/api/admin/product-recipes/select-options');
    return data;
  },

  /** GET /api/admin/product-recipes?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<ProductRecipeListResponse> => {
    const { data } = await api.get<ProductRecipeListResponse>(
      '/api/admin/product-recipes',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/product-recipes/:id */
  get: async (id: number | string): Promise<SingleProductRecipeResponse> => {
    const { data } = await api.get<SingleProductRecipeResponse>(`/api/admin/product-recipes/${id}`);
    return data;
  },

  /** POST /api/admin/product-recipes */
  create: async (payload: ProductRecipeFormData): Promise<ProductRecipe> => {
    const { data } = await api.post<{ data: ProductRecipe }>('/api/admin/product-recipes', payload);
    return data.data;
  },

  /** PUT /api/admin/product-recipes/:id */
  update: async (id: number | string, payload: ProductRecipeFormData): Promise<ProductRecipe> => {
    const { data } = await api.put<{ data: ProductRecipe }>(`/api/admin/product-recipes/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/product-recipes/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/product-recipes/${id}`);
  },
};
