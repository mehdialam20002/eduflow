# Environment Variables and Command Reference

**In simple words:** This appendix is the lookup page you keep open while you build. It lists every EduFlow environment variable in alphabetical order with a dummy example value, then gives one-line command sheets for npm, Prisma, Docker, Git, Railway, Vercel, AWS, PostgreSQL, Redis, the queue dashboard, Playwright and k6. It ends with safe read-only SQL for support work, the local ports table and a troubleshooting grid. The reasoning behind the values lives in *Environments and Configuration*, and the setup steps live in *Local Development Setup*.

## How to read this appendix

- **App** says which process needs the variable: `api` (Express), `worker` (BullMQ), `both`, `client` (Next.js on Vercel) or `build` (only a pipeline step).
- **Required** means the Zod schema in `server/src/config/env.ts` refuses to start without it. `No` means an empty value is allowed and the feature stays off.
- Example values are dummies. Never paste a real secret into a document, a chat or a Claude Code prompt.
- A new variable is added in three places in the same commit: the Zod schema, `.env.example` and this table. If this list and *Environments and Configuration* disagree on a name, fix both files in one pull request.
- Anything whose name starts with `NEXT_PUBLIC_` is shipped to every browser. It can never hold a secret.

## Server and worker variables

| Variable | App | Example value | Required | Meaning |
|---|---|---|---|---|
| `API_URL` | api | `http://localhost:4000` | Yes | The API's own public address. Used in OpenAPI docs and in webhook URLs given to Razorpay and Meta. |
| `APP_ENV` | both | `local` | Yes | One of `local`, `staging`, `production`. Tags Sentry events and switches the safety guards. |
| `APP_URL` | both | `http://localhost:3000` | Yes | Address of the web app. The worker builds message links from it, such as the "Pay now" link. |
| `APP_VERSION` | both | `dev` | No | Release tag or commit SHA. Shown at `/api/v1/health` and used as the Sentry release. |
| `AWS_ACCESS_KEY_ID` | both | `AKIAEXAMPLEKEY12345` | No | IAM user key for S3 uploads and SES email. Needed from P-21 onwards. |
| `AWS_REGION` | both | `ap-south-1` | Yes | AWS region for S3. Mumbai for India, so files stay in the country. |
| `AWS_SECRET_ACCESS_KEY` | both | `wJalrExampleSecretK7MDENG` | No | Secret half of the IAM key. Rotate every 90 days. |
| `COOKIE_DOMAIN` | api | `.eduflow.app` | No | Domain of the refresh-token cookie. Empty on localhost, leading dot for tenant subdomains. |
| `COOKIE_SECURE` | api | `false` | Yes | `true` everywhere except a plain-HTTP laptop. Sends the cookie only over HTTPS. |
| `CORS_EXTRA_ORIGINS` | api | `http://localhost:3000` | No | Comma-separated extra origins beyond `*.{ROOT_DOMAIN}`. Empty in production. |
| `DATABASE_ADMIN_URL` | build | `postgresql://eduflow:pw@localhost:5432/eduflow_dev` | No | Owner role. Used only by `prisma migrate`, `prisma db seed` and the backup job. The running API never reads it. |
| `DATABASE_URL` | both | `postgresql://eduflow_app:pw@localhost:5432/eduflow_dev` | Yes | Runtime role `eduflow_app`, the role Row-Level Security applies to. |
| `DEFAULT_COUNTRY` | api | `IN` | Yes | ISO country code used when a new organization signs up without choosing one. |
| `DEFAULT_CURRENCY` | api | `INR` | Yes | Three-letter currency written onto new invoices and plan prices. |
| `DEFAULT_TIMEZONE` | both | `Asia/Kolkata` | Yes | IANA timezone for new organizations. Data is stored in UTC and shown in this zone. |
| `FIELD_ENCRYPTION_KEY` | both | `base64:REPLACE_WITH_32_BYTE_KEY` | Yes | AES-256-GCM key for encrypted columns such as `national_id_encrypted`. Keep a written backup. |
| `JWT_ACCESS_SECRET` | api | `local-only-access-secret-change-me` | Yes | Signs the 15-minute access token. At least 32 characters. |
| `JWT_ACCESS_TTL` | api | `15m` | Yes | Lifetime of the access token. The canon fixes it at 15 minutes. |
| `JWT_REFRESH_SECRET` | api | `local-only-refresh-secret-change-me` | Yes | Signs the refresh token. Must differ from the access secret. |
| `JWT_REFRESH_TTL_DAYS` | api | `30` | Yes | Lifetime of the rotating refresh token in days. The canon fixes it at 30. |
| `LOG_LEVEL` | both | `debug` | Yes | Pino level: `debug` locally, `info` on staging and production. |
| `MAIL_FROM` | worker | `EduFlow Local <no-reply@eduflow.app>` | Yes | From-name and address on every outgoing email. |
| `MAIL_TRANSPORT` | worker | `smtp` | Yes | `smtp` for the local Mailpit inbox, `ses` for Amazon SES. |
| `MESSAGING_ALLOWLIST` | both | `+919876543210,rajesh@example.com` | No | Phones and emails that may receive real messages while `MESSAGING_MODE=allowlist`. |
| `MESSAGING_MODE` | both | `log` | Yes | `log` writes messages to the terminal, `allowlist` sends only to testers, `live` sends to everyone. |
| `MSG91_AUTH_KEY` | worker | `4xxxxxAexampleKey` | No | MSG91 API key for Indian SMS. Needed from P-31. |
| `MSG91_SENDER_ID` | worker | `EDUFLW` | No | Six-letter DLT-approved sender header shown on the parent's phone. |
| `NODE_ENV` | both | `development` | Yes | `development` locally, `production` in every built image. Node and Express read it too. |
| `OTP_TEST_CODE` | api | `123456` | No | Fixed OTP for the test numbers below. Must be empty in production. |
| `OTP_TEST_NUMBERS` | api | `+919800000001,+919800000002` | No | Phones that accept the fixed OTP, so Playwright can log in as a parent. Empty in production. |
| `PORT` | api | `4000` | Yes | Port the API listens on. Railway injects its own value. |
| `POSTHOG_HOST` | api | `https://app.posthog.com` | No | PostHog ingestion host for server-side product events. |
| `POSTHOG_KEY` | api | `phc_exampleProjectKey` | No | PostHog project key for server-side events. Browser events use the `NEXT_PUBLIC_` pair. |
| `QUEUE_PREFIX` | both | `eduflow-local` | Yes | Prefix for every BullMQ key in Redis. Keeps environments apart if they ever share one Redis. |
| `RATE_LIMIT_LOGIN_PER_15MIN` | api | `5` | Yes | Failed login attempts allowed per account and IP in 15 minutes. |
| `RATE_LIMIT_ORG_PER_MIN` | api | `1000` | Yes | Requests per minute per organization before `RATE_LIMITED` (429). |
| `RATE_LIMIT_USER_PER_MIN` | api | `100` | Yes | Requests per minute per user before `RATE_LIMITED` (429). |
| `RAZORPAY_KEY_ID` | api | `rzp_test_ExampleKeyId` | No | Public Razorpay key. `rzp_live_` only in production. |
| `RAZORPAY_KEY_SECRET` | api | `ExampleRazorpaySecret` | No | Secret half of the Razorpay key pair. |
| `RAZORPAY_WEBHOOK_SECRET` | api | `whsec_example_razorpay` | No | Verifies the signature of every Razorpay webhook. Unsigned calls are rejected. |
| `REDIS_URL` | both | `redis://localhost:6379` | Yes | Queues, cache and rate-limit counters. Needs `maxmemory-policy noeviction`. |
| `REFRESH_COOKIE_NAME` | api | `ef_rt_local` | Yes | Name of the httpOnly refresh cookie. A different name per environment stops cookie mix-ups. |
| `RELEASE_FLAGS_OFF` | both | `ai-insights,stripe-billing` | No | Comma-separated kill switch. A flag named here is forced off, whatever the plan allows. |
| `ROOT_DOMAIN` | api | `localhost` | Yes | Base domain. Every `*.{ROOT_DOMAIN}` origin is allowed by CORS. |
| `S3_BUCKET_BACKUPS` | build | `eduflow-prod-backups` | No | Bucket for the nightly `pg_dump`. Empty outside production. |
| `S3_BUCKET_UPLOADS` | both | `eduflow-dev-uploads` | Yes | Private bucket for student photos, documents and generated PDFs. |
| `SEED_DEMO_PASSWORD` | build | `EduFlow@Local123` | No | Password for seeded demo users. The seed refuses to create them when `NODE_ENV=production`. |
| `SENTRY_AUTH_TOKEN` | build | `sntrys_exampleToken` | No | Uploads source maps during the build. Never present at runtime. |
| `SENTRY_DSN` | both | `https://example@o0.ingest.sentry.io/0` | No | Where errors are sent. One server project serves staging and production. |
| `SES_REGION` | worker | `ap-south-1` | No | Region of the verified SES identity. Empty when `MAIL_TRANSPORT=smtp`. |
| `SMTP_HOST` | worker | `localhost` | No | Mail host for `MAIL_TRANSPORT=smtp`. Mailpit locally. |
| `SMTP_PORT` | worker | `1025` | No | Mail port for `MAIL_TRANSPORT=smtp`. |
| `STRIPE_SECRET_KEY` | api | `sk_test_ExampleStripeKey` | No | International payments. Empty until P-32. |
| `STRIPE_WEBHOOK_SECRET` | api | `whsec_example_stripe` | No | Verifies Stripe webhook signatures. One value per endpoint. |
| `TRUST_PROXY` | api | `0` | Yes | `1` behind Railway or a load balancer, so `req.ip` is the real client IP. |
| `TWILIO_ACCOUNT_SID` | worker | `ACexampleAccountSid` | No | International SMS outside India. Empty in Year 1. |
| `TWILIO_AUTH_TOKEN` | worker | `exampleTwilioAuthToken` | No | Secret half of the Twilio credentials. |
| `TWILIO_FROM_NUMBER` | worker | `+15005550006` | No | Sender number for Twilio SMS. |
| `WHATSAPP_ACCESS_TOKEN` | both | `EAAExampleSystemUserToken` | No | Meta System User token. Needed from P-29. |
| `WHATSAPP_APP_SECRET` | api | `exampleMetaAppSecret` | No | Checks the signature of every Meta webhook call. |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | worker | `100000000000001` | No | WhatsApp Business Account that owns the message templates. |
| `WHATSAPP_PHONE_NUMBER_ID` | worker | `200000000000002` | No | The number EduFlow sends from by default. |
| `WHATSAPP_VERIFY_TOKEN` | api | `example-verify-token-2026` | No | Random string Meta echoes once while you register the webhook URL. |

