import { api } from '../lib/axios';
import type {
  AddonInventorySelectOptionsResponse,
  AddonInventoryListResponse,
  AddonInventoryDetailResponse,
  CreateAddonInventoryPayload,
  UpdateAddonInventoryItemsPayload,
  UpdateAddonInventoryStatusPayload,
  UpdateSingleAddonItemPayload,
} from '../types';

export const ADDON_INVENTORY_KEY = 'addon_inventory';
export const ADDON_INVENTORY_PENDING_KEY = 'addon_inventory_pending';
export const ADDON_INVENTORY_HISTORY_KEY = 'addon_inventory_history';
export const ADDON_INVENTORY_OPTIONS_KEY = 'addon_inventory_options';
export const ADDON_INVENTORY_DETAIL_KEY = 'addon_inventory_detail';

export const addonInventoryApi = {
  /**
   * GET /api/admin/inventory/addons/select-options
   * Fetches branches and units for addon inventory
   */
  getSelectOptions: async (): Promise<AddonInventorySelectOptionsResponse> => {
    const { data } = await api.get<AddonInventorySelectOptionsResponse>(
      '/api/admin/inventory/addons/select-options'
    );
    return data;
  },

  /**
   * GET /api/admin/inventory/addons/pending?page=&per_page=&branch_id=
   * Returns list of pending addon inventory audits
   */
  getPending: async (
    page = 1,
    perPage = 15,
    branch_id?: number | string
  ): Promise<AddonInventoryListResponse> => {
    const params: Record<string, any> = { page, per_page: perPage };
    if (branch_id) params.branch_id = branch_id;
    const { data } = await api.get<AddonInventoryListResponse>(
      '/api/admin/inventory/addons/pending',
      { params }
    );
    return data;
  },

  /**
   * GET /api/admin/inventory/addons/history?page=&per_page=&status=&branch_id=
   * Returns list of past/approved/rejected addon inventory audits
   */
  getHistory: async (
    page = 1,
    perPage = 15,
    branch_id?: number | string,
    status?: 'approve' | 'reject' | string
  ): Promise<AddonInventoryListResponse> => {
    const params: Record<string, any> = { page, per_page: perPage };
    if (branch_id) params.branch_id = branch_id;
    if (status && status !== 'all') params.status = status;
    const { data } = await api.get<AddonInventoryListResponse>(
      '/api/admin/inventory/addons/history',
      { params }
    );
    return data;
  },

  /**
   * POST /api/admin/inventory/addons
   * Creates a new addon inventory session (snapshots current branch stocks)
   */
  create: async (payload: CreateAddonInventoryPayload): Promise<any> => {
    const { data } = await api.post('/api/admin/inventory/addons', payload);
    return data;
  },

  /**
   * GET /api/admin/inventory/addons/{id}
   * Returns addon inventory details including items to be audited
   */
  getById: async (id: string | number): Promise<AddonInventoryDetailResponse> => {
    const { data } = await api.get<AddonInventoryDetailResponse>(
      `/api/admin/inventory/addons/${id}`
    );
    return data;
  },

  /**
   * PUT /api/admin/inventory/addons/{id}/items
   * Bulk updates physical counts & units for items
   */
  updateItems: async (
    inventoryId: string | number,
    payload: UpdateAddonInventoryItemsPayload
  ): Promise<any> => {
    const { data } = await api.put(
      `/api/admin/inventory/addons/${inventoryId}/items`,
      payload
    );
    return data;
  },

  /**
   * PUT /api/admin/inventory/addons/{id}/status
   * Approves or rejects the addon inventory audit
   * status: 'approve' | 'reject'
   */
  updateStatus: async (
    inventoryId: string | number,
    payload: UpdateAddonInventoryStatusPayload
  ): Promise<any> => {
    const { data } = await api.put(
      `/api/admin/inventory/addons/${inventoryId}/status`,
      payload
    );
    return data;
  },

  /**
   * PUT /api/admin/inventory/addon-items/{item}
   * Updates a single item's physical actual stock & optional unit
   */
  updateSingleItem: async (
    itemId: number | string,
    payload: UpdateSingleAddonItemPayload
  ): Promise<any> => {
    const { data } = await api.put(
      `/api/admin/inventory/addon-items/${itemId}`,
      payload
    );
    return data;
  },
};

