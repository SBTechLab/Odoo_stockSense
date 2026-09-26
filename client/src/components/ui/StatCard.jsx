import clsx from 'clsx';
import { Card } from './Card.jsx';

/**
 * Metric/KPI StatCard component.
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
        'p-5 transition-all',
        isClickable &&
          'cursor-pointer hover:border-teal-500/50 hover:shadow-sm active:scale-[0.99] select-none',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </p>
        {icon && (
          <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
          {value}
        </span>
        {delta && (
          <span
            className={clsx(
              'text-xs font-medium',
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {delta}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      )}
    </Card>
  );
}
