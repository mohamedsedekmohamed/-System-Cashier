import { api } from '../lib/axios';
import type { 
  Delivery, 
  DeliveryFormData, 
  DeliveryListResponse, 
  SingleDeliveryResponse, 
  DeliverySelectOptionsResponse 
} from '../types';

export const DELIVERIES_KEY = 'deliveries';
export const DELIVERIES_SELECT_OPTIONS_KEY = 'deliveries_select_options';

// Helper to convert FormData payload
const buildFormData = (payload: DeliveryFormData, method: 'POST' | 'PUT' = 'POST') => {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('phone', payload.phone);
  if (payload.branch_id) {
    formData.append('branch_id', String(payload.branch_id));
  }
  
  if (payload.id_images && payload.id_images.length > 0) {
    payload.id_images.forEach(file => {
      formData.append('id_images[]', file);
    });
  }

  if (method === 'PUT') {
    formData.append('_method', 'PUT');
  }

  return formData;
};

export const deliveryApi = {
  /** GET /api/admin/deliveries/select-options */
  getSelectOptions: async (): Promise<DeliverySelectOptionsResponse> => {
    const { data } = await api.get<DeliverySelectOptionsResponse>('/api/admin/deliveries/select-options');
    return data;
  },

  /** GET /api/admin/deliveries?page=&per_page= */
  list: async (page = 1, perPage = 10): Promise<DeliveryListResponse> => {
    const { data } = await api.get<DeliveryListResponse>(
      '/api/admin/deliveries',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/deliveries/:id */
  get: async (id: number | string): Promise<SingleDeliveryResponse> => {
    const { data } = await api.get<SingleDeliveryResponse>(`/api/admin/deliveries/${id}`);
    return data;
  },

  /** POST /api/admin/deliveries */
  create: async (payload: DeliveryFormData): Promise<Delivery> => {
    const formData = buildFormData(payload, 'POST');
    const { data } = await api.post<{ data: Delivery }>('/api/admin/deliveries', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  /** POST /api/admin/deliveries/:id (with _method=PUT) */
  update: async (id: number | string, payload: DeliveryFormData): Promise<Delivery> => {
    const formData = buildFormData(payload, 'PUT');
    // We use POST here because _method=PUT is in the FormData (Laravel standard for multipart updates)
    const { data } = await api.post<{ data: Delivery }>(`/api/admin/deliveries/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  /** DELETE /api/admin/deliveries/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/deliveries/${id}`);
  },
};
