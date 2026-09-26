import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const adjustmentsRouter = Router();

adjustmentsRouter.use(requireAuth);

const stub = (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Adjustments module is scheduled for implementation by Member 2',
    },
  });
};

adjustmentsRouter.use(stub);
