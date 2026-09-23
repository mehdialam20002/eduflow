# Environments and Configuration

**In simple words:** An environment is one complete running copy of EduFlow: the web app, the API, the worker, the database and the keys for outside services. EduFlow has three of them: your laptop (local), a rehearsal copy (staging) and the real system (production). This chapter fixes what differs between them, where every setting and secret lives, how the domain and the login cookie work across subdomains, and how a change travels from one environment to the next. When this is right, a test message never reaches a real parent, and a real fee payment never lands in a test account.

## The three environments at a glance

The code is the same in all three environments. Only the configuration changes. Configuration means every value that lives outside the code: URLs, keys, modes and switches. The same Git commit must run on your laptop, on staging and on production without one edited line.

An environment variable is a named value that the operating system or the hosting platform hands to a program when it starts, for example `DATABASE_URL`. If you ever write `if (hostname === 'app.eduflow.app')` in code, configuration has leaked into the code. Move it into an environment variable.

| Item | Local | Staging | Production |
|---|---|---|---|
| Purpose | Build and debug with Claude Code | Rehearse every release, run end-to-end tests, give sales demos | Serve pilots and paying customers |
| Web URL | `http://localhost:3000` | `https://staging.eduflow.app` | `https://app.eduflow.app` |
| Tenant URLs | None. One host for all demo tenants. | `sharma-classes.staging.eduflow.app`, `bright-future.staging.eduflow.app` | `{slug}.eduflow.app` |
| API URL | `http://localhost:4000/api/v1` | `https://api.staging.eduflow.app/api/v1` | `https://api.eduflow.app/api/v1` |
| Hosting | Your laptop. PostgreSQL, Redis and Mailpit in Docker. | Vercel, plus the Railway environment `staging` | Vercel, plus the Railway environment `production` |
| Data | Seed data. Reset any time. | Seed and demo data (P-58) and one test organization. Never real data. | Real customer data, plus one internal demo organization |
| Who can access | You and Claude Code | You, testers you invite, prospects during a demo | Customers. You as `SUPER_ADMIN`. The database: only you. |
| Deploy trigger | None. You run `npm run dev`. | Every merge to `main`, after CI is green | A version tag such as `v0.6.0`, pushed by you in the deploy window |
| Razorpay | Test mode | Test mode, own webhook | Live mode |
| WhatsApp | Off by default. The text goes to the log. | Meta test number, allow-listed phones only | Live business number |
| Amazon SES | Not used. Mailpit catches all email. | Sandbox | Production access |
| S3 bucket | `eduflow-dev-uploads` (or MinIO) | `eduflow-staging-uploads` | `eduflow-prod-uploads` |
| Sentry | Off | Environment `staging` | Environment `production` |
| Log level | `debug` | `info` | `info` |

> **Rule:** Staging is a rehearsal of production, not a second laptop. It uses the same Dockerfile, the same Node.js version, the same PostgreSQL major version and the same two database roles. Only keys, URLs and data differ.

**Figure: Production hosts and who calls whom**

```mermaid
flowchart TD
  U["Browser: staff, parent, student"] --> V["app.eduflow.app and<br/>slug.eduflow.app on Vercel"]
  U -- "API calls with cookie" --> W["api.eduflow.app/api/v1<br/>Railway API service"]
  X["Razorpay and Meta webhooks"] --> W
  W --> Y["PostgreSQL 16"]
  W --> Z["Redis 7"]
  Z --> Q["BullMQ worker"]
  Q --> Y
  Q --> R["WhatsApp, SES, MSG91"]
  U -- "pre-signed URL" --> S["S3 private bucket"]
  W --> S
```

The browser loads pages from Vercel and then talks to the API directly. Webhooks (calls that Razorpay or Meta make to your server when something happens) reach the API without a browser. Staging has the same picture with `staging.eduflow.app` and `api.staging.eduflow.app`. The local picture is in *Local Development Setup*.

### Two variables name the environment

`NODE_ENV` is a Node.js convention, and libraries read it. Express and React switch on their fast paths when it says `production`. Next.js even sets it by itself: `next dev` forces `development` and `next build` forces `production`. So `NODE_ENV` cannot tell staging from production. Both must say `production`, or staging stops being a true rehearsal.

EduFlow therefore adds its own variable, `APP_ENV`. Your code uses only `APP_ENV` for environment decisions.

| Where the code runs | `NODE_ENV` | `APP_ENV` |
|---|---|---|
| Laptop, `npm run dev` | `development` | `local` |
| Vitest on the laptop and in GitHub Actions | `test` | `test` |
| Staging | `production` | `staging` |
| Production | `production` | `production` |

### When each environment is born

| When | What you create | Where the steps are |
|---|---|---|
| Day 2 (Tue 6 Oct 2026) | Local: Docker Compose, `.env` files, Zod-checked config (P-03) | *Local Development Setup* |
| Days 43 and 44 (16 and 17 Nov 2026) | The first hosted environment, for the pilot. It later becomes production. | *Deploy on Vercel and Railway* |
| Day 54 (Fri 27 Nov 2026) | Staging next to it, the deploy pipeline, tenant subdomains (P-55, P-56) | *Docker and CI/CD* |
| Before the public launch (January 2027) | Live switches: Razorpay live keys, WhatsApp live number, final DNS and email records | This chapter, "Going live" checklist below |

Three environments are enough for a solo founder. A fourth one (often called QA or UAT) means a fourth set of secrets, bills and drift. Vercel already builds a preview of the client for every pull request. Use it to look at screens. It cannot log in, and the cookie section explains why.

## Integration modes per environment

Every outside service that EduFlow uses has a safe mode and a real mode. The safe mode moves no money and reaches no real parent.

| Service | Local | Staging | Production | What decides the mode |
|---|---|---|---|---|
| Razorpay | Test keys (`rzp_test_`) | Test keys, own webhook | Live keys (`rzp_live_`) | The key itself |
| Stripe (Phase 4, P-32) | Test keys (`sk_test_`) | Test keys | Live keys (`sk_live_`) | The key itself |
| WhatsApp Cloud API | Log only. Meta test number while you build P-29. | Meta test number, up to 5 allow-listed phones | Verified business number | Token, phone number ID and `MESSAGING_MODE` |
| Amazon SES | Not used. Mailpit over SMTP. | Sandbox region | Region with production access | `MAIL_TRANSPORT`, `SES_REGION`, `MESSAGING_MODE` |
| MSG91 SMS (Phase 2, P-31) | No sending | Allow-listed phones only | Live, DLT templates | `MESSAGING_MODE` |
| AWS S3 | Dev bucket or MinIO | Staging bucket | Production bucket | Bucket name and its own IAM key |
| Sentry | Off (empty DSN) | On, tagged `staging` | On, tagged `production` | `SENTRY_DSN` and `APP_ENV` |
| PostHog | Off (empty key) | Off | On, for staff roles only | `NEXT_PUBLIC_POSTHOG_KEY` |

> **Note:** The limits of outside services in this section are based on the providers' public documentation as of September 2026. Check the provider's dashboard before you rely on a number.

PostHog stays off for parents and students in every environment. The DPDP Act does not allow tracking of children, and a parent's phone is often the child's phone.

### Razorpay: test mode and live mode

The Razorpay dashboard has a switch between Test Mode and Live Mode. Each mode has its own API keys, its own webhooks and its own payment list. A test key can never move real money, and a live key can never create a test payment.

1. Local and staging use test keys. In test mode you pay with Razorpay's test cards, or with the test UPI address `success@razorpay`.
2. Create one webhook per environment in the dashboard. Staging: test mode, URL of the staging API webhook route (for example `/api/v1/webhooks/razorpay`), its own `RAZORPAY_WEBHOOK_SECRET`. Production: live mode, production URL, another secret.
3. Your laptop has no public address, so Razorpay cannot call it. Use a tunnel tool when you test webhooks locally. The steps are in *Local Development Setup*.
4. Live keys appear only after Razorpay has approved your business documents (KYC). Start that process in Week 6. See *Company Setup, Legal and Finance Basics*.

