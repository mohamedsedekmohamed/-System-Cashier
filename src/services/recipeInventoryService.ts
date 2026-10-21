import { api } from '../lib/axios';
import type {
  RecipeInventorySelectOptionsResponse,
  RecipeInventoryListResponse,
  RecipeInventoryDetailResponse,
  CreateRecipeInventoryPayload,
  UpdateRecipeInventoryItemsPayload,
  UpdateRecipeInventoryStatusPayload,
  UpdateSingleRecipeItemPayload,
} from '../types';

export const RECIPE_INVENTORY_KEY = 'recipe_inventory';
export const RECIPE_INVENTORY_PENDING_KEY = 'recipe_inventory_pending';
export const RECIPE_INVENTORY_HISTORY_KEY = 'recipe_inventory_history';
export const RECIPE_INVENTORY_OPTIONS_KEY = 'recipe_inventory_options';
export const RECIPE_INVENTORY_DETAIL_KEY = 'recipe_inventory_detail';

export const recipeInventoryApi = {
  /**
   * GET /api/admin/inventory/recipes/select-options
   * Fetches branches allowed for recipe inventory
   */
  getSelectOptions: async (): Promise<RecipeInventorySelectOptionsResponse> => {
    const { data } = await api.get<RecipeInventorySelectOptionsResponse>(
      '/api/admin/inventory/recipes/select-options'
    );
    return data;
  },

  /**
   * GET /api/admin/inventory/recipes/pending?page=&per_page=
   * Returns list of pending recipe inventory audits
   */
  getPending: async (page = 1, perPage = 15): Promise<RecipeInventoryListResponse> => {
    const { data } = await api.get<RecipeInventoryListResponse>(
      '/api/admin/inventory/recipes/pending',
      {
        params: { page, per_page: perPage },
      }
    );
    return data;
  },

  /**
   * GET /api/admin/inventory/recipes/history?page=&per_page=
   * Returns list of past/approved/rejected recipe inventory audits
   */
  getHistory: async (page = 1, perPage = 15): Promise<RecipeInventoryListResponse> => {
    const { data } = await api.get<RecipeInventoryListResponse>(
      '/api/admin/inventory/recipes/history',
      {
        params: { page, per_page: perPage },
      }
    );
    return data;
  },

  /**
   * POST /api/admin/inventory/recipes
   * Creates a new recipe inventory audit session
   */
  create: async (payload: CreateRecipeInventoryPayload): Promise<any> => {
    const { data } = await api.post('/api/admin/inventory/recipes', payload);
    return data;
  },

  /**
   * GET /api/admin/inventory/recipes/{inventory}
   * Returns inventory details including items to be counted/audited
   */
  getById: async (id: string | number): Promise<RecipeInventoryDetailResponse> => {
    const { data } = await api.get<RecipeInventoryDetailResponse>(
      `/api/admin/inventory/recipes/${id}`
    );
    return data;
  },

  /**
   * PUT /api/admin/inventory/recipes/{inventory}/items
   * Bulk updates physical counts for items
   */
  updateItems: async (
    inventoryId: string | number,
    payload: UpdateRecipeInventoryItemsPayload
  ): Promise<any> => {
    const { data } = await api.put(
      `/api/admin/inventory/recipes/${inventoryId}/items`,
      payload
    );
    return data;
  },

  /**
   * PUT /api/admin/inventory/recipes/{inventory}/status
   * Approves or rejects the recipe inventory audit
   * status: 'approve' | 'reject'
   */
  updateStatus: async (
    inventoryId: string | number,
    payload: UpdateRecipeInventoryStatusPayload
  ): Promise<any> => {
    const { data } = await api.put(
      `/api/admin/inventory/recipes/${inventoryId}/status`,
      payload
    );
    return data;
  },

  /**
   * PUT /api/admin/inventory/recipe-items/{item}
   * Updates a single recipe item physical actual stock
   */
  updateSingleItem: async (
    itemId: number | string,
    payload: UpdateSingleRecipeItemPayload
  ): Promise<any> => {
    const { data } = await api.put(
      `/api/admin/inventory/recipe-items/${itemId}`,
      payload
    );
    return data;
  },
};
