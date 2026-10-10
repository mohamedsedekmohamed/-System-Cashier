import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdSearch,
  MdClose,
  MdKeyboardReturn,
  MdAddCircleOutline,
  MdViewList,
  MdSettings,
  MdAssessment,
  MdInventory2,
  MdArrowForward,
} from 'react-icons/md';
import {
  searchNavigation,
  NAVIGATION_PAGES,
  ACTION_BADGES,
  type NavigationPageItem,
  type PageActionType,
} from '../utils/navigationDirectory';

interface QuickFilter {
  id: PageActionType | 'all';
  label: string;
  icon?: React.ReactNode;
}

const QUICK_FILTERS: QuickFilter[] = [
  { id: 'all', label: 'الكل' },
  { id: 'add', label: 'شاشات الإضافة +', icon: <MdAddCircleOutline size={14} /> },
  { id: 'list', label: 'القوائم والإدارة', icon: <MdViewList size={14} /> },
  { id: 'inventory', label: 'المخزون والجرد', icon: <MdInventory2 size={14} /> },
  { id: 'report', label: 'التقارير', icon: <MdAssessment size={14} /> },
  { id: 'settings', label: 'الإعدادات', icon: <MdSettings size={14} /> },
];

export const GlobalNavbarSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<PageActionType | 'all'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setActiveFilter('all');
    setSelectedIndex(0);
  }, []);

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  // Supports physical KeyK, English 'k', and Arabic 'ن' layout
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isK = 
        e.code === 'KeyK' || 
        e.key?.toLowerCase() === 'k' || 
        e.key === 'ن' || 
        e.keyCode === 75 || 
        (e as any).which === 75;

      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        handleClose();
      }
    };

    // Use capture phase on document to intercept before browser default Ctrl+K behavior
    document.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [handleClose]);

  // Filtered results
  const results = useMemo(() => {
    return searchNavigation(query, activeFilter);
  }, [query, activeFilter]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen]);

  const handleSelect = (item: NavigationPageItem) => {
    handleClose();
    navigate(item.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  return (
    <>
      {/* ── Navbar Trigger Button ── */}
      <div className="flex items-center">
        {/* Desktop trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="
            hidden sm:flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl
            bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800/90 dark:hover:bg-slate-700/80
            border border-slate-200 dark:border-slate-700
            text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
            transition-all cursor-pointer text-xs
            w-64 md:w-80 lg:w-96 shadow-2xs hover:shadow-xs
          "
          title="البحث عن الصفحات (Ctrl + K)"
        >
          <div className="flex items-center gap-2 truncate">
            <MdSearch size={18} className="text-primary shrink-0" />
            <span className="truncate">ابحث عن صفحة (إضافة، تعديل، فرع...)...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 shrink-0 shadow-2xs">
            Ctrl K
          </kbd>
        </button>

        {/* Mobile icon trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="sm:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="البحث السريع في الصفحات"
          aria-label="البحث في الصفحات"
        >
          <MdSearch size={22} className="text-primary" />
        </button>
      </div>

      {/* ── Command Palette Modal ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={handleClose}
          dir="rtl"
        >
          <div
            className="
              relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl
              border border-slate-200 dark:border-slate-700 shadow-2xl
              overflow-hidden flex flex-col max-h-[85vh]
              animate-in zoom-in-95 duration-150
            "
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Header: Search Box */}
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900 sticky top-0 z-10">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <MdSearch size={22} />
              </div>

              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="ابحث عن صفحة أو عملية (مثال: إضافة فرع، تعديل، طلب، كاشير)..."
                className="
                  flex-1 bg-transparent text-sm sm:text-base font-medium
                  text-slate-800 dark:text-white placeholder:text-slate-400
                  focus:outline-none
                "
              />

              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelectedIndex(0);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="مسح البحث"
                >
                  <MdClose size={18} />
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                إغلاق (Esc)
              </button>
            </div>

            {/* Quick Filter Pills */}
            <div className="px-3.5 py-2 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_FILTERS.map((f) => {
                const isActive = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setActiveFilter(f.id);
                      setSelectedIndex(0);
                    }}
                    className={`
                      flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0
                      ${
                        isActive
                          ? 'bg-primary text-white shadow-xs font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary/50'
                      }
                    `}
                  >
                    {f.icon}
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Results Count & Section Info */}
            <div className="px-4 py-2 text-[11px] font-semibold text-slate-400 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/30">
              <span>
                {query ? (
                  <>
                    نتائج البحث عن &quot;{query}&quot; ({results.length})
                  </>
                ) : (
                  <>جميع الصفحات والعمليات المتاحة ({results.length})</>
                )}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1">
                استخدم <kbd className="px-1 py-0.5 rounded border text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 rounded border text-[10px]">↓</kbd> للتنقل و <kbd className="px-1 py-0.5 rounded border text-[10px]">Enter</kbd> للفتح
              </span>
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 custom-scrollbar min-h-[200px]"
            >
              {results.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center mb-3">
                    <MdSearch size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    لم نجد أي صفحة تطابق بحثك
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    جرب البحث بكلمات عامة مثل: &quot;فرع&quot;، &quot;اضافة&quot;، &quot;تعديل&quot;، &quot;كاشير&quot;، &quot;منتج&quot;، &quot;طلب&quot;، أو &quot;تقرير&quot;.
                  </p>
                </div>
              ) : (
                results.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const badge = ACTION_BADGES[item.actionType];

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`
                        group flex items-start justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all border
                        ${
                          isSelected
                            ? 'bg-primary/5 dark:bg-primary/15 border-primary/40 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                        }
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        {/* Title & Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3
                            className={`text-sm font-bold ${
                              isSelected ? 'text-primary dark:text-primary-light' : 'text-slate-800 dark:text-white'
                            }`}
                          >
                            {item.title}
                          </h3>

                          {/* Action badge */}
                          <span
                            className={`
                              px-2 py-0.5 rounded-md text-[10px] font-bold border
                              ${badge.bgClass} ${badge.colorClass}
                            `}
                          >
                            {badge.label}
                          </span>

                          {/* Category badge */}
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {item.category}
                          </span>
                        </div>

                        {/* Page Description: Explaining what the page actually does */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>

                        {/* Route Path indicator */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono" dir="ltr">
                          <span className="truncate">{item.path}</span>
                        </div>
                      </div>

                      {/* Go icon */}
                      <div
                        className={`
                          p-2 rounded-lg shrink-0 mt-1 transition-transform
                          ${
                            isSelected
                              ? 'bg-primary text-white translate-x-0'
                              : 'text-slate-300 dark:text-slate-600 group-hover:text-primary'
                          }
                        `}
                      >
                        <MdArrowForward size={16} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with hint */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>إجمالي صفحات النظام: <strong>{NAVIGATION_PAGES.length}</strong></span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <MdKeyboardReturn size={14} className="text-primary" />
                <span>اضغط Enter للذهاب للصفحة مباشرة</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalNavbarSearch;
