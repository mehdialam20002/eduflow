# Local Development Setup

**In simple words:** This chapter turns a clean Windows 11 laptop into a full EduFlow workshop. You install the tools, start PostgreSQL, Redis and a fake mail inbox in Docker, fill the environment files, create the database and log in with seeded demo users. It also covers the jobs that usually waste a founder's day: webhooks that cannot reach a laptop, file uploads without production S3, a first WhatsApp test message, a safe database reset and the ten most common errors. Do it once, carefully, and every one of the 60 build days starts with two commands.

## What you will have at the end

The whole product runs on your laptop. Nothing in this chapter touches staging or production. How values change on those environments is in *Environments and Configuration*.

| Service | Address on your laptop | Started by | What it is for |
|---|---|---|---|
| Web app (Next.js) | `http://localhost:3000` | `npm run dev` | The screens you build and demo |
| API (Express 5) | `http://localhost:4000/api/v1` | `npm run dev` | All endpoints; health check at `/api/v1/health` |
| Worker (BullMQ) | No port | `npm run dev:worker` | Background jobs: messages, PDFs, imports, webhooks |
| PostgreSQL 16 | `localhost:5432` | Docker Compose | Database `eduflow_dev` |
| Redis 7 | `localhost:6379` | Docker Compose | Queues, cache, rate-limit counters |
| Mailpit | Inbox at `http://localhost:8025` | Docker Compose | Catches every email the app sends |
| Prisma Studio | `http://localhost:5555` | `npm run db:studio` | Table browser for quick checks |
| MinIO (optional) | `http://localhost:9000` and `:9001` | Compose profile `s3` | Offline stand-in for AWS S3 |

**Figure: What runs on your laptop**

```mermaid
flowchart TD
  BR["Chrome<br/>localhost:3000"] --> WEB["Next.js dev server<br/>port 3000"]
  BR -- "API calls with cookie" --> API["Express API<br/>port 4000"]
  API --> PG["PostgreSQL 16<br/>port 5432"]
  API --> RD["Redis 7<br/>port 6379"]
  API --> S3["S3 dev bucket<br/>or MinIO 9000"]
  RD --> WK["BullMQ worker<br/>no port"]
  WK --> PG
  WK --> MP["Mailpit<br/>SMTP 1025, inbox 8025"]
  subgraph DOCKER["Docker Desktop"]
    PG
    RD
    MP
  end
```

Node.js runs the web app, the API and the worker directly on Windows, because watch mode is fastest there. Docker runs only the three helper services. The browser talks to the API directly, not through Next.js.

Plan 2 to 3 hours for the full setup. The best time is Day 0 (Sunday, 4 October 2026), so that Day 1 starts with building and not with installers. On Day 0 you finish the sections up to "Get the code". The Docker Compose file arrives with P-03 on Day 2, and the database with P-04 on Day 3. Use this chapter on those days to review what Claude Code generated.

> **Founder note:** Setup ka kaam boring lagta hai, lekin yahi aapki factory hai. Ek baar theek se laga lijiye. Phir roz subah sirf do command: `npm run services:up` aur `npm run dev`.

## Before you install anything

Check the laptop first. Ten minutes here saves a lost evening later.

| Check | How to check | Needed |
|---|---|---|
| Windows version | Settings, System, About | Windows 11, fully updated |
| RAM | Task Manager, Performance, Memory | 16 GB (8 GB works, but Docker plus Chrome will swap) |
| Free disk | File Explorer, This PC | 50 GB free on an SSD |
| Virtualization | Task Manager, Performance, CPU, "Virtualization" | Must say "Enabled" |
| Admin rights | You can approve the blue "Do you want to allow" box | Yes |
| Clock | Settings, Time and language | "Set time automatically" is on |

If virtualization says "Disabled", restart into the BIOS or UEFI setup of the laptop, switch on "Intel VT-x" or "AMD SVM", save and start again. Docker cannot run without it.

Three decisions are made here once, so you never think about them again.

1. **Code folder:** `C:\Users\YOUR-NAME\code\eduflow`. In Git Bash this is `~/code/eduflow`. Never keep the repo inside Desktop, Documents or a OneDrive folder. OneDrive locks files while it syncs, and `npm install` then fails with `EPERM` errors.
2. **Terminal:** Git Bash, inside VS Code or Windows Terminal. Every command in this Blueprint is written for Git Bash. Claude Code on Windows also uses Git Bash, so you and Claude run the same commands. Use PowerShell only where a step says "PowerShell as administrator".
3. **Host name:** always `localhost`, never `127.0.0.1`. The browser treats them as two different sites. If you mix them, cookies and CORS break.

## Install the tools on Windows 11

Install in this order. Each step ends with a check command. Do not move on until the check passes.

### WSL 2

WSL 2 (Windows Subsystem for Linux, a small Linux layer inside Windows) is the engine under Docker Desktop. Open PowerShell as administrator and run:

```bash
wsl --install
```

Restart the laptop when it asks. After the restart, a Linux window may ask you to create a user name and password. Do it and close the window. Then check:

```bash
wsl --update
wsl --status          # "Default Version: 2"
wsl -l -v             # the VERSION column must show 2
```

Docker's Linux machine takes as much RAM as it can get. Put a limit on it. Create the file `C:\Users\YOUR-NAME\.wslconfig` with this content, then run `wsl --shutdown` once:

```text
[wsl2]
memory=6GB
processors=4
```

On an 8 GB laptop write `memory=3GB`.

### Git for Windows

Git for Windows also installs Git Bash. `winget` is the package installer that ships with Windows 11.

```bash
winget install --id Git.Git -e
```

Close and reopen the terminal, then open Git Bash and set the basics. Name, email and default branch are in *How to Use This Blueprint*. These two lines are for Windows:

```bash
git --version
git config --global core.longpaths true     # node_modules has very long paths
git config --global core.autocrlf false     # .gitattributes already forces LF
```

### Node.js 24 LTS

The canon stack is Node.js 24 LTS. LTS means long-term support: the release line that gets fixes for years. Download the Windows installer (the `.msi` file) for the v24 line from `nodejs.org` and keep the default options. You do not need the optional "tools for native modules" tick box.

```bash
node --version        # must start with v24
npm --version
```

> **Warning:** Around late October 2026, Node.js 26 is expected to become the newest LTS line. Buttons and package IDs that just say "LTS" will then give you 26. EduFlow stays on 24 for the whole sprint, because `.nvmrc`, `package.json` (`"node": ">=24 <25"`) and CI all say 24. Always pick v24 by number.

If you later need two Node.js versions on one laptop, use a version manager (a tool that installs several versions and switches between them): nvm-windows on Windows, nvm or fnm on macOS and Linux. For this sprint one version is enough.

### Docker Desktop

```bash
winget install --id Docker.DockerDesktop -e
```

Start Docker Desktop from the Start menu and accept the terms. Docker Desktop is free for companies with fewer than 250 employees and less than US$10 million yearly revenue, so EduFlow pays nothing. Open Settings and check three things:

1. General: "Use the WSL 2 based engine" is ticked.
2. General: "Start Docker Desktop when you sign in" is ticked. You will forget it otherwise.
3. Resources: nothing to change. The `.wslconfig` file above already sets the limit.

Wait until the whale icon in the system tray stops moving. Then check:

```bash
docker --version
docker compose version
docker run --rm hello-world     # prints "Hello from Docker!"
```

### VS Code and extensions

```bash
winget install --id Microsoft.VisualStudioCode -e
```

Open VS Code once. Press `Ctrl+Shift+P`, type "Terminal: Select Default Profile" and choose "Git Bash". Then install the extensions below. The ID is what you type into the Extensions search box.

| Extension | ID | Why you need it |
|---|---|---|
| ESLint | `dbaeumer.vscode-eslint` | Shows lint errors while you type |
| Prettier | `esbenp.prettier-vscode` | Formats on save, same rules as CI |
| Prisma | `Prisma.prisma` | Colours and formats `.prisma` files |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | Autocomplete for Tailwind classes |
| Claude Code | `anthropic.claude-code` | Claude Code diffs inside the editor |
| EditorConfig | `EditorConfig.EditorConfig` | Applies `.editorconfig` (2 spaces, LF) |
| DotENV | `mikestead.dotenv` | Colours `.env` files so typos stand out |
| Error Lens | `usernamehw.errorlens` | Prints the error text on the broken line |
| Vitest | `vitest.explorer` | Run or debug one test with a click |
| Playwright Test | `ms-playwright.playwright` | Run and record end-to-end tests (from P-50) |
| Docker | `ms-azuretools.vscode-docker` | See containers and logs in the side bar |
| GitHub Pull Requests | `GitHub.vscode-pull-request-github` | Read your own PR diff inside VS Code |

