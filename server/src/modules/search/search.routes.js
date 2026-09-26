import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const searchRouter = Router();

searchRouter.use(requireAuth);

const stub = (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Global search module is scheduled for implementation by Member 3',
    },
  });
};

searchRouter.use(stub);
