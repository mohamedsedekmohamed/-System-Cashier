import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderService, ORDERS_KEY } from '../../services/orderService';
import type { OrderFormData, OrderProduct } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { MdArrowForward, MdSave, MdAddShoppingCart, MdDelete, MdAdd } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { renderName } from '../../utils/helpers';

const OrderAdd: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<OrderFormData>({
    shift_id: 0,
    cashier_id: 0,
    cashier_man_id: 0,
    hall_table_id: 0,
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

  const { data: optionsData, isLoading: isLoadingOptions, isError, error, refetch } = useQuery({
    queryKey: ['orderSelectOptions'],
    queryFn: () => orderService.getSelectOptions(),
  });

  const options = optionsData?.data;

  // Selected product state for the "add to cart" form
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [selectedVariations, setSelectedVariations] = useState<Record<number, number>>({});
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [productNote, setProductNote] = useState('');

  // Calculate totals when products change
  useEffect(() => {
    let subtotal = 0;
    formData.products.forEach(p => {
      subtotal += p.price; // price includes variations and addons in this logic
    });

    // Simplistic calculation, can be adjusted based on real business rules
    const tax = subtotal * 0.15; // Assuming 15% tax
    const discount = formData.total_discount || 0;
    const finalPrice = subtotal + tax - discount;

    setFormData(prev => ({
      ...prev,
      total: subtotal,
      total_tax: tax,
      final_price: finalPrice
    }));
  }, [formData.products, formData.total_discount]);

  const mutation = useMutation({
    mutationFn: (payload: OrderFormData) => orderService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });
      navigate('/dashboard/orders');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const isNumber = ['shift_id', 'cashier_id', 'cashier_man_id', 'hall_table_id', 'total_discount'].includes(name);

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
      const variationDef = productDef.variations.find((v: any) => v.id === varId);
      if (variationDef) {
        const optionDef = variationDef.options.find((o: any) => o.id === optId);
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
    mutation.mutate(formData);
  };

  if (isLoadingOptions) return <LoadingSpinner text="جاري تحميل الخيارات..." />;
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />;

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
              <MdAddShoppingCart size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">إضافة طلب جديد</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">إنشاء طلب جديد وإضافة المنتجات</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left/Main Column: Order Info & Product Selection */}
        <div className="xl:col-span-2 space-y-6">

          {/* General Information */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
              المعلومات الأساسية
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">طريقة الطلب</label>
                <select name="module" value={formData.module} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary">
                  <option value="takeaway">تيك أواي (Takeaway)</option>
                  <option value="delivery">توصيل (Delivery)</option>
                  <option value="dine_in">صالة (Dine-in)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">العميل</label>
                <input type="text" name="name" value={typeof formData.name === 'object' && formData.name !== null ? (formData.name?.ar || formData.name?.en || '') : (formData.name || '')} onChange={handleChange} placeholder="اسم العميل (اختياري)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">الهاتف</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="رقم الهاتف (اختياري)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>

              {formData.module === 'delivery' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">العنوان</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="عنوان التوصيل" required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                </div>
              )}

              {formData.module === 'dine_in' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">الطاولة</label>
                  <select name="hall_table_id" value={formData.hall_table_id} onChange={handleChange} required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary">
                    <option value={0} disabled>-- اختر الطاولة --</option>
                    {options?.hall_tables?.map((ht: any) => (
                      <option key={ht.id} value={ht.id}>{renderName(ht.name)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ملاحظات الطلب</label>
              <textarea name="note" value={formData.note} onChange={handleChange} placeholder="أي ملاحظات عامة للطلب..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none" rows={2}></textarea>
            </div>
          </div>

          {/* Add Product Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
              إضافة منتج للطلب
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">المنتج</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(Number(e.target.value));
                    setSelectedVariations({});
                    setSelectedAddons([]);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary">
                  <option value={0}>-- اختر منتجاً --</option>
                  {options?.products?.map((p: any) => (
                    <option key={p.id} value={p.id}>{renderName(p.name)} - {p.price} ج.م</option>
                  ))}
                </select>
              </div>

              {selectedProductDef && selectedProductDef.variations?.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-4">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">خيارات المنتج (Variations)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProductDef.variations.map((v: any) => (
                      <div key={v.id}>
                        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                          {renderName(v.name)} {v.required && <span className="text-red-500">*</span>}
                        </label>
                        <select
                          required={v.required}
                          value={selectedVariations[v.id] || ''}
                          onChange={(e) => setSelectedVariations(prev => ({ ...prev, [v.id]: Number(e.target.value) }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm">
                          <option value="" disabled>-- اختر --</option>
                          {v.options?.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {renderName(opt.name)} {Number(opt.price) > 0 ? `(+${opt.price})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProductDef && options?.addons && options.addons.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">الإضافات (Addons)</h3>
                  <div className="flex flex-wrap gap-3">
                    {options.addons.map((addon: any) => (
                      <label key={addon.id} className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-primary transition-colors">
                        <input type="checkbox"
                          checked={selectedAddons.includes(addon.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedAddons(prev => [...prev, addon.id]);
                            else setSelectedAddons(prev => prev.filter(id => id !== addon.id));
                          }}
                          className="rounded text-primary focus:ring-primary" />
                        <span className="text-sm text-slate-700 dark:text-slate-200">
                          {renderName(addon.name)} <span className="text-emerald-600 dark:text-emerald-400 font-medium">(+{addon.price})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedProductId > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ملاحظة على المنتج</label>
                  <input type="text" value={productNote} onChange={e => setProductNote(e.target.value)} placeholder="بدون بصل، اكسترا صوص..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                </div>
              )}

              <button type="button" onClick={handleAddProduct} disabled={!selectedProductId}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 rounded-xl font-semibold shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed">
                <MdAdd size={20} />
                إضافة للمنتجات المختارة
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Cart & Totals */}
        <div className="space-y-6">

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
              سلة المنتجات
            </h2>

            <div className="space-y-3 min-h-[150px] max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {formData.products.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                  <MdAddShoppingCart size={40} className="mb-2 opacity-50" />
                  <p className="text-sm">لم يتم إضافة منتجات بعد</p>
                </div>
              ) : (
                formData.products.map((prod, idx) => {
                  const pDef = options?.products?.find((p: any) => p.id === prod.product_id);
                  return (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-600 relative group">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-slate-800 dark:text-white text-sm">{renderName(pDef?.name)}</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{prod.price} ج.م</p>
                      </div>

                      {prod.variations.map((v, i) => (
                        <p key={i} className="text-xs text-slate-500">
                          - خيار إضافي: +{v.options[0]?.price} ج.م
                        </p>
                      ))}
                      {prod.addons.map((a, i) => (
                        <p key={i} className="text-xs text-slate-500">
                          - إضافة: +{a.price} ج.م
                        </p>
                      ))}
                      {prod.note && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">"{prod.note}"</p>}

                      <button type="button" onClick={() => handleRemoveProduct(idx)}
                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200">
                        <MdDelete size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
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
                <input type="number" name="total_discount" value={formData.total_discount || ''} onChange={handleChange}
                  className="w-24 px-2 py-1 text-right rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm" placeholder="0" />
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <span className="font-bold text-slate-800 dark:text-white">الإجمالي النهائي:</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formData.final_price.toFixed(2)} ج.م</span>
              </div>
            </div>

            {/* Submission metadata */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">الوردية</label>
                <select name="shift_id" value={formData.shift_id} onChange={handleChange} required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm">
                  <option value={0} disabled>-- الوردية --</option>
                  {options?.shifts?.map((s: any) => (
                    <option key={s.id} value={s.id}>{renderName(s.name)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">موظف الكاشير</label>
                <select name="cashier_man_id" value={formData.cashier_man_id} onChange={handleChange} required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm">
                  <option value={0} disabled>-- الموظف --</option>
                  {options?.cashier_men?.map((m: any) => (
                    <option key={m.id} value={m.id}>{renderName(m.name)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <button type="submit" disabled={mutation.isPending || formData.products.length === 0}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-lg">
                {mutation.isPending ? (
                  <><AiOutlineLoading3Quarters size={22} className="animate-spin" /> جاري التنفيذ...</>
                ) : (
                  <><MdSave size={24} /> تأكيد الطلب</>
                )}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default OrderAdd;
