import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  captainOrderApi,
  CAPTAIN_ORDERS_KEY,
} from '../../services/captainOrderService';
import type { CaptainOrder } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { CopyButton } from '../../components/ui/CopyButton';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { renderName } from '../../utils/helpers';
import {
  MdSportsMotorsports,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdCheckCircle,
  MdCancel,
  MdImage,
  MdOpenInNew,
  MdClose,
  MdFilterList,
} from 'react-icons/md';

const CaptainOrderList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '1' | '0'>('all');
  const [deleteTarget, setDeleteTarget] = useState<CaptainOrder | null>(null);
  const [viewTarget, setViewTarget] = useState<CaptainOrder | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const perPage = 15;

  // ── Fetch (with query params) ───────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [CAPTAIN_ORDERS_KEY, page, perPage, search, statusFilter],
    queryFn: () =>
      captainOrderApi.list({
        page,
        per_page: perPage,
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter === '1' ? 1 : 0,
      }),
    placeholderData: (prev) => prev,
  });

  const captains = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => captainOrderApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CAPTAIN_ORDERS_KEY] });
      setDeleteTarget(null);
    },
  });

  // Calculate quick stats from current data
  const stats = useMemo(() => {
    const total = meta?.total ?? captains.length;
    const active = captains.filter((c) => Boolean(c.status)).length;
    const inactive = captains.filter((c) => !c.status).length;
    const totalImages = captains.reduce((acc, c) => acc + (c.images?.length || 0), 0);
    return { total, active, inactive, totalImages };
  }, [captains, meta]);

  // ── Columns Definition ─────────────────
  const columns: ColumnDef<CaptainOrder>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md font-semibold">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'الكابتن',
      render: (row) => {
        const hasImages = row.images && row.images.length > 0;
        const firstImage = hasImages ? row.images[0] : null;

        return (
          <div className="flex items-center gap-3">
            <div
              onClick={() => firstImage && setLightboxImage(firstImage)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden border shadow-sm transition-transform ${
                firstImage
                  ? 'border-primary/30 cursor-pointer hover:scale-105 bg-slate-100 dark:bg-slate-800'
                  : 'border-slate-200 dark:border-slate-700 bg-primary/10 text-primary'
              }`}
            >
              {firstImage ? (
                <img
                  src={firstImage}
                  alt={renderName(row.name)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <MdSportsMotorsports size={24} className="text-primary" />
              )}
            </div>

            <div>
              <p className="font-bold text-slate-800 dark:text-white leading-tight">
                {renderName(row.name)}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-400 font-mono">@{row.user_name}</span>
                <CopyButton text={row.user_name} />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'الحالة',
      render: (row) => (
        <StatusBadge
          active={Boolean(row.status)}
          activeText="نشط"
          inactiveText="غير نشط"
        />
      ),
    },
    {
      header: 'الصور والمستندات',
      render: (row) => {
        const count = row.images?.length || 0;
        if (count === 0) {
          return <span className="text-xs text-slate-400">لا توجد صور</span>;
        }

        return (
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-2 space-x-reverse overflow-hidden">
              {row.images.slice(0, 3).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt="مستند"
                  onClick={() => setLightboxImage(img)}
                  className="inline-block w-7 h-7 rounded-lg ring-2 ring-white dark:ring-slate-800 object-cover cursor-pointer hover:scale-110 transition-transform shadow-xs"
                />
              ))}
            </div>
            {count > 3 && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                +{count - 3}
              </span>
            )}
            <span className="text-xs text-slate-500 mr-1">
              ({count} {count === 1 ? 'ملف' : 'ملفات'})
            </span>
          </div>
        );
      },
    },
    {
      header: 'تاريخ الإنشاء',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {row.created_at ? new Date(row.created_at).toLocaleDateString('ar-EG') : '—'}
        </span>
      ),
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewTarget(row)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 transition-all shadow-xs border border-indigo-100 dark:border-indigo-800/50"
            title="عرض التفاصيل الكاملة"
          >
            <MdVisibility size={16} />
          </button>
          <Link
            to={`/dashboard/captain-orders/edit/${row.id}`}
            className="p-2 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 hover:text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 transition-all shadow-xs border border-amber-100 dark:border-amber-800/50"
            title="تعديل بيانات الكابتن"
          >
            <MdEdit size={16} />
          </Link>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 transition-all shadow-xs border border-rose-100 dark:border-rose-800/50"
            title="حذف الكابتن نهائياً"
          >
            <MdDelete size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Top Header */}
      <CrudHeader
        title="كباتن الطلبات"
        subtitle="إدارة وتعيين كباتن توصيل الطلبات، بيانات الدخول، ورفع وتحديث المستندات"
        icon={<MdSportsMotorsports size={30} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="ابحث باسم الكابتن أو اسم المستخدم (@username)..."
        onRefresh={() => refetch()}
        addLink="/dashboard/captain-orders/add"
        addText="إضافة كابتن جديد"
      />

      {/* Filter Tabs & Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">إجمالي الكباتن</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
              {stats.total}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <MdSportsMotorsports size={24} />
          </div>
        </div>

        {/* Active */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === '1' ? 'all' : '1');
            setPage(1);
          }}
          className={`cursor-pointer transition-all bg-white dark:bg-slate-800 rounded-2xl p-4 border shadow-xs flex items-center justify-between ${
            statusFilter === '1'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-100 dark:border-slate-700/60 hover:border-emerald-200'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">الكباتن النشطين</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
              {stats.active}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 flex items-center justify-center">
            <MdCheckCircle size={24} />
          </div>
        </div>

        {/* Inactive */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === '0' ? 'all' : '0');
            setPage(1);
          }}
          className={`cursor-pointer transition-all bg-white dark:bg-slate-800 rounded-2xl p-4 border shadow-xs flex items-center justify-between ${
            statusFilter === '0'
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-slate-100 dark:border-slate-700/60 hover:border-rose-200'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">غير النشطين</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
              {stats.inactive}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 flex items-center justify-center">
            <MdCancel size={24} />
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">إجمالي المستندات</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
              {stats.totalImages}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 flex items-center justify-center">
            <MdImage size={24} />
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 ml-2">
          <MdFilterList size={16} /> تصفية الحالة:
        </span>
        <button
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          الكل
        </button>
        <button
          onClick={() => {
            setStatusFilter('1');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === '1'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          النشطين فقط
        </button>
        <button
          onClick={() => {
            setStatusFilter('0');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === '0'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          غير النشطين
        </button>
      </div>

      {/* Data Table */}
      <div className="flex-1">
        <DataTable
          data={captains}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdSportsMotorsports size={52} />}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={renderName(deleteTarget?.name)}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف كابتن الطلبات"
      />

      {/* Details View Modal */}
      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل كابتن الطلبات"
        details={[
          { label: 'الرقم التعريفي (ID)', value: viewTarget?.id },
          { label: 'اسم الكابتن', value: renderName(viewTarget?.name) },
          { label: 'اسم المستخدم للولوج', value: `@${viewTarget?.user_name}` },
          {
            label: 'الحالة',
            value: (
              <StatusBadge
                active={Boolean(viewTarget?.status)}
                activeText="نشط"
                inactiveText="غير نشط"
              />
            ),
          },
          {
            label: 'تاريخ التسجيل',
            value: viewTarget?.created_at
              ? new Date(viewTarget.created_at).toLocaleString('ar-EG')
              : '—',
          },
          {
            label: 'تاريخ آخر تحديث',
            value: viewTarget?.updated_at
              ? new Date(viewTarget.updated_at).toLocaleString('ar-EG')
              : '—',
          },
          {
            label: `صور ومستندات الكابتن (${viewTarget?.images?.length || 0})`,
            value: viewTarget?.images?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {viewTarget.images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setLightboxImage(img)}
                    className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:shadow-md transition-all"
                  >
                    <img
                      src={img}
                      alt={`مستند ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                      <MdVisibility size={16} /> تكبير
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              'لا توجد صور مرفوعة'
            ),
            fullWidth: true,
          },
        ]}
      />

      {/* Image Lightbox Viewer */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between pb-3 text-white px-2">
              <span className="text-sm font-medium">معاينة صورة المستند</span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="فتح في علامة تبويب جديدة"
                >
                  <MdOpenInNew size={20} />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="إغلاق"
                >
                  <MdClose size={20} />
                </button>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl bg-black/50 border border-white/10">
              <img
                src={lightboxImage}
                alt="معاينة"
                className="max-h-[80vh] max-w-full object-contain rounded-xl select-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainOrderList;