> **Note:** Nine names above are additions of this appendix and are not yet in the grouped catalog of *Environments and Configuration*: `DEFAULT_COUNTRY`, `DEFAULT_CURRENCY`, `DEFAULT_TIMEZONE`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL_DAYS`, the three `RATE_LIMIT_*` values and the PostHog server keys, plus the three Twilio keys. Add them to the Zod schema when you reach P-05, P-07 and P-31, and keep both lists in step.

## Client variables on Vercel

| Variable | App | Example value | Required | Meaning |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | client | `http://localhost:4000/api/v1` | Yes | Base URL every browser request uses. It already includes `/api/v1`. |
| `NEXT_PUBLIC_APP_ENV` | client | `local` | Yes | Shows an environment ribbon on staging, so you never demo the wrong site. |
| `NEXT_PUBLIC_APP_VERSION` | client | `dev` | No | Commit SHA or release tag, printed in the footer for bug reports. |
| `NEXT_PUBLIC_POSTHOG_HOST` | client | `https://app.posthog.com` | No | PostHog host for browser analytics. |
| `NEXT_PUBLIC_POSTHOG_KEY` | client | `phc_exampleProjectKey` | No | PostHog project key for browser analytics. Production only. |
| `NEXT_PUBLIC_ROOT_DOMAIN` | client | `localhost` | Yes | Used to build tenant links such as `sharma.eduflow.app`. |
| `NEXT_PUBLIC_SENTRY_DSN` | client | `https://example@o0.ingest.sentry.io/1` | No | DSN of the separate client Sentry project. |

