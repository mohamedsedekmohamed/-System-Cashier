import React from 'react';
import { MdClose, MdReceipt, MdLayers, MdReceiptLong, MdAttachMoney, MdCalendarToday, MdNotes, MdOpenInNew } from 'react-icons/md';
import type { Purchase } from '../../types';

interface PurchaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase | null;
}

const renderItemName = (item: any): string => {
  if (item.material_name) return item.material_name;
  if (item.product_recipe_name) return item.product_recipe_name;
  if (item.material?.name) {
    return typeof item.material.name === 'object'
      ? item.material.name.ar || item.material.name.en || 'مادة خام'
      : String(item.material.name);
  }
  if (item.product_recipe?.name) {
    return typeof item.product_recipe.name === 'object'
      ? item.product_recipe.name.ar || item.product_recipe.name.en || 'وصفة منتج'
      : String(item.product_recipe.name);
  }
  return item.material_id ? `مادة #${item.material_id}` : item.product_recipe_id ? `وصفة #${item.product_recipe_id}` : 'صنف غير محدد';
};

export const PurchaseDetailsModal: React.FC<PurchaseDetailsModalProps> = ({
  isOpen,
  onClose,
  purchase,
}) => {
  if (!isOpen || !purchase) return null;

  const items = purchase.items || [];
  const receiptUrl = purchase.receipt_url || (typeof purchase.receipt === 'string' ? purchase.receipt : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <MdReceipt size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  تفاصيل فاتورة المشتريات
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                  #{purchase.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <MdCalendarToday size={13} />
                {purchase.created_at ? new Date(purchase.created_at).toLocaleString('ar-EG') : '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
          >
            <MdClose size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Metric Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
                <MdAttachMoney size={16} />
                إجمالي التكلفة
              </span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {Number(purchase.total_cost || purchase.cost || 0).toLocaleString('ar-EG')} <span className="text-sm font-normal">ج.م</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/40">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-1">
                <MdLayers size={16} />
                إجمالي الكمية
              </span>
              <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
                {Number(purchase.total_quantity || purchase.quantity || 0).toLocaleString('ar-EG')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/40">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 mb-1">
                <MdReceiptLong size={16} />
                عدد البنود
              </span>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-300">
                {items.length} <span className="text-sm font-normal">أصناف</span>
              </p>
            </div>
          </div>

          {/* Notes if present */}
          {purchase.notes && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <MdNotes size={16} />
                الملاحظات
              </span>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {purchase.notes}
              </p>
            </div>
          )}

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <span>قائمة الأصناف المشتراة</span>
                <span className="text-xs font-normal text-slate-400">({items.length} عنصر)</span>
              </h4>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">الصنف</th>
                    <th className="py-3 px-4">النوع</th>
                    <th className="py-3 px-4 text-center">الكمية</th>
                    <th className="py-3 px-4 text-center">سعر الوحدة</th>
                    <th className="py-3 px-4 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        لا توجد بنود مسجلة لهذه الفاتورة
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const isRecipe = !!item.product_recipe_id;
                      const subtotal = Number(item.quantity || 0) * Number(item.cost || 0);

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                            {renderItemName(item)}
                          </td>
                          <td className="py-3.5 px-4">
                            {isRecipe ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
                                وصفة منتج
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-200/50 dark:border-cyan-800/40">
                                مادة خام
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-200">
                            {Number(item.quantity).toLocaleString('ar-EG')}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300">
                            {Number(item.cost).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="py-3.5 px-4 text-left font-bold text-emerald-600 dark:text-emerald-400">
                            {subtotal.toLocaleString('ar-EG')} ج.م
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {items.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 font-bold text-sm">
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        المجموع الكلي:
                      </td>
                      <td className="py-3 px-4 text-center text-blue-600 dark:text-blue-400">
                        {Number(purchase.total_quantity || purchase.quantity || 0).toLocaleString('ar-EG')}
                      </td>
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4 text-left text-emerald-600 dark:text-emerald-400 text-base">
                        {Number(purchase.total_cost || purchase.cost || 0).toLocaleString('ar-EG')} ج.م
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Receipt Preview */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-base mb-2">
              صورة الإيصال / الفاتورة
            </h4>
            {receiptUrl ? (
              <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 max-h-72 flex items-center justify-center">
                <img
                  src={receiptUrl}
                  alt="Receipt"
                  className="w-full max-h-72 object-contain group-hover:scale-[1.02] transition-transform duration-300"
                />
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-medium shadow-lg transition-all"
                >
                  <MdOpenInNew size={14} />
                  فتح بحجم كامل
                </a>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 text-sm">
                لا يوجد صورة إيصال مرفقة مع هذه الفاتورة
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end bg-slate-50/50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
