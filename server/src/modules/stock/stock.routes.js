import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as c from './stock.controller.js';
import * as s from './stock.schema.js';

export const stockRouter = Router();

stockRouter.use(requireAuth);

stockRouter.get('/export', c.exportCSV);
stockRouter.get('/', validate({ query: s.listStockQuery }), c.list);
