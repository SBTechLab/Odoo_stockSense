import { z } from 'zod';

export const idParams = z.object({
  id: z.string().uuid('Invalid contact ID'),
});

const emptyToNull = (val) => (val === '' ? null : val);

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.string().email('Invalid email address'))
  .optional()
  .nullable()
  .or(z.literal('').transform(emptyToNull));

const phoneField = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Phone must be a 10-digit Indian number starting with 6-9')
  .optional()
  .nullable()
  .or(z.literal('').transform(emptyToNull));

const gstinField = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format (e.g. 24ABCDE1234F1Z5)')
  .optional()
  .nullable()
  .or(z.literal('').transform(emptyToNull));

export const listContactsQuery = z.object({
  type: z.enum(['VENDOR', 'CUSTOMER', 'BOTH']).optional(),
  search: z.string().trim().max(100).optional(),
  includeInactive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const createContactBody = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  type: z.enum(['VENDOR', 'CUSTOMER', 'BOTH']).default('BOTH'),
  email: emailField,
  phone: phoneField,
  address: z.string().trim().max(500, 'Address cannot exceed 500 characters').optional().nullable().or(z.literal('').transform(emptyToNull)),
  gstin: gstinField,
});

export const updateContactBody = createContactBody.partial().extend({
  isActive: z.boolean().optional(),
});
