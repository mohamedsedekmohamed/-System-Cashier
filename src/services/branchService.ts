import { api } from '../lib/axios';
import type { Branch, BranchFormData, PaginatedResponse } from '../types';

export const BRANCHES_KEY = 'branches';

export const branchApi = {
  /** GET /api/admin/branches?page=&per_page= */
  list: async (page = 1, perPage = 10): Promise<PaginatedResponse<Branch>> => {
    const { data } = await api.get<PaginatedResponse<Branch>>(
      '/api/admin/branches',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/branches/:id */
  get: async (id: number | string): Promise<Branch> => {
    const { data } = await api.get<{ data: Branch }>(`/api/admin/branches/${id}`);
    return data.data;
  },

  /** POST /api/admin/branches */
  create: async (payload: BranchFormData): Promise<Branch> => {
    const { data } = await api.post<{ data: Branch }>('/api/admin/branches', payload);
    return data.data;
  },

  /** PUT /api/admin/branches/:id */
  update: async (id: number | string, payload: BranchFormData): Promise<Branch> => {
    const { data } = await api.put<{ data: Branch }>(`/api/admin/branches/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/branches/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/branches/${id}`);
  },
};
