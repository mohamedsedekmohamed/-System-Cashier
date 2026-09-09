import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdArrowForward, MdSave } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import type { FormFieldDef } from './FormFields';
import {
  InputField,
  SelectField,
  TextareaField,
  StatusToggle,
  CheckboxField,
  FileUploader,
  SectionDivider,
} from './FormFields';

export interface AddPageProps {
  /** Page title */
  title: string;
  /** Subtitle / description */
  subtitle?: string;
  /** Title icon */
  icon?: React.ReactNode;
  /** Dynamic fields array */
  fields: FormFieldDef[];
  /** Called with the form data on valid submit */
  onSubmit: (formData: Record<string, any>) => void;
  /** Is mutation loading */
  loading?: boolean;
  /** API error message */
  error?: string | null;
  /** Back link path */
  backLink: string;
  /** Cancel link text */
  cancelText?: string;
  /** Submit button text */
  submitText?: string;
  /** Section title for the form card */
  sectionTitle?: string;
}

const AddPage: React.FC<AddPageProps> = ({
  title,
  subtitle,
  icon,
  fields,
  onSubmit,
  loading = false,
  error: apiError,
  backLink,
  cancelText = 'إلغاء',
  submitText = 'حفظ',
  sectionTitle,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: any, field?: FormFieldDef) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear field error on change
    if (errors[key]) setErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
    // Call field-level onChange callback
    if (field?.onChange) field.onChange(value);
  };

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.type === 'section') return;
      const value = formData[f.key];

      if (f.required) {
        if (value === undefined || value === null || value === '' || value === 0 || (Array.isArray(value) && value.length === 0)) {
          err[f.key] = 'هذا الحقل مطلوب';
        }
      }
      if (f.validate && !err[f.key]) {
        const msg = f.validate(value);
        if (msg) err[f.key] = msg;
      }
    });
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  const renderField = (f: FormFieldDef) => {
    const commonProps = {
      field: f,
      value: formData[f.key],
      error: errors[f.key],
      disabled: loading,
      onChange: (key: string, val: any) => handleChange(key, val, f),
    };

    switch (f.type) {
      case 'section':
        return <SectionDivider title={f.title || f.label} />;
      case 'input':
      case 'time':
        return <InputField {...commonProps} field={{ ...f, inputType: f.type === 'time' ? 'time' : f.inputType }} />;
      case 'select':
        return <SelectField {...commonProps} />;
      case 'textarea':
        return <TextareaField {...commonProps} />;
      case 'status':
        return <StatusToggle {...commonProps} value={!!formData[f.key]} />;
      case 'checkbox':
        return <CheckboxField {...commonProps} />;
      case 'image':
      case 'images':
      case 'pdf':
      case 'video':
        return <FileUploader {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={backLink}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
            <MdArrowForward size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              {icon && <span className="text-primary">{icon}</span>}
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
            </div>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>

      {/* API Error */}
      {apiError && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {apiError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {sectionTitle && (
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
              <h2 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{sectionTitle}</h2>
            </div>
          )}

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {fields.map((f) => (
              <div key={f.key} className={`col-span-1 ${f.fullWidth || f.type === 'section' ? 'md:col-span-2' : ''}`}>
                {renderField(f)}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center gap-3 sm:justify-end">
            <Link to={backLink}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm text-center">
              {cancelText}
            </Link>
            <button type="submit" disabled={loading}
              className="w-full sm:w-auto btn-primary px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all">
              {loading ? (
                <>
                  <AiOutlineLoading3Quarters size={18} className="animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <MdSave size={18} />
                  <span>{submitText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddPage;