Install all of them from the terminal in one go:

```bash
for id in dbaeumer.vscode-eslint esbenp.prettier-vscode Prisma.prisma \
  bradlc.vscode-tailwindcss anthropic.claude-code EditorConfig.EditorConfig \
  mikestead.dotenv usernamehw.errorlens vitest.explorer \
  ms-playwright.playwright ms-azuretools.vscode-docker \
  GitHub.vscode-pull-request-github; do
  code --install-extension "$id"
done
```

Commit two small files, so that a fresh clone gets the same editor behaviour. The `.vscode/` folder sits at the repo root, next to `.claude/`.

**File: `.vscode/extensions.json`**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "Prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "anthropic.claude-code",
    "EditorConfig.EditorConfig",
    "mikestead.dotenv",
    "usernamehw.errorlens",
    "vitest.explorer",
    "ms-playwright.playwright",
    "ms-azuretools.vscode-docker",
    "GitHub.vscode-pull-request-github"
  ]
}
```

**File: `.vscode/settings.json`**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  },
  "files.eol": "\n",
  "typescript.tsdk": "node_modules/typescript/lib",
  "terminal.integrated.defaultProfile.windows": "Git Bash",
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/coverage": true
  }
}
```

`typescript.tsdk` makes VS Code use the TypeScript version of the repo, not its own built-in one. Then the editor and `npm run typecheck` always show the same errors.

### GitHub CLI and Claude Code

```bash
winget install --id GitHub.cli -e
npm install -g @anthropic-ai/claude-code
```

Reopen the terminal. Run `gh auth login`, choose GitHub.com, choose SSH, and let it create and upload a new SSH key. Day 1 clones with an SSH address, so this step matters. Then run `claude` once in any empty folder and sign in. The first-session steps, the smoke test and the project settings are in *Working with Claude Code*.

### Final check

Every line must print a version. This is the same list as in *How to Use This Blueprint*.

```bash
node --version && npm --version && git --version
docker --version && docker compose version
code --version && gh --version && claude --version
```

### Notes for macOS and Linux

The repo, the scripts and every `npm` and `docker compose` command in this chapter are the same on all three systems. Only the installers differ.

| Item | macOS | Linux (Ubuntu) |
|---|---|---|
| WSL 2 | Not needed | Not needed |
| Git | Comes with the Xcode command line tools, or use Homebrew | `sudo apt install git` |
| Node.js 24 | nvm: `nvm install 24`, then `nvm use` reads `.nvmrc` | Same as macOS |
| Docker | Docker Desktop for Mac (pick Apple silicon or Intel) | Docker Engine plus the Compose plugin from Docker's own apt repository |
| Docker without sudo | Not needed | `sudo usermod -aG docker $USER`, then log out and in |
| VS Code, GitHub CLI | Official downloads or Homebrew | Official `.deb` packages |
| Terminal | Terminal or iTerm, zsh | Any terminal, bash |
| Find what uses a port | `lsof -i :4000` | `lsof -i :4000` or `ss -ltnp` |
| Code folder | `~/code/eduflow` | `~/code/eduflow` |

On Apple silicon, the `postgres:16`, `redis:7` and Mailpit images all have ARM builds, so nothing extra is needed.

## Get the code and install packages

On Day 1 the repo is empty and P-01 fills it. The exact steps are in *Daily Plan: Days 1 to 14*. From Day 2 onward, and on any new laptop, the flow is a normal clone:

```bash
mkdir -p ~/code && cd ~/code
git clone git@github.com:YOUR-USER/eduflow.git
cd eduflow
npm install
code .
```

`npm install` at the root installs all three workspaces (`shared`, `server`, `client`) in one pass. After it finishes, check these four points.

- There is exactly one `node_modules` folder that matters, at the root, and one `package-lock.json`, also at the root.
- `ls node_modules/@eduflow` lists `client`, `server` and `shared`. These are links to your workspace folders, not downloads.
- VS Code shows a pop-up "Do you want to install the recommended extensions?". Say yes.
- `npm run check` passes (lint, typecheck, tests).

| Command | When to use it | What it does |
|---|---|---|
| `npm install` | After a clone, after `git pull` changed `package-lock.json` | Installs what the lock file says and links the workspaces |
| `npm install razorpay -w server` | You add a package to one workspace | Adds it to `server/package.json` and updates the root lock file |
| `npm ci` | You suspect a broken `node_modules`; CI always uses it | Deletes `node_modules` and installs exactly the lock file |
| `npm run build -w shared` | Imports from `@eduflow/shared` are "not found" | Rebuilds `shared/dist/`; `npm run dev` does this by itself |

> **Rule:** Never run `npm install` inside `client/`, `server/` or `shared/`. It creates a second lock file, and your laptop and CI then install different versions. The reason and the workspace layout are in *Folder Structure*.

## Local services with Docker Compose

Docker Compose is a tool that starts several containers from one YAML file. P-03 generates this file on Day 2. *Folder Structure* describes it with two services. This chapter adds a third one, Mailpit, and an optional fourth one, MinIO. If the file from P-03 has only PostgreSQL and Redis, replace it with the version below.

**File: `docker-compose.yml` (repo root)**

```yaml
name: eduflow

services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-eduflow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-eduflow_local_pw}
      POSTGRES_DB: ${POSTGRES_DB:-eduflow_dev}
      TZ: UTC
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--maxmemory-policy", "noeviction"]
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  mailpit:
    image: axllent/mailpit:latest
    restart: unless-stopped
    environment:
      MP_MAX_MESSAGES: "500"
      MP_SMTP_AUTH_ACCEPT_ANY: "1"
      MP_SMTP_AUTH_ALLOW_INSECURE: "1"
    ports:
      - "127.0.0.1:1025:1025"
      - "127.0.0.1:8025:8025"

  minio:
    image: minio/minio:latest
    profiles: ["s3"]
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-eduflow_minio}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-eduflow_minio_secret}
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

**File: `.env.example` (repo root, read by Docker Compose only)**

```env
# Owner user of the local database. This user runs migrations and the seed.
POSTGRES_USER=eduflow
# Local-only password. Never reuse it on a hosted database.
POSTGRES_PASSWORD=eduflow_local_pw
# Name of the local database.
POSTGRES_DB=eduflow_dev
# MinIO login. Used only when you start the optional "s3" profile.
MINIO_ROOT_USER=eduflow_minio
MINIO_ROOT_PASSWORD=eduflow_minio_secret
```

The compose file works even without a root `.env` file, because every variable has a default after `:-`. Copy the example anyway, so that the values are visible in one place.

What each part means, in plain words:

| Part | Meaning |
|---|---|
| `name: eduflow` | Prefix for containers and volumes, for example `eduflow_postgres_data` |
| `image: postgres:16` | Same major version as the canon. Docker picks the newest 16.x. |
| `127.0.0.1:5432:5432` | The port opens only on your laptop, not on the cafe Wi-Fi |
| `postgres_data` volume | A Docker-managed disk folder. Data survives `docker compose down`. |
| `healthcheck` | Docker asks the service "are you ready?" every 5 seconds |
| `$${POSTGRES_USER}` | Two dollar signs mean: the container reads the value, not Compose |
| `--appendonly yes` | Redis writes changes to disk, so queued jobs survive a restart |
| `--maxmemory-policy noeviction` | Redis never silently drops keys. BullMQ needs this. |
| `MP_SMTP_AUTH_ACCEPT_ANY` | Mailpit accepts any SMTP user name and password |
| `profiles: ["s3"]` | MinIO starts only when you ask for the `s3` profile |

Mailpit is a fake mail server. The app sends email to it over SMTP (the standard protocol for sending mail) on port 1025. Mailpit never delivers anything to the outside world. It shows every message in a web inbox at `http://localhost:8025`. So a password-reset mail for `rajesh@brightfuture.example` lands there one second after you click "Forgot password", and no real person can ever get a test mail.

Day-to-day commands:

```bash
docker compose up -d --wait        # start; returns when services are ready
docker compose ps                  # postgres and redis must show "healthy"
docker compose logs -f postgres    # follow the log of one service (Ctrl+C to leave)
docker compose stop                # stop containers, keep everything
docker compose down                # remove containers, KEEP the data volumes
docker compose --profile s3 up -d  # also start MinIO
```

Check that the services really answer:

