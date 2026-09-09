import React, { useRef } from 'react';
import { MdUploadFile, MdClose, MdCheck, MdCheckCircle } from 'react-icons/md';

/* ── Shared Input Class ────────────────── */
export const inputClass = (hasError: boolean) => `
  w-full px-4 py-2.5 rounded-xl text-sm
  bg-slate-50 dark:bg-slate-900
  border ${hasError ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 dark:border-slate-600'}
  text-slate-800 dark:text-slate-200 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200
`;

/* ── Field Types ───────────────────────── */
export type FieldType =
  | 'input'
  | 'select'
  | 'textarea'
  | 'status'
  | 'checkbox'
  | 'time'
  | 'image'
  | 'images'
  | 'pdf'
  | 'video'
  | 'section';

export interface SelectOption {
  id: number | string;
  name: string;
}

export interface FormFieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  fullWidth?: boolean;
  inputType?: string;
  placeholder?: string;
  hint?: string;
  options?: SelectOption[];
  disabled?: boolean;
  dir?: 'ltr' | 'rtl';
  accept?: string;
  multiple?: boolean;
  rows?: number;
  validate?: (value: any) => string | null;
  onChange?: (value: any) => void;
  title?: string;
}

/* ── Field Wrapper ─────────────────────── */
export const FieldWrapper: React.FC<{
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}> = ({ id, label, required, hint, error, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
      {label}
      {required && <span className="text-red-400 mr-1">*</span>}
    </label>
    {children}
    {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

/* ── Input Field ───────────────────────── */
export const InputField: React.FC<{
  field: FormFieldDef;
  value: any;
  error?: string;
  disabled?: boolean;
  onChange: (key: string, value: any) => void;
}> = ({ field, value, error, disabled, onChange }) => (
  <FieldWrapper id={field.key} label={field.label} required={field.required} hint={field.hint} error={error}>
    <input
      id={field.key}
      name={field.key}
      type={field.inputType || 'text'}
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder || field.label}
      disabled={disabled || field.disabled}
      dir={field.dir}
      className={`${inputClass(!!error)} ${field.dir === 'ltr' ? 'text-left' : ''}`}
    />
  </FieldWrapper>
);

/* ── Select Field ──────────────────────── */
export const SelectField: React.FC<{
  field: FormFieldDef;
  value: any;
  error?: string;
  disabled?: boolean;
  onChange: (key: string, value: any) => void;
}> = ({ field, value, error, disabled, onChange }) => (
  <FieldWrapper id={field.key} label={field.label} required={field.required} hint={field.hint} error={error}>
    <select
      id={field.key}
      name={field.key}
      value={value || ''}
      onChange={(e) => onChange(field.key, field.inputType === 'number' ? Number(e.target.value) : e.target.value)}
      disabled={disabled || field.disabled}
      className={`${inputClass(!!error)} disabled:opacity-50`}
    >
      <option value="" disabled>-- {field.placeholder || `اختر ${field.label}`} --</option>
      {(field.options || []).map(opt => (
        <option key={opt.id} value={opt.id}>{opt.name}</option>
      ))}
    </select>
  </FieldWrapper>
);

/* ── Textarea Field ────────────────────── */
export const TextareaField: React.FC<{
  field: FormFieldDef;
  value: any;
  error?: string;
  disabled?: boolean;
  onChange: (key: string, value: any) => void;
}> = ({ field, value, error, disabled, onChange }) => (
  <FieldWrapper id={field.key} label={field.label} required={field.required} hint={field.hint} error={error}>
    <textarea
      id={field.key}
      name={field.key}
      rows={field.rows || 3}
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder || field.label}
      disabled={disabled || field.disabled}
      className={`${inputClass(!!error)} resize-none`}
    />
  </FieldWrapper>
);

/* ── Status Toggle ─────────────────────── */
export const StatusToggle: React.FC<{
  field: FormFieldDef;
  value: boolean;
  disabled?: boolean;
  onChange: (key: string, value: any) => void;
}> = ({ field, value, disabled, onChange }) => (
  <div dir="rtl" className="flex items-center mt-1 justify-between rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-3">
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {field.label}
      </label>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        {value ? 'مفعل' : 'غير مفعل'}
      </p>
    </div>
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(field.key, !value)}
      className={`relative flex h-8 w-14 items-center rounded-full p-1 transition-all duration-300 ${
        value ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ${
          value ? 'translate-x-0' : '-translate-x-6'
        }`}
      >
        {value ? (
          <MdCheck size={14} className="text-emerald-500" />
        ) : (
          <MdClose size={14} className="text-slate-400" />
        )}
      </span>
    </button>
  </div>
);

