import { prisma } from '../../lib/prisma.js';
import { parsePagination, buildMeta } from '../../lib/pagination.js';
import { getOnHand, getReserved } from '../../services/stock.service.js';
import { toNumber } from '../../lib/serialize.js';

export async function list(query) {
  const { warehouseId, locationId, categoryId, search, groupBy } = query;
  const { page, limit } = parsePagination(query);

  const productWhere = {
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const products = await prisma.product.findMany({
    where: productWhere,
    include: { category: true },
    orderBy: { name: 'asc' },
  });

  const rows = [];

  if (groupBy === 'location' || locationId) {
    const locWhere = {
      type: 'INTERNAL',
      isActive: true,
      ...(locationId ? { id: locationId } : {}),
      ...(warehouseId ? { warehouseId } : {}),
    };
    const locations = await prisma.location.findMany({
      where: locWhere,
      include: { warehouse: true },
      orderBy: [{ warehouseId: 'asc' }, { name: 'asc' }],
    });

    for (const product of products) {
      const unitCost = toNumber(product.costPrice);

      for (const loc of locations) {
        const onHand = await getOnHand(product.id, { locationId: loc.id });
        const reserved = await getReserved(product.id, loc.id);
        const freeToUse = Math.max(0, onHand - reserved);
        const value = onHand * unitCost;

        if (onHand > 0 || reserved > 0 || search || locationId) {
          rows.push({
            id: `${product.id}_${loc.id}`,
            productId: product.id,
            product: {
              id: product.id,
              name: product.name,
              sku: product.sku,
              categoryName: product.category?.name || null,
            },
            sku: product.sku,
            uom: product.uom,
            unitCost,
            locationId: loc.id,
            locationName: loc.name,
            locationFullName: loc.warehouse ? `${loc.warehouse.shortCode}/${loc.shortCode}` : loc.shortCode,
            warehouseId: loc.warehouseId,
            warehouseName: loc.warehouse?.name || null,
            onHand,
            reserved,
            freeToUse,
            value,
          });
        }
      }
    }
  } else {
    for (const product of products) {
      const unitCost = toNumber(product.costPrice);
      const onHand = await getOnHand(product.id, { warehouseId });

      let reserved = 0;
      if (warehouseId) {
        const whLocations = await prisma.location.findMany({
          where: { warehouseId, type: 'INTERNAL', isActive: true },
          select: { id: true },
        });
        for (const loc of whLocations) {
          reserved += await getReserved(product.id, loc.id);
        }
      } else {
        const allReserved = await prisma.operationLine.aggregate({
          _sum: { quantity: true },
          where: {
            productId: product.id,
            operation: { status: 'READY', type: { in: ['DELIVERY', 'INTERNAL'] } },
          },
        });
        reserved = toNumber(allReserved._sum.quantity);
      }

      const freeToUse = Math.max(0, onHand - reserved);
      const value = onHand * unitCost;

      rows.push({
        id: product.id,
        productId: product.id,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          categoryName: product.category?.name || null,
        },
        sku: product.sku,
        uom: product.uom,
        unitCost,
        onHand,
        reserved,
        freeToUse,
        value,
      });
    }
  }

  const totals = rows.reduce(
    (acc, row) => {
      acc.totalOnHand += row.onHand;
      acc.totalFreeToUse += row.freeToUse;
      acc.totalValue += row.value;
      return acc;
    },
    { totalOnHand: 0, totalFreeToUse: 0, totalValue: 0 }
  );

  totals.totalOnHand = Math.round(totals.totalOnHand * 1000) / 1000;
  totals.totalFreeToUse = Math.round(totals.totalFreeToUse * 1000) / 1000;
  totals.totalValue = Math.round(totals.totalValue * 100) / 100;

  const total = rows.length;
  const skip = (page - 1) * limit;
  const paginatedRows = rows.slice(skip, skip + limit);

  return {
    data: paginatedRows,
    totals,
    meta: buildMeta({ page, limit }, total),
  };
}

export async function exportCSV(query) {
  const result = await list({ ...query, limit: 10000 });

  const isLocationGroup = query.groupBy === 'location' || Boolean(query.locationId);
  const headers = isLocationGroup
    ? ['Product Name', 'SKU', 'Location', 'UoM', 'Unit Cost', 'On Hand', 'Free To Use', 'Stock Value']
    : ['Product Name', 'SKU', 'Category', 'UoM', 'Unit Cost', 'On Hand', 'Free To Use', 'Stock Value'];

  const rows = result.data.map((r) => [
    `"${r.product.name.replace(/"/g, '""')}"`,
    `"${r.sku}"`,
    isLocationGroup ? `"${r.locationFullName}"` : `"${r.product.categoryName || ''}"`,
    `"${r.uom}"`,
    r.unitCost.toFixed(2),
    r.onHand,
    r.freeToUse,
    r.value.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
