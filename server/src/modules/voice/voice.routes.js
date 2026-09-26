import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { CAN, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as c from './voice.controller.js';
import * as s from './voice.schema.js';

export const voiceRouter = Router();

voiceRouter.use(requireAuth);

// Parse only — never writes. Creating the operation goes through POST /api/operations.
voiceRouter.post('/parse', requireRole(CAN.OPERATE), validate({ body: s.parseBody }), c.parse);