The keys in the environment belong to EduFlow's own Razorpay account. It collects subscription money, and it is the test account on local and staging. The keys of each institute, which collect parents' fee payments, are not environment variables. They sit behind `payment_gateway_accounts.secret_ref`, as the PRD chapter *Integrations and Webhooks* defines. That table has a `mode` column (`TEST` or `LIVE`). On local and staging the API must refuse to save or use an account with mode `LIVE`.

### WhatsApp: test number and live number

Meta gives every new app a free test phone number inside a test WhatsApp Business Account. It can send only to phones that you add to an allow list in the Meta dashboard, and only to a handful of them (5 at the time of writing). That is exactly what staging needs.

| Item | Staging | Production |
|---|---|---|
| Sender | Meta test number | Your own business number with a verified display name |
| Recipients | Allow-listed phones only: yours and your testers' | Any parent who has given consent |
| Templates | The sample template `hello_world`, plus your templates once approved | Approved templates only |
| Token | System User token of the test setup | System User token of the live setup |
| Webhook | Staging API, own verify token | Production API, own verify token |

The temporary token on Meta's "API Setup" page dies after about one day. Never put it on staging or production. Create a System User in Meta Business settings and generate a long-lived token for it.

### Amazon SES: sandbox and production access

Every new SES account starts in the sandbox. In the sandbox you can send only to email addresses that you have verified, at most 200 emails in 24 hours, one per second. The sandbox status is per AWS account and per region.

This gives a clean split with one AWS account:

| Environment | How email leaves | Why |
|---|---|---|
| Local | `MAIL_TRANSPORT=smtp` to Mailpit on port 1025 | Nothing can reach a real inbox |
| Staging | SES in `ap-southeast-1` (Singapore), which stays in the sandbox for ever | Even a bug cannot email a real parent |
| Production | SES in `ap-south-1` (Mumbai) with production access | Real delivery, Indian region |

Request production access for `ap-south-1` by Day 40. The pilot starts on Day 45, and staff invitations and password resets need email from the first day. In the AWS console open SES, then "Account dashboard", then "Request production access". Use this text:

```text
Use case: transactional email only, for EduFlow, a school and coaching
institute management SaaS. We send login invitations, password resets,
fee receipts and fee reminders to staff and parents of our customer
institutes. Recipients are added by the institute and have a business
relationship with it. We do not buy lists and we send no marketing
mail. Expected volume: under 2,000 emails per day in the first six
months. Bounces and complaints are received through SES notifications
and the address is suppressed automatically after one hard bounce or
one complaint. Every email names the institute and carries a contact
address.
```

Verify the sender identity in both regions. Staging needs it in Singapore, and production needs it in Mumbai. The DNS records are in the DNS section below.

### One switch that protects real people

Keys alone are not enough. One day a production phone number will sit in a staging table by mistake. So the worker checks one more variable before any message leaves.

| `MESSAGING_MODE` | Used on | What the worker does |
|---|---|---|
| `log` | Local, tests | Sends nothing on WhatsApp and SMS. Writes the rendered message to the log. Email goes to Mailpit. |
| `allowlist` | Staging, and local while you build P-29 | Sends only when the phone or email is in `MESSAGING_ALLOWLIST`. Everything else is logged and marked as skipped. |
| `live` | Production only | Sends to everyone, under the consent and credit rules of the PRD |

Parent login by OTP (one-time password) gets the same care. On staging, the Playwright tests need a fixed OTP. It works only for phones in `OTP_TEST_NUMBERS`, and only when `APP_ENV` is not `production`. The config file below refuses to start production when either OTP test variable has a value.

### Going live checklist

- [ ] Razorpay KYC approved. Live keys generated. Live webhook created with its own secret.
- [ ] Production variables hold `rzp_live_` keys. Staging and local still hold `rzp_test_` keys.
- [ ] WhatsApp business number registered, display name approved, templates approved, System User token stored.
- [ ] SES production access granted in `ap-south-1`. DKIM, custom MAIL FROM and DMARC records verified.
- [ ] `MESSAGING_MODE=live` on production only. `OTP_TEST_NUMBERS` and `OTP_TEST_CODE` empty on production.
- [ ] One real payment of ₹10 made on production from your own card and refunded. One real WhatsApp message and one real email received on your own phone.

## Environment variable catalog

This catalog groups the variables by concern and shows how each value changes per environment. The flat A-to-Z list with every command is in *Environment Variables and Command Reference*. If the two ever disagree on a name, fix both in the same pull request.

Four rules apply to every variable:

1. **One reader.** On the server, only `server/src/config/env.ts` reads `process.env`. On the client, only `client/src/lib/env.ts` does. *Coding Standards* explains why.
2. **Fail fast.** A missing or wrong value stops the program at start with the variable's name. It never fails later in front of a parent.
3. **Public or secret.** A name that starts with `NEXT_PUBLIC_` is copied into the JavaScript that every visitor downloads. It can never hold a secret.
4. **Three places.** A new variable is added to the Zod schema, to `.env.example` and to the appendix in the same commit.

"Used by" tells you which service needs the variable: the API and the worker on Railway, the client on Vercel, or a pipeline step.

### Core runtime

| Variable | Used by | Secret | Local | Staging | Production |
|---|---|---|---|---|---|
| `NODE_ENV` | API, worker, client | No | `development` | `production` | `production` |
| `APP_ENV` | API, worker | No | `local` | `staging` | `production` |
| `APP_VERSION` | API, worker | No | `dev` | Commit SHA, set by the pipeline | Release tag, for example `v0.6.0` |
| `PORT` | API | No | `4000` | Set by Railway | Set by Railway |
| `LOG_LEVEL` | API, worker | No | `debug` | `info` | `info` |
| `TRUST_PROXY` | API | No | `0` | `1` | `1` |