/* ── Checkbox Field ────────────────────── */
export const CheckboxField: React.FC<{
  field: FormFieldDef;
  value: any;
  disabled?: boolean;
  onChange: (key: string, value: any) => void;
}> = ({ field, value, disabled, onChange }) => (
  <div className="flex items-center gap-3 mt-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-3">
    <input
      type="checkbox"
      id={field.key}
      checked={value === 'yes' || value === true}
      onChange={(e) => onChange(field.key, e.target.checked ? 'yes' : 'no')}
      disabled={disabled || field.disabled}
      className="w-5 h-5 accent-primary rounded"
    />
    <label htmlFor={field.key} className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
      {field.label}
    </label>
  </div>
);

/* ── Image/File Uploader ───────────────── */
export const FileUploader: React.FC<{
  field: FormFieldDef;
  value: any;
  error?: string;
  disabled?: boolean;
  onChange: (key: string, value: any) => void;
}> = ({ field, value, error, disabled, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (field.multiple || field.type === 'images') {
      onChange(field.key, Array.from(e.target.files));
    } else {
      onChange(field.key, e.target.files[0]);
    }
  };

  const accept = field.accept || (field.type === 'image' || field.type === 'images' ? 'image/*' : field.type === 'pdf' ? 'application/pdf' : field.type === 'video' ? 'video/*' : '*');
  const isMultiple = field.multiple || field.type === 'images';

  return (
    <FieldWrapper id={field.key} label={field.label} required={field.required} hint={field.hint} error={error}>
      <div
        onClick={() => !disabled && fileRef.current?.click()}
        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer
          ${error ? 'border-red-400 hover:border-red-500' : 'border-slate-300 dark:border-slate-600 hover:border-primary dark:hover:border-primary'}
          hover:bg-slate-50 dark:hover:bg-slate-900/50
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <MdUploadFile size={32} className="text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          اضغط هنا لاختيار {field.type === 'image' || field.type === 'images' ? 'الصور' : field.type === 'pdf' ? 'ملف PDF' : field.type === 'video' ? 'الفيديو' : 'الملف'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {isMultiple ? 'يمكنك اختيار أكثر من ملف' : 'اختر ملفاً واحداً'}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          multiple={isMultiple}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Preview */}
      {value && (
        <div className="mt-3">
          {Array.isArray(value) && value.length > 0 ? (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-500 mb-1">الملفات المحددة ({value.length}):</h4>
              {value.map((file: File, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <MdCheckCircle size={14} className="text-emerald-500 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
            </div>
          ) : value instanceof File ? (
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <MdCheckCircle size={14} className="text-emerald-500 shrink-0" />
              <span className="truncate">{value.name}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); onChange(field.key, null); }}
                className="p-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-colors">
                <MdClose size={14} />
              </button>
            </div>
          ) : typeof value === 'string' && value ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <MdCheckCircle size={14} className="shrink-0" />
              <span>ملف موجود حالياً</span>
            </div>
          ) : null}
        </div>
      )}
    </FieldWrapper>
  );
};

/* ── Section Divider ───────────────────── */
export const SectionDivider: React.FC<{ title: string }> = ({ title }) => (
  <div className="col-span-1 md:col-span-2 mt-2">
    <div className="bg-gradient-to-l from-primary/5 to-primary/10 border-r-4 border-primary rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-bold text-primary">{title}</h3>
    </div>
  </div>
);
