import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getDashboard } from '../services/dashboardService';
import type { AuthRequest } from '../types';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const data = await getDashboard((req as AuthRequest).user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
