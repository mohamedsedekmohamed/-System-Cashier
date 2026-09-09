import { api } from '../lib/axios';
import type { 
  Kitchen, 
  KitchenFormData, 
  KitchenListResponse, 
  SingleKitchenResponse, 
  KitchenSelectOptionsResponse 
} from '../types';

export const KITCHENS_KEY = 'kitchens';
export const KITCHENS_SELECT_OPTIONS_KEY = 'kitchens_select_options';

export const kitchenApi = {
  /** GET /api/admin/kitchens/select-options */
  getSelectOptions: async (): Promise<KitchenSelectOptionsResponse> => {
    const { data } = await api.get<KitchenSelectOptionsResponse>('/api/admin/kitchens/select-options');
    return data;
  },

  /** GET /api/admin/kitchens?page=&per_page= */
  list: async (page = 1, perPage = 10): Promise<KitchenListResponse> => {
    const { data } = await api.get<KitchenListResponse>(
      '/api/admin/kitchens',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/kitchens/:id */
  get: async (id: number | string): Promise<SingleKitchenResponse> => {
    const { data } = await api.get<SingleKitchenResponse>(`/api/admin/kitchens/${id}`);
    return data;
  },

  /** POST /api/admin/kitchens */
  create: async (payload: KitchenFormData): Promise<Kitchen> => {
    const { data } = await api.post<{ data: Kitchen }>('/api/admin/kitchens', payload);
    return data.data;
  },

  /** PUT /api/admin/kitchens/:id */
  update: async (id: number | string, payload: KitchenFormData): Promise<Kitchen> => {
    const { data } = await api.put<{ data: Kitchen }>(`/api/admin/kitchens/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/kitchens/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/kitchens/${id}`);
  },
};