> **Warning:** Next.js bakes `NEXT_PUBLIC_` values into the JavaScript during `next build`. Changing one in the Vercel dashboard does nothing until the next deploy, and one build can never serve two environments.

## Command cheat sheets

Run every command from the repository root unless the line says otherwise. The comment after each command is what it does. Git Bash and PowerShell on Windows 11 both work.

### npm workspace scripts

```bash
npm run setup              # install, start services, migrate, seed (new laptop)
npm run dev                # shared watcher + API + web app
npm run dev:all            # same, plus the BullMQ worker, in one terminal
npm run dev:worker         # only the worker, watch mode, second terminal
npm run services:up        # PostgreSQL, Redis, Mailpit; waits for health checks
npm run services:down      # stop the containers, keep the data volumes
npm run services:logs      # follow the last 100 log lines of all services
npm run lint               # ESLint on client, server and shared
npm run typecheck          # type-check every workspace, no files written
npm run test               # Vitest in every workspace
npm run check              # lint, typecheck, test; stops at the first failure
npm run build              # production build of shared, server, client
npm run format             # Prettier rewrites all files
npm run test -w server -- src/modules/fees   # only the Fees tests
npm ci                     # clean install from package-lock.json (CI uses this)
npm install zod -w server  # add a dependency to one workspace, not the root
npm outdated --workspaces  # packages that are behind their latest version
```

