import type { PaginatedMeta, LocalizedString } from './common';
import type { BranchOption } from './branch';

export interface FinancialAccount {
  id: number;
  name: LocalizedString | string | any;
  icon: string | null;
  balance: number;
  status: boolean;
  is_cash: boolean;
  branch_id: number | null;
  branch?: {
    id: number;
    name: LocalizedString | string | any;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FinancialAccountFormData {
  name: {
    ar: string;
    en: string;
  };
  icon: File | string | null;
  balance: number;
  status: boolean;
  is_cash: boolean;
  branch_id: number | null;
}

export interface FinancialAccountSelectOptions {
  branches: BranchOption[];
}

export interface FinancialAccountListResponse {
  data: FinancialAccount[];
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta: PaginatedMeta;
  select_options?: FinancialAccountSelectOptions;
}

export interface SingleFinancialAccountResponse {
  status?: boolean;
  data: FinancialAccount;
  select_options?: FinancialAccountSelectOptions;
}

export interface FinancialAccountSelectOptionsResponse {
  status: boolean;
  data: FinancialAccountSelectOptions;
}
