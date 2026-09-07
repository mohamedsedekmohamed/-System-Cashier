import type { PaginatedMeta, LocalizedString, LocalizedDescription } from './common';

export interface ExpenseList {
  id: number;
  name: LocalizedString;
  description: LocalizedDescription;
  created_at: string;
  updated_at: string;
}

export interface ExpenseListResponse {
  data: ExpenseList[];
  meta: PaginatedMeta;
  links?: any;
}

export interface SingleExpenseListResponse {
  data: ExpenseList;
}

export interface ExpenseListPayload {
  name: LocalizedString;
  description: LocalizedDescription;
}
