# EduFlow — guide for Claude Code

## Project overview

EduFlow is a multi-tenant SaaS ERP for coaching institutes and K-12 private schools: admissions,
attendance, fees, exams, staff and parent communication. One codebase, one PostgreSQL database,
many organizations, isolated by `organization_id`. 34 modules in total; Phase 1 (16 modules) is
the MVP. The owner is a solo founder. Prefer simple, readable, boring code over clever code.

## Specs — read before you code

- `docs/canon.md` — fixed facts: modules, roles, stack, conventions, error codes. Canon wins.
- `docs/prd/<file>.md` — one chapter per module, for example `docs/prd/25-fees-module.md`.
- `docs/schema/*.prisma` — approved data model. The live copy is `server/prisma/schema/`.
- `docs/api/*.md` — endpoint registry: IDs, methods, paths and permission keys.
- `docs/permissions.md` — permission keys by role.

Order of truth: canon, then schema, then api and permissions, then prd, then code.
Read only the files the prompt names. Never load every spec at once.
If a spec and the code disagree, or the spec is silent, stop and ask. Never guess.

## Stack (fixed — ask before adding or swapping any library)

- Client: Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS 4, TanStack Query,
  React Hook Form + Zod 4.
- Server: Node.js 24, Express 5, TypeScript 5, Zod 4, Pino logs, OpenAPI docs.
- Data: PostgreSQL 16+, Prisma 6.x, Redis 7 + BullMQ (optional in development).
- Auth: JWT access token (15 min) + rotating refresh token (30 days, httpOnly cookie, stored
  hashed), OTP login for parents and students, bcrypt.
- Integrations: AWS S3 pre-signed URLs, Razorpay, Stripe, WhatsApp Cloud API, MSG91, Amazon SES.
- Tests: Vitest + Supertest (server), Playwright (end-to-end).
- Repo: npm workspaces monorepo with `client/`, `server/`, `shared/`.

## Commands (run from the repo root)

- First run on a new machine: `npm install`, then `npm run setup`, then `npm run doctor`
- Everything: `npm run dev` — API on <http://localhost:4000>, web on <http://localhost:3000>
- One side: `npm run dev:server`, `npm run dev:client`, `npm run dev:worker`
- Quality gate before you say "done": `npm run check` (lint, typecheck, test)
- One module's tests: `npm run test -w server -- src/modules/fees`
- Database: `npm run db:migrate`, `npm run db:seed`, `npm run db:studio`
- Keep specs and code in step: `npm run gen:constants`, `npm run sync:schema`
- Health of this machine: `npm run doctor`

Redis is optional in development. If `REDIS_URL` is unset the app starts and logs that queues
are disabled. Never make a request path depend on Redis being present.

## Folder map

- `client/src/app/` — Next.js routes and layouts.
- `client/src/features/<module>/` — screens, forms and hooks of one module.
- `client/src/components/` — shared UI kit; `client/src/lib/` — API client and helpers.
- `server/src/modules/<module>/` — `routes.ts`, `controller.ts`, `service.ts`, `schemas.ts`,
  `<module>.test.ts`. Routes call controllers, controllers call services, only services touch
  Prisma.
- `server/src/middleware/` — requestId, logging, security headers, cors, rate limit, authenticate,
  tenant, requirePermission, validate, notFound, errorHandler.
- `server/src/lib/` — tenant-aware Prisma client, tenant context, logger, response, errors, redis,
  queue.
- `server/prisma/schema/` — the live Prisma schema; `server/prisma/seed.ts` — reference data.
- `shared/src/` — Zod schemas, types, money and date helpers; `shared/src/generated/` is generated.
- `docs/` — specs. Read during coding tasks only.

## Non-negotiable rules

1. Tenant scope: every query on a tenant table is scoped by `organizationId` through the
   tenant-aware Prisma client in `server/src/lib/`. Never call `new PrismaClient()`. Raw SQL
   must filter by `organization_id`.
2. Tenant source: `orgId` comes from the verified JWT only. Never from body, query or params.
   Only `SUPER_ADMIN` may use the `X-Organization-Id` header.
3. Campus scope: respect the user's assigned campuses and the `X-Campus-Id` header on reads
   and writes.
4. Permissions: every route has `authenticate` plus `requirePermission('<module.action>')`. The key
   must exist in `shared/src/generated/permissions.ts` and match `docs/api/`. No route is public
   by accident.
5. Validation: Zod parses body, query and params at the edge, before the controller uses them.
   Strings and arrays have limits. Schemas shared with the client live in `shared/`.
6. Envelope: success is `{ success: true, data, meta? }`. Errors go through the central error
   handler as `{ success: false, error: { code, message, details }, requestId }`. Use only the
   canon error codes: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `FORBIDDEN`,
   `PLAN_LIMIT_REACHED`, `NOT_FOUND`, `CONFLICT`, `BUSINESS_RULE_VIOLATION`, `RATE_LIMITED`,
   `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`.
7. Money: Prisma `Decimal(12, 2)` plus a 3-letter `currency`. Never Float, never `parseFloat`,
   `Number()` or `toFixed()` on money. Use the helpers in `shared/src/lib/money.ts`. Every money
   write runs inside `prisma.$transaction`. Payment-creating POSTs honour `Idempotency-Key`.
8. Time: store UTC `timestamptz`, display in the organization's timezone. Pure calendar dates use
   `@db.Date`. Use `shared/src/lib/dates.ts`, never `new Date()` arithmetic in a service.
9. Schema: never invent a table, field or enum value. If `docs/schema/` lacks it, stop and ask.
   Every schema change needs a migration, and `npm run check:schema-sync` must pass.
10. Lists: paginated (`page`, `limit`, max 100), sorted, filtered on indexed columns. No query
    inside a loop.
11. Deletes: business records are soft-deleted with `deletedAt`. Reads exclude them.
12. Secrets: no keys, tokens or passwords in code, tests, logs or commits. Read configuration only
    through `server/src/config/env.ts`. Never open or print a `.env` file.
13. Logs: Pino only. Never log passwords, OTPs, tokens or full phone numbers.
14. Tests: money code, auth code and permission checks always ship with tests. Every module has a
    tenant-isolation test: organization A never reads organization B. Never weaken, skip or delete
    a test to make it pass.
15. Generated files: never edit `shared/src/generated/**` or `docs/schema/**` by hand. Change the
    source document and run `npm run gen:constants` or `npm run sync:schema`.
16. Size: files under about 300 lines, functions under about 50 lines. No `any`. No commented-out
    code.
17. Commits: Conventional Commits, for example `feat(fees): add invoice generation`. Branch names
    are `type/pNN-short-description`. Commit or push only when the founder asks.

## How to work with the founder

- Any task touching more than three files: present a plan first and wait for approval.
- Work in small steps. After each step report: files changed, commands run, real output.
- Ask before: a new dependency, a schema change, deleting files, or a destructive command
  (`npm run db:reset`, `prisma migrate reset`, `rm -rf`, force push).
- Unsure about a library API? Check the version in `package.json` and the types in `node_modules`
  before writing code.
- Use the canon sample data (Bright Future Public School, Sharma Classes, Aarav Sharma).
  Never use real student or parent data.
