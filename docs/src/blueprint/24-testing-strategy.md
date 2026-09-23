# Testing Strategy for a Solo Founder

**In simple words:** This chapter tells you what to test, what to skip and how to test it when you are one person with 60 days. You put most of your effort where a bug costs money, leaks data or locks people out: fees, payments, login and tenant isolation. You get complete example test files, the mandatory two-organization isolation suite, a release checklist, a UAT script for pilot institutes and a basic load test. A small, sharp test suite lets you ship every day without fear.

## Why a solo founder tests differently

A test is a small program that runs your code and checks the result. A big company has a QA team (quality assurance, people whose only job is to find bugs). You have Claude Code, one laptop and about one hour a day for tests. So you cannot test everything, and you should not try.

Your rule is simple: **test by risk**. Risk is how bad a bug is, multiplied by how likely it is. A wrong receipt amount is very bad and quite likely, because money code has many edge cases. A button that sits 2 pixels too low is harmless. Spend your hour on the first kind.

| Area | What a bug looks like | What it costs you | Test effort |
|---|---|---|---|
| Tenant isolation | Sharma Classes sees Bright Future Public School's students | Can end the company. Breach notice under the DPDP Act. | Highest: every endpoint |
| Fees, payments, discounts | Receipt says ₹12,000, ledger says ₹12,500 | Trust is gone in one day. Refunds by hand. | Highest: every rule and edge case |
| Auth and RBAC | A teacher opens fee collection. An old refresh token still works. | Data exposure, account takeover | Highest |
| Attendance, admissions, students | Absent message goes to the wrong parent | Angry parents, support calls | Medium |
| Notifications and WhatsApp | The same reminder is sent twice | Wasted credits, annoyed parents | Medium |
| Dashboard numbers | A count is off by three | Embarrassment in a demo | Low |
| Look and feel | A button is 2 pixels off | Nothing | None. Your eyes are enough. |

> **Founder note:** "Har cheez test karna zaroori nahi. Lekin jahan paisa, data ya login hai, wahan test ke bina ek line bhi merge mat kijiye." You do not need to test everything. But where there is money, data or login, never merge a line without a test.

### What to test and what to skip

| Always test | Test lightly | Skip for now |
|---|---|---|
| Every money calculation: totals, instalments, late fee, discount, rounding | One happy path per normal CRUD endpoint | Pixel-perfect UI and visual snapshots |
| Every API in auth, tenancy, fees and payments | One permission check per module (wrong role gets `403`) | shadcn/ui components. They are tested by their authors. |
| Tenant isolation for every resource | Dashboard counts against the source query | Prisma itself, Express itself, Zod itself |
| Idempotency: double click, webhook repeats, job retries | Notification templates render with sample data | Controllers in isolation. API tests cover them. |
| `Own` scope: a parent sees only her own child | Excel import: one good file, one bad file | Cross-browser matrix. Chromium plus one phone size is enough. |
| Status lifecycles of invoices and payments | Settings screens | 100% coverage. It costs more than it gives. |
| The eight critical user flows, end to end | Client formatters for money and dates | Load tests before Week 9 |

> **Rule:** Never mock the database. Mocking means replacing a real part with a fake one in a test. Your biggest risks live inside PostgreSQL: Row-Level Security, unique indexes, row locks, transactions and `Decimal` columns. A fake database has none of them. Integration tests run against a real test PostgreSQL, always.

### The cut order when time is short

Some days the build runs long and the test hour shrinks. Cut from the bottom of this list, never from the top. This is the same risk order that *60-Day Roadmap Overview and Weekly Milestones* uses for Week 8.

1. Tenant isolation tests.
2. Auth tests: login, refresh rotation, OTP, permission checks.
3. Fees tests: totals, instalments, late fee, discounts.
4. Payments tests: collection, idempotency, webhooks, receipts.
5. Parent Portal `Own` scope tests.
6. The three-test minimum for every other module (explained below).
7. Playwright end-to-end flows.
8. Unit tests for client helpers.

### Your daily time budget

The daily plans give you about 6 build hours. Each build day already has a line such as "1 h automated tests and merge". Keep that hour. It is about 15% of your build time, and it is the cheapest insurance you will ever buy.

You do not type most tests yourself. Claude Code writes them with P-49 (Write unit and integration tests for a module) and P-50 (End-to-end tests for critical flows). Your job has three parts:

1. **Tell Claude Code which cases matter.** Use the case tables in this chapter.
2. **Read every test for money, auth and tenancy.** A test that checks nothing is worse than no test, because it gives false comfort.
3. **Break the code on purpose.** Remove a tenant filter or an idempotency check on a throwaway branch. If no test turns red, the tests are decoration.

### Names this chapter assumes

The examples use the names below. Most of them come from earlier chapters and prompts. If your generated code uses another name, keep yours and stay consistent.

| Name | Lives in | Created by |
|---|---|---|
| `createApp()` | `server/src/app.ts` | P-05 |
| `db`, `runWithTenant()`, `runAsPlatform()` | `server/src/lib/` | P-06 |
| `signAccessToken()` | `server/src/modules/auth/auth.tokens.ts` | P-07 (assumed file name) |
| `toMoney()` | `server/src/lib/money.ts` | *Coding Standards* |
| `calculateLateFee()` | `server/src/modules/fees/late-fee.ts` | P-24 |
| `financeQueue`, `webhookQueue` | `server/src/lib/queue.ts` | P-24, P-26 |
| `processFinanceJob()` | `server/src/jobs/finance.worker.ts` | P-24 |
| `processRazorpayEvent()` | `server/src/modules/payments/` | P-26 |
| `DATABASE_OWNER_URL` | `server/.env.test` and CI | This chapter (assumption) |

> **Note:** Request bodies and paths in the examples follow *Daily Plan: Days 29 to 42*. The real field names come from `docs/prd/25-fees-module.md`, `docs/prd/26-payments-module.md` and the endpoint registry in `docs/api/`. If they differ, the PRD wins. Change the names, keep the test cases.

## The test pyramid, adapted for EduFlow

The test pyramid is a picture of how many tests you write at each level. Many small, fast tests sit at the bottom. A few slow, realistic tests sit at the top. EduFlow uses three levels.

- A **unit test** checks one function alone, with no database and no network. Example: the late fee for 10 late days.
- An **integration test** sends a real HTTP request to the real Express app, which talks to a real test database. Example: `POST /api/v1/payments` creates one payment and one receipt.
- An **end-to-end test** (E2E) drives a real browser through the real app, the way Suresh Gupta would. Example: search a student, collect ₹12,000, download the receipt.

**Figure: The EduFlow test pyramid**

```text
                      /\
                     /  \          END TO END (Playwright)
                    / 8  \         8 critical flows, real browser
                   /flows \        runs on staging, about 8 minutes
                  /--------\
                 /          \      INTEGRATION (Vitest + Supertest)
                / every API  \     real PostgreSQL 16, real Redis 7
               /  in auth,    \    auth, tenancy, fees, payments
              /   tenancy,     \   plus the tenant isolation matrix
             /  fees, payments  \  about 4 minutes
            /--------------------\
           /                      \    UNIT (Vitest)
          /  money maths, business \   no database, no network
         /   rules, pure helpers    \  under 10 seconds
        /----------------------------\
```

The classic pyramid says "mostly unit tests". Yours is fatter in the middle. In a multi-tenant ERP the dangerous bugs sit between the layers: a missing permission, a missing tenant filter, a transaction that does not roll back. Only an integration test sees those.

| Level | Tool | What it proves | Target count by Day 60 | Time budget |
|---|---|---|---|---|
| Unit | Vitest | Money maths and business rules are correct for every edge case | 80 to 120 | Under 10 seconds |
| Integration | Vitest + Supertest + real PostgreSQL and Redis | Each API obeys validation, permissions, tenancy and business rules | 200 to 300 | Under 4 minutes |
| Tenant isolation | Same tools, one matrix file plus per-module files | Organization A can never read or write organization B | Every Phase 1 resource | Inside the 4 minutes |
| End to end | Playwright, Chromium, one phone size | The eight critical flows work in a real browser | 6 on Day 55, then 8 | Under 8 minutes |
| Manual | You, a checklist, staging | What machines cannot judge: layout, wording, print, PDF look | 25 checks per release | 30 minutes |
| Load | k6 | 200 concurrent users, p95 under 500 ms | 1 script | 20 minutes, before launch |

The counts are targets, not rules. The order of risk matters more than any number.

### The three-test minimum

Every endpoint group of every module gets at least three integration tests, even on a bad day. Claude Code writes them in a few minutes.

1. **Happy path.** The right role sends a valid request and gets `200` or `201` with the right data.
2. **Wrong role.** A role without the permission gets `403` with code `FORBIDDEN`.
3. **Other tenant.** An admin of another organization gets `404` with code `NOT_FOUND`, never the data.

Every `POST` and `PATCH` gets a fourth test: an invalid body gets `400` with code `VALIDATION_ERROR` and a useful `details` list.

### Install the tools

Run these from the repo root. They add development dependencies only.

```bash
npm install -D vitest @vitest/coverage-v8 supertest @types/supertest -w server
npm install -D vitest -w shared
npm install -D @playwright/test -w client
npx playwright install chromium
```

Vitest is a test runner for TypeScript projects. Supertest sends HTTP requests to an Express app inside the test process, without opening a port. Playwright controls a real browser. `@vitest/coverage-v8` measures coverage (which lines of code ran during the tests).

## Test environment setup

Tests need their own database. If tests share `eduflow_dev`, they destroy your demo data, and your demo data breaks your tests.

### The test database

Create one extra database inside the PostgreSQL container that you already run. You do this once per laptop.

```bash
docker compose exec postgres createdb -U eduflow eduflow_test
```

The command uses the service name `postgres` and the owner user `eduflow` from *Local Development Setup*. The runtime role `eduflow_app` from Day 6 already exists, because PostgreSQL roles belong to the whole server and not to one database.

> **Warning:** Row-Level Security does not apply to a superuser. If your tests connect as the owner `eduflow`, every RLS test passes even when RLS is broken. Tests must connect as `eduflow_app`, the same kind of role that the API uses in production. Only migrations and the seed use the owner.

### The test environment file

Copy `server/.env.example` to `server/.env.test`. Keep every variable name, because `server/src/config/env.ts` refuses to start when one is missing. Then change the lines below. The file is ignored by Git like every other `.env.*` file.

**File: `server/.env.test`**

```env
NODE_ENV=test
PORT=4001
# Runtime role: not a superuser, not the table owner. RLS applies.
DATABASE_URL=postgresql://eduflow_app:YOUR_DAY6_PASSWORD@localhost:5432/eduflow_test
# Owner role: used only by the global setup for migrations, grants and seed.
DATABASE_OWNER_URL=postgresql://eduflow:eduflow@localhost:5432/eduflow_test
# Redis database 1. Your dev app and dev worker use database 0.
REDIS_URL=redis://localhost:6379/1
JWT_ACCESS_SECRET=test-only-access-secret-0123456789abcdef
JWT_REFRESH_SECRET=test-only-refresh-secret-0123456789abcdef
RAZORPAY_KEY_ID=rzp_test_dummy
RAZORPAY_KEY_SECRET=dummy-secret
RAZORPAY_WEBHOOK_SECRET=test-webhook-secret
# Every other provider key: a dummy value. Tests never call a provider.
```

Three details matter here.

- **Redis database 1.** Redis has numbered databases inside one server. If tests used database 0, your running dev worker would pick up test jobs and the test would wait forever.
- **`DATABASE_OWNER_URL` is this chapter's name** for the owner connection. *Environment Variables and Command Reference* holds the final name. If yours differs, use yours.
- **No real keys.** A dummy WhatsApp token cannot message 350 parents by mistake.

### Vitest configuration for the server

**File: `server/vitest.config.ts`**

