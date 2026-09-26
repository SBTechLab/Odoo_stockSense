import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { CAN, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as c from './products.controller.js';
import * as s from './products.schema.js';

export const productsRouter = Router();

productsRouter.use(requireAuth);

productsRouter.get('/export', c.exportCSV);
productsRouter.post('/bulk', requireRole(...CAN.OPERATE), c.bulkImport);

productsRouter.get('/', validate({ query: s.listProductsQuery }), c.list);
productsRouter.get('/:id', validate({ params: s.idParams }), c.get);
productsRouter.post('/', requireRole(...CAN.OPERATE), validate({ body: s.createProductBody }), c.create);
productsRouter.patch('/:id', requireRole(...CAN.OPERATE), validate({ params: s.idParams, body: s.updateProductBody }), c.update);
productsRouter.delete('/:id', requireRole(...CAN.DELETE), validate({ params: s.idParams }), c.remove);

productsRouter.get('/:id/stock', validate({ params: s.idParams }), c.getStock);
productsRouter.get('/:id/moves', validate({ params: s.idParams }), c.getMoves);
