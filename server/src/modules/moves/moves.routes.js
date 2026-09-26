import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const movesRouter = Router();

movesRouter.use(requireAuth);

const stub = (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Moves history ledger module is scheduled for implementation by Member 3',
    },
  });
};

movesRouter.use(stub);
