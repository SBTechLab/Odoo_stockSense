import clsx from 'clsx';

/**
 * Standard FormField wrapper with accessible label, error message, and hint.
 *
 * @param {Object} props
 * @param {string} [props.label]
 * @param {string} [props.htmlFor]
 * @param {boolean} [props.required=false]
 * @param {string} [props.error]
 * @param {string} [props.hint]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 */
export function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className,
}) {
  return (
    <div className={clsx('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 select-none flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </span>
        </label>
      )}

      {children}

      {hint && !error && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}

      {error && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 animate-in fade-in-50">
          {error}
        </p>
      )}
    </div>
  );
}
