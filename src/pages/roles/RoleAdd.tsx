import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi, ROLES_KEY } from '../../services/roleService';
import type { RoleFormData, GroupedPermissions } from '../../types';
import { PermissionsMatrix } from '../../components/roles/PermissionsMatrix';
import { MdArrowForward, MdSave, MdSecurity } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const RoleAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<GroupedPermissions>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // ── Create Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: (payload: RoleFormData) => roleApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
      navigate('/dashboard/roles');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('يرجى إدخال اسم الدور الوظيفي');
      return;
    }

    // Clean permissions map: only keep non-empty action arrays
    const cleanPermissions: GroupedPermissions = {};
    Object.entries(permissions).forEach(([k, actions]) => {
      if (actions && actions.length > 0) {
        cleanPermissions[k] = actions;
      }
    });

    mutation.mutate({
      name: name.trim(),
      permissions: cleanPermissions,
    });
  };

  const isPending = mutation.isPending;

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/roles"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdSecurity size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">إضافة دور جديد</h1>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              تحديد اسم المسمى الوظيفي وتخصيص الصلاحيات المسموح بها في النظام
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Role Info Box */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-700">
            معلومات الدور الأساسية
          </h2>

          <div className="max-w-xl">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              اسم الدور الوظيفي <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setValidationError(null);
              }}
              placeholder="مثال: مسؤول مشتريات، كاشير رئيسي، أمين مخزن..."
              disabled={isPending}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
            {validationError && (
              <p className="mt-1.5 text-xs text-red-500 font-semibold">{validationError}</p>
            )}
          </div>
        </div>

        {/* Permissions Matrix */}
        <PermissionsMatrix
          value={permissions}
          onChange={setPermissions}
          disabled={isPending}
        />

        {/* Mutation Error */}
        {mutation.isError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {(mutation.error as any)?.response?.data?.message ||
              'حدث خطأ أثناء حفظ الدور. يرجى التأكد من أن اسم الدور غير مكرر والمحاولة مرة أخرى.'}
          </div>
        )}

        {/* Floating Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 z-20 lg:pr-64">
          <Link
            to="/dashboard/roles"
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? (
              <>
                <AiOutlineLoading3Quarters size={18} className="animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <MdSave size={18} />
                <span>حفظ الدور والصلاحيات</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleAdd;

