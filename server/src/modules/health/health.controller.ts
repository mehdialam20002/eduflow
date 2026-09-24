import type { Request, Response } from 'express';
import { serviceUnavailable, type ErrorDetail } from '../../lib/errors.ts';
import { ok } from '../../lib/response.ts';
import { liveness, readiness } from './health.service.ts';

/** CMN-API-28. Public, and deliberately cheap: a load balancer may call it every second. */
export function getHealth(_req: Request, res: Response): void {
  ok(res, liveness());
}

/** CMN-API-29. Public. Answers 503 in the canon envelope when a required dependency is down. */
export async function getReady(_req: Request, res: Response): Promise<void> {
  const result = await readiness();

  if (!result.ready) {
    const details: ErrorDetail[] = result.checks
      .filter((check) => check.required && check.status !== 'up')
      .map((check) => ({ field: check.name, issue: `Dependency is ${check.status}` }));
    throw serviceUnavailable('EduFlow is not ready to take requests', details, 30);
  }

  ok(res, result);
}
