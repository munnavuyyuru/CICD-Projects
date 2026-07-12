import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import commentRoutes from '../src/routes/comments';
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
  app.use('/api', commentRoutes);
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

function mockTaskQuery(projectId: string | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: projectId ? { project_id: projectId } : null, error: null }),
      }),
    }),
  };
}

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

const VALID_TOKEN = 'valid-test-token';
const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PROJECT_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const TASK_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const COMMENT_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const OTHER_USER_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: USER_ID, email: 'test@example.com' } },
    error: null,
  });
});

describe('GET /api/tasks/:taskId/comments', () => {
  it('lists comments with pagination', async () => {
    const fakeComments = [
      { id: COMMENT_ID, task_id: TASK_ID, author_id: USER_ID, content: 'Hello', created_at: '2024-01-03T00:00:00Z' },
    ];

    mockFrom
      .mockReturnValueOnce(mockTaskQuery(PROJECT_ID))
      .mockReturnValueOnce(mockMemberRole('member'))
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: fakeComments.map((c) => ({
                  ...c,
                  profiles: { display_name: 'Test User' },
                })),
                error: null,
              }),
            }),
          }),
        }),
      });

    const res = await request(setupApp())
      .get(`/api/tasks/${TASK_ID}/comments`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].display_name).toBe('Test User');
    expect(res.body.has_more).toBe(false);
    expect(res.body.cursor).toBeNull();
  });

  it('returns empty when task not found', async () => {
    mockFrom.mockReturnValue(mockTaskQuery(null));

    const res = await request(setupApp())
      .get(`/api/tasks/${TASK_ID}/comments`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns empty when user is not a member', async () => {
    mockFrom
      .mockReturnValueOnce(mockTaskQuery(PROJECT_ID))
      .mockReturnValueOnce(mockMemberRole(null));

    const res = await request(setupApp())
      .get(`/api/tasks/${TASK_ID}/comments`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/tasks/:taskId/comments', () => {
  it('creates a comment', async () => {
    const newComment = { id: COMMENT_ID, task_id: TASK_ID, author_id: USER_ID, content: 'New comment', created_at: '2024-01-01T00:00:00Z' };

    mockFrom
      .mockReturnValueOnce(mockTaskQuery(PROJECT_ID))
      .mockReturnValueOnce(mockMemberRole('member'))
      .mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...newComment, profiles: { display_name: 'Test User' } },
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ error: null }) });

    const res = await request(setupApp())
      .post(`/api/tasks/${TASK_ID}/comments`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ content: 'New comment' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('New comment');
    expect(res.body.display_name).toBe('Test User');
  });

  it('returns 400 for empty content', async () => {
    const res = await request(setupApp())
      .post(`/api/tasks/${TASK_ID}/comments`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/comments/:id', () => {
  it('author can delete own comment', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: COMMENT_ID, task_id: TASK_ID, author_id: USER_ID }, error: null }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const res = await request(setupApp())
      .delete(`/api/comments/${COMMENT_ID}`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(204);
  });

  it('owner can delete any comment', async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: COMMENT_ID, task_id: TASK_ID, author_id: OTHER_USER_ID }, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce(mockTaskQuery(PROJECT_ID))
      .mockReturnValueOnce(mockMemberRole('owner'))
      .mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

    const res = await request(setupApp())
      .delete(`/api/comments/${COMMENT_ID}`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(204);
  });

  it('non-author non-owner cannot delete', async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: COMMENT_ID, task_id: TASK_ID, author_id: OTHER_USER_ID }, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce(mockTaskQuery(PROJECT_ID))
      .mockReturnValueOnce(mockMemberRole('member'));

    const res = await request(setupApp())
      .delete(`/api/comments/${COMMENT_ID}`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when comment not found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const res = await request(setupApp())
      .delete(`/api/comments/${COMMENT_ID}`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(404);
  });
});
