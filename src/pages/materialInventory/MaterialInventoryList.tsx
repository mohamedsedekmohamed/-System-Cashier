import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  materialInventoryApi,
  MATERIAL_INVENTORY_PENDING_KEY,
  MATERIAL_INVENTORY_HISTORY_KEY,
  MATERIAL_INVENTORY_OPTIONS_KEY,
} from '../../services/materialInventoryService';
import type { MaterialInventoryListItem, BranchOption } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import {
  MdFactCheck,
  MdAdd,
  MdHistory,
  MdPendingActions,
  MdStorefront,
  MdArrowForward,
  MdCalendarToday,
  MdCheckCircle,
  MdCancel,
  MdAccessTime,
  MdClose,
  MdSearch,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const MaterialInventoryList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating a new inventory
  const [createForm, setCreateForm] = useState({
    name: '',
    branch_id: 0,
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const perPage = 15;

  // ── Fetch Pending Audits ──────────────────
  const {
    data: pendingData,
    isLoading: isLoadingPending,
    isError: isErrorPending,
    error: errorPending,
    refetch: refetchPending,
  } = useQuery({
    queryKey: [MATERIAL_INVENTORY_PENDING_KEY, page, perPage],
    queryFn: () => materialInventoryApi.getPending(page, perPage),
    enabled: activeTab === 'pending',
    placeholderData: (prev) => prev,
  });

  // ── Fetch History Audits ──────────────────
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    error: errorHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: [MATERIAL_INVENTORY_HISTORY_KEY, page, perPage],
    queryFn: () => materialInventoryApi.getHistory(page, perPage),
    enabled: activeTab === 'history',
    placeholderData: (prev) => prev,
  });

  // ── Fetch Select Options (Branches) ────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [MATERIAL_INVENTORY_OPTIONS_KEY],
    queryFn: materialInventoryApi.getSelectOptions,
  });

  const branches: BranchOption[] = optionsData?.data?.branches ?? [];

  // ── Create Mutation ────────────────────────
  const createMutation = useMutation({
    mutationFn: materialInventoryApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [MATERIAL_INVENTORY_PENDING_KEY] });
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', branch_id: 0 });
      setCreateError(null);

      // If backend returned created inventory ID, navigate directly into counting view
      const newId = res?.data?.id || res?.id;
      if (newId) {
        navigate(`/dashboard/material-inventory/${newId}`);
      } else {
        refetchPending();
      }
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        'تعذر إنشاء جلسة الجرد، يرجى التأكد من البيانات والمحاولة مجدداً.';
      setCreateError(msg);
    },
  });

  const currentList =
    activeTab === 'pending'
      ? pendingData?.data ?? []
      : historyData?.data ?? [];

  const meta =
    activeTab === 'pending' ? pendingData?.meta : historyData?.meta;

  const isLoading =
    activeTab === 'pending' ? isLoadingPending : isLoadingHistory;
  const isError =
    activeTab === 'pending' ? isErrorPending : isErrorHistory;
  const error =
    activeTab === 'pending' ? errorPending : errorHistory;
  const refetch =
    activeTab === 'pending' ? refetchPending : refetchHistory;

  // ── Client-side search filter ──────────
  const filtered = currentList.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(q) ||
      (item.branch_name || '').toLowerCase().includes(q) ||
      String(item.id).includes(q) ||
      (item.date || '').toLowerCase().includes(q)
    );
  });

  const getBranchLabel = (b: BranchOption) => {
    if (typeof b.name === 'object' && b.name !== null) {
      return b.name.ar || b.name.en || `فرع رقم #${b.id}`;
    }
    return b.name || `فرع رقم #${b.id}`;
  };

  const handleOpenCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setCreateForm({
      name: `جرد الخامات - ${today}`,
      branch_id: branches.length > 0 ? branches[0].id : 0,
    });
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.branch_id) {
      setCreateError('يرجى تحديد الفرع واسم عملية الجرد');
      return;
    }
    createMutation.mutate({
      name: createForm.name.trim(),
      branch_id: createForm.branch_id,
    });
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved' || s === 'approve' || s === 'مكتمل' || s === 'معتمد') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <MdCheckCircle className="text-emerald-500 text-sm" />
          معتمد ومغلق
        </span>
      );
    }
    if (s === 'rejected' || s === 'reject' || s === 'مرفوض') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <MdCancel className="text-rose-500 text-sm" />
          مرفوض
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <MdAccessTime className="text-amber-500 text-sm animate-pulse" />
        قيد الجرد والمراجعة
      </span>
    );
  };

  // ── Columns ────────────────────────────
  const columns: ColumnDef<MaterialInventoryListItem>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2.5 py-1 rounded-md font-bold">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'اسم الجرد',
      render: (row) => (
        <div className="flex flex-col">
          <Link
            to={`/dashboard/material-inventory/${row.id}`}
            className="font-bold text-slate-800 dark:text-white hover:text-primary transition-colors text-sm"
          >
            {row.name || `جرد رقم #${row.id}`}
          </Link>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            رقم العملية: {row.id}
          </span>
        </div>
      ),
    },
    {
      header: 'الفرع',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <MdStorefront size={16} />
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
            {row.branch_name || `فرع #${row.branch_id}`}
          </span>
        </div>
      ),
    },
    {
      header: 'تاريخ الإنشاء',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <MdCalendarToday size={14} className="text-slate-400 shrink-0" />
          <span>{row.date || row.created_at || '—'}</span>
        </div>
      ),
    },
    {
      header: 'الحالة',
      render: (row) => renderStatusBadge(row.status),
    },
    {
      header: 'الإجراءات',
      render: (row) => {
        const isPending =
          activeTab === 'pending' ||
          row.status === 'pending' ||
          !row.status ||
          row.status === 'قيد الجرد والمراجعة';
        return (
          <div className="flex items-center gap-2">
            <Link
              to={`/dashboard/material-inventory/${row.id}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isPending
                  ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/20 hover:shadow-primary/40'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
              }`}
            >
              <span>{isPending ? 'رصد وتدقيق الكميات' : 'عرض تقرير الجرد'}</span>
              <MdArrowForward size={14} className="rtl:rotate-180" />
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-xs">
            <MdFactCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
              جرد المواد الخام
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              إدارة عمليات الجرد المادي والمخزني لخامات الفروع ومطابقة الأرصدة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <MdAdd size={20} />
          <span>بدء جرد جديد</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MdSearch size={20} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث باسم الجرد أو الفرع أو التاريخ..."
          className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-2xs"
        />
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('pending');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-primary text-white shadow-md shadow-primary/25'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <MdPendingActions size={18} />
          <span>الجرد الجاري والمراجعة (Pending)</span>
          {pendingData?.meta?.total !== undefined && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                activeTab === 'pending'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {pendingData.meta.total}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('history');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-primary text-white shadow-md shadow-primary/25'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <MdHistory size={18} />
          <span>الأرشيف وسجل الجرد المعتمد (History)</span>
          {historyData?.meta?.total !== undefined && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                activeTab === 'history'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {historyData.meta.total}
            </span>
          )}
        </button>
      </div>

      {/* Main Table */}
      {isError ? (
        <ErrorFallback error={error as Error} onRetry={refetch} />
      ) : (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-xs overflow-hidden backdrop-blur-sm">
          <DataTable
            data={filtered}
            columns={columns}
            meta={meta}
            onPageChange={setPage}
            isLoading={isLoading && !currentList.length}
            emptyIcon={<MdFactCheck size={48} className="text-slate-300 dark:text-slate-600" />}
            emptyText={
              activeTab === 'pending'
                ? 'لا توجد عمليات جرد جارية حالياً. يمكنك بدء عملية جرد جديدة لأي فرع.'
                : 'لا توجد عمليات جرد معتمدة أو سابقة في سجل الأرشيف.'
            }
          />
        </div>
      )}

      {/* Modal: Start New Inventory Session */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <MdFactCheck size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                    بدء عملية جرد خامات جديدة
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    اختر الفرع لإنشاء جلسة جرد ومطابقة الأرصدة الدفترية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              >
                <MdClose size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              {createError && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium">
                  {createError}
                </div>
              )}

              {/* Branch Selector */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  الفرع المطلوب جرده <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={createForm.branch_id || ''}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        branch_id: Number(e.target.value),
                      }))
                    }
                    disabled={isLoadingOptions || createMutation.isPending}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  >
                    <option value="" disabled>
                      {isLoadingOptions ? 'جاري تحميل الفروع...' : '-- اختر الفرع --'}
                    </option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {getBranchLabel(b)}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  سيتم جلب جميع المواد الخام المسجلة في رصيد هذا الفرع لبدء الجرد.
                </p>
              </div>

              {/* Session Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  اسم أو عنوان جلسة الجرد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="مثال: جرد نهاية شهر أكتوبر - الفرع الرئيسي"
                  disabled={createMutation.isPending}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={createMutation.isPending || !createForm.branch_id || !createForm.name.trim()}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {createMutation.isPending ? (
                    <>
                      <AiOutlineLoading3Quarters className="animate-spin text-base" />
                      <span>جاري الإنشاء...</span>
                    </>
                  ) : (
                    <>
                      <MdAdd size={18} />
                      <span>بدء الجرد وحصر الخامات</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialInventoryList;
