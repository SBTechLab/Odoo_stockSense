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
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
        className
      )}
    >
      <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 mb-3">
        {icon || <PackageOpen className="w-8 h-8" />}
      </div>
      <h4 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">{title}</h4>
      {description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
