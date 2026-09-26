import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Standard multiline textarea component.
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
        'w-full rounded-lg text-sm bg-white dark:bg-zinc-900 border px-3.5 py-2.5 transition-colors',
        'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
        'disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed',
        error
          ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500 text-rose-900 dark:text-rose-200'
          : 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100',
        className
      )}
      {...props}
    />
  );
});
