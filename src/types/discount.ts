import type { PaginatedMeta, LocalizedString } from './common';

export type DiscountType = 'percentage' | 'value';

export interface Discount {
  id: number;
  name: LocalizedString;
  type: DiscountType;
  amount: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DiscountFormData {
  name: {
    ar: string;
    en: string;
  };
  type: DiscountType;
  amount: number;
  status: boolean;
}

export interface DiscountListResponse {
  data: Discount[];
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta: PaginatedMeta;
}

export interface SingleDiscountResponse {
  status?: boolean;
  data: Discount;
}
