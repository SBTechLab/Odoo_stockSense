import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../lib/activity.js';
import { toNumber } from '../../lib/serialize.js';
import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.js';

const include = {
  defaultLocation: { select: { id: true, name: true, shortCode: true } },
  _count: { select: { locations: { where: { isActive: true } } } },
};

/** Shape a warehouse row for the API (adds locationCount). */
function shape(w) {
  const { _count, ...rest } = w;
  return { ...rest, locationCount: _count?.locations ?? 0 };
}

async function assertShortCodeFree(shortCode, excludeId) {
  const clash = await prisma.warehouse.findFirst({
    where: { shortCode, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  if (clash) {
    throw new ConflictError('This short code is already used by another warehouse', [
      { path: 'shortCode', message: 'This short code is already used by another warehouse' },
    ]);
  }
}

export async function list({ search, includeInactive } = {}) {
  const rows = await prisma.warehouse.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(search
        ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { shortCode: { contains: search, mode: 'insensitive' } }] }
        : {}),
    },
    include,
    orderBy: { name: 'asc' },
  });
  return rows.map(shape);
}

export async function getById(id) {
  const w = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      ...include,
      locations: { where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, shortCode: true, type: true } },
    },
  });
  if (!w) throw new NotFoundError('Warehouse not found');
  return shape(w);
}

/** Create a warehouse together with its default "Stock" location. */
export async function create(userId, data) {
  await assertShortCodeFree(data.shortCode);
  const warehouse = await prisma.$transaction(async (tx) => {
    const w = await tx.warehouse.create({ data: { name: data.name, shortCode: data.shortCode, address: data.address ?? null } });
    const stock = await tx.location.create({ data: { name: 'Stock', shortCode: 'STOCK', type: 'INTERNAL', warehouseId: w.id } });
    const updated = await tx.warehouse.update({ where: { id: w.id }, data: { defaultLocationId: stock.id }, include });
    await logActivity(tx, { userId, action: 'warehouse.create', entityType: 'Warehouse', entityId: w.id, metadata: { name: w.name, shortCode: w.shortCode } });
    return updated;
  });
  return shape(warehouse);
}

export async function update(userId, id, data) {
  const existing = await prisma.warehouse.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Warehouse not found');
  if (data.shortCode && data.shortCode !== existing.shortCode) await assertShortCodeFree(data.shortCode, id);

  if (data.defaultLocationId) {
    const loc = await prisma.location.findUnique({ where: { id: data.defaultLocationId } });
    if (!loc || loc.warehouseId !== id || loc.type !== 'INTERNAL' || !loc.isActive) {
      throw new ValidationError('Default location must be an active internal location of this warehouse', [
        { path: 'defaultLocationId', message: 'Pick a location that belongs to this warehouse' },
      ]);
    }
  }

  const w = await prisma.warehouse.update({ where: { id }, data, include });
  await logActivity(prisma, { userId, action: 'warehouse.update', entityType: 'Warehouse', entityId: id, metadata: data });
  return shape(w);
}

/** Soft delete. Blocked while any of its locations holds stock or open operations exist. */
export async function remove(userId, id) {
  const w = await prisma.warehouse.findUnique({ where: { id } });
  if (!w || !w.isActive) throw new NotFoundError('Warehouse not found');

  const stock = await prisma.stockQuant.aggregate({
    _sum: { quantity: true },
    where: { location: { warehouseId: id }, quantity: { gt: 0 } },
  });
  const qty = toNumber(stock._sum.quantity);
  if (qty > 0) {
    throw new ConflictError(`Cannot delete "${w.name}": it still holds ${qty} units of stock. Move or adjust the stock first.`);
  }
  const openOps = await prisma.operation.count({ where: { warehouseId: id, status: { in: ['DRAFT', 'WAITING', 'READY'] } } });
  if (openOps > 0) {
    throw new ConflictError(`Cannot delete "${w.name}": it has ${openOps} open operation(s). Validate or cancel them first.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.location.updateMany({ where: { warehouseId: id }, data: { isActive: false } });
    await tx.warehouse.update({ where: { id }, data: { isActive: false } });
    await logActivity(tx, { userId, action: 'warehouse.delete', entityType: 'Warehouse', entityId: id, metadata: { name: w.name } });
  });
}

/** Utilization bands shared with the client legend. */
export const UTILIZATION_BANDS = { warn: 70, critical: 90 };

/**
 * Visual map data: every active internal location of a warehouse with its stock
 * totals and utilization (on-hand ÷ capacity). Locations without a capacity return
 * utilization null (shown as "no capacity set").
 * @param {string} id warehouse id
 */
export async function getMap(id) {
  const w = await prisma.warehouse.findUnique({
    where: { id },
    select: { id: true, name: true, shortCode: true, address: true, defaultLocationId: true, isActive: true },
  });
  if (!w || !w.isActive) throw new NotFoundError('Warehouse not found');

  const locations = await prisma.location.findMany({
    where: { warehouseId: id, type: 'INTERNAL', isActive: true },
    orderBy: [{ name: 'asc' }],
    select: {
      id: true,
      name: true,
      shortCode: true,
      capacity: true,
      quants: {
        where: { quantity: { gt: 0 } },
        select: { quantity: true, product: { select: { costPrice: true } } },
      },
    },
  });

  const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
  const tiles = locations.map((l) => {
    const totalQty = l.quants.reduce((s, q) => s + toNumber(q.quantity), 0);
    const value = l.quants.reduce((s, q) => s + toNumber(q.quantity) * toNumber(q.product.costPrice), 0);
    const capacity = l.capacity === null ? null : toNumber(l.capacity);
    const utilization = capacity ? round((totalQty / capacity) * 100) : null;
    const status =
      utilization === null ? 'UNKNOWN' : utilization >= UTILIZATION_BANDS.critical ? 'CRITICAL' : utilization >= UTILIZATION_BANDS.warn ? 'WARNING' : 'OK';
    return {
      id: l.id,
      name: l.name,
      shortCode: l.shortCode,
      fullName: `${w.shortCode}/${l.shortCode}`,
      isDefault: l.id === w.defaultLocationId,
      capacity,
      totalQty: round(totalQty, 3),
      productCount: l.quants.length,
      value: round(value, 2),
      utilization,
      status,
    };
  });

  const withCap = tiles.filter((t) => t.capacity);
  const capSum = withCap.reduce((s, t) => s + t.capacity, 0);
  const qtySum = withCap.reduce((s, t) => s + t.totalQty, 0);
  return {
    warehouse: w,
    bands: UTILIZATION_BANDS,
    summary: {
      locationCount: tiles.length,
      totalQty: round(tiles.reduce((s, t) => s + t.totalQty, 0), 3),
      totalValue: round(tiles.reduce((s, t) => s + t.value, 0), 2),
      overallUtilization: capSum ? round((qtySum / capSum) * 100) : null,
      critical: tiles.filter((t) => t.status === 'CRITICAL').length,
      warning: tiles.filter((t) => t.status === 'WARNING').length,
    },
    locations: tiles,
  };
}
