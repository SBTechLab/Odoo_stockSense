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
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20',
        className
      )}
    >
      <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 mb-3">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-rose-900 dark:text-rose-200">{title}</h4>
      <p className="text-xs text-rose-700 dark:text-rose-300 max-w-sm mt-1 mb-4">{message}</p>
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
