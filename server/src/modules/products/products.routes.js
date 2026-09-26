import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const productsRouter = Router();

productsRouter.use(requireAuth);

const stub = (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Products module is scheduled for implementation by Member 3',
    },
  });
};

productsRouter.use(stub);
