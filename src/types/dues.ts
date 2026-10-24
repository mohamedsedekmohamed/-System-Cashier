import type { PaginatedMeta } from './common';

export type DueStatus = 'paid' | 'overdue' | 'unpaid' | 'all';

export interface DueSupplier {
  id: number;
  name: any;
  phone?: string | null;
  balance?: number;
}

export interface DueCustomer {
  id: number;
  name: any;
  phone?: string | null;
  balance?: number;
}

export interface DuePurchaseInfo {
  id: number;
  supplier_id?: number | null;
  branch_id?: number | null;
  total_cost: number;
  paid_amount: number;
  remaining_amount: number;
}

export interface DueSaleInfo {
  id: number;
  saler_id?: number | null;
  branch_id?: number | null;
  total_cost: number;
  paid_amount: number;
  remaining_amount: number;
}

export interface PurchaseDueItem {
  id: number;
  purchase_id: number;
  amount: number;
  payment: number;
  remaining: number;
  status: 'paid' | 'overdue' | 'unpaid' | string;
  date: string;
  notes?: string | null;
  supplier?: DueSupplier | null;
  purchase?: DuePurchaseInfo | null;
  created_at?: string;
  updated_at?: string;
}

export interface SaleDueItem {
  id: number;
  sale_id: number;
  amount: number;
  payment: number;
  remaining: number;
  status: 'paid' | 'overdue' | 'unpaid' | string;
  date: string;
  notes?: string | null;
  saler?: DueCustomer | null;
  sale?: DueSaleInfo | null;
  created_at?: string;
  updated_at?: string;
}

export interface DuesListResponse<T> {
  data: T[];
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta: PaginatedMeta;
}

export interface SingleDueResponse<T> {
  status: boolean;
  data: T;
}

export interface PayDuePayload {
  payment: number;
  notes?: string;
}

export interface PayDueResponse<T> {
  status: boolean;
  message?: string;
  data: T;
  meta?: {
    paid_now?: number;
    due_remaining?: number;
    due_status?: string;
    purchase_remaining?: number;
    sale_remaining?: number;
    supplier_balance?: number;
    saler_balance?: number;
  };
}

export interface DuesFilterParams {
  status?: DueStatus;
  purchase_id?: number;
  sale_id?: number;
  supplier_id?: number;
  saler_id?: number;
  branch_id?: number;
  date?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  per_page?: number;
}
