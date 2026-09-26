import clsx from 'clsx';
import { OPERATION_STATUS_CONFIG } from '../../constants/status.js';

/**
 * StatusBadge component dedicated to displaying OperationStatus (Draft, Waiting, Ready, Done, Canceled).
 *
 * @param {Object} props
 * @param {'DRAFT'|'WAITING'|'READY'|'DONE'|'CANCELED'} props.status
 * @param {string} [props.className]
 */
export function StatusBadge({ status, className }) {
  const config = OPERATION_STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    dotClass: 'bg-zinc-400',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
        config.badgeClass,
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', config.dotClass)} />
      {config.label}
    </span>
  );
}
