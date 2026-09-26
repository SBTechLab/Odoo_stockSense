import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { CAN, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as c from './categories.controller.js';
import * as s from './categories.schema.js';

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get('/', validate({ query: s.listCategoriesQuery }), c.list);
categoriesRouter.get('/:id', validate({ params: s.idParams }), c.get);
categoriesRouter.post('/', requireRole(...CAN.OPERATE), validate({ body: s.createCategoryBody }), c.create);
categoriesRouter.patch('/:id', requireRole(...CAN.OPERATE), validate({ params: s.idParams, body: s.updateCategoryBody }), c.update);
categoriesRouter.delete('/:id', requireRole(...CAN.DELETE), validate({ params: s.idParams }), c.remove);
