import { prisma } from '../../lib/prisma.js';
import { getOnHand } from '../../services/stock.service.js';
import { toNumber } from '../../lib/serialize.js';

export async function getSummary(query) {
  const { warehouseId, locationId, categoryId } = query;

  const productWhere = {
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
  };

  const products = await prisma.product.findMany({
    where: productWhere,
    include: { reorderRules: true },
  });

  const totalProducts = products.length;

  let totalUnitsOnHand = 0;
  let stockValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of products) {
    const cost = toNumber(p.costPrice);
    const onHand = await getOnHand(p.id, { locationId, warehouseId });

    totalUnitsOnHand += onHand;
    stockValue += onHand * cost;

    if (onHand === 0) {
      outOfStockCount++;
    } else if (p.reorderRules && p.reorderRules.length > 0) {
      let isLow = false;
      for (const rule of p.reorderRules) {
        if (warehouseId && rule.warehouseId !== warehouseId) continue;
        const whOnHand = await getOnHand(p.id, { warehouseId: rule.warehouseId });
        if (whOnHand <= toNumber(rule.minQty)) {
          isLow = true;
          break;
        }
      }
      if (isLow) lowStockCount++;
    }
  }

  const opWhere = (type) => ({
    type,
    status: { in: ['DRAFT', 'WAITING', 'READY'] },
    ...(warehouseId ? { warehouseId } : {}),
    ...(locationId ? { OR: [{ sourceLocationId: locationId }, { destLocationId: locationId }] } : {}),
  });

  const [pendingReceipts, pendingDeliveries, scheduledTransfers] = await Promise.all([
    prisma.operation.count({ where: opWhere('RECEIPT') }),
    prisma.operation.count({ where: opWhere('DELIVERY') }),
    prisma.operation.count({ where: opWhere('INTERNAL') }),
  ]);

  return {
    totalProducts,
    totalUnitsOnHand: Math.round(totalUnitsOnHand * 1000) / 1000,
    stockValue: Math.round(stockValue * 100) / 100,
    lowStockCount,
    outOfStockCount,
    pendingReceipts,
    pendingDeliveries,
    scheduledTransfers,
  };
}

export async function getOperationCards(query) {
  const { warehouseId, locationId } = query;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const baseWhere = (type) => ({
    type,
    ...(warehouseId ? { warehouseId } : {}),
    ...(locationId ? { OR: [{ sourceLocationId: locationId }, { destLocationId: locationId }] } : {}),
  });

  const [toReceive, receiptLate, receiptScheduled] = await Promise.all([
    prisma.operation.count({ where: { ...baseWhere('RECEIPT'), status: 'READY' } }),
    prisma.operation.count({
      where: {
        ...baseWhere('RECEIPT'),
        status: { notIn: ['DONE', 'CANCELED'] },
        scheduledDate: { lt: startOfToday },
      },
    }),
    prisma.operation.count({
      where: {
        ...baseWhere('RECEIPT'),
        scheduledDate: { gt: endOfToday },
      },
    }),
  ]);

  const [toDeliver, deliveryLate, deliveryWaiting, deliveryScheduled] = await Promise.all([
    prisma.operation.count({ where: { ...baseWhere('DELIVERY'), status: 'READY' } }),
    prisma.operation.count({
      where: {
        ...baseWhere('DELIVERY'),
        status: { notIn: ['DONE', 'CANCELED'] },
        scheduledDate: { lt: startOfToday },
      },
    }),
    prisma.operation.count({ where: { ...baseWhere('DELIVERY'), status: 'WAITING' } }),
    prisma.operation.count({
      where: {
        ...baseWhere('DELIVERY'),
        scheduledDate: { gt: endOfToday },
      },
    }),
  ]);

  return {
    receipts: {
      toReceive,
      late: receiptLate,
      operations: receiptScheduled,
    },
    deliveries: {
      toDeliver,
      late: deliveryLate,
      waiting: deliveryWaiting,
      operations: deliveryScheduled,
    },
  };
}

export async function getTrends(query) {
  const days = query.days || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const moves = await prisma.stockMove.findMany({
    where: {
      createdAt: { gte: startDate },
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.warehouseId
        ? { OR: [{ fromLocation: { warehouseId: query.warehouseId } }, { toLocation: { warehouseId: query.warehouseId } }] }
        : {}),
    },
    include: {
      fromLocation: true,
      toLocation: true,
    },
  });

  const dateMap = new Map();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    dateMap.set(dateStr, { date: dateStr, incoming: 0, outgoing: 0 });
  }

  for (const move of moves) {
    const dateStr = new Date(move.createdAt).toISOString().split('T')[0];
    if (dateMap.has(dateStr)) {
      const entry = dateMap.get(dateStr);
      const qty = toNumber(move.quantity);
      if (move.toLocation.type === 'INTERNAL' && move.fromLocation.type !== 'INTERNAL') {
        entry.incoming += qty;
      } else if (move.fromLocation.type === 'INTERNAL' && move.toLocation.type !== 'INTERNAL') {
        entry.outgoing += qty;
      }
    }
  }

  const result = Array.from(dateMap.values()).map((e) => ({
    ...e,
    incoming: Math.round(e.incoming * 1000) / 1000,
    outgoing: Math.round(e.outgoing * 1000) / 1000,
  }));

  return result;
}

export async function getTopProducts(query) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const moves = await prisma.stockMove.findMany({
    where: {
      createdAt: { gte: startDate },
      ...(query.warehouseId
        ? { OR: [{ fromLocation: { warehouseId: query.warehouseId } }, { toLocation: { warehouseId: query.warehouseId } }] }
        : {}),
    },
    include: { product: true },
  });

  const productMovedMap = new Map();
  for (const move of moves) {
    if (!move.product) continue;
    const pId = move.productId;
    const current = productMovedMap.get(pId) || { product: move.product, totalMoved: 0 };
    current.totalMoved += toNumber(move.quantity);
    productMovedMap.set(pId, current);
  }

  const topProducts = Array.from(productMovedMap.values())
    .sort((a, b) => b.totalMoved - a.totalMoved)
    .slice(0, 5)
    .map((item) => ({
      id: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      uom: item.product.uom,
      totalMoved: Math.round(item.totalMoved * 1000) / 1000,
    }));

  const products = await prisma.product.findMany({
    where: { isActive: true, ...(query.categoryId ? { categoryId: query.categoryId } : {}) },
    include: { reorderRules: true, category: true },
  });

  const lowStockList = [];
  for (const p of products) {
    const onHand = await getOnHand(p.id, { warehouseId: query.warehouseId });
    let minQty = 0;
    let isLow = false;

    if (onHand === 0) {
      isLow = true;
    } else if (p.reorderRules && p.reorderRules.length > 0) {
      for (const rule of p.reorderRules) {
        if (query.warehouseId && rule.warehouseId !== query.warehouseId) continue;
        const whOnHand = await getOnHand(p.id, { warehouseId: rule.warehouseId });
        if (whOnHand <= toNumber(rule.minQty)) {
          isLow = true;
          minQty = toNumber(rule.minQty);
          break;
        }
      }
    }

    if (isLow) {
      lowStockList.push({
        id: p.id,
        name: p.name,
        sku: p.sku,
        categoryName: p.category?.name || null,
        uom: p.uom,
        onHand,
        minQty,
        status: onHand === 0 ? 'OUT' : 'LOW',
      });
    }
  }

  return {
    topProducts,
    lowStockList,
  };
}
