import React, { useState, useMemo } from 'react';
import type { PermissionAction, GroupedPermissions } from '../../types';
import {
  PERMISSIONS_MASTER_LIST,
  PERMISSION_CATEGORIES,
  PERMISSIONS_ACTION_LABELS,
} from '../../utils/permissionsMaster';
import {
  MdSearch,
  MdSelectAll,
  MdClearAll,
  MdVisibility,
  MdCheck,
  MdShield,
} from 'react-icons/md';

export interface PermissionsMatrixProps {
  value: GroupedPermissions;
  onChange: (value: GroupedPermissions) => void;
  disabled?: boolean;
}

export const PermissionsMatrix: React.FC<PermissionsMatrixProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter modules based on category and search query
  const filteredModules = useMemo(() => {
    return PERMISSIONS_MASTER_LIST.filter((mod) => {
      const matchesCategory =
        selectedCategory === 'all' || mod.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        mod.label.toLowerCase().includes(q) ||
        mod.key.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  // Total selected actions count
  const totalSelectedCount = useMemo(() => {
    return Object.values(value).reduce((acc, actions) => acc + (actions?.length || 0), 0);
  }, [value]);

  const totalModulesActive = useMemo(() => {
    return Object.keys(value).filter((k) => value[k] && value[k].length > 0).length;
  }, [value]);

  // ── Handler: Toggle individual action ──────
  const toggleAction = (moduleKey: string, action: PermissionAction) => {
    if (disabled) return;
    const currentActions = value[moduleKey] ? [...value[moduleKey]] : [];

    if (action === 'all') {
      // If clicking 'all':
      if (currentActions.includes('all')) {
        // Deselect all for this module
        const next = { ...value };
        delete next[moduleKey];
        onChange(next);
      } else {
        // Select 'all' (or all supported actions)
        const meta = PERMISSIONS_MASTER_LIST.find((m) => m.key === moduleKey);
        const supported: PermissionAction[] = meta ? meta.supportedActions : (['all', 'view', 'add', 'update', 'delete'] as PermissionAction[]);
        onChange({
          ...value,
          [moduleKey]: supported,
        });
      }
      return;
    }

    // Toggle specific action
    let nextActions: PermissionAction[];
    if (currentActions.includes(action)) {
      nextActions = currentActions.filter((a) => a !== action && a !== 'all');
    } else {
      nextActions = [...currentActions.filter((a) => a !== 'all'), action];
      // Check if all actions of this module are now checked
      const meta = PERMISSIONS_MASTER_LIST.find((m) => m.key === moduleKey);
      const regularSupported = meta ? meta.supportedActions.filter((a) => a !== 'all') : [];
      if (regularSupported.every((a) => nextActions.includes(a))) {
        nextActions.push('all');
      }
    }

    if (nextActions.length === 0) {
      const next = { ...value };
      delete next[moduleKey];
      onChange(next);
    } else {
      onChange({
        ...value,
        [moduleKey]: nextActions,
      });
    }
  };

  // ── Bulk Presets ───────────────────────────
  const selectAllPermissions = () => {
    if (disabled) return;
    const allMap: GroupedPermissions = {};
    PERMISSIONS_MASTER_LIST.forEach((m) => {
      allMap[m.key] = [...m.supportedActions];
    });
    onChange(allMap);
  };

  const selectReadOnlyPermissions = () => {
    if (disabled) return;
    const readOnlyMap: GroupedPermissions = {};
    PERMISSIONS_MASTER_LIST.forEach((m) => {
      if (m.supportedActions.includes('view')) {
        readOnlyMap[m.key] = ['view'];
      }
    });
    onChange(readOnlyMap);
  };

  const clearAllPermissions = () => {
    if (disabled) return;
    onChange({});
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs p-5 md:p-6 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <MdShield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                تحديد الصلاحيات المسندة للدور
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                {totalModulesActive} موديول مفعّل ({totalSelectedCount} إجراء)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              حدد بدقة الأقسام والعمليات المسموح بها لهذا الدور في لوحة التحكم
            </p>
          </div>
        </div>

        {/* Quick Bulk Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={selectAllPermissions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold border border-indigo-200 dark:border-indigo-800/50 transition-colors cursor-pointer"
            title="منح كامل الصلاحيات لجميع الأقسام"
          >
            <MdSelectAll size={16} />
            <span>تحديد الكل</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={selectReadOnlyPermissions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-bold border border-blue-200 dark:border-blue-800/50 transition-colors cursor-pointer"
            title="منح صلاحيات القراءة والتصفح فقط"
          >
            <MdVisibility size={16} />
            <span>عرض فقط</span>
          </button>

          <button
            type="button"
            disabled={disabled || totalSelectedCount === 0}
            onClick={clearAllPermissions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 text-xs font-bold border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="إلغاء التحديد وتفريغ الصلاحيات"
          >
            <MdClearAll size={16} />
            <span>إلغاء التحديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <MdSearch size={20} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الموديول أو الوصف (مثال: المنتجات، المشتريات، الكاشير...)"
            disabled={disabled}
            className="w-full ps-11 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-primary text-white shadow-xs shadow-primary/30'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            جميع الأقسام ({PERMISSIONS_MASTER_LIST.length})
          </button>
          {PERMISSION_CATEGORIES.map((cat) => {
            const count = PERMISSIONS_MASTER_LIST.filter((m) => m.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs shadow-primary/30'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Permissions Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredModules.map((mod) => {
          const activeActions = value[mod.key] || [];
          const hasAll = activeActions.includes('all');
          const isAnyActive = activeActions.length > 0;

          return (
            <div
              key={mod.key}
              className={`p-4 rounded-2xl border transition-all ${
                isAnyActive
                  ? 'bg-white dark:bg-slate-800 border-primary/40 dark:border-primary/50 shadow-xs'
                  : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/80'
              }`}
            >
              {/* Module Top Row */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-white text-sm">
                      {mod.label}
                    </span>
                    <code className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700/80 px-1.5 py-0.5 rounded">
                      {mod.key}
                    </code>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                {/* 'All' master toggle button for this module */}
                {mod.supportedActions.includes('all') && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleAction(mod.key, 'all')}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      hasAll
                        ? 'bg-primary text-white border-primary shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary/50'
                    }`}
                  >
                    <MdCheck size={14} className={hasAll ? 'opacity-100' : 'opacity-0'} />
                    <span>كامل الصلاحيات</span>
                  </button>
                )}
              </div>

              {/* Supported Actions Buttons / Checkboxes */}
              <div className="pt-3 flex flex-wrap items-center gap-2">
                {mod.supportedActions
                  .filter((act) => act !== 'all')
                  .map((act) => {
                    const isChecked = hasAll || activeActions.includes(act);
                    const actMeta = PERMISSIONS_ACTION_LABELS[act] || {
                      label: act,
                      color: 'bg-slate-100 text-slate-700',
                    };

                    return (
                      <button
                        key={act}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleAction(mod.key, act)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none border ${
                          isChecked
                            ? `${actMeta.color} shadow-2xs ring-1 ring-primary/20`
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                            isChecked
                              ? 'bg-primary text-white border-primary'
                              : 'border-slate-300 dark:border-slate-600 bg-transparent'
                          }`}
                        >
                          {isChecked && <MdCheck size={10} />}
                        </span>
                        <span>{actMeta.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
          <p className="text-slate-500 text-sm">لا توجد أقسام مطابقة للبحث الحالي</p>
        </div>
      )}
    </div>
  );
};

export default PermissionsMatrix;
