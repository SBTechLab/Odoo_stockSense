import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const operationsRouter = Router();

operationsRouter.use(requireAuth);

const stub = (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Operations module is scheduled for implementation by Member 2',
    },
  });
};

operationsRouter.use(stub);
