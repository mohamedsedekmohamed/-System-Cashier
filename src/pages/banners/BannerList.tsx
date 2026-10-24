import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bannerApi, BANNERS_KEY } from '../../services/bannerService';
import type { Banner } from '../../types';
import ErrorFallback from '../../components/ui/ErrorFallback';
import { DataTable } from '../../components/ui/DataTable';
import type { ColumnDef } from '../../components/ui/DataTable';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { SingleImageUpload } from '../../components/ui/SingleImageUpload';
import {
  MdViewCarousel,
  MdDelete,
  MdVisibility,
  MdRefresh,
  MdGridView,
  MdViewList,
  MdClose,
  MdCalendarToday,
  MdCloudUpload,
  MdImageNotSupported,
  MdContentCopy,
  MdCheck,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

export const BannerList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [previewTarget, setPreviewTarget] = useState<Banner | null>(null);
  const [isQuickUploadOpen, setIsQuickUploadOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const perPage = 15;

  // ── Fetch Banners ───────────────────────
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [BANNERS_KEY, page, perPage],
    queryFn: () => bannerApi.list(page, perPage),
    placeholderData: (prev) => prev,
  });

  const banners = data?.data ?? [];
  const meta = data?.meta;

  // ── Delete Mutation ─────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => bannerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANNERS_KEY] });
      setDeleteTarget(null);
    },
  });

  // ── Quick Upload Mutation ───────────────
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => bannerApi.create(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANNERS_KEY] });
      setIsQuickUploadOpen(false);
      setUploadFile(null);
      setUploadError(null);
    },
    onError: (err: any) => {
      const errs = err?.response?.data?.errors;
      if (errs?.image) {
        setUploadError(Array.isArray(errs.image) ? errs.image.join(', ') : String(errs.image));
      } else {
        setUploadError(
          err?.response?.data?.message || err?.message || 'فشل رفع البانر. تأكد من حجم وصيغة الصورة.'
        );
      }
    },
  });

  const handleQuickUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !(uploadFile instanceof File)) {
      setUploadError('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, GIF)');
      return;
    }
    uploadMutation.mutate(uploadFile);
  };

  const handleCopyUrl = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Table Columns Definition ────────────
  const columns: ColumnDef<Banner>[] = [
    {
      header: '#',
      render: (_, __, globalIndex) => (
        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-primary px-2 py-0.5 rounded-md">
          {globalIndex}
        </code>
      ),
    },
    {
      header: 'معاينة البانر',
      render: (row) => (
        <div
          onClick={() => setPreviewTarget(row)}
          className="relative group cursor-pointer w-28 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shrink-0"
        >
          <img
            src={row.image}
            alt={`Banner #${row.id}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <MdVisibility size={18} />
          </div>
        </div>
      ),
    },
    {
      header: 'المعرف (ID)',
      render: (row) => (
        <code className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
          #{row.id}
        </code>
      ),
    },
    {
      header: 'رابط الصورة المباشر',
      render: (row) => (
        <div className="flex items-center gap-2 max-w-xs">
          <span className="font-mono text-xs text-slate-500 truncate" dir="ltr" title={row.image}>
            {row.image}
          </span>
          <button
            type="button"
            onClick={() => handleCopyUrl(row.image, row.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
            title="نسخ الرابط"
          >
            {copiedId === row.id ? <MdCheck size={16} className="text-emerald-500" /> : <MdContentCopy size={16} />}
          </button>
        </div>
      ),
    },
    {
      header: 'تاريخ الإضافة',
      render: (row) => (
        <div className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
          <MdCalendarToday size={14} className="text-slate-400" />
          <span>{row.created_at ? new Date(row.created_at).toLocaleString('ar-EG') : '—'}</span>
        </div>
      ),
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewTarget(row)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 transition-all shadow-xs border border-indigo-100 dark:border-indigo-800/50"
            title="معاينة بالحجم الكامل"
          >
            <MdVisibility size={16} />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 transition-all shadow-xs border border-rose-100 dark:border-rose-800/50"
            title="حذف البانر"
          >
            <MdDelete size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 flex flex-col h-full animate-fade-in pb-10">
      {/* ── Page Header ─────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <MdViewCarousel size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">
                إدارة البانرات الإعلانية
              </h1>
              {meta?.total !== undefined && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                  {meta.total} بانر
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              إدارة ورفع البانرات الترويجية والعروض للواجهة الرئيسية للمتجر والتطبيق
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              title="عرض كبطاقات"
            >
              <MdGridView size={16} />
              <span className="hidden sm:inline">معرض</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              title="عرض كجدول"
            >
              <MdViewList size={16} />
              <span className="hidden sm:inline">جدول</span>
            </button>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="تحديث البيانات"
          >
            <MdRefresh size={18} className={isFetching ? 'animate-spin text-primary' : ''} />
            <span className="hidden sm:inline">تحديث</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsQuickUploadOpen(true);
              setUploadFile(null);
              setUploadError(null);
            }}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-primary/25 hover:shadow-lg transition-all"
          >
            <MdCloudUpload size={18} />
            <span>رفع سريع</span>
          </button>
        </div>
      </div>

      {/* ── Content Area ─────────────────── */}
      {isError ? (
        <ErrorFallback error={error} onRetry={refetch} />
      ) : viewMode === 'grid' ? (
        /* ── Grid Gallery View ── */
        <div className="space-y-6">
          {banners.length === 0 && !isLoading ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 mx-auto flex items-center justify-center">
                <MdImageNotSupported size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
                  لا توجد بانرات إعلانية حالياً
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  قم برفع أول بانر إعلاني ليظهر للعملاء في واجهة المتجر وتطبيق الجوال
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsQuickUploadOpen(true);
                  setUploadFile(null);
                  setUploadError(null);
                }}
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-primary/25 hover:shadow-lg transition-all"
              >
                <MdCloudUpload size={18} />
                <span>رفع أول بانر</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="group bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/80 shadow-xs hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Image container */}
                  <div
                    onClick={() => setPreviewTarget(banner)}
                    className="relative aspect-[16/9] w-full bg-slate-100 dark:bg-slate-900 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={banner.image}
                      alt={`Banner #${banner.id}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="p-3 rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <MdVisibility size={24} />
                      </span>
                    </div>

                    {/* Top Badges */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-900/70 backdrop-blur-md text-white font-mono text-xs font-bold border border-white/10">
                        #{banner.id}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer Details */}
                  <div className="p-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <MdCalendarToday size={14} />
                      <span>
                        {banner.created_at ? new Date(banner.created_at).toLocaleDateString('ar-EG') : '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(banner.image, banner.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="نسخ رابط الصورة"
                      >
                        {copiedId === banner.id ? (
                          <MdCheck size={18} className="text-emerald-500" />
                        ) : (
                          <MdContentCopy size={18} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewTarget(banner)}
                        className="p-2 rounded-xl bg-indigo-50 text-indigo-500 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 transition-colors"
                        title="معاينة"
                      >
                        <MdVisibility size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(banner)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 transition-colors"
                        title="حذف البانر"
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination controls for Grid View */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                السابق
              </button>
              <span className="text-xs font-bold text-slate-500">
                صفحة {meta.current_page} من {meta.last_page}
              </span>
              <button
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="flex-1">
          <DataTable
            data={banners}
            columns={columns}
            meta={meta}
            onPageChange={setPage}
            isLoading={isLoading && !data}
            emptyIcon={<MdViewCarousel size={48} />}
            emptyText="لا توجد بانرات إعلانية مسجلة حالياً"
          />
        </div>
      )}

      {/* ── Delete Confirmation Modal ──── */}
      <DeleteModal
        isOpen={!!deleteTarget}
        itemName={`البانر رقم #${deleteTarget?.id || ''}`}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        descriptionPrefix="هل أنت متأكد من حذف"
      />

      {/* ── Image Lightbox Preview Modal ── */}
      {previewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-white/10 text-white">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm bg-white/10 px-2.5 py-1 rounded-xl">
                  #{previewTarget.id}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {previewTarget.created_at ? new Date(previewTarget.created_at).toLocaleString('ar-EG') : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(previewTarget.image, previewTarget.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                >
                  {copiedId === previewTarget.id ? <MdCheck size={16} /> : <MdContentCopy size={16} />}
                  <span>{copiedId === previewTarget.id ? 'تم النسخ' : 'نسخ الرابط'}</span>
                </button>
                <button
                  onClick={() => setPreviewTarget(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <MdClose size={20} />
                </button>
              </div>
            </div>

            {/* Image Preview */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40 min-h-[300px]">
              <img
                src={previewTarget.image}
                alt={`Banner #${previewTarget.id}`}
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
              />
            </div>

            {/* Footer */}
            <div className="p-3 px-6 bg-black/60 border-t border-white/10 text-center">
              <p className="font-mono text-xs text-slate-400 truncate" dir="ltr">
                {previewTarget.image}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Upload Modal ──────────── */}
      {isQuickUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <MdCloudUpload size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">رفع بانر إعلاني سريع</h2>
                  <p className="text-xs text-slate-400 mt-0.5">اختر صورة البانر وسيتم نشرها فوراً</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickUploadOpen(false)}
                disabled={uploadMutation.isPending}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <MdClose size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickUploadSubmit} className="p-6 space-y-4">
              <SingleImageUpload
                value={uploadFile}
                onChange={(file) => {
                  setUploadFile(file);
                  setUploadError(null);
                }}
                label="صورة البانر"
                hint="الحد الأقصى 4MB (PNG, JPG, WEBP, GIF)"
                maxSizeMB={4}
                required
                showUrlOption={false}
              />

              {uploadError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
                  {uploadError}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsQuickUploadOpen(false)}
                  disabled={uploadMutation.isPending}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={uploadMutation.isPending || !uploadFile}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <AiOutlineLoading3Quarters size={16} className="animate-spin" />
                      <span>جاري الرفع...</span>
                    </>
                  ) : (
                    <>
                      <MdCloudUpload size={16} />
                      <span>رفع وحفظ البانر</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerList;
