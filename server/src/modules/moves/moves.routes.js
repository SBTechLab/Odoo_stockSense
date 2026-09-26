import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as c from './moves.controller.js';
import * as s from './moves.schema.js';

export const movesRouter = Router();

movesRouter.use(requireAuth);

movesRouter.get('/export', c.exportCSV);
movesRouter.get('/board', validate({ query: s.listMovesQuery }), c.getBoard);
movesRouter.get('/', validate({ query: s.listMovesQuery }), c.list);
