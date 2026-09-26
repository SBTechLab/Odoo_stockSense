import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Standard multiline textarea component with SaaS borders and focus rings.
 */
export const Textarea = forwardRef(function Textarea(
  { className, rows = 3, error, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={clsx(
        'w-full rounded-lg text-sm bg-white dark:bg-zinc-900 border px-3 py-2 transition-all duration-150',
        'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
        'focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500',
        'disabled:bg-zinc-50 dark:disabled:bg-zinc-800/50 disabled:opacity-60 disabled:cursor-not-allowed',
        error
          ? 'border-rose-400 dark:border-rose-700/80 focus:ring-rose-500/25 focus:border-rose-500 text-rose-900 dark:text-rose-200'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-900 dark:text-zinc-100',
        className
      )}
      {...props}
    />
  );
});
