import type { PaginatedMeta } from './common';
import type { Branch, BranchOption } from './branch';
import type { Saler } from './saler';

export interface SaleSelectMaterial {
  id: number;
  name: string;
  stock: number;
}

export interface SaleSelectRecipe {
  id: number;
  name: string;
  stock: number;
}

export interface SaleSelectProduct {
  id: number;
  name: string;
  price?: number;
}

export interface SaleSelectSaler {
  id: number;
  name: any;
  phone?: string;
  balance?: number;
}

export interface SaleSelectOptions {
  branches: BranchOption[];
  salers: SaleSelectSaler[];
  materials: SaleSelectMaterial[];
  product_recipes: SaleSelectRecipe[];
  products: SaleSelectProduct[];
}

export interface SaleSelectOptionsResponse {
  status: boolean;
  data: SaleSelectOptions;
}

export interface SaleDue {
  id: number;
  sale_id: number;
  amount: number;
  date: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SaleItemDetail {
  id: number;
  sale_id: number;
  product_id?: number | null;
  product_name?: string | null;
  product?: {
    id: number;
    name: any;
    price?: number;
  } | null;
  material_id?: number | null;
  material_name?: string | null;
  material?: {
    id: number;
    name: any;
    stock: number;
  } | null;
  product_recipe_id?: number | null;
  product_recipe_name?: string | null;
  product_recipe?: {
    id: number;
    name: any;
    stock: number;
  } | null;
  quantity: number;
  cost: number;
  created_at?: string;
  updated_at?: string;
}

export interface Sale {
  id: number;
  branch_id?: number;
  branch?: Branch;
  saler_id?: number | null;
  saler?: Saler | null;
  receipt?: string | null;
  receipt_url?: string | null;
  total_cost: number;
  paid_amount: number;
  remaining_amount: number;
  total_quantity: number;
  notes?: string | null;
  items: SaleItemDetail[];
  dues?: SaleDue[];
  created_at?: string;
  updated_at?: string;
}

export interface SaleListResponse {
  status: boolean;
  data: Sale[];
  links?: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
  meta: PaginatedMeta;
  select_options?: SaleSelectOptions;
}

export interface SingleSaleResponse {
  status: boolean;
  data: Sale;
}

export interface SaleItemPayload {
  product_id?: number | null;
  material_id?: number | null;
  product_recipe_id?: number | null;
  quantity: number;
  cost: number;
}

export interface SaleFormData {
  branch_id: number;
  saler_id?: number | null;
  paid_amount?: number;
  due_date?: string;
  without_recipe?: boolean;
  receipt?: File | null;
  notes?: string;
  items: SaleItemPayload[];
}

export interface InsufficientIngredientError {
  type: 'product' | 'material' | 'product_recipe' | 'recipe';
  id?: number;
  name: string;
  available_stock: number;
  required_quantity: number;
  can_bypass: boolean;
}
