import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as c from './search.controller.js';

export const searchRouter = Router();

searchRouter.use(requireAuth);

searchRouter.get('/', c.search);
