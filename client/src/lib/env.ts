import { z } from 'zod';

// The only file in client/ that touches process.env. Next.js replaces each
// NEXT_PUBLIC_ access literally at build time, so every name is written out in
// full below; a lookup such as process.env[name] would come back undefined.

const publicEnvSchema = z.object({
  apiUrl: z.url('NEXT_PUBLIC_API_URL must be a full URL, for example http://localhost:4000/api/v1'),
  appUrl: z.url('NEXT_PUBLIC_APP_URL must be a full URL, for example http://localhost:3000'),
  appEnv: z.enum(['local', 'development', 'staging', 'production']),
  rootDomain: z.string().min(1),
  previewSession: z.boolean(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

function readPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    appEnv: process.env.NEXT_PUBLIC_APP_ENV ?? 'local',
    rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000',
    // A flag is compared as text. z.coerce.boolean() would read "false" as true.
    previewSession: process.env.NEXT_PUBLIC_PREVIEW_SESSION === 'true',
  });

  if (!parsed.success) {
    const names = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Bad NEXT_PUBLIC_ settings (${names}). Copy client/.env.example to .env.local.`);
  }
  return parsed.data;
}

export const env: PublicEnv = readPublicEnv();

/** Cookie name used by src/middleware.ts only. It never reaches the browser bundle. */
export const sessionCookieName: string = process.env.SESSION_COOKIE_NAME ?? 'eduflow_rt';
