import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination.js';

export const idParams = z.object({ id: z.uuid('Invalid id') });

export const listUsersQuery = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).optional(),
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  ...paginationQuery,
});

export const updateUserBody = z
  .object({
    role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.role !== undefined || d.isActive !== undefined, { message: 'Nothing to update' });
