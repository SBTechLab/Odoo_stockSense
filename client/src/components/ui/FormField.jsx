import clsx from 'clsx';

/**
 * Standard FormField wrapper with 13px medium label, required asterisk, and 12px error/hint layout.
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
          className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 select-none flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-rose-500 ml-1 font-semibold">*</span>}
          </span>
        </label>
      )}

      {children}

      {hint && !error && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">{hint}</p>
      )}

      {error && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 animate-in fade-in-50 leading-normal">
          {error}
        </p>
      )}
    </div>
  );
}
