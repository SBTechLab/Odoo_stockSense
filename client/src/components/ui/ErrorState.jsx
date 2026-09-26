import clsx from 'clsx';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Standard ErrorState view component with retry button.
 *
 * @param {Object} props
 * @param {string} [props.title='Failed to load data']
 * @param {string} [props.message]
 * @param {() => void} [props.onRetry]
 * @param {string} [props.className]
 */
export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry,
  className,
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/15 transition-colors',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-rose-100/80 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 flex items-center justify-center mb-3.5 shadow-2xs">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h4>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mt-1.5 mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
