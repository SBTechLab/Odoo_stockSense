import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination.js';

const lineSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive().multipleOf(0.001),
});

export const createOperationBody = z.object({
  type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL']),
  warehouseId: z.string().uuid(),
  contactId: z.string().uuid().optional().nullable(),
  sourceLocationId: z.string().uuid().optional().nullable(),
  destLocationId: z.string().uuid().optional().nullable(),
  scheduledDate: z.coerce.date().optional(),
  responsibleId: z.string().uuid().optional().nullable(),
  deliveryAddress: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  lines: z.array(lineSchema).min(1),
});

export const updateOperationBody = z.object({
  contactId: z.string().uuid().optional().nullable(),
  sourceLocationId: z.string().uuid().optional().nullable(),
  destLocationId: z.string().uuid().optional().nullable(),
  scheduledDate: z.coerce.date().optional(),
  deliveryAddress: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  lines: z.array(lineSchema).min(1).optional(),
});

export const listOperationsQuery = z.object({
  type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL']).optional(),
  status: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  late: z.enum(['true', 'false']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  ...paginationQuery,
});

export const boardQuery = z.object({
  type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL']).optional(),
});

export const idParams = z.object({ id: z.string().uuid() });
