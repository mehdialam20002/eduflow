import pino from 'pino';
import { env, isProduction, isTest } from '../config/env.ts';

// Pretty output is a development comfort only: production ships one JSON object per line,
// which is what Better Stack and Grafana can search by field.
const transport =
  isProduction || isTest
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } };

export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  base: { service: 'eduflow-api', env: env.APP_ENV, version: env.APP_VERSION },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.otp',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
  ...(transport === undefined ? {} : { transport }),
});

/** A logger for code that has no `req`, such as services, jobs and the seed. */
export function childLogger(bindings: Record<string, unknown>): pino.Logger {
  return logger.child(bindings);
}
