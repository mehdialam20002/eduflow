import type { RequestHandler } from 'express';
import helmet from 'helmet';

/**
 * The exact header list of the security chapter. The API answers JSON only, so the content
 * policy allows nothing at all and framing is refused outright.
 */
const helmetHeaders = helmet({
  hsts: { maxAge: 63_072_000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: {
    useDefaults: false,
    directives: { 'default-src': ["'none'"], 'frame-ancestors': ["'none'"] },
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  crossOriginEmbedderPolicy: false,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  dnsPrefetchControl: { allow: false },
  originAgentCluster: true,
  noSniff: true,
});

/** Responses are private data, so nothing is cached unless a route opts in with its own ETag. */
const noStore: RequestHandler = (_req, res, next) => {
  if (!res.hasHeader('Cache-Control')) res.setHeader('Cache-Control', 'no-store');
  next();
};

export const securityHeaders: RequestHandler[] = [helmetHeaders, noStore];
