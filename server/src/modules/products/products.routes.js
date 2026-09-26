import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../lib/prisma.js';
import { ok } from '../../lib/serialize.js';

export const productsRouter = Router();

productsRouter.use(requireAuth);

// Minimal product search/listing for Member 2 operations (Member 3 will enhance with full pagination and filters)
productsRouter.get('/', async (req, res) => {
  const { search } = req.query;
  const where = { isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }
  const products = await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      sku: true,
      uom: true,
      costPrice: true,
      salePrice: true,
      barcode: true,
      isActive: true,
    },
  });
  ok(res, products);
});

productsRouter.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!product) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    }
    ok(res, product);
  } catch (err) {
    next(err);
  }
});

const stub = (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Product catalog write operations are scheduled for implementation by Member 3',
    },
  });
};

productsRouter.use(stub);
