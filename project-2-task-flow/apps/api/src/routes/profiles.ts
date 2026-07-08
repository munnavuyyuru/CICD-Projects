import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errors';
import { getProfile, updateProfile } from '../services/profileService';
import type { AuthRequest } from '../types';

const router = Router();

const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const profile = await getProfile((req as AuthRequest).user.id);
    if (!profile) {
      return next(new AppError(404, 'Profile not found'));
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(400, parsed.error.errors[0].message));
    }

    const profile = await updateProfile((req as AuthRequest).user.id, parsed.data);
    if (!profile) {
      return next(new AppError(404, 'Profile not found'));
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

export default router;
