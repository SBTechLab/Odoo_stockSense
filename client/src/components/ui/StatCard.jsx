import clsx from 'clsx';
import { Card } from './Card.jsx';

/**
 * Metric/KPI StatCard component styled for Linear/Stripe aesthetics.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string|number} props.value
 * @param {React.ReactNode} [props.icon]
 * @param {string} [props.delta] e.g. "+12% from last week"
 * @param {boolean} [props.isPositive]
 * @param {string} [props.subtitle]
 * @param {() => void} [props.onClick]
 * @param {string} [props.className]
 */
export function StatCard({
  title,
  value,
  icon,
  delta,
  isPositive,
  subtitle,
  onClick,
  className,
}) {
  const isClickable = Boolean(onClick);

  return (
    <Card
      onClick={onClick}
      className={clsx(
        'p-5 transition-all duration-150',
        isClickable &&
          'cursor-pointer hover:-translate-y-0.5 hover:shadow-sm hover:border-teal-500/40 active:translate-y-0 select-none',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {icon && (
          <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 ring-1 ring-teal-600/15 dark:ring-teal-500/20 shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[28px] font-semibold font-mono tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
          {value}
        </span>
        {delta && (
          <span
            className={clsx(
              'text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-md',
              isPositive
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-600/20'
                : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-600/20'
            )}
          >
            {delta}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 truncate leading-normal">
          {subtitle}
        </p>
      )}
    </Card>
  );
}
