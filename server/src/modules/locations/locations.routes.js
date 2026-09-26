import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole, CAN } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as schema from './locations.schema.js';
import * as controller from './locations.controller.js';

export const locationsRouter = Router();

locationsRouter.use(requireAuth);

locationsRouter.get(
  '/',
  requireRole(...CAN.VIEW),
  validate(schema.listLocationsSchema),
  controller.list
);

locationsRouter.post(
  '/',
  requireRole(...CAN.MANAGE_MASTER_DATA),
  validate(schema.createLocationSchema),
  controller.create
);

locationsRouter.get(
  '/:id',
  requireRole(...CAN.VIEW),
  validate(schema.locationIdParamSchema),
  controller.getById
);

locationsRouter.patch(
  '/:id',
  requireRole(...CAN.MANAGE_MASTER_DATA),
  validate(schema.updateLocationSchema),
  controller.update
);

locationsRouter.delete(
  '/:id',
  requireRole(...CAN.DELETE),
  validate(schema.locationIdParamSchema),
  controller.remove
);
