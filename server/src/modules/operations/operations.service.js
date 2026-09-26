import { prisma } from '../../lib/prisma.js';
import { nextReference } from '../../services/sequence.service.js';
import * as stockService from '../../services/stock.service.js';
import { logActivity } from '../../lib/activity.js';
import { eventBus, EVENTS } from '../../lib/eventBus.js';
import {
  NotFoundError,
  ValidationError,
  InvalidStateError,
  InsufficientStockError,
} from '../../lib/errors.js';
import { toNumber } from '../../lib/serialize.js';

function formatLocationName(loc) {
  if (!loc) return '';
  if (loc.warehouse?.shortCode) {
    return `${loc.warehouse.shortCode}/${loc.shortCode || loc.name}`;
  }
  return loc.name;
}

const OPERATION_INCLUDE = {
  warehouse: { select: { id: true, name: true, shortCode: true } },
  contact: { select: { id: true, name: true, email: true, phone: true, address: true, gstin: true } },
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
  createdBy: { select: { id: true, name: true, email: true } },
  validatedBy: { select: { id: true, name: true, email: true } },
  lines: {
    include: {
      product: { select: { id: true, name: true, sku: true, uom: true, costPrice: true, isActive: true } },
    },
  },
};

export async function list(query) {
  const {
    type,
    status,
    warehouseId,
    locationId,
    contactId,
    search,
    late,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
    sort = 'createdAt:desc',
  } = query;

  const where = {};

  if (type) where.type = type;

  if (status) {
    const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length === 1) where.status = statuses[0];
    else if (statuses.length > 1) where.status = { in: statuses };
  }

  if (warehouseId) where.warehouseId = warehouseId;
  if (contactId) where.contactId = contactId;

  if (locationId) {
    where.OR = [
      { sourceLocationId: locationId },
      { destLocationId: locationId },
    ];
  }

  if (search) {
    where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { contact: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (late) {
    where.scheduledDate = { lt: todayStart };
    where.status = { notIn: ['DONE', 'CANCELED'] };
  } else if (dateFrom || dateTo) {
    where.scheduledDate = {};
    if (dateFrom) where.scheduledDate.gte = new Date(dateFrom);
    if (dateTo) where.scheduledDate.lte = new Date(dateTo);
  }

  const [sortField, sortDir] = sort.split(':');
  const orderBy = { [sortField]: sortDir === 'asc' ? 'asc' : 'desc' };

  const [total, rows] = await Promise.all([
    prisma.operation.count({ where }),
    prisma.operation.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: OPERATION_INCLUDE,
    }),
  ]);

  const items = rows.map((op) => {
    const isLate = op.scheduledDate < todayStart && !['DONE', 'CANCELED'].includes(op.status);
    const lineCount = op.lines.length;
    const totalQuantity = op.lines.reduce((acc, l) => acc + toNumber(l.quantity), 0);

    return {
      ...op,
      isLate,
      lineCount,
      totalQuantity,
      sourceName: formatLocationName(op.sourceLocation),
      destName: formatLocationName(op.destLocation),
    };
  });

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

export async function getBoard({ type, warehouseId }) {
  const where = { type };
  if (warehouseId) where.warehouseId = warehouseId;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const statuses = ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'];
  const board = {};

  await Promise.all(
    statuses.map(async (st) => {
      const colWhere = { ...where, status: st };
      const [count, rows] = await Promise.all([
        prisma.operation.count({ where: colWhere }),
        prisma.operation.findMany({
          where: colWhere,
          orderBy: { scheduledDate: 'asc' },
          take: 50,
          include: OPERATION_INCLUDE,
        }),
      ]);

      board[st] = {
        count,
        items: rows.map((op) => ({
          ...op,
          isLate: op.scheduledDate < todayStart && !['DONE', 'CANCELED'].includes(op.status),
          lineCount: op.lines.length,
          totalQuantity: op.lines.reduce((acc, l) => acc + toNumber(l.quantity), 0),
          sourceName: formatLocationName(op.sourceLocation),
          destName: formatLocationName(op.destLocation),
        })),
      };
    })
  );

  return board;
}

