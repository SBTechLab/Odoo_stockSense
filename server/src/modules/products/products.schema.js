import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination.js';

const optionalStr = (schema) =>
  schema.optional().or(z.literal('')).transform((v) => v || null);

export const createProductBody = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120, 'Name must be at most 120 characters'),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,30}$/, 'SKU must be 3-30 characters with uppercase letters, numbers, and hyphens'),
  categoryId: optionalStr(z.string().uuid('Invalid category ID')),
  uom: z.enum(['Units', 'kg', 'g', 'm', 'L', 'box', 'pack']).default('Units'),
  costPrice: z.coerce.number().min(0, 'Cost price must be non-negative'),
  salePrice: z.coerce.number().min(0, 'Sale price must be non-negative').optional().nullable(),
  description: optionalStr(z.string().trim().max(1000)),
  barcode: optionalStr(z.string().trim().max(50)),
  initialStock: z.coerce.number().min(0, 'Initial stock cannot be negative').optional(),
  locationId: optionalStr(z.string().uuid('Invalid location ID')),
});

export const updateProductBody = createProductBody.partial().omit({ initialStock: true, locationId: true });

export const listProductsQuery = z.object({
  search: z.string().max(100).optional(),
  categoryId: optionalStr(z.string().uuid()),
  stockStatus: z.enum(['IN_STOCK', 'LOW', 'OUT']).optional(),
  ...paginationQuery,
});

export const idParams = z.object({ id: z.string().uuid() });

export const bulkProductsBody = z.array(createProductBody).max(500, 'Cannot bulk import more than 500 products at once');
