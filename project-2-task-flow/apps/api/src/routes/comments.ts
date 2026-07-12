import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errors';
import { getComments, createComment, deleteComment } from '../services/commentService';
import type { AuthRequest } from '../types';

const router = Router();

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

router.get('/tasks/:taskId/comments', requireAuth, async (req, res, next) => {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = typeof req.query.limit === 'string' ? Math.min(parseInt(req.query.limit, 10) || 20, 100) : 20;

    const result = await getComments(req.params.taskId, (req as AuthRequest).user.id, cursor, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/tasks/:taskId/comments', requireAuth, async (req, res, next) => {
  try {
    const parsed = CreateCommentSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));

    const comment = await createComment(req.params.taskId, (req as AuthRequest).user.id, parsed.data.content);
    if (!comment) return next(new AppError(404, 'Task not found or not authorized'));

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

router.delete('/comments/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await deleteComment(req.params.id, (req as AuthRequest).user.id);
    if (!deleted) return next(new AppError(404, 'Comment not found or not authorized'));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
