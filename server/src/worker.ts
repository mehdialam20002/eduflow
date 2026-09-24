import process from 'node:process';
import { Worker, type Job } from 'bullmq';
import { env } from './config/env.ts';
import { logger } from './lib/logger.ts';
import { disconnectPrisma } from './lib/prisma.ts';
import { QUEUE_NAMES, type JobEnvelope, type QueueName } from './lib/queue.ts';
import { closeRedis, redis } from './lib/redis.ts';
import { runWithTenant } from './lib/tenant-context.ts';

export type JobHandler = (job: Job<JobEnvelope>) => Promise<void>;

/**
 * The job families this process serves. A module adds its own line here and nothing else:
 *
 *   notifications: sendNotificationJob,
 *
 * A handler is treated like a controller: it reads the job data, opens the tenant context and
 * calls one service function. It never holds a business rule and never swallows an error,
 * because a thrown error is how BullMQ knows to retry.
 */
const handlers: Partial<Record<QueueName, JobHandler>> = {};

/** Concurrency per queue, from the architecture chapter. */
const CONCURRENCY: Record<QueueName, number> = {
  notifications: 10,
  whatsapp: 10,
  sms: 10,
  email: 10,
  pdf: 2,
  imports: 1,
  exports: 2,
  invoices: 2,
  reminders: 5,
  snapshots: 2,
  webhooks: 5,
  ai: 1,
};

function stop(message: string, code: number): never {
  logger.error(message);
  process.exit(code);
}

if (redis === null) {
  stop(
    'The worker needs Redis. REDIS_URL is not set, so there is no queue to read from.\n' +
      'Start Redis (Memurai or WSL 2 on Windows, Docker elsewhere), put REDIS_URL in ' +
      'server/.env and run "npm run dev:worker -w server" again. The API itself runs without it.',
    1,
  );
}

// Narrowed once, so the closures below never have to re-check it.
const connection = redis;

const active = QUEUE_NAMES.filter((name) => handlers[name] !== undefined);

if (active.length === 0) {
  stop(
    'No job handlers are registered yet, so the worker has nothing to do.\n' +
      'Add one line to the handlers map in server/src/worker.ts and start it again.',
    0,
  );
}

const workers = active.map((name) => {
  const handler = handlers[name];
  if (handler === undefined) throw new Error(`Handler for queue ${name} disappeared`);

  const worker = new Worker<JobEnvelope>(
    name,
    async (job) => {
      // The tenant travels in the job, because a worker has no request to read it from.
      await runWithTenant(
        {
          orgId: job.data.organizationId,
          userId: 'system',
          campusIds: [],
          roles: ['SYSTEM'],
          permissions: [],
          requestId: job.data.requestId,
        },
        () => handler(job),
      );
    },
    {
      connection,
      prefix: env.QUEUE_PREFIX,
      concurrency: CONCURRENCY[name],
    },
  );

  worker.on('failed', (job, error) => {
    logger.error({ queue: name, jobId: job?.id, err: error }, 'Job failed');
  });
  worker.on('completed', (job) => {
    logger.info({ queue: name, jobId: job.id }, 'Job done');
  });
  return worker;
});

logger.info({ queues: active, prefix: env.QUEUE_PREFIX }, 'EduFlow worker started');

let draining = false;

/** Stop taking new jobs, let the running ones finish, then close the pools. */
async function shutdown(signal: string): Promise<void> {
  if (draining) return;
  draining = true;
  logger.info({ signal }, 'worker draining');
  await Promise.allSettled(workers.map((worker) => worker.close()));
  await Promise.allSettled([disconnectPrisma(), closeRedis()]);
  logger.info('worker stopped');
  process.exit(0);
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
