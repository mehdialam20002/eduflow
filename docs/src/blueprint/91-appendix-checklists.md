# Checklists

**In simple words:** This appendix puts every EduFlow checklist in one place, so you never search a long document at 11 pm. Each list is a small table: the item on the left, a box on the right. The thinking behind a list lives in its own chapter, named in italics. Print the three daily lists and keep them next to your laptop.

## How to use these checklists

- A checklist is a memory tool, not a plan. It holds only the steps that get forgotten under pressure.
- Tick `[x]` in the Done column. An item you cannot tick is a blocker. Write the reason beside it.
- Never soften an item to finish the list. Either the step is done, or the list is open.
- Each list names the chapter that explains why. Read that chapter once, then use the list every time.
- Change a list only after a real miss. Keep every list on one page.

## Day-one setup

Do this once on Day 1 (Monday 5 October 2026). Details are in *Local Development Setup*.

| Item | Done |
|---|---|
| `node -v` prints v24 and `npm -v` works | `[ ]` |
| Docker Desktop runs; `docker compose ps` answers | `[ ]` |
| Git installed, name and email set, GitHub SSH key added | `[ ]` |
| Claude Code installed, logged in, opened in the repo folder | `[ ]` |
| Private GitHub repo `eduflow` created, monorepo pushed (P-01) | `[ ]` |
| `CLAUDE.md` written and docs copied into `docs/` (P-02) | `[ ]` |
| PostgreSQL 16 and Redis 7 containers healthy (P-03) | `[ ]` |
| `server/.env` filled from `server/.env.example`, API starts | `[ ]` |
| Password manager holds every account password | `[ ]` |
| `FIELD_ENCRYPTION_KEY` written down in two safe offline places | `[ ]` |
| Accounts opened: Sentry, PostHog, Vercel, Railway, AWS | `[ ]` |
| Test accounts opened: Razorpay test mode, Meta developer app | `[ ]` |
| Two-factor login on GitHub, AWS, Razorpay and email | `[ ]` |
| Laptop disk encryption on, automatic cloud backup running | `[ ]` |

## Daily start

Fifteen minutes, same order every morning. The work itself comes from the daily plan chapters.

| Item | Done |
|---|---|
| `git pull` on `main`, no conflicts left behind | `[ ]` |
| `npm run services:up`, database and Redis healthy | `[ ]` |
| Yesterday's log read; the open question from it answered or parked | `[ ]` |
| Today's page in the daily plan read; the prompt IDs noted | `[ ]` |
| Sentry checked: zero new unresolved issues since last night | `[ ]` |
| Pilot WhatsApp and support inbox checked; nothing is broken | `[ ]` |
| Today's one sales action written down before coding starts | `[ ]` |
| Fresh Claude Code session started with `/clear`, one module only | `[ ]` |

## Daily shutdown

Ten minutes at the end of the build day. Never stop with uncommitted work on the laptop.

| Item | Done |
|---|---|
| Tests of the touched module pass locally | `[ ]` |
| Every change committed and the branch pushed to GitHub | `[ ]` |
| Day log written: what shipped, what broke, one open question | `[ ]` |
| Tomorrow's first prompt written and saved, ready to paste | `[ ]` |
| Two sales or customer actions of the day logged in the sheet | `[ ]` |
| Sentry and the deployed staging build still green | `[ ]` |
| Claude Code sessions closed; no half-finished plan left open | `[ ]` |

## Before every commit

Runs in under two minutes. It keeps `main` clean and keeps the diff reviewable. See *Coding Standards* and *Git Workflow*.

| Item | Done |
|---|---|
| `npm run lint` and the TypeScript check pass with no errors | `[ ]` |
| Tests of the touched module pass; no test is skipped | `[ ]` |
| `git status` shows only the files this step was meant to change | `[ ]` |
| `git diff` read line by line, not scrolled past | `[ ]` |
| No secret, key, phone number or real student name in the diff | `[ ]` |
| No leftover `console.log`, `TODO` without an ID, or commented-out block | `[ ]` |
| A schema change carries its Prisma migration in the same commit | `[ ]` |
| Commit message follows the convention, with the PRD ID in the body | `[ ]` |

