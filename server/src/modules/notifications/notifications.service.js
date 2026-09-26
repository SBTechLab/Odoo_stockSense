import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import { parsePagination, buildMeta } from '../../lib/pagination.js';

export async function list(userId, query) {
  const { page, limit } = parsePagination(query);
  const skip = (page - 1) * limit;

  const where = {
    OR: [{ userId: null }, { userId }],
  };

  const [data, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
      include: {
        product: { select: { id: true, name: true, sku: true } },
        operation: { select: { id: true, reference: true, type: true } },
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        ...where,
        readAt: null,
      },
    }),
  ]);

  return { data, unreadCount, meta: buildMeta({ page, limit }, total) };
}

export async function markAsRead(userId, id) {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Notification not found');

  const updated = await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  return updated;
}

export async function markAllAsRead(userId) {
  const where = {
    OR: [{ userId: null }, { userId }],
    readAt: null,
  };

  await prisma.notification.updateMany({
    where,
    data: { readAt: new Date() },
  });

  return { message: 'All notifications marked as read' };
}
