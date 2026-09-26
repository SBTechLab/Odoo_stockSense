import { Link } from 'react-router';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';

/**
 * Standard PageHeader component with breadcrumbs, 24px semibold title, and action buttons.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {Array<{ label: string, href?: string }>} [props.breadcrumbs]
 * @param {React.ReactNode} [props.actions]
 * @param {string} [props.className]
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  action,
  className,
}) {
  const resolvedActions = actions || action;
  return (
    <div className={clsx('flex flex-col gap-2 mb-6', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 select-none">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-400/80 shrink-0" />}
                {crumb.href && !isLast ? (
                  <Link
                    to={crumb.href}
                    className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={clsx(isLast && 'font-medium text-zinc-800 dark:text-zinc-200')}>
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}

      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
              {subtitle}
            </p>
          )}
        </div>

        {resolvedActions && <div className="flex items-center gap-2.5 shrink-0">{resolvedActions}</div>}
      </div>
    </div>
  );
}
