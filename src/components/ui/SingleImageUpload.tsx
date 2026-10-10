import React, { useState, useEffect, useRef } from 'react';
import { 
  MdCloudUpload, 
  MdDeleteOutline, 
  MdEdit, 
  MdInsertLink, 
  MdImage, 
  MdCheckCircle,
  MdClose
} from 'react-icons/md';

export interface SingleImageUploadProps {
  value: File | string | null;
  onChange: (val: File | string | null) => void;
  label?: string;
  hint?: string;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  required?: boolean;
  showUrlOption?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const SingleImageUpload: React.FC<SingleImageUploadProps> = ({
  value,
  onChange,
  label = 'أيقونة طريقة الدفع',
  hint = 'اختر صورة من جهازك أو اسحبها هنا (PNG, SVG, JPG, WEBP)',
  accept = 'image/png,image/jpeg,image/webp,image/svg+xml,image/*',
  maxSizeMB = 5,
  disabled = false,
  required = false,
  showUrlOption = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manage preview URL
  useEffect(() => {
    if (!value) {
      setLocalPreview(null);
      return;
    }

    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setLocalPreview(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else if (typeof value === 'string' && value.trim()) {
      setLocalPreview(value.trim());
      // If initialized with a URL string, we can stay in current mode or switch if explicitly clicked
    } else {
      setLocalPreview(null);
    }
  }, [value]);

  const handleFileSelect = (file: File | null) => {
    setErrorMessage(null);
    if (!file) return;

    // Check size limit
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage(`حجم الصورة يتجاوز الحد المسموح به (${maxSizeMB} ميجابايت).`);
      return;
    }

    onChange(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    } else if (file) {
      setErrorMessage('يرجى اختيار ملف صورة صالح.');
    }
  };

  const handleRemove = () => {
    if (disabled) return;
    setErrorMessage(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isFile = value instanceof File;
  const isString = typeof value === 'string' && value.trim().length > 0;
  const hasValue = isFile || isString;

  return (
    <div className="w-full space-y-2">
      {/* Header with Label and Optional Mode Switch */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {showUrlOption && !hasValue && (
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('upload');
                setErrorMessage(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                mode === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <MdImage size={14} />
              رفع صورة
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('url');
                setErrorMessage(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                mode === 'url'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <MdInsertLink size={14} />
              رابط صورة
            </button>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Case 1: Image is Selected (File or String URL) */}
      {hasValue && localPreview ? (
        <div className="p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 transition-all">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Image Preview Box */}
            <div className="relative w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center shrink-0 shadow-sm overflow-hidden group">
              <img
                src={localPreview}
                alt="Payment Icon"
                className="w-full h-full object-contain transition-transform group-hover:scale-105"
                onError={() => {
                  // Fallback if image fails to load
                  setErrorMessage('تعذر تحميل الصورة من الرابط.');
                }}
              />
            </div>

            {/* Image Details */}
            <div className="flex-1 min-w-0 text-center sm:text-right space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                <MdCheckCircle size={15} />
                <span>{isFile ? 'صورة جديدة جاهزة للحفظ' : 'الأيقونة الحالية'}</span>
              </div>
              
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                {isFile ? (value as File).name : (typeof value === 'string' ? value.split('/').pop() || 'صورة الأيقونة' : '')}
              </p>

              {isFile && (
                <p className="text-xs text-slate-500">
                  الحجم: {formatFileSize((value as File).size)}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <MdEdit size={14} className="text-primary" />
                تغيير الصورة
              </button>
              
              <button
                type="button"
                disabled={disabled}
                onClick={handleRemove}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <MdDeleteOutline size={15} />
                حذف
              </button>
            </div>
          </div>
        </div>
      ) : mode === 'upload' ? (
        /* Case 2: Upload Dropzone */
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.005]'
              : 'border-slate-200 dark:border-slate-700 hover:border-primary/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-1 shadow-sm">
              <MdCloudUpload size={26} />
            </div>
            
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              اضغط لاختيار صورة الأيقونة أو اسحبها هنا
            </p>
            
            <p className="text-xs text-slate-500">
              {hint}
            </p>
          </div>
        </div>
      ) : (
        /* Case 3: URL Input Mode */
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://example.com/payment-icon.png أو اسم الأيقونة"
              dir="ltr"
              disabled={disabled}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-left text-sm"
            />
            {typeof value === 'string' && value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <MdClose size={16} />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            يمكنك إدخال رابط مباشر لصورة الشعار أو اسم الأيقونة
          </p>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <p className="text-xs text-rose-500 font-medium mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default SingleImageUpload;
