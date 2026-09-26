import { prisma } from '../../lib/prisma.js';

export async function globalSearch(q) {
  if (!q || q.trim().length < 2) {
    return { products: [], operations: [], contacts: [] };
  }

  const term = q.trim();

  const [products, operations, contacts] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { sku: { contains: term, mode: 'insensitive' } },
          { barcode: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 5,
      include: { category: true },
    }),
    prisma.operation.findMany({
      where: {
        OR: [
          { reference: { contains: term, mode: 'insensitive' } },
          { notes: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 5,
    }),
    prisma.contact.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 5,
    }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: `SKU: ${p.sku}${p.category ? ' • ' + p.category.name : ''}`,
      type: 'product',
      link: `/products/${p.id}`,
    })),
    operations: operations.map((op) => ({
      id: op.id,
      title: op.reference,
      subtitle: `${op.type} • ${op.status}`,
      type: 'operation',
      link: `/operations/${op.id}`,
    })),
    contacts: contacts.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: c.type,
      type: 'contact',
      link: `/contacts`,
    })),
  };
}
