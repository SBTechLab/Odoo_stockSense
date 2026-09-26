import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { CAN, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as c from './adjustments.controller.js';
import * as s from './adjustments.schema.js';

export const adjustmentsRouter = Router();

adjustmentsRouter.use(requireAuth);

adjustmentsRouter.get('/', validate({ query: s.listAdjustmentsQuery }), c.list);
adjustmentsRouter.get('/:id', validate({ params: s.idParams }), c.get);
adjustmentsRouter.post('/', requireRole(...CAN.OPERATE), validate({ body: s.createAdjustmentBody }), c.create);
