import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import type { PermissionAction } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { MdShield, MdArrowForward } from 'react-icons/md';
import { Link } from 'react-router-dom';

export interface RequirePermissionProps {
  permission: string;
  action?: PermissionAction;
  children: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  action = 'view',
  children,
}) => {
  const { can, isSuperAdmin, isLoading } = usePermissions();

  if (isLoading) {
    return <LoadingSpinner text="جاري التحقق من الصلاحيات..." />;
  }

  if (isSuperAdmin || can(permission, action)) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm my-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center mb-4">
        <MdShield size={36} />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
        غير مصرح لك بالوصول (403 Forbidden)
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        لا يمتلك حسابك صلاحية (<span className="font-semibold text-rose-600 dark:text-rose-400 font-mono">{permission}</span> - <span className="font-semibold">{action}</span>) الكافية لعرض هذه الصفحة أو تنفيذ هذا الإجراء. يرجى التواصل مع إدارة النظام لمنحك الصلاحية المطلوبة.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
      >
        <MdArrowForward size={18} />
        <span>العودة للرئيسية</span>
      </Link>
    </div>
  );
};

export default RequirePermission;

