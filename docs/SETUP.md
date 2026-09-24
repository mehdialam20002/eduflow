# SETUP — get EduFlow running on this machine

This is the first-day setup for the founder's own Windows 11 laptop. Follow the steps in order.
Allow about one hour, or two hours if you choose the Docker route.

You do not need to understand every line. You need the app to start.

## What is already here (checked 24 September 2026)

| Thing | State | What it means for you |
|---|---|---|
| Windows 11 Home | Installed | Use Git Bash for the commands in this file |
| Node.js 24.13.1 | Installed | Nothing to do |
| npm 11.8.0 | Installed | Nothing to do |
| Git Bash and PowerShell | Installed | Nothing to do |
| PostgreSQL 18 | Running as a Windows service on port 5432 | The password is unknown, see step 4 |
| `psql.exe` | Blocked by an Application Control policy | Never use `psql`. Use pgAdmin or Prisma |
| Docker Desktop | Not installed | Optional. Only needed for route B in step 4 |
| Redis | Not installed | Optional. Queues are switched off without it |
| WSL 2 | Available | One way to run Redis, see step 5 |

Two rules follow from this list, and the code already respects them:

1. The app starts, type-checks and builds **without a database connection**. It prints a clear
   message instead of crashing.
2. The app starts **without Redis**. Background queues are disabled and it says so once in the
   log.

## Step 1 — Check your tools

Open **Git Bash** in the project folder (`E:/mysaasschool`) and run:

```bash
node -v      # must print v24.x
npm -v       # must print 11.x
git --version
```

If `node -v` prints something older, install Node.js 24 LTS from <https://nodejs.org> and open a
new terminal.

## Step 2 — Install the packages

Run this once, from the repository root. It installs all three workspaces at the same time.

```bash
npm install
```

Never run `npm install` inside `client/`, `server/` or `shared/`. That would create a second
`package-lock.json`, and then your laptop and CI would install different versions.

## Step 3 — Create your `.env` file

```bash
npm run setup
```

This copies `.env.example` to `.env` if you do not have one yet, creates the local folders the
app needs, and prints the next commands. It never overwrites an existing `.env`.

`.env` holds your passwords. It is in `.gitignore`. Never commit it, never paste it into a chat,
never open it in a screen share.

## Step 4 — Give the app a database

Choose **one** route. Route A is the cheapest and fastest if you can reset the password.
Route C is the easiest if you do not want to fight with Windows today.

### Route A — use the PostgreSQL 18 service that is already running

The service listens on port 5432. Its `postgres` password is unknown, and `psql.exe` is blocked,
so the password is reset through pgAdmin 4, which was installed together with PostgreSQL 18.

1. Press the Windows key, type **Services**, open it. Find **postgresql-x64-18**. Right-click it
   and choose **Stop**.
2. Open this file in Notepad, started **as administrator**:
   `C:/Program Files/PostgreSQL/18/data/pg_hba.conf`
3. Near the bottom, find the two lines that begin `host    all    all    127.0.0.1/32` and
   `host    all    all    ::1/128`. Change the last word on both lines from `scram-sha-256` to
   `trust`. Save the file.
4. Back in Services, right-click **postgresql-x64-18** and choose **Start**.
5. Open **pgAdmin 4** from the Start menu. It asks for a master password: that one belongs to
   pgAdmin itself, so invent it and write it down. Expand **Servers** and click
   **PostgreSQL 18**. It connects without asking for a password, because of the `trust` you set.
6. Open **Tools, Query Tool** and run these two statements. Replace the password with one of your
   own, using letters and digits only:

   ```sql
   ALTER USER postgres WITH PASSWORD 'ChooseAStrongOne123';
   CREATE DATABASE eduflow_dev;
   ```

7. Undo step 3: put `scram-sha-256` back in `pg_hba.conf`, save, and restart the service in
   Services. This closes the door again. Do not skip this step.
8. Put these two lines in your `.env`:

   ```env
   DATABASE_URL=postgresql://postgres:ChooseAStrongOne123@localhost:5432/eduflow_dev?schema=public
   DATABASE_ADMIN_URL=postgresql://postgres:ChooseAStrongOne123@localhost:5432/eduflow_dev?schema=public
   ```

If your password contains `@`, `:`, `/` or `#`, either choose a different password or write that
character in percent form (`@` becomes `%40`). A raw `@` breaks the URL.

### Route B — install Docker Desktop and use its PostgreSQL on port 5433

