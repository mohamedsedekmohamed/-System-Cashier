import React, { useState, useEffect, useRef } from 'react';
import { 
  MdUploadFile, 
  MdDelete, 
  MdDeleteOutline,
  MdVisibility, 
  MdClose, 
  MdAddPhotoAlternate,
  MdOpenInNew 
} from 'react-icons/md';

export interface ImageUploadPreviewProps {
  files: File[];
  onChange: (files: File[]) => void;
  existingImages?: string[];
  onRemoveExisting?: (index: number) => void;
  onClearAllExisting?: () => void;
  label?: string;
  hint?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  maxFiles?: number;
  accept?: string;
}

interface FileWithPreview {
  file: File;
  previewUrl: string;
  id: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = ({
  files,
  onChange,
  existingImages = [],
  onRemoveExisting,
  onClearAllExisting,
  label = 'صور الهوية / الرخصة',
  hint = 'يمكنك اختيار أكثر من صورة (JPG, PNG, WEBP)',
  required = false,
  error,
  disabled = false,
  maxFiles = 10,
  accept = 'image/*',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<FileWithPreview[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Sync internal preview list with incoming files prop
  useEffect(() => {
    // Generate object URLs for each file
    const newPreviews = files.map((file, index) => {
      const existing = previewFiles.find(p => p.file === file);
      if (existing) return existing;
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
      };
    });

    setPreviewFiles(newPreviews);

    // Clean up revoked URLs when files change
    return () => {
      newPreviews.forEach(p => {
        // Only revoke if not in next render
        URL.revokeObjectURL(p.previewUrl);
      });
    };
  }, [files]);

  // Handle ESC key for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    if (lightboxImage) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxImage]);

  // Append new files without overwriting previous selections
  const handleAddFiles = (incomingFiles: FileList | File[] | null) => {
    if (!incomingFiles || disabled) return;
    const fileArray = Array.from(incomingFiles).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    // Filter out duplicates based on name and size
    const merged = [...files];
    fileArray.forEach(newFile => {
      const exists = merged.some(f => f.name === newFile.name && f.size === newFile.size);
      if (!exists && merged.length < maxFiles) {
        merged.push(newFile);
      }
    });

    onChange(merged);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleAddFiles(e.target.files);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    if (disabled) return;
    const updated = files.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  // Drag and drop events
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
    if (!disabled && e.dataTransfer.files) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const totalImagesCount = existingImages.length + files.length;

  return (
    <div className="w-full space-y-3">
      {/* Label and Hint Header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
          {!required && <span className="text-slate-400 font-normal text-xs mr-1">(اختياري)</span>}
        </label>
        {totalImagesCount > 0 && (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
            {totalImagesCount} {totalImagesCount === 1 ? 'صورة' : 'صور'}
          </span>
        )}
      </div>

      {/* Upload Dropzone */}
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
          isDragging 
            ? 'border-primary bg-primary/10 scale-[1.01] shadow-md' 
            : 'border-slate-300 dark:border-slate-600 hover:border-primary dark:hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-900/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="p-3 bg-primary/10 text-primary rounded-2xl mb-3 transition-transform group-hover:scale-110">
          <MdUploadFile size={32} />
        </div>

        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-center">
          اضغط هنا لاختيار الصور أو اسحبها وأفلتها هنا
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center">
          {hint}
        </p>

        <input
          type="file"
          multiple
          accept={accept}
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {/* Validation error */}
      {error && (
        <p className="text-xs text-red-500 font-medium mt-1">{error}</p>
      )}

      {/* Previews Container */}
      {(existingImages.length > 0 || previewFiles.length > 0) && (
        <div className="space-y-4 pt-2">
          {/* Header with clear action */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">
              معاينة الصور ({totalImagesCount}):
            </span>
            <div className="flex items-center gap-3">
              {onClearAllExisting && existingImages.length > 0 && !disabled && (
                <button
                  type="button"
                  onClick={onClearAllExisting}
                  className="text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium flex items-center gap-1 cursor-pointer"
                >
                  <MdDeleteOutline size={16} />
                  حذف كل الصور المحفوظة ({existingImages.length})
                </button>
              )}
              {files.length > 0 && !disabled && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium flex items-center gap-1 cursor-pointer"
                >
                  <MdDeleteOutline size={16} />
                  مسح الصور الجديدة ({files.length})
                </button>
              )}
            </div>
          </div>

          {/* Grid of Preview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {/* 1. Existing Images from Server (e.g. for Edit view) */}
            {existingImages.map((imgUrl, idx) => (
              <div 
                key={`existing-${idx}`}
                onClick={() => setLightboxImage({ url: imgUrl, title: `صورة محفوظة ${idx + 1}` })}
                className="group relative bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md aspect-square flex flex-col cursor-pointer"
              >
                <img
                  src={imgUrl}
                  alt={`صورة محفوظة ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Status Badge */}
                <div className="absolute top-2 right-2 z-10 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/70 text-white backdrop-blur-md">
                    محفوظة
                  </span>
                </div>

                {/* Visible Permanent Delete Button */}
                {onRemoveExisting && !disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveExisting(idx);
                    }}
                    title="حذف هذه الصورة"
                    className="absolute top-2 left-2 z-30 w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-90 cursor-pointer"
                  >
                    <MdDelete size={15} />
                  </button>
                )}

                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20 pointer-events-none">
                  <span className="p-2 bg-white/90 text-slate-800 rounded-lg shadow-md flex items-center gap-1 text-xs font-semibold">
                    <MdVisibility size={16} /> تكبير
                  </span>
                </div>
              </div>
            ))}

            {/* 2. Newly Uploaded Files (with Live Previews) */}
            {previewFiles.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setLightboxImage({ url: item.previewUrl, title: item.file.name })}
                className="group relative bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-primary/30 dark:border-primary/40 shadow-sm transition-all hover:shadow-md aspect-square flex flex-col cursor-pointer"
              >
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* New Badge */}
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary text-white shadow-sm">
                    جديدة
                  </span>
                </div>

                {/* Visible Permanent Delete Button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(idx);
                    }}
                    title="حذف هذه الصورة"
                    className="absolute top-2 left-2 z-30 w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-90 cursor-pointer"
                  >
                    <MdDelete size={15} />
                  </button>
                )}

                {/* File Size & Name at bottom */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white z-10 pointer-events-none">
                  <p className="text-[11px] font-medium truncate" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p className="text-[9px] text-slate-300 font-mono">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20 pointer-events-none">
                  <span className="p-2 bg-white/90 text-slate-800 rounded-lg shadow-md flex items-center gap-1 text-xs font-semibold">
                    <MdVisibility size={16} /> تكبير
                  </span>
                </div>
              </div>
            ))}

            {/* Quick Add More Card */}
            {!disabled && totalImagesCount < maxFiles && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 text-slate-400 hover:text-primary transition-all group cursor-pointer"
              >
                <MdAddPhotoAlternate size={28} className="transition-transform group-hover:scale-110" />
                <span className="text-xs font-semibold mt-1">إضافة المزيد</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-3 text-white px-2">
              <span className="text-sm font-medium truncate max-w-[70vw]">
                {lightboxImage.title}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="فتح في علامة تبويب جديدة"
                >
                  <MdOpenInNew size={20} />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="إغلاق"
                >
                  <MdClose size={20} />
                </button>
              </div>
            </div>

            {/* Preview Full Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black/50 border border-white/10">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[80vh] max-w-full object-contain rounded-xl select-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadPreview;