```bash
docker compose exec postgres psql -U eduflow -d eduflow_dev -c "select version();"
docker compose exec redis redis-cli ping      # prints PONG
```

Then open `http://localhost:8025` in Chrome. You see an empty Mailpit inbox.

> **Warning:** `docker compose down -v` is a different command. The `-v` deletes the volumes, which means the whole local database, all Redis queues and all MinIO files. Use it only on purpose, as described under "Reset the database safely".

## Environment files

An environment variable is a setting that lives outside the code, such as the database address or a secret key. EduFlow has three `.env.example` files that are committed, and three real files that are never committed. Create the real ones by copying:

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Every value below is a safe dummy. The app starts with them as they are. You replace a dummy with a real test key only on the day the feature arrives. The master list with all environments is in *Environment Variables and Command Reference*. If a name there differs from a name here, the appendix wins. Rename it in three places in one commit: the Zod schema in `server/src/config/env.ts`, the `.env.example` file and your own `.env`.

### The server file

**File: `server/.env.example`**

```env
# ---------- Core ----------
# development on your laptop, test in Vitest, production on a host.
NODE_ENV=development
# Port of the Express API.
PORT=4000
# Pino log level. debug locally, info in production.
LOG_LEVEL=debug
# Makes Node.js behave like the production server, which runs in UTC.
TZ=UTC
# Address of the web app. Used in email links and redirects.
WEB_APP_URL=http://localhost:3000
# Public address of this API. Use your tunnel URL while testing webhooks.
API_PUBLIC_URL=http://localhost:4000
# Origins the browser may call from. Comma-separated, no spaces, no slash.
CORS_ORIGINS=http://localhost:3000

# ---------- Database and Redis ----------
# Runtime role. Not a superuser, so Row-Level Security applies to it.
DATABASE_URL=postgresql://eduflow_app:eduflow_app_local@localhost:5432/eduflow_dev?schema=public
# Owner role. Used only for migrations, seed and Prisma Studio.
DATABASE_ADMIN_URL=postgresql://eduflow:eduflow_local_pw@localhost:5432/eduflow_dev?schema=public
# Redis for BullMQ queues, cache and rate limits.
REDIS_URL=redis://localhost:6379

# ---------- Auth ----------
# Signs the 15-minute access token. At least 32 characters.
JWT_ACCESS_SECRET=local_access_secret_0123456789abcdef_change_me
# Used for refresh-token hashing and signing. At least 32 characters.
JWT_REFRESH_SECRET=local_refresh_secret_0123456789abcdef_change_me
# Lifetime of the access token.
JWT_ACCESS_TTL=15m
# Lifetime of the refresh token, in days.
REFRESH_TOKEN_TTL_DAYS=30
# Leave empty on localhost. In production: .eduflow.app
COOKIE_DOMAIN=
# false on http://localhost, true wherever HTTPS is used.
COOKIE_SECURE=false
# Encrypts stored gateway keys of institutes. 64 hex characters.
DATA_ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000

# ---------- Seed (local and staging only) ----------
# Password of all seeded demo users. The seed prints it at the end.
SEED_DEMO_PASSWORD=EduFlow@Local123

# ---------- Files (S3) ----------
# Mumbai region, as in the canon.
AWS_REGION=ap-south-1
# Keys of the IAM user eduflow-dev-uploader, or the MinIO login.
AWS_ACCESS_KEY_ID=replace_me
AWS_SECRET_ACCESS_KEY=replace_me
# Your dev bucket name, or eduflow-local-files for MinIO.
S3_BUCKET=eduflow-dev-files-yourname
# Empty for real AWS. http://localhost:9000 for MinIO.
S3_ENDPOINT=
# false for real AWS. true for MinIO.
S3_FORCE_PATH_STYLE=false

# ---------- Email ----------
# smtp sends to Mailpit. ses sends through Amazon SES.
MAIL_TRANSPORT=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
# Sender address shown in the inbox.
MAIL_FROM=no-reply@eduflow.example
# Region of your SES identity. Used only when MAIL_TRANSPORT=ses.
SES_REGION=ap-south-1

# ---------- Razorpay (test mode, from Day 39) ----------
RAZORPAY_KEY_ID=rzp_test_replace_me
RAZORPAY_KEY_SECRET=replace_me
# You invent this value and type the same one into the Razorpay dashboard.
RAZORPAY_WEBHOOK_SECRET=local_razorpay_webhook_secret_change_me

# ---------- Stripe (test mode, Phase 4, P-32) ----------
STRIPE_SECRET_KEY=sk_test_replace_me
# Printed by the "stripe listen" command.
STRIPE_WEBHOOK_SECRET=whsec_replace_me

# ---------- WhatsApp Cloud API (from Day 44) ----------
# Copy the Graph API version from your Meta app dashboard, for example v23.0.
WHATSAPP_GRAPH_VERSION=v23.0
# ID of the sending number, from the API Setup page.
WHATSAPP_PHONE_NUMBER_ID=000000000000000
# ID of the WhatsApp Business Account, from the same page.
WHATSAPP_BUSINESS_ACCOUNT_ID=000000000000000
# Temporary token from the API Setup page. It expires within a day.
WHATSAPP_ACCESS_TOKEN=replace_me
# App secret from App settings, Basic. Checks webhook signatures.
WHATSAPP_APP_SECRET=replace_me
# You invent this value and type the same one into the Meta dashboard.
WHATSAPP_VERIFY_TOKEN=local_verify_token_change_me

# ---------- Message safety switch ----------
# log = send nothing, only write the message to the log.
# allowlist = send only to the numbers and addresses below. live = production.
MESSAGING_MODE=log
# Comma-separated phones and emails that may receive a real message.
MESSAGING_ALLOWLIST=+919876543210

# ---------- SMS (Phase 2, P-31) ----------
MSG91_AUTH_KEY=replace_me
# Your 6-letter DLT sender ID.
MSG91_SENDER_ID=EDUFLW
TWILIO_ACCOUNT_SID=replace_me
TWILIO_AUTH_TOKEN=replace_me
# The number or sender that Twilio gives you.
TWILIO_FROM_NUMBER=replace_me

# ---------- Monitoring ----------
# Empty locally, so your own bugs do not fill Sentry.
SENTRY_DSN=
```

Five points about this file.

- **Two database URLs.** Until Day 6 there is only one database user, the owner `eduflow`. Put the owner URL into both lines. On Day 6, P-06 creates the runtime role `eduflow_app`, and `DATABASE_URL` switches to it. The reason is Row-Level Security, explained in *Daily Plan: Days 1 to 14*.
- **Optional keys must not block the start.** In the Zod schema, only the Core, Database, Auth and Email groups are required in the first weeks. Every other group is optional until its prompt runs. When P-26 arrives, the three Razorpay names become required.
- **Booleans need care.** `z.coerce.boolean()` turns the text `"false"` into `true`, because any non-empty text counts as true. Parse flags such as `COOKIE_SECURE` and `S3_FORCE_PATH_STYLE` with `z.enum(['true', 'false'])` and then compare with `'true'`.
- **Working names.** `WEB_APP_URL`, `API_PUBLIC_URL`, `DATABASE_ADMIN_URL` and `DATA_ENCRYPTION_KEY` are names chosen by this chapter. `MESSAGING_MODE` and `MESSAGING_ALLOWLIST` come from *Environments and Configuration*, which is the authority for every variable that also exists on staging and production. Whatever name you end up with, write it into `.env.example` on the same day.
- **Generate real secrets with one command.** Use it for the JWT secrets, the webhook secrets and the encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### The client file

**File: `client/.env.example`**

