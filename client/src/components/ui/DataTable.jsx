import clsx from 'clsx';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from './Skeleton.jsx';
import { EmptyState } from './EmptyState.jsx';

/**
 * High-performance, responsive DataTable component.
 *
 * @param {Object} props
 * @param {Array<{ key: string, header: React.ReactNode, render?: (row: any) => React.ReactNode, className?: string, sortable?: boolean }>} props.columns
 * @param {Array<any>} props.data
 * @param {boolean} [props.loading=false]
 * @param {string} [props.sortField]
 * @param {'asc'|'desc'} [props.sortDirection]
 * @param {(field: string) => void} [props.onSort]
 * @param {(row: any) => void} [props.onRowClick]
 * @param {(row: any) => string} [props.rowClassName]
 * @param {React.ReactNode} [props.emptyState]
 * @param {string} [props.className]
 */
export function DataTable({
  columns,
  data = [],
  loading = false,
  sortField,
  sortDirection,
  onSort,
  onRowClick,
  rowClassName,
  emptyState,
  className,
}) {
  return (
    <div
      className={clsx(
        'w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-xs',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-xs">
              {columns.map((col) => {
                const isSorted = sortField === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={clsx(
                      'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 select-none whitespace-nowrap',
                      col.sortable && 'cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100',
                      col.className
                    )}
                    onClick={() => col.sortable && onSort?.(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="shrink-0 text-zinc-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-teal-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-teal-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={`skel-td-${cIdx}`} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center">
                  {emptyState || <EmptyState title="No records found" />}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const customRowClass = rowClassName?.(row);
                return (
                  <tr
                    key={row.id || idx}
                    onClick={() => onRowClick?.(row)}
                    className={clsx(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                      customRowClass
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={clsx(
                          'px-4 py-3 text-zinc-800 dark:text-zinc-200 whitespace-nowrap',
                          col.className
                        )}
                      >
                        {col.render ? col.render(row) : row[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
