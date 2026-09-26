import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const reorderRulesRouter = Router();

reorderRulesRouter.use(requireAuth);

const stub = (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Reorder rules module is scheduled for implementation by Member 3',
    },
  });
};

reorderRulesRouter.use(stub);
