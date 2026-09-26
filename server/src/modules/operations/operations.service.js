import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../lib/activity.js';
import { eventBus, EVENTS } from '../../lib/eventBus.js';
import { NotFoundError, ValidationError, InvalidStateError } from '../../lib/errors.js';
import { parsePagination, buildMeta } from '../../lib/pagination.js';
import { nextReference } from '../../services/sequence.service.js';
import * as stockService from '../../services/stock.service.js';
import { toNumber } from '../../lib/serialize.js';

const INCLUDE_FULL = {
  warehouse: { select: { id: true, name: true, shortCode: true } },
  contact: { select: { id: true, name: true, email: true, phone: true, address: true, gstin: true } },
  sourceLocation: { select: { id: true, name: true, shortCode: true, type: true, warehouseId: true } },
  destLocation: { select: { id: true, name: true, shortCode: true, type: true, warehouseId: true } },
  responsible: { select: { id: true, name: true, loginId: true } },
  createdBy: { select: { id: true, name: true } },
  validatedBy: { select: { id: true, name: true } },
  lines: {
    include: {
      product: { select: { id: true, name: true, sku: true, uom: true, costPrice: true, isActive: true } },
    },
  },
};

async function resolveLocations(tx, type, warehouseId, sourceLocationId, destLocationId) {
  const warehouse = await tx.warehouse.findUnique({
    where: { id: warehouseId },
    select: { id: true, defaultLocationId: true },
  });
  if (!warehouse) throw new NotFoundError('Warehouse not found');

  if (type === 'RECEIPT') {
    const vendor = await stockService.getVirtualLocation('VENDOR', tx);
    const dest = destLocationId || warehouse.defaultLocationId;
    if (!dest) throw new ValidationError('Destination location is required for receipts');
    return { sourceLocationId: vendor.id, destLocationId: dest };
  }

  if (type === 'DELIVERY') {
    const customer = await stockService.getVirtualLocation('CUSTOMER', tx);
    if (!sourceLocationId) {
      const src = warehouse.defaultLocationId;
      if (!src) throw new ValidationError('Source location is required for deliveries');
      return { sourceLocationId: src, destLocationId: customer.id };
    }
    return { sourceLocationId, destLocationId: customer.id };
  }

  // INTERNAL
  if (!sourceLocationId || !destLocationId) throw new ValidationError('Source and destination locations are required for internal transfers');
  if (sourceLocationId === destLocationId) throw new ValidationError('Source and destination locations must differ');
  return { sourceLocationId, destLocationId };
}

async function validateLines(tx, lines) {
  const productIds = lines.map((l) => l.productId);
  const seen = new Set();
  for (const id of productIds) {
    if (seen.has(id)) throw new ValidationError('Duplicate product in lines');
    seen.add(id);
  }
  const products = await tx.product.findMany({ where: { id: { in: productIds } }, select: { id: true, isActive: true } });
  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const line of lines) {
    const p = productMap.get(line.productId);
    if (!p) throw new NotFoundError(`Product ${line.productId} not found`);
    if (!p.isActive) throw new ValidationError(`Product ${line.productId} is not active`);
  }
}