## Before every merge

The fifteen-point review from *Working with Claude Code*, in tick form. Run the grep scans of that chapter first, then ask a fresh session for a second opinion.

| Item | Done |
|---|---|
| Tenant filter: every query uses the tenant-aware Prisma client | `[ ]` |
| Tenant source: `orgId` comes from the JWT, never from the request | `[ ]` |
| Permission check: every route has auth plus the right permission key | `[ ]` |
| Campus scope: lists and writes respect the user's assigned campuses | `[ ]` |
| Validation: Zod parses body, query and params, with length limits | `[ ]` |
| Envelope and error codes: canon envelope, canon codes, right status | `[ ]` |
| Money type: Decimal end to end, currency stored, no float maths | `[ ]` |
| Transactions and idempotency: money writes in one transaction | `[ ]` |
| N plus one queries: no database call inside a loop | `[ ]` |
| Indexes and pagination: index starts with `organization_id`, limit max 100 | `[ ]` |
| Schema fidelity: only fields from `docs/schema/`, migration included | `[ ]` |
| Secrets and personal data: config from the env module, clean logs | `[ ]` |
| Tests are real: real assertions, and a tenant isolation test exists | `[ ]` |
| Size and scope: small files, only the named files changed | `[ ]` |
| Soft delete and audit: reads skip `deletedAt`, sensitive actions logged | `[ ]` |
| Money code and auth code read line by line by you, not only by the reviewer | `[ ]` |

## Module definition of done

A module is done when every line is ticked. Half-done modules turn a 60-day sprint into a 90-day sprint.

| Item | Done |
|---|---|
| Every user story and acceptance criterion ID in the PRD chapter passes | `[ ]` |
| All endpoints from the registry exist with the exact paths and permissions | `[ ]` |
| Unit tests for the business rules, integration tests for the endpoints | `[ ]` |
| Tenant isolation test for this module is green | `[ ]` |
| Permission matrix wired for all seven roles; a parent cannot see other children | `[ ]` |
| Loading, empty and error states exist on every screen | `[ ]` |
| Screens usable at 360 pixels wide on a real phone browser | `[ ]` |
| Seed data covers the module for demos (P-58) | `[ ]` |
| OpenAPI docs, audit log entries and notification templates updated | `[ ]` |
| Plan gating correct: Starter, Growth, Pro and Enterprise behave as in the canon | `[ ]` |
| List screen with 500 demo rows opens in under two seconds | `[ ]` |
| You can demo the module end to end in two minutes without notes | `[ ]` |
| Merged to `main` and deployed to staging | `[ ]` |

## Weekly review

Sunday evening, 45 minutes. Full template: *Founder Operating System*.

| Item | Done |
|---|---|
| Numbers updated: signups, paying orgs, MRR, churn, activation | `[ ]` |
| Three wins and three misses written, each miss with its one cause | `[ ]` |
| Five customer conversations of the week logged with exact words | `[ ]` |
| Decisions of the week copied into the decision log | `[ ]` |
| `CLAUDE.md` updated with any mistake you corrected twice | `[ ]` |
| Sprint plan re-checked against the day number and the 3 December date | `[ ]` |
| Next week's three priorities written, everything else parked | `[ ]` |
| Health check scored: sleep, energy, focus, mood | `[ ]` |

## Release

Every deploy to production. Commands and rollback: *Deploy on Vercel and Railway*.

| Item | Done |
|---|---|
| Version bumped and `CHANGELOG.md` entry written | `[ ]` |
| Migration reviewed, additive, and reversible in one step | `[ ]` |
| Fresh database backup taken and its file size checked | `[ ]` |
| Staging smoke test passed: login, attendance, invoice, payment, receipt | `[ ]` |
| New or risky work sits behind a flag in `RELEASE_FLAGS_OFF` | `[ ]` |
| Deploy window chosen after 9 pm IST, away from the fee counter rush | `[ ]` |
| Sentry release tag set to the commit SHA | `[ ]` |
| Health endpoint, error rate and queue depth watched for 30 minutes | `[ ]` |
| Rollback plan written in one line before the deploy starts | `[ ]` |
| Release notes sent to customers if anything visible changed | `[ ]` |

