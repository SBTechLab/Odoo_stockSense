import clsx from 'clsx';

/**
 * Generic Badge component.
 *
 * @param {Object} props
 * @param {'zinc'|'teal'|'amber'|'sky'|'emerald'|'rose'|'violet'|'purple'|'blue'} [props.variant='zinc']
 * @param {'sm'|'md'} [props.size='md']
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 */
export function Badge({
  variant = 'zinc',
  size = 'md',
  icon,
  children,
  className,
}) {
  const variants = {
    zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    teal: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    sky: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    violet: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border shrink-0 select-none',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
