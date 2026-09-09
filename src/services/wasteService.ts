import { api } from '../lib/axios';
import type { 
  Waste, 
  WasteFormData, 
  WasteUpdateData,
  WasteListResponse, 
  SingleWasteResponse, 
  WasteSelectOptionsResponse 
} from '../types';

export const WASTES_KEY = 'wastes';
export const WASTES_SELECT_OPTIONS_KEY = 'wastes_select_options';

export const wasteApi = {
  /** GET /api/admin/wastes/select-options */
  getSelectOptions: async (): Promise<WasteSelectOptionsResponse> => {
    const { data } = await api.get<WasteSelectOptionsResponse>('/api/admin/wastes/select-options');
    return data;
  },

  /** GET /api/admin/wastes?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<WasteListResponse> => {
    const { data } = await api.get<WasteListResponse>(
      '/api/admin/wastes',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/wastes/:id */
  get: async (id: number | string): Promise<SingleWasteResponse> => {
    const { data } = await api.get<SingleWasteResponse>(`/api/admin/wastes/${id}`);
    return data;
  },

  /** POST /api/admin/wastes */
  create: async (payload: WasteFormData): Promise<Waste> => {
    const { data } = await api.post<{ data: Waste }>('/api/admin/wastes', payload);
    return data.data;
  },

  /** PUT /api/admin/wastes/:id */
  update: async (id: number | string, payload: WasteUpdateData): Promise<Waste> => {
    const { data } = await api.put<{ data: Waste }>(`/api/admin/wastes/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/wastes/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/wastes/${id}`);
  },
};
