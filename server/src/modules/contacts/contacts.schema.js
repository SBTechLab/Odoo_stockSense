import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination.js';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PHONE_RE = /^[6-9]\d{9}$/;

const optionalStr = (schema) =>
  schema.optional().or(z.literal('')).transform((v) => v || null);

export const createContactBody = z.object({
  name: z.string().trim().min(2).max(100),
  type: z.enum(['VENDOR', 'CUSTOMER', 'BOTH']),
  email: optionalStr(z.string().trim().email()),
  phone: optionalStr(z.string().trim().regex(PHONE_RE, 'Must be a 10-digit Indian phone number')),
  address: optionalStr(z.string().trim().max(500)),
  gstin: optionalStr(z.string().trim().toUpperCase().regex(GSTIN_RE, 'Invalid GSTIN format')),
});

export const updateContactBody = createContactBody.partial();

export const listContactsQuery = z.object({
  type: z.enum(['VENDOR', 'CUSTOMER', 'BOTH']).optional(),
  search: z.string().max(100).optional(),
  ...paginationQuery,
});

export const idParams = z.object({ id: z.string().uuid() });
