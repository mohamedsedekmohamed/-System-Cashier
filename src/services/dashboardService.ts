import { api } from '../lib/axios';
import type { DashboardResponse, DashboardStats } from '../types/dashboard';

export const DASHBOARD_STATS_KEY = 'dashboard_statistics';

export const dashboardService = {
  /**
   * GET /api/admin/dashboard?year=YYYY
   * Supports year parameter (integer between 2000 and 2100)
   */
  getStats: async (year?: number): Promise<DashboardStats> => {
    const params: Record<string, any> = {};
    if (year) params.year = year;

    try {
      const { data } = await api.get<DashboardResponse>('/api/admin/dashboard', {
        params,
      });
      // Handle response whether wrapped in data or direct
      return data?.data ?? (data as unknown as DashboardStats);
    } catch (err: any) {
      // If /api/admin/dashboard returns 404, fallback to /api/admin/dashboard/statistics
      if (err?.response?.status === 404) {
        const { data } = await api.get<DashboardResponse>(
          '/api/admin/dashboard/statistics',
          { params }
        );
        return data?.data ?? (data as unknown as DashboardStats);
      }
      throw err;
    }
  },
};
