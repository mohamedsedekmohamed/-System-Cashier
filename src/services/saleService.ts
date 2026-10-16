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

  formData.append('branch_id', String(payload.branch_id));

  if (payload.saler_id) {
    formData.append('saler_id', String(payload.saler_id));
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

  if (payload.without_recipe) {
    formData.append('without_recipe', '1');
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

  /** POST /api/admin/sales */
  create: async (payload: SaleFormData): Promise<Sale> => {
    if (payload.receipt instanceof File) {
      const formData = buildSaleFormData(payload);
      const { data } = await api.post<{ data: Sale } | Sale>(
        '/api/admin/sales',
        formData,
        {
          headers: {
            'Content-Type': undefined,
          },
        }
      );
      return 'data' in data && data.data ? (data.data as Sale) : (data as Sale);
    }

    const { data } = await api.post<{ data: Sale } | Sale>(
      '/api/admin/sales',
      {
        branch_id: payload.branch_id,
        saler_id: payload.saler_id || null,
        total_cost: payload.total_cost,
        paid_amount: payload.paid_amount,
        due_date: payload.due_date,
        dues: payload.dues,
        without_recipe: payload.without_recipe,
        notes: payload.notes,
        items: payload.items,
      }
    );
    return 'data' in data && data.data ? (data.data as Sale) : (data as Sale);
  },

  /** DELETE /api/admin/sales/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/sales/${id}`);
  },
};
