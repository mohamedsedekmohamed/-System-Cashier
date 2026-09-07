import type { PaginatedMeta, LocalizedString } from './common';

export interface BranchOption {
  id: number;
  name: string;
  role?: string;
}

export interface HallOption {
  id: number;
  name: LocalizedString;
}

export interface HallTable {
  id: number;
  name: string;
  branch_id: number;
  branch: {
    id: number;
    name: string;
  };
  hall_id: number;
  hall: {
    id: number;
    name: LocalizedString;
  };
  status: boolean;
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
}

export interface HallTableSelectOptionsResponse {
  status: boolean;
  data: HallTableSelectOptions;
}
