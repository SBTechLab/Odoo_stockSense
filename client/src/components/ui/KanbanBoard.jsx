import clsx from 'clsx';

/**
 * Generic KanbanBoard component.
 *
 * @param {Object} props
 * @param {Array<{ id: string, title: string, color?: string, badgeClass?: string }>} props.columns
 * @param {Array<any>} props.items
 * @param {(item: any) => string} props.getItemColumnId
 * @param {(item: any) => React.ReactNode} props.renderCard
 * @param {(item: any) => void} [props.onCardClick]
 * @param {string} [props.className]
 */
export function KanbanBoard({
  columns = [],
  items = [],
  getItemColumnId,
  renderCard,
  onCardClick,
  className,
}) {
  return (
    <div
      className={clsx(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-x-auto pb-4',
        className
      )}
    >
      {columns.map((col) => {
        const columnItems = items.filter((item) => getItemColumnId(item) === col.id);

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-xl bg-zinc-100/70 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 min-w-[260px] p-3 max-h-[calc(100vh-220px)]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  {col.title}
                </span>
                <span className="text-[11px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {columnItems.length}
                </span>
              </div>
            </div>

            {/* Column Cards */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {columnItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500 italic">
                  No items
                </div>
              ) : (
                columnItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    onClick={() => onCardClick?.(item)}
                    className={clsx(
                      'transition-all',
                      onCardClick && 'cursor-pointer hover:-translate-y-0.5'
                    )}
                  >
                    {renderCard(item)}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
