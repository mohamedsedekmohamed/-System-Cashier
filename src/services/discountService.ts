import { api } from '../lib/axios';
import type {
  Discount,
  DiscountFormData,
  DiscountListResponse,
  SingleDiscountResponse,
} from '../types';

export const DISCOUNTS_KEY = 'discounts';

export const discountApi = {
  /** GET /api/admin/discounts?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<DiscountListResponse> => {
    const { data } = await api.get<DiscountListResponse>(
      '/api/admin/discounts',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/discounts/:id */
  get: async (id: number | string): Promise<SingleDiscountResponse> => {
    const { data } = await api.get<SingleDiscountResponse>(`/api/admin/discounts/${id}`);
    return data;
  },

  /** POST /api/admin/discounts */
  create: async (payload: DiscountFormData): Promise<Discount> => {
    const body = {
      name: {
        ar: payload.name.ar.trim(),
        en: payload.name.en.trim(),
      },
      type: payload.type,
      amount: Number(payload.amount),
      status: payload.status,
    };
    const { data } = await api.post<{ data: Discount }>('/api/admin/discounts', body);
    return data.data;
  },

  /** PUT /api/admin/discounts/:id */
  update: async (id: number | string, payload: DiscountFormData): Promise<Discount> => {
    const body = {
      name: {
        ar: payload.name.ar.trim(),
        en: payload.name.en.trim(),
      },
      type: payload.type,
      amount: Number(payload.amount),
      status: payload.status,
    };
    const { data } = await api.put<{ data: Discount }>(`/api/admin/discounts/${id}`, body);
    return data.data;
  },

  /** DELETE /api/admin/discounts/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/discounts/${id}`);
  },
};
