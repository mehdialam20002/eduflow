# Brief for 13-student-admission-module.md

Title: Student Admission Module
Minimum words: 4500
Web research needed: no

## What this chapter must cover (every item, fully)

This is the PRD chapter for the **Student Admission** module (code ADM). Use EXACTLY the module chapter template in the style guide (all H2 sections, in that order) and the ID formats from the canon (ADM-S01, ADM-US-01, ADM-BR-01, ADM-AC-01, ADM-API-01).

Sources you must read before writing:
- The endpoint registry section for ADM in `E:/mysaasschool/docs/src/_api/01-platform-people.md` — use those exact endpoint IDs, methods, paths and permission keys. Document EVERY endpoint of this module in the summary table, and give full request + success response + error table for at least the 8 most important ones (all of them if the module has 10 or fewer).
- The Prisma models of this module: look them up in `E:/mysaasschool/docs/src/_schema/README.md`, then open the relevant schema files (04-people) and copy the models and enums EXACTLY into the "Prisma Schema" section (you may shorten long back-relation lists with a comment line, but never rename or invent fields). The "Database Schema" tables must match those models.
- The permission rows for this module in `E:/mysaasschool/docs/src/_permissions.md` — copy the same Yes/No/Own/Campus/View values into the "Permissions" section.

Domain focus for this module: Inquiry/lead CRM (sources, stages, follow-ups with reminders, counsellor assignment), public online application form link and QR, application fee, document checklist, optional entrance test/interview, approval and seat availability by batch, waitlist, rejection with reason, conversion to student in one transaction (creates Student, Guardian links, Enrollment, fee assignment, user invitations), admission number from NumberSequence, duplicate detection (same phone/name/DOB), admission funnel report, re-admission of a past student.

Depth targets: 8–15 user stories; 1–2 workflow diagrams (mermaid) plus a status lifecycle table where the module has statuses; 3–5 ASCII wireframes (desktop 76 chars wide; mobile ones about 38 wide where parents, students or teachers use a phone) each with caption and notes; validation table with the exact error messages; numbered business rules with worked examples for every calculation; 10–20 acceptance criteria in Given/When/Then form; 8–15 edge cases; a small erDiagram (max 8 entities); notifications and events table; reports; non-functional notes (performance target, caching, background jobs, audit logging, plan limits, i18n); 8–12 test scenarios. Use the canon sample data (Bright Future Public School, Sharma Classes, Aarav Sharma ...). JSON examples must use the canon response envelope and realistic UUIDs, dates and amounts.

Write the chapter in three or four steps (Write the first sections, then append with Edit) so nothing is cut off. The last section must be "## Test Scenarios".