```typescript
import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Test infrastructure is the one place outside config/env.ts that touches process.env.
// Values that CI has already set are kept. The file only fills the gaps.
if (existsSync('.env.test')) process.loadEnvFile('.env.test');

const MONEY_AND_AUTH = { lines: 90, functions: 90, statements: 90, branches: 85 };

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globalSetup: ['src/test/global-setup.ts'],
    setupFiles: ['src/test/setup.ts'],
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 60_000,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/test/**', 'src/types/**', 'src/server.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 60,
        'src/modules/auth/**': MONEY_AND_AUTH,
        'src/modules/fees/**': MONEY_AND_AUTH,
        'src/modules/payments/**': MONEY_AND_AUTH,
        'src/modules/discounts/**': MONEY_AND_AUTH,
        'src/middleware/{auth,tenant,rbac,idempotency}.ts': MONEY_AND_AUTH,
        'src/lib/{prisma,tenant-context,money}.ts': MONEY_AND_AUTH,
      },
    },
  },
});
```

- `process.loadEnvFile()` is built into Node.js. It loads only `server/.env.test`, so your real dev keys in `server/.env` stay out of the tests. It never overwrites a variable that is already set, which is what you want in CI.
- `globalSetup` runs once before all tests. `setupFiles` run before every test file.
- `fileParallelism: false` runs test files one after another. It is slower but predictable. Every test creates its own organizations (see the factories below), so you can switch this to `true` later, when the suite passes 4 minutes.
- The `thresholds` block is explained in the section on coverage targets.

Run Vitest from the `server/` folder or through the npm scripts, because the paths are relative to `server/`.

### Global setup: migrate, grant, seed

**File: `server/src/test/global-setup.ts`**

```typescript
import { execSync } from 'node:child_process';

const ROLE_SQL =
  'npx prisma db execute --schema prisma/schema --file prisma/sql/test-app-role.sql';

export default function globalSetup(): void {
  const runtimeUrl = process.env.DATABASE_URL ?? '';
  const ownerUrl = process.env.DATABASE_OWNER_URL ?? '';

  for (const url of [runtimeUrl, ownerUrl]) {
    if (!url.includes('/eduflow_test')) {
      throw new Error('Tests refuse to run: both database URLs must point to eduflow_test.');
    }
  }

  // Prisma reads DATABASE_URL. For these four commands it is the owner URL.
  const asOwner = { ...process.env, DATABASE_URL: ownerUrl };
  const run = (command: string): void => {
    execSync(command, { stdio: 'inherit', env: asOwner });
  };

  run(ROLE_SQL); // the role must exist before migrations that mention it
  run('npx prisma migrate deploy'); // applies new migrations only, so it is fast
  run(ROLE_SQL); // grants on the tables that now exist
  run('npx prisma db seed'); // plans, permissions, system roles: the seed is idempotent
}
```

**File: `server/prisma/sql/test-app-role.sql`**

```sql
-- Local test database and CI only. Safe to run many times.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'eduflow_app') THEN
    CREATE ROLE eduflow_app LOGIN PASSWORD 'eduflow_app' NOSUPERUSER NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO eduflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO eduflow_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO eduflow_app;
```

The guard at the top of the setup is the most important part. One wrong `DATABASE_URL` and a test run would write junk into your dev data, or worse. With the guard, the run stops before the first query. On your laptop the role already exists with your Day 6 password, so the `CREATE ROLE` part does nothing. On a fresh CI database it creates the role with the password `eduflow_app`. If your P-06 migration already contains the grants, keep the file anyway. Running a `GRANT` twice changes nothing.

> **Warning:** Never use `prisma migrate reset` inside a test setup. It drops the database, and the Claude Code hook from *Working with Claude Code* blocks it for good reasons. `migrate deploy` is enough, because tests never depend on an empty table.

### The per-file setup

**File: `server/src/test/setup.ts`**

```typescript
import { afterAll, vi } from 'vitest';
import { db } from '../lib/prisma';

// No test may reach a real provider. Each provider has exactly one wrapper file,
// so one line per provider is enough. Automock turns every export into vi.fn().
vi.mock('../lib/whatsapp');
vi.mock('../lib/mailer');
vi.mock('../lib/sms/index');
vi.mock('../lib/s3');
vi.mock('../lib/payments/razorpay');
vi.mock('../lib/payments/stripe');

afterAll(async () => {
  await db.$disconnect();
});
```

| Provider | Wrapper file | In tests |
|---|---|---|
| WhatsApp Cloud API | `lib/whatsapp.ts` | Mocked. Assert that `sendWhatsAppTemplate` was called once with the right template. |
| Amazon SES | `lib/mailer.ts` | Mocked. Assert the recipient and the template key. |
| MSG91 and Twilio | `lib/sms/index.ts` | Mocked. Assert the DLT template ID is passed. |
| AWS S3 | `lib/s3.ts` | Mocked. Return a fake pre-signed URL. |
| Razorpay | `lib/payments/razorpay.ts` | Mocked for order creation. Webhooks are tested with real signatures. |
| PostgreSQL | `lib/prisma.ts` | Real. Never mocked. |
| Redis and BullMQ | `lib/redis.ts`, `lib/queue.ts` | Real, on Redis database 1 |

> **Tip:** A quick honesty check: turn off your Wi-Fi and run `npm run test`. Everything must still pass. If one test fails, it was talking to the internet, and one day it will fail in CI for no reason.

### Scripts and daily commands

Add these scripts. The `test` script already exists from *Folder Structure*.

**File: `server/package.json` (scripts to add)**

```json
{
  "scripts": {
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

**File: `client/package.json` (scripts to add)**

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

| Command | Run from | What it does | When |
|---|---|---|---|
| `npm run test` | Repo root | Builds `shared`, then runs Vitest in all three workspaces | Before every merge |
| `npm run test:watch -w server` | Repo root | Re-runs the tests of changed files while you code | While you build a service |
| `npx vitest run payments` | `server/` | Runs only test files with "payments" in the path | While you work on one module |
| `npx vitest run -t "replay"` | `server/` | Runs only tests whose name contains "replay" | While you fix one bug |
| `npm run test:coverage -w server` | Repo root | Runs all server tests and writes `server/coverage/` | Day 51, then weekly |
| `npm run test:e2e -w client` | Repo root | Runs the Playwright flows | After a staging deploy |
| `npm run test:e2e:ui -w client` | Repo root | Opens the Playwright UI with time-travel debugging | When a flow fails |

## Test data: factories and seeding

EduFlow uses three kinds of test data. Do not mix them.

| Kind | What it is | Created by | Used by |
|---|---|---|---|
| Reference seed | 4 plans, permission keys, 7 system roles, countries, currencies | `npx prisma db seed` (P-04) | Every test. The global setup loads it. |
| Demo seed | Bright Future Public School and Sharma Classes with students, fees and users | P-04, extended by P-58 | Manual testing, demos, local Playwright runs |
| Factories | Small functions that create fresh rows for one test | `server/src/test/factories.ts` | Every integration test |

A factory is a function that builds one valid record with sensible defaults, so a test states only what it cares about. `createStudent(orgA)` is enough when the test is about isolation. `createInvoice(orgA, student, { total: '12000.00' })` is enough when the test is about money.

### Rules for test data

1. **Every test file creates its own organizations.** A test never reads the demo tenants and never assumes that a table is empty. This is why tests need no clean-up step and can run in parallel later.
2. **Unique values come from a random tag.** Slugs, emails, invoice numbers and gateway IDs get 8 random characters. `Organization.slug` and `(gateway, gatewayPaymentId)` are unique across all tenants, so fixed values would clash on the second run.
3. **Factories create the setup. The API creates the thing under test.** A factory may write a student or an open invoice. It never writes a payment, an allocation or a receipt by hand, because that would skip the very rules you want to test.
4. **Factories pass `organizationId` explicitly.** It is type-safe, it is readable, and the tenant extension checks it against the context anyway.
5. **Dates are fixed, never "today".** Use `2027-07-10`, not `new Date()`. A test that depends on the calendar fails on some future morning.
6. **Use the canon names.** Aarav Sharma, Sunita Devi and Suresh Gupta in tests make failures easy to read.

**File: `server/src/test/factories.ts`**

```typescript
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { AcademicYear, Campus, Organization } from '@prisma/client';
import { db } from '../lib/prisma';
import { runAsPlatform, runWithTenant } from '../lib/tenant-context';

export type RoleKey = 'ORG_ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'ACCOUNTANT' | 'PARENT' | 'STUDENT';

export interface TestTenant {
  org: Organization;
  campus: Campus;
  academicYear: AcademicYear;
  /** Runs fn inside this organization's tenant context, like a real request. */
  run<T>(fn: () => Promise<T>): Promise<T>;
}

export interface TestUser {
  id: string;
  organizationId: string;
  email: string;
  roleKey: RoleKey;
}

const FACTORY_USER_ID = '00000000-0000-0000-0000-000000000000';
const USER_TYPE = {
  ORG_ADMIN: 'STAFF',
  PRINCIPAL: 'STAFF',
  TEACHER: 'STAFF',
  ACCOUNTANT: 'STAFF',
  PARENT: 'PARENT',
  STUDENT: 'STUDENT',
} as const;

let counter = 0;
export const uniqueTag = (): string => randomUUID().slice(0, 8);

export async function createTenant(type: 'SCHOOL' | 'COACHING' = 'SCHOOL'): Promise<TestTenant> {
  const tag = uniqueTag();
  const org = await runAsPlatform('test factory: create organization', async () => {
    const plan = await db.plan.findUniqueOrThrow({ where: { code: 'PRO' } });
    return db.organization.create({
      data: {
        name: type === 'SCHOOL' ? `Bright Future Test ${tag}` : `Sharma Classes Test ${tag}`,
        slug: `test-${tag}`,
        type,
        status: 'ACTIVE',
        planId: plan.id,
        countryCode: 'IN',
        currency: 'INR',
        email: `owner-${tag}@example.test`,
      },
    });
  });

  const run = <T>(fn: () => Promise<T>): Promise<T> =>
    runWithTenant(
      { orgId: org.id, userId: FACTORY_USER_ID, campusIds: [], requestId: `req_test_${tag}` },
      fn,
    );

  const { campus, academicYear } = await run(async () => ({
    campus: await db.campus.create({
      data: { organizationId: org.id, name: 'Main Campus', code: 'MAIN', isMain: true },
    }),
    academicYear: await db.academicYear.create({
      data: {
        organizationId: org.id,
        name: '2027-28',
        startDate: new Date('2027-04-01'),
        endDate: new Date('2028-03-31'),
        isCurrent: true,
        status: 'ACTIVE',
      },
    }),
  }));

  return { org, campus, academicYear, run };
}

export function createUser(tenant: TestTenant, roleKey: RoleKey): Promise<TestUser> {
  const tag = uniqueTag();
  return tenant.run(async () => {
    const role = await db.role.findFirstOrThrow({ where: { key: roleKey, isSystem: true } });
    const user = await db.user.create({
      data: {
        organizationId: tenant.org.id,
        userType: USER_TYPE[roleKey],
        status: 'ACTIVE',
        email: `${roleKey.toLowerCase()}-${tag}@example.test`,
        firstName: 'Test',
        lastName: roleKey,
      },
    });
    await db.userRole.create({
      data: { organizationId: tenant.org.id, userId: user.id, roleId: role.id },
    });
    await db.userCampus.create({
      data: {
        organizationId: tenant.org.id,
        userId: user.id,
        campusId: tenant.campus.id,
        isDefault: true,
      },
    });
    return { id: user.id, organizationId: tenant.org.id, email: user.email ?? '', roleKey };
  });
}

export function createStudent(
  tenant: TestTenant,
  overrides: Partial<Prisma.StudentUncheckedCreateInput> = {},
) {
  counter += 1;
  return tenant.run(() =>
    db.student.create({
      data: {
        organizationId: tenant.org.id,
        campusId: tenant.campus.id,
        admissionNo: `T-2027-${String(counter).padStart(4, '0')}`,
        firstName: 'Aarav',
        lastName: `Sharma ${counter}`,
        dateOfBirth: new Date('2012-05-14'),
        gender: 'MALE',
        admissionDate: new Date('2027-04-01'),
        ...overrides,
      },
    }),
  );
}

