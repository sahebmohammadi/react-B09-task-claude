import type { ValidationIssue } from '@freelancehub/shared';
import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { AppError } from '../lib/app-error';

interface RequestSchemas {
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
}

function toIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}

/**
 * Validates the request with shared Zod schemas and replaces `params`, `query`,
 * and `body` with the parsed output, so handlers only ever see validated data.
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    const issues: ValidationIssue[] = [];

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (result.success) req.params = result.data as typeof req.params;
      else issues.push(...toIssues(result.error));
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      // Express 5 exposes `req.query` as a read-only getter, so it is shadowed instead of assigned.
      if (result.success) Object.defineProperty(req, 'query', { value: result.data });
      else issues.push(...toIssues(result.error));
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (result.success) req.body = result.data;
      else issues.push(...toIssues(result.error));
    }

    if (issues.length > 0) {
      throw new AppError('VALIDATION_ERROR', 'Request validation failed', issues);
    }
    next();
  };
}
