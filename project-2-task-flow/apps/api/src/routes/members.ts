import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errors';
import {
  getMembers,
  addMember,
  updateMemberRole,
  removeMember,
} from '../services/memberService';
import type { AuthRequest } from '../types';

const router = Router();

const AddMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'member']).default('member'),
});

const UpdateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'member']),
});

router.get('/:projectId/members', requireAuth, async (req, res, next) => {
  try {
    const members = await getMembers(req.params.projectId, (req as AuthRequest).user.id);
    res.json(members);
  } catch (err) {
    next(err);
  }
});

router.post('/:projectId/members', requireAuth, async (req, res, next) => {
  try {
    const parsed = AddMemberSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));

    const result = await addMember(
      req.params.projectId,
      parsed.data.user_id,
      parsed.data.role,
      (req as AuthRequest).user.id,
    );

    if (!result.success) return next(new AppError(400, result.error!));
    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:projectId/members/:userId', requireAuth, async (req, res, next) => {
  try {
    const parsed = UpdateMemberRoleSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));

    const result = await updateMemberRole(
      req.params.projectId,
      req.params.userId,
      parsed.data.role,
      (req as AuthRequest).user.id,
    );

    if (!result.success) return next(new AppError(400, result.error!));
    res.json({ message: 'Role updated' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:projectId/members/:userId', requireAuth, async (req, res, next) => {
  try {
    const result = await removeMember(
      req.params.projectId,
      req.params.userId,
      (req as AuthRequest).user.id,
    );

    if (!result.success) return next(new AppError(400, result.error!));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
