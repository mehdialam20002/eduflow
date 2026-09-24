import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.ts';
import { newRequestId } from './request-id.ts';

/** One Pino line per request, carrying the id that `requestId` has already put on the response. */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (_req, res) => {
    const header = res.getHeader('X-Request-Id');
    return typeof header === 'string' && header.length > 0 ? header : newRequestId();
  },
  customLogLevel: (_req, res, err) => {
    if (err !== undefined || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method ?? 'GET'} ${res.statusCode}`,
  serializers: {
    req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }),
    res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
  },
});
