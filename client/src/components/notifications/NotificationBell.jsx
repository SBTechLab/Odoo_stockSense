import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Bell, AlertTriangle, XCircle, Clock, CheckCheck, ExternalLink } from 'lucide-react';
import { useSSE } from '../../hooks/useSSE.js';
import { toast } from 'sonner';
import {
  listNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '../../api/notifications.js';

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await listNotificationsApi({ limit: 15 });
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen to SSE live notification events
  useSSE('notification.created', (newNotif) => {
    toast.info(newNotif.title, { description: newNotif.message });
    fetchNotifications();
  });

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id, link, e) => {
    e.stopPropagation();
    try {
      await markNotificationReadApi(id);
      fetchNotifications();
      if (link) {
        setOpen(false);
        navigate(link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'OUT_OF_STOCK') return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
    if (type === 'LOW_STOCK') return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
    if (type === 'LATE_OPERATION') return <Clock className="w-4 h-4 text-amber-600 shrink-0" />;
    return <Bell className="w-4 h-4 text-teal-600 shrink-0" />;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-88 sm:w-96 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-4 z-50 animate-in fade-in-0 zoom-in-95 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-teal-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
                No notifications right now. You are all caught up!
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={(e) => handleMarkRead(n.id, n.link, e)}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-3 transition-colors cursor-pointer ${
                    !n.readAt
                      ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-900/50'
                      : 'bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-800 opacity-75'
                  }`}
                >
                  {getTypeIcon(n.type)}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{n.title}</span>
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
