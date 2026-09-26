import { z } from 'zod';

export const listActivitySchema = {
  query: z.object({
    userId: z.string().uuid().optional(),
    entityType: z.string().trim().optional(),
    dateFrom: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
    dateTo: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(25),
  }),
};
