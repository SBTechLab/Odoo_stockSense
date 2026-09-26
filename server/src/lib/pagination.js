import { z } from 'zod';

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/** Zod fields shared by every list endpoint. Spread into a query schema. */
export const paginationQuery = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),
  sort: z.string().max(40).optional(),
};

/**
 * Parse page/limit/sort from a (validated) query object.
 * sort format: "field" (asc) or "-field" (desc). Unknown fields fall back to `defaultSort`.
 *
 * @param {{ page?: number|string, limit?: number|string, sort?: string }} query
 * @param {{ allowedSort?: string[], defaultSort?: string }} [opts]
 * @returns {{ page: number, limit: number, skip: number, take: number, orderBy: object }}
 */
export function parsePagination(query = {}, { allowedSort = ['createdAt'], defaultSort = '-createdAt' } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || DEFAULT_LIMIT));

  let sort = typeof query.sort === 'string' && query.sort ? query.sort : defaultSort;
  if (!allowedSort.includes(sort.replace(/^-/, ''))) sort = defaultSort;
  const field = sort.replace(/^-/, '');
  const orderBy = { [field]: sort.startsWith('-') ? 'desc' : 'asc' };

  return { page, limit, skip: (page - 1) * limit, take: limit, orderBy };
}

/**
 * Build the meta object returned alongside paginated lists.
 * @param {{ page: number, limit: number }} pagination
 * @param {number} total
 * @returns {{ page: number, limit: number, total: number, totalPages: number }}
 */
export function buildMeta({ page, limit }, total) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
