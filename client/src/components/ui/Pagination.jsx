import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Standard Pagination component.
 *
 * @param {Object} props
 * @param {number} props.page Current page (1-indexed)
 * @param {number} props.totalPages Total number of pages
 * @param {number} props.total Total record count
 * @param {number} props.limit Rows per page
 * @param {(newPage: number) => void} props.onPageChange
 * @param {(newLimit: number) => void} [props.onLimitChange]
 * @param {string} [props.className]
 */
export function Pagination({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 20,
  onPageChange,
  onLimitChange,
  className,
}) {
  const fromRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const toRecord = Math.min(page * limit, total);

  return (
    <div
      className={clsx(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 select-none',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span>
          Showing <strong className="text-zinc-800 dark:text-zinc-200">{fromRecord}</strong> to{' '}
          <strong className="text-zinc-800 dark:text-zinc-200">{toRecord}</strong> of{' '}
          <strong className="text-zinc-800 dark:text-zinc-200">{total}</strong> records
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-4">
            <span>Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          icon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>

        <span className="px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Page {page} of {totalPages || 1}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          iconRight={<ChevronRight className="w-4 h-4" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
