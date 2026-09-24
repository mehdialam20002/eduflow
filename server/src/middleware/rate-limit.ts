import type { Request, RequestHandler, Response } from 'express';
import { rateLimit, type Options } from 'express-rate-limit';
import { env } from '../config/env.ts';
import { AppError } from '../lib/errors.ts';

const MINUTE = 60_000;
const FIFTEEN_MINUTES = 15 * MINUTE;

function clientIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown-ip';
}

function secondsUntilReset(req: Request): number {
  const reset = req.rateLimit?.resetTime;
  if (reset === undefined) return 60;
  return Math.max(1, Math.ceil((reset.getTime() - Date.now()) / 1_000));
}

function refuse(req: Request, _res: Response, next: (error: AppError) => void): void {
  const seconds = secondsUntilReset(req);
  next(
    new AppError(
      'RATE_LIMITED',
      `Too many requests. Please try again in ${seconds} seconds.`,
      [],
      seconds,
    ),
  );
}

function limiter(options: Pick<Options, 'windowMs' | 'limit' | 'keyGenerator'>): RequestHandler {
  return rateLimit({
    ...options,
    // draft-7 sends RateLimit-*; the legacy X-RateLimit-* trio is what the API standard lists.
    standardHeaders: 'draft-7',
    legacyHeaders: true,
    handler: refuse,
    // Every key generator below is explicit, so the built-in IP checks have nothing to add.
    validate: { ip: false },
  });
}

/** Login, signup, OTP and public forms: they have no user yet, so the IP is the key. */
export const publicRateLimit = limiter({
  windowMs: MINUTE,
  limit: env.RATE_LIMIT_PUBLIC_PER_MIN,
  keyGenerator: (req) => `rl:ip:${clientIp(req)}`,
});

/** Runs straight after `authenticate`, because the counter needs the user id from the token. */
export const userRateLimit = limiter({
  windowMs: MINUTE,
  limit: env.RATE_LIMIT_USER_PER_MIN,
  keyGenerator: (req) => `rl:user:${req.auth?.userId ?? clientIp(req)}`,
});

/** The noisy-neighbour guard: one busy school cannot use up the shared database. */
export const organizationRateLimit = limiter({
  windowMs: MINUTE,
  limit: env.RATE_LIMIT_ORG_PER_MIN,
  keyGenerator: (req) => `rl:org:${req.auth?.orgId ?? clientIp(req)}`,
});

/** Five tries per account and IP in fifteen minutes, as the security chapter fixes it. */
export const loginRateLimit = limiter({
  windowMs: FIFTEEN_MINUTES,
  limit: env.RATE_LIMIT_LOGIN_PER_15MIN,
  keyGenerator: (req) => {
    const body = (req.body ?? {}) as { email?: unknown; phone?: unknown };
    const identifier =
      typeof body.email === 'string'
        ? body.email.toLowerCase()
        : typeof body.phone === 'string'
          ? body.phone
          : 'unknown';
    return `rl:login:${identifier}:${clientIp(req)}`;
  },
});

/** The pair every signed-in module router mounts, in this order. */
export const signedInRateLimits: RequestHandler[] = [userRateLimit, organizationRateLimit];
