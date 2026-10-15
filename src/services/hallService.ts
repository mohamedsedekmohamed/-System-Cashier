import { api } from '../lib/axios';
import type {
  Hall,
  HallFormData,
  HallListResponse,
  SingleHallResponse,
  HallSelectOptionsResponse,
} from '../types';

export const HALLS_KEY = 'halls';
export const HALLS_SELECT_OPTIONS_KEY = 'halls_select_options';

export const hallApi = {
  /** GET /api/admin/halls/select-options */
  getSelectOptions: async (): Promise<HallSelectOptionsResponse> => {
    const { data } = await api.get<HallSelectOptionsResponse>('/api/admin/halls/select-options');
    return data;
  },

  /** GET /api/admin/halls?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<HallListResponse> => {
    const { data } = await api.get<HallListResponse>(
      '/api/admin/halls',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/halls/:id */
  get: async (id: number | string): Promise<SingleHallResponse> => {
    const { data } = await api.get<SingleHallResponse>(`/api/admin/halls/${id}`);
    return data;
  },

  /** POST /api/admin/halls */
  create: async (payload: HallFormData): Promise<Hall> => {
    const body = {
      name: {
        ar: payload.name.ar.trim(),
        en: payload.name.en.trim(),
      },
      branch_id: payload.branch_id ? Number(payload.branch_id) : null,
      status: payload.status,
    };
    const { data } = await api.post<{ data: Hall }>('/api/admin/halls', body);
    return data.data;
  },

  /** PUT /api/admin/halls/:id */
  update: async (id: number | string, payload: HallFormData): Promise<Hall> => {
    const body = {
      name: {
        ar: payload.name.ar.trim(),
        en: payload.name.en.trim(),
      },
      branch_id: payload.branch_id ? Number(payload.branch_id) : null,
      status: payload.status,
    };
    const { data } = await api.put<{ data: Hall }>(`/api/admin/halls/${id}`, body);
    return data.data;
  },

  /** DELETE /api/admin/halls/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/halls/${id}`);
  },
};
