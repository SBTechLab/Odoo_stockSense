import { z } from 'zod';

/*
 * Rules from the mockup (must match client/src/pages/auth validation exactly):
 *  - Login ID: unique, 6–12 characters.
 *  - Email: unique, valid.
 *  - Password: MORE than 8 characters, with a lowercase letter, an uppercase letter and a special character.
 *  - Re-entered password must match.
 */

export const loginIdField = z
  .string({ error: 'Login ID is required' })
  .trim()
  .min(6, 'Login ID must be 6–12 characters')
  .max(12, 'Login ID must be 6–12 characters')
  .regex(/^[A-Za-z0-9._-]+$/, 'Login ID may only contain letters, numbers, dot, dash and underscore');

export const emailField = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'));

export const passwordField = z
  .string({ error: 'Password is required' })
  .min(9, 'Password must be longer than 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

const nameField = z.string().trim().min(2, 'Name must be at least 2 characters').max(80);

const withConfirm = (shape, field = 'password') =>
  z.object(shape).refine((d) => d[field] === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const registerBody = withConfirm({
  name: nameField.optional(),
  loginId: loginIdField,
  email: emailField,
  password: passwordField,
  confirmPassword: z.string({ error: 'Please re-enter the password' }),
});

export const loginBody = z.object({
  // Accepts a Login ID or an email address.
  loginId: z.string({ error: 'Login ID is required' }).trim().min(1, 'Login ID is required').max(254),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required').max(128),
});

export const updateMeBody = z
  .object({ name: nameField.optional(), email: emailField.optional() })
  .refine((d) => d.name !== undefined || d.email !== undefined, { message: 'Nothing to update' });

export const changePasswordBody = withConfirm(
  {
    currentPassword: z.string({ error: 'Current password is required' }).min(1, 'Current password is required'),
    newPassword: passwordField,
    confirmPassword: z.string({ error: 'Please re-enter the password' }),
  },
  'newPassword',
);

export const forgotPasswordBody = z.object({ email: emailField });

export const verifyOtpBody = z.object({
  email: emailField,
  otp: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export const resetPasswordBody = withConfirm({
  resetToken: z.string().min(1, 'Reset token is required'),
  password: passwordField,
  confirmPassword: z.string({ error: 'Please re-enter the password' }),
});
