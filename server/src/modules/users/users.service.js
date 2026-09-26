import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../lib/activity.js';
import { buildMeta, parsePagination } from '../../lib/pagination.js';
import { ForbiddenError, NotFoundError } from '../../lib/errors.js';
import { publicUserSelect } from '../../middleware/auth.js';

export async function list(query) {
  const pg = parsePagination(query, { allowedSort: ['name', 'loginId', 'createdAt', 'lastLoginAt', 'role'], defaultSort: 'name' });
  const where = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { loginId: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: publicUserSelect, orderBy: pg.orderBy, skip: pg.skip, take: pg.take }),
    prisma.user.count({ where }),
  ]);
  return { items, meta: buildMeta(pg, total) };
}

/** Change role / active flag. An admin cannot deactivate or demote themselves. */
export async function update(actor, id, { role, isActive }) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');

  if (id === actor.id) {
    if (isActive === false) throw new ForbiddenError('You cannot deactivate your own account');
    if (role && role !== user.role) throw new ForbiddenError('You cannot change your own role');
  }

  const updated = await prisma.user.update({ where: { id }, data: { role, isActive }, select: publicUserSelect });
  await logActivity(prisma, {
    userId: actor.id,
    action: 'user.update',
    entityType: 'User',
    entityId: id,
    metadata: { loginId: user.loginId, from: { role: user.role, isActive: user.isActive }, to: { role, isActive } },
  });
  return updated;
}
