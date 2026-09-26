import { NotFoundError } from '../lib/errors.js';

/** Reference prefixes per OperationType. */
export const TYPE_PREFIX = Object.freeze({
  RECEIPT: 'IN',
  DELIVERY: 'OUT',
  INTERNAL: 'INT',
  ADJUSTMENT: 'ADJ',
});

/**
 * Format a reference like "WH/IN/0001".
 * @param {string} shortCode warehouse short code
 * @param {keyof TYPE_PREFIX} type
 * @param {number} n
 * @returns {string}
 */
export function formatReference(shortCode, type, n) {
  return `${shortCode}/${TYPE_PREFIX[type]}/${String(n).padStart(4, '0')}`;
}

/**
 * Reserve the next reference for a warehouse + operation type, e.g. "WH/IN/0001".
 *
 * Uses a single `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` statement, so two
 * concurrent requests can never receive the same number. Call it inside the same
 * transaction that creates the Operation so a rollback also frees nothing twice
 * (gaps are acceptable, duplicates are not).
 *
 * @param {object} tx Prisma transaction client (or prisma)
 * @param {string} warehouseId
 * @param {'RECEIPT'|'DELIVERY'|'INTERNAL'|'ADJUSTMENT'} type
 * @returns {Promise<string>} the new reference
 */
export async function nextReference(tx, warehouseId, type) {
  if (!TYPE_PREFIX[type]) throw new Error(`Unknown operation type: ${type}`);

  const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId }, select: { shortCode: true } });
  if (!warehouse) throw new NotFoundError('Warehouse not found');

  const rows = await tx.$queryRaw`
    INSERT INTO "SequenceCounter" ("id", "warehouseId", "type", "nextNumber", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, ${warehouseId}, ${type}::"OperationType", 2, now(), now())
    ON CONFLICT ("warehouseId", "type")
    DO UPDATE SET "nextNumber" = "SequenceCounter"."nextNumber" + 1, "updatedAt" = now()
    RETURNING "nextNumber"`;

  const issued = Number(rows[0].nextNumber) - 1;
  return formatReference(warehouse.shortCode, type, issued);
}
