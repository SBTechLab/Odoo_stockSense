import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../lib/activity.js';
import { NotFoundError, ConflictError } from '../../lib/errors.js';
import { parsePagination, buildMeta } from '../../lib/pagination.js';

export async function list(query) {
  const { search } = query;
  const { skip, take, orderBy, page, limit } = parsePagination(query, {
    allowedSort: ['name', 'createdAt'],
    defaultSort: 'name',
  });

  const where = {
    ...(search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    }),
    prisma.category.count({ where }),
  ]);

  return { data, meta: buildMeta({ page, limit }, total) };
}

export async function getById(id) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: { where: { isActive: true } } },
      },
    },
  });
  if (!category) throw new NotFoundError('Category not found');
  return category;
}

export async function create(userId, body) {
  const existing = await prisma.category.findFirst({
    where: { name: { equals: body.name, mode: 'insensitive' } },
  });
  if (existing) {
    throw new ConflictError('Category with this name already exists', [
      { path: 'name', message: 'Category with this name already exists' },
    ]);
  }

  const category = await prisma.category.create({ data: body });
  await logActivity(prisma, {
    userId,
    action: 'category.create',
    entityType: 'Category',
    entityId: category.id,
    metadata: { name: category.name },
  });
  return category;
}

export async function update(userId, id, body) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Category not found');

  if (body.name && body.name.toLowerCase() !== existing.name.toLowerCase()) {
    const nameTaken = await prisma.category.findFirst({
      where: { name: { equals: body.name, mode: 'insensitive' } },
    });
    if (nameTaken) {
      throw new ConflictError('Category with this name already exists', [
        { path: 'name', message: 'Category with this name already exists' },
      ]);
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: body,
  });

  await logActivity(prisma, {
    userId,
    action: 'category.update',
    entityType: 'Category',
    entityId: id,
    metadata: body,
  });

  return category;
}

export async function remove(userId, id) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Category not found');

  const productCount = await prisma.product.count({
    where: { categoryId: id, isActive: true },
  });

  if (productCount > 0) {
    throw new ConflictError('Cannot delete category with associated products', [
      { path: 'category', message: `Category is currently used by ${productCount} active product(s)` },
    ]);
  }

  await prisma.category.delete({ where: { id } });
  await logActivity(prisma, {
    userId,
    action: 'category.delete',
    entityType: 'Category',
    entityId: id,
    metadata: { name: existing.name },
  });
}
