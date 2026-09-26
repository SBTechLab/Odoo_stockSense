import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole, CAN } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as schema from './activity.schema.js';
import * as controller from './activity.controller.js';

export const activityRouter = Router();

activityRouter.use(requireAuth);

activityRouter.get(
  '/',
  requireRole(...CAN.VIEW),
  validate(schema.listActivitySchema),
  controller.list
);
