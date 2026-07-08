import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import projectRoutes from '../src/routes/projects';
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
  app.use('/api/projects', projectRoutes);
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err instanceof AppError) {
        res.status(err.status).json({ error: err.name, message: err.message, status: err.status });
        return;
      }
      res.status(500).json({ error: 'InternalServerError', message: 'An unexpected error occurred', status: 500 });
    },
  );
  return app;
}

const VALID_TOKEN = 'valid-test-token';
const USER_ID = 'test-user-id';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: USER_ID, email: 'test@example.com' } },
    error: null,
  });
});

describe('GET /api/projects', () => {
  it('lists all projects for the user', async () => {
    const fakeProjects = [
      { id: 'proj-1', owner_id: USER_ID, name: 'Project A', description: null, created_at: '2024-01-01T00:00:00Z' },
    ];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: fakeProjects, error: null }),
        }),
      }),
    });

    const res = await request(setupApp()).get('/api/projects').set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeProjects);
  });
});

describe('GET /api/projects/:id', () => {
  it('returns a project when found', async () => {
    const fakeProject = { id: 'proj-1', owner_id: USER_ID, name: 'Project A', description: null, created_at: '2024-01-01T00:00:00Z' };

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: fakeProject, error: null }),
          }),
        }),
      }),
    });

    const res = await request(setupApp()).get('/api/projects/proj-1').set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeProject);
  });

  it('returns 404 when not found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    const res = await request(setupApp()).get('/api/projects/proj-1').set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/projects', () => {
  it('creates a project', async () => {
    const newProject = { id: 'proj-1', owner_id: USER_ID, name: 'New Project', description: null, created_at: '2024-01-01T00:00:00Z' };
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: newProject, error: null }),
        }),
      }),
    });

    const res = await request(setupApp())
      .post('/api/projects')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ name: 'New Project' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New Project');
  });

  it('returns 400 for empty name', async () => {
    const res = await request(setupApp())
      .post('/api/projects')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for name exceeding 100 chars', async () => {
    const res = await request(setupApp())
      .post('/api/projects')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ name: 'x'.repeat(101) });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/projects/:id', () => {
  it('updates a project when owner', async () => {
    const updatedProject = { id: 'proj-1', owner_id: USER_ID, name: 'Updated', description: null, created_at: '2024-01-01T00:00:00Z' };

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { owner_id: USER_ID }, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedProject, error: null }),
            }),
          }),
        }),
      });

    const res = await request(setupApp())
      .patch('/api/projects/proj-1')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ name: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated');
  });

  it('returns 404 when not owner', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { owner_id: 'other-user' }, error: null }),
        }),
      }),
    });

    const res = await request(setupApp())
      .patch('/api/projects/proj-1')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ name: 'Updated' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/projects/:id', () => {
  it('deletes a project when owner', async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { owner_id: USER_ID }, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

    const res = await request(setupApp()).delete('/api/projects/proj-1').set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(204);
  });

  it('returns 404 when not owner', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { owner_id: 'other-user' }, error: null }),
        }),
      }),
    });

    const res = await request(setupApp()).delete('/api/projects/proj-1').set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(404);
  });
});
