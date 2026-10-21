import type { LocalizedString, PaginatedMeta } from './common';

export interface AddonOptionTax {
  id: number;
  name: LocalizedString;
  name_en?: string;
  name_ar?: string;
  type: 'percentage' | 'value' | string;
  amount: number;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AddonOptionDiscount {
  id: number;
  name: LocalizedString;
  name_en?: string;
  name_ar?: string;
  type: 'percentage' | 'value' | string;
  amount: number;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AddonOptionKitchen {
  id: number;
  name: LocalizedString;
  branch_id?: number;
  role?: string;
}

export interface AddonSelectOptions {
  taxes: AddonOptionTax[];
  discounts: AddonOptionDiscount[];
  kitchens: AddonOptionKitchen[];
}

export interface AddonSelectOptionsResponse {
  status: boolean;
  data: AddonSelectOptions;
}

export interface Addon {
  id: number;
  name: LocalizedString;
  price: number;
  image?: string | null;
  tax_id?: number | null;
  tax?: AddonOptionTax | null;
  discount_id?: number | null;
  discount?: AddonOptionDiscount | null;
  kitchen_id?: number | null;
  kitchen?: AddonOptionKitchen | null;
  created_at?: string;
  updated_at?: string;
}

export interface AddonFormData {
  name: LocalizedString;
  price: number;
  image?: File | string | null;
  tax_id?: number | null;
  discount_id?: number | null;
  kitchen_id?: number | null;
}

export interface AddonListResponse {
  status?: boolean;
  data: Addon[];
  meta?: PaginatedMeta;
}

export interface SingleAddonResponse {
  status?: boolean;
  data: Addon;
  select_options?: AddonSelectOptions;
}