export async function getById(id) {
  const operation = await prisma.operation.findUnique({
    where: { id },
    include: OPERATION_INCLUDE,
  });

  if (!operation) {
    throw new NotFoundError('Operation not found');
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isLate = operation.scheduledDate < todayStart && !['DONE', 'CANCELED'].includes(operation.status);

  // If outgoing and not yet validated/cancelled, compute availability per line
  let lineAvailability = [];
  if (
    ['DELIVERY', 'INTERNAL'].includes(operation.type) &&
    ['DRAFT', 'WAITING', 'READY'].includes(operation.status)
  ) {
    lineAvailability = await stockService.checkAvailability({
      id: operation.id,
      sourceLocationId: operation.sourceLocationId,
      lines: operation.lines,
    });
  }

  const availMap = new Map(lineAvailability.map((a) => [a.productId, a]));

  const linesWithAvailability = operation.lines.map((l) => {
    const avail = availMap.get(l.productId);
    return {
      ...l,
      available: avail ? avail.available : toNumber(l.quantity),
      shortBy: avail ? avail.shortBy : 0,
    };
  });

  return {
    ...operation,
    isLate,
    lineCount: operation.lines.length,
    totalQuantity: operation.lines.reduce((acc, l) => acc + toNumber(l.quantity), 0),
    sourceName: formatLocationName(operation.sourceLocation),
    destName: formatLocationName(operation.destLocation),
    lines: linesWithAvailability,
  };
}

export async function create(userId, data) {
  const { type, warehouseId, lines } = data;

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
    include: { defaultLocation: true },
  });
  if (!warehouse) throw new NotFoundError('Warehouse not found');

  // Verify all products are active
  const productIds = lines.map((l) => l.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  if (products.length !== productIds.length) {
    throw new NotFoundError('One or more products were not found');
  }
  const inactive = products.find((p) => !p.isActive);
  if (inactive) {
    throw new ValidationError(`Product "${inactive.name}" (${inactive.sku}) is deactivated`);
  }

  let sourceLocationId = data.sourceLocationId;
  let destLocationId = data.destLocationId;
  let deliveryAddress = data.deliveryAddress;

  if (type === 'RECEIPT') {
    if (!data.contactId) {
      throw new ValidationError('Vendor contact is required for receipts');
    }
    const vendorLoc = await stockService.getVirtualLocation('VENDOR');
    sourceLocationId = vendorLoc.id;

    if (!destLocationId) {
      destLocationId = warehouse.defaultLocationId || warehouse.defaultLocation?.id;
      if (!destLocationId) {
        const firstInt = await prisma.location.findFirst({
          where: { warehouseId: warehouse.id, type: 'INTERNAL', isActive: true },
        });
        if (!firstInt) throw new ValidationError('Warehouse has no internal location configured');
        destLocationId = firstInt.id;
      }
    }
  } else if (type === 'DELIVERY') {
    if (!data.contactId) {
      throw new ValidationError('Customer contact is required for deliveries');
    }
    const customerLoc = await stockService.getVirtualLocation('CUSTOMER');
    destLocationId = customerLoc.id;

    if (!sourceLocationId) {
      sourceLocationId = warehouse.defaultLocationId || warehouse.defaultLocation?.id;
      if (!sourceLocationId) {
        const firstInt = await prisma.location.findFirst({
          where: { warehouseId: warehouse.id, type: 'INTERNAL', isActive: true },
        });
        if (!firstInt) throw new ValidationError('Warehouse has no internal location configured');
        sourceLocationId = firstInt.id;
      }
    }

    if (!deliveryAddress && data.contactId) {
      const contact = await prisma.contact.findUnique({ where: { id: data.contactId } });
      deliveryAddress = contact?.address || null;
    }
  } else if (type === 'INTERNAL') {
    if (!sourceLocationId || !destLocationId) {
      throw new ValidationError('Source and destination locations are required for internal transfers');
    }
    if (sourceLocationId === destLocationId) {
      throw new ValidationError('Source and destination locations must be different');
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const reference = await nextReference(tx, warehouseId, type);

    const op = await tx.operation.create({
      data: {
        reference,
        type,
        status: 'DRAFT',
        warehouseId,
        contactId: data.contactId || null,
        sourceLocationId,
        destLocationId,
        scheduledDate: data.scheduledDate || new Date(),
        responsibleId: data.responsibleId || userId,
        deliveryAddress: deliveryAddress || null,
        notes: data.notes || null,
        createdById: userId,
        lines: {
          create: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
        },
      },
      include: OPERATION_INCLUDE,
    });

    await logActivity(tx, {
      userId,
      action: 'operation.create',
      entityType: 'Operation',
      entityId: op.id,
      metadata: { reference: op.reference, type: op.type },
    });

    return op;
  });

  eventBus.emit(EVENTS.OPERATION_CHANGED, { id: created.id, type: created.type, status: created.status });
  return getById(created.id);
}

