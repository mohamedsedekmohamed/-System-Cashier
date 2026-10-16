import { api } from '../lib/axios';
import type { 
  ProductManufacturing, 
  ProductManufacturingFormData, 
  ProductManufacturingListResponse, 
  SingleProductManufacturingResponse, 
  ProductManufacturingSelectOptionsResponse 
} from '../types';

export const PRODUCT_MANUFACTURING_KEY = 'product_manufacturings';
export const PRODUCT_MANUFACTURING_SELECT_OPTIONS_KEY = 'product_manufacturing_select_options';

export const productManufacturingApi = {
  /** GET /api/admin/product-manufacturings/select-options */
  getSelectOptions: async (): Promise<ProductManufacturingSelectOptionsResponse> => {
    const { data } = await api.get<ProductManufacturingSelectOptionsResponse>(
      '/api/admin/product-manufacturings/select-options'
    );
    return data;
  },

  /** GET /api/admin/product-manufacturings?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<ProductManufacturingListResponse> => {
    const { data } = await api.get<ProductManufacturingListResponse>(
      '/api/admin/product-manufacturings',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/product-manufacturings/:id */
  get: async (id: number | string): Promise<SingleProductManufacturingResponse> => {
    const { data } = await api.get<SingleProductManufacturingResponse>(
      `/api/admin/product-manufacturings/${id}`
    );
    return data;
  },

  /** POST /api/admin/product-manufacturings */
  create: async (payload: ProductManufacturingFormData): Promise<ProductManufacturing> => {
    const { data } = await api.post<{ data: ProductManufacturing }>(
      '/api/admin/product-manufacturings',
      payload
    );
    return data.data;
  },

  /** PUT /api/admin/product-manufacturings/:id */
  update: async (id: number | string, payload: ProductManufacturingFormData): Promise<ProductManufacturing> => {
    const { data } = await api.put<{ data: ProductManufacturing }>(
      `/api/admin/product-manufacturings/${id}`,
      payload
    );
    return data.data;
  },

  /** DELETE /api/admin/product-manufacturings/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/product-manufacturings/${id}`);
  },
};
