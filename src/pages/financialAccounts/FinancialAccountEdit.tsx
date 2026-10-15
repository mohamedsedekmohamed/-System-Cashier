import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  financialAccountApi,
  FINANCIAL_ACCOUNTS_KEY,
  FINANCIAL_ACCOUNTS_SELECT_OPTIONS_KEY,
} from '../../services/financialAccountService';
import type { FinancialAccountFormData } from '../../types';
import SingleImageUpload from '../../components/ui/SingleImageUpload';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { renderName } from '../../utils/helpers';
import {
  MdArrowForward,
  MdSave,
  MdAccountBalance,
  MdInfoOutline,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const FinancialAccountEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<FinancialAccountFormData>({
    name: { ar: '', en: '' },
    icon: null,
    balance: 0,
    status: true,
    branch_id: null,
  });

  // ── Fetch Existing Financial Account ───
  const {
    data: accountData,
    isLoading: isLoadingAccount,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [FINANCIAL_ACCOUNTS_KEY, id],
    queryFn: () => financialAccountApi.get(id as string),
    enabled: !!id,
  });

  // ── Fetch Select Options (Branches) ────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [FINANCIAL_ACCOUNTS_SELECT_OPTIONS_KEY],
    queryFn: financialAccountApi.getSelectOptions,
  });

  const account = accountData?.data;
  const branchOptions = optionsData?.data?.branches ?? [];

  // Populate form
  useEffect(() => {
    if (account) {
      setFormData({
        name: {
          ar: renderName(account.name, 'ar') || '',
          en: renderName(account.name, 'en') || '',
        },
        icon: account.icon || null,
        balance: Number(account.balance || 0),
        status: account.status,
        branch_id: account.branch_id || null,
      });
    }
  }, [account]);

  // ── Update Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: (payload: FinancialAccountFormData) =>
      financialAccountApi.update(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FINANCIAL_ACCOUNTS_KEY] });
      navigate('/dashboard/financial-accounts');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' - ')
          : 'حدث خطأ أثناء تعديل بيانات الحساب المالي');
      setFormError(msg);
    },
  });

  // ── Handlers ───────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name.startsWith('name.')) {
      const lang = name.split('.')[1] as 'ar' | 'en';
      setFormData((prev) => ({
        ...prev,
        name: { ...prev.name, [lang]: value },
      }));
    } else if (name === 'balance') {
      const num = parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        balance: isNaN(num) ? 0 : Math.max(0, num),
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.ar.trim()) {
      setFormError('يرجى إدخال اسم الحساب بالعربية');
      return;
    }
    if (!formData.name.en.trim()) {
      setFormError('يرجى إدخال اسم الحساب بالإنجليزية');
      return;
    }
    if (formData.balance < 0) {
      setFormError('الرصيد يجب أن يكون صفر أو أكثر');
      return;
    }

    mutation.mutate(formData);
  };

  if (isLoadingAccount) return <LoadingSpinner />;
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/financial-accounts"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdAccountBalance size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                تعديل الحساب المالي #{id}
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              تحديث الاسم، الرصيد، الشعار أو ربط الحساب بفرع
            </p>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          <MdInfoOutline size={18} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name AR */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم الحساب (عربي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name.ar"
                required
                maxLength={255}
                value={formData.name.ar}
                onChange={handleChange}
                placeholder="مثال: الخزينة الرئيسية، بنك مصر..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              />
            </div>

            {/* Name EN */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم الحساب (إنجليزي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name.en"
                required
                maxLength={255}
                value={formData.name.en}
                onChange={handleChange}
                placeholder="e.g. Main Vault, CIB Account..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branch */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الفرع التابع له
              </label>
              <SearchableSelect
                value={formData.branch_id}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    branch_id: val ? Number(val) : null,
                  }))
                }
                options={branchOptions}
                labelExtractor={(b) => renderName(b.name || b)}
                placeholder="اختر الفرع (أو اتركه عاماً لكافة الفروع)..."
                isClearable
                disabled={isLoadingOptions}
              />
              <p className="text-xs text-slate-400 mt-1">
                اتركه فارغاً إذا كان هذا الحساب مشتركاً أو مركزياً لجميع الفروع
              </p>
            </div>

            {/* Balance */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الرصيد الحالي (ج.م) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="balance"
                min="0"
                step="any"
                required
                value={formData.balance}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-mono"
              />
            </div>
          </div>

          {/* Account Icon Upload */}
          <div>
            <SingleImageUpload
              value={formData.icon}
              onChange={(file) => setFormData((prev) => ({ ...prev, icon: file }))}
              label="أيقونة أو شعار الحساب"
              hint="يمكنك الإبقاء على الشعار الحالي أو اختيار شعار جديد (PNG, SVG, JPG - الحد الأقصى 4MB)"
              maxSizeMB={4}
            />
          </div>

          {/* Status */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="status"
                checked={formData.status}
                onChange={handleChange}
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/50"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                تفعيل الحساب (نشط ومتاح للمعاملات المالية)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Link
              to="/dashboard/financial-accounts"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 text-sm"
            >
              {mutation.isPending ? (
                <>
                  <AiOutlineLoading3Quarters className="animate-spin" size={16} />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <MdSave size={18} />
                  <span>تحديث الحساب</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FinancialAccountEdit;
