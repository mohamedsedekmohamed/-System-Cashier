import type { PaginatedMeta } from './common';
import type { Role } from './role';

export interface Admin {
  id: number;
  name: string;
  role_id: number | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminFormData {
  name: string;
  password?: string;
  role_id?: number | null;
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

