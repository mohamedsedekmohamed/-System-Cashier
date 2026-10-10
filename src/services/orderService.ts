import { api } from '../lib/axios';
import type { Order, OrderFormData, OrderSelectOptions, OrderStatus } from '../types';

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

export interface CheckNewOrdersResponse {
  status: boolean;
  client_count: number;
  server_count: number;
  difference: number;
  has_new: boolean;
  order_ids: number[];
}

export const orderService = {
  list: async (
    page: number = 1,
    perPage: number = 15,
    isPos?: boolean,
    search?: string,
    moduleStr?: string,
    shiftId?: number,
    date?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<OrdersListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    if (isPos !== undefined) params.append('is_pos', isPos ? '1' : '0');
    if (search) params.append('search', search);
    if (moduleStr) params.append('module', moduleStr);
    if (shiftId) params.append('shift_id', shiftId.toString());
    if (date) params.append('date', date);
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);

    const { data } = await api.get(`/api/admin/orders?${params.toString()}`);
    return data;
  },

  /** PUT /api/admin/orders/:orderId/status */
  updateStatus: async (orderId: number | string, status: OrderStatus): Promise<{ status: boolean; message?: string }> => {
    const { data } = await api.put(`/api/admin/orders/${orderId}/status`, { status });
    return data;
  },

  /** POST /api/admin/orders/check-new */
  checkNew: async (count: number): Promise<CheckNewOrdersResponse> => {
    try {
      const { data } = await api.post<CheckNewOrdersResponse>('/api/admin/orders/check-new', { count });
      return data;
    } catch {
      const { data } = await api.get<CheckNewOrdersResponse>(`/api/admin/orders/check-new?count=${count}`);
      return data;
    }
  },

  getSelectOptions: async (): Promise<{ status: boolean; data: OrderSelectOptions }> => {
    const { data } = await api.get('/api/admin/orders/select-options');
    return data;
  },

  get: async (id: string | number): Promise<{ data: Order }> => {
    const { data } = await api.get(`/api/admin/orders/${id}`);
    return data;
  },

  create: async (payload: OrderFormData): Promise<{ data: Order; message: string }> => {
    const { data } = await api.post('/api/admin/orders', payload);
    return data;
  },

  update: async (id: string | number, payload: OrderFormData): Promise<{ data: Order; message: string }> => {
    const { data } = await api.put(`/api/admin/orders/${id}`, payload);
    return data;
  },

  delete: async (id: string | number): Promise<{ message: string }> => {
    const { data } = await api.delete(`/api/admin/orders/${id}`);
    return data;
  }
};
