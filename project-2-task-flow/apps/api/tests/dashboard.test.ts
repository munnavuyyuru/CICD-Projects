import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import dashboardRoutes from '../src/routes/dashboard';
import { AppError } from '../src/middleware/errors';

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  },
}));

function setupApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/dashboard', dashboardRoutes);
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err instanceof AppError) {
        res.status(err.status).json({ error: err.name, message: err.message, status: err.status });
        return;
      }
      res.status(500).json({ error: 'InternalServerError', message: err.message || 'An unexpected error occurred', status: 500 });
    },
  );
  return app;
}

const VALID_TOKEN = 'valid-test-token';
const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PROJECT_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: USER_ID, email: 'test@example.com' } },
    error: null,
  });
});

describe('GET /api/dashboard', () => {
  it('returns stats and activity for a user with projects', async () => {
    const mockProjectsQuery = {
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({ data: [{ id: PROJECT_ID }], error: null }),
      }),
    };

    const mockTasksQuery = {
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [
            { id: 'task-1', status: 'done' },
            { id: 'task-2', status: 'in_progress' },
            { id: 'task-3', status: 'todo' },
          ],
          error: null,
        }),
      }),
    };

    const mockActivityQuery = {
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'evt-1',
                  project_id: PROJECT_ID,
                  actor_id: USER_ID,
                  action: 'created',
                  entity_type: 'task',
                  entity_id: 'task-1',
                  metadata: null,
                  created_at: '2024-01-03T00:00:00Z',
                  profiles: { display_name: 'TestUser' },
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    };

    mockFrom
      .mockReturnValueOnce(mockProjectsQuery)
      .mockReturnValueOnce(mockTasksQuery)
      .mockReturnValueOnce(mockActivityQuery);

    const res = await request(setupApp())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.stats).toEqual({
      projectCount: 1,
      taskCount: 3,
      completedCount: 1,
    });
    expect(res.body.recentActivity).toHaveLength(1);
    expect(res.body.recentActivity[0]).toMatchObject({
      action: 'created',
      entity_type: 'task',
      display_name: 'TestUser',
    });
  });

  it('returns zero stats when user has no projects', async () => {
    const mockProjectsQuery = {
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };

    mockFrom.mockReturnValueOnce(mockProjectsQuery);

    const res = await request(setupApp())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.stats).toEqual({
      projectCount: 0,
      taskCount: 0,
      completedCount: 0,
    });
    expect(res.body.recentActivity).toEqual([]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Unauthorized') });

    const res = await request(setupApp())
      .get('/api/dashboard')
      .set('Authorization', 'Bearer invalid');

    expect(res.status).toBe(401);
  });

  it('returns empty activity when there are no events', async () => {
    const mockProjectsQuery = {
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({ data: [{ id: PROJECT_ID }], error: null }),
      }),
    };

    const mockTasksQuery = {
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };

    const mockActivityQuery = {
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    };

    mockFrom
      .mockReturnValueOnce(mockProjectsQuery)
      .mockReturnValueOnce(mockTasksQuery)
      .mockReturnValueOnce(mockActivityQuery);

    const res = await request(setupApp())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.stats).toEqual({
      projectCount: 1,
      taskCount: 0,
      completedCount: 0,
    });
    expect(res.body.recentActivity).toEqual([]);
  });
});
