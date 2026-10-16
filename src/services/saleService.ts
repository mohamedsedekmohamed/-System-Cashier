import { api } from '../lib/axios';
import type {
  Sale,
  SaleFormData,
  SaleListResponse,
  SingleSaleResponse,
  SaleSelectOptionsResponse,
} from '../types';

export const SALES_KEY = 'sales';
export const SALES_SELECT_OPTIONS_KEY = 'sales_select_options';

// Helper to convert SaleFormData payload into multipart/form-data
const buildSaleFormData = (payload: SaleFormData): FormData => {
  const formData = new FormData();

  if (payload.branch_id) {
    formData.append('branch_id', String(payload.branch_id));
  }

  if (payload.saler_id) {
    formData.append('saler_id', String(payload.saler_id));
  }

  if (payload.paid_amount !== undefined && payload.paid_amount !== null) {
    formData.append('paid_amount', String(payload.paid_amount));
  }

  if (payload.due_date) {
    formData.append('due_date', payload.due_date);
  }

  if (payload.without_recipe) {
    formData.append('without_recipe', '1');
  }

  if (payload.receipt) {
    formData.append('receipt', payload.receipt);
  }

  if (payload.notes !== undefined && payload.notes !== null) {
    formData.append('notes', payload.notes);
  }

  payload.items.forEach((item, index) => {
    if (item.product_id) {
      formData.append(`items[${index}][product_id]`, String(item.product_id));
    }
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

export const saleApi = {
  /** GET /api/admin/sales/select-options */
  getSelectOptions: async (branch_id?: number): Promise<SaleSelectOptionsResponse> => {
    const params: Record<string, any> = {};
    if (branch_id) params.branch_id = branch_id;
    const { data } = await api.get<SaleSelectOptionsResponse>('/api/admin/sales/select-options', { params });
    return data;
  },

  /** GET /api/admin/sales?page=&per_page=&lang=&branch_id=&saler_id= */
  list: async (
    page = 1,
    perPage = 15,
    lang?: string,
    branch_id?: number,
    saler_id?: number
  ): Promise<SaleListResponse> => {
    const params: Record<string, any> = { page, per_page: perPage };
    if (lang) params.lang = lang;
    if (branch_id) params.branch_id = branch_id;
    if (saler_id) params.saler_id = saler_id;

    const { data } = await api.get<SaleListResponse>('/api/admin/sales', { params });
    return data;
  },

  /** GET /api/admin/sales/:id */
  get: async (id: number | string): Promise<SingleSaleResponse> => {
    const { data } = await api.get<SingleSaleResponse>(`/api/admin/sales/${id}`);
    return data;
  },

  /** POST /api/admin/sales (multipart/form-data) */
  create: async (payload: SaleFormData): Promise<Sale> => {
    const formData = buildSaleFormData(payload);
    const { data } = await api.post<{ data: Sale } | Sale>(
      '/api/admin/sales',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return 'data' in data && data.data ? (data.data as Sale) : (data as Sale);
  },

  /** DELETE /api/admin/sales/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/sales/${id}`);
  },
};
