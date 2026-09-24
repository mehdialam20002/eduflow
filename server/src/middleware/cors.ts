import cors from 'cors';
import type { CorsOptions } from 'cors';
import type { RequestHandler } from 'express';
import { env, isProduction } from '../config/env.ts';
import { forbidden } from '../lib/errors.ts';

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Tenant subdomains such as brightfuture.eduflow.app are allowed; the root domain comes from env
// so the same code serves localhost, staging and production.
const scheme = isProduction ? 'https' : 'https?';
const port = isProduction ? '' : '(:\\d{2,5})?';
const tenantHost = new RegExp(`^${scheme}://[a-z0-9-]{1,63}\\.${escapeForRegExp(env.ROOT_DOMAIN)}${port}$`);

const allowed = new Set<string>([env.APP_URL, ...env.CORS_EXTRA_ORIGINS]);
if (isProduction) allowed.add('https://app.eduflow.app');

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Server-to-server calls, curl and the mobile apps send no Origin header at all.
    if (origin === undefined || origin === '') return callback(null, true);
    if (allowed.has(origin) || tenantHost.test(origin)) return callback(null, true);
    return callback(forbidden('Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: [
    'Authorization',
    'Content-Type',
    'Accept-Language',
    'If-None-Match',
    'Idempotency-Key',
    'X-Api-Key',
    'X-Campus-Id',
    'X-Organization-Id',
    'X-Request-Id',
  ],
  exposedHeaders: [
    'ETag',
    'Location',
    'Retry-After',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
    'X-Request-Id',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 600,
};

export const corsMiddleware: RequestHandler = cors(corsOptions);
