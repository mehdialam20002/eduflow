export const meta = {
  name: 'eduflow-docs-update',
  description: 'Update the repository guides so they describe the WSL development setup that was verified end to end',
  phases: [{ title: 'Write', detail: 'two writers, separate files' }],
}

const REPO = 'E:/mysaasschool'
const FACTS = `WHAT WAS ACTUALLY VERIFIED TODAY (24 September 2026). Every line below was run and observed; do not soften or embellish it.

The founder's Windows 11 laptop has Smart App Control ON. It refuses unsigned binaries, which blocks:
- esbuild.exe, so Vitest and tsx cannot run
- @next/swc-win32-x64-msvc, @tailwindcss/oxide and lightningcss native modules, so the Next.js client cannot build
- psql.exe, so PostgreSQL's own command line is unusable
Prisma's engines are signed and do run on Windows. Smart App Control cannot be switched back on once it is turned off, so it was left alone.

The decision: develop inside WSL 2. This is now set up and working:
- Ubuntu 26.04 LTS installed (wsl --install -d Ubuntu --no-launch), systemd enabled, default user "mehdi" with passwordless sudo
- Node.js 24.21.0 and npm 11.19.0 from NodeSource
- PostgreSQL 18.6 with role "eduflow" (password "eduflow") and databases "eduflow" and "eduflow_test"
- Redis 8.0.5
- The repository is cloned at ~/eduflow inside Linux (not on /mnt/e, which is slow for node_modules)
- Two scripts do all of it: scripts/wsl-setup.sh (run as root, once) and scripts/wsl-bootstrap-project.sh (run as the normal user)
- A third script, scripts/wsl-smoke-test.sh, starts both apps and checks them

Verified results inside WSL:
- npm install: 398 packages
- prisma migrate dev --name init: applied, including CREATE EXTENSION pg_trgm (the schema's search indexes need it; the extension is now declared in server/prisma/schema/00-base.prisma)
- npm run db:seed: 4 currencies, 4 countries, 4 plans, 269 permissions, 7 system roles, 696 role grants, one demo organization; demo sign-in rajesh@brightfuture.example / EduFlow@Local123
- npm run typecheck: no errors
- npm run lint: 0 errors
- npm test: 44 tests pass (25 shared, 9 server, 10 client)
- npm run build -w client: 5 routes built
- npm run dev: API /api/v1/health 200; /api/v1/ready 200 with database, redis and queues all "up"; web /login 200 with the title "Sign in | EduFlow"

Toolchain changes that were needed and are now permanent in this repository:
- Tests run on Node's built-in test runner through a small Vitest-shaped harness at shared/src/testing/harness.ts. Test files import { describe, it, expect, vi } from '@eduflow/shared/testing'. There is no Vitest and no tsx in the repository.
- Dev servers run with "node --watch"; the seed runs with plain "node".
- Every relative import inside shared/, server/ and client/ carries an explicit .ts or .tsx extension, because Node resolves real file paths. tsconfig sets allowImportingTsExtensions.
- The client uses the system font stack instead of next/font (next/font needs the native SWC binary, and system fonts download nothing).
- React component tests were dropped; browser behaviour is covered by the Playwright end-to-end tests that prompt P-50 creates.
- Windows still runs: typecheck, lint, the Node test runner, the API server and Prisma. Only the client build needs WSL.

Known rough edges to record honestly:
- Opening a WSL shell sometimes prints "Failed to start the systemd user session for 'mehdi'". It is harmless: the services and the commands still run.
- PostgreSQL 18 is installed rather than 16; the canon says "PostgreSQL 16+", so this is inside the rule.
- The first "npm install" on Windows failed three times on a flaky network, so the repository carries an .npmrc with maxsockets=2 and long retry timeouts.`

const common = `You are writing for a solo founder who is about to start a 60-day build sprint. Write in the plain, simple English the EduFlow documents use: short sentences, concrete commands, no hype, no filler. Read ${REPO}/docs/style-guide.md first for the house rules. Never invent a command you have not been given; every command must come from the facts below or from package.json scripts (read ${REPO}/package.json).

${FACTS}`

phase('Write')
const results = await parallel([
  () => agent(`${common}

YOU OWN TWO FILES: ${REPO}/docs/SETUP.md and ${REPO}/docs/DAY-1.md. Read both as they are now, keep what is still true, and rewrite what is not.

SETUP.md must become the real, tested path for this machine, in numbered steps a beginner can follow:
1. A short "what you need to know" opener: Windows blocks parts of the toolchain, so development happens inside WSL 2, and this is a normal professional setup rather than a workaround.
2. One-time setup, exactly as it was done: wsl --install -d Ubuntu --no-launch; run scripts/wsl-setup.sh as root; wsl --shutdown; clone the repository inside Linux at ~/eduflow; run scripts/wsl-bootstrap-project.sh. Give the exact commands.
3. What the two scripts do, in a table, so nothing feels like magic.
4. Daily use: how to open the project (wsl, cd ~/eduflow), start both apps, the URLs, how to stop, and how to open the folder in VS Code with the WSL extension.
5. The connection strings and the demo sign-in.
6. What still works on Windows and what does not, in a table.
7. A troubleshooting table with the real problems that were hit: services not started after a restart, "Failed to start the systemd user session", flaky npm installs, a migration failing on a missing extension, and Node needing .ts import extensions.
8. The optional path: turning Smart App Control off to work on Windows directly, with the warning that it cannot be re-enabled.

DAY-1.md must be a one-page checklist for the morning of Monday 5 October 2026: verify the machine with npm run doctor and npm run dev, confirm the demo sign-in works, then start at prompt P-11 because P-01 to P-10 are already done by this scaffolding. Include the daily rhythm and the definition of done for the day. Keep it under 150 lines.

Return: the two files and a one-line summary of what changed.`, { label: 'setup-and-day-1', phase: 'Write' }),

  () => agent(`${common}

YOU OWN TWO FILES: ${REPO}/CLAUDE.md and ${REPO}/docs/tech-debt.md. Read both as they are now.

CLAUDE.md is read at the start of every Claude Code session, so it must stay under about 150 lines and must match reality. Update it so that:
- The commands section says development happens inside WSL (Ubuntu), gives the working commands, and notes that the client build only works there.
- The testing rule names Node's test runner and the harness import path, not Vitest.
- The stack section still lists the canon stack but records that tests use node:test on this machine.
- A short rule is added: relative imports carry .ts or .tsx extensions, because Node resolves real files.
- Everything else that is still true stays exactly as it is. Do not rewrite the file for the sake of it.

docs/tech-debt.md is the running list of what was left undone and why. Read its existing table and ADD rows for every deviation recorded in the facts above, each with: what, why it was left, the cost of leaving it, and when to fix it. Be honest about the cost. Include: the Vitest to node:test switch, tsx to node --watch, .ts import extensions, next/font removed, the dropped React component test, the client build needing WSL, and the .npmrc network settings. Keep the existing rows.

Return: the two files and a one-line summary of what changed.`, { label: 'claude-md-and-tech-debt', phase: 'Write' }),
])
return { results: results.map((r) => (r ? String(r).slice(0, 300) : null)) }
