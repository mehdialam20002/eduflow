import { Router } from 'express';
import { getReady } from '../modules/health/health.controller.ts';
import { healthRouter } from '../modules/health/health.routes.ts';
import { publicRateLimit } from '../middleware/rate-limit.ts';

/** Everything under /api/v1. `app.ts` mounts this router once, after the body parsers. */
export const apiRouter = Router();

// Public routes are limited by IP, because there is no user to count against yet.
apiRouter.use('/health', publicRateLimit, healthRouter);

// The catalogue calls the readiness probe /health/ready; /ready is the short alias hosts use.
apiRouter.get('/ready', publicRateLimit, getReady);

/**
 * How to mount a new module. Copy this one line, change the two names, and nothing else:
 *
 *   apiRouter.use('/students', authenticate, tenant, signedInRateLimits, studentsRouter);
 *
 * Read it left to right: the resource path, then the four gates every signed-in route passes.
 * `authenticate` verifies the token, `tenant` opens the organization and campus context, and
 * the two rate limiters count the request per user and per organization. Inside the module
 * router each route adds its own `requirePermission('students.create')` and `validate({...})`.
 * Never call `apiRouter.use(authenticate)` here: it would also guard login and the webhooks.
 */
