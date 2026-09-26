import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination.js';

const optionalStr = (schema) =>
  schema.optional().or(z.literal('')).transform((v) => v || null);

export const listMovesQuery = z.object({
  search: z.string().max(100).optional(),
  type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL', 'ADJUSTMENT']).optional(),
  productId: optionalStr(z.string().uuid()),
  locationId: optionalStr(z.string().uuid()),
  warehouseId: optionalStr(z.string().uuid()),
  dateFrom: optionalStr(z.string()),
  dateTo: optionalStr(z.string()),
  status: z.enum(['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED']).optional(),
  includePending: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  ...paginationQuery,
});
