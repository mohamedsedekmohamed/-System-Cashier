import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deliveryApi, DELIVERIES_KEY } from '../../services/deliveryService';
import type { DeliveryFormData } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { MdArrowForward, MdSave, MdEdit, MdUploadFile } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const DeliveryEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Form State ─────────────────────────
  const [formData, setFormData] = useState<DeliveryFormData>({
    name: '',
    phone: '',
    branch_id: 0,
    id_images: [], // for new files
  });

  // ── Fetch Delivery Data ───────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [DELIVERIES_KEY, id],
    queryFn: () => deliveryApi.get(id as string),
    enabled: !!id,
  });

  const delivery = data?.data;
  const branches = data?.select_options?.branches ?? [];
  const existingImages = delivery?.id_images ?? [];

  // Populate form when data arrives
  useEffect(() => {
    if (delivery) {
      setFormData({
        name: delivery.name,
        phone: delivery.phone,
        branch_id: delivery.branch_id,
        id_images: [], // we don't prepopulate with files, just keep empty for new uploads
      });
    }
  }, [delivery]);

  // ── Update Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: (payload: DeliveryFormData) => deliveryApi.update(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DELIVERIES_KEY] });
      navigate('/dashboard/deliveries');
    },
  });

  // ── Handlers ───────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'branch_id' ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        id_images: Array.from(e.target.files as FileList),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.branch_id) return;
    
    // id_images is optional on edit. If empty array, it won't be sent or we send what we have.
    mutation.mutate(formData);
  };

  // ── Render States ──────────────────────
  if (isLoading) return <LoadingSpinner text="جاري تحميل بيانات الطيار..." />;
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/deliveries"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdEdit size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">تعديل بيانات الطيار</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              تعديل بيانات {typeof delivery?.name === 'object' && delivery?.name !== null ? ((delivery?.name as any)?.ar || (delivery?.name as any)?.en || '') : (delivery?.name || '')}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الاسم <span className="text-red-500">*</span>
              </label>
              <input type="text" name="name" required
                value={typeof formData.name === 'object' && formData.name !== null ? ((formData.name as any)?.ar || (formData.name as any)?.en || '') : (formData.name || '')} onChange={handleChange}
                placeholder="اسم الطيار..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <input type="text" name="phone" required
                value={formData.phone} onChange={handleChange}
                placeholder="01xxxxxxxxx"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Branch */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                الفرع <span className="text-red-500">*</span>
              </label>
              <select name="branch_id" required
                value={formData.branch_id || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="" disabled>-- اختر الفرع --</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>{typeof branch.name === 'object' && branch.name !== null ? ((branch.name as any)?.ar || (branch.name as any)?.en || '') : (branch.name || '')}</option>
                ))}
              </select>
            </div>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  الصور الحالية
                </label>
                <div className="flex flex-wrap gap-4">
                  {existingImages.map((imgUrl, idx) => (
                    <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
                      <img src={imgUrl} alt={`صورة هوية ${idx+1}`} className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Images Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                استبدال الصور <span className="text-slate-400 font-normal text-xs">(اختياري - اتركها فارغة للاحتفاظ بالصور القديمة)</span>
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl border-slate-300 dark:border-slate-600 hover:border-primary dark:hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-all">
                <MdUploadFile size={32} className="text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  اضغط هنا لاختيار صور جديدة
                </p>
                <p className="text-xs text-slate-400 mt-1">يمكنك اختيار أكثر من صورة (JPG, PNG)</p>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                />
              </div>
              
              {/* Preview selected files */}
              {formData.id_images && formData.id_images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-slate-500 mb-2">الملفات الجديدة المحددة ({formData.id_images.length}):</h4>
                  <ul className="space-y-1">
                    {formData.id_images.map((file, idx) => (
                      <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {mutation.isError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            حدث خطأ أثناء تحديث بيانات الطيار. يرجى المحاولة مرة أخرى.
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
          <Link to="/dashboard/deliveries"
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
            إلغاء
          </Link>
          <button type="submit" disabled={mutation.isPending || !formData.name || !formData.phone || !formData.branch_id}
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

export default DeliveryEdit;
