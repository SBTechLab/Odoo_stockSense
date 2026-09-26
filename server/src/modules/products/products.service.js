import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../lib/activity.js';
import { NotFoundError, ConflictError, ValidationError } from '../../lib/errors.js';
import { parsePagination, buildMeta } from '../../lib/pagination.js';
import { applyMoves, getVirtualLocation, getOnHand, getReserved } from '../../services/stock.service.js';
import { nextReference } from '../../services/sequence.service.js';
import { eventBus } from '../../lib/eventBus.js';
import { toNumber } from '../../lib/serialize.js';

export async function create(userId, body) {
  const { initialStock, locationId, ...productData } = body;

  const existingSku = await prisma.product.findUnique({
    where: { sku: productData.sku },
  });
  if (existingSku) {
    throw new ConflictError('A product with this SKU already exists', [
      { path: 'sku', message: 'A product with this SKU already exists' },
    ]);
  }

  if (productData.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: productData.categoryId } });
    if (!cat) throw new ValidationError('Category not found');
  }

  if (productData.barcode) {
    const existingBarcode = await prisma.product.findUnique({ where: { barcode: productData.barcode } });
    if (existingBarcode) {
      throw new ConflictError('A product with this barcode already exists', [
        { path: 'barcode', message: 'A product with this barcode already exists' },
      ]);
    }
  }

  if (initialStock && initialStock > 0) {
    if (!locationId) {
      throw new ValidationError('locationId is required when initialStock is specified', [
        { path: 'locationId', message: 'Location is required for initial stock' },
      ]);
    }
    const loc = await prisma.location.findUnique({ where: { id: locationId } });
    if (!loc || loc.type !== 'INTERNAL') {
      throw new ValidationError('locationId must be a valid internal location', [
        { path: 'locationId', message: 'Selected location must be an internal warehouse location' },
      ]);
    }
  }

  let touchedLocationId = null;

  const product = await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: productData,
      include: { category: true },
    });

    if (initialStock && initialStock > 0) {
      touchedLocationId = locationId;
      const targetLoc = await tx.location.findUnique({ where: { id: locationId } });
      const adjVirtual = await getVirtualLocation('ADJUSTMENT', tx);
      const ref = targetLoc?.warehouseId
        ? await nextReference(tx, targetLoc.warehouseId, 'ADJUSTMENT')
        : 'WH/ADJ/0001';

      await applyMoves(tx, {
        moves: [
          {
            productId: newProduct.id,
            fromLocationId: adjVirtual.id,
            toLocationId: locationId,
            quantity: initialStock,
            unitCost: newProduct.costPrice,
            note: 'Initial Stock',
          },
        ],
        reference: ref,
        type: 'ADJUSTMENT',
        userId,
      });
    }

    await logActivity(tx, {
      userId,
      action: 'product.create',
      entityType: 'Product',
      entityId: newProduct.id,
      metadata: { sku: newProduct.sku, name: newProduct.name, initialStock: initialStock || 0 },
    });

    return newProduct;
  });

  if (touchedLocationId) {
    eventBus.emit('stock.changed', { productIds: [product.id], locationIds: [touchedLocationId] });
  }

  return product;
}

export async function update(userId, id, body) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || !existing.isActive) throw new NotFoundError('Product not found');

  if (body.sku && body.sku !== existing.sku) {
    const skuTaken = await prisma.product.findUnique({ where: { sku: body.sku } });
    if (skuTaken) {
      throw new ConflictError('A product with this SKU already exists', [
        { path: 'sku', message: 'A product with this SKU already exists' },
      ]);
    }
  }

  if (body.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: body.categoryId } });
    if (!cat) throw new ValidationError('Category not found');
  }

  if (body.barcode && body.barcode !== existing.barcode) {
    const barcodeTaken = await prisma.product.findUnique({ where: { barcode: body.barcode } });
    if (barcodeTaken) {
      throw new ConflictError('A product with this barcode already exists', [
        { path: 'barcode', message: 'A product with this barcode already exists' },
      ]);
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: body,
    include: { category: true },
  });

  await logActivity(prisma, {
    userId,
    action: 'product.update',
    entityType: 'Product',
    entityId: id,
    metadata: body,
  });

  return product;
}

