import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import memberRoutes from '../src/routes/members';
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
  app.use('/api/projects', memberRoutes);
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

function mockMemberQuery(role: string | null) {
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
const USER_ID = '11111111-1111-4111-8111-111111111111';
const PROJECT_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_USER_ID = '33333333-3333-4333-8333-333333333333';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: USER_ID, email: 'owner@test.com' } },
    error: null,
  });
});

describe('GET /api/projects/:projectId/members', () => {
  it('lists members when caller is a member', async () => {
    const fakeMembers = [
      { project_id: PROJECT_ID, user_id: USER_ID, role: 'owner', created_at: '2024-01-01T00:00:00Z' },
      { project_id: PROJECT_ID, user_id: OTHER_USER_ID, role: 'member', created_at: '2024-01-02T00:00:00Z' },
    ];

    mockFrom
      .mockReturnValueOnce(mockMemberQuery('owner'))
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: fakeMembers.map((m) => ({
                ...m,
                profiles: { display_name: m.user_id === USER_ID ? 'Owner User' : 'Member User' },
              })),
              error: null,
            }),
          }),
        }),
      });

    const res = await request(setupApp())
      .get(`/api/projects/${PROJECT_ID}/members`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].display_name).toBe('Owner User');
    expect(res.body[1].user_id).toBe(OTHER_USER_ID);
  });

  it('returns empty array when caller is not a member', async () => {
    mockFrom.mockReturnValue(mockMemberQuery(null));

    const res = await request(setupApp())
      .get(`/api/projects/${PROJECT_ID}/members`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/projects/:projectId/members', () => {
  it('owner can add a member', async () => {
    mockFrom
      .mockReturnValueOnce(mockMemberQuery('owner'))
      .mockReturnValueOnce(mockMemberQuery(null))
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

    const res = await request(setupApp())
      .post(`/api/projects/${PROJECT_ID}/members`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ user_id: OTHER_USER_ID, role: 'member' });

    expect(res.status).toBe(201);
  });

  it('non-owner cannot add a member', async () => {
    mockFrom.mockReturnValue(mockMemberQuery('member'));

    const res = await request(setupApp())
      .post(`/api/projects/${PROJECT_ID}/members`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ user_id: OTHER_USER_ID, role: 'member' });

    expect(res.status).toBe(400);
  });

  it('rejects duplicate member', async () => {
    mockFrom
      .mockReturnValueOnce(mockMemberQuery('owner'))
      .mockReturnValueOnce(mockMemberQuery('member'));

    const res = await request(setupApp())
      .post(`/api/projects/${PROJECT_ID}/members`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ user_id: OTHER_USER_ID, role: 'member' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid user_id', async () => {
    const res = await request(setupApp())
      .post(`/api/projects/${PROJECT_ID}/members`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ user_id: 'not-a-uuid', role: 'member' });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/projects/:projectId/members/:userId', () => {
  it('owner can promote a member to owner', async () => {
    mockFrom
      .mockReturnValueOnce(mockMemberQuery('owner'))
      .mockReturnValueOnce(mockMemberQuery('member'))
      .mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

    const res = await request(setupApp())
      .patch(`/api/projects/${PROJECT_ID}/members/${OTHER_USER_ID}`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ role: 'owner' });

    expect(res.status).toBe(200);
  });

  it('non-owner cannot update role', async () => {
    mockFrom.mockReturnValue(mockMemberQuery('member'));

    const res = await request(setupApp())
      .patch(`/api/projects/${PROJECT_ID}/members/${OTHER_USER_ID}`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ role: 'owner' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/projects/:projectId/members/:userId', () => {
  it('owner can remove a member', async () => {
    mockFrom
      .mockReturnValueOnce(mockMemberQuery('owner'))
      .mockReturnValueOnce(mockMemberQuery('member'))
      .mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

    const res = await request(setupApp())
      .delete(`/api/projects/${PROJECT_ID}/members/${OTHER_USER_ID}`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(204);
  });

  it('non-owner cannot remove a member', async () => {
    mockFrom.mockReturnValue(mockMemberQuery('member'));

    const res = await request(setupApp())
      .delete(`/api/projects/${PROJECT_ID}/members/${OTHER_USER_ID}`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(400);
  });

  it('returns error when target is not a member', async () => {
    mockFrom
      .mockReturnValueOnce(mockMemberQuery('owner'))
      .mockReturnValueOnce(mockMemberQuery(null));

    const res = await request(setupApp())
      .delete(`/api/projects/${PROJECT_ID}/members/${OTHER_USER_ID}`)
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(400);
  });
});
