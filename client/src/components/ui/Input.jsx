import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Standard text input component.
 */
export const Input = forwardRef(function Input(
  { className, type = 'text', error, icon, iconRight, ...props },
  ref
) {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        type={type}
        className={clsx(
          'w-full rounded-lg text-sm bg-white dark:bg-zinc-900 border transition-colors',
          'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
          'disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed',
          error
            ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500 text-rose-900 dark:text-rose-200'
            : 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100',
          icon ? 'pl-9' : 'pl-3.5',
          iconRight ? 'pr-9' : 'pr-3.5',
          'py-2 min-h-[40px]',
          className
        )}
        {...props}
      />
      {iconRight && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400">
          {iconRight}
        </div>
      )}
    </div>
  );
});
