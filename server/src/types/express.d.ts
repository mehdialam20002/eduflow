import type { AuthContext, PermissionGrant } from './auth.ts';

declare global {
  namespace Express {
    interface Request {
      /** Filled by `authenticate`. Absent on public routes. */
      auth?: AuthContext;
      /** Filled by `requirePermission`, so the service knows which rows it may touch. */
      permission?: PermissionGrant;
      /**
       * Filled by express-rate-limit before it calls the handler. The package sets this at
       * runtime but ships no Express augmentation, so the shape is declared here.
       */
      rateLimit?: {
        limit: number;
        used: number;
        remaining: number;
        resetTime?: Date;
      };
    }
  }
}

export {};
