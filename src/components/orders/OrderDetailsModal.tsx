import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, ORDERS_KEY } from '../../services/orderService';
import type { Order, OrderStatus } from '../../types';
import {
  getOrderStatusConfig,
  getAllowedStatusesForModule,
} from '../../utils/orderStatus';
import { renderName } from '../../utils/helpers';
import {
  MdClose,
  MdReceipt,
  MdPrint,
  MdContentCopy,
  MdStore,
  MdLanguage,
  MdDeliveryDining,
  MdShoppingBag,
  MdWarningAmber,
  MdPhone,
  MdLocationOn,
  MdMap,
  MdAccessTime,
  MdAttachMoney,
  MdPerson,
  MdTableRestaurant,
  MdFastfood,
  MdEdit,
  MdAccountBalanceWallet,
  MdQrCode2,
  MdInfoOutline,
  MdBadge,
  MdEventSeat,
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStatusModal?: (order: Order) => void;
}

// Safely resolve any translation candidate or array
const resolveName = (...candidates: any[]): string => {
  for (const c of candidates) {
    if (c === null || c === undefined) continue;
    const resolved = renderName(c);
    if (resolved && resolved.trim()) return resolved;
  }
  return '';
};

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenStatusModal,
}) => {
  const queryClient = useQueryClient();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'operations'>('items');

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: OrderStatus }) => {
      if (!order) throw new Error('Order missing');
      return orderService.updateStatus(order.id, status, order.delivery_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['order-single-details', order?.id] });
      setIsChangingStatus(false);
      setSelectedStatus(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'فشل تحديث حالة الطلب');
    },
  });

  if (!isOpen || !order) return null;

  const statusConfig = getOrderStatusConfig(order.status);
  const allowedStatuses = getAllowedStatusesForModule(order.module);
  const products = order.products || [];

  // Total items quantity
  const totalItemsCount = products.reduce((acc, p) => acc + (Number(p.quantity) || 1), 0);

  // Helper for module badge
  const getModuleBadge = (mod?: string) => {
    switch (mod) {
      case 'delivery':
        return {
          label: 'توصيل (Delivery)',
          icon: <MdDeliveryDining size={16} />,
          badgeClass:
            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'takeaway':
        return {
          label: 'سفري (Takeaway)',
          icon: <MdShoppingBag size={16} />,
          badgeClass:
            'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'dinein':
      case 'dine_in':
        return {
          label: 'صالة (Dine-in)',
          icon: <MdStore size={16} />,
          badgeClass:
            'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        };
      default:
        return {
          label: mod || 'طلب',
          icon: <MdStore size={16} />,
          badgeClass:
            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const moduleInfo = getModuleBadge(order.module);

  // Clean phone number for WhatsApp and Tel
  const cleanPhone = (phone?: string | null) => {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
  };

  const handleCopyDetails = () => {
    const lines: string[] = [];
    lines.push(`📋 *طلب رقم #${order.id}*`);
    lines.push(`📌 *نوع الطلب:* ${moduleInfo.label}`);
    lines.push(`📊 *الحالة:* ${statusConfig.label}`);

    if (order.name) lines.push(`👤 *العميل:* ${resolveName(order.name)}`);
    if (order.phone) lines.push(`📞 *الهاتف:* ${order.phone}`);
    if (order.address) lines.push(`📍 *العنوان:* ${order.address}`);

    if (order.hall_table?.name) {
      const tableStr = `${resolveName(order.hall_table.name)} ${
        order.hall_table.hall?.name ? `(${resolveName(order.hall_table.hall.name)})` : ''
      }`;
      lines.push(`🍽️ *الطاولة:* ${tableStr}`);
    }

    if (order.note) lines.push(`⚠️ *ملاحظة الطلب:* ${order.note}`);

    lines.push('\n🛒 *الأصناف المطلوبة:*');
    products.forEach((p, idx) => {
      const pName = resolveName(p.name, p.name_translations, p.product?.name) || `صنف #${idx + 1}`;
      const qty = Number(p.quantity) || 1;
      let itemLine = `${idx + 1}. *${qty}x* ${pName}`;

      if (p.is_gift) itemLine += ' [هدية 🎁]';
      lines.push(itemLine);

      // Variations
      if (Array.isArray(p.variations)) {
        p.variations.forEach((v: any) => {
          const varName = resolveName(v.name, v.name_translations, v.variation?.name);
          if (Array.isArray(v.options)) {
            v.options.forEach((opt: any) => {
              const optName = resolveName(opt.name, opt.name_translations, opt.option?.name);
              if (optName) {
                lines.push(`   - ${varName ? `${varName}: ` : ''}${optName}`);
              }
            });
          }
        });
      }

      // Addons
      if (Array.isArray(p.addons)) {
        p.addons.forEach((ad: any) => {
          const adName = resolveName(ad.name, ad.name_translations, ad.addon?.name);
          if (adName) {
            lines.push(`   + إضافة: ${adName}`);
          }
        });
      }

      if (p.note) {
        lines.push(`   ✍️ ملاحظة التحضير: ${p.note}`);
      }
    });

    lines.push('\n💰 *الحساب:*');
    lines.push(`- الإجمالي الفرعي: ${Number(order.total || 0).toLocaleString('ar-EG')} ج.م`);
    if (Number(order.total_tax) > 0) {
      lines.push(`- الضريبة: ${Number(order.total_tax).toLocaleString('ar-EG')} ج.م`);
    }
    if (Number(order.total_discount) > 0) {
      lines.push(`- الخصم: ${Number(order.total_discount).toLocaleString('ar-EG')} ج.م`);
    }
    lines.push(`- *الإجمالي النهائي: ${Number(order.final_price || 0).toLocaleString('ar-EG')} ج.م*`);
    lines.push(`- حالة الدفع: ${order.paid ? 'مدفوع ✅' : 'غير مدفوع (تحصيل عند الاستلام) ⚠️'}`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopyFeedback('تم نسخ تفاصيل الطلب بالكامل للحافظة بنجاح!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) return;

    const branchName = resolveName(order.branch?.name) || 'المطعم';
    const customerName = resolveName(order.name) || 'عميل نقدي';
    const tableInfo = order.hall_table
      ? `${resolveName(order.hall_table.name)} ${
          order.hall_table.hall?.name ? `(${resolveName(order.hall_table.hall.name)})` : ''
        }`
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>بون تحضير وفاتورة طلب #${order.id}</title>
          <style>
            @media print {
              @page { margin: 4mm; size: auto; }
              body { margin: 0; }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              direction: rtl;
              text-align: right;
              padding: 12px;
              max-width: 320px;
              margin: 0 auto;
              color: #000;
              font-size: 13px;
              line-height: 1.4;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .header { border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .title { font-size: 18px; margin: 0; }
            .order-no { font-size: 22px; font-weight: 900; margin: 4px 0; }
            .meta-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 12px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .double-divider { border-top: 2px solid #000; margin: 8px 0; }
            .alert-box {
              border: 1px solid #000;
              padding: 6px;
              margin: 6px 0;
              font-weight: bold;
              background-color: #f0f0f0;
              border-radius: 4px;
            }
            .items-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
            .items-table th { border-bottom: 1px solid #000; padding: 4px 0; font-size: 12px; }
            .items-table td { padding: 5px 0; vertical-align: top; }
            .item-qty { font-weight: 900; font-size: 15px; width: 35px; }
            .item-details { padding-right: 4px; }
            .item-sub { font-size: 11px; color: #333; margin-top: 2px; }
            .item-note { font-size: 11px; font-weight: bold; margin-top: 2px; }
            .item-price { text-align: left; font-weight: bold; width: 60px; }
            .totals-row { display: flex; justify-content: space-between; margin: 4px 0; }
            .grand-total { font-size: 16px; font-weight: 900; border-top: 1px dashed #000; padding-top: 6px; }
            .footer { text-align: center; font-size: 11px; margin-top: 16px; border-top: 1px dashed #000; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header center">
            <h1 class="title">${branchName}</h1>
            <div class="order-no">طلب #${order.id}</div>
            <div class="bold" style="font-size: 14px;">[ ${moduleInfo.label} - ${order.is_pos ? 'كاشير' : 'أونلاين'} ]</div>
            <div class="meta-row">
              <span>التاريخ: ${order.created_at ? new Date(order.created_at).toLocaleDateString('ar-EG') : '—'}</span>
              <span>الوقت: ${order.created_at ? new Date(order.created_at).toLocaleTimeString('ar-EG') : '—'}</span>
            </div>
          </div>

          ${
            tableInfo
              ? `<div class="meta-row bold" style="font-size: 14px;"><span>الطاولة:</span><span>${tableInfo}</span></div>`
              : ''
          }
          ${
            customerName && customerName !== 'عميل نقدي'
              ? `<div class="meta-row"><span>العميل:</span><span class="bold">${customerName}</span></div>`
              : ''
          }
          ${
            order.phone
              ? `<div class="meta-row"><span>الهاتف:</span><span class="bold" dir="ltr">${order.phone}</span></div>`
              : ''
          }
          ${
            order.address
              ? `<div class="meta-row"><span>العنوان:</span><span>${order.address}</span></div>`
              : ''
          }
          ${
            order.delivery?.name
              ? `<div class="meta-row"><span>الطيار:</span><span>${order.delivery.name}</span></div>`
              : ''
          }

          ${
            order.note
              ? `<div class="alert-box">⚠️ ملاحظة الطلب: ${order.note}</div>`
              : ''
          }

          <div class="divider"></div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: right;">الكمية</th>
                <th style="text-align: right;">الصنف ومواصفات التحضير</th>
                <th style="text-align: left;">السعر</th>
              </tr>
            </thead>
            <tbody>
              ${products
                .map((p, idx) => {
                  const pName = resolveName(p.name, p.name_translations, p.product?.name) || `صنف #${idx + 1}`;
                  const qty = Number(p.quantity) || 1;
                  const price = Number(p.price || p.product?.price || 0);

                  const varList: string[] = [];
                  if (Array.isArray(p.variations)) {
                    p.variations.forEach((v: any) => {
                      const varName = resolveName(v.name, v.name_translations, v.variation?.name);
                      if (Array.isArray(v.options)) {
                        v.options.forEach((opt: any) => {
                          const optName = resolveName(opt.name, opt.name_translations, opt.option?.name);
                          if (optName) varList.push(`${varName ? `${varName}: ` : ''}${optName}`);
                        });
                      }
                    });
                  }

                  const addonList: string[] = [];
                  if (Array.isArray(p.addons)) {
                    p.addons.forEach((ad: any) => {
                      const adName = resolveName(ad.name, ad.name_translations, ad.addon?.name);
                      if (adName) addonList.push(`+ ${adName}`);
                    });
                  }

                  return `
                    <tr>
                      <td class="item-qty">${qty}x</td>
                      <td class="item-details">
                        <div class="bold">${pName} ${p.is_gift ? '🎁 [هدية]' : ''}</div>
                        ${varList.length > 0 ? `<div class="item-sub">🔹 ${varList.join(' | ')}</div>` : ''}
                        ${addonList.length > 0 ? `<div class="item-sub">➕ ${addonList.join(' , ')}</div>` : ''}
                        ${p.note ? `<div class="item-note">✍️ ${p.note}</div>` : ''}
                      </td>
                      <td class="item-price">${(price * qty).toLocaleString('ar-EG')}</td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>

          <div class="double-divider"></div>

          <div class="totals-row">
            <span>المجموع الفرعي:</span>
            <span>${Number(order.total || 0).toLocaleString('ar-EG')} ج.م</span>
          </div>
          ${
            Number(order.total_tax) > 0
              ? `<div class="totals-row"><span>الضريبة:</span><span>${Number(order.total_tax).toLocaleString('ar-EG')} ج.م</span></div>`
              : ''
          }
          ${
            Number(order.total_discount) > 0
              ? `<div class="totals-row"><span>الخصم:</span><span>- ${Number(order.total_discount).toLocaleString('ar-EG')} ج.م</span></div>`
              : ''
          }
          <div class="totals-row grand-total">
            <span>الإجمالي المطلوب:</span>
            <span>${Number(order.final_price || 0).toLocaleString('ar-EG')} ج.م</span>
          </div>
          <div class="meta-row bold" style="margin-top: 4px;">
            <span>حالة الدفع:</span>
            <span>${order.paid ? 'مدفوع بالكامل' : 'غير مدفوع (تحصيل عند الاستلام)'}</span>
          </div>

          <div class="footer">
            <div>شكراً لتعاملكم معنا</div>
            <div>نظام الكاشير وإدارة الطلبات</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[94vh] overflow-hidden">
        {/* ── Modal Header ── */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner shrink-0">
              <MdReceipt size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  تفاصيل الطلب
                </h3>
                <span className="font-mono text-sm font-extrabold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  #{order.id}
                </span>

                {/* Module Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${moduleInfo.badgeClass}`}
                >
                  {moduleInfo.icon}
                  {moduleInfo.label}
                </span>

                {/* Source Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    order.is_pos
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  }`}
                >
                  {order.is_pos ? <MdStore size={14} /> : <MdLanguage size={14} />}
                  {order.is_pos ? 'كاشير (POS)' : 'أونلاين'}
                </span>

                {/* Payment Badge */}
                {order.paid ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    مدفوع بالكامل
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    غير مدفوع (مطلوب تحصيل)
                  </span>
                )}
              </div>

              {/* Status and Timestamp info */}
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MdAccessTime size={14} />
                  {order.created_at ? new Date(order.created_at).toLocaleString('ar-EG') : '—'}
                </span>
                {order.branch && (
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    الفرع: {resolveName(order.branch.name)}
                  </span>
                )}
                {order.shift?.name && (
                  <span className="text-slate-600 dark:text-slate-300">
                    الوردية: {resolveName(order.shift.name)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="طباعة الفاتورة أو بون المطبخ"
            >
              <MdPrint size={16} />
              <span>طباعة البون</span>
            </button>

            <button
              type="button"
              onClick={handleCopyDetails}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800/60 shadow-sm active:scale-95 cursor-pointer"
              title="نسخ تفاصيل الطلب بالكامل لإرسالها عبر الواتساب أو للمطبخ"
            >
              <MdContentCopy size={15} />
              <span>نسخ التفاصيل</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors cursor-pointer"
            >
              <MdClose size={22} />
            </button>
          </div>
        </div>

        {/* Copy Feedback Toast */}
        {copyFeedback && (
          <div className="bg-emerald-600 text-white text-xs font-bold text-center py-2 animate-in slide-in-from-top duration-200">
            {copyFeedback}
          </div>
        )}

        {/* ── Modal Scrollable Body ── */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. Status Bar & Inline Status Changer */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-900/50 dark:to-indigo-950/20 border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                حالة الطلب:
              </span>
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border shadow-sm ${statusConfig.badgeClass}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dotClass}`} />
                <span>{statusConfig.label}</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                ({statusConfig.description})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onOpenStatusModal ? (
                <button
                  type="button"
                  onClick={() => onOpenStatusModal(order)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <MdEdit size={14} />
                  <span>تحديث حالة الطلب</span>
                </button>
              ) : isChangingStatus ? (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedStatus || order.status}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                    className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    {allowedStatuses.map((st) => (
                      <option key={st} value={st}>
                        {getOrderStatusConfig(st).label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={statusMutation.isPending || !selectedStatus}
                    onClick={() => selectedStatus && statusMutation.mutate({ status: selectedStatus })}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs disabled:opacity-50"
                  >
                    {statusMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingStatus(false)}
                    className="px-2 py-1.5 text-xs text-slate-500"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsChangingStatus(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  <MdEdit size={14} />
                  <span>تغيير الحالة</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Customer Order Note Alert (ملاحظات العميل العامة للطلب) */}
          {order.note && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-700/60 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <MdWarningAmber size={22} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                  ملاحظات وتعليمات العميل للطلب:
                </h4>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mt-1 whitespace-pre-wrap leading-relaxed">
                  {order.note}
                </p>
              </div>
            </div>
          )}

          {/* 3. Customer, Table, and Delivery Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Customer Information Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MdPerson size={17} className="text-primary" />
                  بيانات العميل
                </span>
                {order.is_pos ? (
                  <span className="text-[11px] text-slate-400 font-medium">عميل الكاشير</span>
                ) : (
                  <span className="text-[11px] text-emerald-600 font-bold">طلب أونلاين</span>
                )}
              </div>

              <div className="pt-1">
                <p className="text-base font-extrabold text-slate-800 dark:text-white">
                  {resolveName(order.name) || 'عميل نقدي'}
                </p>
                {order.phone ? (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300" dir="ltr">
                      {order.phone}
                    </span>

                    <a
                      href={`tel:${cleanPhone(order.phone)}`}
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 transition-colors"
                      title="اتصال هاتفي بالعميل"
                    >
                      <MdPhone size={15} />
                    </a>

                    <a
                      href={`https://wa.me/${cleanPhone(order.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-400 transition-colors"
                      title="مراسلة العميل عبر واتساب"
                    >
                      <FaWhatsapp size={15} />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">لا يوجد رقم هاتف مسجل</p>
                )}
              </div>
            </div>

            {/* Destination Card (Table or Address) */}
            {order.hall_table ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/70 space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MdTableRestaurant size={17} className="text-indigo-600" />
                  مكان الجلوس (الصالة)
                </span>
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-extrabold text-slate-800 dark:text-white">
                      طاولة: {resolveName(order.hall_table.name) || order.hall_table.code || `#${order.hall_table.id}`}
                    </p>
                    {order.hall_table.code && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold">
                        كود: {order.hall_table.code}
                      </span>
                    )}
                  </div>
                  {order.hall_table.hall?.name && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      القاعة / الصالة: {resolveName(order.hall_table.hall.name)}
                    </p>
                  )}
                  {order.hall_table.qr && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary font-bold">
                      <MdQrCode2 size={16} />
                      <span>طلب مباشر عبر كود QR</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/70 space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MdLocationOn size={17} className="text-rose-500" />
                  عنوان التوصيل
                </span>
                <div className="pt-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                    {order.address || 'استلام من الفرع (سفري)'}
                  </p>
                  {(order.lat || order.lng || order.address) && (
                    <div className="mt-2">
                      <a
                        href={
                          order.lat && order.lng
                            ? `https://www.google.com/maps?q=${order.lat},${order.lng}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                order.address || ''
                              )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition-colors border border-rose-200 dark:border-rose-900/40"
                      >
                        <MdMap size={14} />
                        <span>فتح في خرائط Google</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Driver Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/70 space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MdDeliveryDining size={18} className="text-teal-600" />
                مندوب التوصيل
              </span>
              <div className="pt-1 space-y-1.5">
                {order.delivery?.name ? (
                  <div>
                    <span className="text-xs text-slate-400">سائق التوصيل:</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {order.delivery.name}
                      </p>
                      {order.delivery.phone && (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${cleanPhone(order.delivery.phone)}`}
                            className="p-1 rounded-md bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors"
                            title="اتصال بالسائق"
                          >
                            <MdPhone size={13} />
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone(order.delivery.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                            title="واتساب السائق"
                          >
                            <FaWhatsapp size={13} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    {order.module === 'delivery'
                      ? 'لم يتم تعيين سائق توصيل لهذا الطلب'
                      : 'طلب محلي / سفري (بدون توصيل)'}
                  </p>
                )}

                {(order.cashier?.name || order.cashier_man?.name) && (
                  <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-1 text-xs text-slate-500">
                    <span>الكاشير: </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {order.cashier_man?.name || order.cashier?.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs: Items vs Operational Info */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`pb-2.5 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'items'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <MdFastfood size={18} />
              <span>الأصناف المطلوبة ومواصفات التحضير</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                {products.length} صنف ({totalItemsCount} قطعة)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('operations')}
              className={`pb-2.5 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'operations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <MdInfoOutline size={18} />
              <span>بيانات الوردية والفرع والخزينة</span>
            </button>
          </div>

          {activeTab === 'items' ? (
            /* 4. Products Table / Cards (الأصناف المطلوبة بالتفصيل الدقيق) */
            <div className="space-y-3">
              {products.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400">
                  <MdFastfood size={42} className="mx-auto mb-2 opacity-40" />
                  <p>لا توجد منتجات مسجلة في هذا الطلب</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((item, idx) => {
                    const pObj = item.product;
                    const pNameAr =
                      resolveName(item.name, item.name_translations, pObj?.name) || `صنف #${idx + 1}`;
                    const pNameEn = resolveName(
                      renderName(item.name, 'en'),
                      renderName(item.name_translations, 'en'),
                      renderName(pObj?.name, 'en')
                    );
                    const qty = Number(item.quantity) || 1;
                    const itemUnitPrice = Number(item.price || pObj?.price || 0);
                    const itemSubtotal = itemUnitPrice * qty;

                    // Variations
                    const variations = Array.isArray(item.variations) ? item.variations : [];
                    // Addons
                    const addons = Array.isArray(item.addons) ? item.addons : [];

                    const hasImage =
                      pObj?.image &&
                      typeof pObj.image === 'string' &&
                      pObj.image !== 'string' &&
                      pObj.image.trim() !== '';

                    const categoryName = resolveName(pObj?.category?.name);
                    const subCategoryName = resolveName(pObj?.sub_category?.name);
                    const descriptionText = resolveName(pObj?.description);

                    return (
                      <div
                        key={item.id || idx}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/40 dark:hover:border-primary/40 transition-all shadow-sm space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {/* Item Number */}
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 font-mono font-black text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </div>

                            {/* Product Thumbnail */}
                            {hasImage ? (
                              <img
                                src={pObj!.image}
                                alt={pNameAr}
                                className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-400 flex items-center justify-center shrink-0">
                                <MdFastfood size={26} />
                              </div>
                            )}

                            {/* Product Names & Categories */}
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-base font-bold text-slate-900 dark:text-white">
                                  {pNameAr}
                                </h5>
                                {item.is_gift && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                    هدية مجانية 🎁
                                  </span>
                                )}
                                {categoryName && (
                                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    {categoryName}
                                  </span>
                                )}
                                {subCategoryName && (
                                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                    {subCategoryName}
                                  </span>
                                )}
                              </div>

                              {pNameEn && pNameEn !== pNameAr && (
                                <p className="text-xs text-slate-400 mt-0.5" dir="ltr">
                                  {pNameEn}
                                </p>
                              )}

                              {descriptionText && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                  {descriptionText}
                                </p>
                              )}

                              {/* Item Preparation Note */}
                              {item.note && (
                                <div className="mt-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                                  <span>ملاحظة التحضير الخاصة:</span>
                                  <span className="font-semibold">{item.note}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quantity and Price */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60">
                            {/* Prominent Quantity Badge */}
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary font-black text-sm">
                              <span>الكمية:</span>
                              <span className="text-base font-extrabold">{qty}</span>
                            </div>

                            {/* Line Pricing */}
                            <div className="text-left sm:text-right">
                              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                {itemSubtotal.toLocaleString('ar-EG')} ج.م
                              </span>
                              {qty > 1 && (
                                <p className="text-[11px] text-slate-400">
                                  ({itemUnitPrice.toLocaleString('ar-EG')} ج.م × {qty})
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Variations and Options Row */}
                        {variations.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
                              المواصفات والخيارات المختارة:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {variations.map((v: any, vIdx: number) => {
                                const varTitle =
                                  resolveName(v.name, v.name_translations, v.variation?.name);
                                const options = Array.isArray(v.options) ? v.options : [];

                                return (
                                  <div key={v.id || vIdx} className="flex flex-wrap items-center gap-1.5">
                                    {options.map((opt: any, oIdx: number) => {
                                      const optTitle =
                                        resolveName(opt.name, opt.name_translations, opt.option?.name);
                                      const optPrice = Number(opt.price || opt.option?.price || 0);

                                      return (
                                        <span
                                          key={opt.id || oIdx}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                                        >
                                          {varTitle && (
                                            <span className="font-normal opacity-80">{varTitle}:</span>
                                          )}
                                          <span>{optTitle}</span>
                                          {optPrice > 0 && (
                                            <span className="text-[11px] text-indigo-500 font-mono">
                                              (+{optPrice} ج.م)
                                            </span>
                                          )}
                                        </span>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Addons Row */}
                        {addons.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
                              الإضافات المختارة:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {addons.map((ad: any, aIdx: number) => {
                                const adTitle =
                                  resolveName(ad.name, ad.name_translations, ad.addon?.name) || 'إضافة';
                                const adPrice = Number(ad.price || ad.addon?.price || 0);
                                const adImg =
                                  ad.addon?.image &&
                                  typeof ad.addon.image === 'string' &&
                                  ad.addon.image !== 'string'
                                    ? ad.addon.image
                                    : null;

                                return (
                                  <span
                                    key={ad.id || aIdx}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60"
                                  >
                                    {adImg && (
                                      <img
                                        src={adImg}
                                        alt={adTitle}
                                        className="w-4 h-4 rounded-full object-cover"
                                      />
                                    )}
                                    <span>+ {adTitle}</span>
                                    {adPrice > 0 && (
                                      <span className="text-[11px] text-teal-500 font-mono">
                                        (+{adPrice} ج.م)
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Operations & Shift Information Tab */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Branch & Shift Details */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <h5 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                  <MdStore size={18} className="text-primary" />
                  <span>بيانات الفرع والوردية</span>
                </h5>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400">الفرع:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                      {resolveName(order.branch?.name) || 'الفرع الرئيسي'}
                    </p>
                    {order.branch?.address && (
                      <p className="text-slate-500 mt-0.5">{order.branch.address}</p>
                    )}
                    {order.branch?.watts && (
                      <p className="text-slate-500 font-mono mt-0.5" dir="ltr">
                        واتساب الفرع: {order.branch.watts}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400">الوردية:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                      {resolveName(order.shift?.name) || 'وردية افتراضية'}
                    </p>
                    {(order.shift?.start_time || order.shift?.end_time) && (
                      <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                        <MdAccessTime size={13} />
                        <span>
                          من: {order.shift?.start_time || '—'} إلى: {order.shift?.end_time || '—'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cashier & Personnel Details */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <h5 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                  <MdBadge size={18} className="text-indigo-600" />
                  <span>نقطة الكاشير والموظف المسؤول</span>
                </h5>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400">جهاز / نقطة الكاشير:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                      {order.cashier?.name || 'كاشير رئيسي'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400">موظف الكاشير المسجل:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                      {order.cashier_man?.name || order.cashier?.cashier_man_name || '—'}
                    </p>
                    {order.cashier_man?.role && (
                      <p className="text-slate-500 mt-0.5">الدور: {order.cashier_man.role}</p>
                    )}
                  </div>

                  {(order.receipt || order.reciept) && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-slate-400">رقم الفاتورة / الإيصال:</span>
                      <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {order.receipt || order.reciept}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Financial & Payment Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Financial Totals Box */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <h5 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <MdAttachMoney size={18} className="text-emerald-500" />
                <span>الحساب والملخص المالي</span>
              </h5>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold">
                    {Number(order.total || 0).toLocaleString('ar-EG')} ج.م
                  </span>
                </div>

                {Number(order.total_tax) > 0 && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>إجمالي الضريبة:</span>
                    <span className="font-bold text-indigo-600">
                      +{Number(order.total_tax).toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                )}

                {Number(order.total_discount) > 0 && (
                  <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                    <span>قيمة الخصم:</span>
                    <span className="font-bold">
                      -{Number(order.total_discount).toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-extrabold text-base text-slate-800 dark:text-white">
                    الإجمالي النهائي المطلوب:
                  </span>
                  <span className="font-black text-2xl text-emerald-600 dark:text-emerald-400">
                    {Number(order.final_price || 0).toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method & Financial Account */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
              <div>
                <h5 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2 mb-3">
                  <MdAccountBalanceWallet size={18} className="text-primary" />
                  <span>طريقة الدفع والحساب</span>
                </h5>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400">طريقة الدفع:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                      {resolveName(order.payment_method?.name) || 'دفع نقدي (Cash)'}
                    </p>
                  </div>

                  {order.financial_account?.name && (
                    <div className="pt-1">
                      <span className="text-slate-400">الخزينة / الحساب المالي:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                        {resolveName(order.financial_account.name)}
                      </p>
                    </div>
                  )}

                  {(order.receipt || order.reciept) && (
                    <div className="pt-1">
                      <span className="text-slate-400">رقم الإيصال / المرجع:</span>
                      <p className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                        {order.receipt || order.reciept}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div
                  className={`px-3 py-2 rounded-xl text-center font-bold text-xs ${
                    order.paid
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {order.paid ? 'تم تحصيل المبلغ بالكامل' : 'المبلغ مستحق للتحصيل (آجل / نقدي)'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            طلب #{order.id} • {moduleInfo.label}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <MdPrint size={16} />
              <span>طباعة بون المطبخ</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
