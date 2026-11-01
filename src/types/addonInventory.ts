import type { PaginatedMeta } from './common';
import type { BranchOption } from './branch';
import type { Unit } from './unit';

export interface AddonOption {
  id: number;
  name: { ar: string; en: string } | string;
  price: number;
  stock: number; // branch-specific calculated stock
}

export interface AddonStock {
  id: number;
  addon_id: number;
  branch_id: number;
  stock: number;
  unit_id: number | null;
  unit?: Unit | null;
}

export interface AddonInventorySelectOptions {
  branches: BranchOption[];
  units: Unit[];
}

export interface AddonInventorySelectOptionsResponse {
  status: boolean;
  data: AddonInventorySelectOptions;
}

export interface InventoryAddonItem {
  id: number;
  inventory_id: number;
  addon_id: number;
  addon_name: string;
  stock: number; // system recorded stock
  actual_stock: number; // physical counted stock
  deficit: number; // stock - actual_stock
  shortage?: number;
  difference?: number; // actual_stock - stock
  unit_id: number | null;
  unit?: Unit | null;
  addon?: {
    id: number;
    name: { ar: string; en: string } | string;
    price: number;
    image?: string | null;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface AddonInventoryDetail {
  id: string | number;
  name: string;
  branch_id: string | number;
  branch_name: { ar: string; en: string } | string;
  status: 'pending' | 'approve' | 'reject';
  total_items: number;
  total_deficit: number;
  items: InventoryAddonItem[];
  created_at: string;
  date: string;
  created_at_full?: string;
  updated_at?: string;
}

export interface AddonInventoryListItem {
  id: string | number;
  name: string;
  branch_id: string | number;
  branch_name: { ar: string; en: string } | string;
  status: 'pending' | 'approve' | 'reject' | string;
  total_items?: number;
  total_deficit?: number;
  created_at: string;
  date: string;
  created_at_full?: string;
  updated_at?: string;
}

export interface AddonInventoryListResponse {
  data: AddonInventoryListItem[];
  links?: any;
  meta: PaginatedMeta;
  status?: boolean;
}

export interface AddonInventoryDetailResponse {
  status: boolean;
  data: AddonInventoryDetail;
}

export interface CreateAddonInventoryPayload {
  name: string;
  branch_id?: number;
}

export interface UpdateSingleAddonItemPayload {
  actual_stock: number;
  unit_id?: number | null;
}

export interface UpdateAddonInventoryItemsPayload {
  items: Array<{
    id: number;
    actual_stock: number;
    unit_id?: number | null;
  }>;
}

export interface UpdateAddonInventoryStatusPayload {
  status: 'approve' | 'reject';
}

