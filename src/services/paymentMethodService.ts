import { api } from '../lib/axios';
import type { 
  PaymentMethod, 
  PaymentMethodFormData, 
  PaymentMethodListResponse, 
  SinglePaymentMethodResponse, 
  PaymentMethodSelectOptionsResponse 
} from '../types';

export const PAYMENT_METHODS_KEY = 'payment_methods';
export const PAYMENT_METHODS_SELECT_OPTIONS_KEY = 'payment_methods_select_options';

export const paymentMethodApi = {
  /** GET /api/admin/payment-methods/select-options */
  getSelectOptions: async (): Promise<PaymentMethodSelectOptionsResponse> => {
    const { data } = await api.get<PaymentMethodSelectOptionsResponse>('/api/admin/payment-methods/select-options');
    return data;
  },

  /** GET /api/admin/payment-methods?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<PaymentMethodListResponse> => {
    const { data } = await api.get<PaymentMethodListResponse>(
      '/api/admin/payment-methods',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/payment-methods/:id */
  get: async (id: number | string): Promise<SinglePaymentMethodResponse> => {
    const { data } = await api.get<SinglePaymentMethodResponse>(`/api/admin/payment-methods/${id}`);
    return data;
  },

  /** POST /api/admin/payment-methods */
  create: async (payload: PaymentMethodFormData): Promise<PaymentMethod> => {
    const { data } = await api.post<{ data: PaymentMethod }>('/api/admin/payment-methods', payload);
    return data.data;
  },

  /** PUT /api/admin/payment-methods/:id */
  update: async (id: number | string, payload: PaymentMethodFormData): Promise<PaymentMethod> => {
    const { data } = await api.put<{ data: PaymentMethod }>(`/api/admin/payment-methods/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/payment-methods/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/payment-methods/${id}`);
  },
};
