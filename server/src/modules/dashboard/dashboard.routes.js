import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as c from './dashboard.controller.js';
import * as s from './dashboard.schema.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/summary', validate({ query: s.filterQuery }), c.summary);
dashboardRouter.get('/operation-cards', validate({ query: s.filterQuery }), c.operationCards);
dashboardRouter.get('/trends', validate({ query: s.filterQuery }), c.trends);
dashboardRouter.get('/top-products', validate({ query: s.filterQuery }), c.topProducts);
