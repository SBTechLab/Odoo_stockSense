import clsx from 'clsx';
import { X } from 'lucide-react';

/**
 * FilterChips component to display and clear active filters.
 *
 * @param {Object} props
 * @param {Array<{ key: string, label: string, value: string }>} props.filters
 * @param {(key: string) => void} props.onRemove
 * @param {() => void} [props.onClearAll]
 * @param {string} [props.className]
 */
export function FilterChips({ filters = [], onRemove, onClearAll, className }) {
  if (filters.length === 0) return null;

  return (
    <div className={clsx('flex flex-wrap items-center gap-1.5 py-1', className)}>
      <span className="text-xs text-zinc-400 select-none mr-1">Active filters:</span>
      {filters.map((f) => (
        <span
          key={f.key}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
        >
          <span className="text-zinc-400">{f.label}:</span>
          <span className="font-semibold">{f.value}</span>
          <button
            type="button"
            onClick={() => onRemove(f.key)}
            className="hover:text-rose-500 rounded p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {filters.length > 1 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium ml-1 cursor-pointer"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
