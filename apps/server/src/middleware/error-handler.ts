import type { ApiErrorBody } from '@freelancehub/shared';
import type { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';

/** express.json() throws this when the request body is not valid JSON. */
function isMalformedJson(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed'
  );
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (isMalformedJson(err))
    return new AppError('VALIDATION_ERROR', 'Request body is not valid JSON');

  logger.error({ err }, 'Unhandled error');
  return new AppError('INTERNAL_ERROR', 'Something went wrong');
}

// Express recognizes error handlers by their four parameters, so `_next` must stay.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const appError = toAppError(err);
  const body: ApiErrorBody = {
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details && { details: appError.details }),
    },
  };
  res.status(appError.status).json(body);
};
