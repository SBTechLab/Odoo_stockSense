import clsx from 'clsx';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from './Skeleton.jsx';
import { EmptyState } from './EmptyState.jsx';
import { Pagination } from './Pagination.jsx';

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
  // extra props used by some pages
  emptyTitle,
  emptyDescription,
  emptyIcon,
  pagination,
  onPageChange,
  className,
}) {
  const resolvedEmpty = emptyState || (
    <EmptyState
      icon={emptyIcon}
      title={emptyTitle || 'No records found'}
      description={emptyDescription}
    />
  );

  return (
    <div className={clsx('space-y-3', className)}>
      <div className="w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 sticky top-0 z-10 backdrop-blur-xs">
                {columns.map((col, idx) => {
                  const isSorted = sortField === col.key;
                  const isRight = col.align === 'right';
                  const isCenter = col.align === 'center';
                  // support both header and label
                  const heading = col.header ?? col.label;

                  return (
                    <th
                      key={col.key ?? col.id ?? idx}
                      scope="col"
                      className={clsx(
                        'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 select-none whitespace-nowrap',
                        col.sortable && 'cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors',
                        isRight && 'text-right',
                        isCenter && 'text-center',
                        col.className
                      )}
                      onClick={() => col.sortable && onSort?.(col.key)}
                    >
                      <div className={clsx('flex items-center gap-1.5', isRight && 'justify-end', isCenter && 'justify-center')}>
                        <span>{heading}</span>
                        {col.sortable && (
                          <span className="shrink-0 text-zinc-400">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
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
                  <tr key={`skel-${i}`} className="h-[44px]">
                    {columns.map((col, cIdx) => (
                      <td key={`skel-td-${cIdx}`} className="px-4 py-2.5">
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center">
                    {resolvedEmpty}
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const customRowClass = typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;
                  return (
                    <tr
                      key={row.id || idx}
                      onClick={() => onRowClick?.(row)}
                      className={clsx(
                        'h-[44px] transition-colors duration-150',
                        onRowClick && 'cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-850/60',
                        customRowClass
                      )}
                    >
                      {columns.map((col, cIdx) => {
                        const isRight = col.align === 'right';
                        const isCenter = col.align === 'center';
                        // support both render and cell({ row }) formats
                        const cellContent = col.render
                          ? col.render(row)
                          : col.cell
                          ? col.cell({ row })
                          : row[col.key ?? col.accessorKey] ?? '—';

                        return (
                          <td
                            key={col.key ?? col.id ?? cIdx}
                            className={clsx(
                              'px-4 py-2 text-zinc-800 dark:text-zinc-200 whitespace-nowrap text-sm',
                              isRight && 'text-right font-mono tabular-nums',
                              isCenter && 'text-center',
                              col.className
                            )}
                          >
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="flex justify-end">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