### Prisma

```bash
npm run db:generate        # rebuild the Prisma client after install or pull
npm run db:migrate         # apply pending migrations, then generate
npm run db:migrate -- --name add_student_blood_group  # create one and apply it
npm run db:draft           # write the migration file without applying it
npm run db:status          # list migrations that are not applied yet
npm run db:seed            # plans, permissions, roles, demo organizations
npm run db:reset           # drop, re-migrate, re-seed. Local only.
npm run db:studio          # table browser on http://localhost:5555
npx prisma validate --schema server/prisma/schema  # check the schema files
npx prisma format --schema server/prisma/schema    # format and sort attributes
npx prisma migrate deploy  # the only migrate command allowed on staging/prod
npx prisma migrate resolve --applied 20261105_add_rls  # after a manual fix
```

The migration step hands the owner URL to Prisma for one command only:

```bash
cd server
DATABASE_URL="$DATABASE_ADMIN_URL" npx prisma migrate deploy
```

### Docker and Docker Compose

```bash
docker compose up -d --wait        # start local services, wait for health
docker compose down                # remove containers, keep the volumes
docker compose down -v             # also delete volumes: all local data gone
docker compose ps                  # which services run, on which ports
docker compose logs -f postgres    # follow one service log
docker compose exec postgres psql -U eduflow -d eduflow_dev  # psql inside
docker compose --profile s3 up -d  # also start MinIO, the local S3 stand-in
docker build -f server/Dockerfile -t eduflow-api:local .     # build the image
docker run --rm -p 4000:4000 --env-file server/.env eduflow-api:local
docker image prune -f              # delete dangling images, free disk
```

### Git and GitHub

```bash
git switch -c feat/fees-invoice-generation  # start a feature branch
git status -sb                 # short status with branch and remote distance
git add -p                     # stage change by change, no stray console.log
git commit -m "feat(fees): generate quarterly invoices"
git push -u origin HEAD        # push and set the upstream
git pull --rebase origin main  # update the branch without a merge commit
git log --oneline -20          # the last 20 commits
git diff --stat main...HEAD    # which files this branch touches
git restore --staged src/x.ts  # unstage a file, keep the edit
git tag -a v0.6.0 -m "Pilot release" && git push --tags  # mark a release
gh pr create --fill            # open a pull request from this branch
gh run watch                   # follow the GitHub Actions job live
```

### Railway CLI

```bash
railway login                  # sign in through the browser, once per laptop
railway link                   # connect this folder to a project + environment
railway status                 # linked project, environment and services
railway variables --service api   # the variables the API service sees
railway logs --service api     # follow the live API log
railway connect Postgres       # psql shell on the linked database
railway connect Redis          # redis-cli shell on the linked Redis
railway run npm run db:status  # run a local command with the service variables
```

### Vercel CLI

```bash
vercel login                   # sign in, once per laptop
vercel link                    # connect the client folder to the project
vercel env ls                  # variable names in every Vercel environment
vercel env add NEXT_PUBLIC_API_URL production  # add or replace one value
vercel pull --environment=production           # fetch settings and variables
vercel build --prod            # build the production bundle locally
vercel deploy --prebuilt --prod   # upload it; the release pipeline runs this
vercel logs https://eduflow-client-abc123.vercel.app  # log of one deployment
```

