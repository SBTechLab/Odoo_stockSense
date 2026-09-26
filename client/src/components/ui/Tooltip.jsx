import { useState } from 'react';
import clsx from 'clsx';

/**
 * Standard hover Tooltip component.
 *
 * @param {Object} props
 * @param {string} props.content
 * @param {React.ReactNode} props.children
 * @param {'top'|'bottom'|'left'|'right'} [props.position='top']
 */
export function Tooltip({ content, children, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          role="tooltip"
          className={clsx(
            'absolute z-50 px-2 py-1 text-[11px] font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded shadow-md pointer-events-none whitespace-nowrap animate-in fade-in-0 zoom-in-95',
            positions[position]
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