Use this if you would rather not touch the Windows service. Docker needs about 4 GB of memory
while it runs.

1. Install Docker Desktop from <https://www.docker.com/products/docker-desktop/> and restart
   Windows when it asks. It uses the WSL 2 you already have.
2. Start the services from the repository root:

   ```bash
   docker compose up -d --wait
   docker compose ps          # postgres and redis must say "healthy"
   ```

3. The compose file maps PostgreSQL to **port 5433**, because 5432 is taken by the installed
   service. Put these lines in your `.env`. The user, password and database name are the defaults
   at the top of `docker-compose.yml`, so check them there if a connection is refused:

   ```env
   DATABASE_URL=postgresql://eduflow:eduflow_local_pw@localhost:5433/eduflow_dev?schema=public
   DATABASE_ADMIN_URL=postgresql://eduflow:eduflow_local_pw@localhost:5433/eduflow_dev?schema=public
   REDIS_URL=redis://localhost:6379
   ```

Docker also gives you Mailpit, a fake inbox at <http://localhost:8025>, so password-reset mails
land somewhere you can read them and never reach a real person.

### Route C — use a free hosted PostgreSQL (Neon)

Nothing to install. You need internet while you code.

1. Create a free account at <https://neon.tech> and a project called `eduflow-dev`.
2. On the project dashboard open **Connection string**. Choose the **direct** connection, not the
   pooled one, because Prisma migrations need a direct connection.
3. Copy it into `.env` exactly as Neon gives it, and use the same value for the admin URL:

   ```env
   DATABASE_URL=postgresql://USER:PASS@ep-name-12345.aws.neon.tech/eduflow?sslmode=require
   DATABASE_ADMIN_URL=postgresql://USER:PASS@ep-name-12345.aws.neon.tech/eduflow?sslmode=require
   ```

   Your host and database name will differ. Keep the shape: user, password, host, database,
   then `?sslmode=require`.

Keep `?sslmode=require`. Neon refuses a connection without it. The free tier sleeps after five
minutes of no traffic, so the first request each morning takes a few seconds.

## Step 5 — Redis, only if you want background jobs today

Redis runs the queues: invoice PDFs, WhatsApp messages, imports and reports. **In development it
is optional.** If `REDIS_URL` is empty, the app starts, says "queues are disabled" once, and
everything else works. You do not need Redis before Week 5.

| Route | What goes in `.env` |
|---|---|
| Skip it, today's choice | `REDIS_URL=` |
| Docker, if you took route B | `REDIS_URL=redis://localhost:6379` |
| Memurai on Windows | `REDIS_URL=redis://localhost:6379` |
| WSL 2 | `REDIS_URL=redis://localhost:6379` |
| Free hosted, Upstash | `REDIS_URL=rediss://default:PASS@HOST.upstash.io:6379` |

What each route needs:

- **Skip it.** Nothing to install. Leave the line empty or delete it.
- **Docker.** `docker compose up -d --wait` already started Redis in step 4.
- **Memurai.** Install Memurai Developer from <https://www.memurai.com>. It is a Redis-compatible
  Windows service and starts by itself on port 6379.
- **WSL 2.** Run `wsl --install -d Ubuntu` in PowerShell as administrator. Inside Ubuntu run
  `sudo apt update`, then `sudo apt install redis-server`, then `sudo service redis-server start`.
  WSL 2 shares `localhost` with Windows, so the URL stays the same.
- **Upstash.** Create a free database at <https://upstash.com> and copy the URL it shows.

The hosted URL starts with `rediss`, with two letters s. The second s means the connection is
encrypted. Copying it as `redis` fails with a timeout.

## Step 6 — Check the machine

```bash
npm run doctor
```

This prints one line per check: the Node version, whether `.env` exists and which required keys
are missing, whether PostgreSQL answers on the host and port in your `DATABASE_URL`, whether
Redis answers, whether `node_modules` is there, and whether `docs/schema/` still matches
`server/prisma/schema/`. Every failing line names the exact command that fixes it.

Fix everything marked as required before you go on. A cross against Redis is fine.

## Step 7 — Create the tables and the starting data

```bash
npm run db:migrate
npm run db:seed
```

The first command creates every table from `server/prisma/schema/`. The very first run also
writes the initial migration file, so commit that file afterwards. The second command inserts the
plans, the permissions, the seven system roles, the reference countries and currencies, and one
demo institute (Bright Future Public School) with a campus, a course, a batch and an admin user.

The seed is safe to run again. It updates instead of duplicating.

