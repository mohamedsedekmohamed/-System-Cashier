import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchApi, BRANCHES_KEY } from '../../services/branchService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import type { BranchFormData } from '../../types';
import { MdArrowForward, MdStorefront, MdCheck } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

/* ── Shared helpers ──────────────────────── */
const inputClass = (hasError: boolean) => `
  w-full px-4 py-2.5 rounded-xl text-sm
  bg-slate-50 dark:bg-slate-900
  border ${hasError ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 dark:border-slate-600'}
  text-slate-800 dark:text-slate-200 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200
`;

const Field: React.FC<{
  id: string; label: string; required?: boolean;
  hint?: string; error?: string; children: React.ReactNode;
}> = ({ id, label, required, hint, error, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
      {label}{required && <span className="text-red-400 mr-1">*</span>}
    </label>
    {children}
    {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

type FormErrors = Partial<Record<keyof BranchFormData, string>>;

/* ══════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════ */
const BranchEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<BranchFormData>({
    name: '', address: '', watts: '', facebook: '', status: true, password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Fetch single branch ────────────────
  const { data: branch, isLoading, isError, error: fetchError, refetch } = useQuery({
    queryKey: [BRANCHES_KEY, id],
    queryFn: () => branchApi.get(id!),
    enabled: !!id,
  });

  // Populate form when data arrives
  useEffect(() => {
    if (branch) {
      setForm({
        name: branch.name,
        address: branch.address,
        watts: branch.watts,
        facebook: branch.facebook,
        status: branch.status,
        password: '',
      });
    }
  }, [branch]);

  // ── Update mutation ────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: BranchFormData) => branchApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BRANCHES_KEY] });
      setTimeout(() => navigate('/dashboard/branches'), 1200);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg || 'حدث خطأ أثناء تحديث الفرع.');
    },
  });

  // ── Validation ─────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'اسم الفرع مطلوب';
    if (!form.address.trim()) e.address = 'العنوان مطلوب';
    if (!form.watts.trim()) e.watts = 'رقم الواتساب مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof BranchFormData]) setErrors(prev => ({ ...prev, [name]: undefined }));
    setApiError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    updateMutation.mutate(form);
  };

  // ── Loading / Error ────────────────────
  if (isLoading) return <LoadingSpinner text="جاري تحميل بيانات الفرع..." />;
  if (isError) return <ErrorFallback error={fetchError} onRetry={refetch} />;

  const isPending = updateMutation.isPending;
  const isSuccess = updateMutation.isSuccess;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard/branches" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <MdArrowForward size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <MdStorefront size={22} className="text-primary" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">تعديل الفرع</h1>
          </div>
          {branch && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              تعديل بيانات: <span className="font-semibold text-slate-700 dark:text-slate-300">{typeof branch.name === 'object' && branch.name !== null ? (branch.name?.ar || branch.name?.en || '') : (branch.name || '')}</span>
              <code className="mr-2 text-xs text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">#{branch.id}</code>
            </p>
          )}
        </div>
      </div>

      {/* Success */}
      {isSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
          <MdCheck size={20} />
          <span className="font-semibold text-sm">تم تحديث بيانات الفرع بنجاح! جاري التحويل...</span>
        </div>
      )}

      {/* API Error */}
      {apiError && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {apiError}
        </div>
      )}

      {/* Branch Info */}
      {branch && (
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl px-5 py-3 flex flex-wrap items-center gap-4 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-xs">تاريخ الإنشاء: </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{branch.created_at}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-xs">رقم الفرع: </span>
            <code className="font-mono text-primary font-bold">#{branch.id}</code>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-xs">الحالة: </span>
            <span className={`font-semibold ${branch.status ? 'text-emerald-600' : 'text-slate-500'}`}>
              {branch.status ? 'نشط' : 'معطل'}
            </span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
            <h2 className="font-bold text-slate-700 dark:text-slate-200 text-sm">تعديل بيانات الفرع</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="md:col-span-2">
              <Field id="edit-name" label="اسم الفرع" required error={typeof errors.name === 'object' && errors.name !== null ? (errors.name?.ar || errors.name?.en || '') : (errors.name || '')}>
                <input id="edit-name" name="name" type="text" value={typeof form.name === 'object' && form.name !== null ? (form.name?.ar || form.name?.en || '') : (form.name || '')} onChange={handleChange}
                  placeholder="اسم الفرع" disabled={isPending} className={inputClass(!!errors.name)} />
              </Field>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <Field id="edit-address" label="العنوان" required error={errors.address}>
                <textarea id="edit-address" name="address" rows={2} value={form.address} onChange={handleChange}
                  placeholder="العنوان التفصيلي" disabled={isPending} className={`${inputClass(!!errors.address)} resize-none`} />
              </Field>
            </div>

            {/* WhatsApp */}
            <Field id="edit-watts" label="رقم الواتساب" required error={errors.watts} hint="رقم الواتساب الخاص بالفرع">
              <input id="edit-watts" name="watts" type="text" value={form.watts} onChange={handleChange}
                placeholder="966501234567" dir="ltr" disabled={isPending} className={`${inputClass(!!errors.watts)} text-left`} />
            </Field>

            {/* Facebook */}
            <Field id="edit-facebook" label="رابط الفيسبوك" hint="اختياري">
              <input id="edit-facebook" name="facebook" type="text" value={form.facebook} onChange={handleChange}
                placeholder="رابط صفحة الفيسبوك" dir="ltr" disabled={isPending} className={`${inputClass(false)} text-left`} />
            </Field>

            {/* Password */}
            <Field id="edit-password" label="كلمة المرور" hint="اتركها فارغة إذا لم ترد تغييرها">
              <input id="edit-password" name="password" type="password" value={form.password ?? ''} onChange={handleChange}
                placeholder="كلمة مرور جديدة (اختياري)" disabled={isPending} className={inputClass(false)} />
            </Field>

            {/* Status */}
            <Field id="edit-status" label="حالة الفرع">
              <div className="flex gap-4 mt-1.5">
                {[{ v: true, l: 'نشط' }, { v: false, l: 'معطل' }].map(({ v, l }) => (
                  <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" value={String(v)} checked={form.status === v}
                      onChange={() => setForm(p => ({ ...p, status: v }))}
                      disabled={isPending} className="w-4 h-4 accent-primary" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{l}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center gap-3 sm:justify-end">
            <Link to="/dashboard/branches"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm text-center">
              إلغاء
            </Link>
            <button id="submit-edit-branch" type="submit" disabled={isPending || isSuccess}
              className="w-full sm:w-auto btn-primary px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all">
              {isPending ? <><AiOutlineLoading3Quarters size={18} className="animate-spin" /> جاري الحفظ...</>
               : isSuccess ? <><MdCheck size={18} /> تم الحفظ!</>
               : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BranchEdit;
