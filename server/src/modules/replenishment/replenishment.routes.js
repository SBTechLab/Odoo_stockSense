import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const replenishmentRouter = Router();

replenishmentRouter.use(requireAuth);

const stub = (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Replenishment suggestions module is scheduled for implementation by Member 3',
    },
  });
};

replenishmentRouter.use(stub);
