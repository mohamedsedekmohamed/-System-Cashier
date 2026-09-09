import type { PaginatedMeta, SelectOption } from './common';

export interface KitchenName {
  ar: string;
  en: string;
}

export interface KitchenBranch {
  id: number;
  name: string | null;
}

export interface Kitchen {
  id: number;
  name: KitchenName;
  user_name: string | null;
  branch_id: number | null;
  branch: KitchenBranch;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface KitchenFormData {
  name: KitchenName;
  user_name: string | null;
  password?: string;
  branch_id: number | null;
  status: boolean | null;
}

export interface KitchenSelectOptions {
  branches: SelectOption[];
}

export interface KitchenListResponse {
  data: Kitchen[];
  meta: PaginatedMeta;
  links: any;
  select_options?: KitchenSelectOptions;
}

export interface SingleKitchenResponse {
  status: boolean;
  data: Kitchen;
  select_options?: KitchenSelectOptions;
}

export interface KitchenSelectOptionsResponse {
  status: boolean;
  data: {
    branches: SelectOption[];
  };
}