```env
# Base address of the API, with /api/v1. The browser calls this directly.
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
# Address of this web app.
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Shows a "LOCAL" badge in the header, so you never mix up environments.
NEXT_PUBLIC_APP_ENV=local
# Root domain for tenant subdomains. Production: eduflow.app
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
# Stripe publishable key, test mode. Needed from P-32 only.
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
# Browser error reporting. Empty locally.
NEXT_PUBLIC_SENTRY_DSN=
# Product analytics. Empty locally, so your own clicks do not pollute the data.
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

The Razorpay public key is not in this file. The create-order endpoint returns it together with the order ID, so the browser never needs its own copy.

> **Warning:** Next.js copies every `NEXT_PUBLIC_` value into the JavaScript that the browser downloads. Anybody can read it. A secret never gets this prefix. Also remember that Next.js reads `.env.local` only at start. After a change, stop and start `npm run dev`.

### Which keys you need on which day

| From | Group | What you do |
|---|---|---|
| Day 2 (P-03) | Core, Database, Redis | Copy the example. Owner URL in both database lines. |
| Day 6 (P-06) | Database | Switch `DATABASE_URL` to the `eduflow_app` role |
| Day 8 (P-07) | Auth, Email | Generate two JWT secrets. Mail goes to Mailpit. |
| Day 22 (P-21) | Files | Put the keys of `eduflow-dev-uploader` and your bucket name |
| Day 39 (P-26) | Razorpay | Paste test keys from the Razorpay dashboard, Test Mode |
| Day 44 (P-29) | WhatsApp | Paste the values from the Meta API Setup page |
| After Day 60 | SMS, Stripe, SES | P-31 and P-32. Leave the dummies until then. |

## Prisma: the commands you use every week

Prisma is the ORM (object-relational mapper, the layer that turns TypeScript calls into SQL). Its command-line tool does these jobs for you.

| Job | Prisma command | What it does | When |
|---|---|---|---|
| Validate | `prisma validate` | Checks the schema files for mistakes. Changes nothing. | Before every migration |
| Generate | `prisma generate` | Rebuilds the typed client in `node_modules` from the schema | After install, schema change or branch switch |
| Migrate | `prisma migrate dev --name add_fee_heads` | Writes a new SQL migration, applies it, then runs generate | A spec change adds or changes a model |
| Draft | `prisma migrate dev --create-only` | Writes the SQL file but does not apply it, so you can edit it | Hand-written SQL: RLS policies, partial indexes |
| Status | `prisma migrate status` | Lists migrations that are not applied yet | After `git pull` |
| Seed | `prisma db seed` | Runs `server/prisma/seed/index.ts` | After a reset; when seed data changed |
| Studio | `prisma studio` | Opens a table browser at `http://localhost:5555` | Quick look at rows during manual tests |
| Reset | `prisma migrate reset` | Drops everything, re-applies all migrations, runs the seed | Only as described under "Reset the database safely" |

Until Day 6 you run these with `npx` inside `server/`, exactly as the daily plan shows. From Day 6 there is a catch. The Prisma tool reads `DATABASE_URL`, and that is now the runtime role `eduflow_app`. This role cannot create tables, so `migrate dev` fails with a "permission denied" error. In Prisma Studio, every tenant table looks empty, because Row-Level Security hides all rows when no tenant is set.

The fix is a tiny wrapper script. It runs any Prisma command with the owner URL. It also refuses to run a destructive command when the owner URL does not point to your laptop.

**File: `server/prisma/run-as-owner.mjs`**

```typescript
/* eslint-disable no-console -- CLI script: console output is its user interface */
// Runs one Prisma CLI command with the OWNER database URL.
// Usage (inside server/): node prisma/run-as-owner.mjs migrate dev --name add_fee_heads
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');

const args = process.argv.slice(2);
const ownerUrl = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;

if (!ownerUrl) {
  console.error('DATABASE_ADMIN_URL is missing. Check server/.env.');
  process.exit(1);
}

const host = new URL(ownerUrl).hostname;
const isLocal = host === 'localhost' || host === '127.0.0.1';
const isDestructive =
  args.includes('reset') || args.includes('dev') || (args[0] === 'db' && args[1] === 'push');

if (isDestructive && !isLocal) {
  console.error(`Refused: "prisma ${args.join(' ')}" can wipe data on host "${host}".`);
  console.error('This script runs destructive commands on a local database only.');
  process.exit(1);
}

console.log(`prisma ${args.join(' ')} -> ${host} (owner role)`);

const result = spawnSync(`npx prisma ${args.join(' ')}`, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: ownerUrl },
});

process.exit(result.status ?? 1);
```

How it works: `process.loadEnvFile` is built into Node.js 24 and reads `server/.env`. The script then starts Prisma with `DATABASE_URL` replaced by the owner URL, for this one command only. The API and the worker never see that value. Hosted databases get their migrations with `prisma migrate deploy`, as *Deploy on Vercel and Railway* explains. They never go through this script.

Add these scripts to `server/package.json`, next to the ones from *Folder Structure*:

```json
{
  "scripts": {
    "db:validate": "prisma validate",
    "db:generate": "prisma generate",
    "db:migrate": "node prisma/run-as-owner.mjs migrate dev",
    "db:draft": "node prisma/run-as-owner.mjs migrate dev --create-only",
    "db:status": "node prisma/run-as-owner.mjs migrate status",
    "db:seed": "node prisma/run-as-owner.mjs db seed",
    "db:reset": "node prisma/run-as-owner.mjs migrate reset",
    "db:studio": "node prisma/run-as-owner.mjs studio"
  }
}
```

The seed needs the owner role too. `prisma db seed` starts the seed script as a child process, and the child gets the owner URL from the wrapper. Your seed file needs no special code for this.

> **Note:** P-06 may solve the same problem in another valid way, for example with a `directUrl` line in the Prisma `datasource` block. If your repo already works that way, keep it, and point the `db:` scripts at plain `prisma`. What matters is the result: the API connects as `eduflow_app`, while migrations, seed and Studio connect as the owner.

### First-time database setup

Run this once after the first clone, and again after every full reset. The short script names are defined under "Run the app" below.

```bash
npm run services:up        # PostgreSQL, Redis and Mailpit are ready
npm run db:migrate         # applies every migration, then runs generate
npm run db:seed            # plans, permissions, roles, two demo institutes
npm run db:studio          # look at the result, then close with Ctrl+C
```

To create a new migration, pass the name after a double dash. Use lower case and underscores:

```bash
npm run db:migrate -- --name add_student_blood_group
```

Where does `eduflow_app` come from on a fresh database? The role is created inside the Day 6 migration, in a block that is safe to run twice. Open that migration and check that it looks like this. If it does not, ask Claude Code to add it.

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'eduflow_app') THEN
    CREATE ROLE eduflow_app LOGIN PASSWORD 'eduflow_app_local'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;
```

The guard matters. `migrate dev` replays all migrations on a temporary "shadow" database. A PostgreSQL role belongs to the whole server, not to one database, so a plain `CREATE ROLE` would fail the second time. On staging and production you create the role by hand with a strong password before the first deploy. The block then finds the role and does nothing.

## Seed accounts for local use

The seed from P-04 creates two demo institutes and one user for each of the seven system roles. All of them share one password, the value of `SEED_DEMO_PASSWORD`. With the example file that is `EduFlow@Local123`.

| Role key | Name | Organization | Login | First thing to test |
|---|---|---|---|---|
| `SUPER_ADMIN` | EduFlow Support | Platform (no organization) | `superadmin@eduflow.example` | Sees all organizations |
| `ORG_ADMIN` | Rajesh Sharma | Bright Future Public School | `rajesh@brightfuture.example` | Full menu, both campuses |
| `PRINCIPAL` | Dr. Anita Verma | Bright Future, main campus | `anita@brightfuture.example` | Sees only the assigned campus |
| `TEACHER` | Priya Nair | Bright Future, Class 10-A | `priya@brightfuture.example` | Marks attendance for own batch only |
| `ACCOUNTANT` | Suresh Gupta | Bright Future, main campus | `suresh@brightfuture.example` | Collects a fee, prints a receipt |
| `PARENT` | Sunita Devi | Bright Future | Phone `+919876543210`, OTP login | Sees only Aarav Sharma |
| `STUDENT` | Aarav Sharma | Bright Future, `BF-2027-0142` | `aarav@brightfuture.example` | Own record only (portal in Phase 2) |
| `ORG_ADMIN` | Owner of Sharma Classes | Sharma Classes, Patna | `owner@sharmaclasses.example` | Never sees Bright Future data |

The address of Rajesh matches the daily plans. The other addresses are this chapter's choice. If your seed uses different ones, keep the seed and correct this table in your own notes. The `.example` ending is reserved for documentation, so no real mailbox can exist behind these addresses.

How Sunita Devi logs in locally: open `/otp-login`, enter her phone number, and read the six-digit code in the API terminal. In development the OTP is written to the log and no SMS is sent.

Quick login test from the terminal:

```bash
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rajesh@brightfuture.example","password":"EduFlow@Local123"}'
```

> **Warning:** These accounts are for LOCAL use only. The seed must refuse to create demo users when `NODE_ENV` is `production`. It reads the password from `SEED_DEMO_PASSWORD` and never from a constant in the code. Staging gets a different, long value. The hosted pilot environment gets reference data only, without demo institutes, as *Daily Plan: Days 43 to 60* describes. A public demo tenant with a known password is an open door.

## Run the app

The root `package.json` from *Folder Structure* already has `dev` (shared watcher, API and web app) and `dev:worker`. Add one script that starts all four processes in one terminal, plus short names for Docker and the database:

```json
{
  "scripts": {
    "predev:all": "npm run build -w shared",
    "dev:all": "concurrently \"npm:dev:shared\" \"npm:dev:api\" \"npm:dev:worker\" \"npm:dev:web\"",
    "services:up": "docker compose up -d --wait",
    "services:down": "docker compose down",
    "services:logs": "docker compose logs -f --tail=100",
    "db:generate": "npm run db:generate -w server",
    "db:migrate": "npm run db:migrate -w server --",
    "db:draft": "npm run db:draft -w server --",
    "db:status": "npm run db:status -w server",
    "db:seed": "npm run db:seed -w server",
    "db:reset": "npm run db:reset -w server",
    "db:studio": "npm run db:studio -w server",
    "setup": "npm install && npm run services:up && npm run db:migrate && npm run db:seed"
  }
}
```

Merge these lines into the existing `scripts` block. Do not replace the block. The `--` at the end of `db:migrate` and `db:draft` hands your extra arguments, such as `--name`, down to the server script.

| Situation | Command | Terminals |
|---|---|---|
| Weeks 1 to 4: no background jobs yet | `npm run dev` | 1 |
| From Week 5: jobs exist (invoices, PDFs, messages) | `npm run dev:all` | 1 |
| You want a separate, clean log for the worker | `npm run dev` and `npm run dev:worker` | 2 |
| You debug the API in VS Code | `npm run dev:web` plus the debugger | 1 plus VS Code |

`concurrently` prefixes each log line with the script name, such as `[dev:api]` or `[dev:worker]`, so you can see who is speaking. `Ctrl+C` stops all of them together.

Smoke test after the first start. It takes two minutes. Do it again after every reset.

1. `curl -s http://localhost:4000/api/v1/health` returns `"success": true`.
2. `http://localhost:4000/api/v1/docs` shows the OpenAPI page (development only).
3. `http://localhost:3000/login` shows the login page.
4. Log in as `rajesh@brightfuture.example`. The sidebar shows the full Organization Admin menu.
5. Click "Forgot password" for the same address. The mail appears in Mailpit at `http://localhost:8025`.
6. Log in as Priya Nair in a private window. The menu is much shorter, and Fees is missing.
7. From Week 5: the worker terminal prints a line when you generate an invoice PDF.

