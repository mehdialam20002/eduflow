import type { RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';
import { validationError, zodDetails, type ErrorDetail } from '../lib/errors.ts';

export interface RequestSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

type Part = 'body' | 'query' | 'params';

// The body keeps plain field names; query and path fields are prefixed, as the standard shows.
const PREFIX: Record<Part, string> = { body: '', query: 'query', params: 'params' };

/**
 * Parsed values land in res.locals, not back on req: Express 5 makes req.query read-only,
 * and the parsed copy is the one that carries defaults, numbers and trimmed strings.
 * Zod drops unknown keys, so a body that smuggles organizationId gains nothing.
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, res, next) => {
    const details: ErrorDetail[] = [];
    for (const part of ['body', 'query', 'params'] as Part[]) {
      const schema = schemas[part];
      if (schema === undefined) continue;
      const result = schema.safeParse(req[part]);
      if (result.success) {
        res.locals[part] = result.data;
      } else {
        details.push(...zodDetails(result.error.issues, PREFIX[part]));
      }
    }
    if (details.length > 0) return next(validationError('Some fields are not correct', details));
    return next();
  };
}

/** Reads what `validate` has just proved. The only cast a controller is allowed to make. */
export function validated<T>(res: Response, part: Part): T {
  return res.locals[part] as T;
}
