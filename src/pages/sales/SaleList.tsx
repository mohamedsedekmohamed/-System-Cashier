import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saleApi, SALES_KEY } from '../../services/saleService';
import type { Sale } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { SaleDetailsModal } from './SaleDetailsModal';
import {
  MdPointOfSale,
  MdDelete,
  MdVisibility,
  MdImageNotSupported,
} from 'react-icons/md';
import { renderName } from '../../utils/helpers';

const SaleList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [viewTarget, setViewTarget] = useState<Sale | null>(null);
  const perPage = 15;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [SALES_KEY, page, perPage],
    queryFn: () => saleApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const sales = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => saleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? sales.filter((s) => {
        const query = search.toLowerCase();
        const idMatch = String(s.id).includes(query);
        const notesMatch = s.notes ? s.notes.toLowerCase().includes(query) : false;
        const itemsMatch = s.items?.some((it) => {
          const prodName = renderName(it.product?.name) || it.product_name;
          const matName = renderName(it.material?.name) || it.material_name;
          const recName = renderName(it.product_recipe?.name) || it.product_recipe_name;
          return (
            (prodName && prodName.toLowerCase().includes(query)) ||
            (matName && matName.toLowerCase().includes(query)) ||
            (recName && recName.toLowerCase().includes(query))
          );
        });
        const salerName = renderName(s.saler?.name);
        const salerMatch = salerName ? salerName.toLowerCase().includes(query) : false;
        return idMatch || notesMatch || itemsMatch || salerMatch;
      })
    : sales)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Sale>[] = [
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
        <code className="text-sm font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg font-bold border border-emerald-100 dark:border-emerald-800/40">
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
      header: 'الفرع',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
          {renderName(row.branch?.name) || (row.branch_id ? `فرع #${row.branch_id}` : '—')}
        </span>
      ),
    },
    {
      header: 'الموزع / العميل',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
          {renderName(row.saler?.name) || (row.saler_id ? `موزع #${row.saler_id}` : 'عميل نقدي')}
        </span>
      ),
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
      header: 'إجمالي القيمة',
      render: (row) => (
        <span className="font-black text-slate-800 dark:text-white">
          {Number(row.total_cost || 0).toLocaleString('ar-EG')} ج.م
        </span>
      ),
    },
    {
      header: 'المدفوع',
      render: (row) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {Number(row.paid_amount || 0).toLocaleString('ar-EG')} ج.م
        </span>
      ),
    },
    {
      header: 'المتبقي (الآجل)',
      render: (row) => {
        const rem = Number(row.remaining_amount || 0);
        return (
          <span
            className={`font-bold ${
              rem > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {rem > 0 ? `${rem.toLocaleString('ar-EG')} ج.م` : 'مكتمل الدفع'}
          </span>
        );
      },
    },
    {
      header: 'تاريخ الفاتورة',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {row.created_at
            ? new Date(row.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' })
            : '—'}
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
        title="إدارة المبيعات (Sales)"
        icon={<MdPointOfSale size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث برقم الفاتورة، اسم الموزع، أو الصنف..."
        onRefresh={() => refetch()}
        addLink="/dashboard/sales/add"
        addText="تسجيل فاتورة مبيعات جديدة"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdPointOfSale size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={`فاتورة مبيعات #${deleteTarget?.id || ''}`}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف فاتورة المبيعات واسترجاع كميات المخزون وتعديل رصيد الموزع"
      />

      <SaleDetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        sale={viewTarget}
      />
    </div>
  );
};

export default SaleList;
