# Brief for 64-non-functional-requirements.md

Title: Non-Functional Requirements
Minimum words: 3000
Web research needed: no

## What this chapter must cover (every item, fully)

Measurable targets, each with an ID (NFR-01 onwards), target, how it is measured and phase: performance (p95 API latency by endpoint class, page load LCP on 4G, attendance submit under 1 s, report generation limits, PDF job times), scalability (tenants, students, concurrent users by scaling stage; peak patterns at 9–10 am and fee due dates), availability and SLA by plan (99.5% at launch, 99.9% target; maintenance windows), reliability (error budgets, job success rates, zero lost payments), data integrity (financial invariants that must always hold — list them), security and privacy pointers, usability (task-time targets such as mark attendance in 30 seconds, collect a fee in 45 seconds, onboarding in one day), accessibility, compatibility (browsers, Android/iOS versions, screen sizes, low-end devices, printers for receipts, barcode scanners), offline tolerance and poor-network behaviour, localisation, maintainability (code standards, test coverage, documentation), observability (logs, metrics, traces, dashboards, alert rules), supportability (impersonation, diagnostics, feature flags), capacity planning table, data limits per plan (storage, file sizes, import sizes, API rate), compliance, and cost efficiency targets (infra cost per tenant).
