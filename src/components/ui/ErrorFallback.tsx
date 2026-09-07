import React from 'react';
import { MdErrorOutline, MdRefresh } from 'react-icons/md';

interface ErrorFallbackProps {
  /** The error object or message */
  error?: unknown;
  /** Optional custom message to display */
  message?: string;
  /** Callback when the user clicks "Retry" */
  onRetry?: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, message, onRetry }) => {
  const errorMessage =
    message ||
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (error instanceof Error ? error.message : null) ||
    'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="
        max-w-sm w-full text-center
        bg-white dark:bg-slate-800
        border border-red-100 dark:border-red-900/30
        rounded-2xl p-8 shadow-sm
      ">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <MdErrorOutline size={32} className="text-red-500 dark:text-red-400" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
          فشل تحميل البيانات
        </h3>

        {/* Message */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          {errorMessage}
        </p>

        {/* Retry button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="
              btn-primary inline-flex items-center gap-2
              px-5 py-2.5 rounded-xl font-semibold text-sm
              shadow-lg transition-all duration-200
            "
          >
            <MdRefresh size={18} />
            إعادة المحاولة
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback;
