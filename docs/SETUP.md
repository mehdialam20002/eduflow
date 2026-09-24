# SETUP — get EduFlow running on this machine

This is the setup for the founder's own laptop. Every step on this page was run and checked on
24 September 2026. Follow them in order. Allow about an hour the first time.

You do not need to understand every line. You need the app to start.

## What you need to know first

Windows 11 on this laptop has **Smart App Control** switched on. Smart App Control is a Windows
feature that only allows signed, known programs to run. A modern JavaScript toolchain ships part
of its work as small unsigned `.exe` and `.node` files, so Windows blocks them.

| Blocked file | It belongs to | What it breaks on Windows |
|---|---|---|
| `esbuild.exe` | Vitest, tsx | Tests and TypeScript scripts do not run |
| `@next/swc-win32-x64-msvc` | The Next.js compiler | The web app does not build |
| `@tailwindcss/oxide`, `lightningcss` | Tailwind CSS 4 | The stylesheets do not build |
| `psql.exe` | The PostgreSQL command line | No command line access to the database |

Prisma's engines are signed, so Prisma itself runs fine on Windows.

Smart App Control has a one-way switch. Once it is off, Windows cannot turn it back on. So it was
left alone.

The decision: **development happens inside WSL 2.** WSL 2 (Windows Subsystem for Linux) runs a
real Ubuntu Linux next to Windows and shares your `localhost`. This is not a workaround. EduFlow
will run on a Linux server in production, so building it on Linux removes a whole class of
"it worked on my machine" problems. Most professional teams work exactly this way.

This is what is inside that Ubuntu now:

| Thing | Version | Note |
|---|---|---|
| Ubuntu | 26.04 LTS | systemd on, default user `mehdi`, sudo without a password |
| Node.js | 24.21.0 | from NodeSource |
| npm | 11.19.0 | |
| PostgreSQL | 18.6 | role `eduflow`, databases `eduflow` and `eduflow_test` |
| Redis | 8.0.5 | |
| The repository | `~/eduflow` | inside Linux, not on `/mnt/e` |

> **Note:** the canon says PostgreSQL 16 or newer. 18.6 is inside that rule.

Keep the code in `~/eduflow`. A checkout under `/mnt/e` also works, but then every `node_modules`
read crosses the bridge between Linux and Windows, and it is slow. The Windows copy at
`E:/mysaasschool` stays where it is: you read the specs there, and the first script below is run
from there once.

## Step 1 — Install Ubuntu

Open **PowerShell as administrator** on Windows and run:

```text
wsl --install -d Ubuntu --no-launch
```

`--no-launch` installs Ubuntu without starting it, so it does not ask you to invent a Linux user
yet. The next script creates the user. Restart Windows if the installer asks for it.

## Step 2 — Prepare Ubuntu

One script does the whole machine-level setup. Run it as the Linux root user, still from
PowerShell:

```text
wsl -d Ubuntu -u root -- bash /mnt/e/mysaasschool/scripts/wsl-setup.sh
```

It is safe to run again. Every step checks before it changes anything. It ends by printing the two
database URLs, the Redis URL and the Node version.

The script expects Node.js 24, PostgreSQL and Redis to be installed in Ubuntu already. If it stops
with `pg_isready: command not found`, or `node` is missing, that install is the missing piece. Do
not guess the install commands. Open Claude Code, show it the error, let it install them, then run
this script again.

## Step 3 — Restart WSL

```text
wsl --shutdown
```

This closes Ubuntu completely. The next start reads the new `/etc/wsl.conf`, which switches
systemd on and makes `mehdi` the default user. Skip this step and you are still root, and the
services do not start by themselves.

## Step 4 — Clone the repository inside Linux

Open Ubuntu:

```text
wsl
```

You are now the user `mehdi`, in your Linux home folder. Clone the repository:

```bash
git clone https://github.com/mehdialam20002/eduflow.git ~/eduflow
cd ~/eduflow
```

GitHub asks you to sign in the first time.

## Step 5 — Bootstrap the project

```bash
bash ~/eduflow/scripts/wsl-bootstrap-project.sh
```

This is the long one. It writes your `.env`, installs the packages, creates every table, seeds the
data and runs all the gates. This is what it printed on 24 September 2026:

| Step | Result |
|---|---|
| `npm install` | 398 packages |
| Prisma migration `init` | applied, including `CREATE EXTENSION pg_trgm` |
| Seed | 4 currencies, 4 countries, 4 plans, 269 permissions, 7 system roles, 696 role grants |
| Seed | one demo organization: Bright Future Public School |
| `npm run typecheck` | no errors |
| `npm run lint` | 0 errors |
| `npm test` | 44 tests pass: 25 shared, 9 server, 10 client |
| `npm run build -w client` | 5 routes built |

