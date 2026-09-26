import clsx from 'clsx';

/**
 * Standard Tabs component.
 *
 * @param {Object} props
 * @param {Array<{ id: string, label: string, icon?: React.ReactNode, count?: number }>} props.tabs
 * @param {string} props.activeTab
 * @param {(id: string) => void} props.onChange
 * @param {string} [props.className]
 */
export function Tabs({ tabs = [], activeTab, onChange, className }) {
  return (
    <div
      className={clsx(
        'flex border-b border-zinc-200 dark:border-zinc-800 gap-1 overflow-x-auto select-none',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer',
              isActive
                ? 'border-teal-600 text-teal-700 dark:text-teal-400 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  isActive
                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
