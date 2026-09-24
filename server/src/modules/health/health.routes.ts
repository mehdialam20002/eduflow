import { Router } from 'express';
import { getHealth, getReady } from './health.controller.ts';

/**
 * Health is the reference module. It shows the layering every other module follows:
 * routes map a URL to middleware plus one controller function, the controller only translates
 * HTTP, and the service holds the work. Health is public, so it lists no authenticate,
 * no requirePermission and no validate; every business module lists all three.
 */
export const healthRouter = Router();

// CMN-API-28
healthRouter.get('/', getHealth);

// CMN-API-29
healthRouter.get('/ready', getReady);
