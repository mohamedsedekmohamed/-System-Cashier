import { api } from '../lib/axios';
import type { 
  Tax, 
  TaxFormData, 
  TaxListResponse, 
  SingleTaxResponse, 
  TaxSelectOptionsResponse 
} from '../types';

export const TAXES_KEY = 'taxes';
export const TAXES_SELECT_OPTIONS_KEY = 'taxes_select_options';

export const taxApi = {
  /** GET /api/admin/taxes/select-options */
  getSelectOptions: async (): Promise<TaxSelectOptionsResponse> => {
    const { data } = await api.get<TaxSelectOptionsResponse>('/api/admin/taxes/select-options');
    return data;
  },

  /** GET /api/admin/taxes?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<TaxListResponse> => {
    const { data } = await api.get<TaxListResponse>(
      '/api/admin/taxes',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/taxes/:id */
  get: async (id: number | string): Promise<SingleTaxResponse> => {
    const { data } = await api.get<SingleTaxResponse>(`/api/admin/taxes/${id}`);
    return data;
  },

  /** POST /api/admin/taxes */
  create: async (payload: TaxFormData): Promise<Tax> => {
    const { data } = await api.post<{ data: Tax }>('/api/admin/taxes', payload);
    return data.data;
  },

  /** PUT /api/admin/taxes/:id */
  update: async (id: number | string, payload: TaxFormData): Promise<Tax> => {
    const { data } = await api.put<{ data: Tax }>(`/api/admin/taxes/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/taxes/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/taxes/${id}`);
  },
};