The last line it prints is `Everything is ready. Start both apps with: npm run dev`.

## What the two scripts do

Nothing here is magic. This is every step, in order.

`scripts/wsl-setup.sh` — run as root, once per machine:

| It does this | Why |
|---|---|
| Starts PostgreSQL and Redis, then checks `pg_isready` and `redis-cli ping` | Nothing works until both answer |
| Creates the database role `eduflow` with `CREATEDB` | The app gets its own login, not `postgres` |
| Creates the databases `eduflow` and `eduflow_test` | Tests get a database they may wipe |
| Creates the Linux user `mehdi` in the `sudo` group, sudo without a password | Daily work is not done as root |
| Writes `/etc/wsl.conf`: systemd on, default user `mehdi`, Windows PATH off | The services survive a restart |
| Runs `systemctl enable postgresql redis-server` | Both start at boot |
| Prints the connection strings and the Node version | You copy them if you ever write `.env` by hand |

`scripts/wsl-bootstrap-project.sh` — run as `mehdi`, inside `~/eduflow`:

| It does this | Why |
|---|---|
| Starts PostgreSQL and Redis if they are down | The next steps need both |
| Copies `.env.example` to `.env` if there is none | It never touches an existing `.env` |
| Writes `DATABASE_URL`, `TEST_DATABASE_URL` and `REDIS_URL` | Your local connection strings |
| Replaces sample secrets with random ones, once | Real JWT and encryption keys, never a sample |
| Runs `npm install` | All three workspaces at once, from the root |
| Runs `prisma generate` | Builds the typed database client |
| Runs `migrate dev --name init` the first time, `migrate deploy` after | Creates or updates the tables |
| Runs `npm run db:seed` | Reference data and the demo institute |
| Runs `npm run typecheck`, `npm run lint` and `npm test` | You learn on setup day if something broke |
| Runs `npm run build -w client` | Proves the Next.js build works here |

There is a third script, `scripts/wsl-smoke-test.sh`. It starts the API and the web app, waits for
`/api/v1/health`, `/api/v1/ready` and `/login`, prints the status codes and the last log lines,
then stops both. Use it when you want a hands-off answer to "does it still run?".

## Every day: open it, start it, stop it

```bash
wsl
cd ~/eduflow
npm run dev
```

Two processes start in one terminal, each log line prefixed with its name.

| Open this in your Windows browser | You should see |
|---|---|
| <http://localhost:3000/login> | The sign-in form, tab title `Sign in \| EduFlow` |
| <http://localhost:4000/api/v1/health> | `success: true` |
| <http://localhost:4000/api/v1/ready> | `success: true`, with database, redis and queues all `up` |

WSL 2 shares `localhost` with Windows, so the same addresses work on both sides.

Stop both with `Ctrl+C`. Leave Ubuntu with `exit`. Nothing has to be shut down at night. If you
want the memory back, run `wsl --shutdown` in PowerShell.

The commands you will actually use, all from the repository root:

| Command | What it does |
|---|---|
| `npm run dev` | API and web app together |
| `npm run dev:server`, `npm run dev:client` | One side alone |
| `npm run dev:worker` | The background job worker |
| `npm run doctor` | Checks this machine and says what is broken |
| `npm run check` | Lint, typecheck and tests: your "may I merge?" button |
| `npm run lint`, `npm run lint:fix` | Code style |
| `npm run typecheck` | TypeScript only, writes nothing |
| `npm test` | All tests, on Node's own test runner |
| `npm run build -w client` | Production build of the web app. WSL only |
| `npm run db:migrate` | Apply schema changes |
| `npm run db:seed` | Reference data and the demo institute. Safe to run again |
| `npm run db:studio` | A browser table viewer for the database |
| `npm run db:reset` | Wipes the local database and rebuilds it. On purpose only |
| `npm run gen:constants` | Rebuilds `shared/src/generated/` from the specifications |
| `npm run sync:schema` | Copies the live Prisma schema into `docs/schema/` |
| `npm run check:schema-sync` | Fails if those two schemas differ |

To edit the code in VS Code:

1. Install VS Code on Windows, and the extension **WSL** published by Microsoft.
2. In VS Code press `Ctrl+Shift+P` and run **WSL: Connect to WSL**.
3. Choose **File, Open Folder**, type `/home/mehdi/eduflow`, and open it.

