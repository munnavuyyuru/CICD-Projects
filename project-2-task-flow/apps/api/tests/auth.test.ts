import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { requireAuth } from '../src/middleware/auth';

vi.mock('../src/lib/supabase', () => {
  const mockGetUser = vi.fn();
  return {
    supabase: {
      auth: {
        getUser: mockGetUser,
      },
    },
  };
});

import { supabase } from '../src/lib/supabase';
import { AppError } from '../src/middleware/errors';

function setupApp() {
  const app = express();
  app.use(express.json());

  app.get('/protected', requireAuth, (_req, res) => {
    res.json({ user: _req.user });
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
      res.status(500).json({
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
        status: 500,
      });
    },
  );

  return app;
}

const mockGetUser = vi.mocked(supabase.auth.getUser);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('requireAuth middleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const app = setupApp();
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: 'AppError',
      message: 'Missing Authorization header',
      status: 401,
    });
  });

  it('returns 401 when header format is not Bearer', async () => {
    const app = setupApp();
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Token some-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid Authorization format. Use: Bearer <token>');
  });

  it('returns 401 when token is empty after Bearer', async () => {
    const app = setupApp();
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer ');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid Authorization format. Use: Bearer <token>');
  });

  it('returns 401 when Supabase rejects the token', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Invalid token'),
    });

    const app = setupApp();
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('returns 401 when Supabase returns no user', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const app = setupApp();
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer valid-token-no-user');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('calls next with user when token is valid', async () => {
    const fakeUser = { id: 'user-123', email: 'test@example.com' };
    mockGetUser.mockResolvedValueOnce({
      data: { user: fakeUser },
      error: null,
    });

    const app = setupApp();
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      user: { id: 'user-123', email: 'test@example.com' },
    });
  });
});