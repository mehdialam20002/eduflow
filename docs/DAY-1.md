# Day 1 — Monday, 5 October 2026

One page. Print it or keep it open. Today's goal is not a finished feature. The goal is a machine
that runs the whole stack, and prompt P-11 started with a plan you approved.

All work happens inside WSL. If `docs/SETUP.md` is not done yet, do it first.

## Verify the machine

Open the project:

```bash
wsl
cd ~/eduflow
```

Then work down this list. About twenty minutes.

| # | Check | Command or action | It is right when |
|---|---|---|---|
| 1 | Services are up | `pg_isready` and `redis-cli ping` | `accepting connections` and `PONG` |
| 2 | Machine health | `npm run doctor` | Every required line passes |
| 3 | Quality gate | `npm run check` | Lint, typecheck and 44 tests all pass |
| 4 | Both apps start | `npm run dev` | API and web start in one terminal |
| 5 | API alive | <http://localhost:4000/api/v1/health> | `success: true` |
| 6 | API ready | <http://localhost:4000/api/v1/ready> | database, redis and queues all `up` |
| 7 | Sign-in page | <http://localhost:3000/login> | The form loads, tab says `Sign in \| EduFlow` |
| 8 | Demo sign-in | rajesh@brightfuture.example / EduFlow@Local123 | You land inside the app |
| 9 | Git is clean | `git status` | No `.env`, no `node_modules` |
| 10 | Claude reads the rules | Ask a new session for the multi-tenancy rules | It answers from `CLAUDE.md` |

Checks 1 and 4 to 7 also run hands-off: `bash ~/eduflow/scripts/wsl-smoke-test.sh`. It starts both
apps, prints the status codes, then stops them.

If a check fails, fix it now. A broken check at 08:00 costs ten minutes. The same check at 16:00
costs the day.

Two housekeeping jobs while you are here:

- Commit the first migration folder under `server/prisma/schema/migrations/` if it is not in git
  yet. It was created inside WSL by the bootstrap script.
- Fix `TD-004` in `docs/tech-debt.md`: three lines in `.gitignore`, so that `.claude/commands/` is
  committed. Without it your slash commands live on this laptop only.

## What the scaffolding already gave you

The repository was scaffolded before today, so prompts P-01 to P-10 are mostly in place: the
monorepo and tooling (P-01), `CLAUDE.md` and the specs in `docs/` (P-02), the environment
configuration (P-03), the Prisma schema and seed (P-04), the Express skeleton with the response
envelope and the error handler (P-05), the tenant context and the Prisma extension (P-06), the JWT
verification middleware (P-07), `requirePermission` (P-08), the Next.js app shell (P-09) and the
UI kit (P-10). That is why today starts at **P-11**, not at P-01.

Four things were deliberately not finished, because they need a live database or belong to a
module prompt. Check each one in the first half hour. If it is missing, that prompt comes before
P-11 and is still a Day 1 or Day 2 job.

| Carry-over | How to check | Prompt |
|---|---|---|
| The first migration is committed | `server/prisma/schema/migrations/` is in `git status` as tracked | P-04 |
| Row-Level Security and the isolation tests | `grep -rl "ENABLE ROW LEVEL SECURITY" server/prisma` | P-06 |
| Login, refresh, logout, OTP routes | Read `server/src/modules/`, or sign in on the demo account | P-07 |
| The roles API and campus scoping endpoints | Read `server/src/routes/index.ts` | P-08 |

P-11 builds signup and the onboarding wizard, so it needs login to exist. Do not start it on a
stub.

## The first prompt: P-11

`docs/blueprint/11-prompts-core-modules-phase-1.md`, section **P-11 — Organizations module with
onboarding wizard and plan limits**. It is the first module a paying customer touches, so it is
the right place to start.

```bash
git switch main
git pull
git switch -c feat/p11-organizations
```

Then, in a fresh Claude Code session:

1. `/clear`, so nothing from the setup leaks in.
2. `Shift+Tab` for plan mode. Nothing is written until you approve.
3. Paste the P-11 prompt exactly as the library has it.
4. Read the plan against `docs/prd/11-organizations-module.md` and
   `docs/api/01-platform-people.md`. Endpoint IDs, permission keys and plan limits must match.
   Correct the plan in chat until it does.
5. Approve one step at a time. After each step: lint, typecheck, module tests, read the diff with
   `/review-diff`, then one commit.

Useful today: `/new-module organizations 11-organizations-module.md`,
`/review-diff organizations`, `/security-check server/src/modules/organizations`,
`/spec-check organizations 11-organizations-module.md`, `/daily-log P-11 organizations`.

Two toolchain habits that are new in this repository. Tell Claude if it forgets them:

- Tests import from `@eduflow/shared/testing`, not from Vitest. There is no Vitest here.
- Every relative import carries its file extension: `./service.ts`, `./page.tsx`.

## The rhythm of the day

| Time | Block | What happens |
|---|---|---|
| 07:30–10:30 | Build one | The checks above, then P-11 in plan mode, plan review, first steps |
| 11:00–13:00 | Sales | The EduFlow Leads sheet: ten institutes you already have a contact at |
| 14:00–17:00 | Build two | Follow-up steps, tests, manual check, merge if it is green |
| 17:00–17:30 | Review | `/daily-log`, move the card, read tomorrow's page |

Five rules that hold all sprint:

1. One prompt, one branch, one pull request.
2. Plan before code, always. `/clear` between two prompts.
3. `main` is green every evening. If it is not green by 17:00, do not merge.
4. The spec wins. If the code and `docs/prd/` disagree, the code is wrong.
5. No temporary shortcuts in tenancy or auth. A temporary hole becomes a permanent one.

## Done for the day when

- [ ] Every check above passes, and `npm run dev` runs the whole stack inside WSL.
- [ ] The first migration and the `.gitignore` fix are committed.
- [ ] Every carry-over is either confirmed present or has a branch of its own.
- [ ] P-11 has an approved plan, and at least the first step is committed and green.
- [ ] Every commit today reads like `feat(organizations): ...` — Conventional Commits, one scope.
- [ ] `docs/progress.md` has today's handoff note with the next three steps.
- [ ] Any shortcut you took has a row in `docs/tech-debt.md`.
- [ ] The leads sheet has ten rows, and WhatsApp Business is installed on the work number.

## If you are behind

Cut in this order, and write what you cut in `docs/tech-debt.md`:

1. Cut the client screens of P-11. The API plus tests is still a good day.
2. Cut the sales block to thirty minutes, but never to zero. Day 8 is the first calling day.
3. Cut styling and polish. Never cut a tenant-isolation test or a permission check.
4. Do not merge a red branch to save the evening. Leave it open and start there tomorrow.

Tomorrow's page: `docs/blueprint/04-daily-plan-days-1-to-14.md`. The dates in that chapter follow
the original plan, where Day 1 is the monorepo skeleton. The scaffolding did that work already, so
you are running ahead. Keep the order of the prompts, not the calendar next to them.