> **Tip:** Mailpit stays empty? Until P-31 builds the Amazon SES channel, your mailer may only log links. Ask Claude Code: "Read `server/src/lib/mailer.ts`. Add an SMTP transport that is used when `MAIL_TRANSPORT=smtp`, with `SMTP_HOST` and `SMTP_PORT` from `config/env.ts`. Keep the SES path for `MAIL_TRANSPORT=ses`. Add the variables to the Zod schema and to `.env.example`."

## Recommended npm scripts

All scripts run from the repo root. This table is the full daily set. The first nine come from *Folder Structure*. The rest are added in this chapter.

| Script | What it does | When you run it |
|---|---|---|
| `npm run dev` | Builds `shared`, then starts the `shared` watcher, the API and the web app | Every morning, Weeks 1 to 4 |
| `npm run dev:worker` | BullMQ worker alone, in watch mode | You want its log in a second terminal |
| `npm run lint` | ESLint on all three workspaces | Before every commit |
| `npm run typecheck` | Type-checks every workspace | Before every commit |
| `npm run test` | Vitest in every workspace | Before every merge |
| `npm run check` | Lint, typecheck, test. Stops at the first failure. | Your "may I merge?" button |
| `npm run build` | Production build of `shared`, `server`, `client` | Before a deploy; CI runs it too |
| `npm run format` | Prettier rewrites all files | When a diff is noisy |
| `npm run dev:api`, `dev:web` | One process alone | While you debug the other side |
| `npm run dev:all` | Same as `dev`, plus the worker | Every morning from Week 5 |
| `npm run setup` | Install, start services, migrate, seed | Fresh clone or new laptop |
| `npm run services:up` | Starts PostgreSQL, Redis, Mailpit and waits until ready | Every morning |
| `npm run services:down` | Removes the containers, keeps the data | Every evening |
| `npm run services:logs` | Follows the last 100 log lines of all services | A service misbehaves |
| `npm run db:generate` | Rebuilds the Prisma client | After install, pull or branch switch |
| `npm run db:migrate` | Applies pending migrations. With `-- --name x` it creates one. | After pull; after a schema change |
| `npm run db:draft` | Writes a migration file without applying it | Hand-written SQL such as RLS |
| `npm run db:status` | Shows migrations that are not applied | After pull |
| `npm run db:seed` | Runs the idempotent seed | After reset; when seed data changed |
| `npm run db:studio` | Opens Prisma Studio as the owner role | Manual test checks |
| `npm run db:reset` | Wipes the local database, migrates, seeds | Only by hand, only on purpose |

Add the new script names to the "Commands" part of `CLAUDE.md`, so that Claude Code uses them too. Leave `db:reset` out of that list.

## Debug in VS Code

`console.log` finds easy bugs. A debugger finds the hard ones: you pause the program on one line and look at every variable. Commit the file below. It gives you ready-made buttons in the "Run and Debug" side bar (`Ctrl+Shift+D`).

**File: `.vscode/launch.json`**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "API: launch",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/server",
      "program": "${workspaceFolder}/server/src/server.ts",
      "runtimeArgs": ["--import", "tsx"],
      "envFile": "${workspaceFolder}/server/.env",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"]
    },
    {
      "name": "Worker: launch",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/server",
      "program": "${workspaceFolder}/server/src/jobs/worker.ts",
      "runtimeArgs": ["--import", "tsx"],
      "envFile": "${workspaceFolder}/server/.env",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"]
    },
    {
      "name": "API: attach to port 9229",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"]
    },
    {
      "name": "Server test: current file",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/server",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${fileBasename}"],
      "autoAttachChildProcesses": true,
      "smartStep": true,
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"]
    },
    {
      "name": "Web: Next.js server side",
      "type": "node-terminal",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "command": "npm run dev:web"
    },
    {
      "name": "Web: Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/client"
    }
  ],
  "compounds": [
    {
      "name": "Full stack: API + Web + Chrome",
      "configurations": ["API: launch", "Web: Next.js server side", "Web: Chrome"],
      "stopAll": true
    }
  ]
}
```

| Button | Use it when |
|---|---|
| API: launch | A service returns a wrong number. Stop `npm run dev` first, because port 4000 must be free. |
| Worker: launch | A background job fails or runs twice |
| API: attach to port 9229 | You want watch mode and breakpoints together. Start the API with `npx tsx watch --inspect src/server.ts` inside `server/`, then press this button. |
| Server test: current file | One test fails and the message does not tell you why. Open the test file first. |
| Web: Next.js server side | A server component or `middleware.ts` misbehaves |
| Web: Chrome | A form or a TanStack Query hook misbehaves in the browser |
| Full stack | You want breakpoints on both sides in one session |

`node --import tsx` is how the `tsx` package runs TypeScript inside a normal Node.js process. The debugger can attach to that process without extra settings, and it works the same on Windows, macOS and Linux.

A worked example. Suresh Gupta collects ₹12,000 for Aarav Sharma, and the receipt shows a late fee of ₹0 where you expect ₹250. Open the file that computes the late fee. Click left of the line that returns the amount, so that a red dot appears. This is a breakpoint (a marker that pauses the program on that line). Press "API: launch" and repeat the collection in the browser. VS Code stops on the line. Hover over `dueDate`, `today` and `graceDays`. Nine times out of ten the cause is visible at once. Here, `today` is yesterday's date because of a timezone slip. `F10` steps to the next line, `F11` goes into a function, `F5` continues.

> **Best practice:** When the debugger has shown you the cause, do not fix it silently. Give Claude Code the exact values you saw, ask for a failing test first, and then for the fix. *Testing Strategy for a Solo Founder* explains why the test comes first.

## File uploads without production S3

From Day 22 (P-21) the app stores student photos, admission documents, receipts and report cards in S3. The flow never sends a file through the API. The browser asks the API for a pre-signed URL (`POST /files/presign-upload`, CMN-API-02), uploads straight to storage with a `PUT`, and then calls `POST /files/:id/confirm` (CMN-API-05). Locally you need something that answers such a `PUT`. There are two ways.

| Question | Dev bucket on AWS | MinIO in Docker |
|---|---|---|
| Works without internet | No | Yes |
| Cost | A few rupees a month | Zero |
| Same code path as production | Exactly the same | Needs endpoint and path style |
| Setup time | About 20 minutes | About 3 minutes |
| Finds CORS and IAM mistakes early | Yes | No |
| Use it | On your main laptop | While travelling, and in CI |

Use the AWS dev bucket as the normal case. Keep MinIO ready for the flight and the train.

### Option A: a small dev bucket on AWS

Create the bucket in the Mumbai region `ap-south-1`, as the canon says. Name it with your own suffix, because bucket names are global: `eduflow-dev-files-mehdi`. Keep "Block all public access" switched on. Every file is read through a short-lived pre-signed URL, so nothing needs to be public.

Create an IAM user `eduflow-dev-uploader` with this policy and nothing more. It can touch one bucket only. If the key leaks from your laptop, the damage stops there.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DevBucketObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::eduflow-dev-files-mehdi/*"
    },
    {
      "Sid": "DevBucketList",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::eduflow-dev-files-mehdi"
    }
  ]
}
```

