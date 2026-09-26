import clsx from 'clsx';
import { OPERATION_TYPE_CONFIG } from '../../constants/status.js';

/**
 * DirectionBadge component for operation types / movement directions (RECEIPT/IN, DELIVERY/OUT, INTERNAL/INT, ADJUSTMENT/ADJ).
 *
 * @param {Object} props
 * @param {'RECEIPT'|'DELIVERY'|'INTERNAL'|'ADJUSTMENT'} props.type
 * @param {boolean} [props.showPrefixOnly=false]
 * @param {string} [props.className]
 */
export function DirectionBadge({ type, showPrefixOnly = false, className }) {
  const config = OPERATION_TYPE_CONFIG[type] || {
    label: type || 'MOVE',
    prefix: type || 'MOV',
    colorClass: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center font-mono font-bold text-[11px] px-2 py-0.5 rounded border select-none',
        config.colorClass,
        className
      )}
    >
      {showPrefixOnly ? config.prefix : config.label}
    </span>
  );
}
