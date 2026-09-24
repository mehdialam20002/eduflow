import { env } from '../../config/env.ts';
import { databaseIsReachable } from '../../lib/prisma.ts';
import { redisAvailable, redisIsReachable } from '../../lib/redis.ts';
import { queuesAvailable } from '../../lib/queue.ts';

export interface Liveness {
  status: 'ok';
  version: string;
  environment: string;
  uptimeSeconds: number;
  startedAt: string;
  timestamp: string;
}

export type DependencyStatus = 'up' | 'down' | 'not_configured';

export interface DependencyCheck {
  name: 'database' | 'redis' | 'queues';
  status: DependencyStatus;
  latencyMs: number;
  /** True when a failure of this dependency must make the whole API unready. */
  required: boolean;
}

export interface Readiness {
  ready: boolean;
  version: string;
  checks: DependencyCheck[];
}

const startedAt = new Date();

/** Liveness answers one question: is this process running? It never touches a dependency. */
export function liveness(): Liveness {
  return {
    status: 'ok',
    version: env.APP_VERSION,
    environment: env.APP_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    startedAt: startedAt.toISOString(),
    timestamp: new Date().toISOString(),
  };
}

async function timed(check: () => Promise<boolean>): Promise<{ up: boolean; latencyMs: number }> {
  const started = process.hrtime.bigint();
  const up = await check();
  const latencyMs = Number((process.hrtime.bigint() - started) / 1_000_000n);
  return { up, latencyMs };
}

/**
 * Readiness answers a different question: may this instance receive traffic?
 * Redis is optional in development, so an unset REDIS_URL is reported, not counted as a failure.
 */
export async function readiness(): Promise<Readiness> {
  const database = await timed(databaseIsReachable);
  const checks: DependencyCheck[] = [
    {
      name: 'database',
      status: database.up ? 'up' : 'down',
      latencyMs: database.latencyMs,
      required: true,
    },
  ];

  if (redisAvailable) {
    const cache = await timed(redisIsReachable);
    checks.push({
      name: 'redis',
      status: cache.up ? 'up' : 'down',
      latencyMs: cache.latencyMs,
      required: true,
    });
    checks.push({
      name: 'queues',
      status: queuesAvailable ? 'up' : 'down',
      latencyMs: 0,
      required: true,
    });
  } else {
    checks.push({ name: 'redis', status: 'not_configured', latencyMs: 0, required: false });
    checks.push({ name: 'queues', status: 'not_configured', latencyMs: 0, required: false });
  }

  const ready = checks.every((check) => !check.required || check.status === 'up');
  return { ready, version: env.APP_VERSION, checks };
}
