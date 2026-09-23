# EduFlow

Multi-tenant SaaS ERP for schools and coaching institutes. India first, then UAE, USA and Australia.

This repository currently holds the **specifications** that the application is built from. The
application code (`client/`, `server/`, `shared/`) is added during the 60-day build sprint that
starts on Monday 5 October 2026.

## What is in here

| Path | What it holds |
|---|---|
| `docs/src/_canon.md` | The single source of truth: product facts, the 34 modules and their release phases, the seven roles, pricing, dates, business targets and the technology stack. Every other document must agree with it. |
| `docs/src/_style-guide.md` | Writing and Markdown rules for every chapter, plus the module chapter template. |
| `docs/src/_shared-index.md` | Exact PRD chapter file names, the 60 Claude Code prompt IDs and the 60-day sprint skeleton. |
| `docs/src/_schema/` | The complete PostgreSQL data model as a multi-file Prisma schema (189 models, 186 enums), validated with `prisma validate`. Copy it to `server/prisma/schema/`. |
| `docs/src/_api/` | The REST endpoint registry: 1,250 endpoints with IDs, methods, paths and permission keys. |
| `docs/src/_permissions.md` | 269 permission keys across the seven roles, plus custom role presets. |
| `docs/src/brd/` | Business Requirements Document chapters — why we build EduFlow, for whom, the market, pricing, go-to-market and the five-year plan. |
| `docs/src/prd/` | Product Requirements Document chapters — architecture, all 34 modules with screens, database, APIs and security. |
| `docs/src/blueprint/` | Founder Blueprint chapters — the 60-day plan, 60 Claude Code prompts, engineering handbook, deployment, sales playbook and scaling. |
| `docs/src/costguide/` | Founder Cost and Spending Guide chapters — what to spend, when, with minimum, recommended and maximum budgets. |
| `docs/build/` | The documentation build system: Markdown to styled A4 PDF. |

## Building the PDFs

```bash
cd docs/build
npm install
node build.mjs all          # or: brd | prd | blueprint | costguide
```

Each document is written to the repository root as a PDF with a cover page, document control,
a clickable table of contents with page numbers, nested bookmarks, and rendered diagrams.
PDFs are not committed; build them locally or download them from the releases page.

## Checks

```bash
node docs/build/check-md.mjs docs/src/prd/25-fees-module.md   # lint one chapter
python docs/build/check_canon.py                              # cross-document consistency
python docs/build/status.py                                   # which chapters are done
cd docs/build && npx prisma validate --schema ../src/_schema   # validate the data model
```

## Using these specs with Claude Code

The specifications are written to be read by Claude Code. A prompt names the exact files it must
read first, for example:

```
Read docs/src/_canon.md and docs/src/prd/25-fees-module.md, then implement FEE-API-01 to FEE-API-12.
```

The 60 ready-made prompts are in `docs/src/blueprint/1*-prompts-*.md`.

---

Confidential. Do not share outside the founding team without permission.
