import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Search, ChevronDown, Check, X, Loader2 } from 'lucide-react';

/**
 * Searchable Combobox component for selecting items (Products, Contacts, Locations).
 * Supports local filtering or async query via `onSearch`.
 *
 * @param {Object} props
 * @param {Array<{ value: string, label: string, description?: string }>} [props.options=[]]
 * @param {string} [props.value]
 * @param {(val: string) => void} props.onChange
 * @param {string} [props.placeholder='Select option...']
 * @param {boolean} [props.loading=false]
 * @param {(query: string) => void} [props.onSearch]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.error]
 * @param {string} [props.className]
 */
export function Combobox({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  loading = false,
  onSearch,
  disabled = false,
  error,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = onSearch
    ? options
    : options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase()) ||
          opt.description?.toLowerCase().includes(query.toLowerCase())
      );

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={containerRef} className={clsx('relative w-full', className)}>
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={handleOpen}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
        className={clsx(
          'w-full flex items-center justify-between rounded-lg text-sm bg-white dark:bg-zinc-900 border px-3.5 py-2 min-h-[40px] transition-colors cursor-pointer select-none',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
          disabled && 'bg-zinc-100 dark:bg-zinc-800 opacity-60 cursor-not-allowed',
          error
            ? 'border-rose-500 text-rose-900 dark:text-rose-200'
            : 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
        )}
      >
        <span className={clsx('truncate', !selectedOption && 'text-zinc-400 dark:text-zinc-500')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 text-zinc-400">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95">
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onSearch?.(e.target.value);
              }}
              placeholder="Search..."
              className="w-full text-sm bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {loading ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                Loading options...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-zinc-500">No matches found</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={clsx(
                      'px-3 py-2 text-sm rounded-md cursor-pointer flex items-center justify-between transition-colors',
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-medium'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                    )}
                  >
                    <div>
                      <div className="font-medium">{opt.label}</div>
                      {opt.description && (
                        <div className="text-xs text-zinc-400">{opt.description}</div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
