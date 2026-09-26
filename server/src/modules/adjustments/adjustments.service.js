import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../lib/activity.js';
import { eventBus, EVENTS } from '../../lib/eventBus.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { parsePagination, buildMeta } from '../../lib/pagination.js';
import { nextReference } from '../../services/sequence.service.js';
import * as stockService from '../../services/stock.service.js';
import { toNumber } from '../../lib/serialize.js';

const round3 = (n) => Math.round(n * 1000) / 1000;

const INCLUDE_FULL = {
  warehouse: { select: { id: true, name: true, shortCode: true } },
  sourceLocation: { select: { id: true, name: true, shortCode: true, type: true } },
  destLocation: { select: { id: true, name: true, shortCode: true, type: true } },
  responsible: { select: { id: true, name: true } },
  validatedBy: { select: { id: true, name: true } },
  lines: {
    include: {
      product: { select: { id: true, name: true, sku: true, uom: true, costPrice: true } },
    },
  },
};

export async function list(query) {
  const { search, warehouseId } = query;
  const { skip, take, orderBy, page, limit } = parsePagination(query, {
    allowedSort: ['createdAt'],
    defaultSort: '-createdAt',
  });

  const where = {
    type: 'ADJUSTMENT',
    ...(warehouseId ? { warehouseId } : {}),
    ...(search
      ? {
          OR: [
            { reference: { contains: search, mode: 'insensitive' } },
            { reason: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.operation.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        sourceLocation: { select: { id: true, name: true, shortCode: true, type: true } },
        warehouse: { select: { id: true, name: true, shortCode: true } },
        _count: { select: { lines: true } },
        lines: { select: { quantity: true } },
      },
    }),
    prisma.operation.count({ where }),
  ]);

  const data = rows.map((op) => ({
    ...op,
    lineCount: op._count.lines,
    totalDifference: round3(op.lines.reduce((acc, l) => acc + toNumber(l.quantity), 0)),
    sourceName: op.sourceLocation
      ? op.sourceLocation.type === 'INTERNAL'
        ? `${op.warehouse.shortCode}/${op.sourceLocation.shortCode}`
        : op.sourceLocation.name
      : null,
  }));

  return { data, meta: buildMeta({ page, limit }, total) };
}

export async function getById(id) {
  const op = await prisma.operation.findUnique({ where: { id, type: 'ADJUSTMENT' }, include: INCLUDE_FULL });
  if (!op) throw new NotFoundError('Adjustment not found');

  const sourceName = op.sourceLocation
    ? op.sourceLocation.type === 'INTERNAL'
      ? `${op.warehouse.shortCode}/${op.sourceLocation.shortCode}`
      : op.sourceLocation.name
    : null;

  return { ...op, sourceName };
}

export async function getOnHand(locationId, productId) {
  const location = await prisma.location.findUnique({ where: { id: locationId }, select: { type: true } });
  if (!location) throw new NotFoundError('Location not found');
  if (location.type !== 'INTERNAL') throw new ValidationError('On-hand query requires an INTERNAL location');

  if (productId) {
    const onHand = await stockService.getOnHand(productId, { locationId });
    return { onHand };
  }

  // Return all products at this location
  const quants = await prisma.stockQuant.findMany({
    where: { locationId },
    include: { product: { select: { id: true, name: true, sku: true, uom: true } } },
  });
  return quants.map((q) => ({ productId: q.productId, product: q.product, onHand: toNumber(q.quantity) }));
}

export async function create(userId, body) {
  const { locationId, reason, notes, lines } = body;

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { warehouse: { select: { id: true, shortCode: true } } },
  });
  if (!location) throw new NotFoundError('Location not found');
  if (location.type !== 'INTERNAL') throw new ValidationError('Adjustments require an INTERNAL location');
  if (!location.warehouseId) throw new ValidationError('Location must belong to a warehouse');

  const adjustmentLoc = await stockService.getVirtualLocation('ADJUSTMENT');

  // Compute theoretical quantities and differences
  const lineData = await Promise.all(
    lines.map(async (line) => {
      const theoretical = await stockService.getOnHand(line.productId, { locationId });
      const counted = round3(line.countedQuantity);
      const diff = round3(counted - theoretical);
      return { productId: line.productId, theoretical, counted, diff };
    })
  );

  const nonZeroLines = lineData.filter((l) => l.diff !== 0);
  if (nonZeroLines.length === 0) throw new ValidationError('No difference to adjust');

  const op = await prisma.$transaction(async (tx) => {
    const reference = await nextReference(tx, location.warehouseId, 'ADJUSTMENT');

    const operation = await tx.operation.create({
      data: {
        reference,
        type: 'ADJUSTMENT',
        status: 'DONE',
        warehouseId: location.warehouseId,
        sourceLocationId: locationId,
        destLocationId: adjustmentLoc.id,
        reason,
        notes: notes || null,
        responsibleId: userId,
        createdById: userId,
        validatedById: userId,
        validatedAt: new Date(),
        lines: {
          create: nonZeroLines.map((l) => ({
            productId: l.productId,
            quantity: l.diff,
            theoreticalQuantity: l.theoretical,
            countedQuantity: l.counted,
          })),
        },
      },
      include: INCLUDE_FULL,
    });

    // Apply moves: positive diff = ADJUSTMENT → location; negative = location → ADJUSTMENT
    const moves = nonZeroLines.map((l) => ({
      productId: l.productId,
      fromLocationId: l.diff > 0 ? adjustmentLoc.id : locationId,
      toLocationId: l.diff > 0 ? locationId : adjustmentLoc.id,
      quantity: Math.abs(l.diff),
      operationLineId: operation.lines.find((ol) => ol.productId === l.productId)?.id,
    }));

    const { productIds, locationIds } = await stockService.applyMoves(tx, {
      moves,
      reference,
      type: 'ADJUSTMENT',
      operationId: operation.id,
      userId,
    });

    await logActivity(tx, { userId, action: 'adjustment.create', entityType: 'Operation', entityId: operation.id, metadata: { reference, reason, lineCount: nonZeroLines.length } });

    return { operation, productIds, locationIds };
  });

  eventBus.emit(EVENTS.OPERATION_CHANGED, { id: op.operation.id, type: 'ADJUSTMENT', status: 'DONE' });
  eventBus.emit(EVENTS.STOCK_CHANGED, { productIds: op.productIds, locationIds: op.locationIds });
  return op.operation;
}