export async function list(query) {
  const { type, status, warehouseId, locationId, contactId, search, late, dateFrom, dateTo } = query;
  const { skip, take, orderBy, page, limit } = parsePagination(query, {
    allowedSort: ['createdAt', 'scheduledDate', 'reference'],
    defaultSort: '-createdAt',
  });

  const statuses = status ? status.split(',').map((s) => s.trim()) : undefined;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const where = {
    ...(type ? { type } : { type: { in: ['RECEIPT', 'DELIVERY', 'INTERNAL'] } }),
    ...(statuses ? { status: { in: statuses } } : {}),
    ...(warehouseId ? { warehouseId } : {}),
    ...(locationId ? { OR: [{ sourceLocationId: locationId }, { destLocationId: locationId }] } : {}),
    ...(contactId ? { contactId } : {}),
    ...(late === 'true' ? { scheduledDate: { lt: today }, status: { notIn: ['DONE', 'CANCELED'] } } : {}),
    ...(dateFrom || dateTo
      ? { scheduledDate: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
      : {}),
    ...(search
      ? {
          OR: [
            { reference: { contains: search, mode: 'insensitive' } },
            { contact: { name: { contains: search, mode: 'insensitive' } } },
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
        contact: { select: { id: true, name: true } },
        sourceLocation: { select: { id: true, name: true, shortCode: true, type: true } },
        destLocation: { select: { id: true, name: true, shortCode: true, type: true } },
        warehouse: { select: { id: true, name: true, shortCode: true } },
        _count: { select: { lines: true } },
      },
    }),
    prisma.operation.count({ where }),
  ]);

  const data = rows.map((op) => ({
    ...op,
    isLate: op.status !== 'DONE' && op.status !== 'CANCELED' && op.scheduledDate < today,
    lineCount: op._count.lines,
    totalQuantity: undefined,
    sourceName: op.sourceLocation
      ? op.sourceLocation.type === 'INTERNAL'
        ? `${op.warehouse.shortCode}/${op.sourceLocation.shortCode}`
        : op.sourceLocation.name
      : null,
    destName: op.destLocation
      ? op.destLocation.type === 'INTERNAL'
        ? `${op.warehouse.shortCode}/${op.destLocation.shortCode}`
        : op.destLocation.name
      : null,
  }));

  return { data, meta: buildMeta({ page, limit }, total) };
}

export async function board(query) {
  const { type } = query;
  const statuses = ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'];
  const where = { ...(type ? { type } : { type: { in: ['RECEIPT', 'DELIVERY', 'INTERNAL'] } }) };

  const results = await Promise.all(
    statuses.map(async (status) => {
      const items = await prisma.operation.findMany({
        where: { ...where, status },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: { select: { id: true, name: true } },
          _count: { select: { lines: true } },
        },
      });
      return { status, items, count: items.length };
    })
  );

  return results;
}

export async function getById(id) {
  const op = await prisma.operation.findUnique({ where: { id }, include: INCLUDE_FULL });
  if (!op) throw new NotFoundError('Operation not found');

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isLate = op.status !== 'DONE' && op.status !== 'CANCELED' && op.scheduledDate < today;

  const needsAvailability = ['DRAFT', 'WAITING', 'READY'].includes(op.status) && ['DELIVERY', 'INTERNAL'].includes(op.type);
  let availability = [];
  if (needsAvailability) {
    availability = await stockService.checkAvailability({ id: op.id, sourceLocationId: op.sourceLocationId, lines: op.lines });
  }

  const availMap = new Map(availability.map((a) => [a.lineId, a]));
  const lines = op.lines.map((line) => {
    const avail = availMap.get(line.id);
    return { ...line, availability: avail || null };
  });

  const sourceName = op.sourceLocation
    ? op.sourceLocation.type === 'INTERNAL'
      ? `${op.warehouse.shortCode}/${op.sourceLocation.shortCode}`
      : op.sourceLocation.name
    : null;
  const destName = op.destLocation
    ? op.destLocation.type === 'INTERNAL'
      ? `${op.warehouse.shortCode}/${op.destLocation.shortCode}`
      : op.destLocation.name
    : null;

  return { ...op, lines, isLate, sourceName, destName };
}

