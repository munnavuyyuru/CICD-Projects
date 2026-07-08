import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errors';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../services/projectService';
import type { AuthRequest } from '../types';

const router = Router();

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const projects = await getProjects((req as AuthRequest).user.id);
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const project = await getProject(req.params.id, (req as AuthRequest).user.id);
    if (!project) return next(new AppError(404, 'Project not found'));
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const parsed = CreateProjectSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));

    const project = await createProject((req as AuthRequest).user.id, parsed.data);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const parsed = UpdateProjectSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));

    const project = await updateProject(req.params.id, (req as AuthRequest).user.id, parsed.data);
    if (!project) return next(new AppError(404, 'Project not found or not authorized'));
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await deleteProject(req.params.id, (req as AuthRequest).user.id);
    if (!deleted) return next(new AppError(404, 'Project not found or not authorized'));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
