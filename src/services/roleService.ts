import { api } from '../lib/axios';
import type { 
  RoleFormData, 
  RoleListResponse, 
  SingleRoleResponse, 
  RolesPermissionsResponse, 
  RolesSelectOptionsResponse,
  AvailablePermissionsMap
} from '../types';

export const ROLES_KEY = 'roles';
export const ROLES_PERMISSIONS_KEY = 'roles_permissions';
export const ROLES_SELECT_OPTIONS_KEY = 'roles_select_options';

export const roleApi = {
  /** 
   * GET /api/admin/roles/permissions
   * جلب قائمة الصلاحيات والإجراءات المتاحة
   */
  getAvailablePermissions: async (): Promise<AvailablePermissionsMap> => {
    try {
      const { data } = await api.get<RolesPermissionsResponse>('/api/admin/roles/permissions');
      return data.data;
    } catch {
      // Fallback to /api/admin/roles/lists
      const { data } = await api.get<RolesPermissionsResponse>('/api/admin/roles/lists');
      return data.data;
    }
  },

  /** 
   * GET /api/admin/roles/select-options
   * جلب خيارات الـ Select للأدوار
   */
  getSelectOptions: async (): Promise<RolesSelectOptionsResponse> => {
    const { data } = await api.get<RolesSelectOptionsResponse>('/api/admin/roles/select-options');
    return data;
  },

  /** 
   * GET /api/admin/roles?page=&per_page=&name=
   * عرض قائمة الأدوار الأساسية فقط
   */
  list: async (page = 1, perPage = 15, name?: string): Promise<RoleListResponse> => {
    const params: Record<string, any> = { page, per_page: perPage };
    if (name?.trim()) {
      params.name = name.trim();
    }
    const { data } = await api.get<RoleListResponse>('/api/admin/roles', { params });
    return data;
  },

  /** 
   * GET /api/admin/roles/{role_id}
   * جلب تفاصيل الدور مع صلاحياته الكاملة عبر الـ ID
   */
  get: async (roleId: number | string): Promise<SingleRoleResponse> => {
    const { data } = await api.get<SingleRoleResponse>(`/api/admin/roles/${roleId}`);
    return data;
  },

  /** 
   * POST /api/admin/roles
   * إضافة دور جديد مع الصلاحيات
   */
  create: async (payload: RoleFormData): Promise<SingleRoleResponse> => {
    const { data } = await api.post<SingleRoleResponse>('/api/admin/roles', payload);
    return data;
  },

  /** 
   * PUT /api/admin/roles/{role_id}
   * تعديل دور وصلاحياته
   */
  update: async (roleId: number | string, payload: RoleFormData): Promise<SingleRoleResponse> => {
    const { data } = await api.put<SingleRoleResponse>(`/api/admin/roles/${roleId}`, payload);
    return data;
  },

  /** 
   * DELETE /api/admin/roles/{role_id}
   * حذف دور
   */
  delete: async (roleId: number | string): Promise<void> => {
    await api.delete(`/api/admin/roles/${roleId}`);
  },
};
