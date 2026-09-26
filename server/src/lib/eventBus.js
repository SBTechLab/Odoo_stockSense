import { EventEmitter } from 'node:events';

/**
 * Process-wide event bus. The SSE endpoint (GET /api/events) forwards these to browsers.
 *
 * Events:
 *  - "stock.changed"        { productIds: string[], locationIds: string[] }
 *  - "operation.changed"    { id, type, status }
 *  - "notification.created" { id, userId|null, type, title }
 *
 * RULE: emit only AFTER the Prisma transaction has committed.
 */
export const eventBus = new EventEmitter();
eventBus.setMaxListeners(500);

export const EVENTS = Object.freeze({
  STOCK_CHANGED: 'stock.changed',
  OPERATION_CHANGED: 'operation.changed',
  NOTIFICATION_CREATED: 'notification.created',
});

/** Event names forwarded to SSE clients. */
export const SSE_EVENTS = Object.values(EVENTS);
