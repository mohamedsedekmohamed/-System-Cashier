import type { PaginatedMeta, SelectOption } from './common';

export interface CashierManBranch {
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

export interface CashierMachine {
  id: number;
  name: string;
  cashier_man_id: number;
  branch_id: number;
  created_at: string;
  updated_at: string;
}

export interface CashierMan {
  id: number;
  name: string;
  cashier_id: number;
  branch_id: number;
  shift_id?: number;
  role: string;
  branch: CashierManBranch;
  cashier: CashierMachine;
  shift?: {
    id: number;
    name: { ar: string; en: string };
    start_time: string;
    end_time: string;
    branch_id: number;
    is_tomorrow: boolean;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CashierManFormData {
  name: string;
  password?: string;
  cashier_id: number;
  branch_id: number;
  shift_id: number;
}

export interface CashierManSelectOptions {
  branches: SelectOption[];
  cashiers: SelectOption[];
  shifts?: { id: number; name: { ar: string; en: string }; branch_id: number; start_time: string; end_time: string; is_tomorrow: boolean }[];
}

export interface CashierManListResponse {
  data: CashierMan[];
  meta: PaginatedMeta;
  select_options?: CashierManSelectOptions;
}

export interface SingleCashierManResponse {
  status: boolean;
  data: CashierMan;
  select_options?: CashierManSelectOptions;
}

export interface CashierManSelectOptionsResponse {
  status: boolean;
  data: CashierManSelectOptions;
}
