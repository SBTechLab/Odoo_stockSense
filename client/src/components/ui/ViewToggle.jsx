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
      className={clsx(
        'inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 select-none shadow-xs',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-label="List view"
        className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
          view === 'list'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-teal-700 dark:text-teal-300 font-semibold shadow-xs'
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
        className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
          view === 'kanban'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-teal-700 dark:text-teal-300 font-semibold shadow-xs'
            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
        )}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Kanban</span>
      </button>
    </div>
  );
}
