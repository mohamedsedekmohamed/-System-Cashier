import { api } from '../lib/axios';
import type {
  Saler,
  SalerFormData,
  SalerListResponse,
  SingleSalerResponse,
  SalerSelectOptionsResponse,
} from '../types';

export const SALERS_KEY = 'salers';
export const SALERS_SELECT_OPTIONS_KEY = 'salers_select_options';

export const salerApi = {
  /** GET /api/admin/salers/select-options */
  getSelectOptions: async (): Promise<SalerSelectOptionsResponse> => {
    const { data } = await api.get<SalerSelectOptionsResponse>('/api/admin/salers/select-options');
    return data;
  },

  /** GET /api/admin/salers?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<SalerListResponse> => {
    const { data } = await api.get<SalerListResponse>(
      '/api/admin/salers',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/salers/:id */
  get: async (id: number | string): Promise<SingleSalerResponse> => {
    const { data } = await api.get<SingleSalerResponse>(`/api/admin/salers/${id}`);
    return data;
  },

  /** POST /api/admin/salers */
  create: async (payload: SalerFormData): Promise<Saler> => {
    const { data } = await api.post<{ data: Saler }>('/api/admin/salers', payload);
    return data.data;
  },

  /** PUT /api/admin/salers/:id */
  update: async (id: number | string, payload: SalerFormData): Promise<Saler> => {
    const { data } = await api.put<{ data: Saler }>(`/api/admin/salers/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/salers/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/salers/${id}`);
  },
};
