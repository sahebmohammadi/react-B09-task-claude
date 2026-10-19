import { ERROR_STATUS, type ErrorCode, type ValidationIssue } from '@freelancehub/shared';

/** An expected error. The central error handler turns it into the `{ error }` envelope. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: ValidationIssue[];

  constructor(code: ErrorCode, message: string, details?: ValidationIssue[]) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.details = details;
  }
}
