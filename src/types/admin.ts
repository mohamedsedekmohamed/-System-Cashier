import type { PaginatedMeta } from './common';

export interface Role {
  id: number;
  name: string;
}

export interface Admin {
  id: number;
  name: string;
  role_id: number;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface AdminFormData {
  name: string;
  password?: string;
  role_id: number;
}

export interface AdminListResponse {
  data: Admin[];
  meta: PaginatedMeta;
  select_options?: {
    roles: Role[];
  };
}

export interface SingleAdminResponse {
  status: boolean;
  data: Admin;
  select_options?: {
    roles: Role[];
  };
}

export interface SelectOptionsResponse {
  status: boolean;
  data: {
    roles: Role[];
  };
}
