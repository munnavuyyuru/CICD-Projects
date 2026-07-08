import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('/health', () => {
  it('returns 200 with status ok and timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });
});