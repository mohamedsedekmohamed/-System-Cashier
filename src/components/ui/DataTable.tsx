import React from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import LoadingSpinner from './LoadingSpinner';
import type { PaginatedMeta } from '../../types';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T | string; // The dot-notation key (e.g. 'name.ar') or a top-level key
  render?: (row: T, index: number, globalIndex: number) => React.ReactNode;
  className?: string; // e.g. 'text-right max-w-sm truncate'
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  meta?: PaginatedMeta;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyText?: string;
  keyExtractor?: (row: T) => string | number;
}

// A helper to safely get nested values like 'name.ar'
const getNestedValue = (obj: any, path: string) => {
  const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
  
  // Handle LocalizedString objects (with 'ar' and 'en' keys)
  if (value && typeof value === 'object' && 'ar' in value && 'en' in value) {
    return value.ar || value.en || '';
  }
  
  return value;
};

export function DataTable<T>({
  data,
  columns,
  meta,
  onPageChange,
  isLoading,
  emptyIcon,
  emptyText = 'لا توجد بيانات',
  keyExtractor = (row: any) => row.id,
}: DataTableProps<T>) {

  if (isLoading && data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-10">
        <LoadingSpinner text="جاري التحميل..." />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full">
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          {emptyIcon && <div className="mb-3 opacity-40">{emptyIcon}</div>}
          <p className="font-medium">{emptyText}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className={`px-5 py-3.5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {data.map((row, rowIndex) => {
                const globalIndex = meta ? (meta.current_page - 1) * meta.per_page + rowIndex + 1 : rowIndex + 1;
                return (
                <tr key={keyExtractor(row)} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                  {columns.map((col, idx) => {
                    let cellContent: React.ReactNode = null;
                    if (col.render) {
                      cellContent = col.render(row, rowIndex, globalIndex);
                    } else if (col.accessorKey) {
                      cellContent = getNestedValue(row, col.accessorKey as string);
                    }
                    
                    return (
                      <td key={idx} className={`px-5 py-4 ${col.className || ''}`}>
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta && onPageChange && data.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between mt-auto">
          <p className="text-xs text-slate-400">
            صفحة {meta.current_page} من {Math.max(1, meta.last_page)} — إجمالي {meta.total} عنصر
          </p>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onPageChange(Math.max(1, meta.current_page - 1))} 
              disabled={meta.current_page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="الصفحة السابقة"
            >
              <MdChevronRight size={18} />
            </button>
            {Array.from({ length: Math.max(1, meta.last_page) }, (_, i) => i + 1)
              .filter(p => p === 1 || p === meta.last_page || Math.abs(p - meta.current_page) <= 1)
              .reduce<(number | 'dots')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1]) > 1) acc.push('dots');
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === 'dots' ? (
                  <span key={`dots-${i}`} className="px-1 text-slate-400 text-xs">…</span>
                ) : (
                  <button 
                    key={item} 
                    onClick={() => onPageChange(item as number)}
                    disabled={meta.last_page <= 1}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200
                      ${meta.current_page === item
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}
                      ${meta.last_page <= 1 ? 'cursor-default' : ''}`}
                  >
                    {item}
                  </button>
                )
              )}
            <button 
              onClick={() => onPageChange(Math.min(meta.last_page, meta.current_page + 1))} 
              disabled={meta.current_page >= meta.last_page}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="الصفحة التالية"
            >
              <MdChevronLeft size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
