import { prisma } from '../../lib/prisma.js';
import { nextReference } from '../../services/sequence.service.js';
import * as stockService from '../../services/stock.service.js';
import { logActivity } from '../../lib/activity.js';
import { eventBus, EVENTS } from '../../lib/eventBus.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { toNumber } from '../../lib/serialize.js';

const round3 = (n) => Math.round(n * 1000) / 1000;

function formatLocationName(loc) {
  if (!loc) return '';
  if (loc.warehouse?.shortCode) {
    return `${loc.warehouse.shortCode}/${loc.shortCode || loc.name}`;
  }
  return loc.name;
}

const ADJUSTMENT_INCLUDE = {
  warehouse: { select: { id: true, name: true, shortCode: true } },
  sourceLocation: {
    select: {
      id: true,
      name: true,
      shortCode: true,
      type: true,
      warehouse: { select: { id: true, name: true, shortCode: true } },
    },
  },
  destLocation: {
    select: {
      id: true,
      name: true,
      shortCode: true,
      type: true,
      warehouse: { select: { id: true, name: true, shortCode: true } },
    },
  },
  responsible: { select: { id: true, name: true, email: true } },
  validatedBy: { select: { id: true, name: true, email: true } },
  lines: {
    include: {
      product: { select: { id: true, name: true, sku: true, uom: true, costPrice: true } },
    },
  },
};

export async function create(userId, data) {
  const { locationId, reason, notes, lines } = data;

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { warehouse: true },
  });
  if (!location) throw new NotFoundError('Location not found');
  if (location.type !== 'INTERNAL' || !location.warehouseId) {
    throw new ValidationError('Adjustments can only be performed on physical internal warehouse locations');
  }

  const pids = lines.map((l) => l.productId);
  const products = await prisma.product.findMany({ where: { id: { in: pids } } });
  if (products.length !== pids.length) {
    throw new NotFoundError('One or more products were not found');
  }

  const inactive = products.find((p) => !p.isActive);
  if (inactive) {
    throw new ValidationError(`Product "${inactive.name}" (${inactive.sku}) is deactivated`);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const adjVirtualLoc = await stockService.getVirtualLocation('ADJUSTMENT');

  let touched = null;

  const created = await prisma.$transaction(async (tx) => {
    // 1. Calculate theoretical vs counted
    const calculatedLines = [];
    const movesToApply = [];

    for (const line of lines) {
      const theoretical = await stockService.getOnHand(line.productId, { locationId }, tx);
      const counted = round3(line.countedQuantity);
      const diff = round3(counted - theoretical);

      if (diff === 0) continue; // Skip unchanged lines

      calculatedLines.push({
        productId: line.productId,
        theoreticalQuantity: theoretical,
        countedQuantity: counted,
        quantity: diff, // signed difference
      });

      const prod = productMap.get(line.productId);

      if (diff > 0) {
        // Physical stock gained: move ADJUSTMENT -> location
        movesToApply.push({
          productId: line.productId,
          fromLocationId: adjVirtualLoc.id,
          toLocationId: location.id,
          quantity: diff,
          unitCost: prod.costPrice ?? 0,
        });
      } else {
        // Physical stock lost: move location -> ADJUSTMENT
        movesToApply.push({
          productId: line.productId,
          fromLocationId: location.id,
          toLocationId: adjVirtualLoc.id,
          quantity: Math.abs(diff),
          unitCost: prod.costPrice ?? 0,
        });
      }
    }

    if (calculatedLines.length === 0) {
      throw new ValidationError('No difference to adjust: counted quantities match system theoretical quantities exactly');
    }

    const reference = await nextReference(tx, location.warehouseId, 'ADJUSTMENT');

    const op = await tx.operation.create({
      data: {
        reference,
        type: 'ADJUSTMENT',
        status: 'DONE',
        warehouseId: location.warehouseId,
        sourceLocationId: location.id,
        destLocationId: adjVirtualLoc.id,
        scheduledDate: new Date(),
        responsibleId: userId,
        createdById: userId,
        validatedById: userId,
        validatedAt: new Date(),
        reason,
        notes: notes || null,
        lines: {
          create: calculatedLines.map((cl) => ({
            productId: cl.productId,
            theoreticalQuantity: cl.theoreticalQuantity,
            countedQuantity: cl.countedQuantity,
            quantity: cl.quantity,
          })),
        },
      },
      include: ADJUSTMENT_INCLUDE,
    });

    // Link move operationLineId
    const opLinesByProd = new Map(op.lines.map((l) => [l.productId, l.id]));
    const movesWithLineId = movesToApply.map((m) => ({
      ...m,
      operationLineId: opLinesByProd.get(m.productId),
    }));

    touched = await stockService.applyMoves(tx, {
      moves: movesWithLineId,
      reference,
      type: 'ADJUSTMENT',
      operationId: op.id,
      userId,
    });

    await logActivity(tx, {
      userId,
      action: 'adjustment.create',
      entityType: 'Operation',
      entityId: op.id,
      metadata: { reference: op.reference, reason, lineCount: calculatedLines.length },
    });

    return op;
  });

  if (touched) {
    eventBus.emit(EVENTS.STOCK_CHANGED, {
      productIds: touched.productIds,
      locationIds: touched.locationIds,
    });
  }
  eventBus.emit(EVENTS.OPERATION_CHANGED, { id: created.id, type: 'ADJUSTMENT', status: 'DONE' });

  return getById(created.id);
}

export async function list(query) {
  const { warehouseId, locationId, search, page = 1, limit = 20 } = query;

  const where = { type: 'ADJUSTMENT' };

  if (warehouseId) where.warehouseId = warehouseId;
  if (locationId) {
    where.OR = [
      { sourceLocationId: locationId },
      { destLocationId: locationId },
    ];
  }

  if (search) {
    where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { reason: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.operation.count({ where }),
    prisma.operation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: ADJUSTMENT_INCLUDE,
    }),
  ]);

  const items = rows.map((op) => ({
    ...op,
    lineCount: op.lines.length,
    totalDifference: op.lines.reduce((acc, l) => acc + toNumber(l.quantity), 0),
    sourceName: formatLocationName(op.sourceLocation),
    destName: formatLocationName(op.destLocation),
  }));

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getById(id) {
  const operation = await prisma.operation.findUnique({
    where: { id },
    include: ADJUSTMENT_INCLUDE,
  });

  if (!operation || operation.type !== 'ADJUSTMENT') {
    throw new NotFoundError('Adjustment not found');
  }

  return {
    ...operation,
    lineCount: operation.lines.length,
    totalDifference: operation.lines.reduce((acc, l) => acc + toNumber(l.quantity), 0),
    sourceName: formatLocationName(operation.sourceLocation),
    destName: formatLocationName(operation.destLocation),
  };
}
