import type { PaginatedMeta, SelectOption } from './common';

export interface CashierBranch {
  id: number;
  name: string;
  address: string;
  watts: string;
  facebook: string;
  status: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

export type CashierStatus = 'active' | 'in_active';

export interface Cashier {
  id: number;
  name: string;
  cashier_man_id?: number | null;
  branch_id: number;
  cashier_man_name: string;
  branch: CashierBranch;
  cashier_man?: string;
  status?: CashierStatus | string;
  created_at: string;
  updated_at: string;
}

export interface CashierFormData {
  name: string;
  cashier_man_id?: number | null;
  branch_id: number;
}

export interface CashierSelectOptions {
  branches: SelectOption[];
  cashier_men: SelectOption[];
}

export interface CashierListResponse {
  data: Cashier[];
  meta: PaginatedMeta;
  select_options?: CashierSelectOptions;
}

export interface SingleCashierResponse {
  status: boolean;
  data: Cashier;
  select_options?: CashierSelectOptions;
}

export interface CashierSelectOptionsResponse {
  status: boolean;
  data: CashierSelectOptions;
}
