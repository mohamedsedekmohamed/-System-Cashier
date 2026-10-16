import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  productManufacturingApi, 
  PRODUCT_MANUFACTURING_KEY 
} from '../../services/productManufacturingService';
import type { ProductManufacturing } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { MdSchema, MdVisibility, MdEdit, MdDelete, MdLayers, MdFastfood } from 'react-icons/md';
import { renderName } from '../../utils/helpers';

const ProductManufacturingListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewTarget, setViewTarget] = useState<ProductManufacturing | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductManufacturing | null>(null);
  const perPage = 15;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [PRODUCT_MANUFACTURING_KEY, page, perPage],
    queryFn: () => productManufacturingApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const lists = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => productManufacturingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_MANUFACTURING_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? lists.filter(item => {
        const prodName = renderName(item.product?.name).toLowerCase();
        const recipeName = renderName(item.product_recipe?.name).toLowerCase();
        const s = search.toLowerCase();
        return (
          prodName.includes(s) ||
          recipeName.includes(s) ||
          String(item.id).includes(s)
        );
      })
    : lists)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<ProductManufacturing>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      )
    },
    {
      header: 'النوع المستهدف',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          row.product 
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
        }`}>
          {row.product ? <MdFastfood size={13} /> : <MdLayers size={13} />}
          {row.product ? 'منتج جاهز' : 'منتج غير منتهي التصنيع'}
        </span>
      )
    },
    {
      header: 'اسم المنتج / الصنف المستهدف',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">
            {row.product ? renderName(row.product.name) : renderName(row.product_recipe?.name) || '—'}
          </p>
          <span className="text-xs text-slate-400">
            {row.product ? `كود المنتج: #${row.product.id}` : `كود الصنف: #${row.product_recipe?.id}`}
          </span>
        </div>
      )
    },
    {
      header: 'عدد المواد والمدخلات',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
          {(row.recipes?.length ?? 0)} خامات ومكونات
        </span>
      )
    },
    {
      header: 'تاريخ الإنشاء',
      render: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {row.created_at ? new Date(row.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
        </span>
      )
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setViewTarget(row)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50" 
            title="عرض المعيار والمكونات"
          >
            <MdVisibility size={16} />
          </button>
          <Link 
            to={`/dashboard/product-manufacturings/edit/${row.id}`}
            className="p-2 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 hover:text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 transition-all shadow-sm border border-amber-100 dark:border-amber-800/50" 
            title="تعديل المعيار"
          >
            <MdEdit size={16} />
          </Link>
          <button 
            onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 transition-all shadow-sm border border-rose-100 dark:border-rose-800/50" 
            title="حذف"
          >
            <MdDelete size={16} />
          </button>
        </div>
      )
    }
  ];

  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 flex flex-col h-full">
      <CrudHeader
        title="معايير وتراكيب تصنيع المنتجات"
        icon={<MdSchema size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم المنتج أو الصنف المستهدف..."
        onRefresh={() => refetch()}
        addLink="/dashboard/product-manufacturings/add"
        addText="إضافة معيار تصنيع"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdSchema size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={renderName(deleteTarget?.product?.name) || renderName(deleteTarget?.product_recipe?.name) || 'هذا المعيار'}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف معيار تصنيع"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل معيار تصنيع المنتج القياسي"
        details={[
          { label: 'رقم المعيار', value: viewTarget?.id },
          { label: 'نوع الصنف', value: viewTarget?.product ? 'منتج جاهز للبيع' : 'منتج غير منتهي التصنيع (تحضيري)' },
          { label: 'الاسم', value: renderName(viewTarget?.product?.name) || renderName(viewTarget?.product_recipe?.name) || '—' },
          { label: 'تاريخ التسجيل', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '—' },
          { 
            label: 'المواد الخام والمكونات الداخلة في التصنيع القياسي', 
            value: (
              <div className="mt-2 space-y-2">
                {viewTarget?.recipes?.map((recipe, idx) => (
                  <div key={recipe.id || idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {idx + 1}. {recipe.material ? renderName(recipe.material.name) : renderName(recipe.product_recipe?.name) || '—'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {recipe.material ? 'مادة خام' : 'منتج تحضيري'}
                      </p>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-xs text-slate-400 ml-1">الكمية لكل وحدة:</span>
                      <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{recipe.count}</span>
                    </div>
                  </div>
                ))}
                {(!viewTarget?.recipes || viewTarget.recipes.length === 0) && (
                  <p className="text-sm text-slate-500">لا توجد مكونات مسجلة لهذا المعيار.</p>
                )}
              </div>
            ) 
          }
        ]}
      />
    </div>
  );
};

export default ProductManufacturingListPage;