export async function update(userId, id, data) {
  const existing = await prisma.operation.findUnique({
    where: { id },
    include: { lines: true },
  });
  if (!existing) throw new NotFoundError('Operation not found');

  if (!['DRAFT', 'WAITING'].includes(existing.status)) {
    throw new InvalidStateError('Only operations in DRAFT or WAITING status can be edited');
  }

  if (data.lines) {
    const pids = data.lines.map((l) => l.productId);
    const products = await prisma.product.findMany({ where: { id: { in: pids } } });
    if (products.length !== pids.length) throw new NotFoundError('One or more products were not found');
    const inactive = products.find((p) => !p.isActive);
    if (inactive) throw new ValidationError(`Product "${inactive.name}" (${inactive.sku}) is deactivated`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updateData = {};
    if (data.warehouseId) updateData.warehouseId = data.warehouseId;
    if (data.contactId !== undefined) updateData.contactId = data.contactId;
    if (data.sourceLocationId) updateData.sourceLocationId = data.sourceLocationId;
    if (data.destLocationId) updateData.destLocationId = data.destLocationId;
    if (data.scheduledDate) updateData.scheduledDate = data.scheduledDate;
    if (data.responsibleId !== undefined) updateData.responsibleId = data.responsibleId;
    if (data.deliveryAddress !== undefined) updateData.deliveryAddress = data.deliveryAddress;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.lines) {
      await tx.operationLine.deleteMany({ where: { operationId: id } });
      updateData.lines = {
        create: data.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
        })),
      };
    }

    const op = await tx.operation.update({
      where: { id },
      data: updateData,
      include: OPERATION_INCLUDE,
    });

    // If waiting and edited, re-run availability
    if (op.status === 'WAITING' && ['DELIVERY', 'INTERNAL'].includes(op.type)) {
      const availability = await stockService.checkAvailability(
        { id: op.id, sourceLocationId: op.sourceLocationId, lines: op.lines },
        tx
      );
      const isShort = availability.some((a) => a.shortBy > 0);
      if (!isShort) {
        await tx.operation.update({
          where: { id },
          data: { status: 'READY' },
        });
        op.status = 'READY';
      }
    }

    await logActivity(tx, {
      userId,
      action: 'operation.update',
      entityType: 'Operation',
      entityId: op.id,
      metadata: { reference: op.reference, status: op.status },
    });

    return op;
  });

  eventBus.emit(EVENTS.OPERATION_CHANGED, { id: updated.id, type: updated.type, status: updated.status });
  return getById(updated.id);
}

export async function remove(userId, id) {
  const existing = await prisma.operation.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Operation not found');

  if (existing.status !== 'DRAFT') {
    throw new InvalidStateError('Only DRAFT operations can be deleted');
  }

  await prisma.operation.delete({ where: { id } });

  await logActivity(prisma, {
    userId,
    action: 'operation.delete',
    entityType: 'Operation',
    entityId: id,
    metadata: { reference: existing.reference, type: existing.type },
  });

  eventBus.emit(EVENTS.OPERATION_CHANGED, { id, type: existing.type, status: 'DELETED' });
  return { id, reference: existing.reference };
}

export async function confirm(userId, id) {
  const existing = await prisma.operation.findUnique({
    where: { id },
    include: { lines: true },
  });
  if (!existing) throw new NotFoundError('Operation not found');

  if (existing.status !== 'DRAFT') {
    throw new InvalidStateError(`Cannot confirm operation in ${existing.status} status`);
  }

  let nextStatus = 'READY';

  const updated = await prisma.$transaction(async (tx) => {
    if (['DELIVERY', 'INTERNAL'].includes(existing.type)) {
      const availability = await stockService.checkAvailability(
        { id: existing.id, sourceLocationId: existing.sourceLocationId, lines: existing.lines },
        tx
      );
      const isShort = availability.some((a) => a.shortBy > 0);
      nextStatus = isShort ? 'WAITING' : 'READY';
    }

    const op = await tx.operation.update({
      where: { id },
      data: { status: nextStatus },
      include: OPERATION_INCLUDE,
    });

    await logActivity(tx, {
      userId,
      action: 'operation.confirm',
      entityType: 'Operation',
      entityId: op.id,
      metadata: { reference: op.reference, fromStatus: 'DRAFT', toStatus: nextStatus },
    });

    return op;
  });

  eventBus.emit(EVENTS.OPERATION_CHANGED, { id: updated.id, type: updated.type, status: updated.status });
  return getById(updated.id);
}

