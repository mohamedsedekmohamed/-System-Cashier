import type { OrderModule, OrderStatus } from '../types';

/**
 * Strict Module Status Matrix:
 * الخيارات المتاحة للأدمن في تغيير الحالة مقيدة بنوع الطلب لتفادي أخطاء 422
 */
export const MODULE_ALLOWED_STATUSES: Record<OrderModule, OrderStatus[]> = {
  delivery: ['done', 'out_of_delivery', 'delivered', 'return', 'failed_to_delivered'],
  takeaway: ['done', 'pickup', 'return'],
  dinein: ['return'],
};

export interface OrderStatusConfig {
  key: OrderStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export const ORDER_STATUS_MAP: Record<string, OrderStatusConfig> = {
  preparing: {
    key: 'preparing',
    label: 'جاري التحضير',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800/60',
    dotClass: 'bg-amber-500',
    description: 'الطلب قيد التجهيز في المطبخ',
  },
  done: {
    key: 'done',
    label: 'تم التجهيز',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-300 dark:border-teal-800/60',
    dotClass: 'bg-teal-500',
    description: 'جاهز وانتهى المطبخ من تحضيره',
  },
  pickup: {
    key: 'pickup',
    label: 'جاهز للاستلام',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300 dark:border-purple-800/60',
    dotClass: 'bg-purple-500',
    description: 'جاهز للاستلام الفوري من العميل',
  },
  out_of_delivery: {
    key: 'out_of_delivery',
    label: 'جاري التوصيل',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-300 dark:border-orange-800/60',
    dotClass: 'bg-orange-500',
    description: 'خرج مع طيار الدليفري في الطريق',
  },
  delivered: {
    key: 'delivered',
    label: 'تم التوصيل',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60',
    dotClass: 'bg-emerald-500',
    description: 'تم تسليم الطلب للعميل بنجاح',
  },
  return: {
    key: 'return',
    label: 'مرتجع',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    dotClass: 'bg-slate-500',
    description: 'تم إرجاع الطلب أو إلغاؤه',
  },
  failed_to_delivered: {
    key: 'failed_to_delivered',
    label: 'فشل التوصيل',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800/60',
    dotClass: 'bg-rose-500',
    description: 'تعذر تسليم الطلب للعميل',
  },
  faild_to_delivered: {
    key: 'faild_to_delivered',
    label: 'فشل التوصيل',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800/60',
    dotClass: 'bg-rose-500',
    description: 'تعذر تسليم الطلب للعميل',
  },
};

/**
 * إرجاع الحالات المسموح للأدمن التحويل إليها بناءً على نوع الطلب
 */
export function getAllowedStatusesForModule(module?: string): OrderStatus[] {
  if (!module) return [];
  const normalized = module.toLowerCase() as OrderModule;
  return MODULE_ALLOWED_STATUSES[normalized] || [];
}

/**
 * الحصول على تكوين وتصميم شارة الحالة
 */
export function getOrderStatusConfig(status?: string): OrderStatusConfig {
  if (status && ORDER_STATUS_MAP[status]) {
    return ORDER_STATUS_MAP[status];
  }
  return {
    key: (status as OrderStatus) || 'preparing',
    label: status || 'جاري التحضير',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dotClass: 'bg-slate-400',
    description: '',
  };
}

/**
 * تشغيل نغمة صوتية تفاعلية عند استقبال طلبات جديدة عبر Web Audio API
 */
export function playNotificationChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First pleasant chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // Note D5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second bell tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // Note A5
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.debug('Notification audio blocked or unsupported', err);
  }
}
