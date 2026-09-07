import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi, DELIVERIES_KEY } from '../../services/deliveryService';
import type { Delivery } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { CopyButton } from '../../components/ui/CopyButton';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { MdDeliveryDining, MdEdit, MdDelete, MdVisibility } from 'react-icons/md';

const DeliveryList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Delivery | null>(null);
  const [viewTarget, setViewTarget] = useState<Delivery | null>(null);
  const perPage = 10;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [DELIVERIES_KEY, page, perPage],
    queryFn: () => deliveryApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const deliveries = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deliveryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DELIVERIES_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Client-side search filter ──────────
  const filtered = search
    ? deliveries.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        String(d.id).includes(search) ||
        d.phone.includes(search) ||
        d.branch?.name.toLowerCase().includes(search.toLowerCase()))
    : deliveries;

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Delivery>[] = [
    {
      header: '#',
      render: (row) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {row.id}
        </code>
      )
    },
    {
      header: 'اسم الطيار',
      render: (row) => <p className="font-semibold text-slate-800 dark:text-white">{row.name}</p>
    },
    {
      header: 'رقم الهاتف',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-600 dark:text-slate-300">{row.phone || '—'}</span>
          {row.phone && <CopyButton text={row.phone} />}
        </div>
      )
    },
    {
      header: 'الفرع',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          {row.branch?.name || 'غير محدد'}
        </span>
      )
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewTarget(row)}
            className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200" title="عرض التفاصيل">
            <MdVisibility size={16} />
          </button>
          <Link to={`/deliveries/edit/${row.id}`}
            className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all duration-200" title="تعديل">
            <MdEdit size={16} />
          </Link>
          <button onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200" title="حذف">
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
        title="إدارة التوصيل (الطيارين)"
        icon={<MdDeliveryDining size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم الطيار، رقم الهاتف، أو الفرع..."
        onRefresh={() => refetch()}
        addLink="/deliveries/add"
        addText="إضافة طيار جديد"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdDeliveryDining size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف الطيار"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل الطيار"
        details={[
          { label: 'الرقم التعريفي', value: viewTarget?.id },
          { label: 'اسم الطيار', value: viewTarget?.name },
          { label: 'رقم الهاتف', value: viewTarget?.phone },
          { label: 'الفرع', value: viewTarget?.branch?.name || '—' },
          { label: 'تاريخ الإنشاء', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '' },
          { label: 'تاريخ آخر تحديث', value: viewTarget?.updated_at ? new Date(viewTarget.updated_at).toLocaleString('ar-EG') : '' },
          { 
            label: 'صور الهوية', 
            value: viewTarget?.id_images?.length ? (
              <div className="flex gap-2 flex-wrap mt-2">
                {viewTarget.id_images.map((img, i) => (
                  <img key={i} src={img} alt="ID" className="w-20 h-20 object-cover rounded-md border border-slate-200" />
                ))}
              </div>
            ) : 'لا توجد صور',
            fullWidth: true
          }
        ]}
      />
    </div>
  );
};

export default DeliveryList;
