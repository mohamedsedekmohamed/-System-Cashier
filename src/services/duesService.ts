import { api } from '../lib/axios';
import type {
  PurchaseDueItem,
  SaleDueItem,
  DuesListResponse,
  SingleDueResponse,
  PayDuePayload,
  PayDueResponse,
  DuesFilterParams,
} from '../types';

export const PURCHASE_DUES_KEY = 'purchase_dues';
export const SALE_DUES_KEY = 'sale_dues';

/**
 * Filter helpers: clean empty or 'all' params
 */
const cleanParams = (params: DuesFilterParams = {}): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

// ── Purchase Dues API ──────────────────────────────────────────
export const purchaseDuesApi = {
  /** GET /api/admin/purchase-dues (with optional filters) */
  list: async (params: DuesFilterParams = {}): Promise<DuesListResponse<PurchaseDueItem>> => {
    const { data } = await api.get<DuesListResponse<PurchaseDueItem>>('/api/admin/purchase-dues', {
      params: cleanParams(params),
    });
    return data;
  },

  /** GET /api/admin/purchase-dues/overdue */
  getOverdue: async (params: DuesFilterParams = {}): Promise<DuesListResponse<PurchaseDueItem>> => {
    const { data } = await api.get<DuesListResponse<PurchaseDueItem>>('/api/admin/purchase-dues/overdue', {
      params: cleanParams(params),
    });
    return data;
  },

  /** GET /api/admin/purchase-dues/unpaid */
  getUnpaid: async (params: DuesFilterParams = {}): Promise<DuesListResponse<PurchaseDueItem>> => {
    const { data } = await api.get<DuesListResponse<PurchaseDueItem>>('/api/admin/purchase-dues/unpaid', {
      params: cleanParams(params),
    });
    return data;
  },

  /** GET /api/admin/purchase-dues/paid */
  getPaid: async (params: DuesFilterParams = {}): Promise<DuesListResponse<PurchaseDueItem>> => {
    const { data } = await api.get<DuesListResponse<PurchaseDueItem>>('/api/admin/purchase-dues/paid', {
      params: cleanParams(params),
    });
    return data;
  },

  /** GET /api/admin/purchase-dues/:id */
  get: async (id: number | string): Promise<SingleDueResponse<PurchaseDueItem>> => {
    const { data } = await api.get<SingleDueResponse<PurchaseDueItem>>(`/api/admin/purchase-dues/${id}`);
    return data;
  },

  /** POST /api/admin/purchase-dues/:id/pay */
  pay: async (
    id: number | string,
    payload: PayDuePayload
  ): Promise<PayDueResponse<PurchaseDueItem>> => {
    const { data } = await api.post<PayDueResponse<PurchaseDueItem>>(
      `/api/admin/purchase-dues/${id}/pay`,
      payload
    );
    return data;
  },
};

// ── Sale Dues API ──────────────────────────────────────────────
export const saleDuesApi = {
  /** GET /api/admin/sale-dues (with optional filters) */
  list: async (params: DuesFilterParams = {}): Promise<DuesListResponse<SaleDueItem>> => {
    const { data } = await api.get<DuesListResponse<SaleDueItem>>('/api/admin/sale-dues', {
      params: cleanParams(params),
    });
    return data;
  },

  /** GET /api/admin/sale-dues/overdue */
  getOverdue: async (params: DuesFilterParams = {}): Promise<DuesListResponse<SaleDueItem>> => {
    const { data } = await api.get<DuesListResponse<SaleDueItem>>('/api/admin/sale-dues/overdue', {
      params: cleanParams(params),
    });
    return data;
  },

  /** GET /api/admin/sale-dues/unpaid */
  getUnpaid: async (params: DuesFilterParams = {}): Promise<DuesListResponse<SaleDueItem>> => {
    const { data } = await api.get<DuesListResponse<SaleDueItem>>('/api/admin/sale-dues/unpaid', {
      params: cleanParams(params),
    });
    return data;
  },

  /** GET /api/admin/sale-dues/paid */
  getPaid: async (params: DuesFilterParams = {}): Promise<DuesListResponse<SaleDueItem>> => {
    const { data } = await api.get<DuesListResponse<SaleDueItem>>('/api/admin/sale-dues/paid', {
      params: cleanParams(params),
    });
    return data;
  },

  /** GET /api/admin/sale-dues/:id */
  get: async (id: number | string): Promise<SingleDueResponse<SaleDueItem>> => {
    const { data } = await api.get<SingleDueResponse<SaleDueItem>>(`/api/admin/sale-dues/${id}`);
    return data;
  },

  /** POST /api/admin/sale-dues/:id/pay */
  pay: async (
    id: number | string,
    payload: PayDuePayload
  ): Promise<PayDueResponse<SaleDueItem>> => {
    const { data } = await api.post<PayDueResponse<SaleDueItem>>(
      `/api/admin/sale-dues/${id}/pay`,
      payload
    );
    return data;
  },
};
