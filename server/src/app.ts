import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import { env } from './config/env.ts';
import { corsMiddleware } from './middleware/cors.ts';
import { errorHandler } from './middleware/error-handler.ts';
import { httpLogger } from './middleware/http-logger.ts';
import { notFound } from './middleware/not-found.ts';
import { requestId } from './middleware/request-id.ts';
import { securityHeaders } from './middleware/security-headers.ts';
import { apiRouter } from './routes/index.ts';

/**
 * Builds the Express app without opening a port, so tests can drive it with Supertest.
 * The order below is the request lifecycle of the architecture chapter and must not change.
 */
export function createApp(): Express {
  const app = express();

  // Behind Railway or a load balancer this must be 1, or every caller shares one rate-limit key.
  app.set('trust proxy', env.TRUST_PROXY);
  app.disable('x-powered-by');
  app.set('etag', false);

  // 1. The trace id, first, so even a rejected request can be found in the logs.
  app.use(requestId);

  // 2. One log line per request, carrying that id.
  app.use(httpLogger);

  // 3. Security headers, then CORS: the browser must see both on a refused call too.
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(compression());

  // 4. Webhook routers belong here, before the JSON parser, because a provider signature is
  //    checked against the exact bytes. They arrive with the Payments and WhatsApp modules.

  // 5. Body and cookie parsers. Anything larger than the limit goes to S3, not through the API.
  app.use(express.json({ limit: env.BODY_LIMIT }));
  app.use(express.urlencoded({ extended: false, limit: env.BODY_LIMIT }));
  app.use(cookieParser());

  // 6 to 10. authenticate, tenant, rate limits, requirePermission, validate and the controller
  //          are listed by each module router. See src/routes/index.ts.
  app.use('/api/v1', apiRouter);

  // 11. Every miss and every thrown error leaves as the canon error envelope.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
