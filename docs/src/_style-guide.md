# EduFlow Documentation Style Guide (mandatory for every chapter)

## 1. Voice — "easy language"

The reader is a first-time founder. English is his second language. Write so he understands every line on first read.

- Short sentences (aim for under 20 words). One idea per sentence. Active voice. Plain words ("use", not "utilize").
- Explain every technical or business term the first time it appears, in brackets, in one short line. Example: "MRR (monthly recurring revenue — the subscription money that comes in every month)".
- Be concrete. Prefer real examples, numbers, names, sample data and step-by-step lists over abstract statements. Use the canon's sample names (Bright Future Public School, Sharma Classes, Aarav Sharma ...).
- No filler, no hype, no repeated introductions, no "In today's fast-paced world". Do not summarize when you can specify. Do not write "etc." — list the items.
- This is an implementation-grade document. Depth matters more than brevity. Never write "details to be decided" — decide, and explain why in one line.
- Indian context first (₹, lakh/crore, UPI, WhatsApp, GST), then global where relevant.

## 2. Markdown rules (the PDF builder depends on these)

- The file starts with exactly ONE `# Chapter Title` line. No other `#` H1 in the file. Use `##`, `###`, `####` below it.
- NEVER put numbers in headings ("## 3.1 Pricing" is wrong; "## Pricing" is right). The builder numbers chapters and sections automatically.
- Refer to other chapters by their title in italics (for example: see *Fees* module chapter). Never by chapter number or page number.
- Right after the H1, write a short paragraph that begins with **In simple words:** and says in 2–4 sentences what this chapter covers and why it matters.
- No raw HTML. No emojis. No images. No footnotes. No links except in a final "Sources" list (plain text source name + year + URL if verified).
- Tables: GitHub pipe tables. At most 8 columns. Keep cells short (under ~18 words). Escape a literal pipe as `\|`. For feature or permission matrices use exactly the cell words `Yes`, `No`, `Partial`, `Own`, `Campus`, `View`, `Add-on` (the builder colours them).
- Callouts are blockquotes that start with a bold label. Allowed labels: `> **Note:**`, `> **Tip:**`, `> **Warning:**`, `> **Best practice:**`, `> **Example:**`, `> **Founder note:**`, `> **Rule:**`.
- Code fences MUST have a language: `text` (wireframes and ASCII diagrams), `mermaid`, `prisma`, `json`, `http`, `typescript`, `tsx`, `bash`, `sql`, `yaml`, `dockerfile`, `env`, `markdown`, `csv`. Keep code lines under 100 characters.
- End BRD and Blueprint chapters with `## Key takeaways` (4–7 bullets). PRD module chapters do not need it.

## 3. Wireframes (ASCII)

- Use a `text` fence. Plain ASCII only: `+ - | = [ ] ( ) < > / \ * # : . , _ ' " v ^`. No Unicode box characters, no ₹ symbol inside wireframes (write `Rs`), no tabs.
- Maximum width 76 characters. Height 12–32 lines. Every row must start and end cleanly so the box edges line up.
- Show a realistic screen: app header, sidebar or tabs, filters, table or form with sample data, primary buttons in `[Square Brackets]`, dropdowns as `[Value v]`, checkboxes `[x]`, radio `(o)`, inputs `[__________]`.
- Put a bold caption line BEFORE the fence: `**Screen FEE-S02 — Collect Fee (Accountant, web)**`. After the fence add a short bullet list: what the user sees, what each main button does, and which API it calls.
- Mobile screens (parent/student/teacher app views) are narrow boxes, about 38 characters wide.

Example:

**Screen FEE-S02 — Collect Fee (Accountant, web)**

```text
+--------------------------------------------------------------------------+
| EduFlow | Bright Future Public School      [Search students...]  (SG) v |
+------------+-------------------------------------------------------------+
| Dashboard  | Fees > Collect Fee                                          |
| Students   +-------------------------------------------------------------+
| Attendance | Student: [Aarav Sharma - BF-2027-0142 v]   Class: 10-A      |
| Fees     < | Pending invoices                                            |
|  Collect   | [x] INV-0912  Tuition Q2      Due 10 Jul   Rs 12,000        |
|  Invoices  | [ ] INV-0977  Transport Q2    Due 10 Jul   Rs  3,000        |
|  Reports   |-------------------------------------------------------------|
| Exams      | Amount [ 12000 ]  Mode (o) Cash ( ) UPI ( ) Card ( ) Cheque |
| Settings   | Discount [ None v ]   Late fee: Rs 0   Note [_____________] |
|            |                          [Cancel]  [Collect & Print Receipt]|
+------------+-------------------------------------------------------------+
```

