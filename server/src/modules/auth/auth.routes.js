import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter, otpLimiter } from '../../middleware/rateLimit.js';
import * as c from './auth.controller.js';
import * as s from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: s.registerBody }), c.register);
authRouter.post('/login', authLimiter, validate({ body: s.loginBody }), c.login);
authRouter.post('/logout', c.logout);

authRouter.get('/me', requireAuth, c.me);
authRouter.patch('/me', requireAuth, validate({ body: s.updateMeBody }), c.updateMe);
authRouter.patch('/me/password', requireAuth, validate({ body: s.changePasswordBody }), c.changePassword);

authRouter.post('/forgot-password', otpLimiter, validate({ body: s.forgotPasswordBody }), c.forgotPassword);
authRouter.post('/verify-otp', otpLimiter, validate({ body: s.verifyOtpBody }), c.verifyOtp);
authRouter.post('/reset-password', otpLimiter, validate({ body: s.resetPasswordBody }), c.resetPassword);
