import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchApi, BRANCHES_KEY } from '../../services/branchService';
import type { Branch, BranchFormData, BranchLocationPoint } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { CrudHeader } from '../../components/ui/CrudHeader';
import { CopyButton } from '../../components/ui/CopyButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { DetailsModal } from '../../components/ui/DetailsModal';
import { MdStorefront, MdEdit, MdDelete, MdVisibility, MdOpenInNew } from 'react-icons/md';

const BranchList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [viewTarget, setViewTarget] = useState<Branch | null>(null);
  const perPage = 10;

  // ── Fetch (paginated) ──────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [BRANCHES_KEY, page, perPage],
    queryFn: () => branchApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const branches = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete mutation ────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => branchApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BRANCHES_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Toggle Status mutation ─────────────
  const toggleStatusMutation = useMutation({
    mutationFn: (branch: Branch) => {
      let locArray: BranchLocationPoint[] = [];
      if (Array.isArray(branch.location) && branch.location.length > 0) {
        locArray = branch.location.map(p => ({ lat: Number(p.lat) || 0, lng: Number(p.lng) || 0 }));
      } else if (typeof branch.location === 'string') {
        try {
          const parsed = JSON.parse(branch.location);
          if (Array.isArray(parsed) && parsed.length > 0) {
            locArray = parsed.map((p: any) => ({ lat: Number(p.lat) || 0, lng: Number(p.lng) || 0 }));
          }
        } catch {
          // ignore
        }
      }
      if (locArray.length === 0) {
        locArray = [{ lat: 0, lng: 0 }];
      }

      const payload: BranchFormData = {
        name: typeof branch.name === 'object' && branch.name !== null ? ((branch.name as any)?.ar || (branch.name as any)?.en || '') : (branch.name || ''),
        address: branch.address,
        location: locArray,
        watts: branch.watts ? String(branch.watts).replace(/\D/g, '') : '',
        facebook: branch.facebook,
        status: !branch.status,
      };
      return branchApi.update(branch.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BRANCHES_KEY] });
    },
  });

  // ── Client-side search filter ──────────
  const filtered = [...(search
    ? branches.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        String(b.id).includes(search) ||
        b.address.toLowerCase().includes(search.toLowerCase()))
    : branches)].sort((a, b) => b.id - a.id);

  // ── Columns ────────────────────────────
  const columns: ColumnDef<Branch>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      )
    },
    {
      header: 'اسم الفرع',
      render: (row) => <p className="font-semibold text-slate-800 dark:text-white">{typeof row.name === 'object' && row.name !== null ? ((row.name as any)?.ar || (row.name as any)?.en || '') : (row.name || '')}</p>
    },
    {
      header: 'العنوان',
      render: (row) => <span className="text-slate-600 dark:text-slate-300">{row.address || '—'}</span>
    },
    {
      header: 'الهاتف',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-600 dark:text-slate-300">{row.watts || '—'}</span>
          {row.watts && <CopyButton text={row.watts} />}
        </div>
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
          <Link to={`/dashboard/branches/edit/${row.id}`}
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
        title="إدارة الفروع"
        icon={<MdStorefront size={28} />}
        totalCount={meta?.total}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم الفرع، المعرف، أو العنوان..."
        onRefresh={() => refetch()}
        addLink="/dashboard/branches/add"
        addText="إضافة فرع جديد"
      />

      <div className="flex-1">
        <DataTable
          data={filtered}
          columns={columns}
          meta={meta}
          onPageChange={setPage}
          isLoading={isLoading && !data}
          emptyIcon={<MdStorefront size={48} />}
        />
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف الفرع"
      />

      <DetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="تفاصيل الفرع"
        details={[
          { label: 'الرقم التعريفي', value: viewTarget?.id },
          { label: 'اسم الفرع', value: typeof viewTarget?.name === 'object' && viewTarget?.name !== null ? ((viewTarget?.name as any)?.ar || (viewTarget?.name as any)?.en || '') : (viewTarget?.name || '') },
          { label: 'العنوان', value: viewTarget?.address },
          { 
            label: 'الموقع الجغرافي (Location)', 
            value: Array.isArray(viewTarget?.location) && viewTarget.location.length > 0 ? (
              <div className="space-y-1">
                {viewTarget.location.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                      lat: {p.lat}, lng: {p.lng}
                    </span>
                    <a 
                      href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
                    >
                      <MdOpenInNew size={14} />
                      فتح الخريطة
                    </a>
                  </div>
                ))}
              </div>
            ) : typeof viewTarget?.location === 'string' && viewTarget.location ? (
              <a href={viewTarget.location} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">عرض الموقع على الخريطة ↗</a>
            ) : '—' 
          },
          { label: 'رقم الواتساب', value: viewTarget?.watts },
          { label: 'رابط فيسبوك', value: viewTarget?.facebook ? <a href={viewTarget.facebook} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">رابط الصفحة</a> : '—' },
          { label: 'الحالة', value: viewTarget ? <StatusBadge active={viewTarget.status} /> : null },
          { label: 'الدور (Role)', value: viewTarget?.role },
          { label: 'تاريخ الإنشاء', value: viewTarget?.created_at ? new Date(viewTarget.created_at).toLocaleString('ar-EG') : '' }
        ]}
      />
    </div>
  );
};

export default BranchList;
