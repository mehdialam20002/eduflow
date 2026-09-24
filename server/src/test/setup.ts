import process from 'node:process';

/**
 * Test infrastructure is the one place outside config/env.ts that writes process.env.
 * It fills only the gaps, so a value that CI has already set is kept. These defaults let the
 * whole suite run on a laptop with no PostgreSQL and no Redis: the readiness probe then
 * reports the database as down, which is a result the tests check rather than a crash.
 */
const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  APP_ENV: 'test',
  APP_VERSION: 'test',
  LOG_LEVEL: 'error',
  PORT: '4001',
  APP_URL: 'http://localhost:3000',
  API_URL: 'http://localhost:4001',
  ROOT_DOMAIN: 'localhost',
  DATABASE_URL: 'postgresql://eduflow:eduflow@localhost:5432/eduflow_test?schema=public',
  JWT_ACCESS_SECRET: 'test_access_secret_0123456789abcdefghijklmnop',
  JWT_REFRESH_SECRET: 'test_refresh_secret_0123456789abcdefghijklmnop',
  QUEUE_PREFIX: 'eduflow-test',
};

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] ??= value;
}

// Never send a real message from a test run, whatever the local .env says.
process.env['MESSAGING_MODE'] = 'log';
