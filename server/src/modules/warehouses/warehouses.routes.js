import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { CAN, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as c from './warehouses.controller.js';
import * as s from './warehouses.schema.js';

export const warehousesRouter = Router();

warehousesRouter.use(requireAuth);

warehousesRouter.get('/', validate({ query: s.listWarehousesQuery }), c.list);
warehousesRouter.get('/:id', validate({ params: s.idParams }), c.get);
warehousesRouter.post('/', requireRole(CAN.MANAGE_MASTER_DATA), validate({ body: s.createWarehouseBody }), c.create);
warehousesRouter.patch('/:id', requireRole(CAN.MANAGE_MASTER_DATA), validate({ params: s.idParams, body: s.updateWarehouseBody }), c.update);
warehousesRouter.delete('/:id', requireRole(CAN.DELETE), validate({ params: s.idParams }), c.remove);