export async function getById(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      reorderRules: { include: { warehouse: true, preferredVendor: true } },
    },
  });
  if (!product || !product.isActive) throw new NotFoundError('Product not found');

  const [totalOnHand, totalReserved] = await Promise.all([
    getOnHand(product.id),
    prisma.operationLine.aggregate({
      _sum: { quantity: true },
      where: {
        productId: product.id,
        operation: { status: 'READY', type: { in: ['DELIVERY', 'INTERNAL'] } },
      },
    }).then((res) => toNumber(res._sum.quantity)),
  ]);

  const freeToUse = Math.max(0, totalOnHand - totalReserved);
  const costPrice = toNumber(product.costPrice);
  const stockValue = totalOnHand * costPrice;

  // Determine stockStatus: OUT if 0, LOW if any warehouse onHand <= minQty
  let stockStatus = 'IN_STOCK';
  if (totalOnHand === 0) {
    stockStatus = 'OUT';
  } else if (product.reorderRules && product.reorderRules.length > 0) {
    for (const rule of product.reorderRules) {
      const whOnHand = await getOnHand(product.id, { warehouseId: rule.warehouseId });
      const minQty = toNumber(rule.minQty);
      if (whOnHand <= minQty) {
        stockStatus = 'LOW';
        break;
      }
    }
  }

  return {
    ...product,
    totalOnHand,
    freeToUse,
    stockValue,
    stockStatus,
  };
}

export async function list(query) {
  const { search, categoryId, stockStatus } = query;
  const { page, limit } = parsePagination(query);

  const where = {
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
    where,
    include: {
      category: true,
      reorderRules: true,
    },
    orderBy: { name: 'asc' },
  });

  // Calculate stock levels for each product
  const enriched = await Promise.all(
    products.map(async (product) => {
      const [totalOnHand, totalReserved] = await Promise.all([
        getOnHand(product.id),
        prisma.operationLine.aggregate({
          _sum: { quantity: true },
          where: {
            productId: product.id,
            operation: { status: 'READY', type: { in: ['DELIVERY', 'INTERNAL'] } },
          },
        }).then((res) => toNumber(res._sum.quantity)),
      ]);

      const freeToUse = Math.max(0, totalOnHand - totalReserved);
      const costPrice = toNumber(product.costPrice);
      const stockValue = totalOnHand * costPrice;

      let status = 'IN_STOCK';
      if (totalOnHand === 0) {
        status = 'OUT';
      } else if (product.reorderRules && product.reorderRules.length > 0) {
        for (const rule of product.reorderRules) {
          const whOnHand = await getOnHand(product.id, { warehouseId: rule.warehouseId });
          const minQty = toNumber(rule.minQty);
          if (whOnHand <= minQty) {
            status = 'LOW';
            break;
          }
        }
      }

      return {
        ...product,
        totalOnHand,
        freeToUse,
        stockValue,
        stockStatus: status,
      };
    })
  );

  let filtered = enriched;
  if (stockStatus) {
    filtered = enriched.filter((p) => p.stockStatus === stockStatus);
  }

  const total = filtered.length;
  const skip = (page - 1) * limit;
  const paginatedData = filtered.slice(skip, skip + limit);

  return { data: paginatedData, meta: buildMeta({ page, limit }, total) };
}

export async function getProductStock(productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw new NotFoundError('Product not found');

  const locations = await prisma.location.findMany({
    where: { type: 'INTERNAL', isActive: true },
    include: { warehouse: true },
    orderBy: [{ warehouseId: 'asc' }, { name: 'asc' }],
  });

  const costPrice = toNumber(product.costPrice);

  const stockPerLocation = await Promise.all(
    locations.map(async (loc) => {
      const onHand = await getOnHand(productId, { locationId: loc.id });
      const reserved = await getReserved(productId, loc.id);
      const freeToUse = Math.max(0, onHand - reserved);
      const value = onHand * costPrice;

      return {
        locationId: loc.id,
        locationName: loc.name,
        shortCode: loc.shortCode,
        fullName: loc.warehouse ? `${loc.warehouse.shortCode}/${loc.shortCode}` : loc.shortCode,
        warehouseId: loc.warehouseId,
        warehouseName: loc.warehouse?.name || null,
        onHand,
        reserved,
        freeToUse,
        stockValue: value,
      };
    })
  );

  return stockPerLocation;
}

