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
  getSelectOptions: async (branch_id?: number): Promise<WasteSelectOptionsResponse> => {
    const params: Record<string, any> = {};
    if (branch_id) params.branch_id = branch_id;
    const { data } = await api.get<WasteSelectOptionsResponse>('/api/admin/wastes/select-options', { params });
    return data;
  },

  /** GET /api/admin/wastes?page=&per_page= */
  list: async (page = 1, perPage = 15, branch_id?: number): Promise<WasteListResponse> => {
    const params: Record<string, any> = { page, per_page: perPage };
    if (branch_id) params.branch_id = branch_id;
    const { data } = await api.get<WasteListResponse>(
      '/api/admin/wastes',
      { params }
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
