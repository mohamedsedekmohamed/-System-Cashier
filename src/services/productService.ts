import { api } from '../lib/axios';
import type { 
  Product, 
  ProductFormData, 
  ProductListResponse, 
  SingleProductResponse, 
  ProductSelectOptionsResponse 
} from '../types';

export const PRODUCTS_KEY = 'products';
export const PRODUCTS_SELECT_OPTIONS_KEY = 'products_select_options';

export const productApi = {
  /** GET /api/admin/products/select-options */
  getSelectOptions: async (): Promise<ProductSelectOptionsResponse> => {
    const { data } = await api.get<ProductSelectOptionsResponse>('/api/admin/products/select-options');
    return data;
  },

  /** GET /api/admin/products?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<ProductListResponse> => {
    const { data } = await api.get<ProductListResponse>(
      '/api/admin/products',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/products/:id */
  get: async (id: number | string): Promise<SingleProductResponse> => {
    const { data } = await api.get<SingleProductResponse>(`/api/admin/products/${id}`);
    return data;
  },

  /** POST /api/admin/products */
  create: async (payload: ProductFormData): Promise<Product> => {
    const { data } = await api.post<{ data: Product }>('/api/admin/products', payload);
    return data.data;
  },

  /** PUT /api/admin/products/:id */
  update: async (id: number | string, payload: ProductFormData): Promise<Product> => {
    const { data } = await api.put<{ data: Product }>(`/api/admin/products/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/products/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/products/${id}`);
  },
};
