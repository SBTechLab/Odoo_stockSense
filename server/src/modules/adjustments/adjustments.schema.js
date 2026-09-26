import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination.js';

export const createAdjustmentBody = z.object({
  locationId: z.string().uuid(),
  reason: z.enum(['DAMAGED', 'LOST', 'FOUND', 'COUNT_CORRECTION', 'OTHER']),
  notes: z.string().max(1000).optional().nullable(),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        countedQuantity: z.coerce.number().min(0),
      })
    )
    .min(1),
});

export const listAdjustmentsQuery = z.object({
  search: z.string().max(100).optional(),
  warehouseId: z.string().uuid().optional(),
  ...paginationQuery,
});

export const onHandQuery = z.object({
  locationId: z.string().uuid(),
  productId: z.string().uuid().optional(),
});

export const idParams = z.object({ id: z.string().uuid() });