## Security monthly

First working day of each month, 90 minutes.

| Item | Done |
|---|---|
| `npm audit` reviewed; high and critical findings fixed or logged | `[ ]` |
| Keys older than 90 days rotated: AWS, Razorpay, MSG91, JWT secrets | `[ ]` |
| User list reviewed; every Super Admin account still needed | `[ ]` |
| Every new table has `organization_id`, its index and its RLS policy | `[ ]` |
| Tenant isolation test suite run against staging and green | `[ ]` |
| Failed login and rate-limit spikes reviewed for one bad actor | `[ ]` |
| S3 buckets still private; no public object, no public listing | `[ ]` |
| Webhook secrets match the Razorpay and Meta dashboards | `[ ]` |
| Backup files encrypted and the restore key reachable | `[ ]` |
| Parental consent and data-deletion requests handled within the DPDP window | `[ ]` |

## Backup restore test

Once a quarter, never on the production database. Runbook: *Monitoring, Backups and Incident Response*.

| Item | Done |
|---|---|
| Latest nightly backup downloaded and its checksum verified | `[ ]` |
| Restored into a scratch database, never over a live one | `[ ]` |
| Row counts compared with production for students, invoices, payments | `[ ]` |
| Yesterday's last receipt found in the restored data | `[ ]` |
| API started against the restored database and a login worked | `[ ]` |
| One S3 file restored and opened | `[ ]` |
| Restore time measured and written down as the real recovery time | `[ ]` |
| Data loss window measured against the one-hour target | `[ ]` |
| Scratch database and downloaded copy deleted | `[ ]` |

## New customer onboarding

The first seven days after payment. Long version: *Onboarding and Customer Success Playbook*.

| Item | Done |
|---|---|
| Kickoff call done; success criteria agreed in the customer's words | `[ ]` |
| Organization created, plan and campuses set, branding uploaded | `[ ]` |
| Academic year, courses and batches created for the running session | `[ ]` |
| Students imported from Excel; counts match their register | `[ ]` |
| Fee heads and fee structures entered and checked against one real invoice | `[ ]` |
| Staff users invited with the right roles and campus scope | `[ ]` |
| WhatsApp opt-in collected and message templates approved | `[ ]` |
| First invoice run generated and the first receipt collected at the counter | `[ ]` |
| Parent invites sent, ten parents logged in, both training sessions done | `[ ]` |
| Day-seven check-in call done and the health score recorded | `[ ]` |

## Demo preparation

Ten minutes before every demo. The script is *Demo Script*.

| Item | Done |
|---|---|
| Demo tenant reseeded and both demo logins tested | `[ ]` |
| Their name, size, board or exam, and main pain written on one card | `[ ]` |
| Internet working plus a charged phone hotspot as backup | `[ ]` |
| Laptop charged, notifications off, unrelated tabs closed | `[ ]` |
| A real phone ready to show the parent WhatsApp message arriving | `[ ]` |
| Pricing sheet and proposal template open in the background | `[ ]` |
| Next-step question decided before the call starts | `[ ]` |

## Pilot success review

Run at the end of the pilot, around Day 60 (3 December 2026), for all five institutes.

| Item | Done |
|---|---|
| Each institute marked attendance on at least fifteen working days | `[ ]` |
| Each institute collected real fees through EduFlow | `[ ]` |
| WhatsApp delivery rate measured per institute | `[ ]` |
| Parent portal adoption measured against the 70 percent target | `[ ]` |
| Open bugs listed by severity; no Sev1 or Sev2 left open | `[ ]` |
| NPS question asked and the score recorded | `[ ]` |
| Feature requests ranked by how many institutes asked | `[ ]` |
| Willingness to pay asked directly, with the plan and price named | `[ ]` |
| One written testimonial and one case study collected | `[ ]` |
| Go or no-go decision written for the January 2027 paid launch | `[ ]` |

## Pre-launch master list

The short version of *Launch Checklist and Go-Live Runbook*, for the paid India launch in January 2027.

