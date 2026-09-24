import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.ts';
import { AppError, unauthenticated } from '../lib/errors.ts';
import type { AuthContext } from '../types/auth.ts';

/**
 * Routes that carry no token. Login and the webhook receivers prove themselves in other ways:
 * a password, a one-time code or a provider signature over the raw body.
 */
const PUBLIC_PREFIXES = [
  '/api/v1/health',
  '/api/v1/ready',
  '/api/v1/auth/login',
  '/api/v1/auth/otp',
  '/api/v1/auth/refresh',
  '/api/v1/auth/password-reset',
  '/api/v1/auth/invitations',
  '/api/v1/webhooks',
  '/api/v1/public',
];

const claimsSchema = z.object({
  sub: z.string().min(1),
  orgId: z.uuid().nullable().default(null),
  ut: z.enum(['STAFF', 'PARENT', 'STUDENT', 'PLATFORM']),
  roles: z.array(z.string()).default([]),
  campusIds: z.array(z.string()).default([]),
  cid: z.string().optional(),
  pv: z.string().optional(),
  sid: z.string().optional(),
  amr: z.array(z.string()).default([]),
});

// The auth chapter moves to EdDSA with rotating Ed25519 keys. Until JWT_PUBLIC_KEY holds that
// public key, tokens are verified with the shared HS256 secret, which is what local tools sign.
const verifyKey = env.JWT_PUBLIC_KEY ?? env.JWT_ACCESS_SECRET;
// jsonwebtoken 9 verifies EdDSA, but @types/jsonwebtoken has not listed it yet, hence the cast.
const algorithms = (env.JWT_PUBLIC_KEY === undefined ? ['HS256'] : ['EdDSA']) as unknown as jwt.Algorithm[];

export function isPublicPath(path: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function bearerToken(header: string | undefined): string {
  if (header === undefined || !header.toLowerCase().startsWith('bearer ')) {
    throw unauthenticated('Sign in to continue');
  }
  const token = header.slice(7).trim();
  if (token.length === 0) throw unauthenticated('Sign in to continue');
  return token;
}

function toAuthContext(payload: unknown): AuthContext {
  const claims = claimsSchema.safeParse(payload);
  if (!claims.success) throw unauthenticated('This sign-in is no longer valid');

  const value = claims.data;
  return {
    userId: value.sub,
    orgId: value.orgId,
    userType: value.ut,
    roleKeys: value.roles,
    campusIds: value.campusIds,
    ...(value.cid === undefined ? {} : { defaultCampusId: value.cid }),
    ...(value.sid === undefined ? {} : { sessionId: value.sid }),
    ...(value.pv === undefined ? {} : { permissionVersion: value.pv }),
    amr: value.amr,
  };
}

/**
 * Verifies the 15-minute access token and puts the claims on `req.auth`.
 * The tenant is never read from the body, the query string or the URL.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  if (isPublicPath(req.baseUrl + req.path)) return next();

  const token = bearerToken(req.get('Authorization'));
  try {
    const payload = jwt.verify(token, verifyKey, {
      algorithms,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      clockTolerance: 60,
    });
    req.auth = toAuthContext(payload);
    return next();
  } catch (error) {
    // An expired token is a normal event: the browser refreshes once and comes straight back.
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('TOKEN_EXPIRED', 'Your session has expired. Please try again.'));
    }
    if (error instanceof AppError) return next(error);
    return next(unauthenticated('This sign-in is no longer valid'));
  }
};
