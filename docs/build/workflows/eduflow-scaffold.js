export const meta = {
  name: 'eduflow-scaffold',
  description: 'Build the EduFlow repository scaffolding so coding can start on Day 1: workspace tooling, shared package, server skeleton, client skeleton, CI and setup guides',
  whenToUse: 'args = { parts: ["root","shared","server","client","ops"] }',
  phases: [{ title: 'Scaffold', detail: 'five agents, one per directory, no shared files' }],
}

const REPO = 'E:/mysaasschool'
const D = `${REPO}/docs`

const COMMON = `You are a senior engineer setting up the EduFlow repository so that a solo founder can start building features on Day 1 (Monday 5 October 2026). EduFlow is a multi-tenant SaaS ERP for schools and coaching institutes.

READ FIRST (only the parts you need — these files are long, so use Grep and read windows rather than whole files):
- ${D}/canon.md — fixed facts: the technology stack, the 34 modules, the seven roles, multi-tenancy rules, database and API conventions. NEVER contradict it.
- ${D}/blueprint/20-folder-structure.md — the exact folder layout this repository must have.
- ${D}/blueprint/21-coding-standards.md — naming, layering, error handling, money and date rules, with code examples.
- ${D}/blueprint/23-local-development-setup.md — how the founder runs this locally.

THE ENVIRONMENT THIS MUST WORK ON (checked today):
- Windows 11, Node.js 24.13.1, npm 11.8.0, Git Bash and PowerShell available.
- PostgreSQL 18 is installed and running as a Windows service on port 5432. Its superuser password is NOT known yet and psql.exe is blocked by an Application Control policy, so nothing may depend on running psql.
- Docker is NOT installed. Redis is NOT installed. WSL 2 is available.
- Therefore: the app must start and typecheck without Redis and without a database connection, and must print a clear message instead of crashing when they are missing. Redis and queues are optional in development.

HARD RULES:
1. Stay inside the files you are given. Do not create or edit files outside them — another agent owns those.
2. Do NOT run "npm install", "npm ci" or anything that writes package-lock.json; the orchestrator installs once at the end. You may run "node --check", "npx tsc --noEmit" only if it does not need installed dependencies.
3. Declare dependencies with caret ranges that match the canon stack (Node 24, Express 5, Prisma 6, Next.js App Router with React 19, TypeScript 5, Zod 4, Tailwind 4). Never invent a package that does not exist.
4. Every file must be complete and runnable. No "TODO", no placeholder bodies, no code that references files nobody creates.
5. Write LF line endings and keep lines under 110 characters.
6. Comment sparingly, in plain English, explaining why rather than what.
7. British-neutral simple English in all documentation you write.`

