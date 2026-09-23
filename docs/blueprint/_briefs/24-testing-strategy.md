# Brief for 24-testing-strategy.md

Title: Testing Strategy for a Solo Founder
Minimum words: 2600
Web research needed: no

## What this chapter must cover (every item, fully)

What to test and what to skip when time is short. Test pyramid adapted: unit tests for money math and business rules, integration tests (Vitest + Supertest against a real test PostgreSQL) for every API in auth, tenancy, fees, payments; end-to-end (Playwright) for 8 critical flows (signup/onboarding, login+RBAC, add student, mark attendance, create invoice, collect fee + receipt, online payment, parent sees receipt). The mandatory tenant-isolation test suite (create two organizations; prove org A can never read or write org B through every module — code example). Test data factories and seeding. Testing webhooks and idempotency. Testing BullMQ jobs. Coverage targets by area (money and auth 90%, other services 70%, UI smoke). Example test files in TypeScript (one service unit test for late-fee calculation, one API integration test for POST /payments, one Playwright test for collect fee). CI integration (run on every PR, block merge on fail). Manual QA checklist before each release, UAT with pilot institutes (script and feedback form), bug severity levels and triage, regression list, load test basics with k6 (target: 200 concurrent users, p95 under 500 ms) and when to do it.
