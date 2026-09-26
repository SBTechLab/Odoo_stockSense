import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../lib/activity.js';
import { NotFoundError } from '../../lib/errors.js';
import { parsePagination, buildMeta } from '../../lib/pagination.js';

export async function list(query) {
  const { type, search } = query;
  const { skip, take, orderBy, page, limit } = parsePagination(query, {
    allowedSort: ['name', 'createdAt'],
    defaultSort: 'name',
  });

  const where = {
    isActive: true,
    ...(type ? { type } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { gstin: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip,
      take,
      orderBy,
      include: { _count: { select: { operations: true } } },
    }),
    prisma.contact.count({ where }),
  ]);

  return { data, meta: buildMeta({ page, limit }, total) };
}

export async function getById(id) {
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { _count: { select: { operations: true } } },
  });
  if (!contact || !contact.isActive) throw new NotFoundError('Contact not found');
  return contact;
}

export async function create(userId, body) {
  const contact = await prisma.contact.create({ data: body });
  await logActivity(prisma, { userId, action: 'contact.create', entityType: 'Contact', entityId: contact.id, metadata: { name: contact.name } });
  return contact;
}

export async function update(userId, id, body) {
  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing || !existing.isActive) throw new NotFoundError('Contact not found');
  const contact = await prisma.contact.update({ where: { id }, data: body });
  await logActivity(prisma, { userId, action: 'contact.update', entityType: 'Contact', entityId: id, metadata: body });
  return contact;
}

export async function remove(userId, id) {
  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing || !existing.isActive) throw new NotFoundError('Contact not found');
  await prisma.contact.update({ where: { id }, data: { isActive: false } });
  await logActivity(prisma, { userId, action: 'contact.delete', entityType: 'Contact', entityId: id, metadata: { name: existing.name } });
}
