import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import { logActivity } from '../../lib/activity.js';

export async function list({ type, search, includeInactive, page = 1, limit = 50 }) {
  const where = {};

  if (!includeInactive) {
    where.isActive = true;
  }

  if (type) {
    if (type === 'VENDOR') {
      where.type = { in: ['VENDOR', 'BOTH'] };
    } else if (type === 'CUSTOMER') {
      where.type = { in: ['CUSTOMER', 'BOTH'] };
    } else {
      where.type = type;
    }
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { gstin: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: { operations: true },
        },
      },
    }),
  ]);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getById(id) {
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      _count: {
        select: { operations: true, reorderRules: true },
      },
    },
  });

  if (!contact) {
    throw new NotFoundError('Contact not found');
  }

  return contact;
}

export async function create(userId, data) {
  const contact = await prisma.contact.create({
    data: {
      name: data.name,
      type: data.type,
      email: data.email,
      phone: data.phone,
      address: data.address,
      gstin: data.gstin,
      isActive: true,
    },
  });

  await logActivity(prisma, {
    userId,
    action: 'contact.create',
    entityType: 'Contact',
    entityId: contact.id,
    metadata: { name: contact.name, type: contact.type },
  });

  return contact;
}

export async function update(userId, id, data) {
  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Contact not found');
  }

  const contact = await prisma.contact.update({
    where: { id },
    data,
  });

  await logActivity(prisma, {
    userId,
    action: 'contact.update',
    entityType: 'Contact',
    entityId: contact.id,
    metadata: data,
  });

  return contact;
}

export async function remove(userId, id) {
  const existing = await prisma.contact.findUnique({
    where: { id },
    include: {
      _count: { select: { operations: true } },
    },
  });

  if (!existing) {
    throw new NotFoundError('Contact not found');
  }

  // Soft delete
  const contact = await prisma.contact.update({
    where: { id },
    data: { isActive: false },
  });

  await logActivity(prisma, {
    userId,
    action: 'contact.delete',
    entityType: 'Contact',
    entityId: contact.id,
    metadata: { name: contact.name, previousStatus: existing.isActive },
  });

  return { id: contact.id, isActive: false };
}
