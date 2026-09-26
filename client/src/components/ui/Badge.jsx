import clsx from 'clsx';

/**
 * Generic Badge component rendered as a soft pill with a subtle ring.
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
  color,
  size = 'md',
  dot: _dot, // accepted for API compatibility; not rendered yet
  icon,
  children,
  className,
}) {
  // Support both variant names and color names
  const VARIANT_MAP = {
    success: 'emerald',
    warning: 'amber',
    danger: 'rose',
    neutral: 'zinc',
    info: 'sky',
    primary: 'teal',
  };
  const resolvedVariant = color || VARIANT_MAP[variant] || variant;
  const variants = {
    zinc: 'bg-zinc-100/80 text-zinc-700 ring-1 ring-zinc-600/20 dark:bg-zinc-800/60 dark:text-zinc-300 dark:ring-zinc-700/60',
    teal: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-500/30',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/30',
    sky: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-500/30',
    emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/30',
    rose: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-500/30',
    violet: 'bg-violet-50 text-violet-700 ring-1 ring-violet-600/20 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-500/30',
    purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-500/30',
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-500/30',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-medium',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full shrink-0 select-none transition-colors',
        variants[resolvedVariant] || variants.zinc,
        sizes[size],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
