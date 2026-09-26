import clsx from 'clsx';

/**
 * Standard Card container component with 12px radius and subtle shadow.
 */
export function Card({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className, children }) {
  return (
    <div
      className={clsx(
        'px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-4',
        className
      )}
    >
      {children ? (
        children
      ) : (
        <>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </>
      )}
    </div>
  );
}

export function CardBody({ children, className, ...props }) {
  return (
    <div className={clsx('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'px-5 py-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-xl flex items-center justify-between',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
