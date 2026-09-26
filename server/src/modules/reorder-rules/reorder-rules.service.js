import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../lib/activity.js';
import { NotFoundError, ConflictError, ValidationError } from '../../lib/errors.js';
import { parsePagination, buildMeta } from '../../lib/pagination.js';
import { toNumber } from '../../lib/serialize.js';

export async function list(query) {
  const { productId, warehouseId } = query;
  const { skip, take, page, limit } = parsePagination(query);

  const where = {
    ...(productId ? { productId } : {}),
    ...(warehouseId ? { warehouseId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.reorderRule.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true, uom: true } },
        warehouse: { select: { id: true, name: true, shortCode: true } },
        preferredVendor: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.reorderRule.count({ where }),
  ]);

  return { data, meta: buildMeta({ page, limit }, total) };
}

export async function getById(id) {
  const rule = await prisma.reorderRule.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true, sku: true, uom: true } },
      warehouse: { select: { id: true, name: true, shortCode: true } },
      preferredVendor: { select: { id: true, name: true, email: true } },
    },
  });
  if (!rule) throw new NotFoundError('Reorder rule not found');
  return rule;
}

export async function create(userId, body) {
  const product = await prisma.product.findUnique({ where: { id: body.productId } });
  if (!product || !product.isActive) throw new ValidationError('Product not found');

  const warehouse = await prisma.warehouse.findUnique({ where: { id: body.warehouseId } });
  if (!warehouse || !warehouse.isActive) throw new ValidationError('Warehouse not found');

  if (body.preferredVendorId) {
    const vendor = await prisma.contact.findUnique({ where: { id: body.preferredVendorId } });
    if (!vendor || !vendor.isActive) throw new ValidationError('Preferred vendor not found');
  }

  const existing = await prisma.reorderRule.findUnique({
    where: {
      productId_warehouseId: {
        productId: body.productId,
        warehouseId: body.warehouseId,
      },
    },
  });

  if (existing) {
    throw new ConflictError('A reorder rule already exists for this product in this warehouse', [
      { path: 'warehouseId', message: 'Reorder rule already exists for this product and warehouse' },
    ]);
  }

  const rule = await prisma.reorderRule.create({
    data: body,
    include: {
      product: { select: { id: true, name: true, sku: true, uom: true } },
      warehouse: { select: { id: true, name: true, shortCode: true } },
      preferredVendor: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity(prisma, {
    userId,
    action: 'reorder_rule.create',
    entityType: 'ReorderRule',
    entityId: rule.id,
    metadata: { productId: body.productId, warehouseId: body.warehouseId, minQty: body.minQty, maxQty: body.maxQty },
  });

  return rule;
}

export async function update(userId, id, body) {
  const existing = await prisma.reorderRule.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Reorder rule not found');

  const newMin = body.minQty !== undefined ? body.minQty : toNumber(existing.minQty);
  const newMax = body.maxQty !== undefined ? body.maxQty : toNumber(existing.maxQty);

  if (newMin >= newMax) {
    throw new ValidationError('Min quantity must be strictly less than max quantity', [
      { path: 'maxQty', message: 'Min quantity must be strictly less than max quantity' },
    ]);
  }

  const newProductId = body.productId || existing.productId;
  const newWarehouseId = body.warehouseId || existing.warehouseId;

  if (newProductId !== existing.productId || newWarehouseId !== existing.warehouseId) {
    const conflict = await prisma.reorderRule.findUnique({
      where: {
        productId_warehouseId: {
          productId: newProductId,
          warehouseId: newWarehouseId,
        },
      },
    });
    if (conflict && conflict.id !== id) {
      throw new ConflictError('A reorder rule already exists for this product in this warehouse');
    }
  }

  const rule = await prisma.reorderRule.update({
    where: { id },
    data: body,
    include: {
      product: { select: { id: true, name: true, sku: true, uom: true } },
      warehouse: { select: { id: true, name: true, shortCode: true } },
      preferredVendor: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity(prisma, {
    userId,
    action: 'reorder_rule.update',
    entityType: 'ReorderRule',
    entityId: id,
    metadata: body,
  });

  return rule;
}

export async function remove(userId, id) {
  const existing = await prisma.reorderRule.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Reorder rule not found');

  await prisma.reorderRule.delete({ where: { id } });
  await logActivity(prisma, {
    userId,
    action: 'reorder_rule.delete',
    entityType: 'ReorderRule',
    entityId: id,
  });
}
