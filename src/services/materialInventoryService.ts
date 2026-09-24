import { api } from '../lib/axios';
import type {
  MaterialInventorySelectOptionsResponse,
  MaterialInventoryListResponse,
  MaterialInventoryDetailResponse,
  CreateMaterialInventoryPayload,
  UpdateMaterialInventoryItemsPayload,
  UpdateMaterialInventoryStatusPayload,
  UpdateSingleMaterialItemPayload,
} from '../types';

export const MATERIAL_INVENTORY_KEY = 'material_inventory';
export const MATERIAL_INVENTORY_PENDING_KEY = 'material_inventory_pending';
export const MATERIAL_INVENTORY_HISTORY_KEY = 'material_inventory_history';
export const MATERIAL_INVENTORY_OPTIONS_KEY = 'material_inventory_options';
export const MATERIAL_INVENTORY_DETAIL_KEY = 'material_inventory_detail';

export const materialInventoryApi = {
  /**
   * GET /api/admin/inventory/materials/select-options
   * Fetches branches allowed for material inventory
   */
  getSelectOptions: async (): Promise<MaterialInventorySelectOptionsResponse> => {
    const { data } = await api.get<MaterialInventorySelectOptionsResponse>(
      '/api/admin/inventory/materials/select-options'
    );
    return data;
  },

  /**
   * GET /api/admin/inventory/materials/pending?page=&per_page=
   * Returns list of pending inventory audits
   */
  getPending: async (page = 1, perPage = 15): Promise<MaterialInventoryListResponse> => {
    const { data } = await api.get<MaterialInventoryListResponse>(
      '/api/admin/inventory/materials/pending',
      {
        params: { page, per_page: perPage },
      }
    );
    return data;
  },

  /**
   * GET /api/admin/inventory/materials/history?page=&per_page=
   * Returns list of past/approved/rejected inventory audits
   */
  getHistory: async (page = 1, perPage = 15): Promise<MaterialInventoryListResponse> => {
    const { data } = await api.get<MaterialInventoryListResponse>(
      '/api/admin/inventory/materials/history',
      {
        params: { page, per_page: perPage },
      }
    );
    return data;
  },

  /**
   * POST /api/admin/inventory/materials
   * Creates a new material inventory session
   */
  create: async (payload: CreateMaterialInventoryPayload): Promise<any> => {
    const { data } = await api.post('/api/admin/inventory/materials', payload);
    return data;
  },

  /**
   * GET /api/admin/inventory/materials/{inventory}
   * Returns inventory details including items to be audited
   */
  getById: async (id: string | number): Promise<MaterialInventoryDetailResponse> => {
    const { data } = await api.get<MaterialInventoryDetailResponse>(
      `/api/admin/inventory/materials/${id}`
    );
    return data;
  },

  /**
   * PUT /api/admin/inventory/materials/{inventory}/items
   * Bulk updates physical counts for items
   */
  updateItems: async (
    inventoryId: string | number,
    payload: UpdateMaterialInventoryItemsPayload
  ): Promise<any> => {
    const { data } = await api.put(
      `/api/admin/inventory/materials/${inventoryId}/items`,
      payload
    );
    return data;
  },

  /**
   * PUT /api/admin/inventory/materials/{inventory}/status
   * Approves or rejects the inventory audit
   * status: 'approve' | 'reject'
   */
  updateStatus: async (
    inventoryId: string | number,
    payload: UpdateMaterialInventoryStatusPayload
  ): Promise<any> => {
    const { data } = await api.put(
      `/api/admin/inventory/materials/${inventoryId}/status`,
      payload
    );
    return data;
  },

  /**
   * PUT /api/admin/inventory/material-items/{item}
   * Updates a single item physical actual stock
   */
  updateSingleItem: async (
    itemId: number | string,
    payload: UpdateSingleMaterialItemPayload
  ): Promise<any> => {
    const { data } = await api.put(
      `/api/admin/inventory/material-items/${itemId}`,
      payload
    );
    return data;
  },
};
