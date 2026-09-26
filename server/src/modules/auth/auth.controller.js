import { ok } from '../../lib/serialize.js';
import { AUTH_COOKIE, authCookieOptions, signToken } from '../../middleware/auth.js';
import * as service from './auth.service.js';

const setSession = (res, user) => res.cookie(AUTH_COOKIE, signToken(user), authCookieOptions);

/** Request metadata used in security emails. */
const ctx = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') });

export async function register(req, res) {
  const user = await service.register(req.valid.body);
  setSession(res, user);
  ok(res, { user }, { status: 201 });
}

export async function login(req, res) {
  const user = await service.login(req.valid.body, ctx(req));
  setSession(res, user);
  ok(res, { user });
}

export async function logout(_req, res) {
  const { maxAge: _maxAge, ...opts } = authCookieOptions;
  res.clearCookie(AUTH_COOKIE, opts);
  ok(res, { message: 'Logged out' });
}

export async function me(req, res) {
  ok(res, { user: await service.getMe(req.user.id) });
}

export async function updateMe(req, res) {
  ok(res, { user: await service.updateMe(req.user.id, req.valid.body, ctx(req)) });
}

export async function changePassword(req, res) {
  await service.changePassword(req.user.id, req.valid.body, ctx(req));
  ok(res, { message: 'Password updated' });
}

export async function forgotPassword(req, res) {
  await service.forgotPassword(req.valid.body);
  ok(res, { message: service.FORGOT_PASSWORD_MESSAGE });
}

export async function verifyOtp(req, res) {
  ok(res, await service.verifyOtp(req.valid.body));
}

export async function resetPassword(req, res) {
  await service.resetPassword(req.valid.body, ctx(req));
  ok(res, { message: 'Password reset. You can now log in.' });
}
