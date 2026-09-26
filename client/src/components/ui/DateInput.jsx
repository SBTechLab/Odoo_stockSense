import { forwardRef } from 'react';
import clsx from 'clsx';
import { Calendar } from 'lucide-react';

/**
 * Standard date input with calendar icon and SaaS styling.
 */
export const DateInput = forwardRef(function DateInput(
  { className, error, ...props },
  ref
) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
        <Calendar className="w-3.5 h-3.5" />
      </div>
      <input
        ref={ref}
        type="date"
        className={clsx(
          'w-full rounded-lg text-sm bg-white dark:bg-zinc-900 border pl-9 pr-3 py-1.5 min-h-[40px] md:min-h-[36px] md:h-9 transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500',
          'disabled:bg-zinc-50 dark:disabled:bg-zinc-800/50 disabled:opacity-60 disabled:cursor-not-allowed',
          error
            ? 'border-rose-400 dark:border-rose-700/80 text-rose-900 dark:text-rose-200'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-900 dark:text-zinc-100',
          className
        )}
        {...props}
      />
    </div>
  );
});
