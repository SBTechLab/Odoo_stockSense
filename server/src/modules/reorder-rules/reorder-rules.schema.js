import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination.js';

const optionalStr = (schema) =>
  schema.optional().or(z.literal('')).transform((v) => v || null);

export const createReorderRuleBody = z
  .object({
    productId: z.string().uuid('Invalid product ID'),
    warehouseId: z.string().uuid('Invalid warehouse ID'),
    minQty: z.coerce.number().min(0, 'Min quantity must be at least 0'),
    maxQty: z.coerce.number().min(0, 'Max quantity must be at least 0'),
    preferredVendorId: optionalStr(z.string().uuid('Invalid vendor ID')),
  })
  .refine((data) => data.minQty < data.maxQty, {
    message: 'Min quantity must be strictly less than max quantity',
    path: ['maxQty'],
  });

export const updateReorderRuleBody = z.object({
  productId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  minQty: z.coerce.number().min(0).optional(),
  maxQty: z.coerce.number().min(0).optional(),
  preferredVendorId: optionalStr(z.string().uuid()),
});

export const listReorderRulesQuery = z.object({
  productId: optionalStr(z.string().uuid()),
  warehouseId: optionalStr(z.string().uuid()),
  ...paginationQuery,
});

export const idParams = z.object({ id: z.string().uuid() });
