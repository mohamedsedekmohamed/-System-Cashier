import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitApi, UNITS_KEY } from '../../services/unitService';
import type { Unit } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { UnitModal } from './UnitModal';
import { renderName } from '../../utils/helpers';
import { MdEdit, MdDelete, MdStraighten, MdAdd, MdRefresh, MdSearch } from 'react-icons/md';

export const UnitList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);
  const [modalTarget, setModalTarget] = useState<{ isOpen: boolean; unit: Unit | null }>({
    isOpen: false,
    unit: null,
  });
  const perPage = 15;

  // ── Fetch paginated units ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [UNITS_KEY, page, perPage, search],
    queryFn: () => unitApi.list(page, perPage, search),
    placeholderData: (prev) => prev,
  });

  const units = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => unitApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNITS_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Columns ────────────────────────────────
  const columns: ColumnDef<Unit>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-primary px-2 py-0.5 rounded-md font-bold">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'اسم الوحدة',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
            <MdStraighten size={18} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              {renderName(u.name)}
            </p>
            {typeof u.name === 'object' && u.name.en && (
              <span className="text-xs text-slate-400 font-mono" dir="ltr">
                {u.name.en}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'معامل التحويل (Value)',
      render: (u) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono font-bold text-xs text-slate-700 dark:text-slate-200">
          {Number(u.value).toLocaleString('en-US', { maximumFractionDigits: 4 })}
        </span>
      ),
    },
    {
      header: 'تاريخ الإنشاء',
      render: (u) => (
        <span className="text-xs text-slate-500 font-mono" dir="ltr">
          {u.created_at ? new Date(u.created_at).toLocaleDateString('ar-EG') : '—'}
        </span>
      ),
    },
    {
      header: 'الإجراءات',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setModalTarget({ isOpen: true, unit: u })}
            className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
            title="تعديل الوحدة"
          >
            <MdEdit size={16} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(u)}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
            title="حذف الوحدة"
          >
            <MdDelete size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-primary">
            <MdStraighten size={26} />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">إدارة وحدات القياس</h1>
          </div>
          <p className="text-xs text-slate-400 mb-1">
            تعريف وحدات القياس ومعامل التحويل الرياضي للمخزون والتصنيع
          </p>
          {meta?.total !== undefined && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              إجمالي {meta.total} وحدة قياس
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="تحديث"
          >
            <MdRefresh size={18} />
          </button>
          <button
            type="button"
            onClick={() => setModalTarget({ isOpen: true, unit: null })}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
          >
            <MdAdd size={20} /> إضافة وحدة قياس
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
        <div className="relative">
          <MdSearch size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ابحث باسم الوحدة أو معامل التحويل..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 ring-primary focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Main Table */}
      {isError ? (
        <ErrorFallback error={error} onRetry={refetch} />
      ) : (
        <DataTable
          columns={columns}
          data={units}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !units.length}
          emptyIcon={<MdStraighten size={48} className="text-slate-300 dark:text-slate-600" />}
          emptyText="لا توجد وحدات قياس مسجلة."
        />
      )}

      {/* Create / Edit Modal */}
      <UnitModal
        isOpen={modalTarget.isOpen}
        onClose={() => setModalTarget({ isOpen: false, unit: null })}
        unit={modalTarget.unit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        title="حذف وحدة قياس"
        message={`هل أنت متأكد من رغبتك في حذف وحدة القياس "${deleteTarget ? renderName(deleteTarget.name) : ''}"؟ قد يؤثر ذلك على المنتجات أو الوصفات المرتبطة بها.`}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
export default UnitList;