export function createInvoice(
  tenant: TestTenant,
  student: { id: string },
  input: { total?: string; dueDate?: string } = {},
) {
  const total = new Prisma.Decimal(input.total ?? '15000.00');
  return tenant.run(() =>
    db.feeInvoice.create({
      data: {
        organizationId: tenant.org.id,
        campusId: tenant.campus.id,
        academicYearId: tenant.academicYear.id,
        studentId: student.id,
        invoiceNo: `TINV-${uniqueTag()}`,
        title: 'Tuition Q2',
        issueDate: new Date('2027-07-01'),
        dueDate: new Date(input.dueDate ?? '2027-07-10'),
        currency: 'INR',
        subtotal: total,
        total,
        balance: total,
        status: 'ISSUED',
      },
    }),
  );
}
```

> **Tip:** If your signup service creates default number sequences and settings for a new organization, call that service inside `createTenant()` instead of writing the rows by hand. Then a test tenant is born exactly the way a real tenant is born, and the receipt number logic has what it needs.

The second helper file builds the app once and creates login headers.

**File: `server/src/test/test-app.ts`**

```typescript
import request from 'supertest';
import { createApp } from '../app';
import { signAccessToken } from '../modules/auth/auth.tokens';
import type { TestUser } from './factories';

const app = createApp();

/** A Supertest agent for the real Express app. No port is opened. */
export function api() {
  return request(app);
}

/** Signs a token with the app's own function, so tests and production agree. */
export function authHeader(user: TestUser): Record<string, string> {
  const token = signAccessToken({ userId: user.id, orgId: user.organizationId });
  return { Authorization: `Bearer ${token}` };
}
```

`authHeader()` skips the login route on purpose. Hashing a password with bcrypt is slow by design, and 300 tests that log in would waste a minute. The login route itself is tested fully in `auth.test.ts`. The `authenticate` middleware still loads the user and the role from the database, so permissions in tests are real.

## Unit tests for money and business rules

A unit test is the right tool when the logic is a pure function (a function whose result depends only on its inputs, with no database, no clock and no network). EduFlow keeps such logic in small files named after what they compute, as *Folder Structure* describes: `late-fee.ts` with `late-fee.test.ts` next to it.

| Rule to unit test | Cases that must exist |
|---|---|
| Late fee | Before due date, last grace day, first late day, cap reached, waived, zero balance, no rule, year end |
| Instalment split | ₹10,000 in 3 parts gives ₹3,333.33, ₹3,333.33 and ₹3,333.34. The parts add up to the total. |
| Percent discount | 7.5% of ₹12,345.00 is ₹925.88 (half up). Cap applies. Never below zero. |
| Order of calculation | Gross, minus discount, plus tax, plus late fee, minus paid. One test per step. |
| Invoice status | Balance zero gives `PAID`. Part paid gives `PARTIALLY_PAID`. Past due with balance gives `OVERDUE`. |
| Allocation order | Oldest due date first. Sum of allocations equals the payment amount. |
| Rupees to paise | `"12000.50"` becomes `1200050` for Razorpay, and back, with no float in between |
| Day close | Expected cash = opening + collected - refunded. Variance = counted - expected. |
| Permission check | `can(user, 'fees.collect')` for a system role, a custom role and a user with no role |
| Phone normaliser | `98765 43210`, `09876543210` and `+919876543210` all give `+919876543210` |

The trick that makes money rules testable: **pass the date in**. The function never calls `new Date()`. The nightly job passes "today in the campus timezone" as a plain calendar date such as `2027-07-25`. Then the test controls time without any fake clock.

**File: `server/src/modules/fees/late-fee.ts`**

```typescript
import { Prisma } from '@prisma/client';
import { toMoney } from '../../lib/money';

export interface LateFeeRuleInput {
  calculation: 'FIXED_ONCE' | 'FIXED_PER_DAY';
  amount: Prisma.Decimal;
  graceDays: number;
  maxAmount: Prisma.Decimal | null;
}

export interface LateFeeInput {
  balance: Prisma.Decimal;
  dueDate: string; // calendar date, 'YYYY-MM-DD'
  asOfDate: string; // "today" in the campus timezone, passed in by the caller
  lateFeeWaived: boolean;
  rule: LateFeeRuleInput | null;
}

const ZERO = new Prisma.Decimal(0);
const MS_PER_DAY = 86_400_000;

