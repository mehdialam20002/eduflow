import process from 'node:process';
import { z } from 'zod';

// This is the only file in the server that reads process.env. Everything else imports `env`.
// A .env file is optional: hosted environments inject real variables instead.
const mode = process.env['NODE_ENV'] ?? 'development';
// Tests bring their own values, so a developer's .env can never change what a test asserts.
const envFiles = mode === 'test' ? ['.env.test'] : ['.env', `.env.${mode}`];

for (const file of envFiles) {
  try {
    process.loadEnvFile(file);
  } catch {
    // No such file. Fall through to the variables the host already set.
  }
}

// Zod 4 applies .default() to the output, so the fallback is placed on the enum, not the boolean.
const flag = (fallback: boolean) =>
  z
    .enum(['true', 'false'])
    .default(fallback ? 'true' : 'false')
    .transform((value) => value === 'true');
const csv = z
  .string()
  .default('')
  .transform((value) => value.split(',').map((part) => part.trim()).filter(Boolean));

const envSchema = z.object({
  // ---------- Core ----------
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['local', 'test', 'staging', 'production']).default('local'),
  APP_VERSION: z.string().default('dev'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  APP_URL: z.string().min(1).default('http://localhost:3000'),
  API_URL: z.string().min(1).default('http://localhost:4000'),
  ROOT_DOMAIN: z.string().min(1).default('localhost'),
  CORS_EXTRA_ORIGINS: csv,
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  BODY_LIMIT: z.string().default('1mb'),

  // ---------- Database ----------
  // Required, but the process still starts when PostgreSQL is unreachable: /api/v1/ready reports it.
  DATABASE_URL: z.string().min(1),
  DATABASE_ADMIN_URL: z.string().min(1).optional(),

  // ---------- Redis, cache and queues (optional in development) ----------
  REDIS_URL: z.string().min(1).optional(),
  QUEUE_PREFIX: z.string().min(1).default('eduflow-local'),

  // ---------- Auth ----------
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).default(30),
  JWT_ISSUER: z.string().min(1).default('https://api.eduflow.app'),
  JWT_AUDIENCE: z.string().min(1).default('eduflow-api'),
  // Set this PEM once the auth module issues EdDSA tokens; until then tokens are signed HS256.
  JWT_PUBLIC_KEY: z.string().min(1).optional(),
  REFRESH_COOKIE_NAME: z.string().min(1).default('ef_rt_local'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: flag(false),
  FIELD_ENCRYPTION_KEY: z.string().min(1).optional(),

  // ---------- Rate limits (canon values) ----------
  RATE_LIMIT_USER_PER_MIN: z.coerce.number().int().min(1).default(100),
  RATE_LIMIT_ORG_PER_MIN: z.coerce.number().int().min(1).default(1_000),
  RATE_LIMIT_PUBLIC_PER_MIN: z.coerce.number().int().min(1).default(30),
  RATE_LIMIT_LOGIN_PER_15MIN: z.coerce.number().int().min(1).default(5),

  // ---------- Localisation defaults for a new organization ----------
  DEFAULT_COUNTRY: z.string().length(2).default('IN'),
  DEFAULT_CURRENCY: z.string().length(3).default('INR'),
  DEFAULT_TIMEZONE: z.string().min(1).default('Asia/Kolkata'),

  // ---------- Seed (local and staging only) ----------
  SEED_DEMO_PASSWORD: z.string().min(8).optional(),

  // ---------- Files, mail and providers: all optional until their module is built ----------
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_UPLOADS: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_FORCE_PATH_STYLE: flag(false),
  MAIL_TRANSPORT: z.enum(['smtp', 'ses']).default('smtp'),
  MAIL_FROM: z.string().default('EduFlow Local <no-reply@eduflow.app>'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SES_REGION: z.string().optional(),
  MESSAGING_MODE: z.enum(['log', 'allowlist', 'live']).default('log'),
  MESSAGING_ALLOWLIST: csv,
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  WHATSAPP_GRAPH_VERSION: z.string().default('v23.0'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function readEnv(): Env {
  // A .env file writes `REDIS_URL=` for "not set yet", and an empty string is not the same as
  // absent to Zod, so blanks are dropped before validation. Optional stays optional.
  const provided = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== undefined && value.trim() !== ''),
  );
  const parsed = envSchema.safeParse(provided);
  if (parsed.success) return parsed.data;

  // Names and reasons only. A value could be a secret, so it is never printed.
  const lines = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `EduFlow cannot start: ${parsed.error.issues.length} environment problem(s).\n${lines}\n` +
      'Copy server/.env.example to server/.env and fill the values, then start again.',
  );
}

export const env: Env = readEnv();

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
/** Queues, cache and Redis-backed rate limits are off until REDIS_URL is set. */
export const redisEnabled = env.REDIS_URL !== undefined;
