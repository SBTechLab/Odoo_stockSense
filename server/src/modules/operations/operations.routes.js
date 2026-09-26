import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { CAN, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as c from './operations.controller.js';
import * as s from './operations.schema.js';

export const operationsRouter = Router();

operationsRouter.use(requireAuth);

operationsRouter.get('/board', validate({ query: s.boardQuery }), c.board);
operationsRouter.get('/', validate({ query: s.listOperationsQuery }), c.list);
operationsRouter.get('/:id', validate({ params: s.idParams }), c.get);

operationsRouter.post('/', requireRole(...CAN.OPERATE), validate({ body: s.createOperationBody }), c.create);
operationsRouter.patch('/:id', requireRole(...CAN.OPERATE), validate({ params: s.idParams, body: s.updateOperationBody }), c.update);
operationsRouter.delete('/:id', requireRole(...CAN.DELETE), validate({ params: s.idParams }), c.remove);

operationsRouter.post('/:id/confirm', requireRole(...CAN.OPERATE), validate({ params: s.idParams }), c.confirm);
operationsRouter.post('/:id/check-availability', requireRole(...CAN.OPERATE), validate({ params: s.idParams }), c.checkAvailability);
operationsRouter.post('/:id/validate', requireRole(...CAN.OPERATE), validate({ params: s.idParams }), c.validate);
operationsRouter.post('/:id/cancel', requireRole(...CAN.CANCEL_OPERATION), validate({ params: s.idParams }), c.cancel);
