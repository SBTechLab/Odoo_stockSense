import { prisma } from '../../lib/prisma.js';
import { parsePagination, buildMeta } from '../../lib/pagination.js';
import { toNumber } from '../../lib/serialize.js';

function computeDirection(type, fromLoc, toLoc) {
  if (type === 'ADJUSTMENT' || fromLoc?.type === 'ADJUSTMENT' || toLoc?.type === 'ADJUSTMENT') {
    return 'ADJ';
  }
  if (toLoc?.type === 'INTERNAL' && fromLoc?.type !== 'INTERNAL') {
    return 'IN';
  }
  if (fromLoc?.type === 'INTERNAL' && toLoc?.type !== 'INTERNAL') {
    return 'OUT';
  }
  if (fromLoc?.type === 'INTERNAL' && toLoc?.type === 'INTERNAL') {
    return 'INT';
  }
  return 'ADJ';
}

function formatLocationName(loc) {
  if (!loc) return '';
  return loc.warehouse ? `${loc.warehouse.shortCode}/${loc.shortCode}` : loc.shortCode || loc.name;
}

export async function list(query) {
  const { search, type, productId, locationId, warehouseId, dateFrom, dateTo, status, includePending } = query;
  const { page, limit } = parsePagination(query);

  const moveWhere = {
    ...(type ? { type } : {}),
    ...(productId ? { productId } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(locationId
      ? {
          OR: [{ fromLocationId: locationId }, { toLocationId: locationId }],
        }
      : {}),
    ...(warehouseId
      ? {
          OR: [
            { fromLocation: { warehouseId } },
            { toLocation: { warehouseId } },
          ],
        }
      : {}),
    ...(status
      ? {
          operation: { status },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { reference: { contains: search, mode: 'insensitive' } },
            { operation: { contact: { name: { contains: search, mode: 'insensitive' } } } },
            { product: { name: { contains: search, mode: 'insensitive' } } },
            { product: { sku: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const moves = await prisma.stockMove.findMany({
    where: moveWhere,
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { id: true, name: true, sku: true, uom: true } },
      fromLocation: { include: { warehouse: true } },
      toLocation: { include: { warehouse: true } },
      user: { select: { id: true, name: true, loginId: true } },
      operation: { select: { id: true, reference: true, type: true, status: true, contact: { select: { id: true, name: true } } } },
    },
  });

  const formattedMoves = moves.map((m) => ({
    id: m.id,
    reference: m.reference,
    date: m.createdAt,
    type: m.type,
    operationId: m.operationId,
    operationStatus: m.operation?.status || 'DONE',
    contact: m.operation?.contact ? { id: m.operation.contact.id, name: m.operation.contact.name } : null,
    from: formatLocationName(m.fromLocation),
    fromLocationId: m.fromLocationId,
    fromLocation: m.fromLocation,
    to: formatLocationName(m.toLocation),
    toLocationId: m.toLocationId,
    toLocation: m.toLocation,
    product: m.product,
    productId: m.productId,
    quantity: toNumber(m.quantity),
    unitCost: toNumber(m.unitCost),
    direction: computeDirection(m.type, m.fromLocation, m.toLocation),
    pending: false,
    user: m.user,
  }));

  const allItems = [...formattedMoves];

  if (includePending && (!status || ['DRAFT', 'WAITING', 'READY'].includes(status))) {
    const opWhere = {
      status: status ? status : { in: ['DRAFT', 'WAITING', 'READY'] },
      ...(type ? { type } : {}),
      ...(warehouseId ? { warehouseId } : {}),
      ...(dateFrom || dateTo
        ? {
            scheduledDate: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
      ...(locationId
        ? {
            OR: [{ sourceLocationId: locationId }, { destLocationId: locationId }],
          }
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

    const pendingOps = await prisma.operation.findMany({
      where: opWhere,
      include: {
        lines: {
          where: productId ? { productId } : {},
          include: { product: { select: { id: true, name: true, sku: true, uom: true } } },
        },
        sourceLocation: { include: { warehouse: true } },
        destLocation: { include: { warehouse: true } },
        contact: { select: { id: true, name: true } },
      },
    });

    for (const op of pendingOps) {
      for (const line of op.lines) {
        allItems.push({
          id: `pending_${line.id}`,
          reference: op.reference,
          date: op.scheduledDate,
          type: op.type,
          operationId: op.id,
          operationStatus: op.status,
          contact: op.contact ? { id: op.contact.id, name: op.contact.name } : null,
          from: formatLocationName(op.sourceLocation),
          fromLocationId: op.sourceLocationId,
          fromLocation: op.sourceLocation,
          to: formatLocationName(op.destLocation),
          toLocationId: op.destLocationId,
          toLocation: op.destLocation,
          product: line.product,
          productId: line.productId,
          quantity: toNumber(line.quantity),
          unitCost: toNumber(line.product?.costPrice || 0),
          direction: computeDirection(op.type, op.sourceLocation, op.destLocation),
          pending: true,
          user: null,
        });
      }
    }

    allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  const total = allItems.length;
  const skip = (page - 1) * limit;
  const paginated = allItems.slice(skip, skip + limit);

  return { data: paginated, meta: buildMeta({ page, limit }, total) };
}

export async function getBoard(query) {
  const result = await list({ ...query, includePending: true, limit: 1000 });
  const grouped = {
    DRAFT: [],
    WAITING: [],
    READY: [],
    DONE: [],
    CANCELED: [],
  };

  for (const item of result.data) {
    const st = item.operationStatus || 'DONE';
    if (grouped[st]) {
      grouped[st].push(item);
    } else {
      grouped.DONE.push(item);
    }
  }

  return grouped;
}

export async function exportCSV(query) {
  const result = await list({ ...query, limit: 10000 });
  const headers = ['Reference', 'Date', 'Type', 'Status', 'Contact', 'From Location', 'To Location', 'SKU', 'Product', 'Quantity', 'Direction', 'Pending'];

  const rows = result.data.map((m) => [
    `"${m.reference}"`,
    `"${new Date(m.date).toISOString()}"`,
    `"${m.type}"`,
    `"${m.operationStatus}"`,
    `"${m.contact?.name || ''}"`,
    `"${m.from}"`,
    `"${m.to}"`,
    `"${m.product?.sku || ''}"`,
    `"${(m.product?.name || '').replace(/"/g, '""')}"`,
    m.quantity,
    `"${m.direction}"`,
    m.pending ? 'Yes' : 'No',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