## 4. Mermaid diagrams

- Allowed types: `flowchart TD` (preferred) or `flowchart LR`, `sequenceDiagram`, `erDiagram`, `stateDiagram-v2`, `gantt`, `pie`, `journey`, `quadrantChart`, `timeline`, `mindmap`.
- The page is portrait A4 (about 700 px wide). Keep diagrams narrow: at most 12–14 nodes, at most 4 nodes side by side. Prefer TD for flows. Split big diagrams into several small ones. ER diagrams: at most 8 entities per diagram, at most 8 attributes per entity.
- ALWAYS quote labels that contain anything other than letters, digits and spaces: `A["Collect fee (UPI / cash)"]`, `B{"Paid in full?"}`, edge labels `-- "yes" -->`. Never use the word `end` as a node id. Use `<br/>` only inside quoted flowchart labels for line breaks.
- erDiagram: entity names in UPPER_SNAKE (`FEE_INVOICE`), attribute lines `type name` with optional `PK`, `FK`, `UK` (`uuid id PK`), no spaces or special characters in types or names, relationship labels in quotes if more than one word.
- sequenceDiagram: declare `participant` lines with short aliases (`participant API as Express API`). Avoid semicolons and `#` inside messages.
- Add a one-line bold caption before each diagram (for example `**Figure: Fee payment flow (online)**`) and 1–3 sentences after it that explain it in plain words.

## 5. Mandatory self-check before you finish

Run the linter on your file and fix every ERROR (and WARNs where reasonable), then re-run until clean:

```bash
node E:/mysaasschool/docs/build/check-md.mjs "E:/mysaasschool/docs/src/<doc>/<your-file>.md"
```

It checks: single H1, no numbered headings, fenced code languages, wireframe width and ASCII, table column counts, raw HTML, emojis, and it really renders every Mermaid diagram in a headless browser.

## 6. PRD module chapter template (all 34 module chapters use exactly these H2 sections, in this order)

```markdown
# <Module name> Module

**In simple words:** ...

| Item | Value |
|---|---|
| Module code | FEE |
| Release phase | Phase 1 (MVP) |
| Plans | Starter (limited), Growth, Pro, Enterprise |
| Main users | Accountant, Organization Admin, Parent |
| Depends on | Student Profile, Batch, Settings |
| Main tables | fee_heads, fee_structures, ... |

## Objective
## Scope
   (In scope / Out of scope / Phase notes)
## User Stories
   (table: ID | As a | I want to | So that | Priority (Must/Should/Could))  — 8 to 15 stories
## Workflow
   (1–2 mermaid flowcharts or state diagrams + numbered step explanation; status lifecycle table)
## Screens and Wireframes
   (screen list table: ID | Screen | Users | Purpose; then 3–5 ASCII wireframes with caption + notes; include at least one mobile view where parents/students/teachers use it)
## UI Components
   (table: Component | Type | Behaviour; reusable shadcn/ui pieces, states: loading, empty, error)
## Validation Rules
   (table: Field | Rule | Error message shown to user)
## Business Rules
   (numbered rules with IDs FEE-BR-01 ...; calculations with worked examples)
## Acceptance Criteria
   (table or Given/When/Then list with IDs FEE-AC-01 ...; 10 to 20 criteria)
## Edge Cases
   (table: Case | What happens | How the system handles it; 8 to 15 cases)
## Database Schema
   (table list with purpose; per table: column table Column | Type | Null | Default | Notes incl. PK/FK; indexes and constraints list; small erDiagram of this module's tables)
## Prisma Schema
   (copy the module's models and enums from docs/src/_schema/ exactly)
## API Endpoints
   (summary table: ID | Method | Path | Permission | Purpose — from the registry; then for EACH endpoint or each important one: request example (http + json), success response (json), error responses table Status | Code | When)
## Permissions
   (matrix: Permission key × 7 roles with Yes/No/Own/Campus/View)
## Notifications and Events
   (table: Event | Trigger | Channel (In-app/WhatsApp/SMS/Email) | Recipient | Template text)
## Reports and Exports
## Non-Functional Notes
   (performance targets, audit logging, caching, background jobs, plan limits, i18n notes)
## Test Scenarios
   (table: ID | Scenario | Steps | Expected result; 8 to 12 rows)
```
