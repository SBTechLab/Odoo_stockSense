import { z } from 'zod';

const optionalStr = (schema) =>
  schema.optional().or(z.literal('')).transform((v) => v || null);

export const filterQuery = z.object({
  warehouseId: optionalStr(z.string().uuid()),
  locationId: optionalStr(z.string().uuid()),
  categoryId: optionalStr(z.string().uuid()),
  type: optionalStr(z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL', 'ADJUSTMENT'])),
  status: optionalStr(z.enum(['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'])),
  days: z.coerce.number().min(1).max(365).optional().default(30),
});
