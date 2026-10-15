import type { PaginatedMeta, LocalizedString } from './common';
import type { BranchOption } from './branch';

export interface Hall {
  id: number;
  name: LocalizedString;
  branch_id: number | null;
  branch?: {
    id: number;
    name: LocalizedString | string;
  } | null;
  status: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HallFormData {
  name: {
    ar: string;
    en: string;
  };
  branch_id: number | null;
  status: boolean;
}

export interface HallSelectOptions {
  branches: BranchOption[];
}

export interface HallListResponse {
  data: Hall[];
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta: PaginatedMeta;
  select_options?: HallSelectOptions;
}

export interface SingleHallResponse {
  status: boolean;
  data: Hall;
  select_options?: HallSelectOptions;
}

export interface HallSelectOptionsResponse {
  status: boolean;
  data: HallSelectOptions;
}
