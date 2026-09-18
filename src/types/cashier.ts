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

export interface Cashier {
  id: number;
  name: string;
  cashier_man_id: number;
  branch_id: number;
  branch: CashierBranch;
  status?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CashierFormData {
  name: string;
  cashier_man_id: number;
  branch_id: number;
  status?: boolean;
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