export async function create(userId, body) {
  const { type, warehouseId, lines, scheduledDate, notes, deliveryAddress } = body;
  let { contactId, sourceLocationId, destLocationId, responsibleId } = body;

  responsibleId = responsibleId || userId;

  const op = await prisma.$transaction(async (tx) => {
    await validateLines(tx, lines);
    const resolved = await resolveLocations(tx, type, warehouseId, sourceLocationId, destLocationId);
    sourceLocationId = resolved.sourceLocationId;
    destLocationId = resolved.destLocationId;

    const reference = await nextReference(tx, warehouseId, type);

    const operation = await tx.operation.create({
      data: {
        reference,
        type,
        status: 'DRAFT',
        warehouseId,
        contactId: contactId || null,
        sourceLocationId,
        destLocationId,
        scheduledDate: scheduledDate || new Date(),
        responsibleId,
        createdById: userId,
        deliveryAddress: deliveryAddress || null,
        notes: notes || null,
        lines: { create: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) },
      },
      include: INCLUDE_FULL,
    });

    await logActivity(tx, { userId, action: 'operation.create', entityType: 'Operation', entityId: operation.id, metadata: { reference, type } });
    return operation;
  });

  eventBus.emit(EVENTS.OPERATION_CHANGED, { id: op.id, type: op.type, status: op.status });
  return op;
}

export async function update(userId, id, body) {
  const existing = await prisma.operation.findUnique({ where: { id }, include: { lines: true } });
  if (!existing) throw new NotFoundError('Operation not found');
  if (!['DRAFT', 'WAITING'].includes(existing.status)) throw new InvalidStateError('Operation can only be edited in DRAFT or WAITING status');

  const { lines, sourceLocationId, destLocationId, ...headerFields } = body;

  const op = await prisma.$transaction(async (tx) => {
    if (lines) await validateLines(tx, lines);

    const updateData = { ...headerFields };
    if (sourceLocationId !== undefined) updateData.sourceLocationId = sourceLocationId;
    if (destLocationId !== undefined) updateData.destLocationId = destLocationId;

    if (lines) {
      await tx.operationLine.deleteMany({ where: { operationId: id } });
      updateData.lines = { create: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) };
    }

    const operation = await tx.operation.update({ where: { id }, data: updateData, include: INCLUDE_FULL });
    await logActivity(tx, { userId, action: 'operation.update', entityType: 'Operation', entityId: id });
    return operation;
  });

  eventBus.emit(EVENTS.OPERATION_CHANGED, { id: op.id, type: op.type, status: op.status });
  return op;
}

export async function remove(userId, id) {
  const existing = await prisma.operation.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Operation not found');
  if (existing.status !== 'DRAFT') throw new InvalidStateError('Only DRAFT operations can be deleted');
  await prisma.operation.delete({ where: { id } });
  await logActivity(prisma, { userId, action: 'operation.delete', entityType: 'Operation', entityId: id, metadata: { reference: existing.reference } });
}

export async function confirm(userId, id) {
  const op = await prisma.operation.findUnique({ where: { id }, include: { lines: true } });
  if (!op) throw new NotFoundError('Operation not found');
  if (op.status !== 'DRAFT') throw new InvalidStateError('Only DRAFT operations can be confirmed');

  let newStatus = 'READY';

  if (['DELIVERY', 'INTERNAL'].includes(op.type)) {
    const availability = await stockService.checkAvailability({ id: op.id, sourceLocationId: op.sourceLocationId, lines: op.lines });
    const hasShortage = availability.some((a) => a.shortBy > 0);
    newStatus = hasShortage ? 'WAITING' : 'READY';
  }

  const updated = await prisma.operation.update({
    where: { id },
    data: { status: newStatus },
    include: INCLUDE_FULL,
  });

  await logActivity(prisma, { userId, action: 'operation.confirm', entityType: 'Operation', entityId: id, metadata: { status: newStatus } });
  eventBus.emit(EVENTS.OPERATION_CHANGED, { id: updated.id, type: updated.type, status: updated.status });
  return updated;
}

