import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

const stub = (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Categories module is scheduled for implementation by Member 3',
    },
  });
};

categoriesRouter.use(stub);
