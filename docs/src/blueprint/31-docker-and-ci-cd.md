# Docker and CI/CD

**In simple words:** Docker packs the EduFlow server into one sealed box, called an image, that runs the same way on your laptop, on Railway and later on AWS. CI/CD (continuous integration and continuous delivery: machines that test every change and then ship it) turns a merge into a staging deploy and a version tag into a production deploy. This chapter gives you every file in full: the Dockerfiles, a Compose file for the full local stack, six GitHub Actions workflows and two helper scripts. When P-55 and P-56 generate these files, compare their output with this chapter line by line.

## The pipeline at a glance

A **workflow** is one YAML file in `.github/workflows/`. It holds **jobs**, and each job runs its **steps** on a **runner**, a fresh Linux machine that GitHub lends you for a few minutes. A **Docker image** is a read-only package of system files, Node.js and your compiled code; a **container** is one running copy of it.

**Figure: From pull request to production**

```mermaid
flowchart TD
  A["Pull request"] --> B{"ci.yml green?"}
  B -- "no" --> A
  B -- "yes" --> C["Merge to main,<br/>CI runs again"]
  C --> D["deploy-staging.yml:<br/>migrate, deploy, verify, e2e"]
  D --> E["You push tag v0.6.0"]
  E --> F["deploy-production.yml:<br/>gate, your approval"]
  F --> G["Backup, migrate,<br/>deploy, smoke test"]
  G --> H{"Healthy?"}
  H -- "no" --> I["Roll back code,<br/>fix database forward"]
```

Everything up to staging runs without you. Production needs two human actions: pushing the tag and clicking "Approve". A red step stops the train, and the old version keeps serving.

| File | What it does | Arrives |
|---|---|---|
| `server/Dockerfile`, `.dockerignore` | One image for the API and the worker | Day 53, P-55 |
| `client/Dockerfile`, `docker-compose.app.yml` | Web app image; full stack on your laptop | Optional |
| `.github/workflows/ci.yml` | Jobs `check`, `test`, `build`, `pr-title` on every pull request and push to `main` | Day 53, P-55 |
| `.github/workflows/deploy-staging.yml` | After green CI on `main`: migrate, deploy, verify, e2e, notify | Day 54, P-56 (e2e: Day 55, P-50) |
| `.github/workflows/deploy-production.yml` | On a tag `v*.*.*`: gate, approval, backup, migrate, deploy, smoke test | Day 54, P-56 |
| `.github/workflows/security.yml`, `.github/dependabot.yml` | npm audit, secret scan, update pull requests | Day 53, P-55 follow-up 1 |
| `.github/workflows/backup-check.yml` | Checks last night's backup daily, restores it on Sundays | Day 54 |
| `scripts/ci/wait-for-version.sh`, `smoke.sh` | Shared checks of both deploy workflows | Day 54 |

The nightly `backup.yml` also comes from P-56; its rules live in *Monitoring, Backups and Incident Response*. Platform clicks live in *Deploy on Vercel and Railway*.

## The server image

### One change before you build

On Railway the pipeline runs migrations from the GitHub runner. On AWS the database sits in a private network, and a one-off container from this image must do it (*Deploy on AWS*). So move the Prisma CLI from `devDependencies` to `dependencies` in `server/package.json`, keep the exact pinned version, and refresh the lock file:

```bash
# After moving the "prisma" line by hand in server/package.json:
npm install
npm ls prisma -w server        # shows one version, the pinned one
```

### The Dockerfile

The build context (the folder Docker may read) is the repo root, because the server needs the root `package-lock.json` and `shared/`. So you always build with `-f server/Dockerfile` and a dot at the end.

**File: `server/Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1
# EduFlow server: ONE image for the API and the BullMQ worker.
# Build from the repo root:  docker build -f server/Dockerfile -t eduflow-api .

# ---------- base: Node.js 24 plus what the Prisma engine needs ----------
FROM node:24-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# ---------- deps: every dependency, needed to compile ----------
FROM base AS deps
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm pkg delete scripts.prepare \
 && npm ci --no-audit --no-fund

# ---------- build: shared package, Prisma client, server ----------
FROM deps AS build
COPY tsconfig.base.json ./
COPY shared/ shared/
COPY server/ server/
RUN npm run build -w shared \
 && cd server \
 && npx prisma generate \
 && npm run build

# ---------- prod: runtime packages only, plus the compiled code ----------
FROM base AS prod
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm pkg delete scripts.prepare \
 && npm ci --omit=dev --workspace=server --workspace=shared --no-audit --no-fund
COPY server/prisma server/prisma
RUN cd server && npx prisma generate
COPY --from=build /app/shared/dist shared/dist
COPY --from=build /app/server/dist server/dist
COPY server/healthcheck.mjs server/

# ---------- runtime: what Railway and AWS actually run ----------
FROM base AS runtime
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini chromium fonts-noto-core \
 && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    PORT=4000 \
    CHROMIUM_PATH=/usr/bin/chromium \
    CHECKPOINT_DISABLE=1
COPY --from=prod /app /app
WORKDIR /app/server
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "healthcheck.mjs"]
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/server.js"]
```

**File: `server/healthcheck.mjs`**

```typescript
// Exit 0 when the API answers on /api/v1/health, 1 otherwise.
// Docker runs this every 30 seconds (HEALTHCHECK in server/Dockerfile).
const port = process.env.PORT ?? '4000';

try {
  const res = await fetch(`http://127.0.0.1:${port}/api/v1/health`, {
    signal: AbortSignal.timeout(4000),
  });
  process.exit(res.ok ? 0 : 1);
} catch {
  process.exit(1);
}
```

| Part | What it does and why |
|---|---|
| `node:24-bookworm-slim` | Debian 12 with Node.js 24. Not Alpine: Chromium, the Prisma engine and native modules just work on Debian. |
| `openssl ca-certificates` | The Prisma engine refuses to start without OpenSSL |
| `package.json` copies before `npm ci` | Dependencies get their own layer. Docker reuses it until a package file changes, so a code-only change skips the install. |
| `npm pkg delete scripts.prepare` | Removes the Husky `prepare` script inside the image only. Otherwise `npm ci` fails on "husky: not found". |
| `build` stage | Builds `shared`, generates the Prisma client (TypeScript needs its types), compiles the server to `dist/` |
| `prod` stage | `--omit=dev` plus two `--workspace` flags install only runtime packages of `server` and `shared`. It generates the client again next to them: at build time, never at start. |
| `tini` | A tiny init program as PID 1 (the first process). Passes the stop signal to Node.js and reaps finished Chromium processes. |
| `chromium fonts-noto-core` | Browser and Noto fonts with Devanagari, for the PDF printing that *System Architecture* decides |
| `CHROMIUM_PATH` | Where `lib/pdf.ts` finds the browser. Add it to `env.ts` as optional with this default. |
| `CHECKPOINT_DISABLE=1` | No Prisma update check calling out from production |
| `USER node` | The built-in non-root user. A compromised package cannot change the app files. |
| `HEALTHCHECK` | Compose and AWS notice a hung API. Railway uses its own healthcheck path. |
| `ENTRYPOINT` plus `CMD` | tini starts `node dist/server.js`. The worker replaces only `CMD`. |

`tsc` copies only compiled TypeScript. If your PDF templates live outside `src/`, for example in `server/templates/`, add a `COPY` line for them to the `prod` stage. Do the same for `prisma.config.ts` if P-04 chose that file over the `prisma` block in `package.json`.

> **Warning:** Do not add BuildKit cache mounts (`RUN --mount=type=cache`). Railway accepts them only with a Railway-specific `id`, and a plain one breaks the Railway build. Layer order alone keeps this file fast everywhere.

### Build and check it on your laptop

`server/.env.docker` is a copy of `server/.env` with the database and Redis hosts changed to `host.docker.internal` (how a container reaches your laptop on Docker Desktop). It stays out of Git.

```bash
docker build -f server/Dockerfile -t eduflow-api .
docker run --rm eduflow-api whoami           # prints "node", never "root"
docker run --rm eduflow-api ls -a            # dist, healthcheck.mjs, package.json, prisma
docker run --rm --env-file server/.env.docker -p 4000:4000 eduflow-api
curl -i http://localhost:4000/api/v1/health  # second terminal: HTTP/1.1 200
docker image ls eduflow-api                  # size check
```

Expect 700 to 900 MB (Estimate: slim base about 200 MB, Chromium with fonts about 350 MB, runtime packages about 150 MB). The size costs build time, not money.

### The .dockerignore file

Docker uploads the whole build context before the first line runs. This file keeps that upload small and free of secrets.

**File: `.dockerignore` (repo root)**

```text
# Never inside an image: secrets, Git data, local tools
.git
.github
.claude
.vscode
.husky
**/.env
**/.env.*
**/*.pem
**/*.dump