export async function checkAvailability(userId, id) {
  const op = await prisma.operation.findUnique({ where: { id }, include: { lines: true } });
  if (!op) throw new NotFoundError('Operation not found');
  if (!['WAITING', 'DRAFT'].includes(op.status)) throw new InvalidStateError('Check availability is only valid for WAITING or DRAFT operations');
  if (!['DELIVERY', 'INTERNAL'].includes(op.type)) throw new ValidationError('Availability check is only for DELIVERY or INTERNAL operations');

  const availability = await stockService.checkAvailability({ id: op.id, sourceLocationId: op.sourceLocationId, lines: op.lines });
  const hasShortage = availability.some((a) => a.shortBy > 0);
  const newStatus = hasShortage ? 'WAITING' : 'READY';

  const updated = await prisma.operation.update({
    where: { id },
    data: { status: newStatus },
    include: INCLUDE_FULL,
  });

  await logActivity(prisma, { userId, action: 'operation.check_availability', entityType: 'Operation', entityId: id, metadata: { status: newStatus } });
  eventBus.emit(EVENTS.OPERATION_CHANGED, { id: updated.id, type: updated.type, status: updated.status });
  return { operation: updated, availability };
}

export async function validate(userId, id) {
  const op = await prisma.operation.findUnique({ where: { id }, include: { lines: { include: { product: true } } } });
  if (!op) throw new NotFoundError('Operation not found');
  if (op.status !== 'READY') throw new InvalidStateError('Only READY operations can be validated');

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      // Atomic claim — prevents double validation
      const { count } = await tx.operation.updateMany({
        where: { id, status: 'READY' },
        data: { status: 'DONE', validatedById: userId, validatedAt: new Date() },
      });
      if (count === 0) throw new InvalidStateError('Operation was already validated or its status changed');

      // For outgoing ops, re-check availability inside the transaction
      if (['DELIVERY', 'INTERNAL'].includes(op.type)) {
        const availability = await stockService.checkAvailability({ id: op.id, sourceLocationId: op.sourceLocationId, lines: op.lines }, tx);
        const hasShortage = availability.some((a) => a.shortBy > 0);
        if (hasShortage) {
          // Roll back to WAITING
          await tx.operation.updateMany({ where: { id }, data: { status: 'WAITING', validatedById: null, validatedAt: null } });
          throw Object.assign(new Error('Insufficient stock'), { code: 'INSUFFICIENT_STOCK', status: 409, details: availability.filter((a) => a.shortBy > 0) });
        }
      }

      const moves = op.lines.map((line) => ({
        productId: line.productId,
        fromLocationId: op.sourceLocationId,
        toLocationId: op.destLocationId,
        quantity: toNumber(line.quantity),
        unitCost: toNumber(line.product?.costPrice ?? 0),
        operationLineId: line.id,
      }));

      const { productIds, locationIds } = await stockService.applyMoves(tx, {
        moves,
        reference: op.reference,
        type: op.type,
        operationId: op.id,
        userId,
      });

      await logActivity(tx, { userId, action: 'operation.validate', entityType: 'Operation', entityId: id, metadata: { reference: op.reference } });

      const updated = await tx.operation.findUnique({ where: { id }, include: INCLUDE_FULL });
      return { operation: updated, productIds, locationIds };
    });
  } catch (err) {
    if (err.code === 'INSUFFICIENT_STOCK') {
      throw Object.assign(new Error(err.message), { status: 409, code: 'INSUFFICIENT_STOCK', details: err.details });
    }
    throw err;
  }

  eventBus.emit(EVENTS.OPERATION_CHANGED, { id: result.operation.id, type: result.operation.type, status: result.operation.status });
  eventBus.emit(EVENTS.STOCK_CHANGED, { productIds: result.productIds, locationIds: result.locationIds });
  return result.operation;
}

export async function cancel(userId, id) {
  const op = await prisma.operation.findUnique({ where: { id } });
  if (!op) throw new NotFoundError('Operation not found');
  if (!['DRAFT', 'WAITING', 'READY'].includes(op.status)) throw new InvalidStateError('Operation cannot be canceled in its current status');

  const updated = await prisma.operation.update({
    where: { id },
    data: { status: 'CANCELED', canceledAt: new Date() },
    include: INCLUDE_FULL,
  });

  await logActivity(prisma, { userId, action: 'operation.cancel', entityType: 'Operation', entityId: id, metadata: { reference: op.reference } });
  eventBus.emit(EVENTS.OPERATION_CHANGED, { id: updated.id, type: updated.type, status: updated.status });
  return updated;
}
