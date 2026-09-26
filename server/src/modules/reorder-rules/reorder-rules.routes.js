import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { CAN, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as c from './reorder-rules.controller.js';
import * as s from './reorder-rules.schema.js';

export const reorderRulesRouter = Router();

reorderRulesRouter.use(requireAuth);

reorderRulesRouter.get('/', validate({ query: s.listReorderRulesQuery }), c.list);
reorderRulesRouter.get('/:id', validate({ params: s.idParams }), c.get);
reorderRulesRouter.post('/', requireRole(...CAN.OPERATE), validate({ body: s.createReorderRuleBody }), c.create);
reorderRulesRouter.patch('/:id', requireRole(...CAN.OPERATE), validate({ params: s.idParams, body: s.updateReorderRuleBody }), c.update);
reorderRulesRouter.delete('/:id', requireRole(...CAN.DELETE), validate({ params: s.idParams }), c.remove);
