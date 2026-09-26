import { forwardRef } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

/**
 * Standard native select dropdown component.
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
          'w-full appearance-none rounded-lg text-sm bg-white dark:bg-zinc-900 border pl-3.5 pr-10 py-2 min-h-[40px] transition-colors cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
          'disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed',
          error
            ? 'border-rose-500 text-rose-900 dark:text-rose-200 focus:ring-rose-500'
            : 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100',
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
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
});
