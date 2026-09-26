import { prisma } from '../lib/prisma.js';
import { InsufficientStockError, NotFoundError, ValidationError } from '../lib/errors.js';
import { toNumber } from '../lib/serialize.js';

/*
 * Stock model (see docs/ARCHITECTURE.md):
 *  - StockQuant = on-hand quantity per product per INTERNAL location.
 *  - StockMove  = immutable ledger row (quantity always positive, from → to).
 *  - Virtual locations (VENDOR, CUSTOMER, ADJUSTMENT) never hold quants.
 *
 * All mutating functions take a transaction client `tx`. Callers must emit
 * eventBus events only AFTER the transaction commits.
 */

const round3 = (n) => Math.round(n * 1000) / 1000;

/** Operation types whose READY lines reserve stock at their source location. */
const RESERVING_TYPES = ['DELIVERY', 'INTERNAL'];

const virtualCache = new Map();

/**
 * Get the virtual location for a type (created by the seed; created here on demand if missing).
 * @param {'VENDOR'|'CUSTOMER'|'ADJUSTMENT'} type
 * @param {object} [tx]
 * @returns {Promise<{ id: string, name: string, shortCode: string, type: string }>}
 */
export async function getVirtualLocation(type, tx = prisma) {
  if (!['VENDOR', 'CUSTOMER', 'ADJUSTMENT'].includes(type)) {
    throw new ValidationError(`Not a virtual location type: ${type}`);
  }
  if (virtualCache.has(type)) return virtualCache.get(type);

  let loc = await tx.location.findFirst({ where: { type, warehouseId: null } });
  if (!loc) {
    const names = { VENDOR: ['Vendors', 'VENDORS'], CUSTOMER: ['Customers', 'CUSTOMERS'], ADJUSTMENT: ['Inventory Adjustment', 'ADJUST'] };
    loc = await tx.location.create({ data: { name: names[type][0], shortCode: names[type][1], type } });
  }
  virtualCache.set(type, loc);
  return loc;
}

/**
 * Apply stock movements atomically and write the ledger.
 *
 * For each move:
 *  - from INTERNAL location → conditional decrement (`quantity >= qty`); if no row
 *    matched, throws InsufficientStockError (stock can never go negative).
 *  - to INTERNAL location → upsert + increment.
 *  - virtual locations are never touched.
 *  - a StockMove ledger row is created.
 *
 * @param {object} tx Prisma transaction client
 * @param {{
 *   moves: Array<{ productId: string, fromLocationId: string, toLocationId: string, quantity: number|string, unitCost?: number|string, operationLineId?: string, note?: string }>,
 *   reference: string,
 *   type: 'RECEIPT'|'DELIVERY'|'INTERNAL'|'ADJUSTMENT',
 *   operationId?: string|null,
 *   userId?: string|null,
 * }} params
 * @returns {Promise<{ productIds: string[], locationIds: string[], moveCount: number }>}
 *   ids touched — pass them to eventBus.emit('stock.changed', ...) after commit.
 */
export async function applyMoves(tx, { moves, reference, type, operationId = null, userId = null }) {
  if (!moves?.length) throw new ValidationError('No stock moves to apply');

  const locationIds = [...new Set(moves.flatMap((m) => [m.fromLocationId, m.toLocationId]))];
  const locations = await tx.location.findMany({ where: { id: { in: locationIds } }, select: { id: true, type: true, name: true } });
  const locById = new Map(locations.map((l) => [l.id, l]));

  const productIds = [...new Set(moves.map((m) => m.productId))];
  const products = await tx.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, sku: true, costPrice: true } });
  const productById = new Map(products.map((p) => [p.id, p]));

  const shortages = [];
  const ledger = [];

  for (const move of moves) {
    const qty = round3(toNumber(move.quantity));
    if (!(qty > 0)) throw new ValidationError('Move quantity must be greater than 0');

    const from = locById.get(move.fromLocationId);
    const to = locById.get(move.toLocationId);
    const product = productById.get(move.productId);
    if (!from || !to) throw new NotFoundError('Location not found');
    if (!product) throw new NotFoundError('Product not found');
    if (from.id === to.id) throw new ValidationError('Source and destination locations must differ');

    if (from.type === 'INTERNAL') {
      const { count } = await tx.stockQuant.updateMany({
        where: { productId: product.id, locationId: from.id, quantity: { gte: qty } },
        data: { quantity: { decrement: qty } },
      });
      if (count === 0) {
        const available = await getOnHand(product.id, { locationId: from.id }, tx);
        shortages.push({
          lineId: move.operationLineId ?? null,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          locationId: from.id,
          locationName: from.name,
          required: qty,
          available,
          shortBy: round3(qty - available),
        });
        continue;
      }
    }

    if (to.type === 'INTERNAL') {
      await tx.stockQuant.upsert({
        where: { productId_locationId: { productId: product.id, locationId: to.id } },
        create: { productId: product.id, locationId: to.id, quantity: qty },
        update: { quantity: { increment: qty } },
      });
    }

    ledger.push({
      reference,
      type,
      operationId,
      operationLineId: move.operationLineId ?? null,
      productId: product.id,
      fromLocationId: from.id,
      toLocationId: to.id,
      quantity: qty,
      unitCost: move.unitCost ?? product.costPrice ?? 0,
      userId,
      note: move.note ?? null,
    });
  }

  // Throwing aborts the surrounding transaction, so partial decrements are rolled back.
  if (shortages.length) {
    throw new InsufficientStockError(
      shortages.length === 1
        ? `Not enough stock for ${shortages[0].productName}: required ${shortages[0].required}, available ${shortages[0].available}`
        : `Not enough stock for ${shortages.length} products`,
      shortages,
    );
  }

  await tx.stockMove.createMany({ data: ledger });
  return { productIds, locationIds, moveCount: ledger.length };
}

