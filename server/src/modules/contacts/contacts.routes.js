import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { CAN, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as c from './contacts.controller.js';
import * as s from './contacts.schema.js';

export const contactsRouter = Router();

contactsRouter.use(requireAuth);

contactsRouter.get('/', validate({ query: s.listContactsQuery }), c.list);
contactsRouter.get('/:id', validate({ params: s.idParams }), c.get);
contactsRouter.post('/', validate({ body: s.createContactBody }), c.create);
contactsRouter.patch('/:id', validate({ params: s.idParams, body: s.updateContactBody }), c.update);
contactsRouter.delete('/:id', requireRole(...CAN.DELETE), validate({ params: s.idParams }), c.remove);