# Rebuilt inside the image, so never copied from the laptop
**/node_modules
**/dist
**/.next
**/*.tsbuildinfo

# Not needed to build or run
docs
*.md
**/coverage
**/playwright-report
**/test-results
client/e2e
```

`**/node_modules` also stops Windows-compiled packages from reaching a Linux image.

## The worker: same image, other command

The API and the worker are one codebase with two entry points, `dist/server.js` and `dist/jobs/worker.js` (*Folder Structure*). So there is no second Dockerfile. The worker runs the same image and replaces only the command.

| Where | Worker command | Healthcheck |
|---|---|---|
| `docker run` | `docker run --rm --env-file server/.env.docker eduflow-api node dist/jobs/worker.js` | None |
| Compose | `command: ["node", "dist/jobs/worker.js"]` | `disable: true` |
| Railway | Service `worker`, custom start command `node dist/jobs/worker.js` | No healthcheck path |
| AWS ECS, later | The `command` field of the worker task definition | None |

- **Stopping.** On every deploy the platform sends SIGTERM (the polite "please stop" signal). tini passes it on, and `worker.ts` calls `close()` on each BullMQ worker, which waits for running jobs. Allow at least 30 seconds before the hard kill; Railway calls this the draining time.
- **Chromium in a container.** Launch it in `lib/pdf.ts` with `--no-sandbox` and `--disable-dev-shm-usage`. Containers get only 64 MB of shared memory, and the sandbox needs kernel features most hosts switch off. You print only your own templates, so this is acceptable.

## Optional: a container for the web app

The web app runs on Vercel and needs no Dockerfile. You need this one only for the local full stack, or when the client moves to AWS. Next.js "standalone" output copies only the files the server really uses into `.next/standalone/`.

**File: `client/next.config.ts` (the two lines to add)**

```typescript
import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // The monorepo root, so the trace includes shared/ and the root node_modules.
  outputFileTracingRoot: path.join(process.cwd(), '..'),
};

export default nextConfig;
```

Keep your other settings in the same object. During `npm run build -w client` the working folder is `client/`, so `..` is the repo root. Vercel builds fine with these settings.

**File: `client/Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1
# EduFlow web app as a container. Vercel does NOT use this file.
# Build from the repo root:
#   docker build -f client/Dockerfile -t eduflow-web \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.eduflow.app/api/v1 .

FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm pkg delete scripts.prepare \
 && npm ci --no-audit --no-fund

FROM deps AS build
# NEXT_PUBLIC_ values are baked into the JavaScript at build time.
ARG NEXT_PUBLIC_APP_ENV=local
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ARG NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
ARG NEXT_PUBLIC_APP_VERSION=dev
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN \
    NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION \
    NEXT_TELEMETRY_DISABLED=1
COPY tsconfig.base.json ./
COPY shared/ shared/
COPY client/ client/
RUN npm run build -w shared \
 && npm run build -w client

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/client/.next/standalone ./
COPY --from=build --chown=node:node /app/client/.next/static ./client/.next/static
COPY --from=build --chown=node:node /app/client/public ./client/public
USER node
EXPOSE 3000
CMD ["node", "client/server.js"]
```

- `NEXT_PUBLIC_` values are written into the browser code during `next build`, so one image serves exactly one environment.
- `HOSTNAME=0.0.0.0` makes Next.js listen on all network interfaces, so the container can be reached from outside.
- Standalone output leaves out `static` and `public` on purpose, so they are copied separately.

## The full stack on your laptop

Day to day, `npm run dev` is faster. Before a release that changes a Dockerfile, or when a bug appears only on Railway, run the real images locally. This file sits on top of the `docker-compose.yml` from *Local Development Setup* and reuses its PostgreSQL, Redis and Mailpit.

**File: `docker-compose.app.yml` (repo root)**

```yaml
# The production images next to the dev services of docker-compose.yml.
#   docker compose -f docker-compose.yml -f docker-compose.app.yml up -d --build
# Add "--profile web" to also run the web app container on port 3000.

x-server: &server
  build:
    context: .
    dockerfile: server/Dockerfile
  image: eduflow-api:local
  env_file: server/.env.docker
  environment: &server-env
    # Same users and passwords as server/.env, host changed to the service name.
    DATABASE_URL: postgresql://eduflow_app:eduflow_app_local@postgres:5432/eduflow_dev
    REDIS_URL: redis://redis:6379
    SMTP_HOST: mailpit
    SMTP_PORT: "1025"
    APP_VERSION: local-docker

services:
  migrate:
    <<: *server
    command: ["npx", "prisma", "migrate", "deploy"]
    environment:
      <<: *server-env
      DATABASE_URL: postgresql://eduflow:eduflow_local_pw@postgres:5432/eduflow_dev
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      disable: true
    restart: "no"

  api:
    <<: *server
    ports:
      - "127.0.0.1:4000:4000"
    depends_on:
      migrate:
        condition: service_completed_successfully
      redis:
        condition: service_healthy
    restart: unless-stopped

  worker:
    <<: *server
    command: ["node", "dist/jobs/worker.js"]
    healthcheck:
      disable: true
    depends_on:
      migrate:
        condition: service_completed_successfully
      redis:
        condition: service_healthy
    restart: unless-stopped

  web:
    profiles: ["web"]
    build:
      context: .
      dockerfile: client/Dockerfile
      args:
        NEXT_PUBLIC_APP_ENV: local
        NEXT_PUBLIC_API_URL: http://localhost:4000/api/v1
        NEXT_PUBLIC_ROOT_DOMAIN: localhost:3000
    image: eduflow-web:local
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      api:
        condition: service_healthy
