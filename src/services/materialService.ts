import { api } from '../lib/axios';
import type { 
  Material, 
  MaterialFormData, 
  MaterialListResponse, 
  SingleMaterialResponse, 
  MaterialSelectOptionsResponse 
} from '../types';

export const MATERIALS_KEY = 'materials';
export const MATERIALS_SELECT_OPTIONS_KEY = 'materials_select_options';

export const materialApi = {
  /** GET /api/admin/materials/select-options */
  getSelectOptions: async (): Promise<MaterialSelectOptionsResponse> => {
    const { data } = await api.get<MaterialSelectOptionsResponse>('/api/admin/materials/select-options');
    return data;
  },

  /** GET /api/admin/materials?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<MaterialListResponse> => {
    const { data } = await api.get<MaterialListResponse>(
      '/api/admin/materials',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/materials/:id */
  get: async (id: number | string): Promise<SingleMaterialResponse> => {
    const { data } = await api.get<SingleMaterialResponse>(`/api/admin/materials/${id}`);
    return data;
  },

  /** POST /api/admin/materials */
  create: async (payload: MaterialFormData): Promise<Material> => {
    const { data } = await api.post<{ data: Material }>('/api/admin/materials', payload);
    return data.data;
  },

  /** PUT /api/admin/materials/:id */
  update: async (id: number | string, payload: MaterialFormData): Promise<Material> => {
    const { data } = await api.put<{ data: Material }>(`/api/admin/materials/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/materials/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/materials/${id}`);
  },
};
