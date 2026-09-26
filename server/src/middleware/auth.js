import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { UnauthorizedError } from '../lib/errors.js';

export const AUTH_COOKIE = 'token';
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

/** Cookie options for the auth token (httpOnly, sameSite lax, secure in production). */
export const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProd,
  path: '/',
  maxAge: EIGHT_HOURS_MS,
};

/** Fields of User that are safe to expose (never passwordHash). */
export const publicUserSelect = {
  id: true,
  name: true,
  loginId: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
};

/**
 * Sign a JWT for a user.
 * @param {{ id: string, role: string }} user
 * @returns {string}
 */
export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

/**
 * Require a valid session. Reads the JWT from the httpOnly "token" cookie,
 * loads the user fresh from the DB (so role changes / deactivation apply
 * immediately) and sets `req.user`.
 */
export async function requireAuth(req, _res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) throw new UnauthorizedError();

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new UnauthorizedError('Session expired, please log in again');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: publicUserSelect });
  if (!user || !user.isActive) throw new UnauthorizedError('Account is inactive or no longer exists');

  req.user = user;
  next();
}
