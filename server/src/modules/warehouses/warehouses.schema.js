import { z } from 'zod';

export const idParams = z.object({ id: z.uuid('Invalid id') });

export const shortCodeField = z
  .string({ error: 'Short code is required' })
  .trim()
  .toUpperCase()
  .min(1, 'Short code is required')
  .max(10, 'Short code must be at most 10 characters')
  .regex(/^[A-Z0-9_-]+$/, 'Short code may only contain letters, numbers, dash and underscore');

export const listWarehousesQuery = z.object({
  search: z.string().trim().max(100).optional(),
  includeInactive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export const createWarehouseBody = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters').max(100),
  shortCode: shortCodeField,
  address: z.string().trim().max(500).optional().nullable(),
});

export const updateWarehouseBody = createWarehouseBody
  .partial()
  .extend({
    defaultLocationId: z.uuid().nullable().optional(),
    isActive: z.boolean().optional(),
  });
