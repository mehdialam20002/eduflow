import { createServer } from 'node:http';
import process from 'node:process';
import { createApp } from './app.ts';
import { env, redisEnabled } from './config/env.ts';
import { logger } from './lib/logger.ts';
import { disconnectPrisma } from './lib/prisma.ts';
import { closeQueues } from './lib/queue.ts';
import { closeRedis } from './lib/redis.ts';

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.APP_ENV, version: env.APP_VERSION, redis: redisEnabled },
    `EduFlow API listening on ${env.API_URL}/api/v1`,
  );
  if (!redisEnabled) {
    logger.info('Queues are off. Start Redis and set REDIS_URL to run background jobs.');
  }
});

let shuttingDown = false;

/** Stop taking new connections, let the running requests finish, then close every pool. */
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'API shutting down');

  const closed = new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
  // A request that hangs must not hold the deploy for ever.
  const timeout = new Promise<void>((resolve) => {
    setTimeout(resolve, 10_000).unref();
  });
  await Promise.race([closed, timeout]);

  await Promise.allSettled([closeQueues(), closeRedis(), disconnectPrisma()]);
  logger.info('API stopped');
  process.exit(0);
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception, stopping');
  void shutdown('uncaughtException');
});
