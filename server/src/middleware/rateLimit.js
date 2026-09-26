import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const handler = (_req, res) =>
  res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  });

/** Login / register: 20 requests per 15 minutes per IP (relaxed in development). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isDev ? 200 : 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler,
});

/** Forgot password / OTP: 5 requests per 15 minutes per IP (relaxed in development). */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isDev ? 50 : 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler,
});

/** General API limiter: 600 requests per minute per IP. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler,
});
