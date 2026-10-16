import type { PaginatedMeta, DueItemPayload } from './common';
import type { Branch, BranchOption } from './branch';


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

export interface PurchaseSelectSupplier {
  id: number;
  name: any;
}

export interface PurchaseSelectOptions {
  branches: BranchOption[];
  suppliers?: PurchaseSelectSupplier[];
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

export interface PurchaseDue {
  id: number;
  purchase_id: number;
  amount: number;
  date: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Purchase {
  id: number;
  branch_id?: number;
  branch?: Branch;
  supplier_id?: number | null;
  supplier?: {
    id: number;
    name: any;
    phone?: string;
  } | null;
  receipt?: string | null;
  receipt_url?: string | null;
  total_cost: number;
  total_quantity: number;
  paid_amount?: number;
  remaining_amount?: number;
  cost?: number;
  quantity?: number;
  notes?: string | null;
  items: PurchaseItemDetail[];
  dues?: PurchaseDue[];
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
  branch_id: number;
  supplier_id?: number | null;
  total_cost?: number;
  paid_amount?: number;
  due_date?: string;
  dues?: DueItemPayload[];
  receipt?: File | null;
  notes?: string;
  items: PurchaseItemPayload[];
}

