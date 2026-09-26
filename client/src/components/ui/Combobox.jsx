import { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { Search, ChevronDown, Check, X, Loader2 } from 'lucide-react';

/**
 * Searchable Combobox with keyboard navigation, match highlighting, and 36px/40px height.
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
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

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
    setHighlightedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = useCallback((val) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  }, [onChange]);

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlightedIndex]) {
        handleSelect(filtered[highlightedIndex].value);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (open && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex];
      activeEl?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [highlightedIndex, open]);

  // Highlight matching substring
  const renderHighlighted = (text, match) => {
    if (!match.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${match.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === match.toLowerCase() ? (
        <mark key={i} className="bg-teal-100 text-teal-900 dark:bg-teal-900/60 dark:text-teal-200 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={containerRef} className={clsx('relative w-full', className)} onKeyDown={handleKeyDown}>
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={handleOpen}
        tabIndex={disabled ? -1 : 0}
        className={clsx(
          'w-full flex items-center justify-between rounded-lg text-sm bg-white dark:bg-zinc-900 border px-3 py-1.5 min-h-[40px] md:min-h-[36px] md:h-9 transition-all duration-150 cursor-pointer select-none',
          'focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500',
          disabled && 'bg-zinc-50 dark:bg-zinc-800/50 opacity-60 cursor-not-allowed',
          error
            ? 'border-rose-400 dark:border-rose-700/80 text-rose-900 dark:text-rose-200'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-900 dark:text-zinc-100'
        )}
      >
        <span className={clsx('truncate', !selectedOption && 'text-zinc-400 dark:text-zinc-500')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 text-zinc-400 dark:text-zinc-500">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-98 duration-150">
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightedIndex(0);
                onSearch?.(e.target.value);
              }}
              placeholder="Type to search..."
              className="w-full text-xs bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          <div ref={listRef} className="max-h-60 overflow-y-auto p-1 space-y-0.5">
            {loading ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-zinc-500">No matching results</div>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={clsx(
                      'px-2.5 py-1.5 text-xs rounded-lg cursor-pointer flex items-center justify-between transition-colors',
                      isSelected && 'font-semibold text-teal-700 dark:text-teal-300',
                      isHighlighted
                        ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-700 dark:text-zinc-300'
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate">{renderHighlighted(opt.label, query)}</div>
                      {opt.description && (
                        <div className="text-[11px] text-zinc-400 truncate">
                          {renderHighlighted(opt.description, query)}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
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
