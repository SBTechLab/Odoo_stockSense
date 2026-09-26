import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as c from './notifications.controller.js';
import * as s from './notifications.schema.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', validate({ query: s.listNotificationsQuery }), c.list);
notificationsRouter.patch('/:id/read', validate({ params: s.idParams }), c.markAsRead);
notificationsRouter.post('/read-all', c.markAllAsRead);
