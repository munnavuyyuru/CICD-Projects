import express from 'express';
import cors from 'cors';
import { AppError } from './middleware/errors';
import type { HealthResponse } from '@taskflow/shared';
import profileRoutes from './routes/profiles';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/profiles', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/health', (_req, res) => {
  const body: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
  res.json(body);
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err instanceof AppError) {
      res.status(err.status).json({
        error: err.name,
        message: err.message,
        status: err.status,
      });
      return;
    }

    console.error('[UNHANDLED]', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
      status: 500,
    });
  },
);

export default app;