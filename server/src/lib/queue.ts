import { Queue, type JobsOptions } from 'bullmq';
import { env } from '../config/env.ts';
import { logger } from './logger.ts';
import { redis } from './redis.ts';

/** The twelve queues fixed by the architecture chapter. One worker process serves them all. */
export const QUEUE_NAMES = [
  'notifications',
  'whatsapp',
  'sms',
  'email',
  'pdf',
  'imports',
  'exports',
  'invoices',
  'reminders',
  'snapshots',
  'webhooks',
  'ai',
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

/** Every job carries its tenant, because a worker has no request to read it from. */
export interface JobEnvelope {
  organizationId: string;
  requestId: string;
  payload: Record<string, unknown>;
}

const DEFAULTS: Record<QueueName, JobsOptions> = {
  notifications: { attempts: 5, backoff: { type: 'exponential', delay: 30_000 } },
  whatsapp: { attempts: 5, backoff: { type: 'exponential', delay: 30_000 } },
  sms: { attempts: 5, backoff: { type: 'exponential', delay: 30_000 } },
  email: { attempts: 5, backoff: { type: 'exponential', delay: 30_000 } },
  pdf: { attempts: 3, backoff: { type: 'exponential', delay: 10_000 } },
  imports: { attempts: 3, backoff: { type: 'fixed', delay: 60_000 } },
  exports: { attempts: 3, backoff: { type: 'fixed', delay: 60_000 } },
  invoices: { attempts: 5, backoff: { type: 'exponential', delay: 60_000 } },
  reminders: { attempts: 5, backoff: { type: 'exponential', delay: 60_000 } },
  snapshots: { attempts: 3, backoff: { type: 'fixed', delay: 300_000 } },
  webhooks: { attempts: 8, backoff: { type: 'exponential', delay: 15_000 } },
  ai: { attempts: 3, backoff: { type: 'fixed', delay: 300_000 } },
};

export const jobDefaults = DEFAULTS;

function build(): Record<QueueName, Queue> | null {
  if (redis === null) {
    logger.info('Queues are disabled: set REDIS_URL to enqueue and process background jobs.');
    return null;
  }

  const connection = redis;
  const entries = QUEUE_NAMES.map((name) => [
    name,
    new Queue(name, {
      connection,
      prefix: env.QUEUE_PREFIX,
      defaultJobOptions: {
        ...DEFAULTS[name],
        removeOnComplete: { age: 3_600, count: 1_000 },
        removeOnFail: { age: 14 * 24 * 3_600 },
      },
    }),
  ]);
  return Object.fromEntries(entries) as Record<QueueName, Queue>;
}

/** Null whenever REDIS_URL is unset, exactly like `redis`. */
export const queues: Record<QueueName, Queue> | null = build();

export const queuesAvailable = queues !== null;

/**
 * Adds a job, or returns false when queues are off. Callers decide what to do without a queue:
 * a notification can wait, a receipt PDF is generated on the next request instead.
 */
export async function enqueue(
  name: QueueName,
  jobName: string,
  data: JobEnvelope,
  options: JobsOptions = {},
): Promise<boolean> {
  if (queues === null) {
    logger.warn({ queue: name, jobName }, 'Job not queued: REDIS_URL is not set');
    return false;
  }
  await queues[name].add(jobName, data, options);
  return true;
}

export async function closeQueues(): Promise<void> {
  if (queues === null) return;
  await Promise.all(Object.values(queues).map((queue) => queue.close()));
}
