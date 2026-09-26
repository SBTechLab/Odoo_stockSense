import { prisma } from '../../lib/prisma.js';
import { parsePagination, buildMeta } from '../../lib/pagination.js';

export async function list(query = {}) {
  const pagination = parsePagination(query, {
    allowedSort: ['createdAt'],
    defaultSort: '-createdAt',
  });

  const where = {
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.dateFrom || query.dateTo
      ? {
          createdAt: {
            ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
            ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
          },
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: pagination.orderBy,
      include: {
        user: {
          select: { id: true, name: true, loginId: true, role: true },
        },
      },
    }),
  ]);

  return {
    rows,
    meta: buildMeta(pagination, total),
  };
}