/** Whole days between two calendar dates. Date-only strings parse as UTC midnight. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

export function calculateLateFee(input: LateFeeInput): Prisma.Decimal {
  const { rule } = input;
  if (!rule) return ZERO;
  if (input.lateFeeWaived) return ZERO;
  if (input.balance.lessThanOrEqualTo(0)) return ZERO;

  const lateDays = daysBetween(input.dueDate, input.asOfDate) - rule.graceDays;
  if (lateDays <= 0) return ZERO;

  const raw = rule.calculation === 'FIXED_PER_DAY' ? rule.amount.times(lateDays) : rule.amount;
  const capped = rule.maxAmount && raw.greaterThan(rule.maxAmount) ? rule.maxAmount : raw;
  return toMoney(capped);
}
```

The MVP supports the two rule types from *Daily Plan: Days 29 to 42*: a flat fee once, and a fee per day, both with grace days and a cap. The test below uses the same worked example as Day 33: Tuition Q2 of ₹12,000 is due on 10 July 2027, the rule is ₹50 per day with 5 grace days and a cap of ₹500, and the parent pays on 25 July.

**File: `server/src/modules/fees/late-fee.test.ts`**

```typescript
import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { calculateLateFee, daysBetween } from './late-fee';
import type { LateFeeInput, LateFeeRuleInput } from './late-fee';

const perDayRule: LateFeeRuleInput = {
  calculation: 'FIXED_PER_DAY',
  amount: new Prisma.Decimal('50.00'),
  graceDays: 5,
  maxAmount: new Prisma.Decimal('500.00'),
};

function input(overrides: Partial<LateFeeInput> = {}): LateFeeInput {
  return {
    balance: new Prisma.Decimal('12000.00'),
    dueDate: '2027-07-10',
    asOfDate: '2027-07-25',
    lateFeeWaived: false,
    rule: perDayRule,
    ...overrides,
  };
}

describe('calculateLateFee: Rs 50 per day, 5 grace days, cap Rs 500', () => {
  it.each([
    { asOfDate: '2027-07-09', expected: '0.00', why: 'before the due date' },
    { asOfDate: '2027-07-10', expected: '0.00', why: 'on the due date' },
    { asOfDate: '2027-07-15', expected: '0.00', why: 'last grace day' },
    { asOfDate: '2027-07-16', expected: '50.00', why: 'first late day' },
    { asOfDate: '2027-07-20', expected: '250.00', why: '5 late days' },
    { asOfDate: '2027-07-25', expected: '500.00', why: '10 late days, the Day 33 example' },
    { asOfDate: '2027-08-31', expected: '500.00', why: '47 late days, the cap holds' },
  ])('$asOfDate gives $expected ($why)', ({ asOfDate, expected }) => {
    expect(calculateLateFee(input({ asOfDate })).toFixed(2)).toBe(expected);
  });

  it('adds up to the amount the accountant must collect', () => {
    const balance = new Prisma.Decimal('12000.00');
    const lateFee = calculateLateFee(input({ balance }));
    expect(balance.plus(lateFee).toFixed(2)).toBe('12500.00');
  });

  it('has no cap when maxAmount is null', () => {
    const rule: LateFeeRuleInput = { ...perDayRule, maxAmount: null };
    expect(calculateLateFee(input({ rule, asOfDate: '2027-08-31' })).toFixed(2)).toBe('2350.00');
  });

  it('charges a flat fee once, however late the payment is', () => {
    const rule: LateFeeRuleInput = {
      ...perDayRule,
      calculation: 'FIXED_ONCE',
      amount: new Prisma.Decimal('200.00'),
    };
    expect(calculateLateFee(input({ rule, asOfDate: '2027-07-16' })).toFixed(2)).toBe('200.00');
    expect(calculateLateFee(input({ rule, asOfDate: '2027-12-31' })).toFixed(2)).toBe('200.00');
  });

  it('returns zero when the late fee is waived', () => {
    expect(calculateLateFee(input({ lateFeeWaived: true })).toFixed(2)).toBe('0.00');
  });

  it('returns zero when nothing is left to pay', () => {
    const balance = new Prisma.Decimal('0.00');
    expect(calculateLateFee(input({ balance })).toFixed(2)).toBe('0.00');
  });

  it('returns zero when the organization has no late fee rule', () => {
    expect(calculateLateFee(input({ rule: null })).toFixed(2)).toBe('0.00');
  });

  it('counts days correctly across a year end', () => {
    const rule: LateFeeRuleInput = { ...perDayRule, graceDays: 0, maxAmount: null };
    const result = calculateLateFee(input({ rule, dueDate: '2027-12-28', asOfDate: '2028-01-07' }));
    expect(result.toFixed(2)).toBe('500.00');
  });
});

describe('daysBetween', () => {
  it('counts the leap day of 2028', () => {
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
  });
});
```

Four habits to copy from this file:

- **`it.each` with a table.** Seven boundary cases take seven lines. The boundaries are where bugs live: the last grace day and the first late day.
- **Compare money as text.** `.toFixed(2)` gives `'500.00'`. Never compare two `Decimal` objects with `toBe`, and never convert to `number`.
- **A reason in every row.** When the row "last grace day" turns red, you know what broke without opening the code.
- **The test name is a sentence.** *Coding Standards* asks for names that state the behaviour, such as "returns zero when the late fee is waived".

## Integration tests for the API

An integration test sends a real HTTP request through the full middleware chain: request ID, `authenticate`, tenant context, rate limit, `requirePermission`, `validate`, controller, service, repository, PostgreSQL. It checks three things: the HTTP answer, the envelope, and the rows in the database.

The rule from the brief of this sprint is strict: **every API in auth, tenancy, fees and payments has integration tests.** Other modules get the three-test minimum. The tables below are the case lists that you paste into P-49.

| Auth and RBAC case | Expected |
|---|---|
| Login with the right password | `200`, access token in the body, refresh token only in an `HttpOnly` cookie |
| Login with a wrong password | `401` with code `UNAUTHENTICATED`. The message does not say which part was wrong. |
| Sixth wrong login within 15 minutes | `429` with code `RATE_LIMITED` |
| Refresh with a valid cookie | New access token and a new refresh cookie. The old refresh token is dead. |
| Reuse of an old refresh token | `401`, and every session of that user is revoked |
| Expired access token | `401` with code `TOKEN_EXPIRED` |
| Token with one changed character | `401` with code `UNAUTHENTICATED` |
| Password reset token used twice | Second use fails |
| OTP after expiry, and after too many wrong tries | Both fail. A new OTP is needed. |
| Teacher calls `POST /payments` | `403` with code `FORBIDDEN` |
| Custom role "Front Desk" with `fees.collect` | `201`. Permissions come from the role, not from the role name. |
| Accountant of campus 1 reads an invoice of campus 2 | `404`, and lists show campus 1 only |
| Starter plan admits student number 51 | `403` with code `PLAN_LIMIT_REACHED` |

| Fees case | Expected |
|---|---|
| Two organizations both create the fee head code `TUITION` | Both succeed. Unique keys are per tenant. |
| The same code twice in one organization | `409` with code `CONFLICT` |
| Structure with Tuition ₹40,000 quarterly | 4 instalments of ₹10,000. Total `40000.00`. |
| Assign a structure to batch 10-A twice | Second call reports 0 new assignments |
| Generate invoices twice for the same instalment | Second run creates 0 invoices |
| Two generations in parallel | No duplicate invoice numbers |
| Late fee job twice on the same date | The late fee does not double |
| Late fee job on a paid invoice | The invoice is unchanged |
| Cancel an invoice without a reason | `400` with code `VALIDATION_ERROR` |
| Money in every response | A string with two decimals, such as `"15000.00"` |

The payments cases are in the example file itself. It is long on purpose. Read it once slowly, because every `it` block is a bug that has happened to some fee system before.

**File: `server/src/modules/payments/payments.test.ts`**

```typescript
import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../lib/prisma';
import { createInvoice, createStudent, createTenant, createUser } from '../../test/factories';
import type { TestTenant, TestUser } from '../../test/factories';
import { api, authHeader } from '../../test/test-app';

const PAYMENTS = '/api/v1/payments';

let org: TestTenant;
let otherOrg: TestTenant;
let accountant: TestUser;
let teacher: TestUser;
let otherAccountant: TestUser;

beforeAll(async () => {
  [org, otherOrg] = await Promise.all([createTenant('SCHOOL'), createTenant('COACHING')]);
  accountant = await createUser(org, 'ACCOUNTANT');
  teacher = await createUser(org, 'TEACHER');
  otherAccountant = await createUser(otherOrg, 'ACCOUNTANT');
});

async function openInvoice(tenant: TestTenant = org, total = '15000.00') {
  const student = await createStudent(tenant);
  const invoice = await createInvoice(tenant, student, { total });
  return { student, invoice };
}

function cashBody(studentId: string, feeInvoiceId: string, amount: string) {
  return {
    studentId,
    mode: 'CASH',
    amount,
    allocations: [{ feeInvoiceId, amount }],
    note: 'Paid by Sunita Devi',
  };
}

function collect(
  user: TestUser,
  tenant: TestTenant,
  body: object,
  key: string | null = randomUUID(),
) {
  const req = api().post(PAYMENTS).set(authHeader(user)).set('X-Campus-Id', tenant.campus.id);
  return (key ? req.set('Idempotency-Key', key) : req).send(body);
}

function readInvoice(id: string, tenant: TestTenant = org) {
  return tenant.run(() => db.feeInvoice.findFirstOrThrow({ where: { id } }));
}

describe('POST /api/v1/payments', () => {
  it('collects cash, issues one receipt and marks the invoice paid', async () => {
    const { student, invoice } = await openInvoice();
    const res = await collect(accountant, org, cashBody(student.id, invoice.id, '15000.00'));

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.receiptNo).toEqual(expect.any(String));

    const fresh = await readInvoice(invoice.id);
    expect(fresh.status).toBe('PAID');
    expect(fresh.amountPaid.toFixed(2)).toBe('15000.00');
    expect(fresh.balance.toFixed(2)).toBe('0.00');
  });

  it('returns the same receipt when the key is replayed', async () => {
    const { student, invoice } = await openInvoice();
    const key = randomUUID();
    const body = cashBody(student.id, invoice.id, '15000.00');

    const first = await collect(accountant, org, body, key);
    const second = await collect(accountant, org, body, key);

    expect(second.status).toBeLessThan(300);
    expect(second.body.data.receiptNo).toBe(first.body.data.receiptNo);
    const rows = await org.run(() => db.payment.count({ where: { idempotencyKey: key } }));
    expect(rows).toBe(1);
  });

  it('rejects a request without an Idempotency-Key', async () => {
    const { student, invoice } = await openInvoice();
    const res = await collect(accountant, org, cashBody(student.id, invoice.id, '15000.00'), null);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.requestId).toMatch(/^req_/);
  });

  it('accepts a part payment and keeps the balance right', async () => {
    const { student, invoice } = await openInvoice();
    const res = await collect(accountant, org, cashBody(student.id, invoice.id, '5000.00'));

    expect(res.status).toBe(201);
    const fresh = await readInvoice(invoice.id);
    expect(fresh.status).toBe('PARTIALLY_PAID');
    expect(fresh.balance.toFixed(2)).toBe('10000.00');
  });

  it('rejects more than the invoice balance', async () => {
    const { student, invoice } = await openInvoice(org, '10000.00');
    const res = await collect(accountant, org, cashBody(student.id, invoice.id, '20000.00'));

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
    expect((await readInvoice(invoice.id)).amountPaid.toFixed(2)).toBe('0.00');
  });

  it('rejects allocations that do not add up to the amount', async () => {
    const { student, invoice } = await openInvoice();
    const body = { ...cashBody(student.id, invoice.id, '15000.00'), amount: '15000.01' };
    const res = await collect(accountant, org, body);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('lets only one of two parallel collections win', async () => {
    const { student, invoice } = await openInvoice();
    const body = cashBody(student.id, invoice.id, '15000.00');

    const results = await Promise.all([
      collect(accountant, org, body),
      collect(accountant, org, body),
    ]);

    expect(results.map((res) => res.status).sort()).toEqual([201, 422]);
    expect((await readInvoice(invoice.id)).amountPaid.toFixed(2)).toBe('15000.00');
  });

  it('keeps receipt numbers gap-free, even after a failed attempt', async () => {
    const fresh = await createTenant('SCHOOL');
    const clerk = await createUser(fresh, 'ACCOUNTANT');
    const numbers: number[] = [];

    for (const amount of ['1000.00', '99999.00', '1000.00']) {
      const { student, invoice } = await openInvoice(fresh, '1000.00');
      const res = await collect(clerk, fresh, cashBody(student.id, invoice.id, amount));
      if (res.status === 201) {
        numbers.push(Number(/(\d+)$/.exec(res.body.data.receiptNo)?.[1]));
      }
    }

    expect(numbers).toHaveLength(2);
    expect(numbers[1]).toBe((numbers[0] ?? 0) + 1);
  });

  it('refuses a teacher', async () => {
    const { student, invoice } = await openInvoice();
    const res = await collect(teacher, org, cashBody(student.id, invoice.id, '15000.00'));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('refuses a request without a token', async () => {
    const res = await api().post(PAYMENTS).set('Idempotency-Key', randomUUID()).send({});

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('answers 404 for a student of another organization and creates nothing', async () => {
    const { student, invoice } = await openInvoice();
    const key = randomUUID();
    const body = cashBody(student.id, invoice.id, '15000.00');
    const res = await collect(otherAccountant, otherOrg, body, key);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    const rows = await otherOrg.run(() => db.payment.count({ where: { idempotencyKey: key } }));
    expect(rows).toBe(0);
    expect((await readInvoice(invoice.id)).status).toBe('ISSUED');
  });
});
```

How to read this file:

- **Each test builds its own student and invoice.** No test depends on what another test left behind. You can run one test alone with `-t`.
- **Each test checks the database, not only the response.** A `201` with a wrong balance is still a bug. `readInvoice()` runs inside the tenant context, exactly like a repository.
- **The parallel test is the row-lock test.** `Promise.all` fires two requests at the same moment with two different keys. One must win with `201`. The other must see the locked, already paid invoice and get `422`. If both get `201`, the `FOR UPDATE` lock from *Coding Standards* is missing.
- **The gap-free test sends a failing request in the middle.** A failed payment must not burn a receipt number, because auditors ask about gaps.
- **Status codes and error codes are both checked.** The client shows messages by `error.code`, so the code is part of the contract.

## The mandatory tenant isolation suite

This suite is not optional, and it is never cut. It proves one sentence: **organization A can never read or write organization B through any module.** *Daily Plan: Days 1 to 14* builds the first version with P-06. Every module day adds to it. Day 51 closes the gaps.

Isolation is tested at three levels, because each level can fail alone.

| Level | What it proves | How | File |
|---|---|---|---|
| Prisma extension | `db` adds `organizationId` to every read, write, count and aggregate | Call `db` inside `runWithTenant()` for A and for B | `server/src/lib/prisma.test.ts` (P-06) |
| PostgreSQL RLS | The database hides foreign rows even from raw SQL | Raw query as `eduflow_app` with the wrong `app.current_org` | In the matrix file below |
| HTTP API | No endpoint leaks, whatever the controller does | Create in A, call every verb as B | The matrix file, plus `<module>.isolation.test.ts` for special routes |

The matrix file below is the heart of the suite. Each resource is one row in `CASES`. The same nine checks run for every row. When you add a module, you add a row.

**File: `server/src/test/tenant-isolation.test.ts`**

```typescript
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../lib/prisma';
import { createInvoice, createStudent, createTenant, createUser, uniqueTag } from './factories';
import type { TestTenant, TestUser } from './factories';
import { api, authHeader } from './test-app';

interface IsolationCase {
  model: string; // Prisma model name, used by the guard test at the bottom
  path: string; // collection path under /api/v1
  seed: (tenant: TestTenant) => Promise<{ id: string }>;
  patch?: Record<string, unknown>; // a valid PATCH body, when the resource has PATCH
  canDelete?: boolean;
}

const CASES: IsolationCase[] = [
  {
    model: 'Student',
    path: '/students',
    seed: (tenant) => createStudent(tenant),
    patch: { firstName: 'Changed' },
    canDelete: true,
  },
  {
    model: 'FeeInvoice',
    path: '/fee-invoices',
    seed: async (tenant) => createInvoice(tenant, await createStudent(tenant)),
  },
  // One row per resource: campuses, batches, subjects, teachers, fee-heads,
  // fee-structures, payments, receipts, discounts, attendance-sessions, notifications ...
];

let orgA: TestTenant;
let orgB: TestTenant;
let adminA: TestUser;
let adminB: TestUser;

beforeAll(async () => {
  [orgA, orgB] = await Promise.all([createTenant('SCHOOL'), createTenant('COACHING')]);
  [adminA, adminB] = await Promise.all([
    createUser(orgA, 'ORG_ADMIN'),
    createUser(orgB, 'ORG_ADMIN'),
  ]);
});

describe.each(CASES)('tenant isolation: $path', (c) => {
  let id: string;
  const url = (suffix = ''): string => `/api/v1${c.path}${suffix}`;

  beforeAll(async () => {
    id = (await c.seed(orgA)).id;
  });

  it('control: organization A reads its own record', async () => {
    const res = await api().get(url(`/${id}`)).set(authHeader(adminA));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  it('organization B gets 404 on read by id', async () => {
    const res = await api().get(url(`/${id}`)).set(authHeader(adminB));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('organization B never sees the record in a list', async () => {
    const res = await api().get(url('?limit=100')).set(authHeader(adminB));
    expect(res.status).toBe(200);
    const ids = (res.body.data as { id: string }[]).map((row) => row.id);
    expect(ids).not.toContain(id);
  });

  it.runIf(c.patch !== undefined)('organization B cannot update it', async () => {
    const res = await api().patch(url(`/${id}`)).set(authHeader(adminB)).send(c.patch ?? {});
    expect(res.status).toBe(404);

    const check = await api().get(url(`/${id}`)).set(authHeader(adminA));
    for (const [field, value] of Object.entries(c.patch ?? {})) {
      expect(check.body.data[field]).not.toBe(value);
    }
  });

  it.runIf(c.canDelete === true)('organization B cannot delete it', async () => {
    const res = await api().delete(url(`/${id}`)).set(authHeader(adminB));
    expect(res.status).toBe(404);

    const check = await api().get(url(`/${id}`)).set(authHeader(adminA));
    expect(check.status).toBe(200);
  });
});

describe('writes that point at another organization', () => {
  it('B cannot collect a payment against a student and invoice of A', async () => {
    const studentA = await createStudent(orgA);
    const invoiceA = await createInvoice(orgA, studentA);
    const accountantB = await createUser(orgB, 'ACCOUNTANT');

    const res = await api()
      .post('/api/v1/payments')
      .set(authHeader(accountantB))
      .set('Idempotency-Key', randomUUID())
      .send({
        studentId: studentA.id,
        mode: 'CASH',
        amount: '15000.00',
        allocations: [{ feeInvoiceId: invoiceA.id, amount: '15000.00' }],
      });

    expect(res.status).toBe(404);
    const fresh = await orgA.run(() =>
      db.feeInvoice.findFirstOrThrow({ where: { id: invoiceA.id } }),
    );
    expect(fresh.amountPaid.toFixed(2)).toBe('0.00');
  });

  it('an organizationId in the body never moves a record into A', async () => {
    const marker = `Marker${uniqueTag()}`;
    const res = await api()
      .post('/api/v1/students')
      .set(authHeader(adminB))
      .send({
        organizationId: orgA.org.id,
        firstName: marker,
        dateOfBirth: '2012-05-14',
        gender: 'MALE',
        admissionDate: '2027-04-01',
      });

    expect([201, 400]).toContain(res.status); // stripped or rejected, both are safe
    const inA = await orgA.run(() => db.student.count({ where: { firstName: marker } }));
    expect(inA).toBe(0);
  });

  it('X-Organization-Id from a normal admin is ignored', async () => {
    const studentA = await createStudent(orgA);
    const res = await api()
      .get(`/api/v1/students/${studentA.id}`)
      .set(authHeader(adminB))
      .set('X-Organization-Id', orgA.org.id);

    expect(res.status).toBe(404);
  });
});

describe('PostgreSQL row-level security', () => {
  // The one place outside lib/prisma.ts where a plain client is allowed.
  // The test must go around the tenant extension to prove the database blocks the row.
  const rawDb = new PrismaClient();

  afterAll(async () => {
    await rawDb.$disconnect();
  });

  it('runs as a role that cannot bypass RLS', async () => {
    const rows = await rawDb.$queryRaw<{ rolsuper: boolean; rolbypassrls: boolean }[]>`
      SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`;
    expect(rows).toEqual([{ rolsuper: false, rolbypassrls: false }]);
  });

  it('hides a student of A when the session is set to B', async () => {
    const studentA = await createStudent(orgA);
    const rows = await rawDb.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_org', ${orgB.org.id}, true)`;
      return tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM students WHERE id = ${studentA.id}::uuid`;
    });
    expect(rows).toHaveLength(0);
  });

  it('returns nothing at all when no organization is set', async () => {
    const rows = await rawDb.$queryRaw<{ total: bigint }[]>`
      SELECT count(*) AS total FROM students`;
    expect(rows[0]?.total).toBe(0n);
  });
});

describe('guard: no tenant model is forgotten', () => {
  // Models of later phases and child tables without an endpoint of their own.
  // Claude Code fills this list once, on Day 51. Every name needs a reason in a comment.
  const NOT_EXPOSED_YET = new Set<string>([]);

  it('every model with organizationId is in CASES or has a written reason', () => {
    const tenantModels = Prisma.dmmf.datamodel.models
      .filter((model) => model.fields.some((field) => field.name === 'organizationId'))
      .map((model) => model.name);
    const covered = new Set(CASES.map((c) => c.model));
    const missing = tenantModels.filter(
      (name) => !covered.has(name) && !NOT_EXPOSED_YET.has(name),
    );
    expect(missing).toEqual([]);
  });
});
```

What each part protects you from:

| Part | The mistake it catches |
|---|---|
| Control test | A wrong path also answers `404`. Without the control, a typo in `path` makes every isolation test pass for the wrong reason. |
| Read, list, update, delete as B | A repository function that uses a plain client, a raw query without `organization_id`, or a `findUnique` that the extension missed |
| Payment against A's invoice | The subtle one. B's own endpoint is fine, but a foreign ID inside the body reaches A's rows. Test it for every body field that holds an ID. |
| `organizationId` in the body | Mass assignment: the server trusts a field that the user must never set |
| `X-Organization-Id` | The Super Admin header works for a normal admin |
| Role check | Somebody pointed the tests at the owner role, so RLS was silently skipped |
| Raw SQL tests | The Prisma extension has a bug, and only PostgreSQL stands between two schools |
| Guard test | A new table arrives in the schema and nobody adds an isolation test |

> **Rule:** Other tenants get `404`, not `403`. A `403` says "this record exists, but it is not yours". That already leaks a fact. A `404` says nothing.

The matrix covers standard REST shapes. Special routes get their own file next to the module, as *Daily Plan: Days 29 to 42* asks: `fees.isolation.test.ts` for bulk invoice generation and the dues report, `attendance.isolation.test.ts` for bulk marking. The pattern stays the same: create in A, call as B, expect `404` or an empty result, then prove that A's data did not change.

Inside one organization there is a second wall: **own-data scope**. Two parents of the same batch must not see each other's children. Add a small suite for every Parent Portal endpoint: create Sunita Devi with Aarav Sharma, create a second parent with a second student, and call each endpoint with the other child's ID. Expect `404`.

### Break it on purpose

A green isolation suite proves nothing until you have seen it turn red. Do this on Day 51, and again after every big refactor of `lib/prisma.ts`:

1. Create a throwaway branch: `git switch -c tmp/break-isolation`.
2. In one repository file, replace `db` with a plain `new PrismaClient()` for a single query.
3. Run `npx vitest run isolation` inside `server/`. At least one test must fail and name the resource.
4. Put the tenant filter back. Disable one RLS policy in the test database and run again. The raw SQL test must fail.
5. Delete the branch: `git switch main`, then `git branch -D tmp/break-isolation`. Re-run the global setup so the policy comes back.

## Testing webhooks and idempotency

A webhook is an HTTP request that a provider sends to your server when something happens, for example Razorpay saying "payment captured". Idempotency means that doing the same thing twice has the same effect as doing it once. Webhooks need it most, because Razorpay may deliver the same event several times, and the parent's browser may confirm the same payment at the same moment.

EduFlow has four layers of protection. Each layer needs at least one test.

| Layer | Mechanism | Test that proves it |
|---|---|---|
| Counter payment | `Idempotency-Key` header, unique per organization | Replay test in `payments.test.ts` |
| Webhook entry | HMAC signature over the raw body | A wrong signature gets `400` and nothing is queued |
| Webhook queue | BullMQ `jobId` equals the provider's event ID | The same event sent twice gives one job |
| Webhook inbox | `WebhookEvent` has a unique key on `(provider, eventId)` | The same event processed three times gives one row |
| Payment confirm | `Payment` has a unique key on `(gateway, gatewayPaymentId)`, and the confirm function checks status first | Webhook and browser verify in any order give one payment and one receipt |
| Bulk jobs | One invoice per student per instalment, by unique key | Generation run twice creates 0 new invoices |

The test signs the body with the same secret and the same algorithm as Razorpay. So it exercises the real signature check. Nothing is mocked except the network.

**File: `server/src/modules/payments/razorpay-webhook.test.ts`**

```typescript
import { createHmac, randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { env } from '../../config/env';
import { db } from '../../lib/prisma';
import { webhookQueue } from '../../lib/queue';
import {
  createInvoice,
  createPendingOnlineOrder,
  createStudent,
  createTenant,
} from '../../test/factories';
import type { TestTenant } from '../../test/factories';
import { api } from '../../test/test-app';
import { processRazorpayEvent } from './razorpay-webhook.service';

const WEBHOOK = '/api/v1/webhooks/razorpay';
let org: TestTenant;

beforeAll(async () => {
  org = await createTenant('COACHING');
});

function sign(rawBody: string): string {
  return createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
}

function capturedEvent(gatewayOrderId: string, gatewayPaymentId: string, amountPaise: number) {
  return {
    entity: 'event',
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: gatewayPaymentId,
          order_id: gatewayOrderId,
          amount: amountPaise,
          currency: 'INR',
          status: 'captured',
          method: 'upi',
        },
      },
    },
  };
}

function deliver(rawBody: string, signature: string, eventId: string) {
  return api()
    .post(WEBHOOK)
    .set('Content-Type', 'application/json')
    .set('X-Razorpay-Signature', signature)
    .set('X-Razorpay-Event-Id', eventId)
    .send(rawBody); // a string is sent byte for byte, which the signature needs
}

async function pendingOrder() {
  const student = await createStudent(org);
  const invoice = await createInvoice(org, student, { total: '12000.00' });
  const order = await createPendingOnlineOrder(org, student, invoice); // status CREATED
  return { invoice, order };
}

describe('Razorpay webhook', () => {
  it('rejects a wrong signature and queues nothing', async () => {
    const { order } = await pendingOrder();
    const eventId = `evt_${randomUUID()}`;
    const raw = JSON.stringify(capturedEvent(order.gatewayOrderId, `pay_${randomUUID()}`, 1200000));

    const res = await deliver(raw, sign(`${raw} `), eventId);

    expect(res.status).toBe(400);
    expect(await webhookQueue.getJob(eventId)).toBeUndefined();
  });

  it('accepts a valid signature, answers fast and queues one job', async () => {
    const { order } = await pendingOrder();
    const eventId = `evt_${randomUUID()}`;
    const raw = JSON.stringify(capturedEvent(order.gatewayOrderId, `pay_${randomUUID()}`, 1200000));

    const first = await deliver(raw, sign(raw), eventId);
    const second = await deliver(raw, sign(raw), eventId);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const counts = await webhookQueue.getJobCounts('waiting', 'active', 'delayed');
    expect(await webhookQueue.getJob(eventId)).toBeDefined();
    expect(counts.waiting).toBeGreaterThanOrEqual(1);
  });

  it('creates one payment and one receipt when the same event arrives three times', async () => {
    const { invoice, order } = await pendingOrder();
    const eventId = `evt_${randomUUID()}`;
    const gatewayPaymentId = `pay_${randomUUID()}`;
    const event = capturedEvent(order.gatewayOrderId, gatewayPaymentId, 1200000);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await processRazorpayEvent({ eventId, event });
    }

    const payments = await org.run(() => db.payment.count({ where: { gatewayPaymentId } }));
    const payment = await org.run(() =>
      db.payment.findFirstOrThrow({ where: { gatewayPaymentId }, include: { receipt: true } }),
    );
    const fresh = await org.run(() => db.feeInvoice.findFirstOrThrow({ where: { id: invoice.id } }));

    expect(payments).toBe(1);
    expect(payment.status).toBe('SUCCESS');
    expect(payment.receipt?.receiptNo).toEqual(expect.any(String));
    expect(fresh.status).toBe('PAID');
    expect(fresh.balance.toFixed(2)).toBe('0.00');
  });

  it('does not confirm when the paid amount differs from the order', async () => {
    const { invoice, order } = await pendingOrder();
    const event = capturedEvent(order.gatewayOrderId, `pay_${randomUUID()}`, 100);

    await processRazorpayEvent({ eventId: `evt_${randomUUID()}`, event }).catch(() => undefined);

    const fresh = await org.run(() => db.feeInvoice.findFirstOrThrow({ where: { id: invoice.id } }));
    expect(fresh.status).toBe('ISSUED');
    expect(fresh.amountPaid.toFixed(2)).toBe('0.00');
  });
});
```

`createPendingOnlineOrder()` is one more factory. P-26 adds it to `factories.ts`. It writes a `PaymentGatewayAccount` in `TEST` mode and a `PaymentOrder` with status `CREATED`, a unique `gatewayOrderId` and the amount of the invoice. `processRazorpayEvent()` gets no tenant context from the test on purpose. The worker must find the organization from the saved order, as Day 40 of *Daily Plan: Days 29 to 42* requires.

Add these cases to the same file when P-26 is done:

- The webhook arrives before the browser calls verify. Then verify returns the existing receipt and creates nothing.
- The browser verify arrives first. Then the webhook finds a `SUCCESS` payment and changes nothing.
- An event for an unknown order ID is stored as `IGNORED` and answered with `200`. Otherwise Razorpay retries it for hours.
- `payment.failed` marks the order as failed and leaves the invoice open.
- A captured payment for an order of organization A never touches a row of organization B.

> **Tip:** To test a webhook by hand, use a tunnel as Day 40 describes, and press "Resend" on the event in the Razorpay test dashboard three times. The payment list must still show one payment.

## Testing BullMQ jobs

BullMQ workers run code outside the web request: notifications, PDFs, imports, reports, webhooks and the finance jobs. *Folder Structure* sets the rule that makes them testable: a worker file is thin. It reads the job data, opens the tenant context from the `orgId` in the job, and calls one service function. So you test in two steps.

1. **Test the service function directly.** This is where 90% of the job tests live. Call `applyLateFees(orgId, '2027-07-25')` and check the invoices. No queue is involved, so the test is fast and exact.
2. **Test each queue once, end to end.** One test per job family adds a real job to the real queue on Redis database 1, runs the real processor in a real `Worker`, and waits for the result. It proves the wiring: job name, payload shape, tenant context, retry settings.

For step 2, export the processor function separately from the line that starts the worker. Then a test can import the function without starting a second worker by accident.

| Job family | Service-level tests | Queue-level test |
|---|---|---|
| Notifications | Template renders. Opt-out is respected. Starter plan sends no WhatsApp. Wallet at zero gives `FAILED` with a reason. | One event in, one mocked `sendWhatsAppTemplate` call out |
| PDFs | Receipt snapshot has the right lines and totals | Job completes and stores a file ID. S3 is mocked. |
| Imports | Good Excel file, bad rows, dry run saves nothing, plan limit stops at the limit | A 40-row file completes with a progress count |
| Reports | Totals equal the sum of the source rows | Job completes and returns a download reference |
| Webhooks | The idempotency tests above | The same `jobId` added twice gives one job |
| Finance | Late fee once per day, paid invoices untouched, bulk invoices idempotent | The example below |

**File: `server/src/jobs/finance.worker.test.ts`**

```typescript
import { Prisma } from '@prisma/client';
import { QueueEvents, Worker } from 'bullmq';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../lib/prisma';
import { financeQueue } from '../lib/queue';
import { redis } from '../lib/redis';
import { createInvoice, createStudent, createTenant } from '../test/factories';
import type { TestTenant } from '../test/factories';
import { processFinanceJob } from './finance.worker';

let org: TestTenant;
let events: QueueEvents;
let worker: Worker;

beforeAll(async () => {
  org = await createTenant('SCHOOL');
  await org.run(() =>
    db.lateFeeRule.create({
      data: {
        organizationId: org.org.id,
        name: 'Rs 50 per day',
        calculation: 'FIXED_PER_DAY',
        amount: new Prisma.Decimal('50.00'),
        currency: 'INR',
        graceDays: 5,
        maxAmount: new Prisma.Decimal('500.00'),
        isDefault: true,
      },
    }),
  );
  events = new QueueEvents(financeQueue.name, { connection: redis.duplicate() });
  await events.waitUntilReady();
  worker = new Worker(financeQueue.name, processFinanceJob, { connection: redis.duplicate() });
});

afterAll(async () => {
  await worker.close();
  await events.close();
});

async function runLateFeeJob(asOfDate: string): Promise<void> {
  const job = await financeQueue.add('apply-late-fees', { orgId: org.org.id, asOfDate });
  await job.waitUntilFinished(events, 15_000);
}

describe('finance worker: apply-late-fees', () => {
  it('applies the late fee once, however often the job runs that day', async () => {
    const student = await createStudent(org);
    const invoice = await createInvoice(org, student, { total: '12000.00', dueDate: '2027-07-10' });

    await runLateFeeJob('2027-07-25');
    await runLateFeeJob('2027-07-25');

    const fresh = await org.run(() => db.feeInvoice.findFirstOrThrow({ where: { id: invoice.id } }));
    expect(fresh.lateFee.toFixed(2)).toBe('500.00');
    expect(fresh.total.toFixed(2)).toBe('12500.00');
    expect(fresh.balance.toFixed(2)).toBe('12500.00');
  });

  it('never touches an invoice of another organization', async () => {
    const other = await createTenant('COACHING');
    const student = await createStudent(other);
    const invoice = await createInvoice(other, student, { dueDate: '2027-07-10' });

    await runLateFeeJob('2027-07-25'); // the job carries the orgId of "org", not of "other"

    const fresh = await other.run(() =>
      db.feeInvoice.findFirstOrThrow({ where: { id: invoice.id } }),
    );
    expect(fresh.lateFee.toFixed(2)).toBe('0.00');
  });
});
```

Four practical rules for job tests:

- **Redis database 1.** If the dev worker from `npm run dev:worker` listened on the same Redis database, it would steal the test job. The `/1` in the test `REDIS_URL` prevents that.
- **No fake timers around BullMQ.** Vitest's fake timers freeze the timers that BullMQ and the Redis client need. Pass dates as job data instead.
- **Do not test the schedule.** Whether the job fires at 00:30 India time is BullMQ's business. You test what the job does when it fires. Check the repeat pattern once by eye in `jobs/schedulers.ts`.
- **Test the retry path at the service level.** Make the mocked provider fail once, call the service twice, and check that the parent gets one message, not two.

## End-to-end tests for the eight critical flows

An end-to-end test opens a real browser, clicks real buttons and reads the real screen. It is the only test that proves the whole chain works: Next.js, the API client, the Express API, PostgreSQL, Redis, the PDF worker and S3. It is also the slowest and the most fragile kind of test. So you write eight of them, not eighty.

The rule: **a flow earns a Playwright test only if a broken flow stops money or stops a school day.** Everything else is covered by integration tests and by your own eyes.

| ID | Flow | Who | What it proves | Min |
|---|---|---|---|---|
| E2E-01 | Signup and onboarding | New owner | A stranger can create an institute and reach the dashboard | 2 |
| E2E-02 | Login and RBAC | Accountant, Teacher | The right menu for the right role; `/fees` is blocked for a teacher | 1 |
| E2E-03 | Add a student | Org Admin | Admission form saves, admission number appears in the list | 1 |
| E2E-04 | Mark attendance | Teacher | A batch can be marked and the count is right | 1 |
| E2E-05 | Create an invoice | Accountant | Fee structure to invoice, status `ISSUED`, amount `12000.00` | 1 |
| E2E-06 | Collect fee and receipt | Accountant | Cash collection, receipt PDF downloads, invoice turns `PAID` | 2 |
| E2E-07 | Online payment | Parent | Razorpay test checkout returns and the invoice closes | 2 |
| E2E-08 | Parent sees the receipt | Parent (phone) | OTP login, own child only, receipt opens on a phone screen | 2 |

Six flows exist by Day 55 (E2E-01 to E2E-06). E2E-07 and E2E-08 follow when the Parent Portal and Razorpay are live in staging. Total run time stays under 8 minutes, or you will stop running them.

**Figure: When each kind of test runs**

```mermaid
flowchart TD
  A["You save a file"] --> B["Vitest watch runs the unit tests of that file"]
  B --> C["Before commit: lint and typecheck by the Git hook"]
  C --> D["Pull request: lint, typecheck, test, build on GitHub"]
  D -- "red" --> E["Fix it. The merge button stays locked."]
  D -- "green" --> F["Squash merge into main"]
  F --> G["Automatic deploy to staging"]
  G --> H["Playwright: the eight critical flows"]
  H --> I["Manual checklist: 25 checks, 30 minutes"]
  I --> J["Tag the release and deploy to production"]
  J --> K["Smoke test on production: login, one invoice, one receipt"]
```

Each stage is cheaper than the one below it. A bug caught in the first box costs one minute. The same bug caught in the last box costs an evening and a phone call from Rajesh Sharma.

### Playwright configuration

**File: `client/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

// Local run: npm run dev in client and server first. CI and staging set E2E_BASE_URL.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // the flows share one staging organization
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    actionTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'parent-phone',
      testMatch: /parent-.*\.spec\.ts/,
      use: { ...devices['Pixel 5'] },
    },
  ],
});
```

- `trace: 'on-first-retry'` records a full time-travel trace only when a test fails once. Open it with `npx playwright show-trace`. You see every click, every network call and the screen at each step. This one line saves hours.
- `locale` and `timezoneId` are fixed. Without them a CI machine in UTC formats `10-07-2027` differently and your date check fails for no reason.
- `workers: 1` and `fullyParallel: false` keep the flows in order. Eight flows do not need parallel speed, and parallel browsers fighting over the same student make tests flaky.
- The `parent-phone` project runs only the parent flows, in a phone-sized viewport. That is your mobile coverage.

### Fixtures: login once, seed fresh data

E2E tests fail for a silly reason if they reuse data: the invoice from yesterday is already paid. So each run seeds its own invoice through the API before the browser starts.

**File: `client/e2e/fixtures.ts`**

```typescript
import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const API = process.env.E2E_API_URL ?? 'http://localhost:4000/api/v1';

export const USERS = {
  admin: { email: 'rajesh@bright-future.test', password: 'Pilot@12345' },
  accountant: { email: 'suresh@bright-future.test', password: 'Pilot@12345' },
  teacher: { email: 'priya@bright-future.test', password: 'Pilot@12345' },
};

export async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

async function token(request: APIRequestContext, user: { email: string; password: string }) {
  const res = await request.post(`${API}/auth/login`, { data: user });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).data.accessToken as string;
}

/** Creates one student and one open invoice, so the flow can run again tomorrow. */
export async function seedOpenInvoice(request: APIRequestContext, total = '12000.00') {
  const accessToken = await token(request, USERS.admin);
  const headers = { Authorization: `Bearer ${accessToken}` };
  const lastName = `Sharma E2E ${Date.now().toString().slice(-6)}`;

  const student = await request.post(`${API}/students`, {
    headers,
    data: {
      firstName: 'Aarav',
      lastName,
      dateOfBirth: '2012-05-14',
      gender: 'MALE',
      admissionDate: '2027-04-01',
    },
  });
  const studentId = (await student.json()).data.id as string;

  const invoice = await request.post(`${API}/fee-invoices`, {
    headers,
    data: { studentId, title: 'Tuition Q2', dueDate: '2027-07-10', total },
  });
  return { studentId, studentName: `Aarav ${lastName}`, invoice: (await invoice.json()).data };
}
```

> **Note:** Assumption: the staging demo organization holds the three users above with a fixed pilot password, created by the P-58 demo seed. Real institute passwords never appear in a test file. The staging users belong to a demo organization that no customer uses.

### Example: the collect-fee flow

**File: `client/e2e/collect-fee.spec.ts`**

```typescript
import { expect, test } from '@playwright/test';
import { login, seedOpenInvoice, USERS } from './fixtures';

