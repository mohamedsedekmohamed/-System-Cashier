import { api } from '../lib/axios';
import type { 
  Cashier, 
  CashierFormData, 
  CashierListResponse, 
  SingleCashierResponse, 
  CashierSelectOptionsResponse 
} from '../types';

export const CASHIERS_KEY = 'cashiers';
export const CASHIERS_SELECT_OPTIONS_KEY = 'cashiers_select_options';

export const cashierApi = {
  /** GET /api/admin/cashiers/select-options */
  getSelectOptions: async (): Promise<CashierSelectOptionsResponse> => {
    const { data } = await api.get<CashierSelectOptionsResponse>('/api/admin/cashiers/select-options');
    return data;
  },

  /** GET /api/admin/cashiers?page=&per_page= */
  list: async (page = 1, perPage = 10): Promise<CashierListResponse> => {
    const { data } = await api.get<CashierListResponse>(
      '/api/admin/cashiers',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/cashiers/:id */
  get: async (id: number | string): Promise<SingleCashierResponse> => {
    const { data } = await api.get<SingleCashierResponse>(`/api/admin/cashiers/${id}`);
    return data;
  },

  /** POST /api/admin/cashiers */
  create: async (payload: CashierFormData): Promise<Cashier> => {
    const { data } = await api.post<{ data: Cashier }>('/api/admin/cashiers', payload);
    return data.data;
  },

  /** PUT /api/admin/cashiers/:id */
  update: async (id: number | string, payload: CashierFormData): Promise<Cashier> => {
    const { data } = await api.put<{ data: Cashier }>(`/api/admin/cashiers/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/cashiers/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/cashiers/${id}`);
  },
};
