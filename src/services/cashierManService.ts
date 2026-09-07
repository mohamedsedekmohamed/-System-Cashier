import { api } from '../lib/axios';
import type { 
  CashierMan, 
  CashierManFormData, 
  CashierManListResponse, 
  SingleCashierManResponse, 
  CashierManSelectOptionsResponse 
} from '../types';

export const CASHIER_MEN_KEY = 'cashier_men';
export const CASHIER_MEN_SELECT_OPTIONS_KEY = 'cashier_men_select_options';

export const cashierManApi = {
  /** GET /api/admin/cashier-men/select-options */
  getSelectOptions: async (): Promise<CashierManSelectOptionsResponse> => {
    const { data } = await api.get<CashierManSelectOptionsResponse>('/api/admin/cashier-men/select-options');
    return data;
  },

  /** GET /api/admin/cashier-men?page=&per_page= */
  list: async (page = 1, perPage = 10): Promise<CashierManListResponse> => {
    const { data } = await api.get<CashierManListResponse>(
      '/api/admin/cashier-men',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/cashier-men/:id */
  get: async (id: number | string): Promise<SingleCashierManResponse> => {
    const { data } = await api.get<SingleCashierManResponse>(`/api/admin/cashier-men/${id}`);
    return data;
  },

  /** POST /api/admin/cashier-men */
  create: async (payload: CashierManFormData): Promise<CashierMan> => {
    const { data } = await api.post<{ data: CashierMan }>('/api/admin/cashier-men', payload);
    return data.data;
  },

  /** PUT /api/admin/cashier-men/:id */
  update: async (id: number | string, payload: CashierManFormData): Promise<CashierMan> => {
    const { data } = await api.put<{ data: CashierMan }>(`/api/admin/cashier-men/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/cashier-men/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/cashier-men/${id}`);
  },
};
