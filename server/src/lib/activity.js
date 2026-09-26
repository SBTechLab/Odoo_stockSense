import { prisma } from './prisma.js';

/**
 * Append an audit entry. Pass the transaction client when inside a transaction
 * so the log is rolled back together with the change.
 * Never throws: auditing must not break the main flow.
 *
 * @param {object} txOrPrisma Prisma transaction client or the shared prisma client.
 * @param {{ userId?: string|null, action: string, entityType: string, entityId?: string|null, metadata?: object }} entry
 *   `action` uses "<entity>.<verb>", e.g. "warehouse.create", "operation.validate".
 * @returns {Promise<void>}
 */
export async function logActivity(txOrPrisma, { userId = null, action, entityType, entityId = null, metadata }) {
  try {
    await (txOrPrisma ?? prisma).activityLog.create({
      data: { userId, action, entityType, entityId, metadata: metadata ?? undefined },
    });
  } catch (err) {
    console.error('[activity] failed to log', action, err.message);
  }
}
