import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as c from './replenishment.controller.js';

export const replenishmentRouter = Router();

replenishmentRouter.use(requireAuth);

replenishmentRouter.get('/', c.list);