### AWS CLI basics

```bash
aws configure --profile eduflow-dev   # store a key pair and a region
aws sts get-caller-identity --profile eduflow-prod  # who am I? run this first
aws s3 ls s3://eduflow-prod-backups/ --profile eduflow-prod  # backup files
aws s3 cp db.dump s3://eduflow-prod-backups/2026-12-03/ --profile eduflow-prod
aws s3 presign s3://eduflow-dev-uploads/students/a.jpg --expires-in 300
aws ses get-account --region ap-south-1  # sandbox status and daily send quota
aws logs tail /ecs/eduflow-api --follow --region ap-south-1  # after P-57
```

### PostgreSQL: psql, pg_dump, pg_restore

```bash
psql "$DATABASE_URL"           # open an SQL shell on that database
# Inside psql:
#   \dt               list the tables
#   \d+ fee_invoices  columns, indexes and constraints of one table
#   \x on             one field per line, much easier for a wide row
#   \timing on        print how long each query took
pg_dump "$DATABASE_ADMIN_URL" -Fc -f eduflow-2026-12-03.dump  # full backup
pg_dump "$DATABASE_ADMIN_URL" -Fc -t students -f students.dump  # one table
pg_restore --dbname="$SCRATCH_URL" --no-owner --jobs=4 eduflow-2026-12-03.dump
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f fix.sql  # stop at the first error
```

> **Warning:** `pg_dump` refuses a server newer than itself. Keep your client tools on PostgreSQL 16, the same major version as every EduFlow database.

### Redis CLI and the queue dashboard

```bash
redis-cli -u "$REDIS_URL" ping           # answers PONG when Redis is reachable
redis-cli -u "$REDIS_URL" info memory    # used memory and eviction policy
redis-cli -u "$REDIS_URL" config get maxmemory-policy  # must be noeviction
redis-cli -u "$REDIS_URL" --scan --pattern 'eduflow-prod:*' | head -50
redis-cli -u "$REDIS_URL" llen eduflow-prod:notifications:wait  # jobs waiting
redis-cli -u "$REDIS_URL" flushall       # deletes everything. Local only.
```

Bull Board is the small web dashboard for BullMQ queues. Mount it in the API behind a `SUPER_ADMIN` check and open `http://localhost:4000/admin/queues`. It shows waiting, active, completed and failed jobs, the error text of each failure, and a retry button. Use it instead of guessing why a WhatsApp reminder never left.

### Playwright and k6

```bash
npx playwright install chromium   # download the browser, once per laptop
npm run test:e2e -w client        # run the end-to-end flows
npm run test:e2e:ui -w client     # Playwright UI with time-travel debugging
npx playwright test tests/e2e/fee-collection.spec.ts  # one spec file
npx playwright show-trace trace.zip  # replay a failed run click by click
npx playwright codegen http://localhost:3000  # record clicks, get test code
k6 run tests/load/fee-day.js      # load test against staging
k6 run --vus 200 --duration 5m tests/load/fee-day.js  # 200 users, 5 minutes
```

## Support SQL snippets

These are for support questions, not for fixing data. Open a read-only session, copy the organization's ID from the platform console first, and put `organization_id` in every `WHERE`.

> **Rule:** A query without `organization_id` is a data-protection incident waiting to happen. One missing line shows Sharma Classes the students of Bright Future Public School.

