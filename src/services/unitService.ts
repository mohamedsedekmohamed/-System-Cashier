import { api } from '../lib/axios';
import type {
  Unit,
  UnitFormData,
  UnitListResponse,
  SingleUnitResponse,
} from '../types';

export const UNITS_KEY = 'units';
export const ALL_UNITS_KEY = 'all_units';

export const unitApi = {
  /**
   * GET /api/admin/units?page=&per_page=&search=
   */
  list: async (page = 1, perPage = 15, search?: string): Promise<UnitListResponse> => {
    const params: Record<string, any> = { page, per_page: perPage };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const { data } = await api.get<UnitListResponse>('/api/admin/units', { params });
    return data;
  },

  /**
   * GET /api/admin/units?per_page=-1
   * Fetches all units for dropdown selects
   */
  getAll: async (): Promise<Unit[]> => {
    const { data } = await api.get<UnitListResponse | { data: Unit[] }>('/api/admin/units', {
      params: { per_page: -1 },
    });
    return data?.data ?? [];
  },

  /**
   * GET /api/admin/units/:id
   */
  get: async (id: number | string): Promise<SingleUnitResponse> => {
    const { data } = await api.get<SingleUnitResponse>(`/api/admin/units/${id}`);
    return data;
  },

  /**
   * POST /api/admin/units
   */
  create: async (payload: UnitFormData): Promise<SingleUnitResponse> => {
    const { data } = await api.post<SingleUnitResponse>('/api/admin/units', payload);
    return data;
  },

  /**
   * PUT /api/admin/units/:id
   */
  update: async (id: number | string, payload: UnitFormData): Promise<SingleUnitResponse> => {
    const { data } = await api.put<SingleUnitResponse>(`/api/admin/units/${id}`, payload);
    return data;
  },

  /**
   * DELETE /api/admin/units/:id
   */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/admin/units/${id}`);
  },
};

