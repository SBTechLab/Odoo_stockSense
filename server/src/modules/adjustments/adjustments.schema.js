import { z } from 'zod';

export const idParams = z.object({
  id: z.string().uuid('Invalid adjustment ID'),
});

export const adjustmentLineInput = z.object({
  productId: z.string().uuid('Invalid product ID'),
  countedQuantity: z.coerce.number().min(0, 'Counted quantity cannot be negative'),
});

export const createAdjustmentBody = z
  .object({
    locationId: z.string().uuid('Location is required'),
    reason: z.enum(['DAMAGED', 'LOST', 'FOUND', 'COUNT_CORRECTION', 'OTHER'], {
      error: 'Valid reason is required (DAMAGED, LOST, FOUND, COUNT_CORRECTION, OTHER)',
    }),
    notes: z.string().trim().max(1000).optional().nullable(),
    lines: z.array(adjustmentLineInput).min(1, 'At least 1 product line is required'),
  })
  .refine(
    (data) => {
      const pids = data.lines.map((l) => l.productId);
      return new Set(pids).size === pids.length;
    },
    { message: 'The same product cannot appear multiple times in lines', path: ['lines'] }
  );

export const listAdjustmentsQuery = z.object({
  warehouseId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
