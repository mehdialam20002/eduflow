import type { RequestHandler } from 'express';
import { notFound as notFoundError } from '../lib/errors.ts';

/** The last normal middleware: any URL that no router claimed becomes the canon 404 envelope. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(notFoundError(`Route ${req.method} ${req.originalUrl}`));
};
