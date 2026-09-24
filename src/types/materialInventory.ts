import type { PaginatedMeta } from './common';
import type { BranchOption } from './branch';

export interface MaterialInventorySelectOptions {
  branches: BranchOption[];
}

export interface MaterialInventorySelectOptionsResponse {
  status: boolean;
  data: MaterialInventorySelectOptions;
}

export interface MaterialInventoryListItem {
  id: string | number;
  name: string;
  branch_id: string | number;
  branch_name: string;
  status: string;
  created_at: string;
  date: string;
  created_at_full: string;
  updated_at: string;
}

export interface MaterialInventoryListResponse {
  data: MaterialInventoryListItem[];
  links?: any;
  meta: PaginatedMeta;
}

export interface MaterialInventoryItem {
  id: number;
  inventory_id: number;
  material_id: number;
  material_name: any;
  stock: number;
  actual_stock: number;
  deficit: number;
  shortage: number;
  difference: number;
  created_at: string;
  updated_at: string;
}

export interface MaterialInventoryDetail {
  id: string | number;
  name: string;
  branch_id: string | number;
  branch_name: string;
  status: string;
  created_at: string;
  date: string;
  created_at_full: string;
  updated_at: string;
  total_items: string | number;
  total_deficit: number;
  items: MaterialInventoryItem[];
}

export interface MaterialInventoryDetailResponse {
  status: boolean;
  data: MaterialInventoryDetail;
}

export interface CreateMaterialInventoryPayload {
  name: string;
  branch_id: number;
}

export interface UpdateMaterialInventoryItemsPayload {
  items: Array<{
    id: number;
    actual_stock: number;
  }>;
}

export interface UpdateMaterialInventoryStatusPayload {
  status: 'approve' | 'reject';
}

export interface UpdateSingleMaterialItemPayload {
  actual_stock: number;
}
