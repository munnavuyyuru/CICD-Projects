import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import taskRoutes from '../src/routes/tasks';
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
  app.use('/api/tasks', taskRoutes);
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err instanceof AppError) {
        res.status(err.status).json({ error: err.name, message: err.message, status: err.status });
        return;
      }
      console.error('[TEST_UNHANDLED]', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message || 'An unexpected error occurred', status: 500 });
    },
  );
  return app;
}

const VALID_TOKEN = 'valid-test-token';
const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PROJECT_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const TASK_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

function mockMemberRole(role: string | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: role ? { role } : null, error: null }),
        }),
      }),
    }),
  };
}

function mockActivityInsert() {
  return {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: USER_ID, email: 'test@example.com' } },
    error: null,
  });
});

describe('GET /api/tasks/project/:projectId', () => {
  it('lists tasks for a project', async () => {
    const fakeTasks = [
      { id: TASK_ID, project_id: PROJECT_ID, title: 'Task A', description: null, status: 'todo', priority: 2, assignee_id: null, due_date: null, position: 1, created_at: '2024-01-01T00:00:00Z' },
    ];
    mockFrom
      .mockReturnValueOnce(mockMemberRole('owner'))
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: fakeTasks, error: null }),
          }),
        }),
      });

    const res = await request(setupApp()).get(`/api/tasks/project/${PROJECT_ID}`).set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeTasks);
  });
});

describe('GET /api/tasks/:id', () => {
  it('returns a task when found', async () => {
    const fakeTask = { id: TASK_ID, project_id: PROJECT_ID, title: 'Task A', description: null, status: 'todo', priority: 2, assignee_id: null, due_date: null, position: 1, created_at: '2024-01-01T00:00:00Z' };
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: fakeTask, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce(mockMemberRole('owner'));

    const res = await request(setupApp()).get(`/api/tasks/${TASK_ID}`).set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeTask);
  });

  it('returns 404 when not found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const res = await request(setupApp()).get(`/api/tasks/${TASK_ID}`).set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/tasks', () => {
  it('creates a task', async () => {
    const newTask = { id: TASK_ID, project_id: PROJECT_ID, title: 'New Task', description: null, status: 'todo', priority: 2, assignee_id: null, due_date: null, position: 1, created_at: '2024-01-01T00:00:00Z' };
    mockFrom
      .mockReturnValueOnce(mockMemberRole('owner'))
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [{ position: 0 }], error: null }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newTask, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce(mockActivityInsert());

    const res = await request(setupApp())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ project_id: PROJECT_ID, title: 'New Task' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Task');
  });

  it('returns 400 for empty title', async () => {
    const res = await request(setupApp())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ project_id: PROJECT_ID, title: '' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid priority', async () => {
    const res = await request(setupApp())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ project_id: PROJECT_ID, title: 'Task', priority: 5 });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/tasks/:id', () => {
  it('updates a task', async () => {
    const existing = { id: TASK_ID, project_id: PROJECT_ID, title: 'Old', description: null, status: 'todo', priority: 2, assignee_id: null, due_date: null, position: 1, created_at: '2024-01-01T00:00:00Z' };
    const updated = { ...existing, title: 'Updated', status: 'in_progress' };
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: existing, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce(mockMemberRole('owner'))
      .mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updated, error: null }),
            }),
          }),
        }),
      });

    const res = await request(setupApp())
      .patch(`/api/tasks/${TASK_ID}`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ title: 'Updated', status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
    expect(res.body.status).toBe('in_progress');
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(setupApp())
      .patch(`/api/tasks/${TASK_ID}`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ status: 'invalid' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task', async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { project_id: PROJECT_ID }, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce(mockMemberRole('owner'))
      .mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

    const res = await request(setupApp()).delete(`/api/tasks/${TASK_ID}`).set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(204);
  });

  it('returns 404 when not found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const res = await request(setupApp()).delete(`/api/tasks/${TASK_ID}`).set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(404);
  });
});
