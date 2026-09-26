import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { CAN, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as c from './users.controller.js';
import * as s from './users.schema.js';

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole(CAN.MANAGE_USERS));

usersRouter.get('/', validate({ query: s.listUsersQuery }), c.list);
usersRouter.patch('/:id', validate({ params: s.idParams, body: s.updateUserBody }), c.update);
