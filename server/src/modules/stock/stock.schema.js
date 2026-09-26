import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination.js';

const optionalStr = (schema) =>
  schema.optional().or(z.literal('')).transform((v) => v || null);

export const listStockQuery = z.object({
  warehouseId: optionalStr(z.string().uuid()),
  locationId: optionalStr(z.string().uuid()),
  categoryId: optionalStr(z.string().uuid()),
  search: z.string().max(100).optional(),
  groupBy: z.enum(['product', 'location']).optional(),
  ...paginationQuery,
});
