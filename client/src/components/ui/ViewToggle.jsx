import clsx from 'clsx';
import { List, LayoutGrid } from 'lucide-react';

/**
 * Standard ViewToggle component to switch between List and Kanban views.
 *
 * @param {Object} props
 * @param {'list'|'kanban'} props.view
 * @param {(newView: 'list'|'kanban') => void} props.onChange
 * @param {string} [props.className]
 */
export function ViewToggle({ view = 'list', onChange, className }) {
  return (
    <div
      role="group"
      aria-label="View layout toggle"
      className={clsx(
        'inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-800/60 p-0.5 select-none shadow-2xs min-h-[36px] sm:min-h-[32px]',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-label="List view"
        aria-pressed={view === 'list'}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
          view === 'list'
            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
        )}
      >
        <List className="w-3.5 h-3.5" />
        <span>List</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('kanban')}
        aria-label="Kanban view"
        aria-pressed={view === 'kanban'}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
          view === 'kanban'
            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
        )}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Kanban</span>
      </button>
    </div>
  );
}
