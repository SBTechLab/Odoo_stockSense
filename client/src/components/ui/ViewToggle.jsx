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
export function ViewToggle({ view = 'list', onChange, options, className }) {
  const resolvedOptions = options || [
    { id: 'list', label: 'List', icon: <List className="w-3.5 h-3.5" /> },
    { id: 'kanban', label: 'Kanban', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      role="group"
      aria-label="View layout toggle"
      className={clsx(
        'inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-800/60 p-0.5 select-none shadow-2xs min-h-[36px] sm:min-h-[32px]',
        className
      )}
    >
      {resolvedOptions.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          aria-label={opt.label}
          aria-pressed={view === opt.id}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
            view === opt.id
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          )}
        >
          {opt.icon || (opt.id === 'list' ? <List className="w-3.5 h-3.5" /> : opt.id === 'kanban' ? <LayoutGrid className="w-3.5 h-3.5" /> : null)}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
