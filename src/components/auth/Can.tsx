import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import type { PermissionAction } from '../../types';

export interface CanProps {
  permission: string;
  action?: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  permission,
  action = 'view',
  children,
  fallback = null,
}) => {
  const { can } = usePermissions();

  if (can(permission, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default Can;

