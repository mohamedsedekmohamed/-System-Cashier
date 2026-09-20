import type { PaginatedMeta } from './common';

export interface PurchaseSelectMaterial {
  id: number;
  name: string;
  stock: number;
}

export interface PurchaseSelectRecipe {
  id: number;
  name: string;
  stock: number;
}

export interface PurchaseSelectOptions {
  materials: PurchaseSelectMaterial[];
  product_recipes: PurchaseSelectRecipe[];
}

export interface PurchaseSelectOptionsResponse {
  status: boolean;
  data: PurchaseSelectOptions;
}

export interface PurchaseItemDetail {
  id: number;
  purchase_id: number;
  material_id?: number | null;
  material_name?: string | null;
  material?: {
    id: number;
    name: any;
    stock: number;
    status?: boolean;
    category_id?: number;
    created_at?: string;
    updated_at?: string;
  } | null;
  product_recipe_id?: number | null;
  product_recipe_name?: string | null;
  product_recipe?: {
    id: number;
    name: any;
    status?: boolean;
    stock: number;
    category_id?: number;
    created_at?: string;
    updated_at?: string;
  } | null;
  quantity: number;
  cost: number;
  created_at?: string;
  updated_at?: string;
}

export interface Purchase {
  id: number;
  receipt?: string | null;
  receipt_url?: string | null;
  total_cost: number;
  total_quantity: number;
  cost?: number;
  quantity?: number;
  notes?: string | null;
  items: PurchaseItemDetail[];
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseListResponse {
  status: boolean;
  data: Purchase[];
  links?: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
  meta: PaginatedMeta;
  select_options?: PurchaseSelectOptions;
}

export interface SinglePurchaseResponse {
  status: boolean;
  data: Purchase;
}

export interface PurchaseItemPayload {
  material_id?: number | null;
  product_recipe_id?: number | null;
  quantity: number;
  cost: number;
}

export interface PurchaseFormData {
  receipt?: File | null;
  notes?: string;
  items: PurchaseItemPayload[];
}
