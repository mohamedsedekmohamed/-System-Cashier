import { api } from '../lib/axios';
import type {
  CaptainOrder,
  CaptainOrderFormData,
  CaptainOrderListResponse,
  SingleCaptainOrderResponse,
  CaptainOrderSelectOptionsResponse,
} from '../types';

export const CAPTAIN_ORDERS_KEY = 'captain_orders';
export const CAPTAIN_ORDERS_SELECT_OPTIONS_KEY = 'captain_orders_select_options';

export interface CaptainOrderListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: boolean | number | string;
}

// Helper to convert FormData payload for Create & Update
const buildFormData = (payload: CaptainOrderFormData, method: 'POST' | 'PUT' = 'POST'): FormData => {
  const formData = new FormData();

  if (method === 'PUT') {
    formData.append('_method', 'PUT');
  }

  if (payload.name) {
    formData.append('name', payload.name);
  }

  if (payload.user_name) {
    formData.append('user_name', payload.user_name);
  }

  if (payload.password && payload.password.trim().length > 0) {
    formData.append('password', payload.password);
  }

  if (payload.status !== undefined) {
    formData.append('status', payload.status ? '1' : '0');
  }

  // Adding images for new creation: images[]
  if (method === 'POST' && payload.images && payload.images.length > 0) {
    payload.images.forEach((file) => {
      formData.append('images[]', file);
    });
  }

  // For update: new_images[] and deleted_images[]
  if (method === 'PUT') {
    if (payload.new_images && payload.new_images.length > 0) {
      payload.new_images.forEach((file) => {
        formData.append('new_images[]', file);
      });
    }

    if (payload.deleted_images && payload.deleted_images.length > 0) {
      payload.deleted_images.forEach((img) => {
        formData.append('deleted_images[]', img);
      });
    }
  }

  return formData;
};

export const captainOrderApi = {
  /** GET /api/admin/captain-orders/select-options */
  getSelectOptions: async (): Promise<CaptainOrderSelectOptionsResponse> => {
    const { data } = await api.get<CaptainOrderSelectOptionsResponse>(
      '/api/admin/captain-orders/select-options'
    );
    return data;
  },

  /** GET /api/admin/captain-orders?page=&per_page=&search=&status= */
  list: async (params?: CaptainOrderListParams): Promise<CaptainOrderListResponse> => {
    const { page = 1, per_page = 15, search, status } = params || {};
    const queryParams: Record<string, any> = { page, per_page };

    if (search && search.trim().length > 0) {
      queryParams.search = search.trim();
    }

    if (status !== undefined && status !== '' && status !== 'all') {
      queryParams.status = status === '1' || status === 1 || status === true ? 1 : 0;
    }

    const { data } = await api.get<CaptainOrderListResponse>('/api/admin/captain-orders', {
      params: queryParams,
    });
    return data;
  },

  /** GET /api/admin/captain-orders/:id */
  get: async (id: number | string): Promise<SingleCaptainOrderResponse> => {
    const { data } = await api.get<SingleCaptainOrderResponse>(
      `/api/admin/captain-orders/${id}`
    );
    return data;
  },

  /** POST /api/admin/captain-orders */
  create: async (payload: CaptainOrderFormData): Promise<CaptainOrder> => {
    const formData = buildFormData(payload, 'POST');
    const { data } = await api.post<{ data: CaptainOrder }>('/api/admin/captain-orders', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  /** POST /api/admin/captain-orders/:id (with _method=PUT) */
  update: async (id: number | string, payload: CaptainOrderFormData): Promise<CaptainOrder> => {
    const formData = buildFormData(payload, 'PUT');
    const { data } = await api.post<{ data: CaptainOrder }>(
      `/api/admin/captain-orders/${id}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return data.data;
  },

  /** DELETE /api/admin/captain-orders/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/captain-orders/${id}`);
  },
};
