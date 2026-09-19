import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderService, ORDERS_KEY } from '../../services/orderService';
import type { OrderFormData, OrderProduct } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { MdArrowForward, MdSave, MdEdit, MdDelete, MdAdd } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { renderName } from '../../utils/helpers';

const OrderEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<OrderFormData>({
    shift_id: 0,
    cashier_id: 0,
    cashier_man_id: 0,
    hall_table_id: null,
    module: 'takeaway',
    address: '',
    note: '',
    phone: '',
    name: '',
    is_pos: true,
    total: 0,
    total_tax: 0,
    total_discount: 0,
    final_price: 0,
    products: []
  });

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch Order Details
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    isError: isOrderError,
    error: orderError,
    refetch: refetchOrder
  } = useQuery({
    queryKey: [ORDERS_KEY, id],
    queryFn: () => orderService.get(id as string),
    enabled: !!id,
  });

  // Fetch Options
  const {
    data: optionsData,
    isLoading: isLoadingOptions,
    isError: isOptionsError,
    error: optionsError,
    refetch: refetchOptions
  } = useQuery({
    queryKey: ['orderSelectOptions'],
    queryFn: () => orderService.getSelectOptions(),
  });

  const order = orderData?.data;
  const options = optionsData?.data;
  const branches = options?.branches ?? [];
  const cashiers = options?.cashiers ?? [];
  const shifts = options?.shifts ?? [];
  const cashierMen = options?.cashier_men ?? [];
  const hallTables = options?.hall_tables ?? [];

  // Filter dropdowns by selected branch
  const filteredCashiers = selectedBranchId 
    ? cashiers.filter((c: any) => c.branch_id === selectedBranchId)
    : cashiers;

  const filteredShifts = selectedBranchId 
    ? shifts.filter((s: any) => s.branch_id === selectedBranchId)
    : shifts;

  const filteredCashierMen = selectedBranchId 
    ? cashierMen.filter((m: any) => m.branch_id === selectedBranchId)
    : cashierMen;

  const filteredHallTables = selectedBranchId 
    ? hallTables.filter((t: any) => t.branch_id === selectedBranchId)
    : hallTables;

  // Initialize form when order and options are available
  useEffect(() => {
    if (order && options && !isInitialized) {
      let bId = 0;
      if (order.cashier_id) {
        const found = cashiers.find((c: any) => c.id === order.cashier_id);
        if (found?.branch_id) bId = found.branch_id;
      }
      if (!bId && order.hall_table_id) {
        const foundTable = hallTables.find((t: any) => t.id === order.hall_table_id);
        if (foundTable?.branch_id) bId = foundTable.branch_id;
      }
      if (!bId && order.shift_id) {
        const foundShift = shifts.find((s: any) => s.id === order.shift_id);
        if (foundShift?.branch_id) bId = foundShift.branch_id;
      }

      setSelectedBranchId(bId);

      const customerName = typeof order.name === 'string' 
        ? order.name 
        : (renderName(order.name) || '');

      setFormData({
        shift_id: order.shift_id || 0,
        cashier_id: order.cashier_id || 0,
        cashier_man_id: order.cashier_man_id || 0,
        hall_table_id: order.hall_table_id || null,
        module: order.module || 'takeaway',
        address: order.address || '',
        note: order.note || '',
        phone: order.phone || '',
        name: customerName,
        is_pos: Boolean(order.is_pos),
        total: Number(order.total) || 0,
        total_tax: Number(order.total_tax) || 0,
        total_discount: Number(order.total_discount) || 0,
        final_price: Number(order.final_price) || 0,
        products: (order.products || []).map((p: any) => ({
          product_id: p.product_id || p.id,
          price: Number(p.price) || 0,
          note: p.note || '',
          variations: p.variations || [],
          addons: p.addons || [],
        }))
      });

      setIsInitialized(true);
    }
  }, [order, options, isInitialized, cashiers, hallTables, shifts]);

  const handleBranchChange = (newBranchId: number) => {
    setSelectedBranchId(newBranchId);
    setValidationError(null);

    setFormData(prev => {
      const next = { ...prev };
      if (newBranchId > 0) {
        const bCashiers = cashiers.filter((c: any) => c.branch_id === newBranchId);
        const bShifts = shifts.filter((s: any) => s.branch_id === newBranchId);
        const bMen = cashierMen.filter((m: any) => m.branch_id === newBranchId);
        const bTables = hallTables.filter((t: any) => t.branch_id === newBranchId);

        if (!bCashiers.some((c: any) => c.id === next.cashier_id)) {
          next.cashier_id = bCashiers.length > 0 ? bCashiers[0].id : 0;
        }
        if (!bShifts.some((s: any) => s.id === next.shift_id)) {
          next.shift_id = bShifts.length > 0 ? bShifts[0].id : 0;
        }
        if (!bMen.some((m: any) => m.id === next.cashier_man_id)) {
          next.cashier_man_id = bMen.length > 0 ? bMen[0].id : 0;
        }
        if (next.hall_table_id && !bTables.some((t: any) => t.id === next.hall_table_id)) {
          next.hall_table_id = null;
        }
      }
      return next;
    });
  };

  // Selected product state for the "add to cart" form
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [selectedVariations, setSelectedVariations] = useState<Record<number, number>>({});
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [productNote, setProductNote] = useState('');

  // Calculate totals when products or discount change after initialization
  useEffect(() => {
    if (!isInitialized) return;

    let subtotal = 0;
    formData.products.forEach(p => {
      subtotal += p.price;
    });

    const tax = subtotal * 0.15;
    const discount = formData.total_discount || 0;
    const finalPrice = Math.max(0, subtotal + tax - discount);

    setFormData(prev => ({
      ...prev,
      total: subtotal,
      total_tax: tax,
      final_price: finalPrice
    }));
  }, [formData.products, formData.total_discount, isInitialized]);

  const mutation = useMutation({
    mutationFn: (payload: OrderFormData) => orderService.update(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });
      navigate('/dashboard/orders');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setValidationError(null);

    if (name === 'module') {
      setFormData(prev => ({
        ...prev,
        module: value,
        hall_table_id: value === 'dine_in' ? prev.hall_table_id : null,
      }));
      return;
    }

    if (name === 'hall_table_id') {
      const valNum = Number(value);
      setFormData(prev => ({
        ...prev,
        hall_table_id: valNum > 0 ? valNum : null,
      }));
      return;
    }

    if (name === 'cashier_id') {
      const cashierId = Number(value);
      const chosen = cashiers.find((c: any) => c.id === cashierId);
      if (chosen?.branch_id && selectedBranchId !== chosen.branch_id) {
        setSelectedBranchId(chosen.branch_id);
      }
      setFormData(prev => ({ ...prev, cashier_id: cashierId }));
      return;
    }

    const isNumber = ['shift_id', 'cashier_man_id', 'total_discount'].includes(name);

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (isNumber ? Number(value) : value),
    }));
  };

  const handleAddProduct = () => {
    if (!selectedProductId || !options?.products) return;

    const productDef = options.products.find(p => p.id === selectedProductId);
    if (!productDef) return;

    let itemPrice = Number(productDef.price);
    const variationsArr: any[] = [];

    // Process selected variations
    Object.entries(selectedVariations).forEach(([varIdStr, optId]) => {
      const varId = Number(varIdStr);
      const variationDef = productDef.variations?.find((v: any) => v.id === varId);
      if (variationDef) {
        const optionDef = variationDef.options?.find((o: any) => o.id === optId);
        if (optionDef) {
          itemPrice += Number(optionDef.price);
          variationsArr.push({
            variation_id: varId,
            options: [{ option_id: optId, price: Number(optionDef.price) }]
          });
        }
      }
    });

    const addonsArr: any[] = [];
    selectedAddons.forEach(addonId => {
      const addonDef = options.addons?.find((a: any) => a.id === addonId);
      if (addonDef) {
        itemPrice += Number(addonDef.price);
        addonsArr.push({
          addon_id: addonId,
          price: Number(addonDef.price)
        });
      }
    });

    const newProduct: OrderProduct = {
      product_id: selectedProductId,
      price: itemPrice,
      note: productNote,
      variations: variationsArr,
      addons: addonsArr
    };

    setFormData(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));

    // Reset selection
    setSelectedProductId(0);
    setSelectedVariations({});
    setSelectedAddons([]);
    setProductNote('');
  };

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (formData.products.length === 0) {
      setValidationError('يرجى إضافة منتج واحد على الأقل للطلب قبل التأكيد.');
      return;
    }

    if (!formData.cashier_id || formData.cashier_id === 0) {
      setValidationError('يرجى اختيار ماكينة الكاشير.');
      return;
    }

    if (!formData.shift_id || formData.shift_id === 0) {
      setValidationError('يرجى اختيار الوردية.');
      return;
    }

    if (!formData.cashier_man_id || formData.cashier_man_id === 0) {
      setValidationError('يرجى اختيار موظف الكاشير.');
      return;
    }

    if (formData.module === 'dine_in' && (!formData.hall_table_id || formData.hall_table_id === 0)) {
      setValidationError('يرجى اختيار الطاولة عند تحديد طريقة الطلب كـ صالة (Dine-in).');
      return;
    }

    const payload: OrderFormData = {
      ...formData,
      cashier_id: Number(formData.cashier_id),
      shift_id: Number(formData.shift_id),
      cashier_man_id: Number(formData.cashier_man_id),
      hall_table_id: formData.module === 'dine_in' && formData.hall_table_id ? Number(formData.hall_table_id) : null,
    };

    mutation.mutate(payload);
  };

  if (isLoadingOrder || isLoadingOptions) return <LoadingSpinner text="جاري تحميل بيانات الطلب والخيارات..." />;
  if (isOrderError) return <ErrorFallback error={orderError} onRetry={refetchOrder} />;
  if (isOptionsError) return <ErrorFallback error={optionsError} onRetry={refetchOptions} />;

  const selectedProductDef = options?.products?.find((p: any) => p.id === selectedProductId);

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/orders"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MdEdit size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">تعديل الطلب #{id}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">تعديل بيانات الطلب والمنتجات وحساب الإجمالي</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left / Main Columns: Products & Cart */}
          <div className="lg:col-span-2 space-y-6">

            {/* Product Selector Section */}
            <div className="card-dashboard p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                إضافة منتجات للطلب
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    اختر المنتج
                  </label>
                  <select 
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(Number(e.target.value));
                      setSelectedVariations({});
                      setSelectedAddons([]);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value={0}>-- اختر المنتج --</option>
                    {options?.products?.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {renderName(p.name)} ({p.price} ج.م)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ملاحظات للمنتج
                  </label>
                  <input
                    type="text"
                    value={productNote}
                    onChange={(e) => setProductNote(e.target.value)}
                    placeholder="بدون بصل، زيادة صوص..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Variations */}
              {selectedProductDef && selectedProductDef.variations && selectedProductDef.variations.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">الخيارات المتاحة (Variations):</h3>
                  {selectedProductDef.variations.map((v: any) => (
                    <div key={v.id} className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {renderName(v.name)} {v.required && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        value={selectedVariations[v.id] || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSelectedVariations(prev => ({ ...prev, [v.id]: val }));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
                      >
                        <option value={0}>-- حدد الخيار --</option>
                        {v.options?.map((opt: any) => (
                          <option key={opt.id} value={opt.id}>
                            {renderName(opt.name)} {Number(opt.price) > 0 ? `(+${opt.price} ج.م)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Addons */}
              {options?.addons && options.addons.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">الإضافات (Addons):</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {options.addons.map((a: any) => {
                      const isChecked = selectedAddons.includes(a.id);
                      return (
                        <label key={a.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-primary transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAddons(prev => [...prev, a.id]);
                              } else {
                                setSelectedAddons(prev => prev.filter(id => id !== a.id));
                              }
                            }}
                            className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                          />
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                            {renderName(a.name)} (+{a.price} ج.م)
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!selectedProductId}
                  className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdAdd size={18} />
                  إضافة للقائمة
                </button>
              </div>
            </div>

            {/* Products in Cart */}
            <div className="card-dashboard p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
                <span>قائمة المنتجات بالطلب</span>
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
                  {formData.products.length} منتجات
                </span>
              </h2>

              {formData.products.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  <p className="text-sm">لم يتم إضافة أي منتج بعد.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {formData.products.map((p, index) => {
                    const prodDef = options?.products?.find(x => x.id === p.product_id);
                    return (
                      <div key={index} className="py-3 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {prodDef ? renderName(prodDef.name) : `منتج #${p.product_id}`}
                          </p>
                          {p.note && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-medium">ملاحظة:</span> {p.note}
                            </p>
                          )}
                          {p.variations && p.variations.length > 0 && (
                            <div className="text-xs text-slate-500 flex flex-wrap gap-2">
                              {p.variations.map((v, vi) => (
                                <span key={vi} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  خيار: {v.options?.map(o => o.option_id).join(', ')}
                                </span>
                              ))}
                            </div>
                          )}
                          {p.addons && p.addons.length > 0 && (
                            <div className="text-xs text-slate-500 flex flex-wrap gap-2">
                              {p.addons.map((a, ai) => (
                                <span key={ai} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  إضافة: {a.addon_id}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {p.price.toFixed(2)} ج.م
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(index)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                            title="حذف"
                          >
                            <MdDelete size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* General Order Information */}
            <div className="card-dashboard p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                بيانات العميل والتوصيل
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    طريقة الطلب (Module) <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="module"
                    value={formData.module}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="takeaway">سفري (Takeaway)</option>
                    <option value="dine_in">صالة (Dine-in)</option>
                    <option value="delivery">توصيل (Delivery)</option>
                  </select>
                </div>

                {formData.module === 'dine_in' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      رقم الطاولة <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="hall_table_id"
                      value={formData.hall_table_id || ''}
                      onChange={handleChange}
                      required={formData.module === 'dine_in'}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">-- اختر الطاولة --</option>
                      {filteredHallTables.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {renderName(t.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    اسم العميل
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="عميل نقدي"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="01000000000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    العنوان
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="عنوان العميل بالتفصيل..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ملاحظات عامة على الطلب
                  </label>
                  <textarea
                    name="note"
                    rows={2}
                    value={formData.note}
                    onChange={handleChange}
                    placeholder="أي تعليمات إضافية..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Calculations & Metadata */}
          <div>
            <div className="card-dashboard p-6 sticky top-6 space-y-6">
              <h2 className="text-base font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                ملخص الحساب
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                  <span>المجموع الفرعي:</span>
                  <span className="font-medium">{formData.total.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                  <span>الضريبة (15%):</span>
                  <span className="font-medium">{formData.total_tax.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                  <span>الخصم:</span>
                  <input
                    type="number"
                    name="total_discount"
                    value={formData.total_discount || ''}
                    onChange={handleChange}
                    className="w-24 px-2 py-1 text-right rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm"
                    placeholder="0"
                  />
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <span className="font-bold text-slate-800 dark:text-white">الإجمالي النهائي:</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formData.final_price.toFixed(2)} ج.م
                  </span>
                </div>
              </div>

              {/* Submission metadata */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Branch Filter */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الفرع
                  </label>
                  <select 
                    value={selectedBranchId} 
                    onChange={(e) => handleBranchChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
                  >
                    <option value={0}>-- كل الفروع --</option>
                    {branches.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {renderName(b.name) || `فرع #${b.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cashier Machine */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ماكينة الكاشير <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="cashier_id" 
                    value={formData.cashier_id || 0} 
                    onChange={handleChange} 
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
                  >
                    <option value={0} disabled>-- اختر ماكينة الكاشير --</option>
                    {filteredCashiers.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {renderName(c.name)}
                      </option>
                    ))}
                  </select>
                  {filteredCashiers.length === 0 && (
                    <p className="text-xs text-amber-500 mt-1">لا توجد ماكينات كاشير متاحة</p>
                  )}
                </div>

                {/* Shift */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الوردية <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="shift_id" 
                    value={formData.shift_id || 0} 
                    onChange={handleChange} 
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
                  >
                    <option value={0} disabled>-- الوردية --</option>
                    {filteredShifts.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {renderName(s.name)} {s.start_time ? `(${s.start_time} - ${s.end_time})` : ''}
                      </option>
                    ))}
                  </select>
                  {filteredShifts.length === 0 && (
                    <p className="text-xs text-amber-500 mt-1">لا توجد ورديات متاحة لهذا الفرع</p>
                  )}
                </div>

                {/* Cashier Man */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    موظف الكاشير <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="cashier_man_id" 
                    value={formData.cashier_man_id || 0} 
                    onChange={handleChange} 
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
                  >
                    <option value={0} disabled>-- الموظف --</option>
                    {filteredCashierMen.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {renderName(m.name)}
                      </option>
                    ))}
                  </select>
                  {filteredCashierMen.length === 0 && (
                    <p className="text-xs text-amber-500 mt-1">لا يوجد موظفو كاشير لهذا الفرع</p>
                  )}
                </div>
              </div>

              {/* Validation & Server Error Alerts */}
              {validationError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs">
                  {validationError}
                </div>
              )}

              {mutation.isError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                  <p className="font-bold mb-1">تعذر تحديث الطلب:</p>
                  <p>{(mutation.error as any)?.response?.data?.message || 'حدث خطأ أثناء حفظ التعديلات، تأكد من صحة البيانات.'}</p>
                  {(() => {
                    const errs = (mutation.error as any)?.response?.data?.errors;
                    if (!errs) return null;
                    return (
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {Object.entries(errs).map(([k, msgs]: [string, any]) => (
                          <li key={k}>{Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}</li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={mutation.isPending || formData.products.length === 0}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-lg"
                >
                  {mutation.isPending ? (
                    <><AiOutlineLoading3Quarters size={22} className="animate-spin" /> جاري الحفظ...</>
                  ) : (
                    <><MdSave size={24} /> حفظ التعديلات</>
                  )}
                </button>
              </div>

            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default OrderEdit;
