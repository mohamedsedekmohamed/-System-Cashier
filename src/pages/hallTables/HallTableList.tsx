import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hallTableApi, HALL_TABLES_KEY } from '../../services/hallTableService';
import type { HallTable } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { 
  MdTableRestaurant, 
  MdEdit, 
  MdDelete, 
  MdVisibility, 
  MdQrCode2, 
  MdZoomIn, 
  MdOpenInNew, 
  MdDownload,
  MdPrint,
  MdClose,
} from 'react-icons/md';
import { renderName } from '../../utils/helpers';

const HallTableList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<HallTable | null>(null);
  const [viewTarget, setViewTarget] = useState<HallTable | null>(null);
  const [qrPreviewTarget, setQrPreviewTarget] = useState<HallTable | null>(null);
  const perPage = 10;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [HALL_TABLES_KEY, page, perPage],
    queryFn: () => hallTableApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const tables = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => hallTableApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HALL_TABLES_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Toggle Status mutation ─────────────
  const toggleStatusMutation = useMutation({
    mutationFn: (table: HallTable) => {
      const payload = {
        name: table.name,
        branch_id: table.branch_id,
        hall_id: table.hall_id,
        status: !table.status,
      };
      return hallTableApi.update(table.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HALL_TABLES_KEY] });
    },
  });

  // ── Download & Print QR ────────────────
  const handleDownloadQr = async (url: string, tableName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `table-${tableName}-qr.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handlePrintQr = (url: string, tableName: string) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html dir="rtl">
        <head>
          <title>رمز QR - ${tableName}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              font-family: system-ui, -apple-system, sans-serif;
            }
            .card {
              border: 2px solid #e2e8f0;
              border-radius: 16px;
              padding: 24px;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            h2 { margin: 0 0 12px 0; color: #1e293b; }
            img { width: 280px; height: 280px; object-fit: contain; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>طاولة: ${tableName}</h2>
            <img src="${url}" onload="window.print(); window.close();" />
          </div>
        </body>
      </html>
    `);
    win.document.close();
  };

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? tables.filter(t =>
        renderName(t.name).toLowerCase().includes(search.toLowerCase()) ||
        String(t.id).includes(search) ||
        renderName(t.branch?.name).toLowerCase().includes(search.toLowerCase()) ||
        t.hall?.name?.ar?.toLowerCase().includes(search.toLowerCase()) ||
        t.hall?.name?.en?.toLowerCase().includes(search.toLowerCase()))
    : tables)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<HallTable>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      )
    },
    {
      header: 'اسم الطاولة',
      render: (row) => <p className="font-semibold text-slate-800 dark:text-white">{typeof row.name === 'object' && row.name !== null ? ((row.name as any)?.ar || (row.name as any)?.en || '') : (row.name || '')}</p>
    },
    {
      header: 'رمز الـ QR',
      render: (row) => {
        if (!row.qr) {
          return (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
              <MdQrCode2 size={16} className="text-slate-300 dark:text-slate-600" />
              لا يوجد
            </span>
          );
        }

        const tableName = typeof row.name === 'object' && row.name !== null 
          ? ((row.name as any)?.ar || (row.name as any)?.en || '') 
          : (row.name || '');

        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQrPreviewTarget(row)}
              className="group relative block p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer"
              title="انقر لتكبير رمز الـ QR"
            >
              <img
                src={row.qr}
                alt={`QR ${tableName}`}
                className="w-10 h-10 object-contain rounded-lg transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 dark:group-hover:bg-white/10 transition-colors flex items-center justify-center">
                <MdZoomIn size={18} className="text-white drop-shadow opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </button>
            <a
              href={row.qr}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="فتح الرابط في صفحة جديدة"
            >
              <MdOpenInNew size={15} />
            </a>
          </div>
        );
      }
    },
    {
      header: 'الفرع',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          {renderName(row.branch?.name) || 'غير محدد'}
        </span>
      )
    },
    {
      header: 'الصالة',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {row.hall?.name?.ar || 'غير محدد'}
        </span>
      )
    },
    {
      header: 'الحالة',
      render: (row) => (
        <button 
          onClick={() => toggleStatusMutation.mutate(row)}
          disabled={toggleStatusMutation.isPending}
          className="hover:opacity-80 transition-opacity disabled:opacity-50"
          title="تغيير الحالة"
        >
          <StatusBadge active={row.status} />
        </button>
      )
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setViewTarget(row)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50" title="عرض التفاصيل">
            <MdVisibility size={16} />
          </button>
          <Link to={`/dashboard/hall-tables/edit/${row.id}`}
            className="p-2 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 hover:text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 transition-all shadow-sm border border-amber-100 dark:border-amber-800/50" title="تعديل">
            <MdEdit size={16} />
          </Link>
          <button onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 transition-all shadow-sm border border-rose-100 dark:border-rose-800/50" title="حذف">
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
        title="إدارة طاولات الصالة"
        icon={<MdTableRestaurant size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم الطاولة، الفرع، أو الصالة..."
        onRefresh={() => refetch()}
        addLink="/dashboard/hall-tables/add"
        addText="إضافة طاولة جديدة"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdTableRestaurant size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف الطاولة"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل الطاولة"
        details={[
          { label: 'الرقم التعريفي', value: viewTarget?.id },
          { label: 'اسم الطاولة', value: viewTarget?.name },
          { label: 'الفرع', value: renderName(viewTarget?.branch?.name) || '—' },
          { label: 'الصالة', value: viewTarget?.hall?.name?.ar || '—' },
          { label: 'الحالة', value: viewTarget ? <StatusBadge active={viewTarget.status} /> : null },
          { 
            label: 'رمز الـ QR', 
            value: viewTarget?.qr ? (
              <div className="flex items-center gap-3">
                <img 
                  src={viewTarget.qr} 
                  alt={`QR ${viewTarget.name}`} 
                  className="w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-1 shadow-sm object-contain"
                />
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const t = viewTarget;
                      setViewTarget(null);
                      setQrPreviewTarget(t);
                    }}
                    className="text-xs text-primary hover:underline font-semibold block"
                  >
                    عرض وتكبير الرمز
                  </button>
                  <a
                    href={viewTarget.qr}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary flex items-center gap-1"
                  >
                    فتح الرابط المباشر <MdOpenInNew size={12} />
                  </a>
                </div>
              </div>
            ) : 'غير متوفر',
            fullWidth: true
          },
          { label: 'تاريخ الإنشاء', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '' },
          { label: 'تاريخ آخر تحديث', value: viewTarget?.updated_at ? new Date(viewTarget.updated_at).toLocaleString('ar-EG') : '' }
        ]}
      />

      {/* QR Code Preview & Download Modal */}
      {qrPreviewTarget && qrPreviewTarget.qr && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setQrPreviewTarget(null)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 p-6 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-primary">
                <MdQrCode2 size={22} />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                  رمز QR للطاولة
                </h3>
              </div>
              <button
                onClick={() => setQrPreviewTarget(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="إغلاق"
              >
                <MdClose size={20} />
              </button>
            </div>

            {/* Table title info */}
            <div className="mb-4">
              <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                {typeof qrPreviewTarget.name === 'object' && qrPreviewTarget.name !== null
                  ? ((qrPreviewTarget.name as any)?.ar || (qrPreviewTarget.name as any)?.en || '')
                  : qrPreviewTarget.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {qrPreviewTarget.hall?.name?.ar ? `${qrPreviewTarget.hall.name.ar} • ` : ''}
                {renderName(qrPreviewTarget.branch?.name) || 'فرع غير محدد'}
              </p>
            </div>

            {/* QR Image */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-inner mb-6">
              <img
                src={qrPreviewTarget.qr}
                alt="QR Code"
                className="w-56 h-56 object-contain"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                type="button"
                onClick={() => handleDownloadQr(qrPreviewTarget.qr!, String(qrPreviewTarget.name))}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-semibold shadow-md hover:shadow-lg hover:bg-primary-dark transition-all"
                title="تحميل رمز الـ QR"
              >
                <MdDownload size={16} /> تحميل
              </button>
              <button
                type="button"
                onClick={() => handlePrintQr(qrPreviewTarget.qr!, String(qrPreviewTarget.name))}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                title="طباعة رمز الـ QR"
              >
                <MdPrint size={16} /> طباعة
              </button>
              <a
                href={qrPreviewTarget.qr}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                title="فتح الرابط في علامة تبويب جديدة"
              >
                <MdOpenInNew size={16} /> فتح
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallTableList;
