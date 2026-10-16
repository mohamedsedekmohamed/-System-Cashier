import React, { useState, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchaseApi, PURCHASES_KEY, PURCHASES_SELECT_OPTIONS_KEY } from '../../services/purchaseService';
import type { PurchaseFormData, PurchaseItemPayload } from '../../types';
import {
  MdArrowForward,
  MdSave,
  MdShoppingBag,
  MdAdd,
  MdDelete,
  MdCloudUpload,
  MdClose,
  MdLayers,
  MdReceipt,
  MdInfoOutline,
  MdAttachMoney,
  MdHourglassTop,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { SearchableSelect } from '../../components/ui/SearchableSelect';

interface ItemFormRow {
  id: string; // local unique key
  type: 'material' | 'recipe';
  material_id: number;
  product_recipe_id: number;
  quantity: number;
  cost: number;
}

export const PurchaseAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Form State ─────────────────────────
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [items, setItems] = useState<ItemFormRow[]>([
    {
      id: 'item-1',
      type: 'material',
      material_id: 0,
      product_recipe_id: 0,
      quantity: 1,
      cost: 0,
    },
  ]);

  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(0);

  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });

  // ── Fetch Select Options (Guarded by Purchase permissions) ───────────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [PURCHASES_SELECT_OPTIONS_KEY, selectedBranchId],
    queryFn: () => purchaseApi.getSelectOptions(selectedBranchId || undefined),
  });

  const branches = optionsData?.data?.branches ?? [];
  const suppliers = optionsData?.data?.suppliers ?? [];
  const materials = optionsData?.data?.materials ?? [];
  const productRecipes = optionsData?.data?.product_recipes ?? [];

  // Auto-select first branch when branches are loaded
  React.useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  // ── Create Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: (payload: PurchaseFormData) => purchaseApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASES_KEY] });
      navigate('/dashboard/purchases');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'حدث خطأ أثناء حفظ فاتورة المشتريات. يرجى التحقق من المدخلات والمحاولة ثانية.';
      setErrorMessage(msg);
    },
  });

  // ── Receipt File Handlers ───────────────
  const handleReceiptSelect = (file: File | null) => {
    if (!file) return;

    // Check size <= 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('حجم الملف كبير جداً! الحد الأقصى المسموح به هو 10 ميجابايت.');
      return;
    }

    setReceiptFile(file);
    const objectUrl = URL.createObjectURL(file);
    setReceiptPreview(objectUrl);
  };

  const handleRemoveReceipt = () => {
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
    }
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ── Dynamic Items Handlers ─────────────
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        type: 'material',
        material_id: 0,
        product_recipe_id: 0,
        quantity: 1,
        cost: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      // Reset the single item
      setItems([
        {
          id: `item-${Date.now()}`,
          type: 'material',
          material_id: 0,
          product_recipe_id: 0,
          quantity: 1,
          cost: 0,
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleTypeChange = (index: number, newType: 'material' | 'recipe') => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        type: newType,
        material_id: 0,
        product_recipe_id: 0,
      };
      return updated;
    });
  };

  const handleItemSelectChange = (index: number, val: number) => {
    setItems((prev) => {
      const updated = [...prev];
      if (updated[index].type === 'material') {
        updated[index] = { ...updated[index], material_id: val, product_recipe_id: 0 };
      } else {
        updated[index] = { ...updated[index], product_recipe_id: val, material_id: 0 };
      }
      return updated;
    });
  };

  const handleQuantityChange = (index: number, val: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: Math.max(0, val) };
      return updated;
    });
  };

  const handleCostChange = (index: number, val: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], cost: Math.max(0, val) };
      return updated;
    });
  };

  // ── Financial Calculations ─────────────
  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [items]);

  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.cost) || 0), 0);
  }, [items]);

  const actualPaid = paidAmount === '' ? totalCost : Math.min(totalCost, Math.max(0, Number(paidAmount)));
  const remainingAmount = Math.max(0, totalCost - actualPaid);

  // ── Form Submit ─────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (items.length === 0) {
      setErrorMessage('يجب إضافة صنف واحد على الأقل في فاتورة المشتريات.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const hasSelection = item.type === 'material' ? item.material_id > 0 : item.product_recipe_id > 0;
      if (!hasSelection) {
        setErrorMessage(`يرجى تحديد الصنف في البند رقم #${i + 1}`);
        return;
      }
      if (!item.quantity || item.quantity < 0.01) {
        setErrorMessage(`الكمية في البند رقم #${i + 1} يجب أن تكون 0.01 على الأقل.`);
        return;
      }
      if (item.cost < 0) {
        setErrorMessage(`سعر التكلفة في البند رقم #${i + 1} لا يمكن أن يكون سالباً.`);
        return;
      }
    }

    const payloadItems: PurchaseItemPayload[] = items.map((item) => ({
      material_id: item.type === 'material' ? item.material_id : null,
      product_recipe_id: item.type === 'recipe' ? item.product_recipe_id : null,
      quantity: Number(item.quantity),
      cost: Number(item.cost),
    }));

    if (!selectedBranchId) {
      setErrorMessage('يرجى اختيار الفرع المستلم للمشتريات.');
      return;
    }

    const payload: PurchaseFormData = {
      branch_id: selectedBranchId,
      supplier_id: selectedSupplierId || null,
      paid_amount: actualPaid,
      due_date: remainingAmount > 0 ? dueDate : undefined,
      receipt: receiptFile,
      notes: notes.trim() || undefined,
      items: payloadItems,
    };

    mutation.mutate(payload);
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/purchases"
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <MdArrowForward size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <MdShoppingBag size={24} />
              </span>
              تسجيل فاتورة مشتريات جديدة
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              إدخال مشتريات المواد الخام والمنتجات غير منتهية التصنيع وتحديث المخزون
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending || isLoadingOptions}
          className="hidden sm:inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
        >
          {mutation.isPending ? (
            <AiOutlineLoading3Quarters size={18} className="animate-spin" />
          ) : (
            <MdSave size={20} />
          )}
          حفظ الفاتورة
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 flex items-start gap-3 text-rose-700 dark:text-rose-400">
          <MdInfoOutline size={22} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Info Grid (Receipt & Notes) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notes Section */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <MdReceipt size={20} className="text-primary" />
              بيانات وملاحظات الفاتورة
            </h3>

            {/* Branch & Supplier Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Branch Selection (Required) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  الفرع المستلم للبضاعة (المخزن) <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  id="selected-branch"
                  value={selectedBranchId || ''}
                  onChange={(val) => setSelectedBranchId(Number(val))}
                  options={branches}
                  placeholder="-- اختر الفرع --"
                  searchPlaceholder="ابحث عن الفرع..."
                  disabled={isLoadingOptions}
                  required
                />
              </div>

              {/* Supplier Selection (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  المورد (اختياري)
                </label>
                <SearchableSelect
                  id="selected-supplier"
                  value={selectedSupplierId || ''}
                  onChange={(val) => setSelectedSupplierId(Number(val))}
                  options={suppliers}
                  placeholder="-- اختر المورد --"
                  searchPlaceholder="ابحث عن المورد..."
                  disabled={isLoadingOptions}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                ملاحظات أو رقم مرجع المورد (اختياري)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="أدخل أي تفاصيل خاصة بالفاتورة، اسم المورد، رقم الفاتورة الورقية..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-primary focus:outline-none focus:ring-2 ring-primary/20 text-slate-800 dark:text-slate-100 text-sm transition-all resize-none"
              />
            </div>
          </div>

          {/* Receipt Upload Box */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 flex flex-col">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <MdCloudUpload size={20} className="text-primary" />
              إرفاق صورة الإيصال
            </h3>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleReceiptSelect(e.target.files?.[0] || null)}
            />

            {receiptPreview ? (
              <div className="relative flex-1 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center min-h-[140px]">
                <img
                  src={receiptPreview}
                  alt="Receipt Preview"
                  className="w-full h-full max-h-48 object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveReceipt}
                  className="absolute top-2 left-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-colors"
                  title="إلغاء الإيصال"
                >
                  <MdClose size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px]"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <MdCloudUpload size={24} />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  اضغط لرفع صورة الإيصال
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  JPG, PNG, WEBP (بحد أقصى 10MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Items Table */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MdLayers size={22} className="text-primary" />
                بنود المشتريات
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                حدد المادة أو الوصفة والكمية وسعر التكلفة لكل وحدة
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-primary/10 hover:text-primary text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
            >
              <MdAdd size={18} />
              إضافة صنف آخر
            </button>
          </div>

          {/* Rows */}
          <div className="p-6 space-y-4">
            {items.map((row, index) => {
              const rowSubtotal = (Number(row.quantity) || 0) * (Number(row.cost) || 0);

              return (
                <div
                  key={row.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    
                    {/* Index & Type Selector */}
                    <div className="md:col-span-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          بند #{index + 1} نوع الصنف
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-1 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleTypeChange(index, 'material')}
                          className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                            row.type === 'material'
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                        >
                          مادة خام
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTypeChange(index, 'recipe')}
                          className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                            row.type === 'recipe'
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                        >
                          وصفة منتج
                        </button>
                      </div>
                    </div>

                    {/* Item Select */}
                    <div className="md:col-span-4">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                        {row.type === 'material' ? 'اختر المادة الخام' : 'اختر وصفة المنتج'}
                      </label>
                      <SearchableSelect
                        id={`item-select-${index}`}
                        value={row.type === 'material' ? row.material_id : row.product_recipe_id}
                        onChange={(val) => handleItemSelectChange(index, Number(val))}
                        options={row.type === 'material' ? materials : productRecipes}
                        labelExtractor={(item) => `${item.name}${item.stock !== undefined ? ` (المخزون الحالي: ${item.stock})` : ''}`}
                        placeholder={isLoadingOptions ? 'جاري التحميل...' : '-- اختر الصنف --'}
                        searchPlaceholder="ابحث عن الصنف..."
                        disabled={isLoadingOptions}
                      />
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                        الكمية
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={row.quantity || ''}
                        onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary focus:outline-none text-slate-800 dark:text-slate-100 text-xs font-bold text-center"
                        placeholder="1"
                      />
                    </div>

                    {/* Unit Cost */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                        سعر الوحدة (ج.م)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.cost || ''}
                        onChange={(e) => handleCostChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary focus:outline-none text-slate-800 dark:text-slate-100 text-xs font-bold text-center"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Subtotal & Delete */}
                    <div className="md:col-span-1 flex items-center justify-between md:justify-end gap-2">
                      <div className="text-left md:hidden">
                        <span className="text-[10px] text-slate-400 block">الإجمالي:</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {rowSubtotal.toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/50 transition-colors"
                        title="حذف البند"
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>

                  </div>

                  {/* Subtotal display for desktop */}
                  <div className="hidden md:flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/40 text-xs">
                    <span className="text-slate-400">إجمالي هذا البند:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {rowSubtotal.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment and Deferred Dues Section */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <MdAttachMoney size={20} className="text-primary" />
              <span>الدفع والمبالغ الآجلة (Dues)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">إجمالي الفاتورة</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">
                  {totalCost.toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-800/40">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 block mb-1">المدفوع نقداً الآن</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                  {actualPaid.toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-800/40">
                <span className="text-xs text-rose-600 dark:text-rose-400 block mb-1">المتبقي (الآجل المستحق)</span>
                <span className="text-xl font-black text-rose-700 dark:text-rose-300">
                  {remainingAmount.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    المبلغ المدفوع الآن (ج.م)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(totalCost)}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      دفع بالكامل
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidAmount(0)}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      آجل بالكامل
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max={totalCost}
                  step="any"
                  value={paidAmount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                    setPaidAmount(val);
                  }}
                  placeholder={`الافتراضي: ${totalCost} ج.م`}
                  className="w-full px-4 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-primary"
                />
              </div>

              {remainingAmount > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    تاريخ استحقاق المبلغ الآجل ({remainingAmount.toLocaleString('ar-EG')} ج.م) *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-primary"
                  />
                </div>
              )}
            </div>

            {remainingAmount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <MdHourglassTop size={16} className="shrink-0" />
                <span>
                  {selectedSupplierId && suppliers.find((s) => s.id === selectedSupplierId)?.name
                    ? `سيتم تسجيل مبلغ ${remainingAmount.toLocaleString('ar-EG')} ج.م كمديونية لصالح المورد (${
                        typeof suppliers.find((s) => s.id === selectedSupplierId)?.name === 'object'
                          ? (suppliers.find((s) => s.id === selectedSupplierId)?.name as any)?.ar || ''
                          : suppliers.find((s) => s.id === selectedSupplierId)?.name
                      }) وزيادة رصيده تلقائياً.`
                    : `تنبيه: المبلغ المتبقي (${remainingAmount.toLocaleString('ar-EG')} ج.م) آجل ولكن لم يتم تحديد مورد. يفضل اختيار مورد لربط المديونية بحسابه.`}
                </span>
              </div>
            )}
          </div>

          {/* Table Footer with Summary */}
          <div className="p-6 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  عدد الأصناف
                </span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {items.length}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  إجمالي الكميات
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {totalQuantity.toLocaleString('ar-EG')}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  إجمالي التكلفة
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {totalCost.toLocaleString('ar-EG')} <span className="text-sm font-normal">ج.م</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/dashboard/purchases"
                className="px-5 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
              >
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={mutation.isPending || isLoadingOptions}
                className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <AiOutlineLoading3Quarters size={18} className="animate-spin" />
                ) : (
                  <MdSave size={18} />
                )}
                حفظ الفاتورة
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PurchaseAdd;
