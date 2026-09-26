import { z } from 'zod';

export const idParams = z.object({
  id: z.string().uuid('Invalid operation ID'),
});

export const operationLineInput = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid('Invalid product ID'),
  quantity: z
    .coerce
    .number()
    .positive('Quantity must be greater than 0')
    .refine((val) => {
      // At most 3 decimal places
      const str = val.toString();
      const decimals = str.includes('.') ? str.split('.')[1].length : 0;
      return decimals <= 3;
    }, 'Quantity can have at most 3 decimal places'),
});

export const createOperationBody = z
  .object({
    type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL']),
    warehouseId: z.string().uuid('Warehouse is required'),
    contactId: z.string().uuid().optional().nullable(),
    sourceLocationId: z.string().uuid().optional().nullable(),
    destLocationId: z.string().uuid().optional().nullable(),
    scheduledDate: z.coerce.date().optional(),
    responsibleId: z.string().uuid().optional().nullable(),
    deliveryAddress: z.string().trim().max(500).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
    lines: z.array(operationLineInput).min(1, 'At least 1 product line is required'),
  })
  .refine(
    (data) => {
      const pids = data.lines.map((l) => l.productId);
      return new Set(pids).size === pids.length;
    },
    { message: 'The same product cannot appear multiple times in lines', path: ['lines'] }
  );

export const updateOperationBody = z
  .object({
    warehouseId: z.string().uuid().optional(),
    contactId: z.string().uuid().optional().nullable(),
    sourceLocationId: z.string().uuid().optional().nullable(),
    destLocationId: z.string().uuid().optional().nullable(),
    scheduledDate: z.coerce.date().optional(),
    responsibleId: z.string().uuid().optional().nullable(),
    deliveryAddress: z.string().trim().max(500).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
    lines: z.array(operationLineInput).min(1, 'At least 1 product line is required').optional(),
  })
  .refine(
    (data) => {
      if (!data.lines) return true;
      const pids = data.lines.map((l) => l.productId);
      return new Set(pids).size === pids.length;
    },
    { message: 'The same product cannot appear multiple times in lines', path: ['lines'] }
  );

export const listOperationsQuery = z.object({
  type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL', 'ADJUSTMENT']).optional(),
  status: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  search: z.string().trim().max(100).optional(),
  late: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('createdAt:desc'),
});

export const boardQuery = z.object({
  type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL']),
  warehouseId: z.string().uuid().optional(),
});