Railway puts its own `PORT` value into each service, and the API must listen on it. `TRUST_PROXY=1` tells Express that one proxy (Railway's edge) sits in front of it. Without it, `req.ip` shows the proxy's address, and the login rate limit of 5 attempts per 15 minutes counts all users as one.

### Database, Redis and queues

| Variable | Used by | Secret | Local | Staging | Production |
|---|---|---|---|---|---|
| `DATABASE_URL` | API, worker | Yes | Docker PostgreSQL, role `eduflow_app` | Staging PostgreSQL, role `eduflow_app` | Production PostgreSQL, role `eduflow_app` |
| `DATABASE_ADMIN_URL` | Migration step, seed, backup job | Yes | Docker PostgreSQL, owner role | Staging owner role | Production owner role. Never in a file on the laptop. |
| `REDIS_URL` | API, worker | Yes | `redis://localhost:6379` | Staging Redis | Production Redis |
| `QUEUE_PREFIX` | API, worker | No | `eduflow-local` | `eduflow-stg` | `eduflow-prod` |

The API process never reads `DATABASE_ADMIN_URL`. It is not in the Zod schema. Only the migration step uses it, like this:

```bash
# Runs in the pipeline before the new API version starts. Never "migrate dev".
cd server
DATABASE_URL="$DATABASE_ADMIN_URL" npx prisma migrate deploy
```

The Prisma schema reads one variable, `DATABASE_URL`. The line above hands the owner URL to Prisma for this one command only. The running API keeps the `eduflow_app` URL, so Row-Level Security stays active.

### Auth, cookies and encryption

| Variable | Used by | Secret | Local | Staging | Production |
|---|---|---|---|---|---|
| `JWT_ACCESS_SECRET` | API | Yes | Any 32+ characters | Own random value | Own random value |
| `JWT_REFRESH_SECRET` | API | Yes | Any 32+ characters | Own random value | Own random value |
| `REFRESH_COOKIE_NAME` | API | No | `ef_rt_local` | `ef_rt_stg` | `ef_rt` |
| `COOKIE_DOMAIN` | API | No | Empty | `.staging.eduflow.app` | `.eduflow.app` |
| `COOKIE_SECURE` | API | No | `false` | `true` | `true` |
| `FIELD_ENCRYPTION_KEY` | API, worker | Yes | Own random key | Own random key | Own random key, with a second copy in the password manager |
| `OTP_TEST_NUMBERS` | API | No | Your demo phones | Phones used by Playwright | Must be empty |
| `OTP_TEST_CODE` | API | Yes | `123456` | A 6-digit code you choose | Must be empty |

`FIELD_ENCRYPTION_KEY` is the key for the columns that the schema stores encrypted with AES-256-GCM, for example `national_id_encrypted` and `medical_notes_encrypted`. The variable name is an assumption of this Blueprint. If the PRD chapter *Security Architecture* names it differently, use that name. Lose this key and those columns are gone for ever, so it is the one secret with a written backup.

### URLs and CORS

| Variable | Used by | Secret | Local | Staging | Production |
|---|---|---|---|---|---|
| `ROOT_DOMAIN` | API | No | `localhost` | `staging.eduflow.app` | `eduflow.app` |
| `APP_URL` | API, worker | No | `http://localhost:3000` | `https://staging.eduflow.app` | `https://app.eduflow.app` |
| `API_URL` | API | No | `http://localhost:4000` | `https://api.staging.eduflow.app` | `https://api.eduflow.app` |
| `CORS_EXTRA_ORIGINS` | API | No | `http://localhost:3000` | `https://staging.eduflow.app` | Empty |

The worker uses `APP_URL` to build links inside messages, for example the "Pay now" link in a fee reminder. A wrong value here sends parents of Sharma Classes to staging. Check it twice.

### Files on S3

| Variable | Used by | Secret | Local | Staging | Production |
|---|---|---|---|---|---|
| `AWS_REGION` | API, worker | No | `ap-south-1` | `ap-south-1` | `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | API, worker | Yes | Key of IAM user `eduflow-dev` | Key of `eduflow-staging` | Key of `eduflow-prod` |
| `AWS_SECRET_ACCESS_KEY` | API, worker | Yes | Same user | Same user | Same user |
| `S3_BUCKET_UPLOADS` | API, worker | No | `eduflow-dev-uploads` | `eduflow-staging-uploads` | `eduflow-prod-uploads` |
| `S3_BUCKET_BACKUPS` | Backup job | No | Empty | Empty | `eduflow-prod-backups` |

Each IAM user (an AWS login for a program) may touch only its own bucket. Then a staging bug cannot read a production file, even with a wrong bucket name. Bucket names are unique across all AWS customers. If a name is taken, add a short suffix and keep the pattern.

### Payments

| Variable | Used by | Secret | Local | Staging | Production |
|---|---|---|---|---|---|
| `RAZORPAY_KEY_ID` | API | No | `rzp_test_...` | `rzp_test_...` | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | API | Yes | Test secret | Test secret | Live secret |
| `RAZORPAY_WEBHOOK_SECRET` | API | Yes | Own random value | Own random value | Own random value |
| `STRIPE_SECRET_KEY` | API | Yes | Empty until P-32 | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | API | Yes | Empty until P-32 | `whsec_...` of the test endpoint | `whsec_...` of the live endpoint |

The Razorpay and Stripe variables are optional in the schema. Until live keys exist, leave them empty on production. Subscription billing then stays off, which is correct during the free pilot.

### WhatsApp

| Variable | Used by | Secret | Local | Staging | Production |
|---|---|---|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` | API, worker | Yes | Empty, or test token | System User token, test setup | System User token, live setup |
| `WHATSAPP_PHONE_NUMBER_ID` | Worker | No | Empty, or test number ID | ID of the Meta test number | ID of the live number |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Worker | No | Empty | Test account ID | Live account ID |
| `WHATSAPP_APP_SECRET` | API | Yes | Empty | App secret of the Meta app | App secret of the Meta app |
| `WHATSAPP_VERIFY_TOKEN` | API | Yes | Empty | Random string you choose | Another random string |

The API checks the signature of every Meta webhook with `WHATSAPP_APP_SECRET`. Meta sends `WHATSAPP_VERIFY_TOKEN` back once, when you register the webhook URL. These five variables describe EduFlow's own default sender. A number that an institute connects later lives in the `whats_app_accounts` table, not in the environment.

### Email, SMS and the safety switch

| Variable | Used by | Secret | Local | Staging | Production |
|---|---|---|---|---|---|
| `MAIL_TRANSPORT` | Worker | No | `smtp` | `ses` | `ses` |
| `SMTP_HOST`, `SMTP_PORT` | Worker | No | `localhost`, `1025` | Empty | Empty |
| `SES_REGION` | Worker | No | Empty | `ap-southeast-1` | `ap-south-1` |
| `MAIL_FROM` | Worker | No | `EduFlow Local <no-reply@eduflow.app>` | `EduFlow Staging <no-reply@eduflow.app>` | `EduFlow <no-reply@eduflow.app>` |
| `MSG91_AUTH_KEY` | Worker | Yes | Empty | Empty until P-31 | Live key |
| `MSG91_SENDER_ID` | Worker | No | Empty | Empty until P-31 | Your 6-letter DLT header |
| `MESSAGING_MODE` | API, worker | No | `log` | `allowlist` | `live` |
| `MESSAGING_ALLOWLIST` | API, worker | No | Your phone and email | Testers' phones and emails | Empty |

SES uses the same AWS key as S3. Give the staging and production IAM users the permission to send email, and nothing more. DLT template IDs for SMS are data, not configuration. They live with the templates in the database.

### Monitoring, analytics and flags

| Variable | Used by | Secret | Local | Staging | Production |
|---|---|---|---|---|---|
| `SENTRY_DSN` | API, worker | No | Empty | DSN of the server project | Same DSN |
| `SENTRY_AUTH_TOKEN` | Build step only | Yes | Empty | In the build settings | In the build settings |
| `RELEASE_FLAGS_OFF` | API, worker | No | Empty | Empty | Empty, or the kill-switch list |

One Sentry project serves staging and production. The environment tag, taken from `APP_ENV`, keeps them apart, and the release tag comes from `APP_VERSION`.

### Client variables on Vercel

| Variable | Secret | Local | Staging | Production |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_ENV` | No | `local` | `staging` | `production` |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:4000/api/v1` | `https://api.staging.eduflow.app/api/v1` | `https://api.eduflow.app/api/v1` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | No | `localhost` | `staging.eduflow.app` | `eduflow.app` |
| `NEXT_PUBLIC_APP_VERSION` | No | `dev` | Commit SHA | Release tag |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Empty | DSN of the client project | Same DSN |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | Empty | Empty | Project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | Empty | Empty | Host of your PostHog region |

> **Warning:** Next.js copies `NEXT_PUBLIC_` values into the JavaScript files during `next build`. A changed value on Vercel does nothing until you deploy again. For the same reason, one client build cannot serve both staging and production. Each environment gets its own build.

### The complete example files

**File: `server/.env.example`**

```env
# Copy to server/.env and fill in. Never commit server/.env.
# Values here are safe samples for APP_ENV=local.

# --- Core runtime ---
NODE_ENV=development
APP_ENV=local
APP_VERSION=dev
PORT=4000
LOG_LEVEL=debug
TRUST_PROXY=0

# --- Database, Redis, queues ---
# Runtime role (Row-Level Security applies to it)
DATABASE_URL=postgresql://eduflow_app:eduflow_app_local_pw@localhost:5432/eduflow_dev
# Owner role, used only by: prisma migrate, prisma db seed
DATABASE_ADMIN_URL=postgresql://eduflow:eduflow_local_pw@localhost:5432/eduflow_dev
REDIS_URL=redis://localhost:6379
QUEUE_PREFIX=eduflow-local

# --- Auth, cookies, encryption ---
# Generate each with: openssl rand -base64 48
JWT_ACCESS_SECRET=local-only-access-secret-change-me-0123456789
JWT_REFRESH_SECRET=local-only-refresh-secret-change-me-0123456789
REFRESH_COOKIE_NAME=ef_rt_local
COOKIE_DOMAIN=
COOKIE_SECURE=false
# Generate with: openssl rand -base64 32
FIELD_ENCRYPTION_KEY=
OTP_TEST_NUMBERS=+919800000001,+919800000002
OTP_TEST_CODE=123456

# --- URLs and CORS ---
ROOT_DOMAIN=localhost
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
CORS_EXTRA_ORIGINS=http://localhost:3000

# --- Files on S3 ---
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_UPLOADS=eduflow-dev-uploads
S3_BUCKET_BACKUPS=

# --- Payments (test keys only on a laptop) ---
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# --- WhatsApp Cloud API (empty until P-29) ---
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_APP_SECRET=
WHATSAPP_VERIFY_TOKEN=

# --- Email, SMS, safety switch ---
MAIL_TRANSPORT=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
SES_REGION=
MAIL_FROM=EduFlow Local <no-reply@eduflow.app>
MSG91_AUTH_KEY=
MSG91_SENDER_ID=
MESSAGING_MODE=log
MESSAGING_ALLOWLIST=

# --- Monitoring and flags ---
SENTRY_DSN=
RELEASE_FLAGS_OFF=
```

**File: `client/.env.example`**

```env
# Copy to client/.env.local. Every name here is PUBLIC. No secrets, ever.
NEXT_PUBLIC_APP_ENV=local
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_ROOT_DOMAIN=localhost
NEXT_PUBLIC_APP_VERSION=dev
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

### The config module with environment guards

*Coding Standards* shows the small version of `env.ts` with seven variables. This is the full version. The second half is new: guards that make a dangerous mix impossible, for example live payment keys on staging.

**File: `server/src/config/env.ts`**

```typescript
import { z } from 'zod';

// "true"/"false" strings. z.coerce.boolean() is a trap: it turns "false" into true.
const bool = (fallback: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(fallback)
    .transform((value) => value === 'true');

// "a, b ,c" -> ['a', 'b', 'c']. An empty string gives an empty list.
const csv = z
  .string()
  .default('')
  .transform((raw) =>
    raw
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  );

// A line such as "STRIPE_SECRET_KEY=" arrives as ''. Treat it as "not set".
const optional = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_ENV: z.enum(['local', 'test', 'staging', 'production']),
    APP_VERSION: z.string().default('dev'),
    PORT: z.coerce.number().int().default(4000),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),

    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    QUEUE_PREFIX: z.string().min(1),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    REFRESH_COOKIE_NAME: z.string().min(1),
    COOKIE_DOMAIN: z.string().default(''),
    COOKIE_SECURE: bool('true'),
    FIELD_ENCRYPTION_KEY: z.string().min(40),
    OTP_TEST_NUMBERS: csv,
    OTP_TEST_CODE: optional,

    ROOT_DOMAIN: z.string().min(1),
    APP_URL: z.string().url(),
    API_URL: z.string().url(),
    CORS_EXTRA_ORIGINS: csv,

    AWS_REGION: z.string().default('ap-south-1'),
    AWS_ACCESS_KEY_ID: optional,
    AWS_SECRET_ACCESS_KEY: optional,
    S3_BUCKET_UPLOADS: z.string().min(3),
    S3_BUCKET_BACKUPS: optional,

    RAZORPAY_KEY_ID: optional,
    RAZORPAY_KEY_SECRET: optional,
    RAZORPAY_WEBHOOK_SECRET: optional,
    STRIPE_SECRET_KEY: optional,
    STRIPE_WEBHOOK_SECRET: optional,

    WHATSAPP_ACCESS_TOKEN: optional,
    WHATSAPP_PHONE_NUMBER_ID: optional,
    WHATSAPP_BUSINESS_ACCOUNT_ID: optional,
    WHATSAPP_APP_SECRET: optional,
    WHATSAPP_VERIFY_TOKEN: optional,

    MAIL_TRANSPORT: z.enum(['smtp', 'ses']),
    SMTP_HOST: optional,
    SMTP_PORT: z.coerce.number().int().default(1025),
    SES_REGION: optional,
    MAIL_FROM: z.string().min(3),
    MSG91_AUTH_KEY: optional,
    MSG91_SENDER_ID: optional,
    MESSAGING_MODE: z.enum(['log', 'allowlist', 'live']),
    MESSAGING_ALLOWLIST: csv,

    SENTRY_DSN: optional,
    RELEASE_FLAGS_OFF: z.string().default(''),
  })
  .superRefine((value, ctx) => {
    const fail = (name: string, message: string): void => {
      ctx.addIssue({ code: 'custom', path: [name], message });
    };
    const isProduction = value.APP_ENV === 'production';
    const isHosted = isProduction || value.APP_ENV === 'staging';

    if (isHosted && value.NODE_ENV !== 'production') {
      fail('NODE_ENV', 'must be "production" on staging and production');
    }
    if (isHosted && !value.COOKIE_SECURE) {
      fail('COOKIE_SECURE', 'must be true on staging and production');
    }
    if (isHosted && !value.COOKIE_DOMAIN.endsWith(value.ROOT_DOMAIN)) {
      fail('COOKIE_DOMAIN', 'must end with ROOT_DOMAIN');
    }
    if (isHosted && value.MAIL_TRANSPORT !== 'ses') {
      fail('MAIL_TRANSPORT', 'must be "ses" on staging and production');
    }

    // Money: live keys only on production, test keys everywhere else.
    const razorpayPrefix = isProduction ? 'rzp_live_' : 'rzp_test_';
    if (value.RAZORPAY_KEY_ID && !value.RAZORPAY_KEY_ID.startsWith(razorpayPrefix)) {
      fail('RAZORPAY_KEY_ID', `must start with ${razorpayPrefix} in this environment`);
    }
    const stripePrefix = isProduction ? 'sk_live_' : 'sk_test_';
    if (value.STRIPE_SECRET_KEY && !value.STRIPE_SECRET_KEY.startsWith(stripePrefix)) {
      fail('STRIPE_SECRET_KEY', `must start with ${stripePrefix} in this environment`);
    }

    // People: only production may message everyone.
    if (isProduction && value.MESSAGING_MODE !== 'live') {
      fail('MESSAGING_MODE', 'must be "live" on production');
    }
    if (!isProduction && value.MESSAGING_MODE === 'live') {
      fail('MESSAGING_MODE', '"live" is allowed on production only');
    }

    // Login: the fixed test OTP must not exist on production.
    if (isProduction && (value.OTP_TEST_NUMBERS.length > 0 || value.OTP_TEST_CODE)) {
      fail('OTP_TEST_NUMBERS', 'OTP test settings must be empty on production');
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Names and our own guard texts only. Never print a value.
  const problems = parsed.error.issues.map((issue) => {
    const name = issue.path.join('.');
    return issue.code === 'custom' ? `${name} (${issue.message})` : name;
  });
  throw new Error(`Invalid or missing environment variables: ${problems.join(', ')}`);
}

export const env = parsed.data;
```

Test the guards once by hand. Set `APP_ENV=staging` with `MESSAGING_MODE=live` in your local `server/.env` and start the API. It must stop within two seconds and name `MESSAGING_MODE`. Put the values back.

**File: `client/src/lib/env.ts`**

```typescript
import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: z.enum(['local', 'staging', 'production']),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_APP_VERSION: z.string().default('dev'),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
});

