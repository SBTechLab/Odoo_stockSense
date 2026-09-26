import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce.js';

/**
 * Standard SearchInput component with auto-debounce and "/" keyboard shortcut.
 *
 * @param {Object} props
 * @param {string} [props.value='']
 * @param {(val: string) => void} props.onChange
 * @param {string} [props.placeholder='Search... (Press / to focus)']
 * @param {number} [props.delay=300]
 * @param {string} [props.className]
 */
export function SearchInput({
  value: initialValue = '',
  onChange,
  placeholder = 'Search... (Press / to focus)',
  delay = 300,
  className,
}) {
  const [query, setQuery] = useState(initialValue);
  const debouncedQuery = useDebounce(query, delay);
  const inputRef = useRef(null);

  // Sync with external value changes
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Dispatch debounced changes
  useEffect(() => {
    if (debouncedQuery !== initialValue) {
      onChange(debouncedQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // "/" keyboard shortcut to focus search input
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = () => {
    setQuery('');
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={clsx('relative w-full max-w-sm', className)}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'w-full rounded-lg text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 pl-9 pr-8 py-2 min-h-[40px] transition-colors',
          'placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
        )}
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
