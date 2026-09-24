import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productApi, PRODUCTS_KEY, PRODUCTS_SELECT_OPTIONS_KEY } from '../../services/productService';
import type { ProductFormData } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { MdArrowForward, MdSave, MdEdit } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { ProductVariationsSection } from '../../components/products/ProductVariationsSection';

const ProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<ProductFormData>({
    name: { ar: '', en: '' },
    description: { ar: '', en: '' },
    price: 0,
    image: '',
    tax_id: 0,
    discount_id: 0,
    category_id: 0,
    sub_category_id: 0,
    variations: [],
  });

  // ── Fetch Data ─────────────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [PRODUCTS_KEY, id],
    queryFn: () => productApi.get(id as string),
    enabled: !!id,
  });

  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [PRODUCTS_SELECT_OPTIONS_KEY],
    queryFn: productApi.getSelectOptions,
  });

  const product = data?.data;
  const categories = optionsData?.data?.parent_categories ?? [];
  const subCategories = optionsData?.data?.sub_categories ?? [];
  const taxes = optionsData?.data?.tax ?? [];
  const discounts = optionsData?.data?.discount ?? [];

  // Populate form
  useEffect(() => {
    if (product) {
      setFormData({
        name: { ar: product.name?.ar || '', en: product.name?.en || '' },
        description: { ar: product.description?.ar || '', en: product.description?.en || '' },
        price: product.price || 0,
        image: product.image || '',
        tax_id: product.tax_id || 0,
        discount_id: product.discount_id || 0,
        category_id: product.category_id || 0,
        sub_category_id: product.sub_category_id || 0,
        variations: (product.variations || []).map(v => ({
          ...v,
          options: v.options || []
        })),
      });
    }
  }, [product]);

  // ── Update Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: (payload: ProductFormData) => productApi.update(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      navigate('/dashboard/products');
    },
  });

  // ── Basic Field Handlers ───────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('name.')) {
      const lang = name.split('.')[1] as 'ar' | 'en';
      setFormData(prev => ({
        ...prev,
        name: { ...prev.name, [lang]: value }
      }));
    } else if (name.startsWith('description.')) {
      const lang = name.split('.')[1] as 'ar' | 'en';
      setFormData(prev => ({
        ...prev,
        description: { ...prev.description, [lang]: value }
      }));
    } else {
      const isNum = ['price', 'tax_id', 'discount_id', 'category_id', 'sub_category_id'].includes(name);
      setFormData(prev => ({
        ...prev,
        [name]: isNum ? Number(value) : value,
      }));
    }
  };



  // ── Submit ─────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.ar || !formData.name.en || !formData.category_id || formData.price < 0) return;
    
    const payload: ProductFormData = {
      ...formData,
      tax_id: formData.tax_id || null,
      discount_id: formData.discount_id || null,
      sub_category_id: formData.sub_category_id || null,
    };
    mutation.mutate(payload);
  };

  if (isLoading) return <LoadingSpinner text="جاري تحميل بيانات المنتج..." />;
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/products"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdEdit size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">تعديل بيانات المنتج</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">تعديل {product?.name?.ar}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Info Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
            المعلومات الأساسية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">اسم المنتج (عربي) *</label>
              <input type="text" name="name.ar" required value={formData.name.ar} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">اسم المنتج (إنجليزي) *</label>
              <input type="text" name="name.en" required value={formData.name.en} onChange={handleChange} dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-left" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">الوصف (عربي)</label>
              <textarea name="description.ar" rows={2} value={formData.description.ar} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">الوصف (إنجليزي)</label>
              <textarea name="description.en" rows={2} value={formData.description.en} onChange={handleChange} dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-left" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">رابط الصورة (Image URL)</label>
              <input type="text" name="image" value={formData.image} onChange={handleChange} dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-left" />
            </div>
          </div>
        </div>

        {/* Pricing and Categorization */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
            التسعير والتصنيف
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">السعر الأساسي (ج.م) *</label>
              <input type="number" name="price" required min="0" step="0.01" value={formData.price} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            
            {/* Categories */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">القسم الرئيسي *</label>
              <select name="category_id" required disabled={isLoadingOptions} value={formData.category_id || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="" disabled>-- اختر القسم --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name?.ar}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">القسم الفرعي</label>
              <select name="sub_category_id" disabled={isLoadingOptions} value={formData.sub_category_id || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">-- بدون قسم فرعي --</option>
                {subCategories.map(c => <option key={c.id} value={c.id}>{c.name?.ar}</option>)}
              </select>
            </div>

            {/* Taxes and Discounts */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">الضريبة المطبقة</label>
              <select name="tax_id" disabled={isLoadingOptions} value={formData.tax_id || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">-- بدون ضريبة --</option>
                {taxes.map(t => <option key={t.id} value={t.id}>{t.name?.ar}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">الخصم المطبق</label>
              <select name="discount_id" disabled={isLoadingOptions} value={formData.discount_id || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">-- بدون خصم --</option>
                {discounts.map(d => <option key={d.id} value={d.id}>{d.name?.ar}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Variations & Addons Section */}
        <ProductVariationsSection
          variations={formData.variations}
          onChange={(newVariations) => setFormData(prev => ({ ...prev, variations: newVariations }))}
        />

        {/* Error message */}
        {mutation.isError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            حدث خطأ أثناء حفظ التعديلات. يرجى التأكد من صحة البيانات والمحاولة مرة أخرى.
          </div>
        )}

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 z-20 lg:pr-64">
          <Link to="/dashboard/products"
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

export default ProductEdit;
