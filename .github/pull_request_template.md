<!-- The PR title becomes the squash commit on main. Use Conventional Commits:
     feat(fees): add invoice generation and late fee rules -->

## Summary

<!-- Two to four lines. What changed and why. Write it for yourself in six months. -->

## Type of change

- [ ] feat — new behaviour for users
- [ ] fix — bug fix
- [ ] hotfix — urgent production fix (link the incident note)
- [ ] refactor or perf — no behaviour change
- [ ] chore, build, ci, docs or test

## PRD IDs covered

<!-- Exact IDs from docs/prd/ and docs/api/, for example FEE-API-03, FEE-US-05, FEE-AC-07. -->

- Endpoints:
- User stories and acceptance criteria:
- Business rules:
- Left for the next slice:

## Screenshots or recording

<!-- UI change: before and after, desktop plus one mobile width (390 px). Seed data only
     (Bright Future Public School, Aarav Sharma). Never real student or parent data.
     API-only change: write "No UI". -->

## Test evidence

<!-- Paste real output. "Tests pass" is not evidence. -->

- `npm run lint`:
- `npm run typecheck`:
- `npm run test`:
- New or changed tests:
- Manual test steps (role, screen, result):

## Risk level

- [ ] Low — docs, copy text, styling or tests only
- [ ] Medium — normal module code
- [ ] High — money, auth, RBAC, tenancy, a data-changing migration, or a webhook

High risk means a second review in a fresh Claude Code session (`/security-check`) before merging.

## Checklist

- [ ] Tenant scope: every query uses the tenant-aware Prisma client. No `organizationId` from
      body, query or params. Isolation test added or updated.
- [ ] Campus scope: lists and writes respect assigned campuses and `X-Campus-Id`.
- [ ] Permissions: every new route has `authenticate` plus `requirePermission` with the key from
      `docs/api/`. The UI hides what the role cannot do.
- [ ] Validation: Zod parses body, query and params. Strings and arrays have limits. Schemas used
      by both sides live in `shared/`.
- [ ] Envelope and errors: canon response envelope and canon error codes only.
- [ ] Money: Decimal with a currency, writes in one transaction, `Idempotency-Key` honoured on
      payment POSTs. (Write N/A if there is no money code.)
- [ ] Migrations: the schema change has a migration, no applied migration was edited, and
      `npm run check:schema-sync` passes.
- [ ] Generated files: `shared/src/generated/` was regenerated, not hand-edited.
- [ ] Tests: new code has tests. No `it.skip`. Money, auth and permission code is covered.
- [ ] Docs: OpenAPI, `CLAUDE.md`, `.env.example` and `docs/tech-debt.md` updated where needed.
- [ ] Secrets and personal data: no keys in code, no personal data in logs, no real data in
      screenshots.
- [ ] Scope: only the files of this task changed. No surprise dependency.

## Migration and deploy notes

<!-- Write "None", or: the migration name, whether the code now in production still works with
     the new schema, new environment variables, backfill, and the order of the steps. -->

## Rollback plan

<!-- Usually "Revert this PR". With a migration: say why the old code still works with the
     new schema. -->

## Review log

- PR opened (date and time):
- Self-review done (date and time):
- Second reviewer (fresh session, `/review-diff`): PASS or FAIL
- Findings fixed in commit:
