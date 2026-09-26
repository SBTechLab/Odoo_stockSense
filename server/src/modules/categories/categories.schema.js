import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination.js';

const optionalStr = (schema) =>
  schema.optional().or(z.literal('')).transform((v) => v || null);

export const createCategoryBody = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  description: optionalStr(z.string().trim().max(500)),
});

export const updateCategoryBody = createCategoryBody.partial();

export const listCategoriesQuery = z.object({
  search: z.string().max(100).optional(),
  ...paginationQuery,
});

export const idParams = z.object({ id: z.string().uuid() });
