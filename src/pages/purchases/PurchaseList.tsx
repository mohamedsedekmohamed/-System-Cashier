import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseApi, PURCHASES_KEY } from '../../services/purchaseService';
import type { Purchase } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { PurchaseDetailsModal } from './PurchaseDetailsModal';
import { MdShoppingBag, MdDelete, MdVisibility, MdReceipt, MdImageNotSupported } from 'react-icons/md';

const PurchaseList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Purchase | null>(null);
  const [viewTarget, setViewTarget] = useState<Purchase | null>(null);
  const perPage = 15;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [PURCHASES_KEY, page, perPage],
    queryFn: () => purchaseApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const purchases = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => purchaseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? purchases.filter((p) => {
        const s = search.toLowerCase();
        const idMatch = String(p.id).includes(s);
        const notesMatch = p.notes ? p.notes.toLowerCase().includes(s) : false;
        const itemsMatch = p.items?.some((it) => {
          const matName = typeof it.material?.name === 'object' ? it.material?.name?.ar : it.material_name;
          const recName = typeof it.product_recipe?.name === 'object' ? it.product_recipe?.name?.ar : it.product_recipe_name;
          return (matName && matName.toLowerCase().includes(s)) || (recName && recName.toLowerCase().includes(s));
        });
        return idMatch || notesMatch || itemsMatch;
      })
    : purchases)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Purchase>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'رقم الفاتورة',
      render: (row) => (
        <code className="text-sm font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg font-bold border border-indigo-100 dark:border-indigo-800/40">
          #{row.id}
        </code>
      ),
    },
    {
      header: 'الإيصال',
      render: (row) => {
        const url = row.receipt_url || (typeof row.receipt === 'string' ? row.receipt : null);
        return url ? (
          <button
            onClick={() => setViewTarget(row)}
            className="flex items-center gap-1.5 group p-1 pr-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 transition-colors"
            title="معاينة الإيصال"
          >
            <img
              src={url}
              alt="Receipt"
              className="w-7 h-7 rounded object-cover border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform"
            />
            <span className="text-xs text-primary font-medium">عرض</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <MdImageNotSupported size={14} />
            بدون
          </span>
        );
      },
    },
    {
      header: 'عدد الأصناف',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200">
          {row.items?.length || 0} صنف
        </span>
      ),
    },
    {
      header: 'إجمالي الكمية',
      render: (row) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {Number(row.total_quantity || row.quantity || 0).toLocaleString('ar-EG')}
        </span>
      ),
    },
    {
      header: 'إجمالي التكلفة',
      render: (row) => (
        <span className="font-black text-emerald-600 dark:text-emerald-400">
          {Number(row.total_cost || row.cost || 0).toLocaleString('ar-EG')} ج.م
        </span>
      ),
    },
    {
      header: 'الملاحظات',
      render: (row) => (
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={row.notes || ''}>
          {row.notes || '—'}
        </p>
      ),
    },
    {
      header: 'تاريخ الفاتورة',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {row.created_at ? new Date(row.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' }) : '—'}
        </span>
      ),
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewTarget(row)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
            title="عرض التفاصيل"
          >
            <MdVisibility size={16} />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 transition-all shadow-sm border border-rose-100 dark:border-rose-800/50"
            title="حذف"
          >
            <MdDelete size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 flex flex-col h-full">
      <CrudHeader
        title="إدارة المشتريات"
        icon={<MdShoppingBag size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث برقم الفاتورة أو اسم الصنف أو الملاحظات..."
        onRefresh={() => refetch()}
        addLink="/dashboard/purchases/add"
        addText="فاتورة مشتريات جديدة"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdReceipt size={48} />}
          emptyText="لا توجد فواتير مشتريات مسجلة"
        />
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={`فاتورة المشتريات #${deleteTarget?.id}`}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف"
      />

      {/* Details Modal */}
      <PurchaseDetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        purchase={viewTarget}
      />
    </div>
  );
};

export default PurchaseList;
