import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { logActivity } from '../../lib/activity.js';
import { sendMail } from '../../lib/mailer.js';
import { ConflictError, UnauthorizedError, ValidationError } from '../../lib/errors.js';
import { publicUserSelect } from '../../middleware/auth.js';

const BCRYPT_ROUNDS = 12;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const RESET_TOKEN_TTL = '10m';
export const INVALID_LOGIN_MESSAGE = 'Invalid Login Id or Password';
export const FORGOT_PASSWORD_MESSAGE = 'If an account exists for that email, a 6-digit code has been sent.';

// Used to keep login timing similar whether or not the user exists.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

/** Throw a field-level 409 if loginId or email is taken (nicer than a raw P2002). */
async function assertUnique({ loginId, email }, excludeUserId) {
  const or = [];
  if (loginId) or.push({ loginId: { equals: loginId, mode: 'insensitive' } });
  if (email) or.push({ email });
  if (!or.length) return;
  const existing = await prisma.user.findFirst({
    where: { OR: or, ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
    select: { loginId: true, email: true },
  });
  if (!existing) return;
  if (loginId && existing.loginId.toLowerCase() === loginId.toLowerCase()) {
    throw new ConflictError('This Login ID is already taken', [{ path: 'loginId', message: 'This Login ID is already taken' }]);
  }
  throw new ConflictError('This email is already registered', [{ path: 'email', message: 'This email is already registered' }]);
}

/** Register a new user. Always STAFF — admins are created by the seed or promoted by an admin. */
export async function register({ name, loginId, email, password }) {
  await assertUnique({ loginId, email });
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: name || loginId, loginId, email, passwordHash, role: 'STAFF', lastLoginAt: new Date() },
    select: publicUserSelect,
  });
  await logActivity(prisma, { userId: user.id, action: 'user.register', entityType: 'User', entityId: user.id });
  return user;
}

/** Log in with a Login ID or email. Generic error message on any failure. */
export async function login({ loginId, password }) {
  const identifier = loginId.trim();
  const user = await prisma.user.findFirst({
    where: identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { loginId: { equals: identifier, mode: 'insensitive' } },
  });

  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw new UnauthorizedError(INVALID_LOGIN_MESSAGE);
  if (!user.isActive) throw new UnauthorizedError('Your account has been deactivated. Contact an administrator.');

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
    select: publicUserSelect,
  });
  await logActivity(prisma, { userId: user.id, action: 'user.login', entityType: 'User', entityId: user.id });
  return updated;
}

export async function getMe(userId) {
  return prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
}

export async function updateMe(userId, { name, email }) {
  if (email) await assertUnique({ email }, userId);
  const user = await prisma.user.update({ where: { id: userId }, data: { name, email }, select: publicUserSelect });
  await logActivity(prisma, { userId, action: 'user.update_profile', entityType: 'User', entityId: userId, metadata: { name, email } });
  return user;
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = user && (await bcrypt.compare(currentPassword, user.passwordHash));
  if (!valid) {
    throw new ValidationError('Current password is incorrect', [{ path: 'currentPassword', message: 'Current password is incorrect' }]);
  }
  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    throw new ValidationError('New password must be different', [{ path: 'newPassword', message: 'New password must be different from the current one' }]);
  }
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) } });
  await logActivity(prisma, { userId, action: 'user.change_password', entityType: 'User', entityId: userId });
}

/**
 * Start the OTP reset flow. Always resolves (no user enumeration).
 * Invalidates earlier codes, stores a bcrypt hash of a new 6-digit code (10 min, 5 attempts).
 */
export async function forgotPassword({ email }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return;

  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await prisma.$transaction([
    prisma.passwordResetOtp.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.passwordResetOtp.create({
      data: { userId: user.id, otpHash: await bcrypt.hash(otp, 10), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
    }),
  ]);

  await sendMail({
    to: user.email,
    subject: 'Your StockSense password reset code',
    text: `Hi ${user.name},\n\nYour password reset code is: ${otp}\nIt expires in 10 minutes. If you did not request this, ignore this email.`,
  });
  await logActivity(prisma, { userId: user.id, action: 'user.forgot_password', entityType: 'User', entityId: user.id });
}

const INVALID_OTP = () => new ValidationError('Invalid or expired code', [{ path: 'otp', message: 'Invalid or expired code' }]);

/** Verify a code and return a short-lived reset token (10 min, single use). */
export async function verifyOtp({ email, otp }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw INVALID_OTP();

  const record = await prisma.passwordResetOtp.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw INVALID_OTP();
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    throw new ValidationError('Too many attempts. Request a new code.', [{ path: 'otp', message: 'Too many attempts. Request a new code.' }]);
  }

  if (!(await bcrypt.compare(otp, record.otpHash))) {
    await prisma.passwordResetOtp.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    throw INVALID_OTP();
  }

  const resetToken = jwt.sign({ sub: user.id, otpId: record.id, purpose: 'password-reset' }, env.JWT_SECRET, {
    expiresIn: RESET_TOKEN_TTL,
  });
  return { resetToken };
}

/** Set a new password with a reset token from verifyOtp. Consumes the OTP. */
export async function resetPassword({ resetToken, password }) {
  let payload;
  try {
    payload = jwt.verify(resetToken, env.JWT_SECRET);
  } catch {
    throw new ValidationError('Reset link expired. Start again.', [{ path: 'resetToken', message: 'Reset link expired' }]);
  }
  if (payload.purpose !== 'password-reset') throw new ValidationError('Invalid reset token');

  const record = await prisma.passwordResetOtp.findUnique({ where: { id: payload.otpId } });
  if (!record || record.usedAt || record.userId !== payload.sub) {
    throw new ValidationError('This reset code was already used. Start again.');
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: payload.sub }, data: { passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) } }),
    prisma.passwordResetOtp.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await logActivity(prisma, { userId: payload.sub, action: 'user.reset_password', entityType: 'User', entityId: payload.sub });
}