The browser uploads from `http://localhost:3000`, which is a different origin than the bucket. Without a CORS rule the upload fails in the browser while `curl` works, and that confuses people for hours. Save this as `cors.json` and apply it once:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

```bash
aws s3api put-bucket-cors --bucket eduflow-dev-files-mehdi \
  --cors-configuration file://cors.json
aws s3 ls s3://eduflow-dev-files-mehdi
```

Add one lifecycle rule in the S3 console under Management: expire objects after 30 days. Test uploads then clean themselves up and the bill stays near zero. Never put this rule on a production bucket.

### Option B: MinIO in Docker

MinIO speaks the same API as S3, so the same AWS SDK code works against it.

```bash
docker compose --profile s3 up -d
```

1. Open `http://localhost:9001` and log in with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` from the root `.env`.
2. Open Buckets, press Create Bucket, name it `eduflow-local-files`, press Create.
3. Put these five values into `server/.env` and restart the API.

```env
AWS_ACCESS_KEY_ID=eduflow_minio
AWS_SECRET_ACCESS_KEY=eduflow_minio_secret
S3_BUCKET=eduflow-local-files
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
```

Two settings make this work, and your S3 client must read both from the config:

```typescript
export const s3 = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.S3_ENDPOINT || undefined,
  forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true',
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});
```

`endpoint` points the SDK at your laptop instead of `amazonaws.com`. `forcePathStyle` builds the URL as `http://localhost:9000/eduflow-local-files/students/photo.jpg`. Without it the SDK builds `http://eduflow-local-files.localhost:9000/...`, and that name does not resolve. MinIO allows browser uploads from any origin by default, so there is no CORS step.

### Check that uploads really work

The honest test is the real screen: open a student, press "Upload photo", pick a small JPEG, reload the page. The photo must still be there. If it is, the pre-sign, the `PUT` and the confirm call all work.

The terminal test, when you want to see the three steps separately:

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rajesh@brightfuture.example","password":"EduFlow@Local123"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).data.accessToken")

curl -s -X POST http://localhost:4000/api/v1/files/presign-upload \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"fileName":"aarav.jpg","mimeType":"image/jpeg","sizeBytes":18234}'
```

Take the `uploadUrl` from the answer and push a file into it:

```bash
curl -i -X PUT --upload-file ./aarav.jpg -H "Content-Type: image/jpeg" "<uploadUrl>"
```

A `200 OK` means the storage side is fine. The exact request fields come from your P-21 code; the OpenAPI page at `http://localhost:4000/api/v1/docs` always shows the current shape.

> **Warning:** A pre-signed `PUT` URL is signed together with the `Content-Type`. If the browser sends `image/jpeg` but the pre-sign asked for `application/octet-stream`, AWS answers `403 SignatureDoesNotMatch`. MinIO is more forgiving, so this bug hides until the first real deploy. That is the main reason to use the AWS dev bucket on your main laptop.

## Webhooks that reach your laptop

A webhook is a call that another company's server makes to your API when something happens: Razorpay after a parent pays, Meta after a WhatsApp message is delivered, Amazon SES after a bounce. The problem is simple. `http://localhost:4000` exists only on your laptop. Razorpay cannot call it.

A tunnel solves it. The tool opens an outgoing connection from your laptop to the vendor's network and gives you a temporary public HTTPS address. Every request to that address arrives at your local port.

**Figure: How a webhook reaches your laptop**

```mermaid
sequenceDiagram
  participant RZP as Razorpay
  participant TUN as Tunnel
  participant API as Local API
  RZP->>TUN: POST to the public address
  TUN->>API: forwards to port 4000
  API->>API: check signature, store event
  API-->>TUN: 200 OK
  TUN-->>RZP: 200 OK
```

The tunnel program (`cloudflared` or `ngrok`) runs in a terminal on your laptop and holds the connection open. Razorpay never learns your IP address. It only knows the public tunnel address, and that address dies when you press `Ctrl+C`.

### The webhooks EduFlow receives

| Sender | Local path (after `/api/v1`) | Secret variable | Arrives from |
|---|---|---|---|
| Razorpay, institute fees | `/webhooks/razorpay/:gatewayAccountId` | `RAZORPAY_WEBHOOK_SECRET` | Day 39, P-26 |
| Stripe, international fees | `/webhooks/stripe/:gatewayAccountId` | `STRIPE_WEBHOOK_SECRET` | Phase 4, P-32 |
| Razorpay or Stripe, our own billing | `/webhooks/billing/:provider` | Same secrets | Day 15, P-11 |
| Meta WhatsApp, delivery and inbound | `/webhooks/whatsapp` | `WHATSAPP_APP_SECRET` | Day 44, P-29 |

Every one of them is public (no login), so the signature check is the only door. The endpoint IDs are PAY-API-38, PAY-API-39, ORG-API-30 and WA-API-23 and WA-API-24 in the *API Endpoint Catalog*.

### Pick a tunnel

| Tool | Command | Account | Notes |
|---|---|---|---|
| Cloudflare Tunnel | `cloudflared tunnel --url http://localhost:4000` | None for a quick tunnel | New random address each start |
| ngrok | `ngrok http 4000` | Free sign-up, then add your auth token | Free plan gives one reserved address |
| Stripe CLI | `stripe listen --forward-to ...` | `stripe login` | Stripe only, no tunnel needed |

Both tunnels are free for this use. Install them from the vendor's download page, or check first whether winget has them:

```bash
winget search cloudflared
winget search ngrok
```

A new random address every morning means editing the Razorpay dashboard every morning. Two ways around it: use the ngrok free reserved domain, or do payment webhook testing on the hosted staging environment, where the address never changes. *Environments and Configuration* describes that setup.

### Razorpay, step by step

1. Start the API, then start the tunnel in a second terminal. Copy the `https://...` address it prints.
2. Put that address into `server/.env` as `API_PUBLIC_URL` and restart the API. Some flows put the callback address into the order.
3. Open the Razorpay dashboard in **Test Mode**, go to Settings, then Webhooks, then Add New Webhook.
4. URL: `https://<your-tunnel>/api/v1/webhooks/razorpay/<gatewayAccountId>`. Take the id from the `payment_gateway_accounts` row of Bright Future Public School in Prisma Studio.
5. Secret: paste the same text that sits in `RAZORPAY_WEBHOOK_SECRET`. You invent it. It is not shown anywhere else.
6. Tick `payment.captured`, `payment.failed`, `order.paid` and `refund.processed`.
7. Pay a test fee of ₹100 in the app with the Razorpay test UPI or test card. Watch the API log, then open `GET /api/v1/webhook-events` (PAY-API-40). The row must be `PROCESSED`.

Razorpay signs the raw bytes of the body with HMAC SHA-256 and sends the result in the `X-Razorpay-Signature` header. So the webhook route must see the raw body, not the object that `express.json()` already parsed. Mount the raw parser before the JSON parser:

```typescript
// server/src/app.ts — order matters
app.use('/api/v1/webhooks', express.raw({ type: 'application/json', limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));
```

Inside the handler, verify first and parse second. `req.body` is a `Buffer` there.

Replaying a webhook by hand is faster than paying again. Open the webhook log in the Razorpay dashboard, copy the JSON body into `server/tmp/rzp-captured.json` (the `tmp/` folder is ignored by Git), then:

```bash
cd server
SIG=$(node -e "const c=require('crypto'),f=require('fs');\
console.log(c.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)\
.update(f.readFileSync('tmp/rzp-captured.json')).digest('hex'))")
curl -i -X POST "http://localhost:4000/api/v1/webhooks/razorpay/$GATEWAY_ACCOUNT_ID" \
  -H "Content-Type: application/json" -H "X-Razorpay-Signature: $SIG" \
  --data-binary @tmp/rzp-captured.json
```

