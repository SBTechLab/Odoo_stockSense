import clsx from 'clsx';
import { OPERATION_STATUS_CONFIG } from '../../constants/status.js';

/**
 * StatusBadge component rendered as a calm, soft pill with a colored status dot and subtle ring.
 *
 * @param {Object} props
 * @param {'DRAFT'|'WAITING'|'READY'|'DONE'|'CANCELED'} props.status
 * @param {string} [props.className]
 */
export function StatusBadge({ status, className }) {
  const config = OPERATION_STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    badgeClass: 'bg-zinc-100/80 text-zinc-700 ring-1 ring-zinc-600/20 dark:bg-zinc-800/60 dark:text-zinc-300 dark:ring-zinc-700/60',
    dotClass: 'bg-zinc-400',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium select-none transition-colors',
        config.badgeClass,
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', config.dotClass)} />
      <span>{config.label}</span>
    </span>
  );
}