const PARTS = {
  root: {
    label: 'root-workspace',
    prompt: `${COMMON}

YOU OWN THE REPOSITORY ROOT. Create exactly these files (and nothing else):

1. ${REPO}/package.json — private root package, "type": "module", npm workspaces ["client", "server", "shared"], engines node ">=24". Scripts that work on Windows without extra tools:
   dev (run server and client together with npm-run-all2 or concurrently), dev:server, dev:client, dev:worker,
   build, typecheck (tsc --noEmit in each workspace), lint, lint:fix, format, test, test:e2e,
   db:migrate ("npm run -w server db:migrate"), db:seed, db:studio, db:reset,
   doctor ("node scripts/doctor.mjs"), setup ("node scripts/setup.mjs"),
   sync:schema ("node scripts/sync-schema.mjs"), check:schema-sync ("node scripts/sync-schema.mjs --check"),
   gen:constants ("python docs/build/gen_shared_constants.py").
   devDependencies: typescript, eslint, @eslint/js, typescript-eslint, eslint-config-prettier, prettier, concurrently (or npm-run-all2), vitest.
2. ${REPO}/tsconfig.base.json — strict TypeScript for Node 24 and modern React: strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, moduleResolution "bundler", target ES2023, skipLibCheck, paths for "@eduflow/shared".
3. ${REPO}/eslint.config.mjs — flat config for TypeScript across the three workspaces, with prettier compatibility, and a rule note that forbids importing server code from the client.
4. ${REPO}/.prettierrc.json, ${REPO}/.prettierignore, ${REPO}/.editorconfig, ${REPO}/.nvmrc (24).
5. ${REPO}/docker-compose.yml — postgres:16-alpine (or 18-alpine), redis:7-alpine and axllent/mailpit, with named volumes, healthchecks and the ports 5433 for Postgres (5432 is already taken by the installed service), 6379 and 8025. Add a comment saying Docker is optional because a local PostgreSQL service is already running.
6. ${REPO}/.env.example — every variable the server and client need, grouped with a one-line comment each: app URLs, DATABASE_URL, REDIS_URL (optional), JWT secrets and lifetimes, cookie domain, CORS origins, S3, SES, Razorpay, Stripe, WhatsApp, MSG91, Sentry, PostHog, rate limits, DEFAULT_COUNTRY/CURRENCY/TIMEZONE, LOG_LEVEL, ENCRYPTION_KEY. Use safe dummy values and mark which ones are required to start.
7. ${REPO}/scripts/doctor.mjs — a real, working Node script that checks: Node version, whether .env exists and which required keys are missing, whether PostgreSQL answers on the DATABASE_URL host and port (a plain TCP check, no psql), whether Redis answers, whether node_modules is installed, and whether docs/schema matches server/prisma/schema. It prints a tick or cross per check with the exact command to fix it, and exits 1 if a required check fails. Use only Node built-ins (node:net, node:fs, node:process).
8. ${REPO}/scripts/setup.mjs — first-run helper using only Node built-ins: copies .env.example to .env when missing, creates the local folders the app needs, prints the next three commands to run. Never overwrites an existing .env.
9. ${REPO}/scripts/sync-schema.mjs — copies server/prisma/schema/*.prisma to docs/schema/ so the prompts read the same schema the code uses; with "--check" it compares instead and exits 1 on a difference. Node built-ins only.

Return: the list of files you created and anything the orchestrator must verify.`,
  },
  shared: {
    label: 'shared-package',
    prompt: `${COMMON}

YOU OWN ${REPO}/shared/. The folder already contains generated constants at shared/src/generated/ (permissions.ts, roles.ts, modules.ts, errorCodes.ts, index.ts) produced from the specifications by docs/build/gen_shared_constants.py. READ THEM FIRST and build on top; never duplicate or edit them.

Also read ${D}/prd/55-api-standards-and-conventions.md (response envelope, errors, pagination, headers) and ${D}/prd/92-appendix-error-codes.md.

Create:
1. shared/package.json (name "@eduflow/shared", type module, main/types pointing at src/index.ts, no build step needed because the workspaces compile with tsc), shared/tsconfig.json extending ../tsconfig.base.json.
2. shared/src/index.ts — re-exports everything below and ./generated.
3. shared/src/types/api.ts — the exact success and error envelope types from the API standards chapter, plus Paginated<T>, ListMeta, and a type guard isApiError.
4. shared/src/schemas/common.ts — Zod schemas reused everywhere: uuid id, pagination query (page, limit max 100, sort, q), date and date-time strings, Indian and international phone, email, money amount (string decimal with 2 places) with currency, enums for the shared canon enums. Export inferred TypeScript types.
5. shared/src/lib/money.ts — Decimal-safe money helpers that never use floating point for arithmetic: parse, add, subtract, multiply by a rate, percentage, round to 2 places, format for a currency and locale (Indian grouping for INR), and toMinorUnits/fromMinorUnits for gateways. Use a string/bigint internal representation, no external dependency.
6. shared/src/lib/dates.ts — UTC storage helpers, format in an organization timezone, start/end of day in a timezone, academic year helpers, and a note that all stored timestamps are UTC.
7. shared/src/lib/permissions.ts — small helpers over the generated permission map: hasPermission(userPermissions, key), scope checks, and a type-safe permission key builder.
8. shared/src/constants/events.ts — the domain event names the modules publish (for example fee.invoice.issued, payment.captured, attendance.marked, student.absent), typed as a union, taken from the PRD background jobs and events chapter (${D}/prd/58-background-jobs-and-events.md).
9. shared/src/index.test.ts — Vitest tests for the money and date helpers, including a rupee formatting case and a rounding case.

Return: files created, exported symbol names, and anything to verify.`,
  },
  server: {
    label: 'server-skeleton',
    prompt: `${COMMON}

YOU OWN ${REPO}/server/ EXCEPT server/prisma/schema/ (the 14 .prisma files are final; read them, never edit them).

Read these first: ${D}/prd/04-system-architecture.md (request lifecycle and middleware order), ${D}/prd/05-multi-tenancy-and-data-isolation.md (tenant context, Prisma extension, row level security), ${D}/prd/55-api-standards-and-conventions.md (envelope, errors, pagination, headers, idempotency, rate limits), ${D}/prd/06-authentication-and-sessions.md (token design — you only build the verification middleware, not the login routes), ${D}/prd/07-rbac-and-permissions-matrix.md (requirePermission).

Build a server that starts, answers health checks and shows the exact layering every module will follow. Create:
1. server/package.json (name "@eduflow/server", type module) with scripts dev (tsx watch), build (tsc), start, typecheck, lint, test (vitest), db:migrate (prisma migrate dev --schema ./prisma/schema), db:deploy, db:seed, db:studio, db:generate. Dependencies: express ^5, zod ^4, @prisma/client ^6, prisma ^6 (dev), pino, pino-http, pino-pretty (dev), helmet, cors, cookie-parser, compression, express-rate-limit, ioredis, bullmq, bcrypt or argon2, jsonwebtoken, tsx (dev), vitest (dev), supertest (dev), @types/* as needed.
2. server/tsconfig.json extending the base.
3. server/src/config/env.ts — Zod-validated environment with clear failure messages listing every missing variable; exports a typed config object; marks REDIS_URL and the provider keys as optional so the app starts without them.
4. server/src/lib/logger.ts (Pino, request id in every line), server/src/lib/response.ts (ok, okList with meta, created, noContent — the canon envelope), server/src/lib/errors.ts (AppError with the generated ErrorCode union from @eduflow/shared, plus helpers notFound, forbidden, conflict, validationError, businessRule), server/src/lib/prisma.ts (PrismaClient singleton plus the tenant extension that injects organizationId into every where/create and throws if there is no tenant context for a tenant model), server/src/lib/tenant-context.ts (AsyncLocalStorage holding organizationId, campusIds, userId, roles, permissions), server/src/lib/redis.ts and server/src/lib/queue.ts (both optional: if REDIS_URL is unset, export null and log once that queues are disabled).
5. server/src/middleware/: requestId, httpLogger, securityHeaders (helmet + the header list from the security chapter), cors, rateLimit (the canon limits), authenticate (verifies the JWT and fills tenant context; skips public routes), tenant (resolves organization and campus from the token and the X-Campus-Id header), requirePermission (uses the generated permission map), validate (Zod for body, query and params), notFound, errorHandler (maps AppError and ZodError to the canon error envelope, logs with request id, never leaks stack traces).
6. server/src/app.ts (builds the Express app with the middleware in the documented order) and server/src/server.ts (starts it, graceful shutdown on SIGTERM).
7. server/src/modules/health/ — the reference module showing the layering: routes.ts, controller.ts, service.ts, and health.test.ts. GET /api/v1/health returns uptime and version; GET /api/v1/ready checks the database and, when configured, Redis, and returns 503 with the canon error envelope when a dependency is down.
8. server/src/routes/index.ts — the v1 router that mounts health today and has a documented one-line pattern for mounting a new module.
9. server/src/worker.ts — a BullMQ worker entry point that exits with a clear message when REDIS_URL is not set.
10. server/prisma/seed.ts — seeds reference data from the specifications: plans and plan prices from docs/canon.md section 6, every permission from @eduflow/shared generated constants, the seven system roles with their permission rows, countries and currencies for India, UAE, USA and Australia, and one demo organization ("Bright Future Public School") with a campus, an academic year, one course, one batch and one admin user. It must be safe to run twice (upsert by natural key).
11. server/vitest.config.ts and server/src/test/setup.ts.
12. server/README.md — how to run, migrate, seed and add a module, in ten short steps.

Return: files created, the middleware order you used, and what the orchestrator must verify.`,
  },
  client: {
    label: 'client-skeleton',
    prompt: `${COMMON}

YOU OWN ${REPO}/client/.

Read ${D}/prd/08-design-system-and-ux-guidelines.md (app shell, tokens, component inventory, patterns) and ${D}/prd/02-users-roles-and-key-journeys.md (who sees what).

Build a Next.js App Router skeleton that runs, shows the real app shell and is ready for the first feature. Create:
1. client/package.json (name "@eduflow/client") with scripts dev, build, start, typecheck, lint, test. Dependencies: next ^15, react ^19, react-dom ^19, @tanstack/react-query ^5, react-hook-form, @hookform/resolvers, zod ^4, clsx, tailwind-merge, lucide-react, @eduflow/shared (workspace:*). Dev: tailwindcss ^4, @tailwindcss/postcss, typescript, @types/react, @types/node, vitest, @testing-library/react.
2. client/tsconfig.json, client/next.config.mjs, client/postcss.config.mjs, client/.eslintrc or flat config reference.
3. client/src/app/globals.css — Tailwind 4 import plus the design tokens (colours, typography, spacing, radius) from the design system chapter as CSS variables, light and dark.
4. client/src/app/layout.tsx (fonts, providers, metadata), client/src/app/page.tsx (a simple landing page that links to sign in), client/src/app/(auth)/login/page.tsx (email or phone and password form built with React Hook Form and Zod, calling the API client; it may show a "not implemented yet" message on submit because the login route is built later), client/src/app/(dashboard)/layout.tsx (the app shell: header with search and campus switcher, role-aware sidebar, content area) and client/src/app/(dashboard)/dashboard/page.tsx (placeholder cards that read from nothing yet).
5. client/src/lib/api-client.ts — typed fetch wrapper that sends credentials, adds the X-Campus-Id header when a campus is selected, unwraps the canon success envelope, throws a typed ApiError built from the canon error envelope, and retries only safe requests.
6. client/src/lib/permissions.tsx — a Can component and usePermissions hook over the generated permission map from @eduflow/shared.
7. client/src/providers/ — QueryClientProvider with sensible defaults, and a session provider stub that exposes the current user, roles and campuses.
8. client/src/components/ui/ — small, dependency-free primitives used everywhere: button, input, label, card, badge, table shell, dialog, toast, skeleton, empty-state, error-state. Keep them plain Tailwind with class-variance-style helpers; do not pull in a component library.
9. client/src/components/layout/ — header, sidebar (navigation built from the module list in @eduflow/shared, filtered by permission), campus-switcher, user-menu.
10. client/src/middleware.ts — redirects unauthenticated users to /login for dashboard routes (reads the session cookie name from the environment).
11. client/README.md — how to run it and where to add a feature.

Everything must typecheck with no "any" and render without a backend running.

Return: files created and what to verify.`,
  },
  ops: {
    label: 'ops-and-guides',
    prompt: `${COMMON}

YOU OWN: ${REPO}/CLAUDE.md, ${REPO}/.claude/commands/, ${REPO}/.github/, ${REPO}/.vscode/, ${D}/SETUP.md, ${D}/tech-debt.md, ${D}/DAY-1.md.

Read ${D}/blueprint/02-working-with-claude-code.md (it contains the CLAUDE.md template and the review rules), ${D}/blueprint/22-git-workflow.md, ${D}/blueprint/24-testing-strategy.md, ${D}/blueprint/31-docker-and-ci-cd.md, ${D}/blueprint/23-local-development-setup.md and ${D}/costguide/02-before-day-1-one-time-setup.md (the accounts to open before Day 1).

Create:
1. ${REPO}/CLAUDE.md — the repository rules Claude Code reads at the start of every session: what EduFlow is; the stack; the folder map; the commands; where the specifications live (docs/canon.md, docs/prd/, docs/api/, docs/permissions.md, docs/schema/); and the non-negotiable rules (every query tenant-scoped through the Prisma extension, requirePermission on every route, Zod validation at the edge, the canon response envelope and error codes, money as Decimal with a currency, UTC timestamps, transactions around money writes, tests for money and auth code, conventional commits, never edit generated files). Keep it under 150 lines — it is read on every session, so it must be short and specific.
2. ${REPO}/.claude/commands/ — reusable slash commands as Markdown files with front matter: new-module.md (scaffold a module from its PRD chapter), review-diff.md (the fifteen-point AI code review checklist), fix-tests.md, security-check.md (tenant isolation and permissions), spec-check.md (compare an implementation with its PRD chapter and list gaps), and daily-log.md.
3. ${REPO}/.github/workflows/ci.yml — on push and pull request: checkout, setup-node 24 with npm cache, npm ci, gen:constants check (fail if the generated files are out of date), check:schema-sync, lint, typecheck, unit tests with a postgres:16 service container, prisma validate, and build. Use only real, current action names.
4. ${REPO}/.github/workflows/security.yml — npm audit at moderate level, dependency review on pull requests, and a secret scan step. ${REPO}/.github/pull_request_template.md and ${REPO}/.github/ISSUE_TEMPLATE/bug_report.md and feature_request.md.
5. ${REPO}/.vscode/settings.json and extensions.json — format on save with Prettier, ESLint, Prisma and Tailwind extensions recommended.
6. ${D}/SETUP.md — the complete first-day setup for THIS machine, in numbered steps a beginner can follow: Node 24 is installed; PostgreSQL 18 is already running as a Windows service on port 5432 but its password is unknown and psql.exe is blocked, so give three clear options (reset the postgres password through pgAdmin, install Docker Desktop and use docker-compose on port 5433, or use a free hosted Postgres such as Neon) with the exact DATABASE_URL to put in .env for each; Redis options (skip it — queues are optional in development, use Memurai on Windows, use WSL 2, or use a free hosted Redis) with the exact REDIS_URL; then npm install, npm run setup, npm run doctor, npm run db:migrate, npm run db:seed, npm run dev, and the URLs to open. Include a troubleshooting table.
7. ${D}/tech-debt.md — the running list the prompts append to: a table (ID, date, what, why it was left, the cost of leaving it, when to fix) with three honest starting entries about this scaffolding.
8. ${D}/DAY-1.md — a one-page checklist for the morning of Monday 5 October 2026: what to verify before writing code, which prompt to run first (P-11 from the prompt library, because P-01 to P-10 are already done by this scaffolding), the daily rhythm, and the definition of done for the day.

Return: files created and anything to verify.`,
  },
}

const parts = (args.parts || Object.keys(PARTS)).map((k) => PARTS[k]).filter(Boolean)
phase('Scaffold')
const results = await parallel(parts.map((p) => () => agent(p.prompt, { label: p.label, phase: 'Scaffold' })))
return { built: parts.map((p, i) => ({ part: p.label, ok: results[i] !== null, note: results[i] ? String(results[i]).slice(0, 400) : null })) }
