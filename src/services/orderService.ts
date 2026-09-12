import { api } from '../lib/axios';
import type { Order, OrderFormData, OrderSelectOptions } from '../types';

export const ORDERS_KEY = 'orders';

export interface OrdersListResponse {
  data: Order[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const orderService = {
  list: async (page: number = 1, perPage: number = 15, isPos?: boolean, moduleStr?: string, shiftId?: number): Promise<OrdersListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    if (isPos !== undefined) params.append('is_pos', isPos ? '1' : '0');
    if (moduleStr) params.append('module', moduleStr);
    if (shiftId) params.append('shift_id', shiftId.toString());

    const { data } = await api.get(`/admin/orders?${params.toString()}`);
    return data;
  },

  listPos: async (page: number = 1, perPage: number = 15): Promise<OrdersListResponse> => {
    const { data } = await api.get(`/admin/orders/pos?page=${page}&per_page=${perPage}`);
    return data;
  },

  listOnline: async (page: number = 1, perPage: number = 15): Promise<OrdersListResponse> => {
    const { data } = await api.get(`/admin/orders/online?page=${page}&per_page=${perPage}`);
    return data;
  },

  getSelectOptions: async (): Promise<{ status: boolean; data: OrderSelectOptions }> => {
    const { data } = await api.get('/admin/orders/select-options');
    return data;
  },

  get: async (id: string | number): Promise<{ data: Order }> => {
    const { data } = await api.get(`/admin/orders/${id}`);
    return data;
  },

  create: async (payload: OrderFormData): Promise<{ data: Order; message: string }> => {
    const { data } = await api.post('/admin/orders', payload);
    return data;
  },

  delete: async (id: string | number): Promise<{ message: string }> => {
    const { data } = await api.delete(`/admin/orders/${id}`);
    return data;
  }
};
