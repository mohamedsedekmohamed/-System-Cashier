import { api } from '../lib/axios';
import type { 
  HallTable, 
  HallTablePayload, 
  HallTableListResponse, 
  SingleHallTableResponse, 
  HallTableSelectOptionsResponse 
} from '../types';

export const HALL_TABLES_KEY = 'hall_tables';
export const HALL_TABLES_SELECT_OPTIONS_KEY = 'hall_tables_select_options';

export const hallTableApi = {
  /** GET /api/admin/hall-tables/select-options */
  getSelectOptions: async (): Promise<HallTableSelectOptionsResponse> => {
    const { data } = await api.get<HallTableSelectOptionsResponse>('/api/admin/hall-tables/select-options');
    return data;
  },

  /** GET /api/admin/hall-tables?page=&per_page= */
  list: async (page = 1, perPage = 10): Promise<HallTableListResponse> => {
    const { data } = await api.get<HallTableListResponse>(
      '/api/admin/hall-tables',
      { params: { page, per_page: perPage } }
    );
    return data;
  },

  /** GET /api/admin/hall-tables/:id */
  get: async (id: number | string): Promise<SingleHallTableResponse> => {
    const { data } = await api.get<SingleHallTableResponse>(`/api/admin/hall-tables/${id}`);
    return data;
  },

  /** POST /api/admin/hall-tables */
  create: async (payload: HallTablePayload): Promise<HallTable> => {
    const { data } = await api.post<{ data: HallTable }>('/api/admin/hall-tables', payload);
    return data.data;
  },

  /** PUT /api/admin/hall-tables/:id */
  update: async (id: number | string, payload: HallTablePayload): Promise<HallTable> => {
    const { data } = await api.put<{ data: HallTable }>(`/api/admin/hall-tables/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/admin/hall-tables/:id */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/hall-tables/${id}`);
  },
};