```

How it fits together:

- `x-server` is a reusable block (a YAML anchor). The three server services share the build, the image name and the environment, and differ only in their command.
- `environment` wins over `env_file`. So `server/.env.docker` keeps all your keys, and only the hosts change to the Compose service names `postgres`, `redis` and `mailpit`.
- `migrate` is a one-shot container. It applies pending migrations with the owner role and exits. The API and the worker start only after it exits with success, exactly like the pipeline.
- It uses your normal dev database, so the demo data from `npm run db:seed` is already there.

```bash
docker compose -f docker-compose.yml -f docker-compose.app.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.app.yml ps
docker compose -f docker-compose.yml -f docker-compose.app.yml logs -f worker
docker compose -f docker-compose.yml -f docker-compose.app.yml down
```

Stop `npm run dev` first. Both use port 4000. Add two short scripts to the root `package.json` if you use this often: `"stack:up"` and `"stack:down"` with the first and last command above.

## Continuous integration: ci.yml

CI runs on every pull request and again on every push to `main`. The run on `main` is the signal that starts the staging deploy. The four job names are the required checks of branch protection, so do not rename them later.

**File: `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

env:
  HUSKY: "0"

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - name: Prisma schema is valid and the client is generated
        working-directory: server
        env:
          DATABASE_URL: postgresql://ci:ci@localhost:5432/ci
        run: |
          npx prisma validate
          npx prisma generate
      - run: npm run lint
      - run: npm run format:check
      - run: npm run typecheck
      - name: Merged migrations are never edited
        if: github.event_name == 'pull_request'
        env:
          BASE_REF: ${{ github.base_ref }}
        run: |
          changed=$(git diff --name-status "origin/$BASE_REF...HEAD" \
            -- 'server/prisma/*migrations/*' \
            | grep -v '^A' | grep -v 'migration_lock' || true)
          if [ -n "$changed" ]; then
            echo "Existing migration files were changed or deleted:"
            echo "$changed"
            exit 1
          fi

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
      APP_ENV: test
      DATABASE_URL: postgresql://eduflow_app:eduflow_app@localhost:5432/eduflow_test
      DATABASE_OWNER_URL: postgresql://eduflow:eduflow@localhost:5432/eduflow_test
      REDIS_URL: redis://localhost:6379/1
      QUEUE_PREFIX: eduflow-ci
      JWT_ACCESS_SECRET: ci-only-access-secret-0123456789abcdef
      JWT_REFRESH_SECRET: ci-only-refresh-secret-0123456789abcdef
      REFRESH_COOKIE_NAME: eduflow_rt
      COOKIE_SECURE: "false"
      FIELD_ENCRYPTION_KEY: MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=
      ROOT_DOMAIN: localhost
      APP_URL: http://localhost:3000
      API_URL: http://localhost:4000
      S3_BUCKET_UPLOADS: eduflow-ci-uploads
      MAIL_TRANSPORT: smtp
      MAIL_FROM: no-reply@eduflow.example
      MESSAGING_MODE: log
      RAZORPAY_WEBHOOK_SECRET: test-webhook-secret
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - name: Generate the Prisma client
        run: npx prisma generate
        working-directory: server
      - name: Unit, integration and isolation tests with coverage
        run: npm run test:coverage -w server
      - name: Shared and client unit tests
        run: |
          npm run test -w shared
          npm run test -w client --if-present
      - name: Keep the coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: server-coverage
          path: server/coverage/
          retention-days: 7

  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      NEXT_PUBLIC_APP_ENV: local
      NEXT_PUBLIC_API_URL: http://localhost:4000/api/v1
      NEXT_PUBLIC_ROOT_DOMAIN: localhost:3000
      NEXT_TELEMETRY_DISABLED: "1"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - name: Generate the Prisma client
        run: npx prisma generate
        working-directory: server
      - name: Build shared, server and client
        run: npm run build
      - name: Build the server image (no push)
        run: docker build -f server/Dockerfile -t eduflow-api:ci .
      - name: The image does not run as root
        run: |
          user=$(docker run --rm eduflow-api:ci whoami)
          echo "Container user: $user"
          test "$user" != "root"

  pr-title:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - name: Lint the PR title
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
        run: echo "$PR_TITLE" | npx commitlint
```

| Part | Meaning |
|---|---|
| `permissions: contents: read` | The job token can read the code and nothing else. A hijacked step cannot push or comment. |
| `concurrency` | A new push to the same pull request cancels the older run. Runs on `main` are never cancelled, because each one may start a deploy. |
| `HUSKY: "0"` | Git hooks are not installed on the runner. They are useless there. |
| `node-version-file: .nvmrc` | CI uses the same Node.js major as your laptop: 24 |
| `cache: npm` | Stores the npm download cache, keyed on `package-lock.json`. `npm ci` then takes about 30 seconds instead of 90. |
| `DATABASE_URL` in `check` | A dummy value. `prisma validate` reads the schema, which names this variable, but never connects. |
| "Merged migrations are never edited" | Fails when a pull request changes or deletes an existing migration file. New files (`A`) are fine. This enforces rule one of *Git Workflow: Branches, Commits and Pull Requests*. |
| `test` job | The job from *Testing Strategy for a Solo Founder*, plus every variable that `env.ts` in *Environments and Configuration* requires. The Zod check stops the tests at import time if one is missing. |
| `DATABASE_OWNER_URL` | The owner-role name that the test setup reads. The deploy pipelines use `DATABASE_ADMIN_URL` for the same role. |
| `docker build` in `build` | Proves the Dockerfile still builds before anything reaches `main`. Nothing is pushed anywhere. |
| `pr-title` | Commitlint on the title. The title comes in through `env:`, never through `${{ }}` inside `run:`, which closes a script-injection hole. |

*Git Workflow: Branches, Commits and Pull Requests* lists `lint` and `typecheck` as separate required checks. In this file they are two steps of the `check` job, which saves one `npm ci` per run. Select `check`, `test`, `build` and `pr-title` as required checks.

> **Warning:** Never add `paths:` or `paths-ignore:` to the `on:` block of `ci.yml`. A docs-only pull request would then start no run at all, the required checks would wait for ever, and the merge button would stay locked. A job skipped by an `if:` condition counts as passed; a workflow that never starts does not.

## Deploy to staging: deploy-staging.yml

Staging deploys itself after every merge, but only when CI on that exact commit is green. The trigger `workflow_run` does this: it waits for the workflow named `CI` to finish on `main`, then reads its result. The name in `workflows: [CI]` must match the `name:` line of `ci.yml` exactly.

Railway builds the image itself from `server/Dockerfile`. The pipeline uploads the checked-out code with `railway up`. So the image that runs is built from the same file that CI just tested, at the same commit.

**File: `.github/workflows/deploy-staging.yml`**

```yaml
name: Deploy staging

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: deploy-staging
  cancel-in-progress: false

env:
  SHA: ${{ github.event.workflow_run.head_sha || github.sha }}

