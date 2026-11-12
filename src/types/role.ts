import type { PaginatedMeta } from './common';

export type PermissionAction = 'all' | 'view' | 'add' | 'update' | 'delete';

export interface RolePermissionItem {
  id?: number;
  name: string;
  action: PermissionAction;
  role_id?: number;
}

export type GroupedPermissions = Record<string, PermissionAction[]>;

export interface Role {
  id: number;
  name: string;
  permissions_count?: number;
  permissions?: RolePermissionItem[];
  grouped_permissions?: GroupedPermissions;
  created_at?: string;
  updated_at?: string;
}

export interface RoleFormData {
  name: string;
  permissions: GroupedPermissions | RolePermissionItem[] | string[];
}

export type AvailablePermissionsMap = Record<string, PermissionAction[]>;

export interface RoleListResponse {
  data: Role[];
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta?: PaginatedMeta;
}

export interface SingleRoleResponse {
  status: boolean;
  message?: string;
  data: Role;
  select_options?: {
    permissions?: AvailablePermissionsMap;
  };
}

export interface RolesPermissionsResponse {
  status: boolean;
  data: AvailablePermissionsMap;
}

export interface RolesSelectOptionsResponse {
  status: boolean;
  data: {
    roles: Array<{ id: number; name: string }>;
    permissions?: AvailablePermissionsMap;
  };
}

