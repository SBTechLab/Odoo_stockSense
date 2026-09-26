import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Standard accessible checkbox component.
 */
export const Checkbox = forwardRef(function Checkbox(
  { label, description, className, error, id, ...props },
  ref
) {
  const checkboxId = id || (label ? `cb-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={clsx('flex items-start gap-2.5', className)}>
      <div className="flex items-center h-5">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={clsx(
            'w-4 h-4 rounded text-teal-600 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900',
            'focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 transition-colors cursor-pointer',
            error && 'border-rose-500'
          )}
          {...props}
        />
      </div>
      {(label || description) && (
        <div className="text-sm">
          {label && (
            <label
              htmlFor={checkboxId}
              className="font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer select-none"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
          )}
        </div>
      )}
    </div>
  );
});
