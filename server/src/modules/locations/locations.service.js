import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../lib/activity.js';
import { toNumber } from '../../lib/serialize.js';
import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.js';

const include = {
  warehouse: { select: { id: true, name: true, shortCode: true } },
};

/** Compute full name like "WH/Stock" or virtual name like "Vendors". */
function shape(loc) {
  const prefix = loc.warehouse?.shortCode ? `${loc.warehouse.shortCode}/` : '';
  return {
    ...loc,
    fullName: `${prefix}${loc.shortCode}`,
  };
}

async function assertShortCodeFree(warehouseId, shortCode, excludeId) {
  const clash = await prisma.location.findFirst({
    where: {
      warehouseId: warehouseId ?? null,
      shortCode,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (clash) {
    throw new ConflictError(
      `Short code "${shortCode}" is already in use in this warehouse`,
      [{ path: 'shortCode', message: `Short code "${shortCode}" already exists in this warehouse` }]
    );
  }
}

export async function list({ warehouseId, type, search, includeInactive } = {}) {
  const rows = await prisma.location.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(warehouseId !== undefined ? { warehouseId: warehouseId || null } : {}),
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { shortCode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include,
    orderBy: [{ warehouseId: 'asc' }, { name: 'asc' }],
  });

  return rows.map(shape);
}

export async function getById(id) {
  const loc = await prisma.location.findUnique({
    where: { id },
    include,
  });
  if (!loc) throw new NotFoundError('Location not found');
  return shape(loc);
}

export async function create(userId, data) {
  if (data.type === 'INTERNAL' && !data.warehouseId) {
    throw new ValidationError('Internal locations must belong to a warehouse', [
      { path: 'warehouseId', message: 'Warehouse is required for internal locations' },
    ]);
  }

  if (data.warehouseId) {
    const wh = await prisma.warehouse.findUnique({ where: { id: data.warehouseId } });
    if (!wh) throw new NotFoundError('Warehouse not found');
  }

  await assertShortCodeFree(data.warehouseId, data.shortCode);

  const loc = await prisma.location.create({
    data: {
      name: data.name,
      shortCode: data.shortCode,
      type: data.type,
      warehouseId: data.warehouseId ?? null,
      capacity: data.capacity ?? null,
      isActive: true,
    },
    include,
  });

  await logActivity(prisma, {
    userId,
    action: 'location.create',
    entityType: 'Location',
    entityId: loc.id,
    metadata: { name: loc.name, shortCode: loc.shortCode, type: loc.type, warehouseId: loc.warehouseId },
  });

  return shape(loc);
}

export async function update(userId, id, data) {
  const existing = await prisma.location.findUnique({
    where: { id },
    include: { defaultForWarehouse: true },
  });
  if (!existing) throw new NotFoundError('Location not found');

  if (existing.warehouseId === null) {
    if (data.type && data.type !== existing.type) {
      throw new ValidationError('Cannot change type of a system virtual location');
    }
  }

  if (data.shortCode && data.shortCode !== existing.shortCode) {
    await assertShortCodeFree(existing.warehouseId, data.shortCode, id);
  }

  const updated = await prisma.location.update({
    where: { id },
    data,
    include,
  });

  await logActivity(prisma, {
    userId,
    action: 'location.update',
    entityType: 'Location',
    entityId: id,
    metadata: data,
  });

  return shape(updated);
}

export async function remove(userId, id) {
  const loc = await prisma.location.findUnique({
    where: { id },
    include: { defaultForWarehouse: true },
  });
  if (!loc || !loc.isActive) throw new NotFoundError('Location not found');

  if (loc.warehouseId === null) {
    throw new ValidationError('Virtual system locations (Vendors, Customers, Adjustment) cannot be deleted.');
  }

  if (loc.defaultForWarehouse) {
    throw new ConflictError(
      `Cannot delete "${loc.name}": it is the default location for warehouse "${loc.defaultForWarehouse.name}". Select another default location first.`
    );
  }

  const stock = await prisma.stockQuant.aggregate({
    _sum: { quantity: true },
    where: { locationId: id, quantity: { gt: 0 } },
  });
  const qty = toNumber(stock._sum.quantity);
  if (qty > 0) {
    throw new ConflictError(
      `Cannot delete "${loc.name}": it currently holds ${qty} units of stock. Move or adjust the stock first.`
    );
  }

  const openOps = await prisma.operation.count({
    where: {
      OR: [{ sourceLocationId: id }, { destLocationId: id }],
      status: { in: ['DRAFT', 'WAITING', 'READY'] },
    },
  });
  if (openOps > 0) {
    throw new ConflictError(
      `Cannot delete "${loc.name}": ${openOps} open operation(s) are routed through this location.`
    );
  }

  await prisma.location.update({
    where: { id },
    data: { isActive: false },
  });

  await logActivity(prisma, {
    userId,
    action: 'location.delete',
    entityType: 'Location',
    entityId: id,
    metadata: { name: loc.name, shortCode: loc.shortCode },
  });

  return { message: 'Location deleted successfully' };
}

/**
 * Products currently held in one location (used by the Warehouse Map drawer).
 * Free to use = on hand − quantity reserved by READY deliveries/transfers leaving this location.
 * @param {string} id location id
 */
export async function getStock(id) {
  const loc = await prisma.location.findUnique({ where: { id }, include });
  if (!loc) throw new NotFoundError('Location not found');

  const [quants, reservedRows] = await Promise.all([
    prisma.stockQuant.findMany({
      where: { locationId: id, quantity: { gt: 0 } },
      include: {
        product: {
          select: { id: true, name: true, sku: true, uom: true, costPrice: true, category: { select: { name: true } } },
        },
      },
      orderBy: { quantity: 'desc' },
    }),
    prisma.operationLine.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { operation: { status: 'READY', type: { in: ['DELIVERY', 'INTERNAL'] }, sourceLocationId: id } },
    }),
  ]);
  const reserved = new Map(reservedRows.map((r) => [r.productId, toNumber(r._sum.quantity)]));

  const items = quants.map((q) => {
    const onHand = toNumber(q.quantity);
    const res = reserved.get(q.productId) ?? 0;
    const unitCost = toNumber(q.product.costPrice);
    return {
      productId: q.productId,
      name: q.product.name,
      sku: q.product.sku,
      uom: q.product.uom,
      category: q.product.category?.name ?? null,
      onHand,
      reserved: res,
      freeToUse: Math.max(0, Math.round((onHand - res) * 1000) / 1000),
      unitCost,
      value: Math.round(onHand * unitCost * 100) / 100,
    };
  });

  const totalQty = items.reduce((s, i) => s + i.onHand, 0);
  const capacity = loc.capacity === null ? null : toNumber(loc.capacity);
  return {
    location: shape(loc),
    capacity,
    totalQty,
    utilization: capacity ? Math.round((totalQty / capacity) * 1000) / 10 : null,
    totalValue: Math.round(items.reduce((s, i) => s + i.value, 0) * 100) / 100,
    items,
  };
}