// Next.js replaces process.env.NEXT_PUBLIC_X only when the full name is
// written out. A loop over process.env, or destructuring, gives undefined
// in the browser. So every name is listed by hand.
const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
});

if (!parsed.success) {
  const names = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
  throw new Error(`Invalid or missing public environment variables: ${names}`);
}

export const clientEnv = parsed.data;
```

A wrong value on Vercel now breaks `next build`, and the old deployment stays live. That is the behaviour you want.

> **Tip:** Show the environment on screen. When `NEXT_PUBLIC_APP_ENV` is not `production`, render a thin coloured bar at the top: orange with the word STAGING, grey with LOCAL. You will never again enter test data into production by mistake, and a prospect in a demo sees at once that this is a demo system.

## Secrets: where they live and when they change

A secret is a value that gives power over data or money: a database password, a signing key, a payment key, an access token. Everything else (a URL, a log level, a bucket name) is only configuration. Secrets live in exactly five places. The Git repository is not one of them.

| Store | What it holds | Read by | How you set it |
|---|---|---|---|
| `server/.env` and `client/.env.local` on the laptop | Local values only. No staging or production secret. | Your dev processes | You edit the file. Git ignores it. |
| Railway variables, per environment and per service | Every server secret of staging and production | API and worker at start | Railway dashboard, or the CLI's variables command |
| Vercel environment variables (Development, Preview, Production) | Public `NEXT_PUBLIC_` values plus `SENTRY_AUTH_TOKEN` | `next build` | Dashboard, or `vercel env add NAME production` |
| GitHub Actions secrets (repository, and the `production` environment) | Deploy tokens and `DATABASE_ADMIN_URL` for migrations | The pipeline | `gh secret set NAME --env production` |
| Password manager vault "EduFlow production" | A cold copy of every production secret | You, in an emergency | By hand, the same day you create the value |

> **Rule:** A production secret is never written into a file on your laptop. You generate it, paste it into the platform and into the password manager, and close the window. If a secret has ever been in a file, in a chat, in a screenshot or in a Claude Code prompt, it is burned. Rotate it.

Three lines in `.gitignore` do most of the work. The repository ships `.env.example` files with names and dummy values, never real ones.

```gitignore
# Root .gitignore of the monorepo
.env
.env.*
!.env.example
!.env.*.example
*.pem
*.dump
```

Generate values with a tool, never by typing on the keyboard. Typed secrets are short and guessable.

```bash
# Git Bash on Windows, or macOS and Linux
openssl rand -base64 48      # JWT secrets, WhatsApp verify token, webhook secrets
openssl rand -base64 32      # FIELD_ENCRYPTION_KEY

