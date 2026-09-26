import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

/**
 * Standard accessible DropdownMenu component.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.trigger
 * @param {Array<{ label: string, icon?: React.ReactNode, onClick: () => void, danger?: boolean, disabled?: boolean }>} props.items
 * @param {'left'|'right'} [props.align='right']
 * @param {string} [props.className]
 */
export function DropdownMenu({ trigger, items = [], align = 'right', className }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className={clsx('relative inline-block text-left', className)}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={clsx(
            'absolute z-50 mt-1.5 w-48 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg p-1 animate-in fade-in-0 zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              role="menuitem"
              type="button"
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer text-left',
                item.danger
                  ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                item.disabled && 'opacity-50 pointer-events-none'
              )}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
