import { api } from '../lib/axios';
import type { 
  ManufacturingList, 
  ManufacturingFormData, 
  ManufacturingListResponse, 
  SingleManufacturingResponse, 
  ManufacturingSelectOptionsResponse,
  ManufacturingSpecificationResponse
} from '../types';

export const MANUFACTURING_KEY = 'manufacturing';
export const MANUFACTURING_SELECT_OPTIONS_KEY = 'manufacturing_select_options';

export const manufacturingApi = {
  /** GET /api/admin/product-manufacturings/select-options */
  getSelectOptions: async (): Promise<ManufacturingSelectOptionsResponse> => {
    const { data } = await api.get<ManufacturingSelectOptionsResponse>('/api/admin/product-manufacturings/select-options');
    return data;
  },

  /** GET /api/admin/product-manufacturings/specifications */
  getSpecifications: async (params: { product_id?: number | null, product_recipe_id?: number | null }): Promise<ManufacturingSpecificationResponse> => {
    const { data } = await api.get<ManufacturingSpecificationResponse>('/api/admin/product-manufacturings/specifications', { params });
    return data;
  },

  /** GET /api/admin/product-manufacturings?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<ManufacturingListResponse> => {
    const { data } = await api.get<ManufacturingListResponse>(
      '/api/admin/product-manufacturings',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/product-manufacturings/:id */
  get: async (id: number | string): Promise<SingleManufacturingResponse> => {
    const { data } = await api.get<SingleManufacturingResponse>(`/api/admin/product-manufacturings/${id}`);
    return data;
  },

  /** POST /api/admin/product-manufacturings */
  create: async (payload: ManufacturingFormData): Promise<ManufacturingList> => {
    const { data } = await api.post<{ data: ManufacturingList }>('/api/admin/product-manufacturings', payload);
    return data.data;
  },

  /** PUT /api/admin/product-manufacturings/:id */
  update: async (id: number | string, payload: ManufacturingFormData): Promise<ManufacturingList> => {
    const { data } = await api.put<{ data: ManufacturingList }>(`/api/admin/product-manufacturings/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/product-manufacturings/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/product-manufacturings/${id}`);
  },
};