# No openssl on the machine? Node 24 is already installed:
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### Rotation schedule

Rotation means replacing a secret with a new one while everything keeps running. Put these dates in your calendar on Day 60, as repeating entries.

| Secret | Rotate every | Rotate at once when | What users feel |
|---|---|---|---|
| `JWT_ACCESS_SECRET` | 6 months | A laptop is lost, or a tester leaves | Nothing. The client refreshes and gets a new token. |
| `JWT_REFRESH_SECRET` | 12 months | Any suspicion of a leak | Everyone logs in again. Do it Sunday, 22:00 IST. |
| Database password in `DATABASE_URL` | 12 months | A contractor's access ends | A restart of API and worker, about one minute |
| `RAZORPAY_KEY_SECRET`, webhook secret | 12 months | Leak, or a Razorpay alert | Regenerate in the dashboard, update, resend one test webhook |
| `WHATSAPP_ACCESS_TOKEN` | 12 months | Leak, or Meta invalidates it | Messages queue up until the new token is saved |
| `AWS_ACCESS_KEY_ID` and its secret | 6 months | Leak | Nothing, if you follow the two-key drill below |
| `FIELD_ENCRYPTION_KEY` | Not on a schedule | Leak only | A planned re-encryption job. Never delete the old key. |
| `RAILWAY_TOKEN`, `VERCEL_TOKEN`, `SENTRY_AUTH_TOKEN` | 12 months | Leak | The pipeline fails until the new value is stored |

The two-key drill keeps AWS rotation free of downtime. AWS allows two active keys per user, and that is the whole trick.

1. Create a second access key for the IAM user `eduflow-prod`.
2. Put the new key into Railway (API and worker). The services restart with it.
3. Upload one file and download one pre-signed URL on production. Both must work.
4. Mark the old key inactive in AWS. Wait 24 hours.
5. Delete the old key. Update the password manager entry on the same day.

The same shape works for every provider that allows two live credentials. Where it does not (Razorpay webhook secrets, for example), do the change inside a deploy window and test one webhook right after.

> **Warning:** `FIELD_ENCRYPTION_KEY` is the one secret with no easy rotation. Columns such as `national_id_encrypted` are unreadable without it. Keep it in the password manager and in a second place you control, for example a sealed envelope in a bank locker. Rotating it means reading, decrypting and re-encrypting every row with a job that knows both keys.

If a secret leaks into Git, the order is fixed: rotate first, purge the history second. A purged commit can still sit in someone's clone or in a fork, so the old value must already be dead. The purge steps are in *Git Workflow: Branches, Commits and Pull Requests*. Turn on GitHub's secret scanning and push protection for the repository, and add a secret scanner such as gitleaks to the pre-commit hook, so the value never reaches the remote in the first place.

When EduFlow moves to AWS (*Deploy on AWS*), the stores change but `env.ts` does not. The ECS task definition pulls each value from AWS Secrets Manager or SSM Parameter Store and hands it to the container as an ordinary environment variable. Keep one JSON secret per environment instead of 40 separate secrets: Secrets Manager is priced per secret per month (about US$0.40, an Estimate from the public price list as of September 2026), so 2 secrets cost less than 80, and one rotation call updates everything.

## Domain, DNS and SSL

EduFlow owns one domain, `eduflow.app`. Keep the registrar you bought it from, and move the DNS (the address book of the internet) to Cloudflare on the free plan. Cloudflare gives fast changes, an API, and a clean way to add the TXT records that AWS, Vercel and Meta ask for.

Keep the Cloudflare proxy off (grey cloud) for every record that points at Vercel or Railway. Both platforms issue and renew their own certificates, and a proxied record can block that check. Cloudflare then does DNS only, which is all EduFlow needs in Year 1.

| Type | Name | Points to | Proxy | Why |
|---|---|---|---|---|
| `A` or `ALIAS` | `eduflow.app` | Your marketing site host | Off | The public website |
| `CNAME` | `www` | `eduflow.app` | Off | Redirect to the apex |
| `CNAME` | `app` | Vercel target from the domain settings | Off | The web app |
| `CNAME` | `*` | Same Vercel target | Off | Tenant subdomains `{slug}.eduflow.app` |
| `CNAME` | `api` | Railway target of the production API | Off | `api.eduflow.app/api/v1` |
| `CNAME` | `staging` | Vercel target of the staging project | Off | `staging.eduflow.app` |
| `CNAME` | `*.staging` | Same Vercel staging target | Off | Staging tenant subdomains |
| `CNAME` | `api.staging` | Railway target of the staging API | Off | Staging API |
| `CNAME` | 3 DKIM names from SES Mumbai | `<token>.dkim.amazonses.com` | Off | Signs production email |
| `CNAME` | 3 DKIM names from SES Singapore | `<token>.dkim.amazonses.com` | Off | Signs staging email |
| `MX` | `bounce` | `feedback-smtp.ap-south-1.amazonses.com`, priority 10 | Off | SES custom MAIL FROM |
| `TXT` | `bounce` | `v=spf1 include:amazonses.com ~all` | Off | SPF for the bounce domain |
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@eduflow.app` | Off | Collect reports first |
| `MX` and `TXT` | `eduflow.app` | Your mailbox provider's servers and SPF | Off | Your own mailbox |

Seven points make this table safe to use:

1. An exact record always wins over the wildcard. `api`, `staging` and `www` keep working although `*` exists.
2. A wildcard certificate needs proof that you own the domain. Vercel shows the exact step on the day: either a `_acme-challenge` TXT record or moving the nameservers to Vercel. Follow the dashboard, not a remembered value.
3. Certificates are issued and renewed by the platforms. You never handle a `.pem` file. Turn on the platform's "redirect HTTP to HTTPS" switch for every domain.
4. If you add a CAA record (a record that says which authority may issue certificates), list every issuer that Vercel, Railway and AWS use. A missing issuer breaks renewal quietly, and the app goes offline about 90 days later.
5. SES verification is per region. Mumbai and Singapore each give you their own three DKIM records. Both sets live in the zone together without conflict.
6. Keep one SPF record per name. Two SPF records on the same name make both invalid, which is why transactional mail bounces through `bounce.eduflow.app` instead of the apex.
7. Move DMARC from `p=none` to `p=quarantine` after four weeks of clean reports, before the January 2027 launch.

Set the TTL (how long the internet may cache a record) to 300 seconds while you are changing records, and back to 3600 when the change is stable.

Check the result from the command line before you tell anyone the URL works:

```bash
dig +short app.eduflow.app
dig +short api.eduflow.app
curl -sI https://sharma-classes.eduflow.app | head -1     # expect HTTP/2 200
echo | openssl s_client -connect api.eduflow.app:443 -servername api.eduflow.app \
  2>/dev/null | openssl x509 -noout -dates                # check notAfter
