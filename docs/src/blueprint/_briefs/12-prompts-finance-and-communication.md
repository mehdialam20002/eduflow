# Brief for 12-prompts-finance-and-communication.md

Title: Prompts: Finance and Communication
Minimum words: 5000
Web research needed: no

## What this chapter must cover (every item, fully)

This chapter of the Claude Code Prompt Library contains prompts P-23 to P-32 — use the exact IDs and titles from the shared index. Start with a short intro (what these prompts build, the order to run them, which day of the 60-day plan uses them) and a table (ID | Prompt | Reads these docs | Builds | Typical time).

For EACH prompt write an H2 "P-xx — <title>" with:
1. **When to use** (one or two lines, with the sprint day or phase) and **Before you start** (pre-conditions: which earlier prompts must be done, env or accounts needed).
2. **The prompt** in a `text` code fence, ready to copy and paste into Claude Code. It must follow the anatomy from the *Working with Claude Code* chapter: CONTEXT (exact files to read first, for example docs/canon.md, docs/prd/<file>.md from the shared index, docs/schema/<file>.prisma, docs/api/<registry file>, docs/permissions.md), TASK (precise scope with PRD IDs such as FEE-API-01 to FEE-API-12 and screen IDs — open the registry files in `E:/mysaasschool/docs/src/_api/` and the schema README to use REAL endpoint IDs, paths, model names and permission keys), CONSTRAINTS (tenant scoping through the Prisma extension, requirePermission on every route, Zod validation from shared/, response envelope, error codes, transactions for money, no new tables or fields outside the schema, folder structure from the Blueprint, tests required), FILES to create or change (paths in the client/, server/, shared/ structure), ACCEPTANCE CHECKS (commands to run and behaviours to verify), and REPORT BACK (what Claude must summarise). Lines inside the fence at most 76 characters, plain ASCII (write Rs instead of the rupee sign). Each prompt should be 35–70 lines: specific, not generic.
3. **Follow-up prompts** — two or three short prompts in `text` fences for the usual next steps (fix failing tests, add the missing edge case, polish the UI).
4. **Review checklist** — 6–10 checks the founder does before committing (what to click, what to query, what must never happen — for example data of another organization appearing).
5. **Common mistakes Claude makes here and how to correct them** — a small table (Mistake | Fix prompt).

Write the chapter in several steps (a few prompts per step) so that nothing is cut off. Every prompt in the range must be present and complete.
