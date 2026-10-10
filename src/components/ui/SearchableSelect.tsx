import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MdSearch, MdKeyboardArrowDown, MdCheck, MdClose } from 'react-icons/md';
import { renderName } from '../../utils/helpers';

export interface SelectOptionItem {
  id: string | number;
  name: any;
  subtext?: string;
  disabled?: boolean;
  [key: string]: any;
}

export interface SearchableSelectProps {
  id?: string;
  name?: string;
  value: string | number | null | undefined;
  onChange: (value: any) => void;
  options: SelectOptionItem[] | any[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: string | boolean;
  isClearable?: boolean;
  labelExtractor?: (option: any) => string;
  valueExtractor?: (option: any) => string | number;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'اختر من القائمة...',
  searchPlaceholder = 'ابحث هنا...',
  disabled = false,
  required = false,
  className = '',
  error,
  isClearable = true,
  labelExtractor,
  valueExtractor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  // Helper to extract option value
  const getOptValue = React.useCallback(
    (opt: any): string | number => {
      if (valueExtractor) return valueExtractor(opt);
      return opt?.id !== undefined ? opt.id : opt?.value !== undefined ? opt.value : opt;
    },
    [valueExtractor]
  );

  // Filter out any null or invalid options
  const cleanOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    return options.filter((opt) => opt !== null && opt !== undefined && opt !== 'null' && opt !== 'undefined');
  }, [options]);

  // Helper to extract option display label
  const getOptLabel = React.useCallback(
    (opt: any): string => {
      if (!opt || opt === 'null' || opt === 'undefined') return '';
      if (labelExtractor) return labelExtractor(opt);
      if (typeof opt.name === 'object' && opt.name !== null) {
        return renderName(opt.name) || (opt.id ? `عنصر #${opt.id}` : '');
      }
      if (opt.name !== undefined && opt.name !== null && opt.name !== 'null') return String(opt.name);
      if (opt.title !== undefined && opt.title !== null && opt.title !== 'null') return String(opt.title);
      if (opt.label !== undefined && opt.label !== null && opt.label !== 'null') return String(opt.label);
      if (opt.id !== undefined) return `خيار #${opt.id}`;
      return '';
    },
    [labelExtractor]
  );

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (value === undefined || value === null || value === '') return null;
    return cleanOptions.find((opt) => String(getOptValue(opt)) === String(value)) || null;
  }, [cleanOptions, value, getOptValue]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return cleanOptions;
    const lower = searchTerm.toLowerCase().trim();
    return cleanOptions.filter((opt) => {
      const label = getOptLabel(opt).toLowerCase();
      const val = String(getOptValue(opt)).toLowerCase();
      const sub = opt.subtext ? String(opt.subtext).toLowerCase() : '';
      return label.includes(lower) || val.includes(lower) || sub.includes(lower);
    });
  }, [cleanOptions, searchTerm, getOptLabel, getOptValue]);

  // Dynamic placement: detect whether to open downwards or upwards
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

  const updatePlacement = React.useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If space below is limited (< 270px) and there's more room above, open upwards
      if (spaceBelow < 270 && spaceAbove > spaceBelow) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }
    }
  }, []);

  // Open / Close toggle handler
  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        updatePlacement();
        const currentIdx = filteredOptions.findIndex(
          (opt) => String(getOptValue(opt)) === String(value)
        );
        setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
      } else {
        setSearchTerm('');
      }
      return next;
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  // Recalculate placement on window scroll/resize while open
  useEffect(() => {
    if (isOpen) {
      updatePlacement();
      const handleReposition = () => updatePlacement();
      window.addEventListener('resize', handleReposition);
      window.addEventListener('scroll', handleReposition, true);
      return () => {
        window.removeEventListener('resize', handleReposition);
        window.removeEventListener('scroll', handleReposition, true);
      };
    }
  }, [isOpen, updatePlacement]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto focus search input when opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && optionsListRef.current) {
      const activeElement = optionsListRef.current.children[highlightedIndex] as HTMLElement;
      if (activeElement && typeof activeElement.scrollIntoView === 'function') {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (opt: any) => {
    if (opt.disabled) return;
    onChange(getOptValue(opt));
    handleClose();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    handleClose();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
      return;
    }

    if (e.key === 'Escape' || e.key === 'Tab') {
      handleClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    }
  };

  const hasError = Boolean(error);

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-right ${isOpen ? 'z-50' : 'z-auto'} ${className}`}
      onKeyDown={handleKeyDown}
      dir="rtl"
    >
      {/* Hidden input for form requirements */}
      {required && (
        <input
          tabIndex={-1}
          type="text"
          value={value ?? ''}
          required={required}
          onChange={() => {}}
          className="sr-only"
        />
      )}

      {/* ── Main Select Trigger Button ── */}
      <button
        id={id}
        name={name}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`
          w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm transition-all
          border bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200
          ${
            hasError
              ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
              : isOpen
              ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-slate-800'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer'}
        `}
      >
        <div className="flex-1 truncate text-right">
          {selectedOption ? (
            <span className="font-semibold text-slate-800 dark:text-white">
              {getOptLabel(selectedOption)}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {isClearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  handleClear(e as any);
                }
              }}
              title="إلغاء التحديد"
              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <MdClose size={15} />
            </span>
          )}
          <MdKeyboardArrowDown
            size={18}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
          />
        </div>
      </button>

      {/* ── Dropdown Panel with Search Bar ── */}
      {isOpen && (
        <div
          className={`
            absolute z-50 left-0 right-0 p-2 rounded-2xl
            bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
            shadow-2xl shadow-black/20 dark:shadow-black/60
            ${
              placement === 'top'
                ? 'bottom-full mb-1.5 animate-in fade-in slide-in-from-bottom-1 duration-150'
                : 'top-full mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150'
            }
          `}
        >
          {/* Integrated Search Input Box */}
          <div className="relative mb-2">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <MdSearch size={17} />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              className="
                w-full pr-9 pl-8 py-2 rounded-xl text-xs
                bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                text-slate-800 dark:text-slate-200 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                transition-all
              "
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setHighlightedIndex(0);
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <MdClose size={14} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div
            ref={optionsListRef}
            className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                <p className="font-semibold">لا توجد نتائج مطابقة</p>
                {searchTerm && (
                  <p className="text-[11px] mt-0.5 text-slate-400">
                    لم نجد أي عنصر يطابق &quot;{searchTerm}&quot;
                  </p>
                )}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const optVal = getOptValue(opt);
                const optLabel = getOptLabel(opt);
                const isSelected = String(optVal) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={String(optVal)}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-right transition-all
                      ${
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed text-slate-400'
                          : isSelected
                          ? 'bg-primary text-white font-bold shadow-sm shadow-primary/20'
                          : isHighlighted
                          ? 'bg-primary/10 text-primary dark:bg-primary/20 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <div className="flex-1 truncate pr-1">
                      <span className="block truncate">{optLabel}</span>
                      {opt.subtext && (
                        <span
                          className={`block text-[10px] truncate mt-0.5 ${
                            isSelected ? 'text-white/80' : 'text-slate-400 font-normal'
                          }`}
                        >
                          {opt.subtext}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <span className="text-white shrink-0 mr-2">
                        <MdCheck size={16} />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom count badge */}
          {options.length > 5 && (
            <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>النتائج: {filteredOptions.length}</span>
              <span>الإجمالي: {options.length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