export async function getProductMoves(productId, query) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw new NotFoundError('Product not found');

  const { page, limit } = parsePagination(query);
  const skip = (page - 1) * limit;

  const where = { productId };

  const [moves, total] = await Promise.all([
    prisma.stockMove.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        fromLocation: { include: { warehouse: true } },
        toLocation: { include: { warehouse: true } },
        user: { select: { id: true, name: true, loginId: true } },
        operation: { select: { id: true, reference: true, type: true, status: true, contact: { select: { id: true, name: true } } } },
      },
    }),
    prisma.stockMove.count({ where }),
  ]);

  return { data: moves, meta: buildMeta({ page, limit }, total) };
}

export async function remove(userId, id) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || !existing.isActive) throw new NotFoundError('Product not found');

  const moveCount = await prisma.stockMove.count({ where: { productId: id } });
  const quantCount = await prisma.stockQuant.count({ where: { productId: id, quantity: { gt: 0 } } });

  if (moveCount > 0 || quantCount > 0) {
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    await logActivity(prisma, {
      userId,
      action: 'product.soft_delete',
      entityType: 'Product',
      entityId: id,
      metadata: { sku: existing.sku, name: existing.name },
    });
  } else {
    await prisma.product.delete({ where: { id } });
    await logActivity(prisma, {
      userId,
      action: 'product.hard_delete',
      entityType: 'Product',
      entityId: id,
      metadata: { sku: existing.sku, name: existing.name },
    });
  }
}

export async function exportCSV() {
  const result = await list({ limit: 10000 });
  const headers = ['SKU', 'Name', 'Category', 'UoM', 'Cost Price', 'Sale Price', 'Barcode', 'Total On Hand', 'Free To Use', 'Stock Value', 'Stock Status'];
  
  const rows = result.data.map((p) => [
    `"${p.sku}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.category?.name || ''}"`,
    `"${p.uom}"`,
    toNumber(p.costPrice).toFixed(2),
    p.salePrice ? toNumber(p.salePrice).toFixed(2) : '',
    `"${p.barcode || ''}"`,
    p.totalOnHand,
    p.freeToUse,
    p.stockValue.toFixed(2),
    `"${p.stockStatus}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export async function bulkImport(userId, rows) {
  const errors = [];
  let created = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.sku || !row.name) {
        errors.push({ row: i + 1, message: 'Missing required fields (sku, name)' });
        continue;
      }

      let categoryId = row.categoryId || null;
      if (row.categoryName && !categoryId) {
        const cat = await prisma.category.findFirst({
          where: { name: { equals: row.categoryName.trim(), mode: 'insensitive' } },
        });
        if (cat) categoryId = cat.id;
      }

      const sku = String(row.sku).trim().toUpperCase();
      const existing = await prisma.product.findUnique({ where: { sku } });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: row.name.trim(),
            categoryId: categoryId || existing.categoryId,
            uom: row.uom || existing.uom,
            costPrice: row.costPrice !== undefined ? Number(row.costPrice) : existing.costPrice,
            salePrice: row.salePrice !== undefined ? Number(row.salePrice) : existing.salePrice,
            description: row.description || existing.description,
            barcode: row.barcode || existing.barcode,
            isActive: true,
          },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            name: row.name.trim(),
            sku,
            categoryId,
            uom: row.uom || 'Units',
            costPrice: row.costPrice !== undefined ? Number(row.costPrice) : 0,
            salePrice: row.salePrice !== undefined ? Number(row.salePrice) : null,
            description: row.description || null,
            barcode: row.barcode || null,
          },
        });
        created++;
      }
    } catch (err) {
      errors.push({ row: i + 1, message: err.message });
    }
  }

  await logActivity(prisma, {
    userId,
    action: 'product.bulk_import',
    entityType: 'Product',
    metadata: { created, updated, totalErrors: errors.length },
  });

  return { created, updated, errors };
}
