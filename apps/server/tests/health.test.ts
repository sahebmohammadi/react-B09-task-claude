import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { disconnectDb } from '../src/config/db';
import { startTestDb, stopTestDb } from './helpers/test-db';

const app = createApp();

beforeAll(startTestDb);
afterAll(stopTestDb);

describe('GET /api/health', () => {
  it('reports ok when the database is connected', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok', db: 'up' } });
  });

  it('reports 503 when the database is disconnected', async () => {
    await disconnectDb();

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ data: { status: 'error', db: 'down' } });
  });
});

describe('unknown routes', () => {
  it('return the NOT_FOUND error envelope', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /api/does-not-exist not found' },
    });
  });
});
