import clsx from 'clsx';
import { PackageOpen } from 'lucide-react';

/**
 * Standard EmptyState view component.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.icon]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action]
 * @param {string} [props.className]
 */
export function EmptyState({
  icon,
  title = 'No items found',
  description,
  action,
  className,
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30 transition-colors',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 ring-1 ring-zinc-200 dark:ring-zinc-700/60 flex items-center justify-center mb-3.5 shadow-2xs">
        {icon || <PackageOpen className="w-6 h-6" />}
      </div>
      <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h4>
      {description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1.5 mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