```

A new hosted environment needs six steps in this order: add the DNS record, add the custom domain in the platform, wait for the certificate, set the environment variables, deploy, then run the smoke test. Do not change DNS and variables in the same minute. When something breaks you must know which change did it.

## Cookies and CORS across subdomains

The browser sees three different origins in production: `https://app.eduflow.app`, `https://sharma-classes.eduflow.app` and `https://api.eduflow.app`. An origin is scheme plus host plus port. A site is looser: it is the registrable domain, here `eduflow.app`. Cookies follow the site, and CORS follows the origin. That one difference explains every rule below.

A refresh token cookie set for `.eduflow.app` is sent to every subdomain, so a parent stays logged in when she moves from `app.eduflow.app` to `sharma-classes.eduflow.app`. Because all of it is one site, `SameSite=Lax` is enough. You never need `SameSite=None`, which is the setting that needs third-party cookies and is blocked by more browsers every year.

| Attribute | Local | Staging | Production | Why |
|---|---|---|---|---|
| Name | `ef_rt_local` | `ef_rt_stg` | `ef_rt` | Different names, so one browser can hold all three |
| `Domain` | Not set | `.staging.eduflow.app` | `.eduflow.app` | Shares the cookie with every tenant subdomain |
| `Path` | `/api/v1/auth` | `/api/v1/auth` | `/api/v1/auth` | The cookie is sent only to refresh and logout |
| `HttpOnly` | `true` | `true` | `true` | JavaScript cannot read it, so XSS cannot steal it |
| `Secure` | `false` | `true` | `true` | HTTPS only. `localhost` is allowed to be plain. |
| `SameSite` | `Lax` | `Lax` | `Lax` | Same site everywhere, so Lax never blocks a real call |
| `Max-Age` | 30 days | 30 days | 30 days | The refresh token lifetime fixed by the canon |

The access token is different. It lives in a JavaScript variable in memory, for 15 minutes, and goes out in the `Authorization` header. It is never put in a cookie and never in `localStorage`.

**File: `server/src/modules/auth/refresh-cookie.ts`**

```typescript
import type { CookieOptions, Response } from 'express';
import { env } from '../../config/env';

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, per the canon

const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  // '' on localhost. Sending domain='localhost' makes browsers drop it.
  domain: env.COOKIE_DOMAIN === '' ? undefined : env.COOKIE_DOMAIN,
  path: '/api/v1/auth',
};

export const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(env.REFRESH_COOKIE_NAME, token, { ...baseOptions, maxAge: REFRESH_TTL_MS });
};

export const clearRefreshCookie = (res: Response): void => {
  // Domain, path and flags must match, or the browser keeps the old cookie.
  res.clearCookie(env.REFRESH_COOKIE_NAME, baseOptions);
};
```

CORS (cross-origin resource sharing) is the browser's permission list. The API must name every origin that may call it with credentials. A wildcard `*` is not allowed together with credentials, and it would be wrong anyway: tenant subdomains are generated, so the check has to be a function.

**File: `server/src/config/cors.ts`**

```typescript
import type { CorsOptions } from 'cors';
import { env } from './env';

const isAllowedOrigin = (origin: string): boolean => {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false; // Not a real origin header
  }
  const host = url.hostname;
  const root = env.ROOT_DOMAIN; // eduflow.app | staging.eduflow.app | localhost

  // Production must never answer a staging page, although the host ends
  // with eduflow.app. Keep the two worlds apart.
  if (env.APP_ENV === 'production') {
    const staging = `staging.${root}`;
    if (host === staging || host.endsWith(`.${staging}`)) return false;
  }

  const sameSite = host === root || host.endsWith(`.${root}`);
  const schemeOk = url.protocol === (env.COOKIE_SECURE ? 'https:' : 'http:');
  return (sameSite && schemeOk) || env.CORS_EXTRA_ORIGINS.includes(origin);
};

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // No Origin header: curl, health checks, Razorpay and Meta webhooks.
    // They carry no cookies, and each webhook route checks its signature.
    if (!origin) return callback(null, true);
    return isAllowedOrigin(origin)
      ? callback(null, true)
      : callback(new Error('CORS_NOT_ALLOWED'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Campus-Id',
    'X-Organization-Id',
    'Idempotency-Key',
  ],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 600, // The browser may cache the preflight answer for 10 minutes
};
```

Mount it as the first middleware, before the routes and before the rate limiter, so that a rejected preflight never counts against a user's limit:

```typescript
app.set('trust proxy', env.TRUST_PROXY);
app.use(cors(corsOptions));
```

The `cors` middleware answers preflight `OPTIONS` requests by itself. Do not add a separate `app.options('*', ...)` route: Express 5 uses a new path matcher, and a bare `*` path now throws at start.

On the client, every request must be told to send the cookie. Without `credentials: 'include'`, the refresh call silently gets a 401 and the user is logged out after 15 minutes.

```typescript
// client/src/lib/api-client.ts (the one place that calls fetch)
const response = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}${path}`, {
  ...init,
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', ...init.headers },
});
```

Test both directions once per environment, right after the DNS records are live:

```bash
# Allowed: a tenant subdomain. Expect 204 and the two allow headers.
curl -i -X OPTIONS https://api.eduflow.app/api/v1/students \
  -H "Origin: https://sharma-classes.eduflow.app" \
  -H "Access-Control-Request-Method: GET"

# Blocked: a stranger. Expect NO Access-Control-Allow-Origin in the answer.
curl -i -X OPTIONS https://api.eduflow.app/api/v1/students \
  -H "Origin: https://evil.example.com" \
  -H "Access-Control-Request-Method: GET"
```

| Symptom | Cause | Fix |
|---|---|---|
| Login works, then logout after 15 minutes | Refresh call sent without credentials | `credentials: 'include'` in the API client |
| Cookie missing on `sharma-classes.eduflow.app` | `COOKIE_DOMAIN` has no leading dot | Set `.eduflow.app` |
| Cookie missing on `localhost` | `COOKIE_DOMAIN` is set locally | Leave it empty on local |
| Vercel preview deployment cannot log in | Preview is on `vercel.app`, a different site | Test logins on staging, not on previews |
| CORS error only on `PATCH` | Method or header missing from the options | Add it to `methods` or `allowedHeaders` |
| Logout leaves the user logged in | `clearCookie` called with other options | Reuse the same `baseOptions` object |

## Feature flags and plan gating

Two questions look alike and must never share one mechanism.

- "Is Sharma Classes allowed to take fees online?" That is plan gating. The answer is money, and it lives in data.
- "May this half-finished code run today?" That is a feature flag. The answer is release risk, and it lives in configuration.

| Layer | Where it lives | Who changes it | How fast | Example |
|---|---|---|---|---|
| Plan entitlement | `plans` table plus the organization's plan | You, when a customer upgrades | At once | Pro includes the Library module |
| Add-on entitlement | The subscription's add-on rows | You, when an add-on is bought | At once | AI Insights on a Growth plan |
| Plan limit | `plans` table (students, campuses) | You | At once | Growth stops at 300 active students |
| Organization flag | `organizations.settings` JSON, key `betaFlags` | You, per tenant | At once | New report card tried by one institute |
| Release kill switch | `RELEASE_FLAGS_OFF` variable | You | About one minute | Stop WhatsApp auto reminders platform-wide |

One list holds every feature key, and both apps import it. Keys read as `module.feature`.

**File: `shared/src/features.ts`**

```typescript
export const FEATURES = {
  'fees.onlinePayment': 'Parents pay fees online through Razorpay',
  'wa.autoReminders': 'Automatic fee reminders on WhatsApp',
  'campus.multi': 'More than one campus',
  'roles.custom': 'Custom roles built from permission keys',
  'analytics.advanced': 'Advanced analytics and the report builder',
  'ai.insights': 'AI Insights module',
  'brand.whiteLabel': 'White-label branding and mobile app',
} as const;

