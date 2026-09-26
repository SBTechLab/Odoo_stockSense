import { forwardRef } from 'react';
import clsx from 'clsx';
import { Calendar } from 'lucide-react';

/**
 * Standard date input with calendar icon.
 */
export const DateInput = forwardRef(function DateInput(
  { className, error, ...props },
  ref
) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
        <Calendar className="w-4 h-4" />
      </div>
      <input
        ref={ref}
        type="date"
        className={clsx(
          'w-full rounded-lg text-sm bg-white dark:bg-zinc-900 border pl-9 pr-3.5 py-2 min-h-[40px] transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
          'disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed',
          error
            ? 'border-rose-500 text-rose-900 dark:text-rose-200'
            : 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100',
          className
        )}
        {...props}
      />
    </div>
  );
});
