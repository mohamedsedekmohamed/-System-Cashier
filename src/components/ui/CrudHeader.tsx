import React from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdSearch, MdRefresh } from 'react-icons/md';

interface CrudHeaderProps {
  title: string;
  icon: React.ReactNode;
  totalCount?: number;
  
  // Search
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;

  // Actions
  onRefresh?: () => void;
  addLink?: string;
  addText?: string;
}

export const CrudHeader: React.FC<CrudHeaderProps> = ({
  title,
  icon,
  totalCount,
  search,
  onSearchChange,
  searchPlaceholder = 'ابحث...',
  onRefresh,
  addLink,
  addText = 'إضافة جديد',
}) => {
  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 text-primary">
            {icon}
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
          </div>
          {totalCount !== undefined && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              إجمالي {totalCount} عنصر
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button onClick={onRefresh}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="تحديث">
              <MdRefresh size={18} />
            </button>
          )}
          {addLink && (
            <Link to={addLink}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200">
              <MdAdd size={20} /> {addText}
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {onSearchChange && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
          <div className="relative">
            <MdSearch size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="search" value={search || ''}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 ring-primary focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};
