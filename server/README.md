# EduFlow API (`@eduflow/server`)

The Express 5 API and the BullMQ worker, built from one TypeScript codebase.
`src/server.ts` answers HTTP. `src/worker.ts` runs background jobs. Both share the same
modules, the same Prisma client and the same `.env` file.

Read `docs/canon.md` before you change anything here. If this README and the canon disagree,
the canon is right.

## Ten steps from a fresh clone to a working API

1. **Install once, from the repository root.** `npm install`. Never run `npm install` inside
   `server/`: a second `package-lock.json` makes your laptop and CI install different versions.
2. **Copy the environment file.** `cp server/.env.example server/.env`, then change
   `DATABASE_URL` and the two JWT secrets. Only three variables have no default:
   `DATABASE_URL`, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. A missing one stops the
   server at start and names every problem at once, which is better than a crash at 11 pm.
3. **Generate the Prisma client.** `npm run db:generate -w server`. This reads the fourteen
   files in `prisma/schema/` and needs no database connection.
4. **Create the database schema.** `npm run db:migrate -w server`. Prisma asks for a migration
   name; `init` is fine the first time.
5. **Seed the reference data.** `npm run db:seed -w server`. It writes the four currencies and
   countries, the four plans with their canon prices, the whole permission catalogue, the seven
   system roles with their grants, and the demo school Bright Future Public School with one
   campus, one academic year, one course, one batch and one admin user. It is safe to run
   again: every write matches an existing row by its natural key.
6. **Start the API.** `npm run dev -w server`, then open `http://localhost:4000/api/v1/health`.
   You should see `{"success":true,"data":{"status":"ok",...}}`.
7. **Check the dependencies.** `http://localhost:4000/api/v1/ready` answers `200` when
   PostgreSQL is up, and `503` with the canon error envelope when it is not. Redis is optional:
   while `REDIS_URL` is empty the probe reports it as `not_configured` and the API stays ready.
8. **Run the tests.** `npm test -w server`. They run with or without a database, because the
   health tests assert the shape of the answer rather than the state of your laptop.
9. **Start the worker when you need jobs.** `npm run dev:worker -w server`. Without `REDIS_URL`
   it stops at once and tells you what to set. With Redis but no registered handler it also
   stops, because an idle worker hides a mistake.
10. **Add a module.** See the recipe below, then run `npm run typecheck -w server` and
    `npm run lint -w server` before you commit.

## Adding a module

A module folder holds one file per layer, and each layer has exactly one job. Copy `health/`
and rename, or write the five files by hand:

| File | Its one job |
|---|---|
| `students.routes.ts` | Maps a URL and method to a middleware list plus one controller function |
| `students.controller.ts` | Reads what `validate` proved, calls one service function, sends the envelope |
| `students.service.ts` | Business rules, calculations, transactions, calls to other services |
| `students.repository.ts` | Every Prisma query of this module, through `db` or the `tx` it receives |
| `students.test.ts` | Supertest cases: happy path, permissions, tenant isolation |

Then mount it with the one line documented in `src/routes/index.ts`:

```typescript
apiRouter.use('/students', authenticate, tenant, signedInRateLimits, studentsRouter);
```

Inside the module router every route names its own permission key and its own schema:

```typescript
studentsRouter.post(
  '/',
  requirePermission('students.create'),
  validate({ body: createStudentSchema }),
  controller.createStudent,
);
```

Calls only ever flow downwards: routes to controller, controller to service, service to
repository. A controller never reaches a repository, and a repository never calls a service.

## The middleware order

The order is fixed by the architecture chapter. A wrong order produces bugs that are hard to
see, such as webhook signatures that always fail.

| Order | Middleware | Where | What it does |
|---|---|---|---|
| 1 | `requestId` | `app.ts` | Creates `req_...` for the logs, the envelope and `X-Request-Id` |
| 2 | `httpLogger` | `app.ts` | One Pino line per request, carrying that id |
| 3 | `securityHeaders` | `app.ts` | Helmet plus `Cache-Control: no-store` |
| 4 | `corsMiddleware` | `app.ts` | Only EduFlow web origins, with credentials |
| 5 | Webhook routers | `app.ts` | Raw body, because signatures need the exact bytes |
| 6 | Body and cookie parsers | `app.ts` | JSON up to 1 MB |
| 7 | `authenticate`, `tenant` | Module mount | Verifies the JWT and opens the tenant context |
| 8 | `userRateLimit`, `organizationRateLimit` | Module mount | 100 per user, 1,000 per organization |
| 9 | `requirePermission` | Route | Checks the permission key and its scope |
| 10 | `validate` | Route | Parses body, query and params with Zod |
| 11 | Controller | Route | Calls exactly one service function |
| 12 | `notFound`, `errorHandler` | `app.ts` | Every miss and every error becomes the canon envelope |

Public routes are limited by IP instead, with `publicRateLimit`, because they have no user yet.

## Multi-tenancy in one paragraph

The tenant comes from the `orgId` claim of the verified JWT and from nowhere else. `tenant`
opens an `AsyncLocalStorage` store with the organization, the user, the campuses and the
request id. `lib/prisma.ts` reads that store and adds `organizationId` to every query and
every create. A model with no store throws instead of guessing. `X-Campus-Id` narrows a
request to one campus a user already holds; it can never widen. `X-Organization-Id` works for
`SUPER_ADMIN` only and is ignored, with a log line, for everybody else.

## What is not built yet

These are named here so nobody looks for them: login and refresh routes, the Redis-backed
rate-limit store, the plan gate in `requirePermission`, the organization status cache, the
audit helper, row-level security policies and the job handlers. Each one arrives with the
module that owns it.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API with `tsx watch`, restarted on every save |
| `npm run dev:worker` | BullMQ worker with `tsx watch` |
| `npm run build` | Compiles `src/` into `dist/` |
| `npm start` | Runs the compiled API |
| `npm run typecheck` | Type-checks `src/`, `prisma/` and the Vitest config |
| `npm run lint` | ESLint with zero tolerance for warnings |
| `npm test` | Vitest once; `npm run test:watch` while you work |
| `npm run db:generate` | Regenerates the Prisma client from `prisma/schema/` |
| `npm run db:migrate` | Creates and applies a migration on your laptop |
| `npm run db:deploy` | Applies existing migrations, for CI and hosts |
| `npm run db:seed` | Reference data, plans, permissions, roles and the demo school |
| `npm run db:studio` | Prisma Studio, to look at rows in the browser |
