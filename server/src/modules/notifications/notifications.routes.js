import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

const stub = (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Notifications module is scheduled for implementation by Member 3',
    },
  });
};

notificationsRouter.use(stub);
