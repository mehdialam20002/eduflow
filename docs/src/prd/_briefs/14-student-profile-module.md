# Brief for 14-student-profile-module.md

Title: Student Profile Module
Minimum words: 4500
Web research needed: no

## What this chapter must cover (every item, fully)

This is the PRD chapter for the **Student Profile** module (code STU). Use EXACTLY the module chapter template in the style guide (all H2 sections, in that order) and the ID formats from the canon (STU-S01, STU-US-01, STU-BR-01, STU-AC-01, STU-API-01).

Sources you must read before writing:
- The endpoint registry section for STU in `E:/mysaasschool/docs/src/_api/01-platform-people.md` — use those exact endpoint IDs, methods, paths and permission keys. Document EVERY endpoint of this module in the summary table, and give full request + success response + error table for at least the 8 most important ones (all of them if the module has 10 or fewer).
- The Prisma models of this module: look them up in `E:/mysaasschool/docs/src/_schema/README.md`, then open the relevant schema files (04-people) and copy the models and enums EXACTLY into the "Prisma Schema" section (you may shorten long back-relation lists with a comment line, but never rename or invent fields). The "Database Schema" tables must match those models.
- The permission rows for this module in `E:/mysaasschool/docs/src/_permissions.md` — copy the same Yes/No/Own/Campus/View values into the "Permissions" section.

Domain focus for this module: Complete student record: personal details, guardians with relation and primary flag, sibling linking, documents, medical notes, previous school, custom fields, photo. Status lifecycle (active, inactive, alumni, transferred, dropped) with StudentStatusHistory. Profile tabs that pull from other modules (attendance, fees, exams, homework, documents, notes, timeline). Bulk import from Excel with row-level error report (ImportJob), bulk update, ID card generation, promotion and batch transfer entry points, search and filters, privacy controls and per-student data export for DPDP/GDPR requests.

Depth targets: 8–15 user stories; 1–2 workflow diagrams (mermaid) plus a status lifecycle table where the module has statuses; 3–5 ASCII wireframes (desktop 76 chars wide; mobile ones about 38 wide where parents, students or teachers use a phone) each with caption and notes; validation table with the exact error messages; numbered business rules with worked examples for every calculation; 10–20 acceptance criteria in Given/When/Then form; 8–15 edge cases; a small erDiagram (max 8 entities); notifications and events table; reports; non-functional notes (performance target, caching, background jobs, audit logging, plan limits, i18n); 8–12 test scenarios. Use the canon sample data (Bright Future Public School, Sharma Classes, Aarav Sharma ...). JSON examples must use the canon response envelope and realistic UUIDs, dates and amounts.

Write the chapter in three or four steps (Write the first sections, then append with Edit) so nothing is cut off. The last section must be "## Test Scenarios".
