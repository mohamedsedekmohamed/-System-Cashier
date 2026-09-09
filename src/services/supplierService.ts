import { api } from '../lib/axios';
import type { 
  Supplier, 
  SupplierFormData, 
  SupplierListResponse, 
  SingleSupplierResponse, 
  SupplierSelectOptionsResponse 
} from '../types';

export const SUPPLIERS_KEY = 'suppliers';
export const SUPPLIERS_SELECT_OPTIONS_KEY = 'suppliers_select_options';

export const supplierApi = {
  /** GET /api/admin/suppliers/select-options */
  getSelectOptions: async (): Promise<SupplierSelectOptionsResponse> => {
    const { data } = await api.get<SupplierSelectOptionsResponse>('/api/admin/suppliers/select-options');
    return data;
  },

  /** GET /api/admin/suppliers?page=&per_page= */
  list: async (page = 1, perPage = 15): Promise<SupplierListResponse> => {
    const { data } = await api.get<SupplierListResponse>(
      '/api/admin/suppliers',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/suppliers/:id */
  get: async (id: number | string): Promise<SingleSupplierResponse> => {
    const { data } = await api.get<SingleSupplierResponse>(`/api/admin/suppliers/${id}`);
    return data;
  },

  /** POST /api/admin/suppliers */
  create: async (payload: SupplierFormData): Promise<Supplier> => {
    const { data } = await api.post<{ data: Supplier }>('/api/admin/suppliers', payload);
    return data.data;
  },

  /** PUT /api/admin/suppliers/:id */
  update: async (id: number | string, payload: SupplierFormData): Promise<Supplier> => {
    const { data } = await api.put<{ data: Supplier }>(`/api/admin/suppliers/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/suppliers/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/suppliers/${id}`);
  },
};
