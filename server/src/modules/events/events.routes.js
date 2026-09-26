import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { eventBus, SSE_EVENTS } from '../../lib/eventBus.js';

export const eventsRouter = Router();

eventsRouter.get('/', requireAuth, (req, res) => {
  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  // Initial connection handshake
  res.write(': connected\n\n');

  // Event handler generator
  const handlers = new Map();
  for (const eventName of SSE_EVENTS) {
    const handler = (data) => {
      try {
        res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch {
        // stream might be closed
      }
    };
    handlers.set(eventName, handler);
    eventBus.on(eventName, handler);
  }

  // Heartbeat ping every 25 seconds to keep connection alive
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      // ignore
    }
  }, 25000);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(heartbeatTimer);
    for (const [eventName, handler] of handlers) {
      eventBus.off(eventName, handler);
    }
    res.end();
  });
});