export type FeatureKey = keyof typeof FEATURES;
export type PlanKey = 'STARTER' | 'GROWTH' | 'PRO' | 'ENTERPRISE';

// The floor of each plan. Add-ons and beta flags can only add to it.
export const PLAN_FEATURES: Record<PlanKey, FeatureKey[]> = {
  STARTER: [],
  GROWTH: ['fees.onlinePayment', 'wa.autoReminders'],
  PRO: [
    'fees.onlinePayment',
    'wa.autoReminders',
    'campus.multi',
    'roles.custom',
    'analytics.advanced',
  ],
  ENTERPRISE: Object.keys(FEATURES) as FeatureKey[],
};
```

The resolver runs in the API. Four lines, always in this order.

```typescript
// server/src/modules/features/is-feature-on.ts
import { PLAN_FEATURES, type FeatureKey, type PlanKey } from '@eduflow/shared';
import { env } from '../../config/env';

const killed = new Set(
  env.RELEASE_FLAGS_OFF.split(',').map((item) => item.trim()).filter(Boolean),
);

type OrgFeatureView = {
  plan: PlanKey;
  addOnFeatures: FeatureKey[]; // from the subscription
  betaFlags: FeatureKey[]; // from organizations.settings
};

export const isFeatureOn = (org: OrgFeatureView, key: FeatureKey): boolean => {
  if (killed.has(key)) return false; // 1. platform kill switch wins
  if (org.betaFlags.includes(key)) return true; // 2. this tenant is testing it
  if (org.addOnFeatures.includes(key)) return true; // 3. the tenant paid for it
  return PLAN_FEATURES[org.plan].includes(key); // 4. the plan
};
```

Enforce it in the API first. A blocked call answers `403` with the canon code `FORBIDDEN`, and a blocked limit answers `403` with `PLAN_LIMIT_REACHED` plus the number that was hit. The interface hides or locks the same thing, with an upgrade hint. Hiding a button in the interface is a courtesy, never a control: anyone can call the API directly.

Five rules keep flags from becoming a second product:

1. A flag never decides money. Fee amounts, discounts, late fees and receipt numbers come from data and rules, never from a flag.
2. Every release flag has a removal date in the comment next to it. When it has been on for everyone for two weeks, delete the flag and the dead branch of code.
3. At most ten live release flags. Beyond that, no test run covers the combination your customers are actually using.
4. `RELEASE_FLAGS_OFF` is empty on a normal day. It is the emergency brake, used when the WhatsApp worker floods parents at 6 a.m. Setting it on Railway restarts the service in about a minute, against ten to fifteen minutes for a code change and a deploy.
5. No third-party flag service in Year 1. It adds a vendor, a network call in the request path, and a bill. Look at it again around 500 customers (*Stage 2: Growing to 500 Customers*).

## One database per environment and the safe data rule

| Environment | Instance | Roles | Who connects | Migration command |
|---|---|---|---|---|
| Local | Docker PostgreSQL 16, database `eduflow_dev` | `eduflow` (owner), `eduflow_app` | You | `prisma migrate dev` |
| Test | Same container, database `eduflow_test` | Same two | Vitest, CI service container | `prisma migrate deploy` |
| Staging | Railway PostgreSQL 16, environment `staging` | Same two | You and the pipeline | `prisma migrate deploy` |
| Production | Railway PostgreSQL 16, environment `production` | Same two plus `eduflow_readonly` | Pipeline; you for support only | `prisma migrate deploy` |

Five rules hold this together:

1. One database per environment. Staging never points at the production database, not even for five minutes of debugging. The `DATABASE_URL` of production exists in exactly two places: Railway and the password manager.
2. `prisma migrate dev` writes new migration files and may reset the database. It runs on the laptop only. Hosted environments run `prisma migrate deploy`, which applies existing files and nothing else.
3. Migrations run with `DATABASE_ADMIN_URL`, before the new code starts. The running API keeps the `eduflow_app` role, so Row-Level Security stays on for every query.
4. Staging data is generated, not copied. P-58 creates Bright Future Public School with 1,200 students and Sharma Classes with 350, which is realistic enough for demos and for slow-query hunting.
5. A production dump never sits unencrypted on your laptop. Backup rules and restore drills are in *Monitoring, Backups and Incident Response*.

> **Warning:** Copying production data to staging is the mistake that ends a school SaaS. Staging holds children's names, phone numbers and fee histories, with weaker access and test accounts. One wrong `MESSAGING_MODE` and a real parent of Bright Future gets a message that says "test test". Under the DPDP Act 2023 this is processing children's data for a purpose the parent never agreed to.

### The anonymised copy, when you really need one

Sometimes generated data is not enough: a query is slow only at 200,000 attendance rows, or a risky migration must be rehearsed on real shapes. Then make an anonymised copy, under four conditions: it is made on a machine you control, it is masked before it leaves that machine, the masking is proved by a query, and the copy is deleted within seven days.

```bash
#!/usr/bin/env bash
# scripts/anonymise-dump.sh <prod-dump-file> <scratch-database-url>
# Run on your laptop, inside a folder you delete afterwards.
set -euo pipefail

SRC_DUMP="$1"      # decrypted production dump, downloaded minutes ago
SCRATCH_URL="$2"   # empty database in local Docker, never staging

# 1. Restore into the scratch database. Staging is not touched yet.
pg_restore --clean --if-exists --no-owner --dbname "$SCRATCH_URL" "$SRC_DUMP"

# 2. Mask every column that can point to a person.
psql "$SCRATCH_URL" --set ON_ERROR_STOP=1 -f scripts/anonymise.sql

# 3. Prove it. This file raises an exception if one real value survived.
psql "$SCRATCH_URL" --set ON_ERROR_STOP=1 -f scripts/anonymise-verify.sql

# 4. Only now dump the masked copy and load it into staging.
pg_dump --format=custom --no-owner --file anonymised.dump "$SCRATCH_URL"
pg_restore --clean --if-exists --no-owner \
  --dbname "$STAGING_ADMIN_URL" anonymised.dump

# 5. Delete the raw dump now. "Later" never happens.
shred -u "$SRC_DUMP" 2>/dev/null || rm -f "$SRC_DUMP"
rm -f anonymised.dump
```

The masking file keeps the shape of the data and destroys the identity. Check every table and column name against `docs/schema/` before the first run.

```sql
-- scripts/anonymise.sql
BEGIN;

UPDATE students SET
  first_name = 'Student',
  last_name  = 'S' || substr(md5(id::text), 1, 6),
  phone      = '+9199' || lpad((abs(hashtext(id::text)) % 100000000)::text, 8, '0'),
  email      = 'student.' || substr(md5(id::text), 1, 8) || '@example.invalid',
  photo_url  = NULL,
  national_id_encrypted   = NULL,
  medical_notes_encrypted = NULL;

UPDATE guardians SET
  name  = 'Guardian ' || substr(md5(id::text), 1, 6),
  phone = '+9198' || lpad((abs(hashtext(id::text)) % 100000000)::text, 8, '0'),
  email = 'guardian.' || substr(md5(id::text), 1, 8) || '@example.invalid',
  -- Start from "no consent", so nothing can legally be sent.
  whatsapp_opt_in = false, sms_opt_in = false, email_opt_in = false;

-- One known password for every staff account on staging.
UPDATE users SET
  email = 'user.' || substr(md5(id::text), 1, 8) || '@example.invalid',
  password_hash = '$2b$12$REPLACE_WITH_A_STAGING_ONLY_BCRYPT_HASH';

-- Gateway identifiers must not match a real Razorpay payment.
UPDATE payments SET gateway_payment_id = 'pay_anon_' || substr(md5(id::text), 1, 10);

-- File keys point at the production bucket. Blank them.
UPDATE documents SET s3_key = NULL;

-- Message history, queues and sessions are the riskiest and the least useful.
TRUNCATE notification_deliveries, audit_logs, refresh_tokens RESTART IDENTITY CASCADE;

-- Make it obvious on screen that this is not real.
UPDATE organizations SET name = name || ' (ANON)';

