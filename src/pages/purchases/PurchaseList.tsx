import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseApi, PURCHASES_KEY, PURCHASES_SELECT_OPTIONS_KEY } from '../../services/purchaseService';
import { MATERIALS_KEY } from '../../services/materialService';
import { PRODUCT_RECIPES_KEY } from '../../services/productRecipeService';
import { SUPPLIERS_KEY } from '../../services/supplierService';
import { MATERIAL_INVENTORY_KEY } from '../../services/materialInventoryService';
import { ADDON_INVENTORY_KEY } from '../../services/addonInventoryService';
import type { Purchase } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { PurchaseDetailsModal } from '../../components/purchases/PurchaseDetailsModal';
import { MdShoppingBag, MdDelete, MdVisibility, MdReceipt, MdImageNotSupported } from 'react-icons/md';
import { renderName } from '../../utils/helpers';

export const PurchaseList: React.FC = () => {
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
      queryClient.invalidateQueries({ queryKey: [PURCHASES_SELECT_OPTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [MATERIALS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCT_RECIPES_KEY] });
      queryClient.invalidateQueries({ queryKey: ['addons'] });
      queryClient.invalidateQueries({ queryKey: [ADDON_INVENTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [MATERIAL_INVENTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['recipe_inventory'] });
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
          const matName = renderName(it.material?.name) || it.material_name;
          const recName = renderName(it.product_recipe?.name) || it.product_recipe_name;
          const addonName = renderName(it.addon?.name) || it.addon_name;
          return (
            (matName && matName.toLowerCase().includes(s)) ||
            (recName && recName.toLowerCase().includes(s)) ||
            (addonName && addonName.toLowerCase().includes(s))
          );
        });
        const suppName = renderName(p.supplier?.name);
        const suppMatch = suppName ? suppName.toLowerCase().includes(s) : false;
        return idMatch || notesMatch || itemsMatch || suppMatch;
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
            className="flex items-center gap-1.5 group p-1 pr-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 transition-colors cursor-pointer"
            title="معاينة الإيصال"
          >
            <img
              src={url}
              alt="Receipt"
              className="w-7 h-7 rounded object-cover border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform"
            />
            <span className="text-xs text-primary font-medium flex items-center gap-0.5">
              <MdReceipt size={14} /> عرض
            </span>
          </button>
        ) : (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <MdImageNotSupported size={14} /> لا يوجد
          </span>
        );
      },
    },
    {
      header: 'المورد',
      render: (row) => (
        <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
          {renderName(row.supplier?.name) || '—'}
        </span>
      ),
    },
    {
      header: 'الفرع المستلم',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {renderName(row.branch?.name) || 'الفرع الرئيسي'}
        </span>
      ),
    },
    {
      header: 'عدد الأصناف',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {row.items?.length || 0} صنف
        </span>
      ),
    },
    {
      header: 'إجمالي التكلفة',
      render: (row) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
          {Number(row.total_cost || row.cost || 0).toLocaleString('ar-EG')} ج.م
        </span>
      ),
    },
    {
      header: 'المدفوع',
      render: (row) => (
        <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono text-xs">
          {Number(row.paid_amount || 0).toLocaleString('ar-EG')} ج.م
        </span>
      ),
    },
    {
      header: 'تاريخ الإنشاء',
      render: (row) => (
        <span className="text-xs text-slate-500 font-mono" dir="ltr">
          {row.created_at ? new Date(row.created_at).toLocaleDateString('ar-EG') : '—'}
        </span>
      ),
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setViewTarget(row)}
            className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
            title="عرض التفاصيل"
          >
            <MdVisibility size={18} />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
            title="حذف الفاتورة"
          >
            <MdDelete size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <CrudHeader
        title="فواتير المشتريات"
        subtitle="إدارة ومتابعة فواتير شراء المواد الخام والوصفات والإضافات وتحديث أرصدة المخزون"
        icon={<MdShoppingBag size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={(val: string) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="ابحث برقم الفاتورة، اسم المورد..."
        onRefresh={() => refetch()}
        addLink="/dashboard/purchases/add"
        addText="تسجيل فاتورة شراء جديدة"
      />

      {/* Main Table */}
      {isError ? (
        <ErrorFallback error={error} onRetry={refetch} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !purchases.length}
          emptyIcon={<MdShoppingBag size={48} className="text-slate-300 dark:text-slate-600" />}
          emptyText="لا توجد فواتير مشتريات مسجلة."
        />
      )}

      {/* Details Modal */}
      <PurchaseDetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        purchase={viewTarget}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        title="حذف فاتورة المشتريات"
        message={`هل أنت متأكد من حذف فاتورة المشتريات رقم #${deleteTarget?.id}؟ سيتم استرجاع وخصم كميات الأصناف المشتراة من رصيد مخزون الفرع تلقائياً.`}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default PurchaseList;
