import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const stockRouter = Router();

stockRouter.use(requireAuth);

const stub = (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Stock overview module is scheduled for implementation by Member 3',
    },
  });
};

stockRouter.use(stub);
