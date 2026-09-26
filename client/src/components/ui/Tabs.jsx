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
        'flex border-b border-zinc-200 dark:border-zinc-800 gap-1 overflow-x-auto select-none no-scrollbar',
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
              'flex items-center gap-2 px-3.5 py-2.5 min-h-[40px] md:min-h-[36px] text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer',
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
                  'text-[11px] font-mono font-medium px-1.5 py-0.5 rounded-full ring-1',
                  isActive
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 ring-teal-600/20'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 ring-zinc-200 dark:ring-zinc-700/60'
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
