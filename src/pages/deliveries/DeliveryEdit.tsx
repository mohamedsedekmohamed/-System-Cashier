import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deliveryApi, DELIVERIES_KEY } from '../../services/deliveryService';
import type { DeliveryFormData } from '../../types';
import ImageUploadPreview from '../../components/ui/ImageUploadPreview';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { renderName } from '../../utils/helpers';
import { MdArrowForward, MdSave, MdEdit } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const DeliveryEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);

  // Populate form when data arrives
  useEffect(() => {
    if (delivery) {
      setFormData({
        name: renderName(delivery.name),
        phone: delivery.phone,
        branch_id: delivery.branch_id,
        id_images: [], // we don't prepopulate with files, just keep empty for new uploads
      });
      setExistingImages(delivery.id_images ?? []);
      setDeletedImages([]);
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
    let finalVal: any = value;
    if (name === 'branch_id') finalVal = Number(value);
    if (name === 'phone') finalVal = value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      [name]: finalVal,
    }));
  };

  const handleRemoveExisting = (indexToRemove: number) => {
    const target = existingImages[indexToRemove];
    setExistingImages(prev => prev.filter((_, i) => i !== indexToRemove));
    if (target) {
      setDeletedImages(prev => [...prev, target]);
    }
  };

  const handleClearAllExisting = () => {
    setDeletedImages(prev => [...prev, ...existingImages]);
    setExistingImages([]);
  };

  const handleRestoreExisting = () => {
    setExistingImages(delivery?.id_images ?? []);
    setDeletedImages([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.branch_id) return;
    
    mutation.mutate({
      ...formData,
      existing_images: existingImages,
      deleted_images: deletedImages,
    });
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
              تعديل بيانات {renderName(delivery?.name)}
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
                value={renderName(formData.name)} onChange={handleChange}
                placeholder="اسم الطيار..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel" 
                inputMode="numeric"
                pattern="[0-9]*"
                name="phone" 
                required
                value={formData.phone} 
                onChange={handleChange}
                placeholder="01xxxxxxxxx"
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-left"
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
                  <option key={branch.id} value={branch.id}>{renderName(branch.name)}</option>
                ))}
              </select>
            </div>

            {/* Images Upload & Existing Preview */}
            <div className="md:col-span-2 space-y-3">
              <ImageUploadPreview
                files={formData.id_images ?? []}
                existingImages={existingImages}
                onChange={(files) => setFormData(prev => ({ ...prev, id_images: files }))}
                onRemoveExisting={handleRemoveExisting}
                onClearAllExisting={handleClearAllExisting}
                label="صور الهوية / الرخصة"
                hint="اضغط لاختيار صور جديدة أو اسحبها هنا (JPG, PNG, WEBP)"
                disabled={mutation.isPending}
              />

              {deletedImages.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">تنبيه:</span>
                    <span>تم تحديد {deletedImages.length} {deletedImages.length === 1 ? 'صورة' : 'صور'} للحذف. اضغط على "حفظ التعديلات" بالأسفل لتأكيد الحذف نهائياً.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRestoreExisting}
                    className="font-bold underline hover:text-amber-800 dark:hover:text-amber-200 cursor-pointer"
                  >
                    تراجع
                  </button>
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
