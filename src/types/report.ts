import type { PaginatedMeta } from './common';

export interface StartShiftReportBranch {
  id: number;
  name: string | { ar?: string; en?: string } | null;
}

export interface StartShiftReportCashier {
  id: number;
  name: string | { ar?: string; en?: string } | null;
  branch_id: number | null;
}

export interface StartShiftReportCashierMan {
  id: number;
  name: string;
  branch_id: number | null;
}

export interface StartShiftReportSelectOptions {
  branches: StartShiftReportBranch[];
  cashiers: StartShiftReportCashier[];
  cashier_men: StartShiftReportCashierMan[];
}

export interface StartShiftSelectOptionsResponse {
  status: boolean;
  data: StartShiftReportSelectOptions;
}

export interface StartShiftReportSummary {
  total_default_amount: number;
  total_collected_mony: number;
  total_deficit: number;
  shifts_count: string | number;
}

export interface StartShiftReportItem {
  id: number;
  default_total_amount: number;
  total_mony: number | null;
  deficit: number | null;
  cashier_id: number;
  cashier_name: string | { ar?: string; en?: string } | null;
  branch_id: number;
  branch_name: string | { ar?: string; en?: string } | null;
  cashier_man_id: number;
  cashier_man_name: string;
  cashier_man?: any;
  cashier?: any;
  branch?: any;
  start: string;
  end: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StartShiftReportParams {
  branch_id?: number | null;
  cashier_id?: number | null;
  cashier_man_id?: number | null;
  start?: string | null;
  end?: string | null;
  lang?: string | null;
  page?: number;
  per_page?: number;
}

export interface StartShiftReportResponse {
  status: boolean;
  summary: StartShiftReportSummary;
  data?: StartShiftReportItem[] | any;
  shifts?: StartShiftReportItem[] | any;
  links?: any;
  meta?: PaginatedMeta;
  select_options?: StartShiftReportSelectOptions;
}
