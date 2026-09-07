import { api } from '../lib/axios';
import type { 
  Admin, 
  AdminFormData, 
  AdminListResponse, 
  SingleAdminResponse, 
  SelectOptionsResponse 
} from '../types';

export const ADMINS_KEY = 'admins';
export const ADMINS_SELECT_OPTIONS_KEY = 'admins_select_options';

export const adminApi = {
  /** GET /api/admin/admins/select-options */
  getSelectOptions: async (): Promise<SelectOptionsResponse> => {
    const { data } = await api.get<SelectOptionsResponse>('/api/admin/admins/select-options');
    return data;
  },

  /** GET /api/admin/admins?page=&per_page= */
  list: async (page = 1, perPage = 10): Promise<AdminListResponse> => {
    const { data } = await api.get<AdminListResponse>(
      '/api/admin/admins',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/admins/:id */
  get: async (id: number | string): Promise<SingleAdminResponse> => {
    const { data } = await api.get<SingleAdminResponse>(`/api/admin/admins/${id}`);
    return data;
  },

  /** POST /api/admin/admins */
  create: async (payload: AdminFormData): Promise<Admin> => {
    const { data } = await api.post<{ data: Admin }>('/api/admin/admins', payload);
    return data.data;
  },

  /** PUT /api/admin/admins/:id */
  update: async (id: number | string, payload: AdminFormData): Promise<Admin> => {
    const { data } = await api.put<{ data: Admin }>(`/api/admin/admins/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/admins/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/admins/${id}`);
  },
};
