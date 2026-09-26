import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Standard input component styled for high-density SaaS (36px desktop, 40px mobile).
 */
export const Input = forwardRef(function Input(
  { className, type = 'text', error, icon, iconRight, ...props },
  ref
) {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        type={type}
        className={clsx(
          'w-full rounded-lg text-sm bg-white dark:bg-zinc-900 border transition-all duration-150',
          'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
          'focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500',
          'disabled:bg-zinc-50 dark:disabled:bg-zinc-800/50 disabled:opacity-60 disabled:cursor-not-allowed',
          error
            ? 'border-rose-400 dark:border-rose-700/80 focus:ring-rose-500/25 focus:border-rose-500 text-rose-900 dark:text-rose-200'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-900 dark:text-zinc-100',
          icon ? 'pl-9' : 'pl-3',
          iconRight ? 'pr-9' : 'pr-3',
          'min-h-[40px] md:min-h-[36px] md:h-9 py-1.5',
          className
        )}
        {...props}
      />
      {iconRight && (
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 dark:text-zinc-500">
          {iconRight}
        </div>
      )}
    </div>
  );
});
