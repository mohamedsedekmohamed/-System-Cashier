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

  formData.append('branch_id', String(payload.branch_id));

  if (payload.supplier_id) {
    formData.append('supplier_id', String(payload.supplier_id));
  }

  if (payload.total_cost !== undefined && payload.total_cost !== null) {
    formData.append('total_cost', String(payload.total_cost));
  }

  if (payload.paid_amount !== undefined && payload.paid_amount !== null) {
    formData.append('paid_amount', String(payload.paid_amount));
  }

  if (payload.due_date) {
    formData.append('due_date', payload.due_date);
  }

  if (payload.dues && payload.dues.length > 0) {
    formData.append('dues', JSON.stringify(payload.dues));
  }

  if (payload.receipt instanceof File) {
    formData.append('receipt', payload.receipt);
  }

  if (payload.notes) {
    formData.append('notes', payload.notes);
  }

  formData.append('items', JSON.stringify(payload.items));

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

  /** GET /api/admin/purchases?page=&per_page=&lang=&branch_id=&supplier_id= */
  list: async (
    page = 1,
    perPage = 15,
    lang?: string,
    branch_id?: number,
    supplier_id?: number
  ): Promise<PurchaseListResponse> => {
    const params: Record<string, any> = { page, per_page: perPage };
    if (lang) params.lang = lang;
    if (branch_id) params.branch_id = branch_id;
    if (supplier_id) params.supplier_id = supplier_id;

    const { data } = await api.get<PurchaseListResponse>('/api/admin/purchases', { params });
    return data;
  },

  /** GET /api/admin/purchases/:id */
  get: async (id: number | string): Promise<SinglePurchaseResponse> => {
    const { data } = await api.get<SinglePurchaseResponse>(`/api/admin/purchases/${id}`);
    return data;
  },

  /** POST /api/admin/purchases */
  create: async (payload: PurchaseFormData): Promise<Purchase> => {
    if (payload.receipt instanceof File) {
      const formData = buildPurchaseFormData(payload);
      const { data } = await api.post<{ data: Purchase } | Purchase>(
        '/api/admin/purchases',
        formData,
        {
          headers: {
            'Content-Type': undefined,
          },
        }
      );
      return 'data' in data && data.data ? (data.data as Purchase) : (data as Purchase);
    }

    const { data } = await api.post<{ data: Purchase } | Purchase>(
      '/api/admin/purchases',
      {
        branch_id: payload.branch_id,
        supplier_id: payload.supplier_id || null,
        total_cost: payload.total_cost,
        paid_amount: payload.paid_amount,
        due_date: payload.due_date,
        dues: payload.dues,
        notes: payload.notes,
        items: payload.items,
      }
    );
    return 'data' in data && data.data ? (data.data as Purchase) : (data as Purchase);
  },

  /** DELETE /api/admin/purchases/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/purchases/${id}`);
  },
};
