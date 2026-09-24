import { Redis } from 'ioredis';
import { env } from '../config/env.ts';
import { logger } from './logger.ts';

const globalForRedis = globalThis as unknown as { eduflowRedis?: Redis | null };

function connect(): Redis | null {
  const url = env.REDIS_URL;
  if (url === undefined) {
    // Development on a laptop without Redis is a supported setup, so this is info, not a warning.
    logger.info(
      'REDIS_URL is not set: cache, queues and Redis-backed rate limits are disabled. ' +
        'The API works; background jobs are not processed.',
    );
    return null;
  }

  // BullMQ needs an unlimited retry setting on the connection it shares with its workers.
  const client = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: false });
  client.on('error', (error: Error) => logger.error({ err: error }, 'Redis connection error'));
  client.on('ready', () => logger.info('Redis connected'));
  return client;
}

/** Null whenever REDIS_URL is unset. Every caller must handle null instead of assuming Redis. */
export const redis: Redis | null = globalForRedis.eduflowRedis ?? connect();
globalForRedis.eduflowRedis = redis;

export const redisAvailable = redis !== null;

/** True when Redis answers a PING. Used by the readiness probe. */
export async function redisIsReachable(): Promise<boolean> {
  if (redis === null) return false;
  try {
    const reply = await redis.ping();
    return reply === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (redis === null) return;
  await redis.quit();
}
