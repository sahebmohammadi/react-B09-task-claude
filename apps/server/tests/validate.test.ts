import type { ApiErrorBody } from '@freelancehub/shared';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { errorHandler } from '../src/middleware/error-handler';
import { validate } from '../src/middleware/validate';

const app = express()
  .use(express.json())
  .post(
    '/items/:id',
    validate({
      params: z.object({ id: z.string().length(4) }),
      query: z.object({ page: z.coerce.number().int().min(1).default(1) }),
      body: z.object({ title: z.string().min(5) }),
    }),
    (req, res) => {
      res.json({ data: { params: req.params, query: req.query, body: req.body as unknown } });
    },
  )
  .use(errorHandler);

describe('validate()', () => {
  it('passes the parsed output to the handler', async () => {
    const res = await request(app)
      .post('/items/abcd?page=2')
      .send({ title: 'Valid title', extra: 'dropped' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: { params: { id: 'abcd' }, query: { page: 2 }, body: { title: 'Valid title' } },
    });
  });

  it('returns VALIDATION_ERROR with field details', async () => {
    const res = await request(app).post('/items/abc?page=0').send({ title: 'no' });

    const body = res.body as ApiErrorBody;
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details?.map((issue) => issue.path)).toEqual(['id', 'page', 'title']);
  });

  it('turns malformed JSON into VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/items/abcd')
      .set('Content-Type', 'application/json')
      .send('{ not json');

    expect(res.status).toBe(400);
    expect((res.body as ApiErrorBody).error.code).toBe('VALIDATION_ERROR');
  });
});
