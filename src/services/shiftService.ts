import { api } from '../lib/axios';
import type { Shift, ShiftFormData, PaginatedResponse, Branch } from '../types';

export const SHIFTS_KEY = 'shifts';

export interface ShiftSelectOptions {
  branches: Branch[];
}

export const shiftApi = {
  /** GET /api/admin/shifts?page=&per_page= */
  list: async (page = 1, perPage = 10): Promise<PaginatedResponse<Shift> & { select_options: ShiftSelectOptions }> => {
    const { data } = await api.get<PaginatedResponse<Shift> & { select_options: ShiftSelectOptions }>(
      '/api/admin/shifts',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/shifts/select-options */
  getSelectOptions: async (): Promise<{ branches: Branch[] }> => {
    const { data } = await api.get<{ data: { branches: Branch[], shifts: any[] } }>('/api/admin/shifts/select-options');
    return data.data;
  },

  /** GET /api/admin/shifts/:id */
  get: async (id: number | string): Promise<Shift & { select_options: ShiftSelectOptions }> => {
    const { data } = await api.get<{ data: Shift, select_options: ShiftSelectOptions }>(`/api/admin/shifts/${id}`);
    return { ...data.data, select_options: data.select_options };
  },

  /** POST /api/admin/shifts */
  create: async (payload: ShiftFormData): Promise<Shift> => {
    const { data } = await api.post<{ data: Shift }>('/api/admin/shifts', payload);
    return data.data;
  },

  /** PUT /api/admin/shifts/:id */
  update: async (id: number | string, payload: ShiftFormData): Promise<Shift> => {
    const { data } = await api.put<{ data: Shift }>(`/api/admin/shifts/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/shifts/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/shifts/${id}`);
  },
};
