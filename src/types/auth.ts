import type { GroupedPermissions, RolePermissionItem } from './role';

export interface User {
  id: number;
  name: string;
  email?: string;
  role?: string;
  role_id?: number | null;
  permissions?: RolePermissionItem[];
  grouped_permissions?: GroupedPermissions;
}

export interface LoginPayload {
  name: string;
  password: string;
  guard: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}