/**
 * On-hand quantity of a product. Only INTERNAL locations are counted.
 * With `locationId` → that location; with `warehouseId` → all its internal locations;
 * with neither → every internal location.
 *
 * @param {string} productId
 * @param {{ locationId?: string, warehouseId?: string }} [scope]
 * @param {object} [tx]
 * @returns {Promise<number>}
 */
export async function getOnHand(productId, { locationId, warehouseId } = {}, tx = prisma) {
  const agg = await tx.stockQuant.aggregate({
    _sum: { quantity: true },
    where: {
      productId,
      ...(locationId ? { locationId } : {}),
      location: { type: 'INTERNAL', ...(warehouseId ? { warehouseId } : {}) },
    },
  });
  return round3(toNumber(agg._sum.quantity));
}

/**
 * Quantity reserved at a location: sum of line quantities of READY DELIVERY/INTERNAL
 * operations whose source is that location.
 *
 * @param {string} productId
 * @param {string} locationId
 * @param {object} [tx]
 * @param {{ excludeOperationId?: string }} [opts] ignore one operation (e.g. the one being checked)
 * @returns {Promise<number>}
 */
export async function getReserved(productId, locationId, tx = prisma, { excludeOperationId } = {}) {
  const agg = await tx.operationLine.aggregate({
    _sum: { quantity: true },
    where: {
      productId,
      operation: {
        status: 'READY',
        type: { in: RESERVING_TYPES },
        sourceLocationId: locationId,
        ...(excludeOperationId ? { id: { not: excludeOperationId } } : {}),
      },
    },
  });
  return round3(toNumber(agg._sum.quantity));
}

/**
 * Free to use = on hand − reserved (never below 0).
 * @param {string} productId
 * @param {string} locationId
 * @param {object} [tx]
 * @param {{ excludeOperationId?: string }} [opts]
 * @returns {Promise<number>}
 */
export async function getFreeToUse(productId, locationId, tx = prisma, opts = {}) {
  const [onHand, reserved] = await Promise.all([
    getOnHand(productId, { locationId }, tx),
    getReserved(productId, locationId, tx, opts),
  ]);
  return Math.max(0, round3(onHand - reserved));
}

/**
 * Check whether an operation's source location can supply all its lines.
 * Stock reserved by OTHER READY operations is not available; the operation's own
 * reservation is excluded. Lines of the same product share the available quantity.
 * Operations whose source is a virtual location (receipts) are always available.
 *
 * @param {{ id?: string, sourceLocationId: string, lines: Array<{ id?: string, productId: string, quantity: any }> }} operation
 * @param {object} [tx]
 * @returns {Promise<Array<{ lineId: string|null, productId: string, required: number, available: number, shortBy: number }>>}
 *   shortBy > 0 means the line cannot be fulfilled.
 */
export async function checkAvailability(operation, tx = prisma) {
  const source = await tx.location.findUnique({ where: { id: operation.sourceLocationId }, select: { type: true } });
  if (!source) throw new NotFoundError('Source location not found');

  const isVirtual = source.type !== 'INTERNAL';
  const freeByProduct = new Map();
  const result = [];

  for (const line of operation.lines) {
    const required = round3(toNumber(line.quantity));
    if (isVirtual) {
      result.push({ lineId: line.id ?? null, productId: line.productId, required, available: required, shortBy: 0 });
      continue;
    }
    if (!freeByProduct.has(line.productId)) {
      freeByProduct.set(
        line.productId,
        await getFreeToUse(line.productId, operation.sourceLocationId, tx, { excludeOperationId: operation.id }),
      );
    }
    const available = freeByProduct.get(line.productId);
    const shortBy = Math.max(0, round3(required - available));
    freeByProduct.set(line.productId, Math.max(0, round3(available - required)));
    result.push({ lineId: line.id ?? null, productId: line.productId, required, available, shortBy });
  }
  return result;
}
