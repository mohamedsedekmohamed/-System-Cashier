import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addonInventoryApi,
  ADDON_INVENTORY_PENDING_KEY,
  ADDON_INVENTORY_HISTORY_KEY,
  ADDON_INVENTORY_OPTIONS_KEY,
} from '../../services/addonInventoryService';
import type { AddonInventoryListItem, BranchOption } from '../../types';
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
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { renderName } from '../../utils/helpers';

export const AddonInventoryList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating a new addon inventory
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
    queryKey: [ADDON_INVENTORY_PENDING_KEY, page, perPage],
    queryFn: () => addonInventoryApi.getPending(page, perPage),
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
    queryKey: [ADDON_INVENTORY_HISTORY_KEY, page, perPage],
    queryFn: () => addonInventoryApi.getHistory(page, perPage),
    enabled: activeTab === 'history',
    placeholderData: (prev) => prev,
  });

  // ── Fetch Select Options (Branches & Units) ────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [ADDON_INVENTORY_OPTIONS_KEY],
    queryFn: addonInventoryApi.getSelectOptions,
  });

  const branches: BranchOption[] = optionsData?.data?.branches ?? [];

  // ── Create Mutation ────────────────────────
  const createMutation = useMutation({
    mutationFn: addonInventoryApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [ADDON_INVENTORY_PENDING_KEY] });
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', branch_id: 0 });
      setCreateError(null);

      const newId = res?.data?.id || res?.id;
      if (newId) {
        navigate(`/dashboard/addon-inventory/${newId}`);
      } else {
        refetchPending();
      }
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        'تعذر إنشاء جلسة جرد الإضافات، يرجى التأكد من البيانات والمحاولة مجدداً.';
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

  // Filtered by search
  const filteredData = currentList.filter((item: AddonInventoryListItem) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const nameMatch = item.name?.toLowerCase().includes(s);
    const branchMatch = renderName(item.branch_name)?.toLowerCase().includes(s);
    const idMatch = String(item.id).includes(s);
    return nameMatch || branchMatch || idMatch;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setCreateError('يرجى إدخال اسم أو عنوان جلسة الجرد.');
      return;
    }
    if (!createForm.branch_id || createForm.branch_id <= 0) {
      setCreateError('يرجى اختيار الفرع المراد جرده.');
      return;
    }
    setCreateError(null);
    createMutation.mutate({
      name: createForm.name.trim(),
      branch_id: Number(createForm.branch_id),
    });
  };

  // ── Columns ────────────────────────────────
  const columns: ColumnDef<AddonInventoryListItem>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-primary px-2 py-0.5 rounded-md font-bold">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'معرف الجلسة',
      render: (row) => (
        <code className="text-sm font-mono bg-primary/5 text-primary px-2.5 py-1 rounded-lg font-bold border border-primary/20">
          #{row.id}
        </code>
      ),
    },
    {
      header: 'اسم / وصف الجرد',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
            <MdFactCheck size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {row.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <MdCalendarToday size={12} />
              {row.date || (row.created_at ? new Date(row.created_at).toLocaleDateString('ar-EG') : '—')}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'الفرع المستهدف',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <MdStorefront size={16} className="text-slate-400" />
          <span>{renderName(row.branch_name) || `فرع #${row.branch_id}`}</span>
        </div>
      ),
    },
    {
      header: 'الحالة',
      render: (row) => {
        const s = (row.status || '').toLowerCase();
        if (s === 'pending' || s === '0') {
          return (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
              <MdAccessTime size={14} />
              معلق (قيد المراجعة)
            </span>
          );
        }
        if (s === 'approve' || s === 'approved' || s === '1') {
          return (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              <MdCheckCircle size={14} />
              معتمد ومُحدث للمخزن
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
            <MdCancel size={14} />
            مرفوض
          </span>
        );
      },
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center justify-end">
          <Link
            to={`/dashboard/addon-inventory/${row.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-all shadow-2xs"
          >
            <span>{row.status === 'pending' ? 'إدخال ومراجعة الجرد' : 'عرض التفاصيل'}</span>
            <MdArrowForward size={14} />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <MdFactCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              جرد مخزون الإضافات (Addon Inventory)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              مطابقة الأرصدة الفعلية للإضافات بالفرع، رصد العجز، وتعديل المخزون مع التحويل التلقائي للوحدات
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateError(null);
            setCreateForm({
              name: `جرد إضافات - ${new Date().toLocaleDateString('ar-EG')}`,
              branch_id: branches.length > 0 ? branches[0].id : 0,
            });
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm shadow-md shadow-primary/20 transition-all cursor-pointer"
        >
          <MdAdd size={20} />
          <span>بدء جلسة جرد إضافات</span>
        </button>
      </div>

      {/* Tabs Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pending');
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MdPendingActions size={16} />
            <span>الجرد المعلق (قيد الإجراء)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MdHistory size={16} />
            <span>سجل الجرد المكتمل (الأرشيف)</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <MdSearch size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="بحث في الجلسات..."
            className="w-full pr-9 pl-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 ring-primary"
          />
        </div>
      </div>

      {/* Main Table */}
      {isError ? (
        <ErrorFallback error={error} onRetry={refetch} />
      ) : (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-xs overflow-hidden backdrop-blur-sm">
          <DataTable
            columns={columns}
            data={filteredData}
            meta={meta}
            onPageChange={setPage}
            isLoading={isLoading && !currentList.length}
            emptyIcon={<MdFactCheck size={48} className="text-slate-300 dark:text-slate-600" />}
            emptyText={
              activeTab === 'pending'
                ? 'لا توجد جلسات جرد إضافات معلقة حالياً.'
                : 'لا توجد جلسات جرد سابقة في الأرشيف.'
            }
          />
        </div>
      )}

      {/* Create Inventory Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <MdFactCheck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    بدء جلسة جرد إضافات جديدة
                  </h3>
                  <p className="text-xs text-slate-500">
                    أخذ لقطة فورية (Snapshot) لأرصدة جميع الإضافات بالفرع
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <MdClose size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900">
                  {createError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  اسم / عنوان جلسة الجرد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="مثال: جرد إضافات نهاية الأسبوع..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary/40 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  الفرع المراد جرده <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={branches.map((b) => ({
                    value: b.id,
                    label: renderName(b.name) || `فرع #${b.id}`,
                  }))}
                  value={createForm.branch_id || ''}
                  onChange={(val) =>
                    setCreateForm((prev) => ({ ...prev, branch_id: Number(val) }))
                  }
                  placeholder="اختر الفرع..."
                  disabled={isLoadingOptions}
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                ℹ️ عند الضغط على "بدء الجرد"، سيقوم السيستم فوراً برصد الأرصدة الدفترية الحالية لكل الإضافات بالفرع لتقوم بإدخال الأرصدة الفعلية وعدّها بدقة.
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <>
                      <AiOutlineLoading3Quarters size={14} className="animate-spin" />
                      <span>جاري بدء الجرد...</span>
                    </>
                  ) : (
                    <>
                      <MdAdd size={16} />
                      <span>بدء الجرد الآن</span>
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
export default AddonInventoryList;