test.describe('E2E-06 collect fee at the counter', () => {
  test('collects Rs 12,000 cash, prints a receipt and closes the invoice', async ({
    page,
    request,
  }) => {
    const { studentName, invoice } = await seedOpenInvoice(request, '12000.00');
    await login(page, USERS.accountant);

    await page.getByRole('link', { name: 'Fees' }).click();
    await page.getByRole('link', { name: 'Collect Fee' }).click();

    await page.getByRole('combobox', { name: 'Student' }).click();
    await page.getByPlaceholder('Search students').fill(studentName);
    await page.getByRole('option', { name: new RegExp(studentName) }).click();

    const row = page.getByRole('row', { name: new RegExp(invoice.invoiceNo) });
    await expect(row).toContainText('12,000');
    await row.getByRole('checkbox').check();

    await page.getByLabel('Amount').fill('12000');
    await page.getByRole('radio', { name: 'Cash' }).check();

    // Start listening BEFORE the click, or the download event is missed.
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Collect & Print Receipt' }).click();

    await expect(page.getByText('Payment collected')).toBeVisible();
    const receipt = await downloadPromise;
    expect(receipt.suggestedFilename()).toMatch(/\.pdf$/);

    await page.getByRole('link', { name: 'Invoices' }).click();
    await page.getByPlaceholder('Search').fill(invoice.invoiceNo);
    await expect(page.getByRole('row', { name: new RegExp(invoice.invoiceNo) })).toContainText(
      'Paid',
    );
  });
});
```

Six habits that keep E2E tests from becoming a daily nuisance:

- **Find elements the way a human does.** `getByRole('button', { name: 'Collect & Print Receipt' })` reads like the screen. A CSS selector such as `.btn-primary-2` breaks the day you change Tailwind classes. Add `data-testid` only where no label exists.
- **Never write `waitForTimeout`.** Playwright's `expect` waits by itself until the element appears. A fixed `sleep(2000)` is either too short on a slow morning or wasted time on a fast one.
- **Assert the end state, not the click.** "The invoice row says Paid" is the promise to the customer. "The button was clicked" is not.
- **One flow, one file, one test.** When E2E-06 turns red you know exactly which promise broke.
- **Re-runnable data.** The seed helper gives every run a fresh invoice. Without it, the second run finds a paid invoice and fails.
- **Trace first, code second.** When a flow fails in CI, download the trace artifact and watch it before you change one line.

> **Warning:** Never point Playwright at production. It creates students, invoices and payments. Staging only, against the demo organization. The only production test is the manual smoke test after a deploy.

## Coverage targets by area

Coverage is the share of your code lines that ran at least once during the tests. It is a smoke alarm, not a safety certificate. A line can run and still be wrong. So EduFlow sets a high bar where mistakes cost money, a normal bar elsewhere, and no bar at all on the screen layer.

| Area | Folders | Lines, functions, statements | Branches |
|---|---|---|---|
| Money | `modules/{fees,payments,discounts}`, `lib/money.ts` | 90% | 85% |
| Auth and tenancy | `modules/auth`, `middleware/{auth,tenant,rbac,idempotency}.ts` | 90% | 85% |
| Tenant plumbing | `lib/prisma.ts`, `lib/tenant-context.ts` | 90% | 85% |
| Every other server file | `src/**` | 70% | 60% |
| Shared package | `shared/src/**` | 80% | 70% |
| Background workers | `jobs/**` | 70% (through their services) | 60% |
| Client UI | `client/**` | No number. Eight E2E flows plus the manual checklist. | Not measured |

These numbers are already written into `server/vitest.config.ts` above, in the `thresholds` block. Thresholds only run when coverage runs, so CI uses `npm run test:coverage -w server`, not `npm run test`. A file group below its bar turns the build red with a clear message.

Why no coverage number for the client? React screens are mostly markup, state and shadcn/ui components. Testing them with a unit test runner gives a nice number and finds almost no real bug. The eight browser flows find the real ones.

> **Warning:** Two ways to fake coverage, both easy and both useless. First, a test with no `expect` at the end: the lines run, nothing is checked. Second, a test that only checks `res.status === 200` and never looks at the amount. Read your money tests for both patterns on Day 51.

Your weekly coverage habit takes ten minutes:

1. Run `npm run test:coverage -w server`.
2. Open `server/coverage/index.html` in the browser.
3. Sort by the lowest percentage, but look only at `fees`, `payments`, `discounts`, `auth` and `middleware`.
4. Open the reddest file. Red lines are branches that no test has ever taken. Usually they are the error paths: a refund with no payment, a discount larger than the invoice.
5. Add one case per red branch that can hurt a customer. Ignore red lines in log statements and type guards.

When a file genuinely cannot reach 90%, you have two honest options: move it out of the coverage `include` list with a one-line comment saying why, or split the logic out into a pure function and test that. Lowering a threshold is allowed only in its own pull request, with the reason in the description. "Lowered to make CI green" is not a reason.

## Tests in continuous integration

Continuous integration (CI) means the machine runs your checks on every pull request, so a tired evening cannot push a broken `main`. The full pipeline with all its jobs lives in *Docker and CI/CD* and is generated by P-55. Only the test job belongs here.

CI needs a real PostgreSQL 16 and a real Redis 7. GitHub Actions gives them as service containers: small databases that live for the length of one job.

**File: `.github/workflows/ci.yml` (the test job)**

```yaml
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: eduflow
          POSTGRES_PASSWORD: eduflow
          POSTGRES_DB: eduflow_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U eduflow"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      NODE_ENV: test
      DATABASE_URL: postgresql://eduflow_app:eduflow_app@localhost:5432/eduflow_test
      DATABASE_OWNER_URL: postgresql://eduflow:eduflow@localhost:5432/eduflow_test
      REDIS_URL: redis://localhost:6379/1
      JWT_ACCESS_SECRET: ci-only-access-secret-0123456789abcdef
      JWT_REFRESH_SECRET: ci-only-refresh-secret-0123456789abcdef
      RAZORPAY_WEBHOOK_SECRET: test-webhook-secret
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: Generate the Prisma client
        run: npx prisma generate --schema prisma/schema
        working-directory: server
      - name: Unit, integration and isolation tests with coverage
        run: npm run test:coverage -w server
      - name: Shared package tests
        run: npm run test -w shared
      - name: Keep the coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: server-coverage
          path: server/coverage/
          retention-days: 7
```

Four things make this job work without any extra setup step:

- **No `.env.test` in CI.** The file is not in Git, so `existsSync('.env.test')` is false and `process.loadEnvFile()` is skipped. The `env:` block above is the whole configuration.
- **The global setup does the database work.** It creates the `eduflow_app` role, runs `prisma migrate deploy` on the empty CI database and seeds the reference data. Nothing is duplicated in the YAML.
- **Migrations are replayed from zero on every run.** That is a free extra check: a migration that only works on your laptop fails here.
- **Every provider is mocked**, so the job needs no secrets. Only dummy values. A CI job that needs a real Razorpay key is a CI job waiting to leak one.

| Check | Runs on | Blocks the merge | Typical time |
|---|---|---|---|
| `lint` | Every pull request | Yes | 40 s |
| `typecheck` | Every pull request | Yes | 60 s |
| `test` | Every pull request | Yes | 4 to 6 min |
| `build` | Every pull request | Yes | 3 min |
| `pr-title` | Every pull request | Yes | 30 s |
| Playwright flows | Push to `main`, after the staging deploy | No at first, yes from the first hire | 8 min |
| k6 load test | By hand, and on a monthly schedule | No | 15 min |

The GitHub settings that turn these into a wall are in *Git Workflow*: require a pull request, require status checks, require branches to be up to date. Switch the `test` check on in Week 8, exactly as that chapter says.

> **Rule:** A flaky test (one that passes and fails with no code change) is a bug in the test. You get one day to fix it. If you cannot, delete it and write a GitHub issue. A suite you no longer trust is worse than no suite, because you will start merging red.

Two habits keep the CI minutes small, which matters because GitHub Actions minutes are free only up to a limit on a private repository. Use `cache: npm` in `setup-node`, and keep the browser download out of the pull-request job. Playwright browsers are installed only in the staging workflow, with `npx playwright install --with-deps chromium`.

## Manual checks before every release

Machines cannot judge whether a receipt looks like a real receipt, whether a Hindi sentence sounds right, or whether a parent can reach the pay button with her thumb. You can, in 30 minutes, on staging, before every release. Do it with a phone in one hand and a printer nearby.

Run the list top to bottom. Any failed item stops the release unless it is cosmetic and written down.

| Area | Check | Pass when |
|---|---|---|
| Login | Wrong password on purpose | A plain message appears, no error page, no stack trace |
| Login | Log out, then press the browser back button | You land on the login page, not on old data |
| RBAC | Log in as Priya Nair (teacher) | No Fees and no Settings in the sidebar |
| RBAC | Open `/fees/collect` as the teacher | A clear "You do not have access" screen |
| Students | Search `BF-2027-0142`, then open page 2 | The right student appears, paging keeps the filter |
| Students | Save the admission form with empty required fields | Errors sit under the right fields, in simple English |
| Students | A name in Devanagari script and a 60-character name | Both show fully in the list, the profile and the PDF |
| Attendance | Mark a batch on a phone at 360 px width | Every button is reachable, no sideways scrolling |
| Fees | Amounts on every screen | Two decimals and Indian grouping, for example ₹1,20,000.00 |
| Fees | Collect a part payment of ₹5,000 on a ₹12,000 invoice | Balance shows ₹7,000, status shows Partially Paid |
| Fees | Press the collect button twice quickly | One receipt only, the second click is ignored |
| Fees | Browser back after collecting, then reload | No second payment is created |
| Receipt | Open the receipt PDF | Logo, receipt number, date, amount in words, GST line |
| Receipt | Print the receipt on A5 paper | Nothing is cut off at the edges |
| Report card | Open a report card PDF | Marks, grade, remark, no text overflowing its box |
| WhatsApp | Send a fee reminder to your own phone | Line breaks are right, no `{{1}}` left, the link opens |
| Email | Open the same reminder in Gmail on a phone | Sender name, subject, unsubscribe link all correct |
| Parent | OTP login on a real Android phone on mobile data | OTP arrives under 30 seconds, fee page loads under 3 seconds |
| Parent | Open the child list as Sunita Devi | Only her own child is listed |
| Empty state | A brand-new institute with zero students | A helpful screen with a next step, not a blank table |
| Error state | Stop the API, then reload a list | "Cannot reach the server" with a retry button |
| Loading | Open a slow list on a throttled connection | Skeletons appear, buttons stay disabled until it loads |
| Import | Upload a real 200-row Excel file from a pilot | Correct count, clear row-level errors, nothing half-saved |
| Dates | Any date on screen and in a PDF | Format `10-07-2027`, in the organization timezone |
| Release | Read the release notes against the merged pull requests | Every user-visible change is listed |

> **Tip:** Keep the list in `docs/testing/release-checklist.md` and tick it inside the release pull request. When a manual check catches the same bug twice, that check has earned an automated test. Move it up the pyramid and delete the manual step.

## User acceptance testing with the pilot institutes

User acceptance testing (UAT) means the customer, not the builder, decides whether the software works. Your pilots run from Day 45 (18 November 2026) to Day 60. Five friendly institutes use EduFlow free, with real students and real money. Two of them should be coaching institutes like Sharma Classes, because coaching is the wedge.

Book one 60-minute UAT session per pilot in the week of Day 48 to Day 54. Sit next to the user or share a screen. Record the screen with permission. Bring nothing but the task list and a notebook.

### The session script, word for word

**Opening (2 minutes).** Say exactly this, then stop talking:

> **Example:** "Rajesh ji, aaj main aapko sikhane nahi aaya hoon. Aaj main sirf dekhna chahta hoon ki aap software kaise use karte hain. Agar kahin atak jaayein, to yeh software ki galti hai, aapki nahi. Main 30 second tak help nahi karunga, kyunki mujhe dekhna hai ki screen samajh aa rahi hai ya nahi. Aap jo soch rahe hain, wo bolte rahiye." Today I have not come to teach you. I only want to watch how you use the software. If you get stuck, it is the software's fault, not yours. I will not help for 30 seconds, because I need to see whether the screen explains itself. Please keep saying out loud what you are thinking.

**The seven tasks (45 minutes).** Give the goal, never the steps. Read one task, then be quiet.

| # | Task as you say it | You are watching for |
|---|---|---|
| 1 | "Ek naya student add kijiye: Aarav Sharma, class 10-A." | Do they find Admissions without help? |
| 2 | "Aaj ki attendance mark kijiye, batch M1, do students absent." | Time to mark 30 students |
| 3 | "Aarav ke liye Tuition Q2 ka invoice banaiye, Rs 12,000." | Is the fee structure step understood? |
| 4 | "Sunita Devi Rs 12,000 cash de rahi hain. Receipt dijiye." | The money moment. Any hesitation is a redesign. |
| 5 | "Pichle hafte ka collection report nikaliye." | Do they find reports, and is the number believable? |
| 6 | "Aarav ke parent ko fee reminder WhatsApp bhejiye." | Do they trust that the message was sent? |
| 7 | "Ab apne phone se, parent ki tarah, wahi receipt dekhiye." | Parent Portal on their own phone, their own network |

**Closing (10 minutes).** Three questions, always in this order:

1. "Aaj kaun sa part sabse confusing tha?" Which part was the most confusing today?
2. "Aaj bhi aap kaun sa kaam register ya WhatsApp pe karte hain jo EduFlow ko karna chahiye?" What do you still do on paper or WhatsApp that EduFlow should do?
3. "Agar kal EduFlow band ho jaaye, to sabse zyada kis cheez ki kami lagegi?" If EduFlow stopped tomorrow, what would you miss most?

The third question is the honest one. The answer names your real value. If the answer is "nothing", you have a positioning problem, not a bug.

### Rules for the person watching

1. **Count seconds of silence, not opinions.** A user who stares at a screen for 12 seconds has found a design bug, whatever he says afterwards.
2. **Never explain during a task.** Help only after 30 seconds, and write "helped" against that task. A helped task is a failed task.
3. **Write the user's exact words.** "Yeh receipt wala button kahan hai?" is better data than "navigation unclear".
4. **Do not defend the product.** Say "thank you, I will note that" and move on. Arguing ends the honesty.
5. **Separate bugs from wishes.** A wrong total is a bug. A second logo on the receipt is a wish for after Day 60.

### The feedback form

Send this as a Google Form on WhatsApp within one hour of the session, while the memory is fresh. Keep it under 3 minutes to fill.

| Field | Type | Why it is there |
|---|---|---|
| Institute and person filling it | Text | Ties feedback to a real context |
| Date of the session | Date | Lets you compare before and after a fix |
| Ease of each of the 7 tasks | 1 to 5 scale | Finds the one screen to redesign first |
| "Which task felt slowest?" | Single choice of the 7 tasks | Where to spend performance work |
| "What confused you most?" | Long text | The redesign list |
| "What is still on paper or WhatsApp?" | Long text | The next module to build |
| "Any wrong number, name or amount today?" | Long text | Money and data bugs, highest priority |
| "Would you pay ₹2,499 per month after the pilot?" | Yes / No / Not sure, plus why | The only real product-market signal |
| "Would you recommend EduFlow to another owner?" | 0 to 10 | Your first NPS reading against the canon target of 50+ |

### Pass marks for the pilot

| Measure | Pass mark | If it fails |
|---|---|---|
| Tasks finished with no help | 5 of 7 per user | Redesign the two worst screens before Day 60 |
| Collect fee finished alone | Every accountant, no exception | Stop feature work. This is the product. |
| Average ease of collect fee | 4.0 or higher | Cut clicks, not words |
| Open P1 bugs at the end of the pilot | Zero | No public launch in January |
| Pilots who say they would pay | 3 of 5 | Talk to the two who said no before you build more |
| Recommend score | 7 or higher from 4 of 5 pilots | Fix the reason named in the form, then ask again |

## Bug severity and triage

A bug report without a level gets fixed in the order you happen to read it. That is how a wrong receipt waits behind a logo change. EduFlow uses the same three levels as *Daily Plan: Days 43 to 60* and *60-Day Roadmap Overview and Weekly Milestones*, with one extra class above them.

| Level | Meaning | Example | First reply | Fix by |
|---|---|---|---|---|
| Leak | Another tenant's data, or a security hole | Sharma Classes sees a Bright Future invoice | 15 minutes | Same day. Follow the incident process. |
| P1 | Wrong money, wrong data, or nobody can log in | Receipt prints ₹1,200 for a ₹12,000 payment | 30 minutes | Same day, before any feature work |
| P2 | A feature is broken but a way around exists | The CSV export fails, the screen still shows the data | 2 hours | This week, in the daily bug slot |
| P3 | Cosmetic issue, wish, or a new idea | "Can the receipt carry our second logo?" | Same day | After Day 60, on the backlog |

A Leak is not only a bug. It is an incident with legal duties under the DPDP Act, and the response runbook is in *Monitoring, Backups and Incident Response*. What belongs here is the testing part: a Leak is never closed until a test in `tenant-isolation.test.ts` fails on the old code and passes on the new one.

The triage habit takes 15 minutes each morning, before the build hours:

1. **Reply first, fix later.** Every reporter hears "received, checking" within the times above.
2. **Reproduce before you judge.** Half of all P1 reports are a training gap, not a bug. Watch the user repeat it on a call, or open the Sentry trace.
3. **Set the level from the effect, not from the anger.** A shouting customer with a cosmetic issue is still P3. A calm message saying "receipt amount looks odd" is P1.
4. **Write the failing test before the fix.** This is the rule that keeps the suite growing where it matters.
5. **Give P2 a way around, in writing.** "Use the PDF export today, the CSV comes on Thursday" turns an angry hour into a patient week.
6. **Review the P3 list every Sunday** in the weekly review. Two or three P3 items in the same area usually mean one real design problem.

> **Founder note:** "Bug ka level customer ki awaaz se nahi, uske asar se tay hota hai." The level of a bug comes from its effect, not from the volume of the person reporting it.

## The regression list

A regression is a bug that comes back after it was fixed. Nothing destroys trust faster, because the customer already told you about it once. The defence is one sentence long: **no bug is closed without a test that failed before the fix.**

The loop takes 20 minutes and never changes:

1. Reproduce the bug in a test, at the lowest level that shows it. A wrong late fee is a unit test. A wrong `404` is an API test.
2. Run it and watch it fail with the exact wrong value in the message. A test that passes before the fix is testing the wrong thing.
3. Fix the code.
4. Run it again, watch it pass, then run the whole suite once.
5. Name the test after the bug's effect and add one line to the regression list.

Keep the list in `docs/testing/regression.md` in the repository. One line per closed P1, P2 or Leak. It costs a minute and it is the first file your first hire should read.

| Bug | What went wrong | Test that now guards it |
|---|---|---|
| BUG-014 | The receipt PDF printed the batch name twice | `receipt-pdf.test.ts`: renders one batch line |
| BUG-021 | A late fee was charged on an already paid invoice | `late-fee.test.ts`: returns zero when nothing is left to pay |
| BUG-027 | A double click at the counter created two receipts | `payments.test.ts`: returns the same receipt when replayed |
| BUG-033 | A parent opened another parent's receipt by changing the URL | `parent-portal.isolation.test.ts`: other child gives 404 |
| BUG-041 | A repeated Razorpay event created a second receipt | `razorpay-webhook.test.ts`: same event three times, one payment |
| BUG-052 | Invoice generation ran twice and doubled the invoices | `fees.isolation.test.ts`: second run creates zero invoices |
| BUG-058 | The dashboard counted another campus's collection | `dashboard.test.ts`: totals respect X-Campus-Id |

> **Rule:** Never delete a regression test to make the build green. If it fails, either the bug is back or the behaviour changed on purpose. In the second case, change the test in the same pull request as the code, and say why in the description.

## Load testing with k6

A load test asks one question: what happens when 200 people use EduFlow at the same second? k6 is a small tool that sends that traffic from your laptop or from CI and reports how slow things got. The targets come from the canon and from *Non-Functional Requirements*: **200 concurrent users, p95 under 500 ms, under 1% failed requests.**

"Concurrent" means at the same moment, not per day. Estimate: 200 concurrent users is the fee-day peak at roughly 300 to 500 paying institutes. The reasoning is simple. On the first working day of a month, assume one accountant per institute collects fees for about two hours, so about one institute in three is active at any moment, and each active institute adds one accountant plus a few parents who open the portal after the reminder goes out. Measure the real ratio with PostHog once you pass 50 paying institutes, and replace this estimate.

### When to run it

| When | Why |
|---|---|
| Day 57 to Day 59, once, on staging | Before the pilot institutes bring real money in |
| December 2026, before the January 2027 public launch | Launch traffic plus the buying season |
| March 2027, before the April session starts | Admission and fee season is the yearly peak |
| At 100 and at 500 paying organizations | The scaling steps in *Stage 1* and *Stage 2* |
| After any change to invoice generation, the dashboard or list queries | These three touch the most rows |
| Never during school hours, never on production | A load test on production is an outage you paid for |

Do not run load tests in Week 1 to Week 7. With zero customers, a slow endpoint is a guess. With a real schema, real indexes and real data volume, it is a measurement.

### The script

Seed a dedicated load organization on staging first: 5,000 students, 20,000 open invoices, 20 accountant users. P-58 generates it. Then run the script below.

**File: `load/fee-day.js`**

```javascript
import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const BASE = __ENV.BASE_URL || 'https://api-staging.eduflow.app/api/v1';

// load/users.json: [{ "email": "...", "password": "..." }] for 20 staging accountants.
const users = new SharedArray('users', () => JSON.parse(open('./users.json')));

export const options = {
  scenarios: {
    fee_day: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 }, // warm up, fill the connection pool
        { duration: '3m', target: 200 }, // ramp to the target
        { duration: '5m', target: 200 }, // hold: this part decides pass or fail
        { duration: '2m', target: 0 }, // ramp down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    'http_req_duration{name:collect-fee}': ['p(95)<800'],
    checks: ['rate>0.99'],
  },
};

export function setup() {
  return users.map((user) => {
    const res = http.post(`${BASE}/auth/login`, JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'login' },
    });
    if (res.status !== 200) fail(`login failed for ${user.email}: ${res.status}`);
    return { token: res.json('data.accessToken'), campusId: res.json('data.campusId') };
  });
}

export default function (sessions) {
  const session = sessions[__VU % sessions.length];
  const headers = {
    Authorization: `Bearer ${session.token}`,
    'X-Campus-Id': session.campusId,
    'Content-Type': 'application/json',
  };

  const dashboard = http.get(`${BASE}/dashboard/summary`, {
    headers,
    tags: { name: 'dashboard' },
  });
  check(dashboard, { 'dashboard 200': (r) => r.status === 200 });
  sleep(2);

  const students = http.get(`${BASE}/students?limit=20&q=sharma`, {
    headers,
    tags: { name: 'student-list' },
  });
  check(students, { 'student list 200': (r) => r.status === 200 });
  sleep(3);

  // Each virtual user works on its own page, so two of them rarely pick one invoice.
  const page = (__VU % 50) + 1;
  const dues = http.get(`${BASE}/fee-invoices?status=ISSUED&limit=20&page=${page}`, {
    headers,
    tags: { name: 'due-list' },
  });
  check(dues, { 'due list 200': (r) => r.status === 200 });
  sleep(2);

  // One round in ten collects money. A counter reads far more often than it writes.
  if (__ITER % 10 === 0) {
    const invoice = dues.json(`data.${__ITER % 20}`);
    if (invoice) {
      const body = JSON.stringify({
        studentId: invoice.studentId,
        mode: 'CASH',
        amount: invoice.balance,
        allocations: [{ feeInvoiceId: invoice.id, amount: invoice.balance }],
      });
      const paid = http.post(`${BASE}/payments`, body, {
        headers: { ...headers, 'Idempotency-Key': `k6-${__VU}-${__ITER}-${Date.now()}` },
        tags: { name: 'collect-fee' },
      });
      check(paid, { 'collect fee 201': (r) => r.status === 201 });
    }
  }
  sleep(1);
}
```

The `sleep()` calls are think time. Without them, 200 virtual users hammer the API far harder than 200 real accountants ever would, and you end up optimising a load that will never exist.

Run it with Docker, which needs no installation on Windows:

```bash
docker run --rm -i -v "${PWD}/load:/scripts" \
  -e BASE_URL=https://api-staging.eduflow.app/api/v1 \
  grafana/k6 run /scripts/fee-day.js
```

### Reading the result

k6 prints a summary table. Six numbers matter.

| Metric | What it means | Your target |
|---|---|---|
| `http_req_duration p(95)` | 95 of 100 requests were faster than this | Under 500 ms |
| `http_req_duration p(99)` | The slowest 1 of 100 requests | Under 1,500 ms |
| `http_req_failed` | Share of requests that failed | Under 1% |
| `checks` | Share of checks that passed | Above 99% |
| `http_reqs` per second | Throughput the system handled | Write it down, compare next run |
| `iteration_duration` | One full user round, including think time | Stable from start to end |

A red threshold line and a non-zero exit code mean the run failed. Treat that exactly like a failed test.

| What you see | Usual cause | What to do |
|---|---|---|
| p95 fine, p99 terrible | One slow query on some rows only | Find it with `pg_stat_statements`, add an index. Use P-53. |
| Everything slows down together | Database CPU at 100%, or the pool is full | Add indexes, cache the dashboard, raise the pool |
| Only the dashboard is slow | Live counts over big tables | Use the daily snapshot table from the *Dashboard* module |
| `500` errors above 150 users | "too many connections" from PostgreSQL | Set `connection_limit` in the database URL, plan PgBouncer |
| `429` errors | Your own rate limit is doing its job | Fix the test, not the limit. Real users are spread out. |
| Memory grows until the API restarts | PDF work inside the web process | Move it to a BullMQ worker, as *Background Jobs* requires |

> **Warning:** A load test writes real rows. Run it against the load organization on staging, then delete that organization afterwards. Never point it at a pilot institute's data, and never at production.

## Key takeaways

- Test by risk, not by coverage number. Money, auth and tenant isolation get every case. Layout gets your eyes.
- Never mock the database. Your worst bugs live in PostgreSQL rules, row locks and RLS policies that a fake client does not have.
- The two-organization isolation matrix is the one suite you never cut. Break it on purpose once, so you know it is real.
- Eight Playwright flows are enough end-to-end tests. They must stay under 8 minutes, or you will stop running them.
- Coverage targets are 90% for money and auth, 70% elsewhere, nothing for the UI. A threshold is lowered only in its own pull request, with a reason.
- Every closed P1 bug leaves a failing-then-passing test behind. That list is your regression wall.
- Pilot UAT is a watching exercise, not a demo. Give the goal, stay silent for 30 seconds, and write the user's exact words.
- Load test only when the schema and the data are real: Day 57 to 59, before the January launch, and before each fee season.