COMMIT;
```

```sql
-- scripts/anonymise-verify.sql — the gate. It must find nothing.
DO $$
DECLARE leaked bigint;
BEGIN
  SELECT count(*) INTO leaked
    FROM students
   WHERE email IS NOT NULL AND email NOT LIKE '%@example.invalid';
  IF leaked > 0 THEN
    RAISE EXCEPTION 'Anonymisation failed: % student emails survived', leaked;
  END IF;

  SELECT count(*) INTO leaked
    FROM guardians
   WHERE phone IS NOT NULL AND phone NOT LIKE '+9198%';
  IF leaked > 0 THEN
    RAISE EXCEPTION 'Anonymisation failed: % guardian phones survived', leaked;
  END IF;
END $$;
```

Write the date of every anonymised load in your work log, with a deletion date seven days later. When the job that needed it is done, reload the generated demo data with P-58 and move on.

## Release flow between environments

**Figure: From branch to staging, without you touching anything**

```mermaid
flowchart TD
  A["Branch feat/fee-invoices on the laptop"] --> B["Pull request"]
  B --> C{"CI green?"}
  C -- "no" --> A
  C -- "yes" --> D["Merge to main"]
  D --> E["Staging deploys itself:<br/>migrate deploy, API, worker, client"]
  E --> F{"Smoke test on staging passes?"}
  F -- "no" --> A
  F -- "yes" --> G["Ready to tag"]
```

Everything up to staging is automatic. A red test or a failed smoke test sends the change back to the branch, and nothing reaches a customer.

**Figure: From tag to production, and back if needed**

```mermaid
flowchart TD
  G["Tag v0.6.0 pushed in the deploy window"] --> H["Production: backup, migrate, release"]
  H --> I{"Post-deploy checks clean?"}
  I -- "no" --> J["Roll back client and API<br/>to the previous release"]
  I -- "yes" --> K["Write the release note"]
  J --> L["Fix on a branch and start again"]
```

Production waits for a tag that you push by hand. That is the whole safety design: the machine does the boring part, and one human decision stands between a merge and a paying customer. The pipeline files themselves are in *Docker and CI/CD*, and the platform settings in *Deploy on Vercel and Railway*.

| Gate | What must be true | If it fails |
|---|---|---|
| CI on the pull request | Lint, typecheck, unit and integration tests, `prisma validate`, build | Fix on the branch. Never merge red. |
| Merge to `main` | Your own review done, migrations reviewed line by line | Ask Claude Code for a review with P-52 |
| Staging deploy | `prisma migrate deploy` succeeded, API healthy | Fix forward. Staging may stay broken for an hour. |
| Smoke test on staging | The eight checks below pass | No tag. The bug does not travel further. |
| Tag `v0.6.0` | Inside a deploy window, not in a freeze | Wait for the window |
| Production deploy | Backup taken, migration applied, health endpoint shows the new version | Roll back at once, then find the cause |

The eight smoke checks take about six minutes and are the same on staging and on production:

1. `GET /api/v1/health` returns the version you just released.
2. Log in as `ORG_ADMIN` of the demo organization. The dashboard loads.
3. Open a student profile of Aarav Sharma. Photo and guardian load.
4. Mark attendance for one batch and reload the page.
5. Collect a small test fee and open the receipt PDF.
6. Trigger one notification and see it delivered (allow-listed phone on staging, your own phone on production).
7. Log in to the Parent Portal with OTP as Sunita Devi.
8. Open a tenant subdomain, for example `sharma-classes.eduflow.app`, and confirm you stay logged in.

The health endpoint makes check one honest. It reports the running version and the state of both connections:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "appEnv": "production",
    "version": "v0.6.0",
    "db": "ok",
    "redis": "ok",
    "migrations": "up-to-date"
  }
}
```

Watch production for fifteen minutes after the release: new Sentry issues, API error rate, queue depth, and one real login. Then write three lines of release note for yourself and, from January 2027, for customers.

| Symptom after release | First move | Time budget |
|---|---|---|
| Blank screen or broken layout | Promote the previous Vercel deployment | 2 minutes |
| Wave of 5xx from the API | Redeploy the previous image on Railway | 5 minutes |
| A worker writes wrong data | Pause the queue, fix forward, replay the jobs | 30 minutes |
| A query became slow after a migration | Add the index, release a patch. No revert. | 30 minutes |
| Payments failing at the gateway | Switch the affected flow off with `RELEASE_FLAGS_OFF` | 2 minutes |

> **Rule:** Code rolls back. The database does not. A migration is forward-only: to undo a column, write a new migration that removes it, after the old code is gone. Use the expand-and-contract pattern described in *Git Workflow: Branches, Commits and Pull Requests*, so that old and new code can run against the same schema for one release.

## Deployment calendar rules

A deploy is not risky because of the code. It is risky because of when the founder is not watching, and because of what the customer is doing at that hour. In India, school offices work Monday to Saturday, and fee counters are busiest in the first ten days of a month.

| When (IST) | Deploy? | Why |
|---|---|---|
| Monday to Thursday, 11:00 to 16:00 | Yes, normal window | Classes are running, you are awake, support is reachable |
| Any day, 07:30 to 10:30 | No | Attendance marking rush, the busiest hour of the product |
| Any day, after 18:00 | Hotfix only | A mistake is found by customers, not by you |
| Friday after 16:00 | No | A break would run into Saturday, a working school day |
| Saturday | Staging only | Schools work. Fee counters are open. |
| Sunday | Staging only | Your rest day. A broken Sunday costs Monday. |
| 1st to 10th of a month | Hotfix only | Fee collection peak across all customers |
| Exam result day of any customer | No | Parents open the portal in thousands within minutes |
| 1 March to 15 April | Hotfix only | Admission season in India, the year's busiest buying period |
| 31 March and 1 April | No | Financial year close and GST filing |
| Onboarding day of a new institute | No | That institute must see a stable system on day one |

Two more calendar rules come from the sprint plan. Do not deploy anything but a hotfix on Day 45 (18 November 2026), when the five pilot institutes start. Freeze normal releases from Day 57 to Day 60 (30 November to 3 December 2026), when the sprint closes.

Freeze days are not a feeling. Collect them:

- Ask every institute during onboarding: "When are your exam result days and your fee due dates?" Write the answer in the CRM, as described in *Onboarding and Customer Success Playbook*.
- Put each date into your calendar as an all-day entry named "EduFlow deploy freeze".
- Put the monthly first-to-tenth freeze into the calendar as a repeating entry.

> **Rule:** If you cannot watch the system for sixty minutes after the release, do not release. This single rule prevents most of the incidents a solo founder can have.

A SEV1 or SEV2 incident (a full outage, payments down, data visible across tenants) breaks every rule above. Then you deploy at 2 a.m. on a Sunday, with one small change, followed by the same post-deploy checks. Severity levels and the incident process are in *Monitoring, Backups and Incident Response*.

## Key takeaways

- Three environments, one codebase: local, staging, production. Only configuration differs, and `APP_ENV` names the environment because `NODE_ENV` cannot tell staging from production.
- Every outside service has a safe mode and a real mode, and `MESSAGING_MODE` is the last switch before a real parent's phone. The Zod config file refuses dangerous mixes at start: live payment keys outside production, an insecure cookie on a hosted environment, a test OTP on production.
- Secrets live in the platform stores and in your password manager, never in Git. Rotation dates sit in the calendar, and the AWS two-key drill makes rotation free of downtime.
- One wildcard DNS record and one cookie on `.eduflow.app` give every tenant subdomain a working login. CORS checks the origin against `ROOT_DOMAIN`, and production refuses staging origins.
- Plan gating is data in the `plans` table; feature flags are configuration with a removal date. `RELEASE_FLAGS_OFF` is the emergency brake, not a product feature.
- Staging data is generated by P-58. Production data reaches staging only through the anonymise-and-verify script, and that copy is deleted within seven days.
- Staging deploys itself on every merge; production waits for a tag pushed inside a deploy window. No Friday evening, no fee-season days, no exam result days, and never a release you cannot watch for an hour.
