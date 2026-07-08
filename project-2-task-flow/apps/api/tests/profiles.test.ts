import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import profileRoutes from '../src/routes/profiles';
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

  app.use('/api/profiles', profileRoutes);

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

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@example.com' } },
    error: null,
  });
});

describe('GET /api/profiles/me', () => {
  it('returns the profile when found', async () => {
    const fakeProfile = { id: 'test-user-id', display_name: 'Test User', avatar_url: null, created_at: '2024-01-01T00:00:00Z' };

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: fakeProfile, error: null }),
        }),
      }),
    });

    const app = setupApp();
    const res = await request(app).get('/api/profiles/me').set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeProfile);
  });

  it('returns 404 when profile not found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const app = setupApp();
    const res = await request(app).get('/api/profiles/me').set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Profile not found');
  });
});

describe('PATCH /api/profiles/me', () => {
  it('updates and returns the profile', async () => {
    const updatedProfile = { id: 'test-user-id', display_name: 'New Name', avatar_url: null, created_at: '2024-01-01T00:00:00Z' };

    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
          }),
        }),
      }),
    });

    const app = setupApp();
    const res = await request(app)
      .patch('/api/profiles/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ display_name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.display_name).toBe('New Name');
  });

  it('returns 400 for invalid display_name (empty string)', async () => {
    mockFrom.mockReturnValue({ update: vi.fn(), select: vi.fn() });

    const app = setupApp();
    const res = await request(app)
      .patch('/api/profiles/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ display_name: '' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for display_name exceeding 50 chars', async () => {
    mockFrom.mockReturnValue({ update: vi.fn(), select: vi.fn() });

    const app = setupApp();
    const res = await request(app)
      .patch('/api/profiles/me')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ display_name: 'a'.repeat(51) });

    expect(res.status).toBe(400);
  });
});