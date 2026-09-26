import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

const stub = (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Dashboard analytics module is scheduled for implementation by Member 3',
    },
  });
};

dashboardRouter.use(stub);