Send it twice. The second call must also answer `200`, and it must not create a second payment. That is the idempotency rule from the *Payments* module chapter, and it is the bug that costs institutes real money.

### Stripe, without a tunnel

The Stripe CLI has its own forwarding, so you never edit a dashboard.

```bash
stripe login
stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe/$GATEWAY_ACCOUNT_ID
stripe trigger payment_intent.succeeded
```

`stripe listen` prints a signing secret that starts with `whsec_`. Put that value into `STRIPE_WEBHOOK_SECRET` and restart the API. It changes on every `stripe listen` run unless you reuse the same session.

### WhatsApp, the verification handshake

Meta first checks that you own the address. It sends a `GET` with three query parameters and expects your API to answer with the challenge text, as plain text, status 200. You can test that part without any tunnel:

```bash
curl -s "http://localhost:4000/api/v1/webhooks/whatsapp?hub.mode=subscribe\
&hub.verify_token=local_verify_token_change_me&hub.challenge=12345"
```

It must print exactly `12345` and nothing else. No JSON envelope here; this one endpoint breaks the rule on purpose. Then start the tunnel, open your Meta app, go to WhatsApp, then Configuration, press Edit next to Webhook, enter `https://<your-tunnel>/api/v1/webhooks/whatsapp` and the same verify token, save, and subscribe to the `messages` field. Delivery reports and replies now land in the local database.

> **Warning:** A tunnel address is open to the whole internet while it runs. Anybody who guesses it reaches your laptop. Start it only while you test, stop it with `Ctrl+C` when you are done, and never point a live Razorpay or Meta account at it. Test mode only.

## Send your first test WhatsApp message

WhatsApp is the reason many institutes will buy EduFlow, so test it early, on Day 44 (P-29) at the latest. Meta gives every new app a free test number. It can send to at most five phone numbers that you add by hand. That is enough for you, your co-tester and two pilot institutes.

Set it up once at `developers.facebook.com`:

1. Create an app of type Business, then add the product "WhatsApp".
2. Open WhatsApp, then API Setup. Note the "From" test number, the **Phone number ID** and the **WhatsApp Business Account ID**.
3. Under "To", press Manage phone number list and add your own number with the country code. Meta sends you a code on WhatsApp; enter it.
4. Copy the temporary access token. It dies in about 24 hours. That is fine for a first test.
5. Put the four values into `server/.env`: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_GRAPH_VERSION`.

Send the message straight from the terminal first. This proves that the token and the number work, before any EduFlow code is involved. `hello_world` is the sample template that every new account already has approved.

```bash
cd server && set -a && . ./.env && set +a
curl -s -X POST \
  "https://graph.facebook.com/$WHATSAPP_GRAPH_VERSION/$WHATSAPP_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"919876543210","type":"template",
       "template":{"name":"hello_world","language":{"code":"en_US"}}}'
```

Write the number in international form without the plus sign and without spaces: `919876543210`. A good answer looks like this, and the message reaches your phone within a few seconds:

```json
{
  "messaging_product": "whatsapp",
  "contacts": [{ "input": "919876543210", "wa_id": "919876543210" }],
  "messages": [{ "id": "wamid.HBgMOTE5ODc2NTQzMjEw..." }]
}
```

When it fails, Meta answers with an `error` object. The three you will meet first:

| What the message says | What it means | Fix |
|---|---|---|
| Recipient phone number not in allowed list | The number is not in the test list | Add it under API Setup, To, Manage phone number list |
| Error validating access token, session expired | The temporary token is older than a day | Copy a fresh token from API Setup |
| Template name does not exist in the translation | Wrong template name or wrong language code | Use `hello_world` with `en_US` for the first test |

The numeric `error.code` that Meta prints next to these messages changes over time. Trust the text in `error.message` and `error.error_data.details`, and look the code up in Meta's own error reference before you write any handling around it.

### Then send the same message through EduFlow

Now the safety switch matters. `MESSAGING_MODE=log` means the worker renders the message and writes it to the log, but sends nothing. That is the right setting for most days, because a loop in your code could otherwise spam a parent at 2 a.m.

```env
MESSAGING_MODE=allowlist
MESSAGING_ALLOWLIST=+919876543210
```

Restart the API and the worker, then do something real in the app: collect a fee of ₹12,000 from Suresh Gupta's screen for Aarav Sharma. Watch three places in this order.

1. The worker terminal prints the job, the template name and the recipient.
2. Your phone shows the message.
3. In the app, the WhatsApp log (WA-API-25 feeds its summary) shows one row, and the credit wallet has one entry less.

Set `MESSAGING_MODE` back to `log` when you finish for the day. Sunita Devi is a fictional parent, but your own tester is not.

> **Founder note:** Pehla WhatsApp message apne hi phone par aata hai. Screenshot lijiye. Demo mein yeh screenshot sabse zyada kaam aata hai, kyunki institute owner yahi poochta hai: parents ko message pahunchega kaise.

## Reset the database safely

Local data gets dirty: a half-tested import, twenty duplicate invoices, a migration you wrote three times. Resetting is normal and should feel cheap. It only has to stay local.

| Level | Command | What it removes | When to use it |
|---|---|---|---|
| Re-seed | `npm run db:seed` | Nothing. The seed upserts. | Seed data changed |
| Schema and rows | `npm run db:reset` | Every table and row, then rebuilds and seeds | Messy data or migration drift |
| Everything | `docker compose down -v` | Database, Redis queues, MinIO files, roles | Fresh-laptop state, or nothing else helps |

Run through this list before a reset. It takes 30 seconds and saves the "why is it hanging" hour.

1. Stop `npm run dev`, the worker and Prisma Studio. Open connections make PostgreSQL refuse the drop with "database is being accessed by other users".
2. Check the target: `grep DATABASE_ADMIN_URL server/.env` must contain `@localhost`. The wrapper script refuses a remote host, but look with your own eyes.
3. Commit the migration files you wrote. A reset deletes rows, not files, but a half-finished migration folder still confuses the next run.
4. If you spent an hour building nice demo data, take a dump first.

Backup and restore, both through the container:

```bash
mkdir -p backups
docker compose exec -T postgres pg_dump -U eduflow -d eduflow_dev -Fc \
  > "backups/eduflow_dev_$(date +%Y%m%d_%H%M).dump"

docker compose exec -T postgres pg_restore -U eduflow -d eduflow_dev \
  --clean --if-exists < backups/eduflow_dev_20261110_1830.dump
```

Add `backups/` to `.gitignore`. Those files contain personal data of pilot institutes once you copy staging data down, and personal data never belongs in Git.

The full wipe, in order:

```bash
npm run services:down          # or: docker compose down
docker compose down -v         # deletes the volumes as well
npm run services:up
npm run db:migrate             # rebuilds the schema from migration files
npm run db:seed
```

Redis alone can be cleared without touching PostgreSQL. Do this when a queue is stuck or a rate-limit counter blocks your own login:

```bash
docker compose exec redis redis-cli flushall
```

Queued jobs are lost. Repeatable jobs, such as the nightly reminder scan, register themselves again when the worker starts.

After any reset, run the seven-step smoke test from "Run the app". It takes two minutes and tells you whether the reset really finished.

> **Warning:** `npm run db:reset` on a hosted database would delete a pilot institute's real students and receipts. That is why the wrapper script checks the host, why Railway variables never sit in `server/.env`, and why hosted databases get `prisma migrate deploy` instead. Never copy a Railway `DATABASE_URL` into your local file "just to look at something". Use a read-only copy or Prisma Studio against a restored dump.

## The daily routine

The whole point of this chapter is that a build day starts with typing, not with debugging.

Morning, about two minutes:

```bash
cd ~/code/eduflow
git pull --ff-only
npm install                 # only when package-lock.json changed in the pull
npm run services:up
npm run db:status           # "Database schema is up to date" or a list
npm run db:migrate          # only when something is pending
npm run dev                 # from Week 5: npm run dev:all
```

Open three windows and leave them open all day: Chrome on `http://localhost:3000`, a Chrome tab on `http://localhost:8025` for Mailpit, and a second terminal with `claude` running.

Evening, about three minutes:

```bash
# Ctrl+C in the dev terminal
npm run check               # lint, typecheck, test
git add -A
git commit -m "feat(fees): ..."   # message rules in Git Workflow
git push
npm run services:down
```

