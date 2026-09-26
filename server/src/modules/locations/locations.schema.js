import { z } from 'zod';

const SHORT_CODE_REGEX = /^[A-Z0-9_-]+$/;

export const listLocationsSchema = {
  query: z.object({
    warehouseId: z.string().uuid().optional(),
    type: z.enum(['INTERNAL', 'VENDOR', 'CUSTOMER', 'ADJUSTMENT']).optional(),
    search: z.string().trim().optional(),
    includeInactive: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => val === 'true'),
  }),
};

export const createLocationSchema = {
  body: z.object({
    name: z.string().trim().min(1, 'Location name is required').max(100),
    shortCode: z
      .string()
      .trim()
      .min(1, 'Short code is required')
      .max(20)
      .transform((v) => v.toUpperCase())
      .refine((v) => SHORT_CODE_REGEX.test(v), {
        message: 'Short code may only contain uppercase letters, numbers, hyphens, and underscores',
      }),
    type: z.enum(['INTERNAL', 'VENDOR', 'CUSTOMER', 'ADJUSTMENT']).default('INTERNAL'),
    warehouseId: z.string().uuid('Invalid warehouse ID').optional().nullable(),
    capacity: z.coerce
      .number()
      .positive('Capacity must be greater than 0')
      .max(99999999999, 'Capacity is too large')
      .optional()
      .nullable(),
  }),
};

export const updateLocationSchema = {
  params: z.object({
    id: z.string().uuid('Invalid location ID'),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    shortCode: z
      .string()
      .trim()
      .min(1)
      .max(20)
      .transform((v) => v.toUpperCase())
      .refine((v) => SHORT_CODE_REGEX.test(v), {
        message: 'Short code may only contain uppercase letters, numbers, hyphens, and underscores',
      })
      .optional(),
    type: z.enum(['INTERNAL', 'VENDOR', 'CUSTOMER', 'ADJUSTMENT']).optional(),
    isActive: z.boolean().optional(),
    capacity: z.coerce
      .number()
      .positive('Capacity must be greater than 0')
      .max(99999999999, 'Capacity is too large')
      .optional()
      .nullable(),
  }),
};

export const locationIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid location ID'),
  }),
};
