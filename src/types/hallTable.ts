import type { PaginatedMeta, LocalizedString } from './common';
import type { BranchOption } from './branch';

export interface HallOption {
  id: number;
  name: LocalizedString;
  branch_id?: number;
}

export interface HallTable {
  id: number;
  name: string;
  branch_id: number;
  branch: {
    id: number;
    name: string | LocalizedString | null;
  };
  hall_id: number;
  hall: {
    id: number;
    name: LocalizedString;
  };
  status: boolean;
  qr?: string | null;
  base_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HallTableSelectOptions {
  branches: BranchOption[];
  halls: HallOption[];
}

export interface HallTableListResponse {
  data: HallTable[];
  meta: PaginatedMeta;
  select_options?: HallTableSelectOptions;
}

export interface SingleHallTableResponse {
  status: boolean;
  data: HallTable;
  select_options?: HallTableSelectOptions;
}

export interface HallTablePayload {
  name: string;
  branch_id: number;
  hall_id: number;
  status: boolean;
  base_url: string;
}

export interface HallTableSelectOptionsResponse {
  status: boolean;
  data: HallTableSelectOptions;
}
