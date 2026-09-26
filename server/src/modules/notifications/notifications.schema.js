import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination.js';

export const listNotificationsQuery = z.object({
  ...paginationQuery,
});

export const idParams = z.object({ id: z.string().uuid() });
