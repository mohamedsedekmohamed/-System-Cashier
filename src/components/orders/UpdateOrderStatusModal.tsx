import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, ORDERS_KEY } from '../../services/orderService';
import type { Order, OrderStatus } from '../../types';
import {
  getAllowedStatusesForModule,
  getOrderStatusConfig,
} from '../../utils/orderStatus';
import {
  MdClose,
  MdCheckCircle,
  MdStore,
  MdDeliveryDining,
  MdShoppingBag,
  MdWarningAmber,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface UpdateOrderStatusModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateOrderStatusModal: React.FC<UpdateOrderStatusModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(order?.status || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allowedStatuses = order ? getAllowedStatusesForModule(order.module) : [];
  const currentConfig = getOrderStatusConfig(order?.status);

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => {
      if (!order) throw new Error('Order is missing');
      return orderService.updateStatus(order.id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'فشل تحديث حالة الطلب. يرجى المحاولة مرة أخرى.';
      setErrorMessage(msg);
    },
  });

  if (!isOpen || !order) return null;

  const getModuleInfo = (mod?: string) => {
    switch (mod) {
      case 'delivery':
        return { label: 'توصيل (Delivery)', icon: <MdDeliveryDining size={18} /> };
      case 'takeaway':
        return { label: 'تيك أواي (Takeaway)', icon: <MdShoppingBag size={18} /> };
      case 'dinein':
        return { label: 'صالة (Dine-in)', icon: <MdStore size={18} /> };
      default:
        return { label: mod || 'طلب', icon: <MdStore size={18} /> };
    }
  };

  const moduleInfo = getModuleInfo(order.module);

  const handleConfirm = () => {
    if (!selectedStatus) return;
    mutation.mutate(selectedStatus);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        dir="rtl"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-base">
              #{order.id}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                تغيير حالة الطلب #{order.id}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  {moduleInfo.icon}
                  {moduleInfo.label}
                </span>
                <span>•</span>
                <span>الحالة الحالية:</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${currentConfig.badgeClass}`}>
                  {currentConfig.label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <MdWarningAmber size={18} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Module Rule Notice */}
          <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-300">
            {order.module === 'dinein' ? (
              <p>
                ⚠️ <strong>طلبات الصالة:</strong> تُدار مساراتها تلقائياً من شاشات الكاشير والمطبخ، وتقتصر صلاحية الأدمن على وضع علامة <strong>مرتجع (return)</strong> فقط.
              </p>
            ) : (
              <p>
                🔒 <strong>قاعدة الحالات المعتمدة:</strong> الخيارات أدناه مطابقة لنوع طلبك (<strong>{moduleInfo.label}</strong>) لتفادي أخطاء معالجة الحالات.
              </p>
            )}
          </div>

          {/* Allowed Statuses Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              اختر الحالة الجديدة للطلب:
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
              {allowedStatuses.map((st) => {
                const conf = getOrderStatusConfig(st);
                const isSelected = selectedStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(st);
                      setErrorMessage(null);
                    }}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-xl border text-right transition-all
                      ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full ${conf.dotClass}`} />
                      <div>
                        <span className="font-bold text-sm text-slate-800 dark:text-white block">
                          {conf.label}
                        </span>
                        {conf.description && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {conf.description}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <MdCheckCircle size={20} className="text-primary shrink-0" />
                    )}
                  </button>
                );
              })}

              {allowedStatuses.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-4">
                  لا توجد حالات مسموحة لتعديل هذا الطلب حالياً.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={mutation.isPending || !selectedStatus || selectedStatus === order.status}
            className="
              px-5 py-2.5 rounded-xl font-bold text-xs text-white
              btn-primary flex items-center gap-2 shadow-md
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {mutation.isPending ? (
              <>
                <AiOutlineLoading3Quarters size={15} className="animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <span>تأكيد تغيير الحالة</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