The window title then ends with `[WSL: Ubuntu]`. Its terminal is the Ubuntu shell, so every
command on this page works there. Do not open the project as an ordinary Windows folder through
`\\wsl$`: the extensions then run on the Windows side and the blocked binaries come back.
`/etc/wsl.conf` keeps the Windows PATH out of Ubuntu, so the `code .` shortcut may not exist. Use
the menu.

## Connection strings and the demo sign-in

The bootstrap script already wrote these into `~/eduflow/.env`. They are printed here so you can
check them, not so you retype them.

```env
DATABASE_URL=postgresql://eduflow:eduflow@127.0.0.1:5432/eduflow?schema=public
TEST_DATABASE_URL=postgresql://eduflow:eduflow@127.0.0.1:5432/eduflow_test?schema=public
REDIS_URL=redis://127.0.0.1:6379
```

The seed creates one demo institute you can sign in to:

| Field | Value |
|---|---|
| Organization | Bright Future Public School |
| Email | rajesh@brightfuture.example |
| Password | EduFlow@Local123 |

> **Warning:** these are local development values only. The database password is `eduflow` because
> that database lives inside your laptop and listens on `127.0.0.1`. Never reuse this password or
> this login on a server. `.env` is in `.gitignore`: never commit it, never paste it into a chat,
> never show it in a screen share.

## What still works on Windows

Windows is still useful. Claude Code, git, the specs in `docs/` and most of the toolchain run
there. Only the web app's compiler is out of reach.

| Task | Runs on Windows | Where to run it |
|---|---|---|
| Editing files, git, Claude Code | Yes | Either side |
| `npm run typecheck` | Yes | Either side |
| `npm run lint` | Yes | Either side |
| `npm test`, on Node's test runner | Yes | Either side |
| `npm run dev:server`, the API | Yes | Either side, if a database answers |
| Prisma: generate, migrate, seed, studio | Yes | Either side, the engines are signed |
| `npm run dev:client`, `npm run build -w client` | No | WSL only: SWC, oxide, lightningcss |
| `psql` | No | Blocked. Use `npm run db:studio` |

The simple rule: do everything in WSL. One machine, one set of results, no surprises.

## Troubleshooting

| What you see | What it means | What you do |
|---|---|---|
| The API cannot reach the database after a Windows restart | The services did not start | `sudo service postgresql start`, then `sudo service redis-server start` |
| `Failed to start the systemd user session for 'mehdi'` | A harmless WSL warning | Ignore it. The services and the commands still run |
| `npm install` stops on a network error | This connection drops large parallel downloads | Run `npm install` again. The repository's `.npmrc` holds npm to 2 sockets with long retries |
| A migration fails on a missing extension such as `pg_trgm` | The search indexes need that extension | It is declared in `server/prisma/schema/00-base.prisma`. Pull the latest `main`, then `npm run db:migrate` |
| `ERR_MODULE_NOT_FOUND` for a file you can see | The import has no file extension | Node resolves real paths here. Write `./service.ts`, `./page.tsx` |
| `npm run build -w client` fails on Windows | The native compilers are blocked | Run it inside WSL |
| `/api/v1/ready` answers 503 `SERVICE_UNAVAILABLE` | The API runs, the database does not answer | Start the services, then `npm run doctor` |
| `EADDRINUSE :::4000` | An API is already running | Close the other `npm run dev` terminal, or `wsl --shutdown` and start again |
| `psql: command not found` on Windows | Blocked by Smart App Control | Work inside WSL, or use `npm run db:studio` |
| The log says queues are disabled | `REDIS_URL` is empty | Set it to `redis://127.0.0.1:6379`, or carry on without queues |

When something is still wrong:

1. Run `npm run doctor` and read every line. Each failing line names the command that fixes it.
2. Run `git status`. An unexpected change often explains an unexpected error.
3. Run `bash ~/eduflow/scripts/wsl-smoke-test.sh` to see whether both apps answer at all.
4. Paste the failing command and the first thirty lines of its output into Claude Code. Thirty
   lines, not three thousand.

## The optional path: turn Smart App Control off

You do not have to use WSL. Switching Smart App Control off lets the blocked binaries run, and
then the client builds on Windows directly. Open **Windows Security**, then **App and browser
control**, then **Smart App Control settings**, and set it to **Off**.

> **Warning:** this is a one-way door. Windows cannot switch Smart App Control back on. The only
> way back is to reset or reinstall Windows. You would also give up a real protection, to solve a
> problem that WSL has already solved.

The recommendation is simple: leave it on, work in WSL.
