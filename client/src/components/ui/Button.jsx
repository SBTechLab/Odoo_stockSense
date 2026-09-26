import { forwardRef } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

/**
 * Standard accessible Button component supporting multiple variants and sizes.
 * Designed for 36px desktop height and 40px mobile touch targets.
 *
 * @param {Object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'|'outline'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.loading=false]
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} [props.iconRight]
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconRight,
    children,
    className,
    disabled = false,
    type = 'button',
    'aria-label': ariaLabel,
    ...props
  },
  ref
) {
  const isIconOnly = !children && (icon || iconRight);

  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

  const sizes = {
    sm: clsx(
      'text-xs px-2.5 py-1.5 gap-1.5 h-8 min-h-[32px]',
      isIconOnly && 'w-8 px-0'
    ),
    md: clsx(
      'text-sm px-3.5 py-2 gap-2 min-h-[40px] md:min-h-[36px] md:h-9',
      isIconOnly && 'w-10 md:w-9 px-0'
    ),
    lg: clsx(
      'text-base px-5 py-2.5 gap-2.5 min-h-[44px] h-11',
      isIconOnly && 'w-11 px-0'
    ),
  };

  const variants = {
    primary:
      'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs dark:bg-teal-600 dark:hover:bg-teal-500 font-medium',
    secondary:
      'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 shadow-xs active:bg-zinc-100 dark:active:bg-zinc-800',
    outline:
      'bg-transparent hover:bg-zinc-100/80 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-800/80',
    ghost:
      'bg-transparent hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/80 active:bg-zinc-200/60 dark:active:bg-zinc-700/60',
    danger:
      'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs dark:bg-rose-600 dark:hover:bg-rose-500 font-medium',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-label={isIconOnly ? ariaLabel || 'Action button' : ariaLabel}
      className={clsx(baseStyles, sizes[size], variants[variant], className)}
      {...props}
    >
      {/* Loading Spinner without width jump */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
        </span>
      )}

      <span className={clsx('inline-flex items-center gap-2', loading && 'opacity-0')}>
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
        {iconRight && <span className="shrink-0">{iconRight}</span>}
      </span>
    </button>
  );
});