export async function checkAvailability(userId, id) {
  const existing = await prisma.operation.findUnique({
    where: { id },
    include: { lines: true },
  });
  if (!existing) throw new NotFoundError('Operation not found');

  if (!['WAITING', 'READY'].includes(existing.status)) {
    throw new InvalidStateError(`Cannot check availability on an operation in ${existing.status} status`);
  }

  const availability = await stockService.checkAvailability({
    id: existing.id,
    sourceLocationId: existing.sourceLocationId,
    lines: existing.lines,
  });

  const isShort = availability.some((a) => a.shortBy > 0);
  const newStatus = isShort ? 'WAITING' : 'READY';

  if (newStatus !== existing.status) {
    await prisma.operation.update({
      where: { id },
      data: { status: newStatus },
    });

    await logActivity(prisma, {
      userId,
      action: 'operation.check_availability',
      entityType: 'Operation',
      entityId: id,
      metadata: { fromStatus: existing.status, toStatus: newStatus },
    });

    eventBus.emit(EVENTS.OPERATION_CHANGED, { id, type: existing.type, status: newStatus });
  }

  return {
    status: newStatus,
    isAvailable: !isShort,
    lines: availability,
  };
}

export async function validate(userId, id) {
  let touched = null;

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Claim operation: updateMany guarantees atomicity against race conditions
    const claim = await tx.operation.updateMany({
      where: { id, status: 'READY' },
      data: {
        status: 'DONE',
        validatedAt: new Date(),
        validatedById: userId,
      },
    });

    if (claim.count === 0) {
      throw new InvalidStateError('Operation is not in READY status or has already been validated');
    }

    const op = await tx.operation.findUnique({
      where: { id },
      include: {
        lines: {
          include: { product: true },
        },
      },
    });

    // 2. For DELIVERY or INTERNAL, re-verify availability
    if (['DELIVERY', 'INTERNAL'].includes(op.type)) {
      const availability = await stockService.checkAvailability(
        { id: op.id, sourceLocationId: op.sourceLocationId, lines: op.lines },
        tx
      );
      const shortages = availability.filter((a) => a.shortBy > 0);
      if (shortages.length > 0) {
        // Rollback claim by setting back to WAITING
        await tx.operation.update({
          where: { id },
          data: { status: 'WAITING', validatedAt: null, validatedById: null },
        });
        throw new InsufficientStockError(
          'Stock became insufficient before validation could complete. Operation moved to WAITING.',
          shortages
        );
      }
    }

    // 3. Apply moves to stock quants and record ledger
    const moves = op.lines.map((line) => ({
      productId: line.productId,
      fromLocationId: op.sourceLocationId,
      toLocationId: op.destLocationId,
      quantity: line.quantity,
      unitCost: line.product?.costPrice ?? 0,
      operationLineId: line.id,
    }));

    touched = await stockService.applyMoves(tx, {
      moves,
      reference: op.reference,
      type: op.type,
      operationId: op.id,
      userId,
    });

    await logActivity(tx, {
      userId,
      action: 'operation.validate',
      entityType: 'Operation',
      entityId: op.id,
      metadata: { reference: op.reference, type: op.type, moveCount: moves.length },
    });

    return op;
  });

  // Emit events after commit
  if (touched) {
    eventBus.emit(EVENTS.STOCK_CHANGED, {
      productIds: touched.productIds,
      locationIds: touched.locationIds,
    });
  }
  eventBus.emit(EVENTS.OPERATION_CHANGED, { id: updated.id, type: updated.type, status: 'DONE' });

  return getById(updated.id);
}

export async function cancel(userId, id) {
  const existing = await prisma.operation.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Operation not found');

  if (['DONE', 'CANCELED'].includes(existing.status)) {
    throw new InvalidStateError(`Cannot cancel an operation with status "${existing.status}"`);
  }

  const updated = await prisma.operation.update({
    where: { id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    },
  });

  await logActivity(prisma, {
    userId,
    action: 'operation.cancel',
    entityType: 'Operation',
    entityId: id,
    metadata: { reference: existing.reference, previousStatus: existing.status },
  });

  eventBus.emit(EVENTS.OPERATION_CHANGED, { id: updated.id, type: updated.type, status: 'CANCELED' });
  return getById(updated.id);
}
