# Brief for 35-launch-checklist-and-go-live-runbook.md

Title: Launch Checklist and Go-Live Runbook
Minimum words: 2400
Web research needed: no

## What this chapter must cover (every item, fully)

Everything to verify before real customers and money touch the system. Checklists as tables with columns Item | Why | How to verify | Done: product readiness (16 Phase-1 modules smoke-tested), security (tenant isolation suite green, RBAC matrix spot-check, rate limits on, secure cookies, CORS locked, headers via Helmet, secrets rotated, admin MFA, S3 private, backups tested, dependency audit), payments (Razorpay live keys, webhook signature verification, refund test, receipt numbering, reconciliation report, day-close), messaging (WhatsApp templates approved, opt-in captured, DLT templates, SES out of sandbox, unsubscribe), legal (Terms, Privacy Policy, DPA, refund policy, parental consent flow, cookie notice), operations (monitoring + alerts live, status page, support WhatsApp number, help articles, onboarding Excel templates, demo organization), business (pricing page, invoices with GST, billing flow for subscriptions, CRM ready). Pilot runbook (Day 45–60: selecting 5 pilots, onboarding day agenda, daily check-in, success criteria, feedback log, bug triage). Go-live day runbook hour by hour (T-7 days, T-1 day, launch day, T+1, T+7) with rollback triggers. First-customer onboarding checklist. Post-launch 30-day plan. Mermaid flowchart or gantt of the launch sequence.
