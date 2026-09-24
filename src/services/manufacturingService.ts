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
  /** GET /api/admin/manufacturing/select-options */
  getSelectOptions: async (branch_id?: number): Promise<ManufacturingSelectOptionsResponse> => {
    const params: Record<string, any> = {};
    if (branch_id) params.branch_id = branch_id;
    try {
      const { data } = await api.get<ManufacturingSelectOptionsResponse>('/api/admin/manufacturing/select-options', { params });
      return data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const { data } = await api.get<ManufacturingSelectOptionsResponse>('/api/admin/product-manufacturings/select-options', { params });
        return data;
      }
      throw err;
    }
  },

  /** GET /api/admin/manufacturing/specifications */
  getSpecifications: async (params: { product_id?: number | null, product_recipe_id?: number | null, branch_id?: number | null }): Promise<ManufacturingSpecificationResponse> => {
    try {
      const { data } = await api.get<ManufacturingSpecificationResponse>('/api/admin/manufacturing/specifications', { params });
      return data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const { data } = await api.get<ManufacturingSpecificationResponse>('/api/admin/product-manufacturings/specifications', { params });
        return data;
      }
      throw err;
    }
  },

  /** GET /api/admin/manufacturing?page=&per_page= */
  list: async (page = 1, perPage = 15, branch_id?: number): Promise<ManufacturingListResponse> => {
    const params: Record<string, any> = { page, per_page: perPage };
    if (branch_id) params.branch_id = branch_id;
    try {
      const { data } = await api.get<ManufacturingListResponse>('/api/admin/manufacturing', { params });
      return data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const { data } = await api.get<ManufacturingListResponse>('/api/admin/product-manufacturings', { params });
        return data;
      }
      throw err;
    }
  },

  /** GET /api/admin/manufacturing/:id */
  get: async (id: number | string): Promise<SingleManufacturingResponse> => {
    try {
      const { data } = await api.get<SingleManufacturingResponse>(`/api/admin/manufacturing/${id}`);
      return data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const { data } = await api.get<SingleManufacturingResponse>(`/api/admin/product-manufacturings/${id}`);
        return data;
      }
      throw err;
    }
  },

  /** POST /api/admin/manufacturing */
  create: async (payload: ManufacturingFormData): Promise<ManufacturingList> => {
    try {
      const { data } = await api.post<{ data: ManufacturingList }>('/api/admin/manufacturing', payload);
      return data.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const { data } = await api.post<{ data: ManufacturingList }>('/api/admin/product-manufacturings', payload);
        return data.data;
      }
      throw err;
    }
  },

  /** PUT /api/admin/manufacturing/:id */
  update: async (id: number | string, payload: ManufacturingFormData): Promise<ManufacturingList> => {
    try {
      const { data } = await api.put<{ data: ManufacturingList }>(`/api/admin/manufacturing/${id}`, payload);
      return data.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const { data } = await api.put<{ data: ManufacturingList }>(`/api/admin/product-manufacturings/${id}`, payload);
        return data.data;
      }
      throw err;
    }
  },

  /** DELETE /api/admin/manufacturing/:id */
  delete: async (id: number | string): Promise<void> => {
    try {
      await api.delete(`/api/admin/manufacturing/${id}`);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        await api.delete(`/api/admin/product-manufacturings/${id}`);
        return;
      }
      throw err;
    }
  },
};