```sql
-- 1. Active students per organization (platform health check).
SELECT o.name, count(s.id) AS active_students
FROM organizations o
LEFT JOIN students s
  ON s.organization_id = o.id
 AND s.status = 'ACTIVE'
 AND s.deleted_at IS NULL
GROUP BY o.name
ORDER BY active_students DESC;

-- 2. Find one payment by receipt number, inside one tenant.
SELECT p.receipt_no, p.amount, p.currency, p.mode, p.paid_at,
       st.first_name, st.last_name, st.admission_no
FROM payments p
JOIN students st ON st.id = p.student_id
WHERE p.organization_id = '00000000-0000-0000-0000-000000000001'
  AND p.receipt_no = 'RCPT-2027-000318';

-- 3. Unpaid invoices older than 30 days for one campus.
SELECT i.invoice_no, i.due_date, i.total_amount, i.balance_amount
FROM fee_invoices i
WHERE i.organization_id = '00000000-0000-0000-0000-000000000001'
  AND i.campus_id = '00000000-0000-0000-0000-0000000000a1'
  AND i.status <> 'PAID'
  AND i.due_date < current_date - INTERVAL '30 days'
ORDER BY i.due_date
LIMIT 50;

-- 4. Did the reminder reach this parent? Last 20 messages.
SELECT created_at, channel, status, recipient, template_key, error_message
FROM notification_logs
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
  AND recipient = '+919876543210'
ORDER BY created_at DESC
LIMIT 20;

-- 5. Safety check: any tenant table row with a NULL tenant?
SELECT count(*) AS orphan_rows
FROM students
WHERE organization_id IS NULL;
```

Snippet 5 must always answer `0`. If it ever does not, stop and read *Monitoring, Backups and Incident Response* before you touch anything.

## Ports and URLs for local development

| Service | Address | Started by |
|---|---|---|
| Web app (Next.js) | `http://localhost:3000` | `npm run dev` |
| API (Express 5) | `http://localhost:4000/api/v1` | `npm run dev` |
| API health check | `http://localhost:4000/api/v1/health` | `npm run dev` |
| API docs (OpenAPI) | `http://localhost:4000/api/v1/docs` | `npm run dev` |
| Queue dashboard | `http://localhost:4000/admin/queues` | `npm run dev` |
| BullMQ worker | No port | `npm run dev:worker` |
| PostgreSQL 16 | `localhost:5432`, database `eduflow_dev` | Docker Compose |
| Redis 7 | `localhost:6379` | Docker Compose |
| Mailpit inbox | `http://localhost:8025`, SMTP on `1025` | Docker Compose |
| Prisma Studio | `http://localhost:5555` | `npm run db:studio` |
| MinIO (optional) | `http://localhost:9000`, console `:9001` | Compose profile `s3` |

## Troubleshooting quick table

| Symptom | Likely cause | First thing to try |
|---|---|---|
| API exits at start with a variable name | That variable is missing or malformed in `server/.env` | Compare with `server/.env.example`, fill the value, restart |
| `EADDRINUSE` on port 4000 | An old API process still runs | `npx kill-port 4000`, then `npm run dev` |
| Imports from `@eduflow/shared` are not found | `shared/dist/` is stale after a branch switch | `npm run build -w shared` |
| Prisma says the client is out of date | Schema changed without a generate | `npm run db:generate` |
| `P1001: Can't reach database server` | Docker is not running, or the container is unhealthy | `npm run services:up`, then `docker compose ps` |
| Migration fails with "drift detected" | Someone changed the database by hand | `npm run db:status`, then `npm run db:reset` locally only |
| Every user hits the rate limit at once | `TRUST_PROXY` is `0` behind a proxy, so all IPs look the same | Set `TRUST_PROXY=1` and redeploy |
| Login works, refresh fails after 15 minutes | Wrong `COOKIE_DOMAIN` or `COOKIE_SECURE` for this environment | Check both values, clear cookies, log in again |
| CORS error in the browser console | Origin is not `*.{ROOT_DOMAIN}` and not in `CORS_EXTRA_ORIGINS` | Add the origin, restart the API |
| Jobs stay in "waiting" for ever | The worker is not running, or `QUEUE_PREFIX` differs between API and worker | Start `npm run dev:worker`, compare both values |
| WhatsApp webhook never arrives locally | Meta cannot reach a laptop | Start a tunnel and register its URL as described in *Local Development Setup* |
| No email arrives locally | `MAIL_TRANSPORT` is not `smtp`, or Mailpit is down | Open `http://localhost:8025` and check `docker compose ps` |
| Razorpay webhook returns 401 | `RAZORPAY_WEBHOOK_SECRET` does not match the dashboard value | Copy it again from Razorpay and restart |
| Vercel shows an old API URL | `NEXT_PUBLIC_` values are baked in at build time | Change the variable, then redeploy the client |
| A tenant sees another tenant's rows | The query skipped the tenant filter or RLS is off for this role | Stop, treat it as a Sev1, follow *Monitoring, Backups and Incident Response* |