## Step 8 — Start it

```bash
npm run dev
```

Two processes start in one terminal, each log line prefixed with its name. Stop both with
`Ctrl+C`.

| Open this | You should see |
|---|---|
| <http://localhost:3000> | The EduFlow landing page with a link to sign in |
| <http://localhost:3000/login> | The login form |
| <http://localhost:4000/api/v1/health> | `success: true` with an uptime number |
| <http://localhost:4000/api/v1/ready> | `success: true` when the database answers |
| <http://localhost:8025> | The Mailpit inbox, empty (route B only) |

If `/api/v1/ready` returns 503 with the code `SERVICE_UNAVAILABLE`, the API is running but cannot
reach the database. Go back to step 4, then run `npm run doctor`.

## Step 9 — Set up the editor

Open the folder in VS Code. It offers the recommended extensions from `.vscode/extensions.json`.
Accept them. Format-on-save with Prettier and ESLint auto-fix are already configured in
`.vscode/settings.json`.

Set Git Bash as the default terminal: `Ctrl+Shift+P`, "Terminal: Select Default Profile",
then choose **Git Bash**.

## The commands you will actually use

| Command | What it does |
|---|---|
| `npm run dev` | API and web app together |
| `npm run dev:server` and `npm run dev:client` | One side alone |
| `npm run dev:worker` | The background job worker (needs Redis) |
| `npm run doctor` | Checks this machine and says what is broken |
| `npm run lint` and `npm run lint:fix` | Code style |
| `npm run typecheck` | TypeScript, no files written |
| `npm run test` | All tests |
| `npm run build` | Production build of all three workspaces |
| `npm run db:migrate` | Apply schema changes. Add `-- --name add_x` to create one |
| `npm run db:seed` | Reference data and the demo institute |
| `npm run db:studio` | A browser table viewer for the database |
| `npm run db:reset` | Wipes the local database and rebuilds it. On purpose only |
| `npm run check` | Lint, typecheck and tests in one go: your "may I merge?" button |
| `npm run gen:constants` | Rebuilds `shared/src/generated/` from the specifications |
| `npm run sync:schema` | Copies the live Prisma schema into `docs/schema/` |
| `npm run check:schema-sync` | Fails if those two schemas differ |

Before you call a task done, run `npm run check`. It is lint, typecheck and tests in one command
and it stops at the first failure.

If npm ever says a script is missing, the name has moved. Two that change often: reset the local
database with `npx prisma migrate reset --schema ./prisma/schema` from inside `server/`, and open
the table viewer with `npx prisma studio --schema ./prisma/schema` from the same folder.

## Troubleshooting

| Message you see | What it means | What you do |
|---|---|---|
| `EADDRINUSE :::4000` | An API is already running | `npx kill-port 4000` |
| `Can't reach database server` | Postgres is down, or wrong port | Check Services, `npm run doctor` |
| `password authentication failed` | Wrong password in `.env` | Redo step 4 route A, or use route C |
| `P1000: Authentication failed` | Same, or `@` in the password | Use letters and digits only |
| `public.organizations does not exist` | No migration was applied here | `npm run db:migrate` |
| `permission denied for schema public` | The user does not own the schema | Make both database URLs equal |
| `ECONNREFUSED 127.0.0.1:6379` | Redis is not running | Ignore it, or do step 5 |
| The log says queues are disabled | No `REDIS_URL` is set | Normal. Only step 5 changes it |
| `Environment validation failed` | `.env` misses required keys | Copy them from `.env.example` |
| `psql: command not found` | `psql.exe` is blocked here | Use pgAdmin or `npm run db:studio` |
| `docker: command not found` | Docker is not installed | Use route A or route C |
| `npm ci` fails in CI | The lock file is out of date | `npm install`, then commit it |
| CI: generated files out of date | A specification changed | `npm run gen:constants`, commit |
| CI: `check:schema-sync` failed | The two schemas differ | `npm run sync:schema`, commit |
| PowerShell blocks a script | The execution policy | Use Git Bash instead |

## When something is still wrong

1. Run `npm run doctor` and read every line.
2. Run `git status`. An unexpected change often explains an unexpected error.
3. Paste the failing command and the first thirty lines of its output into Claude Code. Thirty
   lines, not three thousand.
4. If the database is in a strange state and it holds only local data, run `npm run db:reset` and
   then `npm run db:seed`. If that script is missing, run
   `npx prisma migrate reset --schema ./prisma/schema` from inside `server/`.
