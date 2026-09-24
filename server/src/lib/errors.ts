import { httpStatusFor, type ErrorCode } from '@eduflow/shared';

/** One entry of the `details` array of the canon error envelope. */
export interface ErrorDetail {
  field: string;
  issue: string;
}

export interface ErrorEnvelope {
  success: false;
  error: { code: ErrorCode; message: string; details: ErrorDetail[] };
  requestId: string;
}

/**
 * The single error type services throw. The status comes from the generated catalogue,
 * so a code and its HTTP status can never drift apart.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: ErrorDetail[];
  /** Seconds the caller should wait. Sent as `Retry-After` on 429 and 503. */
  readonly retryAfter: number | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    details: ErrorDetail[] = [],
    retryAfter?: number,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = httpStatusFor(code);
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/** A row of another tenant answers 404 as well: 403 would confirm that the id exists. */
export function notFound(what: string): AppError {
  return new AppError('NOT_FOUND', `${what} not found`);
}

export function forbidden(message = 'You do not have permission for this action'): AppError {
  return new AppError('FORBIDDEN', message);
}

export function conflict(message: string, details: ErrorDetail[] = []): AppError {
  return new AppError('CONFLICT', message, details);
}

export function validationError(
  message = 'Some fields are not correct',
  details: ErrorDetail[] = [],
): AppError {
  return new AppError('VALIDATION_ERROR', message, details);
}

/** The shape is fine but a domain rule says no: 422, never 400. */
export function businessRule(message: string, details: ErrorDetail[] = []): AppError {
  return new AppError('BUSINESS_RULE_VIOLATION', message, details);
}

export function unauthenticated(message = 'Please sign in again'): AppError {
  return new AppError('UNAUTHENTICATED', message);
}

export function serviceUnavailable(
  message: string,
  details: ErrorDetail[] = [],
  retryAfter = 30,
): AppError {
  return new AppError('SERVICE_UNAVAILABLE', message, details, retryAfter);
}

/** Renders a Zod path the way the API standard prints it: `guardians[0].relation`. */
export function formatFieldPath(path: readonly PropertyKey[], prefix = ''): string {
  const rendered = path.reduce<string>((acc, part) => {
    if (typeof part === 'number') return `${acc}[${part}]`;
    return acc === '' ? String(part) : `${acc}.${String(part)}`;
  }, '');
  if (prefix === '') return rendered;
  return rendered === '' ? prefix : `${prefix}.${rendered}`;
}

/** Turns Zod issues into the `details` array, one entry per bad field, in schema order. */
export function zodDetails(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
  prefix = '',
): ErrorDetail[] {
  return issues.map((issue) => ({
    field: formatFieldPath(issue.path, prefix),
    issue: issue.message,
  }));
}
