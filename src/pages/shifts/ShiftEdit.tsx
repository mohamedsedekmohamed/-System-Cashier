import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shiftApi, SHIFTS_KEY } from '../../services/shiftService';
import type { ShiftFormData } from '../../types';
import { MdArrowForward, MdSchedule, MdCheck } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import ErrorFallback from '../../components/ui/ErrorFallback';

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

type FormErrors = Partial<Record<keyof ShiftFormData | 'name.ar' | 'name.en', string>>;

const INITIAL: ShiftFormData = {
  name: { ar: '', en: '' },
  start_time: '',
  end_time: '',
  branch_id: 0,
};

const ShiftEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ShiftFormData>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Fetch Shift Data & Select Options ────────────────
  const { data: shiftData, isLoading: isLoadingShift, isError: isShiftError, error: shiftError, refetch } = useQuery({
    queryKey: [SHIFTS_KEY, id],
    queryFn: () => shiftApi.get(id!),
    enabled: !!id,
  });

  const branches = shiftData?.select_options?.branches || [];

  useEffect(() => {
    if (shiftData) {
      setForm({
        name: {
          ar: shiftData.name?.ar || '',
          en: shiftData.name?.en || '',
        },
        start_time: shiftData.start_time?.substring(0, 5) || '',
        end_time: shiftData.end_time?.substring(0, 5) || '',
        branch_id: shiftData.branch_id || 0,
      });
    }
  }, [shiftData]);

  // ── Update mutation ────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: ShiftFormData) => shiftApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIFTS_KEY] });
      setTimeout(() => navigate('/dashboard/shifts'), 1200);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg || 'حدث خطأ أثناء تحديث الوردية.');
    },
  });

  // ── Validation ─────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.ar.trim()) e['name.ar'] = 'اسم الوردية (عربي) مطلوب';
    if (!form.name.en.trim()) e['name.en'] = 'اسم الوردية (إنجليزي) مطلوب';
    if (!form.start_time) e.start_time = 'وقت البدء مطلوب';
    if (!form.end_time) e.end_time = 'وقت الانتهاء مطلوب';
    if (!form.branch_id || form.branch_id === 0) e.branch_id = 'الفرع مطلوب';
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'name.ar') {
      setForm(prev => ({ ...prev, name: { ...prev.name, ar: value } }));
      if (errors['name.ar']) setErrors(prev => ({ ...prev, 'name.ar': undefined }));
    } else if (name === 'name.en') {
      setForm(prev => ({ ...prev, name: { ...prev.name, en: value } }));
      if (errors['name.en']) setErrors(prev => ({ ...prev, 'name.en': undefined }));
    } else {
      setForm(prev => ({ ...prev, [name]: name === 'branch_id' ? Number(value) : value }));
      if (errors[name as keyof ShiftFormData]) setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setApiError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    updateMutation.mutate(form);
  };

  const isPending = updateMutation.isPending;
  const isSuccess = updateMutation.isSuccess;

  if (isShiftError) return <ErrorFallback error={shiftError} onRetry={refetch} />;

  if (isLoadingShift) {
    return (
      <div className="flex items-center justify-center h-64">
        <AiOutlineLoading3Quarters size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard/shifts" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <MdArrowForward size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <MdSchedule size={22} className="text-primary" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">تعديل الوردية</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">تحديث بيانات الوردية</p>
        </div>
      </div>

      {/* Success */}
      {isSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
          <MdCheck size={20} />
          <span className="font-semibold text-sm">تم تحديث الوردية بنجاح! جاري التحويل...</span>
        </div>
      )}

      {/* API Error */}
      {apiError && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {apiError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
            <h2 className="font-bold text-slate-700 dark:text-slate-200 text-sm">بيانات الوردية</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name AR */}
            <Field id="name.ar" label="اسم الوردية (عربي)" required error={errors['name.ar']}>
              <input id="name.ar" name="name.ar" type="text" value={form.name.ar} onChange={handleChange}
                placeholder="مثال: الوردية الصباحية" disabled={isPending} className={inputClass(!!errors['name.ar'])} />
            </Field>

            {/* Name EN */}
            <Field id="name.en" label="اسم الوردية (إنجليزي)" required error={errors['name.en']}>
              <input id="name.en" name="name.en" type="text" value={form.name.en} onChange={handleChange}
                placeholder="e.g. Morning Shift" dir="ltr" disabled={isPending} className={inputClass(!!errors['name.en'])} />
            </Field>

            {/* Start Time */}
            <Field id="start_time" label="وقت البدء" required error={errors.start_time}>
              <input id="start_time" name="start_time" type="time" value={form.start_time} onChange={handleChange}
                disabled={isPending} className={inputClass(!!errors.start_time)} />
            </Field>

            {/* End Time */}
            <Field id="end_time" label="وقت الانتهاء" required error={errors.end_time}>
              <input id="end_time" name="end_time" type="time" value={form.end_time} onChange={handleChange}
                disabled={isPending} className={inputClass(!!errors.end_time)} />
            </Field>

            {/* Branch */}
            <div className="md:col-span-2">
              <Field id="branch_id" label="الفرع" required error={errors.branch_id}>
                <select id="branch_id" name="branch_id" value={form.branch_id} onChange={handleChange}
                  disabled={isPending || isLoadingShift} className={inputClass(!!errors.branch_id)}>
                  <option value={0} disabled>اختر الفرع...</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name?.ar || b.name?.en || b.name || `فرع ${b.id}`}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center gap-3 sm:justify-end">
            <Link to="/dashboard/shifts"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm text-center">
              إلغاء
            </Link>
            <button id="submit-edit-shift" type="submit" disabled={isPending || isSuccess}
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

export default ShiftEdit;
