import { useEffect, useRef } from 'react';

/**
 * Hook to subscribe to Server-Sent Events from /api/events.
 * @param {string} eventName Event name to listen to ('stock.changed', 'operation.changed', 'notification.created')
 * @param {(data: any) => void} handler Callback invoked with parsed JSON payload
 */
export function useSSE(eventName, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    let eventSource = null;
    let isSubscribed = true;

    function connect() {
      // Connect to SSE stream
      eventSource = new EventSource('/api/events', { withCredentials: true });

      eventSource.addEventListener(eventName, (event) => {
        if (!isSubscribed) return;
        try {
          const parsed = JSON.parse(event.data);
          handlerRef.current?.(parsed);
        } catch {
          // ignore malformed payloads
        }
      });

      eventSource.onerror = () => {
        // EventSource will automatically reconnect, but if closed, retry
        if (eventSource.readyState === EventSource.CLOSED && isSubscribed) {
          setTimeout(connect, 5000);
        }
      };
    }

    connect();

    return () => {
      isSubscribed = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventName]);
}
