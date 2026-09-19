import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { materialApi, MATERIALS_KEY } from '../../services/materialService';
import type { MaterialFormData } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { MdArrowForward, MdSave, MdEdit } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const MaterialEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<{
    name: { ar: string; en: string };
    stock: number | string;
    status: boolean;
    category_id: number | '';
  }>({
    name: { ar: '', en: '' },
    stock: 0,
    status: true,
    category_id: 0,
  });

  // ── Fetch Material Data ───────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [MATERIALS_KEY, id],
    queryFn: () => materialApi.get(id as string),
    enabled: !!id,
  });

  const material = data?.data;
  const categories = data?.select_options?.categories ?? [];

  // Populate form when data arrives
  useEffect(() => {
    if (material) {
      setFormData({
        name: {
          ar: material.name?.ar || '',
          en: material.name?.en || '',
        },
        stock: material.stock ?? 0,
        status: material.status,
        category_id: material.category_id || 0,
      });
    }
  }, [material]);

  // ── Update Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: (payload: MaterialFormData) => materialApi.update(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MATERIALS_KEY] });
      navigate('/dashboard/materials');
    },
  });

  // ── Handlers ───────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'name.ar' || name === 'name.en') {
      const lang = name.split('.')[1] as 'ar' | 'en';
      setFormData(prev => ({
        ...prev,
        name: { ...prev.name, [lang]: value }
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'stock') {
      setFormData(prev => ({ ...prev, stock: value }));
    } else if (name === 'category_id') {
      setFormData(prev => ({ ...prev, category_id: value ? Number(value) : '' }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.ar || !formData.name.en || !formData.category_id) return;
    const parsedStock = parseFloat(String(formData.stock));
    const payload: MaterialFormData = {
      name: formData.name,
      stock: isNaN(parsedStock) ? 0 : parsedStock,
      status: formData.status,
      category_id: Number(formData.category_id),
    };
    mutation.mutate(payload);
  };

  // ── Render States ──────────────────────
  if (isLoading) return <LoadingSpinner text="جاري تحميل بيانات المادة الخام..." />;
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/materials"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdEdit size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">تعديل بيانات المادة الخام</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              تعديل بيانات {material?.name?.ar}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name AR */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم المادة (عربي) <span className="text-red-500">*</span>
              </label>
              <input type="text" name="name.ar" required maxLength={255}
                value={formData.name.ar} onChange={handleChange}
                placeholder="مثال: دقيق أبيض..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Name EN */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                اسم المادة (إنجليزي) <span className="text-red-500">*</span>
              </label>
              <input type="text" name="name.en" required maxLength={255}
                value={formData.name.en} onChange={handleChange}
                placeholder="Example: White Flour..."
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-left"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                القسم <span className="text-red-500">*</span>
              </label>
              <select name="category_id" required
                value={formData.category_id || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="" disabled>-- اختر القسم --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name?.ar}</option>
                ))}
              </select>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الكمية (المخزون)
              </label>
              <input type="number" name="stock" required min="0" step="any" placeholder="0.00"
                value={formData.stock} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 mt-8 md:col-span-2">
              <input
                type="checkbox"
                id="status"
                name="status"
                checked={formData.status || false}
                onChange={handleChange}
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="status" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                نشط
              </label>
            </div>
          </div>
        </div>

        {/* Error message */}
        {mutation.isError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            حدث خطأ أثناء حفظ التعديلات. يرجى التأكد من صحة البيانات والمحاولة مرة أخرى.
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
          <Link to="/dashboard/materials"
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
            إلغاء
          </Link>
          <button type="submit" disabled={mutation.isPending || !formData.name.ar || !formData.name.en || !formData.category_id}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {mutation.isPending ? (
              <><AiOutlineLoading3Quarters size={18} className="animate-spin" /> جاري الحفظ...</>
            ) : (
              <><MdSave size={18} /> حفظ التعديلات</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaterialEdit;
