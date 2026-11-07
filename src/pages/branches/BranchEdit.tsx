import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchApi, BRANCHES_KEY } from '../../services/branchService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import type { BranchFormData } from '../../types';
import MapLocationPicker, { type LocationPoint } from '../../components/ui/MapLocationPicker';
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

type FormErrors = Record<string, string | undefined>;

/* ══════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════ */
const BranchEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<{
    name: { ar: string; en: string };
    user_name: string;
    address: string;
    watts: string;
    facebook: string;
    status: boolean;
    password: string;
  }>({
    name: { ar: '', en: '' },
    user_name: '',
    address: '',
    watts: '',
    facebook: '',
    status: true,
    password: '',
  });
  const [locationPoints, setLocationPoints] = useState<LocationPoint[]>([]);
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
      let arName = '';
      let enName = '';
      if (typeof branch.name === 'object' && branch.name !== null) {
        arName = (branch.name as any).ar || '';
        enName = (branch.name as any).en || '';
      } else if (typeof branch.name === 'string') {
        arName = branch.name;
        enName = branch.name;
      }

      setForm({
        name: { ar: arName, en: enName },
        user_name: branch.user_name || '',
        address: branch.address || '',
        watts: branch.watts ? String(branch.watts).replace(/\D/g, '') : '',
        facebook: branch.facebook || '',
        status: branch.status ?? true,
        password: '',
      });

      // Populate location points
      if (Array.isArray(branch.location) && branch.location.length > 0) {
        setLocationPoints(branch.location.map(p => ({
          lat: Number(p.lat) || 0,
          lng: Number(p.lng) || 0,
        })));
      } else if (typeof branch.location === 'string') {
        try {
          const parsed = JSON.parse(branch.location);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocationPoints(parsed.map((p: any) => ({
              lat: Number(p.lat) || 0,
              lng: Number(p.lng) || 0,
            })));
          }
        } catch {
          // ignore
        }
      }
    }
  }, [branch]);

  // ── Update mutation ────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: BranchFormData) => branchApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BRANCHES_KEY] });
      setTimeout(() => navigate('/dashboard/branches'), 1200);
    },
    onError: (err: any) => {
      const resData = err?.response?.data;
      if (resData?.errors) {
        const fieldErrors: FormErrors = {};
        for (const [key, msgs] of Object.entries(resData.errors)) {
          if (Array.isArray(msgs) && msgs.length > 0) {
            fieldErrors[key] = msgs[0] as string;
          }
        }
        setErrors(prev => ({ ...prev, ...fieldErrors }));
      }
      const msg = resData?.message;
      setApiError(msg || 'حدث خطأ أثناء تحديث الفرع.');
    },
  });

  // ── Validation ─────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.ar.trim()) e['name.ar'] = 'اسم الفرع باللغة العربية مطلوب';
    if (!form.name.en.trim()) e['name.en'] = 'اسم الفرع باللغة الإنجليزية مطلوب';
    if (!form.user_name.trim()) e.user_name = 'اسم المستخدم (user_name) مطلوب';
    if (!form.address.trim()) e.address = 'العنوان مطلوب';
    if (!form.watts.trim()) {
      e.watts = 'رقم الواتساب مطلوب';
    } else if (!/^\d+$/.test(form.watts.trim())) {
      e.watts = 'رقم الواتساب يجب أن يحتوي على أرقام فقط بدون أحرف أو مسافات';
    } else if (form.watts.trim().length < 8) {
      e.watts = 'رقم الواتساب يجب ألا يقل عن 8 أرقام';
    }

    const validLocPoints = locationPoints.filter(p => p.lat && p.lng && !isNaN(p.lat) && !isNaN(p.lng));
    if (validLocPoints.length < 3) {
      e.location = `يلزم تحديد 3 نقاط على الأقل على الخريطة لتكوين نطاق مغلق لموقع الفرع (مثلث، مربع، أو مضلع) — المحدد حالياً: ${validLocPoints.length} من 3 نقاط مطلوبة`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'watts') {
      finalValue = value.replace(/\D/g, '');
    }

    if (name.startsWith('name.')) {
      const lang = name.split('.')[1] as 'ar' | 'en';
      setForm(prev => ({
        ...prev,
        name: { ...prev.name, [lang]: finalValue }
      }));
      setErrors(prev => ({ ...prev, [name]: undefined, name: undefined }));
    } else {
      setForm(prev => ({ ...prev, [name]: finalValue }));
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setApiError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cleanPoints = locationPoints.filter(p => p.lat !== undefined && p.lng !== undefined && !isNaN(p.lat) && !isNaN(p.lng));
    const payload: BranchFormData = {
      name: {
        en: form.name.en.trim(),
        ar: form.name.ar.trim(),
      },
      user_name: form.user_name.trim(),
      address: form.address.trim(),
      location: cleanPoints.map(p => ({
        lat: Number(p.lat),
        lng: Number(p.lng),
      })),
      watts: form.watts.trim(),
      facebook: form.facebook.trim(),
      status: form.status,
    };
    if (form.password) {
      payload.password = form.password;
    }

    updateMutation.mutate(payload);
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
              تعديل بيانات: <span className="font-semibold text-slate-700 dark:text-slate-300">{typeof branch.name === 'object' && branch.name !== null ? ((branch.name as any)?.ar || (branch.name as any)?.en || '') : (branch.name || '')}</span>
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 rounded-t-2xl">
            <h2 className="font-bold text-slate-700 dark:text-slate-200 text-sm">تعديل بيانات الفرع والموقع</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name Arabic */}
            <div>
              <Field id="edit-name-ar" label="اسم الفرع (باللغة العربية)" required error={errors['name.ar'] || errors.name}>
                <input
                  id="edit-name-ar"
                  name="name.ar"
                  type="text"
                  value={form.name.ar}
                  onChange={handleChange}
                  placeholder="اسم الفرع بالعربي"
                  disabled={isPending}
                  className={inputClass(!!(errors['name.ar'] || errors.name))}
                />
              </Field>
            </div>

            {/* Name English */}
            <div>
              <Field id="edit-name-en" label="اسم الفرع (باللغة الإنجليزية)" required error={errors['name.en']}>
                <input
                  id="edit-name-en"
                  name="name.en"
                  type="text"
                  value={form.name.en}
                  onChange={handleChange}
                  placeholder="Branch Name (English)"
                  dir="ltr"
                  disabled={isPending}
                  className={`${inputClass(!!errors['name.en'])} text-left`}
                />
              </Field>
            </div>

            {/* Username (user_name) */}
            <div>
              <Field id="edit-user_name" label="اسم المستخدم (Username)" required error={errors.user_name} hint="يُستخدم لتسجيل دخول كاشير الفرع">
                <input
                  id="edit-user_name"
                  name="user_name"
                  type="text"
                  value={form.user_name}
                  onChange={handleChange}
                  placeholder="اسم المستخدم"
                  dir="ltr"
                  disabled={isPending}
                  className={`${inputClass(!!errors.user_name)} text-left font-mono`}
                />
              </Field>
            </div>

            {/* Password */}
            <div>
              <Field id="edit-password" label="كلمة المرور" hint="اتركها فارغة إذا لم ترد تغييرها">
                <input
                  id="edit-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="كلمة مرور جديدة (اختياري)"
                  disabled={isPending}
                  className={inputClass(false)}
                />
              </Field>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <Field id="edit-address" label="العنوان التفصيلي" required error={errors.address}>
                <textarea id="edit-address" name="address" rows={2} value={form.address} onChange={handleChange}
                  placeholder="العنوان التفصيلي" disabled={isPending} className={`${inputClass(!!errors.address)} resize-none`} />
              </Field>
            </div>

            {/* Interactive Map Location Picker */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                تعديل موقع ونطاق الفرع على الخريطة (Location) <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-slate-400 mb-3">
                اضغط على الخريطة لتحديد 3 نقاط على الأقل لتكوين شكل مغلق (مثلث، مربع، أو مضلع)، أو استخدم الأشكال الجاهزة، ويمكنك سحب أي نقطة لتعديل الأبعاد
              </p>
              
              <MapLocationPicker
                points={locationPoints}
                onChange={(pts) => {
                  setLocationPoints(pts);
                  if (errors.location) setErrors(prev => ({ ...prev, location: undefined }));
                }}
                minPoints={3}
                error={errors.location}
                allowMultiple={true}
              />
            </div>

            {/* WhatsApp */}
            <Field id="edit-watts" label="رقم الواتساب" required error={errors.watts} hint="أرقام فقط (مثال: 966501234567)">
              <input 
                id="edit-watts" 
                name="watts" 
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.watts} 
                onChange={handleChange}
                placeholder="أرقام فقط (مثال: 966501234567)" 
                dir="ltr" 
                disabled={isPending} 
                className={`${inputClass(!!errors.watts)} text-left font-mono`} 
              />
            </Field>

            {/* Facebook */}
            <Field id="edit-facebook" label="رابط الفيسبوك" hint="اختياري">
              <input id="edit-facebook" name="facebook" type="text" value={form.facebook} onChange={handleChange}
                placeholder="رابط صفحة الفيسبوك" dir="ltr" disabled={isPending} className={`${inputClass(false)} text-left`} />
            </Field>

            {/* Status */}
            <div className="md:col-span-2">
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
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 rounded-b-2xl flex flex-col sm:flex-row items-center gap-3 sm:justify-end">
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
