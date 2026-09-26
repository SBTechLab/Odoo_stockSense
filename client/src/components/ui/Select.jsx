import { forwardRef } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

/**
 * Standard native select dropdown component styled for SaaS density.
 */
export const Select = forwardRef(function Select(
  { className, options = [], placeholder, error, children, ...props },
  ref
) {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        className={clsx(
          'w-full appearance-none rounded-lg text-sm bg-white dark:bg-zinc-900 border pl-3 pr-9 py-1.5 min-h-[40px] md:min-h-[36px] md:h-9 transition-all duration-150 cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500',
          'disabled:bg-zinc-50 dark:disabled:bg-zinc-800/50 disabled:opacity-60 disabled:cursor-not-allowed',
          error
            ? 'border-rose-400 dark:border-rose-700/80 text-rose-900 dark:text-rose-200 focus:ring-rose-500/25'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-900 dark:text-zinc-100',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
        <ChevronDown className="w-3.5 h-3.5" />
      </div>
    </div>
  );
});
