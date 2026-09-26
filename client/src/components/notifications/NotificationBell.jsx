import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';

/**
 * NotificationBell component in Topbar.
 * Member 3 completes the full notification center.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {/* Unread indicator dot */}
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white dark:ring-zinc-900" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-4 z-50 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Notifications</h4>
            <span className="text-[11px] text-zinc-400">Live</span>
          </div>
          <div className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Notification Center active — full panel connected by Member 3
          </div>
        </div>
      )}
    </div>
  );
}
