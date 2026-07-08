import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errors';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../services/taskService';
import type { AuthRequest } from '../types';

const router = Router();

const CreateTaskSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  priority: z.number().int().min(1).max(3).optional(),
  assignee_id: z.string().uuid().optional(),
  due_date: z.string().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.number().int().min(1).max(3).optional(),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  position: z.number().optional(),
});

router.get('/project/:projectId', requireAuth, async (req, res, next) => {
  try {
    const tasks = await getTasks(req.params.projectId, (req as AuthRequest).user.id);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const task = await getTask(req.params.id, (req as AuthRequest).user.id);
    if (!task) return next(new AppError(404, 'Task not found'));
    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const parsed = CreateTaskSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));

    const task = await createTask((req as AuthRequest).user.id, parsed.data);
    if (!task) return next(new AppError(404, 'Project not found or not authorized'));
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const parsed = UpdateTaskSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));

    const task = await updateTask(req.params.id, (req as AuthRequest).user.id, parsed.data);
    if (!task) return next(new AppError(404, 'Task not found or not authorized'));
    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await deleteTask(req.params.id, (req as AuthRequest).user.id);
    if (!deleted) return next(new AppError(404, 'Task not found or not authorized'));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
