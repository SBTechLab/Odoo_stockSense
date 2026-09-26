import { forwardRef } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

/**
 * Standard accessible Button component supporting multiple variants and sizes.
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
    ...props
  },
  ref
) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-3.5 py-2 gap-2 min-h-[40px]',
    lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[44px]',
  };

  const variants = {
    primary:
      'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs dark:bg-teal-600 dark:hover:bg-teal-500',
    secondary:
      'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 shadow-xs dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-700',
    outline:
      'bg-transparent hover:bg-zinc-100 text-zinc-700 border border-zinc-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800',
    ghost:
      'bg-transparent hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/80',
    danger:
      'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs dark:bg-rose-600 dark:hover:bg-rose-500',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={clsx(baseStyles, sizes[size], variants[variant], className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
});
