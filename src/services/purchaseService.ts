import { api } from '../lib/axios';
import type {
  Purchase,
  PurchaseFormData,
  PurchaseListResponse,
  SinglePurchaseResponse,
  PurchaseSelectOptionsResponse,
} from '../types';

export const PURCHASES_KEY = 'purchases';
export const PURCHASES_SELECT_OPTIONS_KEY = 'purchases_select_options';

// Helper to convert PurchaseFormData payload into multipart/form-data
const buildPurchaseFormData = (payload: PurchaseFormData): FormData => {
  const formData = new FormData();

  if (payload.branch_id) {
    formData.append('branch_id', String(payload.branch_id));
  }

  if (payload.receipt) {
    formData.append('receipt', payload.receipt);
  }

  if (payload.notes !== undefined && payload.notes !== null) {
    formData.append('notes', payload.notes);
  }

  payload.items.forEach((item, index) => {
    if (item.material_id) {
      formData.append(`items[${index}][material_id]`, String(item.material_id));
    }
    if (item.product_recipe_id) {
      formData.append(`items[${index}][product_recipe_id]`, String(item.product_recipe_id));
    }
    formData.append(`items[${index}][quantity]`, String(item.quantity));
    formData.append(`items[${index}][cost]`, String(item.cost));
  });

  return formData;
};

export const purchaseApi = {
  /** GET /api/admin/purchases/select-options */
  getSelectOptions: async (branch_id?: number): Promise<PurchaseSelectOptionsResponse> => {
    const params: Record<string, any> = {};
    if (branch_id) params.branch_id = branch_id;
    const { data } = await api.get<PurchaseSelectOptionsResponse>('/api/admin/purchases/select-options', { params });
    return data;
  },

  /** GET /api/admin/purchases?page=&per_page=&lang= */
  list: async (page = 1, perPage = 15, lang?: string, branch_id?: number): Promise<PurchaseListResponse> => {
    const params: Record<string, any> = { page, per_page: perPage };
    if (lang) params.lang = lang;
    if (branch_id) params.branch_id = branch_id;

    const { data } = await api.get<PurchaseListResponse>('/api/admin/purchases', { params });
    return data;
  },

  /** GET /api/admin/purchases/:id */
  get: async (id: number | string): Promise<SinglePurchaseResponse> => {
    const { data } = await api.get<SinglePurchaseResponse>(`/api/admin/purchases/${id}`);
    return data;
  },

  /** POST /api/admin/purchases (multipart/form-data) */
  create: async (payload: PurchaseFormData): Promise<Purchase> => {
    const formData = buildPurchaseFormData(payload);
    const { data } = await api.post<{ data: Purchase } | Purchase>(
      '/api/admin/purchases',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return 'data' in data && data.data ? (data.data as Purchase) : (data as Purchase);
  },

  /** DELETE /api/admin/purchases/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/purchases/${id}`);
  },
};
