import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { roleApi, ROLES_KEY } from '../services/roleService';
import type { PermissionAction, GroupedPermissions } from '../types';

export interface UsePermissionsReturn {
  isSuperAdmin: boolean;
  can: (module: string, action?: PermissionAction) => boolean;
  hasPermission: (module: string, action?: PermissionAction) => boolean;
  canAny: (module: string, actions: PermissionAction[]) => boolean;
  canAll: (module: string, actions: PermissionAction[]) => boolean;
  permissions: GroupedPermissions;
  isLoading: boolean;
  roleName: string | null;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();

  // Super Admin: When role_id is null, undefined, 0, or not assigned
  const isSuperAdmin = Boolean(user && (!user.role_id || user.role_id === null || user.role_id === undefined));

  // If user has a role_id, check if permissions were already embedded in user object
  const hasEmbeddedPermissions = Boolean(user?.grouped_permissions && Object.keys(user.grouped_permissions).length > 0);

  // Fetch role details if role_id is present and permissions are not embedded
  const { data: roleData, isLoading: isLoadingRole } = useQuery({
    queryKey: [ROLES_KEY, user?.role_id],
    queryFn: () => roleApi.get(user!.role_id!),
    enabled: Boolean(user && user.role_id && !hasEmbeddedPermissions),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Compile effective permissions map
  const permissions: GroupedPermissions = useMemo(() => {
    if (isSuperAdmin) return {};
    if (user?.grouped_permissions) return user.grouped_permissions;
    if (roleData?.data?.grouped_permissions) return roleData.data.grouped_permissions;
    
    // Fallback if permissions come as array of objects in roleData.data.permissions
    if (roleData?.data?.permissions && Array.isArray(roleData.data.permissions)) {
      const map: GroupedPermissions = {};
      roleData.data.permissions.forEach((p) => {
        if (!map[p.name]) map[p.name] = [];
        if (!map[p.name].includes(p.action)) {
          map[p.name].push(p.action);
        }
      });
      return map;
    }

    return {};
  }, [isSuperAdmin, user?.grouped_permissions, roleData?.data]);

  const can = (module: string, action: PermissionAction = 'view'): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;

    const moduleActions = permissions[module];
    if (!moduleActions || !Array.isArray(moduleActions)) return false;

    // 'all' grants all actions on this module
    if (moduleActions.includes('all')) return true;

    return moduleActions.includes(action);
  };

  const canAny = (module: string, actions: PermissionAction[]): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return actions.some((act) => can(module, act));
  };

  const canAll = (module: string, actions: PermissionAction[]): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return actions.every((act) => can(module, act));
  };

  const roleName = isSuperAdmin ? 'سوبر أدمن (Super Admin)' : (user?.role || roleData?.data?.name || null);

  return {
    isSuperAdmin,
    can,
    hasPermission: can,
    canAny,
    canAll,
    permissions,
    isLoading: !isSuperAdmin && Boolean(user?.role_id) && isLoadingRole,
    roleName,
  };
};

