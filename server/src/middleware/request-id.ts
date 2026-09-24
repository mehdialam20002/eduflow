import { randomBytes } from 'node:crypto';
import type { RequestHandler, Response } from 'express';

const REQUEST_ID = /^req_[0-9a-f]{12}$/;

export function newRequestId(): string {
  return `req_${randomBytes(6).toString('hex')}`;
}

/** The id every log line, error envelope and audit row of this request shares. */
export function requestIdOf(res: Response): string {
  const value: unknown = res.locals['requestId'];
  return typeof value === 'string' ? value : 'req_000000000000';
}

/**
 * A client may send its own id so one trace runs from the browser console to the log line.
 * A value in the wrong shape is ignored rather than refused: a trace id must never fail a call.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const sent = req.get('X-Request-Id');
  const id = sent !== undefined && REQUEST_ID.test(sent) ? sent : newRequestId();
  res.locals['requestId'] = id;
  res.setHeader('X-Request-Id', id);
  next();
};