jobs:
  migrate:
    if: >-
      github.event_name == 'workflow_dispatch' ||
      (github.event.workflow_run.conclusion == 'success' &&
      github.event.workflow_run.event == 'push')
    runs-on: ubuntu-latest
    environment: staging
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ env.SHA }}
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - name: Apply migrations with the owner role
        working-directory: server
        env:
          DATABASE_URL: ${{ secrets.DATABASE_ADMIN_URL }}
        run: npx prisma migrate deploy

  deploy:
    needs: migrate
    runs-on: ubuntu-latest
    environment: staging
    timeout-minutes: 20
    strategy:
      matrix:
        service: [api, worker]
    env:
      RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      SERVICE: ${{ matrix.service }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ env.SHA }}
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
      - name: Install the Railway CLI
        run: npm install --global @railway/cli
      - name: Stamp the version, then build and deploy on Railway
        run: |
          railway variables --service "$SERVICE" --set "APP_VERSION=$SHA" --skip-deploys
          railway up --service "$SERVICE" --ci

  client:
    needs: migrate
    runs-on: ubuntu-latest
    environment: staging
    timeout-minutes: 15
    env:
      VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ env.SHA }}
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - name: Install the Vercel CLI
        run: npm install --global vercel
      - name: Build and deploy the staging web app
        run: |
          vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
          NEXT_PUBLIC_APP_VERSION="$SHA" vercel build --prod --token="$VERCEL_TOKEN"
          vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"

  verify:
    needs: [deploy, client]
    runs-on: ubuntu-latest
    environment: staging
    timeout-minutes: 15
    env:
      API_BASE_URL: ${{ vars.API_BASE_URL }}
      WEB_URL: ${{ vars.WEB_URL }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ env.SHA }}
      - name: Wait until staging runs this commit
        run: bash scripts/ci/wait-for-version.sh "$API_BASE_URL" "$SHA"
      - name: Read-only smoke test
        run: bash scripts/ci/smoke.sh "$API_BASE_URL" "$WEB_URL"

  e2e:
    needs: verify
    runs-on: ubuntu-latest
    environment: staging
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ env.SHA }}
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - name: Install Chromium for Playwright
        run: npx playwright install --with-deps chromium
        working-directory: client
      - name: Six critical flows against staging
        run: npm run test:e2e -w client
        env:
          E2E_BASE_URL: ${{ vars.WEB_URL }}
          E2E_API_URL: ${{ vars.API_BASE_URL }}/api/v1
          E2E_STAFF_PASSWORD: ${{ secrets.E2E_STAFF_PASSWORD }}
          E2E_RAZORPAY_WEBHOOK_SECRET: ${{ secrets.E2E_RAZORPAY_WEBHOOK_SECRET }}
      - name: Keep the report of a failed run
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: client/playwright-report/
          retention-days: 7

  notify:
    needs: [migrate, deploy, client, verify, e2e]
    if: always() && needs.migrate.result != 'skipped'
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Post the result to the team chat
        env:
          WEBHOOK: ${{ secrets.DEPLOY_WEBHOOK_URL }}
          FAILED: ${{ contains(needs.*.result, 'failure') || contains(needs.*.result, 'cancelled') }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
        run: |
          if [ -z "$WEBHOOK" ]; then exit 0; fi
          if [ "$FAILED" = "true" ]; then status="FAILED"; else status="OK"; fi
          text="Staging deploy $status for ${SHA:0:7}. $RUN_URL"
          jq -n --arg text "$text" '{text: $text}' \
            | curl -fsS -X POST -H 'Content-Type: application/json' -d @- "$WEBHOOK"
```

Read it job by job:

1. **`migrate`** runs only for a green CI run that came from a push to `main`. A pull request from a branch that someone named `main` cannot trigger it. It applies pending migrations with the owner role, before any new code starts. If it fails, every later job is skipped and the old version keeps running.
2. **`deploy`** runs twice in parallel, once for `api` and once for `worker` (a matrix). It writes the commit SHA (the unique ID of a commit) into `APP_VERSION`, then uploads the code. Railway builds `server/Dockerfile` and switches traffic only when the new API passes its healthcheck path. `--ci` streams the build log and fails the job if the build fails.
3. **`client`** builds the web app on the runner and uploads the result to the Vercel project of staging. Inside that project, "production" simply means `staging.eduflow.app`.
4. **`verify`** waits until `/api/v1/health` reports this commit, then runs the read-only smoke test.
5. **`e2e`** runs the Playwright flows from P-50 against staging. Browsers are installed only here, never in pull-request CI.
6. **`notify`** posts one line to your chat. It uses the Slack message format `{"text": "..."}`. A Discord webhook accepts the same format when you add `/slack` to the end of its URL.

Three platform settings belong to this workflow. The clicks are in *Deploy on Vercel and Railway*:

- On both Railway services, set the variable `RAILWAY_DOCKERFILE_PATH=server/Dockerfile` and switch off automatic deploys from GitHub. Otherwise Railway deploys every push to `main` by itself, before migrations and even to production.
- On the `api` service only, set the healthcheck path to `/api/v1/health/ready`.
- Vercel must not deploy `main` by itself either. Previews for pull requests stay on. Add this file:

**File: `client/vercel.json`**

```json
{
  "git": {
    "deploymentEnabled": {
      "main": false
    }
  }
}
```

> **Note:** The Railway CLI flags used here (`up --service --ci`, `variables --service --set --skip-deploys`) match the CLI help at the time of writing. P-56 tells Claude to run `railway --help` before it writes a command, and you should compare once too. If `--skip-deploys` is missing in your version, drop it: Railway then starts one extra deploy with the old code, which `railway up` replaces a minute later. The `verify` job catches any version mix-up, because it waits for the exact SHA.

### The two helper scripts

Both deploy workflows call the same scripts, so staging and production are checked the same way. Run them with `bash`, so the executable bit, which Windows does not keep, does not matter.

**File: `scripts/ci/wait-for-version.sh`**

```bash
#!/usr/bin/env bash
# Usage: bash scripts/ci/wait-for-version.sh <api-base-url> <expected-version>
# Waits up to 10 minutes until the API is ready AND reports the expected version.
set -euo pipefail

api="$1"
expected="$2"

for attempt in $(seq 1 40); do
  version=$(curl -fsS --max-time 5 "$api/api/v1/health" \
    | jq -r '.data.version // empty' || true)
  if [ "$version" = "$expected" ] \
    && curl -fsS --max-time 5 -o /dev/null "$api/api/v1/health/ready"; then
    echo "Ready: $api runs $expected (attempt $attempt)"
    exit 0
  fi
  echo "Attempt $attempt: running '${version:-nothing}', waiting for '$expected'"
  sleep 15
done

echo "Timed out: $api never reported version $expected"
exit 1
```

**File: `scripts/ci/smoke.sh`**

```bash
#!/usr/bin/env bash
# Usage: bash scripts/ci/smoke.sh <api-base-url> <web-url>
# Read-only checks. They never create, change or delete data.
set -uo pipefail

api="$1"
web="$2"
failed=0

check() {
  local name="$1" url="$2" want="$3" got
  got=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url") || true
  if [ "$got" = "$want" ]; then
    echo "PASS  $name ($got)"
  else
    echo "FAIL  $name: expected $want, got $got"
    failed=1
  fi
}

check "API health"                "$api/api/v1/health"       200
check "API ready (DB and Redis)"  "$api/api/v1/health/ready" 200
check "Login page"                "$web/login"               200
check "Anonymous request refused" "$api/api/v1/students"     401
check "API docs hidden"           "$api/api/v1/docs"         404

exit "$failed"
```

The last two checks are security checks. A protected list must answer `401 UNAUTHENTICATED` without a token, and the OpenAPI page exists in development only. The eight manual smoke checks with logins and a test fee stay with you, as listed in *Environments and Configuration*.

## Deploy to production: deploy-production.yml

Production starts from a tag. Before anything touches the production database, a `gate` job checks three facts: the ref is a real release tag, the tagged commit is on `main`, and CI passed for exactly that commit. Then the `release` job waits for your approval in the GitHub environment `production`.

**File: `.github/workflows/deploy-production.yml`**

```yaml
name: Deploy production

on:
  push:
    tags:
      - "v*.*.*"
  workflow_dispatch:

permissions:
  contents: read
  actions: read

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  gate:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Only a release tag may deploy
        run: |
          if [[ ! "$GITHUB_REF" =~ ^refs/tags/v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "Start this workflow from a release tag, not from $GITHUB_REF"
            exit 1
          fi
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: The tagged commit is on main
        run: git merge-base --is-ancestor "$GITHUB_SHA" origin/main
      - name: CI passed for the tagged commit
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          url="repos/$GITHUB_REPOSITORY/actions/workflows/ci.yml/runs"
          runs=$(gh api "$url?head_sha=$GITHUB_SHA&status=success" --jq '.total_count')
          if [ "$runs" -lt 1 ]; then
            echo "No green CI run for $GITHUB_SHA"
            exit 1
          fi

  release:
    needs: gate
    runs-on: ubuntu-latest
    environment: production
    timeout-minutes: 45
    env:
      TAG: ${{ github.ref_name }}
      API_BASE_URL: ${{ vars.API_BASE_URL }}
      WEB_URL: ${{ vars.WEB_URL }}
      RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci

      - name: Backup right before the migration
        if: github.event_name == 'push'
        env:
          DATABASE_ADMIN_URL: ${{ secrets.DATABASE_ADMIN_URL }}
          AWS_ACCESS_KEY_ID: ${{ secrets.BACKUP_AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.BACKUP_AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: ap-south-1
          BUCKET: ${{ vars.S3_BUCKET_BACKUPS }}
        run: |
          docker run --rm -e DATABASE_ADMIN_URL postgres:16 \
            sh -c 'pg_dump --format=custom --no-owner "$DATABASE_ADMIN_URL"' > pre-deploy.dump
          test -s pre-deploy.dump
          aws s3 cp pre-deploy.dump "s3://$BUCKET/pre-deploy/$TAG.dump" --only-show-errors
          rm pre-deploy.dump

      - name: Apply migrations with the owner role
        if: github.event_name == 'push'
        working-directory: server
        env:
          DATABASE_URL: ${{ secrets.DATABASE_ADMIN_URL }}
        run: npx prisma migrate deploy

      - name: Install the Railway and Vercel CLIs
        run: npm install --global @railway/cli vercel

      - name: Deploy API and worker
        run: |
          for service in api worker; do
            railway variables --service "$service" --set "APP_VERSION=$TAG" --skip-deploys
            railway up --service "$service" --ci
          done

      - name: Deploy the web app
        run: |
          vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
          NEXT_PUBLIC_APP_VERSION="$TAG" vercel build --prod --token="$VERCEL_TOKEN"
          vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"

      - name: Wait until production runs this tag
        run: bash scripts/ci/wait-for-version.sh "$API_BASE_URL" "$TAG"

      - name: Read-only smoke test
        run: bash scripts/ci/smoke.sh "$API_BASE_URL" "$WEB_URL"

      - name: Post the result to the team chat
        if: always()
        env:
          WEBHOOK: ${{ secrets.DEPLOY_WEBHOOK_URL }}
          STATUS: ${{ job.status }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
        run: |
          if [ -z "$WEBHOOK" ]; then exit 0; fi
          text="PRODUCTION $TAG: $STATUS. $RUN_URL"
          jq -n --arg text "$text" '{text: $text}' \
            | curl -fsS -X POST -H 'Content-Type: application/json' -d @- "$WEBHOOK"
```

What happens after `git push origin v0.6.0`:

1. `gate` runs at once, in under a minute. A tag on a side branch, or a commit whose CI was red, stops here.
2. `release` pauses. GitHub shows "Review deployments" on the run page and in the GitHub mobile app. You approve when you are at your desk, inside the deploy window from *Environments and Configuration*.
3. `pg_dump` runs inside the `postgres:16` image, so the dump tool always matches the server version. The dump goes to the backup bucket as `pre-deploy/v0.6.0.dump`. If the dump is empty, `test -s` stops the release before the migration.
4. Migrations, then API and worker, then the web app. Pilots stay logged in, because nothing about the cookie changes.
5. The same wait and smoke scripts as staging. A red step here does not undo anything by itself. You decide, with the rollback table below.

The whole job is one job on purpose. Every job that names a protected environment asks for its own approval. With one job, you click once.

`workflow_dispatch` is the rollback path. You start the workflow from an older tag (see "Rolling back"). The two `if: github.event_name == 'push'` lines then skip the backup and the migrations, because old code never needs old migrations. To retry a release that failed for an outside reason, such as a Railway outage, use "Re-run failed jobs" on the run page instead. That repeats the original push event, migrations included, and `migrate deploy` skips what is already applied.

## Database migrations in the pipeline

The rules for writing migrations (never edit a merged one, fix forward, expand-and-contract, the safe and unsafe changes table) are in *Git Workflow: Branches, Commits and Pull Requests*. This section covers only how the pipeline runs them.

| Where | Command | Database role | Runs before the new code | Backup first |
|---|---|---|---|---|
| CI, `test` job | `prisma migrate deploy` on an empty database | Owner, via the test global setup | Yes, replayed from zero on every run | Not needed |
| Local full stack | The `migrate` container | Owner | Yes | Not needed |
| Staging | `prisma migrate deploy` in the `migrate` job | Owner, via `DATABASE_ADMIN_URL` | Yes | Railway's daily backup |
| Production | `prisma migrate deploy` in the `release` job | Owner, via `DATABASE_ADMIN_URL` | Yes | Automatic dump, minutes old |
| AWS, later | A one-off container from the same image | Owner | Yes | RDS snapshot (*Deploy on AWS*) |

Why the migration is a pipeline step and never part of the container start:

- **Several containers start at once.** Two API replicas plus a worker would race to apply the same migration.
- **A failed migration would crash-loop the API.** As a pipeline step, a failure stops the deploy while the old version keeps serving.
- **The runtime role cannot do it.** The API connects as `eduflow_app`, which may not create tables. Only the migration step ever sees the owner URL.

Staging is the rehearsal. Every migration runs there first, with the same SQL, a few hours or days before production. Open the log of the staging `migrate` job and note how long the step took. If it took more than a few seconds on staging's small data, expect it to take much longer on production, and follow the "Partial" and "No" rows of the safe-changes table.

When the migrate step fails:

1. The job turns red, and every later job is skipped. Nothing new is deployed.
2. Read the Prisma error in the log. It names the migration and the SQL statement.
3. PostgreSQL rolls back a failed statement, but Prisma records the migration as failed, and the next `migrate deploy` refuses to continue. Repair the state and mark it with `prisma migrate resolve`, as *Git Workflow: Branches, Commits and Pull Requests* describes.
4. Ship the correction as a new migration in a new pull request. Never edit the file that failed.

> **Warning:** The GitHub runner reaches the Railway databases through Railway's public TCP proxy (a public address that forwards to the private database). The owner password is therefore the only lock on that door. Make it long and random, keep it only in the GitHub environment and your password manager, and rotate it every 12 months, as *Environments and Configuration* schedules. On AWS the database has no public address, which is why the image carries the Prisma CLI.

## Security workflow: security.yml

This workflow looks for two kinds of danger: known holes in the packages you use, and secrets that slipped into Git.

**File: `.github/workflows/security.yml`**

```yaml
name: Security

on:
  pull_request:
  schedule:
    - cron: "0 3 * * 1"
  workflow_dispatch:

permissions:
  contents: read

jobs:
  audit:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
      - name: Known vulnerabilities in runtime packages
        run: npm audit --omit=dev --audit-level=high

  secrets:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Scan the whole Git history with gitleaks
        run: |
          docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest \
            git /repo --redact --verbose
```

- **`audit`** reads only `package-lock.json`, so it needs no `npm ci`. `--omit=dev` ignores tools that never reach production. `--audit-level=high` fails only on high and critical findings. Keep it out of the required checks: a new advisory can appear overnight for a package that no pull request touched. When the Monday run turns red, open a `chore(deps)` pull request that day.
- **`secrets`** runs gitleaks (an open-source secret scanner) from its official Docker image over every commit. `--redact` hides the found value in the log, because every collaborator can read Actions logs. The `git` subcommand exists from gitleaks 8.19; older versions use `detect --source`. Run the image with `--help` once, then replace `latest` with the version tag you checked.
- If gitleaks finds a real secret, the order is fixed: rotate it first (*Environments and Configuration*), purge the history second (*Git Workflow: Branches, Commits and Pull Requests*).

Dependabot (GitHub's free update robot) watches the same packages every day and opens update pull requests on a schedule. Switch on "Dependabot alerts" and "Dependabot security updates" in the repository's security settings, then commit this file.

**File: `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5
    commit-message:
      prefix: chore
      include: scope
    groups:
      minor-and-patch:
        update-types: ["minor", "patch"]
    ignore:
      # Canon: Prisma stays pinned until after the MVP.
      - dependency-name: "prisma"
        update-types: ["version-update:semver-major", "version-update:semver-minor"]
      - dependency-name: "@prisma/client"
        update-types: ["version-update:semver-major", "version-update:semver-minor"]

  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: monthly
    commit-message:
      prefix: ci

  - package-ecosystem: docker
    directory: "/server"
    schedule:
      interval: monthly
    commit-message:
      prefix: chore
      include: scope
```

The `commit-message` prefixes give Dependabot titles such as `chore(deps): bump zod from 3.25.0 to 3.25.1`, which pass the `pr-title` check. The `groups` block bundles all small updates into one weekly pull request instead of twenty.

GitHub's own deeper scanners depend on your plan (Estimate, based on GitHub's public plan pages as of 2026; verify before you rely on it):

| Tool | Public repository | Private repository, personal account on GitHub Pro | EduFlow today |
|---|---|---|---|
| Dependabot alerts and update pull requests | Free | Free | On from Day 53 |
| npm audit and gitleaks in Actions | Free | Uses Actions minutes | `security.yml` |
| Secret scanning with push protection | Free | Paid add-on for organization accounts | gitleaks in CI and the pre-commit hook |
| CodeQL code scanning | Free | Paid add-on (Code Security) | Later |
| Dependency review action | Free | Needs Code Security | Later |

When the company moves the repository into a GitHub organization and buys Code Security, add these two jobs to `security.yml`. Use the major versions that GitHub's documentation shows on that day.

```yaml
  dependency-review:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high

  codeql:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript
      - uses: github/codeql-action/analyze@v3
```

## Scheduled backup check: backup-check.yml

A backup that nobody checks is a hope, not a backup. The nightly `backup.yml` from P-56 writes `<date>/eduflow-prod.dump` to the backup bucket at 02:00 IST. This workflow checks every morning that last night's file exists and has a sane size. Every Sunday it also restores the file into a throwaway PostgreSQL 16 and counts rows.

**File: `.github/workflows/backup-check.yml`**

```yaml
name: Backup check

on:
  schedule:
    - cron: "20 22 * * *"   # 03:50 IST daily: does last night's backup exist?
    - cron: "50 22 * * 6"   # Sunday 04:20 IST: also restore it and count rows
  workflow_dispatch:

permissions:
  contents: read

jobs:
  backup-check:
    runs-on: ubuntu-latest
    environment: backups
    timeout-minutes: 30
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: restore_only
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.BACKUP_READ_AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.BACKUP_READ_AWS_SECRET_ACCESS_KEY }}
      AWS_DEFAULT_REGION: ap-south-1
      BUCKET: ${{ vars.S3_BUCKET_BACKUPS }}
      MIN_BYTES: ${{ vars.BACKUP_MIN_BYTES || '1000000' }}
      PG: ${{ job.services.postgres.id }}
    steps:
      - name: Last night's backup exists and is big enough
        run: |
          key="$(TZ=Asia/Kolkata date +%F)/eduflow-prod.dump"
          size=$(aws s3api head-object --bucket "$BUCKET" --key "$key" \
            --query ContentLength --output text)
          echo "Found s3://$BUCKET/$key with $size bytes"
          if [ "$size" -lt "$MIN_BYTES" ]; then
            echo "Backup is smaller than $MIN_BYTES bytes"
            exit 1
          fi
          echo "KEY=$key" >> "$GITHUB_ENV"

      - name: Restore into a throwaway database (Sundays and manual runs)
        if: github.event.schedule == '50 22 * * 6' || github.event_name == 'workflow_dispatch'
        run: |
          aws s3 cp "s3://$BUCKET/$KEY" backup.dump --only-show-errors
          docker cp backup.dump "$PG:/tmp/backup.dump"
          docker exec "$PG" createdb -U postgres restore_check
          docker exec "$PG" psql -U postgres -c "CREATE ROLE eduflow_app NOLOGIN"
          docker exec "$PG" pg_restore -U postgres -d restore_check \
            --no-owner --no-acl --exit-on-error /tmp/backup.dump
          orgs=$(docker exec "$PG" psql -U postgres -d restore_check -At \
            -c "SELECT count(*) FROM organizations")
          migrations=$(docker exec "$PG" psql -U postgres -d restore_check -At \
            -c "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL")
          echo "Restored: $orgs organizations, $migrations applied migrations"
          if [ "$orgs" -lt 1 ] || [ "$migrations" -lt 1 ]; then
            echo "The restored database looks empty"
            exit 1
          fi
          rm -f backup.dump

      - name: Tell the uptime monitor that the check passed
        env:
          HEARTBEAT_URL: ${{ secrets.BACKUP_CHECK_HEARTBEAT_URL }}
        run: curl -fsS --max-time 10 "$HEARTBEAT_URL" > /dev/null
```

- **Cron times are UTC.** `20 22 * * *` is 03:50 IST. Minutes other than `00` are on purpose: GitHub delays many scheduled runs at the top of the hour.
- **Its own environment.** `backups` has no reviewer. A scheduled job in `production` would wait for an approval that never comes. It also holds only read keys: an IAM user with `s3:GetObject` and `s3:ListBucket` on the backup bucket and nothing else.
- **The restore runs inside the service container** through `docker exec`, so `pg_restore` always matches PostgreSQL 16. `--no-owner --no-acl` skips the production roles. The `eduflow_app` role is created first, because Row-Level Security policies may name it.
- **The heartbeat closes the loop.** Better Stack expects one ping every 24 hours. A failed check sends no ping, and a check that never ran sends none either, so both raise an alert. GitHub also emails a failed scheduled run to the person who last edited the cron line.
- **The folder date is the IST date.** If your `backup.yml` names folders by UTC date, change the `TZ=` part.

This weekly automatic restore does not replace the monthly restore drill by hand in *Monitoring, Backups and Incident Response*. The machine proves the file is readable; the drill proves that you can bring EduFlow back.

## Secrets and variables in GitHub

A GitHub **environment** is a named box of secrets, variables and protection rules that a job opts into with `environment:`. Create three in the repository settings: `staging`, `production` and `backups`. A **secret** is write-only: GitHub masks it in logs and never shows it again. A **variable** is plain configuration and readable.

| Name | Type | Stored in | Used by | Value |
|---|---|---|---|---|
| `DATABASE_ADMIN_URL` | Secret | `staging`, `production` (different values) | Migrate, pre-deploy backup | Owner-role URL through Railway's TCP proxy |
| `RAILWAY_TOKEN` | Secret | `staging`, `production` | `railway` CLI | A project token of that Railway environment |
| `VERCEL_TOKEN` | Secret | `staging`, `production` | `vercel` CLI | Token from your Vercel account settings |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Secret | `staging`, `production` | `vercel` CLI | From `.vercel/project.json` after `vercel link` |
| `E2E_STAFF_PASSWORD`, `E2E_RAZORPAY_WEBHOOK_SECRET` | Secret | `staging` | `e2e` job | See P-50 |
| `BACKUP_AWS_ACCESS_KEY_ID`, `BACKUP_AWS_SECRET_ACCESS_KEY` | Secret | `production` | Pre-deploy backup | IAM user allowed only `s3:PutObject` on the backup bucket |
| `BACKUP_READ_AWS_ACCESS_KEY_ID`, `BACKUP_READ_AWS_SECRET_ACCESS_KEY` | Secret | `backups` | Backup check | IAM user allowed only to read the backup bucket |
| `BACKUP_CHECK_HEARTBEAT_URL` | Secret | `backups` | Backup check | Better Stack heartbeat URL |
| `DEPLOY_WEBHOOK_URL` | Secret | Repository | Notify steps | Slack or Discord incoming webhook |
| `API_BASE_URL` | Variable | `staging`, `production` | Wait, smoke, e2e | `https://api.staging.eduflow.app`, `https://api.eduflow.app` |
| `WEB_URL` | Variable | `staging`, `production` | Smoke, e2e | `https://staging.eduflow.app`, `https://app.eduflow.app` |
| `S3_BUCKET_BACKUPS` | Variable | `production`, `backups` | Backup steps | `eduflow-prod-backups` |
| `BACKUP_MIN_BYTES` | Variable | `backups` | Backup check | Start with `1000000`; raise it as data grows |

Set them with the GitHub CLI. `gh secret set` asks for the value at a hidden prompt, so it never lands in your shell history:

```bash
gh secret set DATABASE_ADMIN_URL --env staging
gh secret set DATABASE_ADMIN_URL --env production
gh secret set RAILWAY_TOKEN --env production
gh secret set DEPLOY_WEBHOOK_URL
gh variable set API_BASE_URL --env production --body "https://api.eduflow.app"
gh secret list --env production        # names only, never values
```

> **Rule:** You type secret values yourself. Claude Code sees secret names only, and no workflow may `echo` a secret or anything computed from it. GitHub masks the exact value in logs, but not a changed form of it, such as the value in base64.

## Branch protection and environments

The pipeline is only as safe as the settings around it. *Git Workflow: Branches, Commits and Pull Requests* holds the full protection rule for `main` and the tag ruleset. These are the parts that connect to the workflows above:

| Setting | Where in GitHub | Value |
|---|---|---|
| Required status checks on `main` | Branch protection rule | `check`, `test`, `build`, `pr-title` |
| Branches must be up to date | Same rule | On. The commit that lands on `main` is exactly the commit CI tested. |
| Environment `staging` | Settings, Environments | Deployment branches: `main` only. No reviewers. |
| Environment `production` | Same | Required reviewer: you. Deployment tags: `v*.*.*` only. |
| Environment `backups` | Same | Deployment branches: `main` only. No reviewers. |
| Tag ruleset `v*` | Settings, Rules, Rulesets | Block updates and deletions of release tags |
| Allowed actions | Settings, Actions, General | Actions created by GitHub only, plus any action you approve by name |
| Default workflow token | Same page | Read repository contents only |

Environment protection rules on a private repository need a paid plan, the same GitHub Pro that branch protection already needs. Leave "prevent self-review" off while you work alone, or you cannot approve your own release.

## Rolling back

Code rolls back; the database rolls forward. This rule from *Environments and Configuration* shapes every row below.

| What broke | First move | Time | Watch out for |
|---|---|---|---|
| Web app only | In the Vercel production project, roll back to the previous production deployment | 2 min | Nothing else changes |
| API or worker, fastest way | In Railway, redeploy the previous successful deployment of `api`, then of `worker` | 5 min | `/api/v1/health` must show the old version. If it still shows the new tag, set `APP_VERSION` by hand. |
| API or worker, scripted | `gh workflow run deploy-production.yml --ref v0.5.2` | 15 min | Skips backup and migrations. Still asks for your approval. |
| A migration was wrong | A new migration that repairs it, shipped as a hotfix tag such as `v0.6.1` | 30 min or more | Never edit the migration that already ran |
| A bug damaged data | Pause the affected queue, fix forward, restore the rows from the pre-deploy dump into a scratch database | Hours | The runbook is in *Monitoring, Backups and Incident Response* |

Why no "down" migrations and no restore over production? Both throw away everything written since the release: the fees Suresh Gupta collected at the Bright Future counter in that hour, the attendance Priya Nair marked for Class 10-A. The pre-deploy dump is for picking out damaged rows in a scratch copy, never for overwriting live data.

A code rollback is safe only because every release stays backward compatible with the schema before it. The contract step of expand-and-contract is the one release that cannot be rolled back, so it ships alone and after a verified backup.

## Caching and speed

The target from P-55 is a full CI run in under 10 minutes. The four jobs run in parallel, so the slowest job, `build` or `test`, decides the wait.

| Technique | Where | What it saves |
|---|---|---|
| `cache: npm` in `setup-node` | Every job that runs `npm ci` | 30 to 60 seconds per job |
| Package files copied before source code | Both Dockerfiles | The dependency install on Railway and on your laptop, whenever the lock file did not change |
| `cancel-in-progress` for pull requests | `ci.yml` | A whole run each time you push twice in a row |
| `timeout-minutes` on every job | All workflows | A hung job stops after minutes. The GitHub default is 360 minutes. |
| Playwright only after the staging deploy | `deploy-staging.yml` | About 1 minute of browser download and 8 minutes of flows on every pull request |
| Lint and typecheck in one job | `ci.yml` | One `npm ci` per run |
| Docker layer cache in GitHub | `build` job, after you approve two Docker actions | 2 to 4 minutes per run (Estimate) |
| Next.js build cache with `actions/cache` on `client/.next/cache` | `build` job | 30 to 90 seconds (Estimate) |

The plain `docker build` in `ci.yml` starts cold on every run, because each runner is a fresh machine. P-55 allows only the three GitHub actions, so the faster version below needs your explicit yes. Both actions come from Docker's official GitHub organization. Replace the last two steps of the `build` job with:

```yaml
      - uses: docker/setup-buildx-action@v3
      - name: Build the server image with a layer cache (no push)
        uses: docker/build-push-action@v6
        with:
          context: .
          file: server/Dockerfile
          push: false
          load: true
          tags: eduflow-api:ci
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - name: The image does not run as root
        run: test "$(docker run --rm eduflow-api:ci whoami)" != "root"
```

`type=gha` stores Docker layers in the GitHub Actions cache (10 GB per repository). `load: true` hands the finished image back to the local Docker, so the `whoami` check still works.

## Build badges

A badge is a small image in `README.md` that shows the state of a workflow. Replace `YOUR-USER` with your GitHub account:

```markdown
![CI](https://github.com/YOUR-USER/eduflow/actions/workflows/ci.yml/badge.svg?branch=main)
![Deploy production](https://github.com/YOUR-USER/eduflow/actions/workflows/deploy-production.yml/badge.svg)
![Backup check](https://github.com/YOUR-USER/eduflow/actions/workflows/backup-check.yml/badge.svg)
```

In a private repository only people with access see the badges, which is fine. The backup badge is the useful one: red on the README page means the last backup check failed, and you see it every time you open the repository.

## What GitHub Actions minutes cost

GitHub bills each job by the minute, rounded up, on Linux runners. A private repository on GitHub Pro includes 3,000 minutes per month (GitHub Free includes 2,000). Extra Linux minutes cost about US$0.006 to 0.008 each. Estimate: GitHub cut hosted-runner prices in January 2026; check the current Actions billing page before you budget.

Usage model for the months after Day 60, with 60 merged pull requests per month (2 to 3 per working day). Change the inputs to match your own log.

| Item | Runs per month | Billed minutes per run | Minutes |
|---|---|---|---|
| CI on pull requests (2 pushes per PR) | 120 | 16 (check 3, test 6, build 6, pr-title 1) | 1,920 |
| CI on `main` after each merge | 60 | 15 | 900 |
| Staging deploy with e2e | 60 | 36 | 2,160 |
| Production deploys | 8 | 20 | 160 |
| Security on pull requests and Mondays | 124 | 2 | 248 |
| Backup check, 30 daily plus 4 restores | 34 | about 1.5 | 50 |
| Total | | | about 5,440 |

Formula: (total minutes minus 3,000 included) times the price per minute. That is 2,440 times US$0.006 to 0.008, so about US$15 to 20 per month, roughly ₹1,250 to ₹1,650 at the canon rate of ₹85 per dollar (Estimate). Small next to the hours it saves.

If you want it lower, three levers work without weakening any check:

- The Railway `deploy` legs mostly wait for Railway's build. Deploying the worker with `--detach` instead of `--ci` saves about 6 minutes per staging deploy, because `verify` still checks the result.
- Group small fixes into one pull request. Every pull request costs about 80 minutes end to end.
- Drop the `e2e` job to a nightly schedule when you pass 100 merges a month.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `npm ci` fails: lock file and `package.json` "not in sync" | Someone ran `npm install` inside a workspace | Run `npm install` at the root, commit the lock file |
| Docker build fails at `npm ci` with "husky: not found" | The `npm pkg delete scripts.prepare` line is missing | Put it back in every install stage |
| Container stops: "Invalid or missing environment variables: X" | `env.ts` fail-fast check | Add `X` to the Railway service or to `server/.env.docker` |
| Prisma: "Could not locate the Query Engine" or "libssl" | Client generated on another platform, or OpenSSL missing | Generate inside the image; keep `openssl` in the `base` stage |
| PDF job fails: "Failed to launch the browser process" | Missing `CHROMIUM_PATH` or the two container flags | See "The worker: same image, other command" |
| Required check shows "Waiting for status" for ever | A job was renamed, or `paths:` was added to `ci.yml` | Keep the four job names; remove path filters |
| `deploy-staging.yml` never starts | `workflows: [CI]` does not match the `name:` of `ci.yml`, or the file is not on `main` yet | Fix the name; `workflow_run` works only from the default branch |
| `railway up` answers "Unauthorized" | Token of the other environment, or a rotated token | Create a new project token for that Railway environment |
| `verify` times out, but Railway shows the deploy as live | `APP_VERSION` was not updated | Check the service variables in Railway; see the note on `--skip-deploys` |
| Production job waits and nobody approves | You are not the required reviewer, or "prevent self-review" is on | Fix the `production` environment settings |

## Key takeaways

- One multi-stage image on Node.js 24 slim serves the API and the worker. It is built from the repo root, runs as `node`, generates the Prisma client at build time, carries Chromium for PDFs, and the worker only swaps the command.
- `ci.yml` has four jobs, `check`, `test`, `build` and `pr-title`. They are the required checks of `main`, the tests run against real PostgreSQL 16 and Redis 7 as `eduflow_app`, and no path filter may ever hide them.
- Staging deploys itself when CI turns green on `main`: migrate with the owner role, Railway builds the same Dockerfile, Vercel gets a prebuilt client, and a script waits until `/api/v1/health` reports the exact commit.
- Production needs a tag on `main` with green CI, plus your approval. It takes a fresh dump, migrates, deploys, and checks health and read-only smoke URLs.
- Migrations run only as a pipeline step with `prisma migrate deploy`, never at container start. Code rolls back through Railway, Vercel or an older tag; the database only moves forward.
- Security and backups are scheduled, not remembered: npm audit and gitleaks on every pull request and every Monday, Dependabot weekly, and a backup check every morning with a real restore every Sunday.
- The whole pipeline costs about US$15 to 20 a month in extra Actions minutes at 60 merges a month (Estimate). Every secret lives in a GitHub environment, and you type every value yourself.