`services:down` gives about 1.5 GB of RAM back to Windows. The data volumes stay, so tomorrow morning your database is exactly as you left it.

When you switch branches, the database and the Prisma client are the two things that do not switch with Git:

| After | Run | Why |
|---|---|---|
| `git pull` | `npm install` when the lock file changed | New packages |
| `git pull` or branch switch | `npm run db:generate` | The client is generated code, not Git content |
| Branch switch with new migrations | `npm run db:migrate` | Apply what the branch expects |
| Switch back to a branch with fewer migrations | `npm run db:reset` | Your database is ahead of the code |

Once a week, on the Sunday review, reclaim disk space. This removes stopped containers and unused images. It does not touch your named volumes, so the database survives:

```bash
docker system prune -f
docker system df
```

## Common errors and fixes

Every line below is a real first-week error. Find the symptom, apply the fix, move on.

| Symptom | Why it happens | Fix |
|---|---|---|
| `EADDRINUSE ... :::4000` | An older API process still holds the port | See "Port already in use" |
| `P1001 Can't reach database server at localhost:5432` | Container stopped or not healthy yet | `npm run services:up`, then `docker compose ps` |
| `error during connect ... docker_engine` | Docker Desktop is not started | See "Docker is not running" |
| `The table public.students does not exist` | Migrations were never applied here | `npm run db:status`, then `npm run db:migrate` |
| `Unknown argument 'bloodGroup'` | Prisma client older than the schema | See "Prisma client out of date" |
| `EPERM ... rename query_engine-windows.dll.node` | Windows holds the file while the API runs | Stop `npm run dev`, then `npm run db:generate` |
| `permission denied for schema public` | Prisma ran as the runtime role | Use `npm run db:migrate`, never bare `npx prisma` |
| `Drift detected: your database schema is not in sync` | Hand edits, or a branch switch | `npm run db:reset` on local only |
| `blocked by CORS policy` in the browser console | `CORS_ORIGINS` does not match the origin | See "CORS errors" |
| Login works, every later call is 401 | The refresh cookie is not stored or not sent | See "Cookies on localhost" |
| Attendance of 5 Oct shows as 4 Oct | A date built from laptop-local parts | See "Timezone confusion" |
| `Module not found: @eduflow/shared` | `shared/dist` missing after a clone | `npm run build -w shared` |
| `EPERM` during `npm install` | Repo inside OneDrive, or antivirus scanning | Move the repo to `C:\Users\<name>\code` |
| `ECONNREFUSED 127.0.0.1:6379` | Redis container down, or wrong `REDIS_URL` | `npm run services:up` |
| Jobs queue up but nothing happens | The worker is not running | `npm run dev:worker` or `npm run dev:all` |
| The web app still calls the old API URL | Next.js reads `.env.local` only at start | Stop and start `npm run dev` |
| Laptop crawls, fan loud, memory full | WSL took all the RAM | Write `.wslconfig`, then `wsl --shutdown` |
| The tunnel answers `502 Bad Gateway` | The API is down or on another port | Start the API first, check port 4000 |

### Port already in use

```bash
netstat -ano | grep ":4000"     # the last column is the process ID
taskkill //PID 12345 //F        # Git Bash needs the double slashes
```

On macOS and Linux: `lsof -i :4000`, then `kill -9 <pid>`. If port 5432 is taken, the cause is usually a PostgreSQL that you installed on Windows years ago. Either stop that Windows service (`services.msc`, find PostgreSQL, Stop, set Startup type to Manual), or change the compose line to `"127.0.0.1:5433:5432"` and write `5433` into both database URLs.

### Prisma client out of date

The Prisma client is generated code inside `node_modules`. It is not in Git. So a `git pull` that changes the schema does not change your client, and TypeScript then complains about a field that clearly exists.

```bash
npm run db:generate
npm run db:status
```

If the error survives, stop every Node process, delete `node_modules/.prisma`, and generate again. On Windows the file is locked while the API runs, which is what the `EPERM ... rename` message means.

### Docker is not running

```bash
docker info                      # errors here mean the engine is down
docker compose ps                # STATUS must be "Up ... (healthy)"
docker compose up -d --wait
docker compose logs --tail=50 postgres
```

Start Docker Desktop and wait until the whale icon stops animating; `docker compose up` before that fails with a connection error. After a big Windows update, the Linux engine sometimes hangs. `wsl --shutdown` in PowerShell, then start Docker Desktop again, fixes it.

### CORS errors

An origin is scheme plus host plus port. `http://localhost:3000` and `http://localhost:4000` are different origins, so every API call from the web app is a cross-origin call and the browser checks the rules.

```typescript
app.use(
  cors({
    origin: env.CORS_ORIGINS, // exact strings, from the comma-separated variable
    credentials: true, // required, because the refresh cookie travels
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Campus-Id', 'Idempotency-Key'],
  })
);
```

Four mistakes cause almost every CORS error: a trailing slash in `CORS_ORIGINS`, `https` instead of `http`, `127.0.0.1` on one side and `localhost` on the other, and forgetting to restart the API after editing `.env`. With `credentials: true` the server must answer with the exact origin; the wildcard `*` is refused by the browser. Test the pre-flight request without the browser:

```bash
curl -i -X OPTIONS http://localhost:4000/api/v1/students \
  -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET"
```

You want `204` plus `Access-Control-Allow-Origin: http://localhost:3000` and `Access-Control-Allow-Credentials: true` in the answer.

### Cookies on localhost

The refresh token lives in an httpOnly cookie (a cookie that JavaScript cannot read). Five rules make it work locally:

- `COOKIE_SECURE=false`. Chrome accepts a `Secure` cookie on `http://localhost`, other browsers are less predictable. Do not rely on it.
- `COOKIE_DOMAIN` stays empty. A value such as `.localhost` is not a valid cookie domain and the browser drops the cookie silently.
- `sameSite: 'lax'` is enough. Ports are not part of a "site", so `localhost:3000` and `localhost:4000` count as the same site. `sameSite: 'none'` would force `Secure`.
- The API client must send `credentials: 'include'` on every request, and Axios needs `withCredentials: true`. Without it the browser neither stores nor returns the cookie.
- Use `localhost` everywhere. A cookie set for `127.0.0.1` is invisible to `localhost`.

Check it in Chrome DevTools: Application, then Storage, then Cookies. After login you must see the refresh cookie with `HttpOnly` ticked and `Secure` empty. If the cookie is there but the refresh call still fails, compare the cookie `Path` with the path of your refresh endpoint.

### Timezone confusion

The stack runs in UTC everywhere: `TZ=UTC` in `server/.env`, `TZ: UTC` in the `postgres` service, `timestamptz` columns, and the organization's timezone applied only when a value is shown. Your laptop is on IST, and that difference of five and a half hours is where the bugs come from.

The classic one: `new Date(2026, 9, 5)` on an IST laptop is 4 October 18:30 UTC. Stored in a `@db.Date` column it becomes 4 October, and Priya Nair's attendance for 5 October lands on the wrong day. So never build a date from local parts. Build calendar days as text in the organization's timezone (`'2026-10-05'`), and let the API turn them into UTC timestamps at the edge.

To see exactly what a parent in Patna sees, start the API once with a different timezone, then remove it again:

```bash
TZ=Asia/Kolkata npm run dev:api
```

One more Windows detail: after hibernation the clock inside the Linux VM can drift. Tokens then look "not valid yet" and signature checks fail for no visible reason. `wsl --shutdown`, then restart Docker Desktop, and keep "Set time automatically" switched on.

## Key takeaways

- Spend one careful evening on this setup, and every build day after it starts with `npm run services:up` and `npm run dev`.
- Docker runs only PostgreSQL, Redis, Mailpit and the optional MinIO. Node.js runs the API, the worker and the web app directly, because watch mode is much faster that way.
- Two database URLs are not a detail: the app connects as the limited `eduflow_app` role so that Row-Level Security applies, and only migrations, seed and Studio use the owner role through the wrapper script.
- Every secret in `.env.example` has a safe dummy value. You replace one only on the day its prompt arrives, and you add the new name to the Zod schema, `.env.example` and the appendix in the same commit.
- Nothing local can reach a real person: Mailpit swallows every email, `MESSAGING_MODE=log` swallows every WhatsApp and SMS, and only test keys are used.
- Webhooks need a tunnel or the Stripe CLI. Start it when you test, stop it when you finish, and always send the same event twice to prove that your handler is idempotent.
- Resetting the local database is cheap and normal. Pick the smallest level that fixes the problem, take a dump when the demo data matters, and never point a destructive command at a hosted database.