| Item | Done |
|---|---|
| Production domains live on HTTPS: app, API and tenant subdomains | `[ ]` |
| Every production environment variable set and the API starts clean | `[ ]` |
| Razorpay live keys tested with one real rupee payment and refund | `[ ]` |
| WhatsApp templates approved by Meta; DLT sender ID approved | `[ ]` |
| Nightly backup running and one restore already proven | `[ ]` |
| Sentry alerts, uptime monitor and status page live | `[ ]` |
| Terms, privacy, refund policy and consent text published | `[ ]` |
| One GST-compliant subscription invoice generated end to end | `[ ]` |
| Pricing page matches the canon prices; Starter signup works | `[ ]` |
| Support channel, hours and reply promise published | `[ ]` |
| Rollback tested once against the production build | `[ ]` |
| Twenty sales conversations booked for launch week | `[ ]` |

## Incident first fifteen minutes

| Item | Done |
|---|---|
| Minute 0 to 2: confirmed real with the health endpoint and one live login | `[ ]` |
| Minute 0 to 2: severity named, Sev1, Sev2 or Sev3 | `[ ]` |
| Minute 2 to 5: bleeding stopped by rollback or by a feature flag | `[ ]` |
| Minute 2 to 5: no restore over the production database without a snapshot | `[ ]` |
| Minute 5 to 10: status page updated, affected owners messaged | `[ ]` |
| Minute 5 to 10: money checked for duplicate payments or lost receipts | `[ ]` |
| Minute 10 to 15: evidence saved, Sentry link, logs, request IDs | `[ ]` |
| Minute 10 to 15: timeline started in IST, one line per action | `[ ]` |
| After 15 minutes: follow *Monitoring, Backups and Incident Response* | `[ ]` |

## Month-end finance

Close the month in the first week of the next one. Details in *Company Setup, Legal and Finance*.

| Item | Done |
|---|---|
| Subscription invoices raised and payment reminders sent | `[ ]` |
| Razorpay settlements reconciled against receipts to the paisa | `[ ]` |
| Bank statement reconciled and every expense categorized | `[ ]` |
| GST output and input tallied; returns filed by their due dates | `[ ]` |
| TDS deducted and deposited where it applies | `[ ]` |
| Vendor bills and contractor payments cleared | `[ ]` |
| MRR, churn, ARPA and runway months updated in the metrics sheet | `[ ]` |
| Infra and message credit bills compared with revenue | `[ ]` |

## Quarterly strategy review

| Item | Done |
|---|---|
| Paying organizations compared with the Year-1 target of 120 | `[ ]` |
| Every churn reason read in the customer's own words | `[ ]` |
| Pricing checked against wins, losses and competitor moves | `[ ]` |
| Roadmap re-ranked by what customers already pay to avoid | `[ ]` |
| CAC checked against ₹12,000 and infra cost per organization | `[ ]` |
| Hiring decision taken for the next quarter | `[ ]` |
| One big bet named, and one activity stopped | `[ ]` |

## Hiring a first employee

| Item | Done |
|---|---|
| Six months of runway remain after the new salary | `[ ]` |
| Role written in one sentence with three measurable outcomes | `[ ]` |
| Salary band checked against the local market and the budget | `[ ]` |
| Three candidates seen, each given the same paid trial task | `[ ]` |
| Offer letter, NDA and IP assignment signed before day one | `[ ]` |
| Provident fund, ESI and TDS applicability confirmed with the accountant | `[ ]` |
| Accounts created with least privilege; no shared password | `[ ]` |
| A 30-day plan and a first review date exist | `[ ]` |

## International readiness

Run before the UAE entry in Year 2 and before the USA and Australia pilots in Year 3.

| Item | Done |
|---|---|
| Entity or Stripe account able to receive that currency | `[ ]` |
| Prices taken from the canon table for USD, AUD or AED | `[ ]` |
| Tax handled: UAE VAT, Australia GST, US sales tax through Stripe Tax | `[ ]` |
| Privacy rules mapped: PDPL, Privacy Act 1988, FERPA and COPPA | `[ ]` |
| Data residency answer written for the buyer's compliance team | `[ ]` |
| Timezone, date format, currency and language pack tested (P-60) | `[ ]` |
| SMS through Twilio, email through SES, templates in the local language | `[ ]` |
| Support hours published for that timezone; one local reference customer | `[ ]` |
