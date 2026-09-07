import React from 'react';

interface LoadingSpinnerProps {
  /** Size in pixels. Default: 40 */
  size?: number;
  /** Text shown below the spinner. Optional. */
  text?: string;
  /** Full-screen centered overlay. Default: false */
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  text,
  fullScreen = false,
}) => {
  const inner = (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* Spinner ring */}
      <div
        className="rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
        style={{
          width: size,
          height: size,
          borderTopColor: 'var(--color-primary)',
        }}
        role="status"
        aria-label="جاري التحميل"
      />
      {text && (
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-sm">
        {inner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      {inner}
    </div>
  );
};

export default LoadingSpinner;
