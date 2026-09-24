import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, zodDetails, type ErrorEnvelope } from '../lib/errors.ts';
import { TenantContextMissingError } from '../lib/tenant-context.ts';
import { requestIdOf } from './request-id.ts';

function isBodyParseError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return 'type' in error && error.type === 'entity.parse.failed';
}

function isPayloadTooLarge(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return 'type' in error && error.type === 'entity.too.large';
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    return new AppError('VALIDATION_ERROR', 'Some fields are not correct', zodDetails(error.issues));
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return new AppError('CONFLICT', 'This record already exists');
    if (error.code === 'P2025') return new AppError('NOT_FOUND', 'Record not found');
    if (error.code === 'P2003') {
      return new AppError('BUSINESS_RULE_VIOLATION', 'A linked record is missing');
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AppError('SERVICE_UNAVAILABLE', 'The database is not available right now', [], 30);
  }

  // A query without tenant context is a bug in our code, never something the caller did.
  if (error instanceof TenantContextMissingError) {
    return new AppError('INTERNAL_ERROR', 'Something went wrong. Please try again.');
  }

  if (isBodyParseError(error)) {
    return new AppError('VALIDATION_ERROR', 'Request body is not valid JSON');
  }
  if (isPayloadTooLarge(error)) {
    return new AppError('VALIDATION_ERROR', 'The request is larger than 1 MB');
  }

  return new AppError('INTERNAL_ERROR', 'Something went wrong. Please try again.');
}

/**
 * The one place that turns an error into JSON. Four parameters are required: that is how
 * Express recognises an error handler. The stack trace goes to the log, never to the caller.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const appError = toAppError(error);
  const requestId = requestIdOf(res);

  if (appError.status >= 500) {
    req.log.error({ err: error, code: appError.code }, 'Unhandled error');
  } else {
    req.log.warn({ code: appError.code }, appError.message);
  }

  if (appError.retryAfter !== undefined) {
    res.setHeader('Retry-After', String(appError.retryAfter));
  }

  const body: ErrorEnvelope = {
    success: false,
    error: { code: appError.code, message: appError.message, details: appError.details },
    requestId,
  };

  // A response already on its way cannot be replaced; Express closes it instead.
  if (res.headersSent) return _next(error);
  res.status(appError.status).json(body);
};
