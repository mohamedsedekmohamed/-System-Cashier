import React, { useState, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { saleApi, SALES_KEY, SALES_SELECT_OPTIONS_KEY } from '../../services/saleService';
import type { SaleFormData, SaleItemPayload, InsufficientIngredientError } from '../../types';
import {
  MdArrowForward,
  MdSave,
  MdPointOfSale,
  MdAdd,
  MdDelete,
  MdCloudUpload,
  MdClose,
  MdAttachMoney,
  MdInfoOutline,
  MdWarningAmber,
  MdCheckCircle,
  MdHourglassTop,
  MdInventory2,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { SearchableSelect } from '../../components/ui/SearchableSelect';

interface ItemFormRow {
  id: string;
  type: 'product' | 'recipe' | 'material';
  product_id: number;
  material_id: number;
  product_recipe_id: number;
  quantity: number;
  cost: number;
}

interface InstallmentRow {
  id: string;
  amount: number | '';
  date: string;
  notes: string;
}

export const SaleAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Form State ─────────────────────────
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);
  const [selectedSalerId, setSelectedSalerId] = useState<number>(0);

  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const defaultDueDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  }, []);



  const [installments, setInstallments] = useState<InstallmentRow[]>([
    {
      id: 'inst-1',
      amount: '',
      date: (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d.toISOString().split('T')[0];
      })(),
      notes: 'القسط الأول',
    },
  ]);


  const [items, setItems] = useState<ItemFormRow[]>([
    {
      id: 'item-1',
      type: 'product',
      product_id: 0,
      material_id: 0,
      product_recipe_id: 0,
      quantity: 1,
      cost: 0,
    },
  ]);

  // ── Bypass Confirmation Modal State ────
  const [bypassModalOpen, setBypassModalOpen] = useState(false);
  const [insufficientInfo, setInsufficientInfo] = useState<InsufficientIngredientError | null>(null);

  // ── Fetch Select Options ───────────────
  const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
    queryKey: [SALES_SELECT_OPTIONS_KEY, selectedBranchId],
    queryFn: () => saleApi.getSelectOptions(selectedBranchId || undefined),
  });

  const branches = optionsData?.data?.branches ?? [];
  const salers = optionsData?.data?.salers ?? [];
  const materials = optionsData?.data?.materials ?? [];
  const productRecipes = optionsData?.data?.product_recipes ?? [];
  const products = optionsData?.data?.products ?? [];

  // Auto-select first branch when branches are loaded
  React.useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  // ── Calculations ───────────────────────
  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [items]);

  const totalCost = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.cost) || 0),
      0
    );
  }, [items]);

  const actualPaid = paidAmount === '' ? totalCost : Math.min(totalCost, Math.max(0, Number(paidAmount)));
  const remainingAmount = Math.max(0, +(totalCost - actualPaid).toFixed(2));

  // ── Installment Management ─────────────
  const totalInstallmentsAmount = useMemo(() => {
    return +installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0).toFixed(2);
  }, [installments]);

  const diffInstallmentsAmount = useMemo(() => {
    return +(remainingAmount - totalInstallmentsAmount).toFixed(2);
  }, [remainingAmount, totalInstallmentsAmount]);

  // Sync single installment amount if default
  React.useEffect(() => {
    if (remainingAmount > 0) {
      setInstallments((prev) => {
        if (prev.length === 1 && (prev[0].amount === '' || prev[0].amount === 0)) {
          return [{ ...prev[0], amount: remainingAmount }];
        }
        return prev;
      });
    }
  }, [remainingAmount]);

  const handleSplitInstallments = (count: number) => {
    if (remainingAmount <= 0) return;
    const baseAmount = Math.floor((remainingAmount / count) * 100) / 100;
    const remainder = Math.round((remainingAmount - baseAmount * count) * 100) / 100;

    const newRows: InstallmentRow[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + (i + 1));
      const instAmount = i === count - 1 ? +(baseAmount + remainder).toFixed(2) : baseAmount;
      newRows.push({
        id: `inst-${Date.now()}-${i}`,
        amount: instAmount,
        date: d.toISOString().split('T')[0],
        notes: `القسط ${i + 1} من ${count}`,
      });
    }
    setInstallments(newRows);
  };

  const handleAddInstallment = () => {
    const diff = Math.max(0, +(remainingAmount - totalInstallmentsAmount).toFixed(2));
    const d = new Date();
    d.setMonth(d.getMonth() + installments.length + 1);
    setInstallments((prev) => [
      ...prev,
      {
        id: `inst-${Date.now()}-${Math.random()}`,
        amount: diff > 0 ? diff : '',
        date: d.toISOString().split('T')[0],
        notes: `القسط ${prev.length + 1}`,
      },
    ]);
  };

  const handleRemoveInstallment = (index: number) => {
    if (installments.length <= 1) return;
    setInstallments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleInstallmentChange = (index: number, field: keyof InstallmentRow, value: any) => {
    setInstallments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAdjustRemainingInLastInstallment = () => {
    if (installments.length === 0 || diffInstallmentsAmount === 0) return;
    setInstallments((prev) => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      const currentLastAmount = Number(updated[lastIndex].amount) || 0;
      const newAmount = Math.max(0, +(currentLastAmount + diffInstallmentsAmount).toFixed(2));
      updated[lastIndex] = { ...updated[lastIndex], amount: newAmount };
      return updated;
    });
  };


  // ── Create Mutation ────────────────────
  const mutation = useMutation({
    mutationFn: (payload: SaleFormData) => saleApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_KEY] });
      navigate('/dashboard/sales');
    },
    onError: (err: any) => {
      const resp = err?.response?.data;
      if (resp?.insufficient_ingredient && resp.insufficient_ingredient.can_bypass) {
        setInsufficientInfo(resp.insufficient_ingredient);
        setBypassModalOpen(true);
        return;
      }
      const msg =
        resp?.message ||
        resp?.error ||
        'حدث خطأ أثناء حفظ فاتورة المبيعات. يرجى التحقق من المدخلات والمحاولة ثانية.';
      setErrorMessage(msg);
    },
  });

  // ── Receipt File Handlers ───────────────
  const handleReceiptSelect = (file: File | null) => {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('حجم الملف كبير جداً! الحد الأقصى المسموح به هو 10 ميجابايت.');
      return;
    }
    setReceiptFile(file);
    const previewUrl = URL.createObjectURL(file);
    setReceiptPreview(previewUrl);
  };

  const handleClearReceipt = () => {
    setReceiptFile(null);
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ── Items Management ───────────────────
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        type: 'product',
        product_id: 0,
        material_id: 0,
        product_recipe_id: 0,
        quantity: 1,
        cost: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setItems([
        {
          id: `item-${Date.now()}`,
          type: 'product',
          product_id: 0,
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

  const handleTypeChange = (index: number, newType: 'product' | 'recipe' | 'material') => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        type: newType,
        product_id: 0,
        material_id: 0,
        product_recipe_id: 0,
        cost: 0,
      };
      return updated;
    });
  };

  const handleItemSelectChange = (index: number, val: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (current.type === 'product') {
        const found = products.find((p) => p.id === val);
        updated[index] = {
          ...current,
          product_id: val,
          material_id: 0,
          product_recipe_id: 0,
          cost: found?.price ? Number(found.price) : current.cost,
        };
      } else if (current.type === 'material') {
        updated[index] = { ...current, material_id: val, product_id: 0, product_recipe_id: 0 };
      } else {
        updated[index] = { ...current, product_recipe_id: val, product_id: 0, material_id: 0 };
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

  // ── Build & Send Payload ───────────────
  const executeSubmit = (bypass = false) => {
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage('يجب إضافة صنف واحد على الأقل في فاتورة المبيعات.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const hasSelection =
        item.type === 'product'
          ? item.product_id > 0
          : item.type === 'material'
          ? item.material_id > 0
          : item.product_recipe_id > 0;

      if (!hasSelection) {
        setErrorMessage(`يرجى تحديد الصنف في البند رقم #${i + 1}`);
        return;
      }
      if (!item.quantity || item.quantity < 0.01) {
        setErrorMessage(`الكمية في البند رقم #${i + 1} يجب أن تكون 0.01 على الأقل.`);
        return;
      }
      if (item.cost < 0) {
        setErrorMessage(`سعر البيع في البند رقم #${i + 1} لا يمكن أن يكون سالباً.`);
        return;
      }
    }

    if (!selectedBranchId) {
      setErrorMessage('يرجى اختيار الفرع.');
      return;
    }

    if (remainingAmount > 0) {

      if (Math.abs(diffInstallmentsAmount) > 0.01) {
        setErrorMessage(
          `إجمالي مبالغ الأقساط (${totalInstallmentsAmount.toLocaleString('ar-EG')} ج.م) لا يتطابق مع المبلغ المتبقي الآجل (${remainingAmount.toLocaleString('ar-EG')} ج.م). يرجى ضبط مبالغ الأقساط.`
        );
        return;
      }

      for (let i = 0; i < installments.length; i++) {
        const inst = installments[i];
        if (!inst.amount || Number(inst.amount) <= 0) {
          setErrorMessage(`يرجى تحديد مبلغ صحيح للقسط رقم #${i + 1}`);
          return;
        }
        if (!inst.date) {
          setErrorMessage(`يرجى تحديد تاريخ استحقاق القسط رقم #${i + 1}`);
          return;
        }
      }
    }

    const payloadItems: SaleItemPayload[] = items.map((item) => ({
      product_id: item.type === 'product' ? item.product_id : null,
      material_id: item.type === 'material' ? item.material_id : null,
      product_recipe_id: item.type === 'recipe' ? item.product_recipe_id : null,
      quantity: Number(item.quantity),
      cost: Number(item.cost),
    }));

    const payloadDues = remainingAmount > 0
      ? installments.map((inst) => ({
          amount: Number(inst.amount),
          date: inst.date,
          notes: inst.notes.trim() || undefined,
        }))
      : undefined;

    const payload: SaleFormData = {
      branch_id: selectedBranchId,
      saler_id: selectedSalerId || null,
      paid_amount: actualPaid,
      due_date: remainingAmount > 0 ? (payloadDues?.[0]?.date || defaultDueDate) : undefined,
      dues: payloadDues,

      without_recipe: bypass,
      receipt: receiptFile,
      notes: notes.trim() || undefined,
      items: payloadItems,
    };


    mutation.mutate(payload);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSubmit(false);
  };

  const handleConfirmBypass = () => {
    setBypassModalOpen(false);
    executeSubmit(true);
  };

  // Find saler name for feedback
  const currentSaler = salers.find((s) => s.id === selectedSalerId);
  const currentSalerName = currentSaler?.name
    ? typeof currentSaler.name === 'object'
      ? (currentSaler.name as any).ar || (currentSaler.name as any).en || ''
      : currentSaler.name
    : '';

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/sales"
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <MdArrowForward size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <MdPointOfSale size={24} />
              </span>
              تسجيل فاتورة مبيعات جديدة
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              بيع المنتجات التامة أو غير التامة أو المواد الخام، وخصم المخزون ومتابعة المديونية الآجلة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending || isLoadingOptions}
          className="hidden sm:inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
        >
          {mutation.isPending ? (
            <>
              <AiOutlineLoading3Quarters size={18} className="animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <MdSave size={18} />
              حفظ الفاتورة
            </>
          )}
        </button>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
          <MdInfoOutline size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-rose-700 dark:text-rose-300 font-medium">
            {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-600"
          >
            <MdClose size={18} />
          </button>
        </div>
      )}

      {/* Basic Settings Card: Branch & Saler */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span>بيانات الفرع والعميل / الموزع</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Branch Select */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              الفرع البائع *
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-medium focus:ring-primary focus:border-primary text-slate-800 dark:text-slate-200"
            >
              {branches.length === 0 ? (
                <option value={0}>جاري التحميل...</option>
              ) : (
                branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {typeof b.name === 'object' && b.name !== null
                      ? (b.name as any)?.ar || (b.name as any)?.en || ''
                      : b.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Saler Select */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              العميل / الموزع (اختياري)
            </label>
            <select
              value={selectedSalerId}
              onChange={(e) => setSelectedSalerId(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-medium focus:ring-primary focus:border-primary text-slate-800 dark:text-slate-200"
            >
              <option value={0}>عميل نقدي مباشر (بدون تسجيل مديونية)</option>
              {salers.map((s) => (
                <option key={s.id} value={s.id}>
                  {typeof s.name === 'object' && s.name !== null
                    ? (s.name as any)?.ar || (s.name as any)?.en || ''
                    : s.name}{' '}
                  (رصيد المديونية: {Number(s.balance || 0).toLocaleString('ar-EG')} ج.م)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sale Items Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <MdInventory2 size={20} className="text-emerald-600" />
              <span>بنود وأصناف المبيعات</span>
              <span className="text-xs font-normal text-slate-400">({items.length} صنف)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              يمكنك بيع منتجات منتهية التصنيع (يُسحب مكونات وصفتها تلقائياً) أو مواد خام أو وصفات نصف مصنعة
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 transition-colors text-xs border border-emerald-200 dark:border-emerald-800"
          >
            <MdAdd size={16} />
            إضافة صنف
          </button>
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {items.map((item, index) => {
            // Options based on selected row type
            const selectOptions =
              item.type === 'product'
                ? products.map((p) => ({
                    value: p.id,
                    label: p.name,
                    subtext: p.price ? `السعر: ${Number(p.price).toLocaleString('ar-EG')} ج.م` : undefined,
                  }))
                : item.type === 'material'
                ? materials.map((m) => ({
                    value: m.id,
                    label: m.name,
                    subtext: `المتاح: ${m.stock ?? 0}`,
                  }))
                : productRecipes.map((r) => ({
                    value: r.id,
                    label: r.name,
                    subtext: `المتاح: ${r.stock ?? 0}`,
                  }));

            const currentValue =
              item.type === 'product'
                ? item.product_id
                : item.type === 'material'
                ? item.material_id
                : item.product_recipe_id;

            const rowSubtotal = Number(item.quantity || 0) * Number(item.cost || 0);

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col md:flex-row md:items-end gap-3.5"
              >
                {/* 1. Type selector */}
                <div className="w-full md:w-36">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    نوع الصنف
                  </label>
                  <select
                    value={item.type}
                    onChange={(e) =>
                      handleTypeChange(index, e.target.value as 'product' | 'recipe' | 'material')
                    }
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-emerald-500"
                  >
                    <option value="product">منتج تام (Product)</option>
                    <option value="material">مادة خام (Material)</option>
                    <option value="recipe">وصفة نصف مصنعة</option>
                  </select>
                </div>

                {/* 2. Item select */}
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    اختر الصنف *
                  </label>
                  <SearchableSelect
                    options={selectOptions}
                    value={currentValue}
                    onChange={(val) => handleItemSelectChange(index, Number(val))}
                    placeholder={`ابحث واختر ${
                      item.type === 'product' ? 'المنتج' : item.type === 'material' ? 'المادة الخام' : 'الوصفة'
                    }...`}
                    disabled={isLoadingOptions}
                  />
                </div>

                {/* 3. Quantity */}
                <div className="w-full md:w-28">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    الكمية المباعة
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={item.quantity || ''}
                    onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm text-center font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-emerald-500"
                  />
                </div>

                {/* 4. Unit Cost / Selling Price */}
                <div className="w-full md:w-32">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    سعر البيع (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.cost || ''}
                    onChange={(e) => handleCostChange(index, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm text-center font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-emerald-500"
                  />
                </div>

                {/* 5. Subtotal */}
                <div className="w-full md:w-28 text-left md:text-right py-2">
                  <span className="block text-xs text-slate-400 mb-1">الإجمالي</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {rowSubtotal.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>

                {/* 6. Remove Button */}
                <div className="flex justify-end pb-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                    title="حذف البند"
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment & Deferred Dues Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <MdAttachMoney size={22} className="text-emerald-600" />
          <span>الدفع والتحصيل والمبالغ الآجلة (Dues)</span>
        </h3>

        {/* Totals Summary row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              إجمالي قيمة الفاتورة
            </span>
            <p className="text-2xl font-black text-slate-800 dark:text-white">
              {totalCost.toLocaleString('ar-EG')} <span className="text-sm font-normal">ج.م</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
              المدفوع نقداً الآن
            </span>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {actualPaid.toLocaleString('ar-EG')} <span className="text-sm font-normal">ج.م</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/40">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block mb-1">
              المتبقي (الآجل المستحق)
            </span>
            <p className="text-2xl font-black text-rose-700 dark:text-rose-300">
              {remainingAmount.toLocaleString('ar-EG')} <span className="text-sm font-normal">ج.م</span>
            </p>
          </div>
        </div>

        {/* Payment input fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                المبلغ المدفوع الآن (ج.م)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaidAmount(totalCost)}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  دفع بالكامل
                </button>
                <button
                  type="button"
                  onClick={() => setPaidAmount(0)}
                  className="text-xs font-bold text-rose-600 hover:underline"
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-bold focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Installment Schedule Builder (when remainingAmount > 0) */}

        {remainingAmount > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <MdHourglassTop size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    جدولة أقساط المبلغ المتبقي الآجل ({remainingAmount.toLocaleString('ar-EG')} ج.م)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    يمكنك تقسيم المبلغ على عدة أقساط وتحديد موعد وبيان كل قسط
                  </p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 ml-1">تقسيم سريع:</span>
                <button
                  type="button"
                  onClick={() => handleSplitInstallments(2)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-emerald-500/10 hover:text-emerald-600 dark:bg-slate-700 dark:hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  قسطين
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitInstallments(3)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-emerald-500/10 hover:text-emerald-600 dark:bg-slate-700 dark:hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  3 أقساط
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitInstallments(4)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-emerald-500/10 hover:text-emerald-600 dark:bg-slate-700 dark:hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  4 أقساط
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitInstallments(6)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-emerald-500/10 hover:text-emerald-600 dark:bg-slate-700 dark:hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  6 أقساط
                </button>
                <button
                  type="button"
                  onClick={handleAddInstallment}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <MdAdd size={14} />
                  إضافة قسط
                </button>
              </div>
            </div>

            {/* Installments Table / Rows */}
            <div className="space-y-2.5">
              {installments.map((inst, idx) => (
                <div
                  key={inst.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  <div className="md:col-span-1 flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 md:hidden">
                      القسط #{idx + 1}
                    </span>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      قيمة القسط (ج.م) *
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      value={inst.amount}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                        handleInstallmentChange(idx, 'amount', val);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      تاريخ الاستحقاق *
                    </label>
                    <input
                      type="date"
                      required
                      value={inst.date}
                      onChange={(e) => handleInstallmentChange(idx, 'date', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      بيان / ملاحظات القسط (اختياري)
                    </label>
                    <input
                      type="text"
                      value={inst.notes}
                      onChange={(e) => handleInstallmentChange(idx, 'notes', e.target.value)}
                      placeholder="مثال: دفعة مؤجلة، شيك بنكي..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    {installments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInstallment(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="حذف القسط"
                      >
                        <MdDelete size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Validation Indicator Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">مجموع الأقساط:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {totalInstallmentsAmount.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">المبلغ الآجل المطلوب:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {remainingAmount.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>

              <div>
                {Math.abs(diffInstallmentsAmount) < 0.01 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    <MdCheckCircle size={15} />
                    مجموع الأقساط مطابق تماماً للمبلغ الآجل
                  </span>
                ) : diffInstallmentsAmount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                      متبقي لم يتم توزيعه: {diffInstallmentsAmount.toLocaleString('ar-EG')} ج.م
                    </span>
                    <button
                      type="button"
                      onClick={handleAdjustRemainingInLastInstallment}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                    >
                      إضافة الفارق للقسط الأخير
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                      مجموع الأقساط يزيد بـ {Math.abs(diffInstallmentsAmount).toLocaleString('ar-EG')} ج.م
                    </span>
                    <button
                      type="button"
                      onClick={handleAdjustRemainingInLastInstallment}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors"
                    >
                      خصم الزيادة من القسط الأخير
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Saler balance notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <MdHourglassTop size={18} className="flex-shrink-0" />
              <span>
                {selectedSalerId && currentSalerName
                  ? `سيتم تسجيل مبلغ ${remainingAmount.toLocaleString('ar-EG')} ج.م كمديونية على العميل/الموزع (${currentSalerName}) موزعة على ${installments.length} قسط وزيادة رصيده تلقائياً.`
                  : `تنبيه: المبلغ المتبقي (${remainingAmount.toLocaleString('ar-EG')} ج.م) آجل ولكن لم يتم تحديد موزع/عميل. يفضل اختيار موزع لربط المديونية بحسابه.`}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Receipt & Notes Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-white">
          مستند الفاتورة والملاحظات
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              صورة الفاتورة أو إيصال التسليم
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleReceiptSelect(e.target.files?.[0] || null)}
              className="hidden"
            />

            {receiptPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48 flex items-center justify-center bg-slate-900">
                <img src={receiptPreview} alt="Receipt preview" className="max-h-48 object-contain" />
                <button
                  type="button"
                  onClick={handleClearReceipt}
                  className="absolute top-2 left-2 p-1.5 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-md"
                  title="حذف الصورة"
                >
                  <MdClose size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/30"
              >
                <MdCloudUpload size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  اضغط لاختيار صورة الإيصال (PNG, JPG, WebP)
                </p>
                <p className="text-[11px] text-slate-400 mt-1">الحد الأقصى: 10 ميجابايت</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              ملاحظات إضافية
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أي ملاحظات أو شروط تسليم متعلقة بهذه الفاتورة..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-between z-20 lg:pr-64">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            إجمالي الكمية: <strong className="text-slate-800 dark:text-white">{totalQuantity.toLocaleString('ar-EG')}</strong>
          </span>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            القيمة:
          </span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {totalCost.toLocaleString('ar-EG')} ج.م
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/sales"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
          >
            إلغاء
          </Link>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending || isLoadingOptions}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/25 transition-all text-sm disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <AiOutlineLoading3Quarters size={18} className="animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <MdSave size={18} />
                حفظ الفاتورة
              </>
            )}
          </button>
        </div>
      </div>

      {/* Insufficient Stock Recipe Bypass Confirmation Modal */}
      {bypassModalOpen && insufficientInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border border-amber-200 dark:border-amber-800 p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex-shrink-0">
                <MdWarningAmber size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  عجز في مخزون الوصفة / المكونات
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  المخزون المتوفر للمكون غير كافٍ لتغطية كامل متطلبات هذه الفاتورة.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">اسم المكون:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {insufficientInfo.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المخزون المتوفر بالفرع:</span>
                <span className="font-bold text-emerald-600">
                  {insufficientInfo.available_stock}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الكمية المطلوبة:</span>
                <span className="font-bold text-rose-600">
                  {insufficientInfo.required_quantity}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/50">
              هل ترغب في تأكيد عملية البيع على أي حال وتجاوز الكمية غير المتوفرة؟
              <br />
              <strong>ملاحظة:</strong> سيتم سحب المتوفر بالمخزون دون النزول إلى السالب (سيصبح المخزون صفراً).
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBypassModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                تعديل الفاتورة
              </button>

              <button
                type="button"
                onClick={handleConfirmBypass}
                disabled={mutation.isPending}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-600/20"
              >
                <MdCheckCircle size={18} />
                تأكيد البيع على كل حال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleAdd;
