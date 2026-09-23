# Shared Index — file names and IDs that all three documents must use consistently

## 1. How the founder uses these documents inside the code repository

The Markdown sources of the PRD are also the working specs for Claude Code. The founder copies them into the EduFlow code repository like this:

| In the code repo | Comes from | Purpose |
|---|---|---|
| `docs/canon.md` | `_canon.md` | Fixed product facts and conventions |
| `docs/prd/<file>.md` | PRD chapter files listed below | One spec file per module / topic |
| `docs/schema/*.prisma` | `_schema/*.prisma` | Validated multi-file Prisma schema (copied to `server/prisma/schema/`) |
| `docs/api/*.md` | `_api/*.md` | Endpoint registry (IDs, methods, paths, permissions) |
| `docs/permissions.md` | `_permissions.md` | Permission keys × roles matrix |

So a Claude Code prompt can say: "Read `docs/canon.md` and `docs/prd/25-fees-module.md`, then implement FEE-API-01 to FEE-API-08".

## 2. PRD chapter files (exact names)

| File | Chapter title |
|---|---|
| `01-introduction-and-product-overview.md` | Introduction and Product Overview |
| `02-users-roles-and-key-journeys.md` | Users, Roles and Key Journeys |
| `03-release-plan-and-plan-gating.md` | Release Plan and Plan Gating |
| `04-system-architecture.md` | System Architecture |
| `05-multi-tenancy-and-data-isolation.md` | Multi-Tenancy and Data Isolation |
| `06-authentication-and-sessions.md` | Authentication and Sessions |
| `07-rbac-and-permissions-matrix.md` | RBAC and Permissions Matrix |
| `08-design-system-and-ux-guidelines.md` | Design System and UX Guidelines |
| `10-dashboard-module.md` | Dashboard Module |
| `11-organizations-module.md` | Organizations Module |
| `12-multi-campus-module.md` | Multi Campus Module |
| `13-student-admission-module.md` | Student Admission Module |
| `14-student-profile-module.md` | Student Profile Module |
| `15-teachers-module.md` | Teachers Module |
| `16-staff-module.md` | Staff Module |
| `17-attendance-module.md` | Attendance Module |
| `18-leave-module.md` | Leave Module |
| `19-batch-module.md` | Batch Module |
| `20-timetable-module.md` | Timetable Module |
| `21-subjects-module.md` | Subjects Module |
| `22-homework-module.md` | Homework Module |
| `23-exams-module.md` | Exams Module |
| `24-report-cards-module.md` | Report Cards Module |
| `25-fees-module.md` | Fees Module |
| `26-payments-module.md` | Payments Module |
| `27-discounts-module.md` | Discounts Module |
| `28-scholarships-module.md` | Scholarships Module |
| `29-parent-portal-module.md` | Parent Portal Module |
| `30-student-portal-module.md` | Student Portal Module |
| `31-notifications-module.md` | Notifications Module |
| `32-whatsapp-module.md` | WhatsApp Module |
| `33-email-module.md` | Email Module |
| `34-sms-module.md` | SMS Module |
| `35-library-module.md` | Library Module |
| `36-inventory-module.md` | Inventory Module |
| `37-transport-module.md` | Transport Module |
| `38-hostel-module.md` | Hostel Module |
| `39-payroll-module.md` | Payroll Module |
| `40-certificates-module.md` | Certificates Module |
| `41-analytics-module.md` | Analytics Module |
| `42-ai-insights-module.md` | AI Insights Module |
| `43-settings-module.md` | Settings Module |
| `50-database-design-overview.md` | Database Design Overview |
| `51-data-dictionary-platform-and-people.md` | Data Dictionary: Platform and People |
| `52-data-dictionary-academics.md` | Data Dictionary: Academics |
| `53-data-dictionary-finance-and-communication.md` | Data Dictionary: Finance and Communication |
| `54-data-dictionary-operations-and-hr.md` | Data Dictionary: Operations, HR and Intelligence |
| `55-api-standards-and-conventions.md` | API Standards and Conventions |
| `56-api-endpoint-catalog.md` | API Endpoint Catalog |
| `57-integrations-and-webhooks.md` | Integrations and Webhooks |
| `58-background-jobs-and-events.md` | Background Jobs and Events |
| `60-security-architecture.md` | Security Architecture |
| `61-privacy-and-compliance.md` | Privacy and Compliance |
| `62-audit-logs-backups-and-disaster-recovery.md` | Audit Logs, Backups and Disaster Recovery |
| `63-internationalization-and-localization.md` | Internationalization and Localization |
| `64-non-functional-requirements.md` | Non-Functional Requirements |
| `65-testing-and-quality-assurance.md` | Testing and Quality Assurance |
| `90-appendix-full-prisma-schema.md` | Full Prisma Schema |
| `91-appendix-screen-inventory.md` | Screen Inventory |
| `92-appendix-error-codes.md` | Error Codes |
| `93-appendix-notification-template-catalog.md` | Notification Template Catalog |
| `94-appendix-glossary.md` | Glossary |

## 3. Claude Code prompt index (Founder Blueprint, Part III) — IDs and titles are fixed

| ID | Prompt | Blueprint chapter |
|---|---|---|
| P-01 | Create the monorepo skeleton (client, server, shared, npm workspaces, TypeScript, ESLint, Prettier) | Prompts: Project Foundation |
| P-02 | Write CLAUDE.md and copy the docs into the repo | Prompts: Project Foundation |
| P-03 | Docker Compose for PostgreSQL and Redis, plus Zod-validated environment config | Prompts: Project Foundation |
| P-04 | Install the Prisma schema, first migration and seed data (plans, permissions, system roles, demo organization) | Prompts: Project Foundation |
| P-05 | Express API skeleton: response envelope, error handler, request ID, logging, validation, OpenAPI | Prompts: Project Foundation |
| P-06 | Multi-tenancy layer: tenant context, Prisma extension, PostgreSQL RLS, isolation tests | Prompts: Project Foundation |
| P-07 | Authentication: login, refresh rotation, logout, password reset, OTP login, invitations | Prompts: Project Foundation |
| P-08 | RBAC: permission middleware, roles API, campus scoping | Prompts: Project Foundation |
| P-09 | Next.js app shell: layouts, role-based sidebar, auth pages, API client, route guards | Prompts: Project Foundation |
| P-10 | Reusable UI kit: data table, form kit, filters, dialogs, toasts, loading/empty/error states | Prompts: Project Foundation |
| P-11 | Organizations module with onboarding wizard and plan limits | Prompts: Core Modules (Phase 1) |
| P-12 | Multi Campus module | Prompts: Core Modules (Phase 1) |
| P-13 | Academic setup and Batch module (academic years, courses, batches, enrollments) | Prompts: Core Modules (Phase 1) |
| P-14 | Subjects module | Prompts: Core Modules (Phase 1) |
| P-15 | Student Admission module (inquiry, application, admission) | Prompts: Core Modules (Phase 1) |
| P-16 | Student Profile module with Excel import | Prompts: Core Modules (Phase 1) |
| P-17 | Teachers module | Prompts: Core Modules (Phase 1) |
| P-18 | Attendance module (web and mobile-friendly marking) | Prompts: Core Modules (Phase 1) |
| P-19 | Settings module (organization settings, number sequences, custom fields, branding) | Prompts: Core Modules (Phase 1) |
| P-20 | Dashboard module (role-based dashboards and daily metric snapshots) | Prompts: Core Modules (Phase 1) |
| P-21 | File uploads to S3 with pre-signed URLs | Prompts: Core Modules (Phase 1) |
| P-22 | Audit log and activity trail | Prompts: Core Modules (Phase 1) |
| P-23 | Fees part 1: fee heads, fee structures, student fee assignment | Prompts: Finance and Communication |
| P-24 | Fees part 2: invoice generation, late fees, reminders | Prompts: Finance and Communication |
| P-25 | Payments part 1: counter collection, receipt PDF, day close | Prompts: Finance and Communication |
| P-26 | Payments part 2: Razorpay online payments, webhooks, reconciliation | Prompts: Finance and Communication |
| P-27 | Discounts module | Prompts: Finance and Communication |
| P-28 | Notifications engine: events, templates, preferences, BullMQ workers, in-app feed | Prompts: Finance and Communication |
| P-29 | WhatsApp Cloud API integration and message credit wallet | Prompts: Finance and Communication |
| P-30 | Parent Portal (mobile-first) | Prompts: Finance and Communication |
| P-31 | Email (Amazon SES) and SMS (MSG91, DLT) channels | Prompts: Finance and Communication |
| P-32 | Stripe payments for international customers | Prompts: Finance and Communication |
| P-33 | Staff module | Prompts: Phase 2 to 4 Modules |
| P-34 | Leave module | Prompts: Phase 2 to 4 Modules |
| P-35 | Timetable module | Prompts: Phase 2 to 4 Modules |
| P-36 | Homework module | Prompts: Phase 2 to 4 Modules |
| P-37 | Exams module | Prompts: Phase 2 to 4 Modules |
| P-38 | Report Cards module with PDF generation | Prompts: Phase 2 to 4 Modules |
| P-39 | Scholarships module | Prompts: Phase 2 to 4 Modules |
| P-40 | Student Portal | Prompts: Phase 2 to 4 Modules |
| P-41 | Certificates module with QR verification | Prompts: Phase 2 to 4 Modules |
| P-42 | Analytics module and report builder | Prompts: Phase 2 to 4 Modules |
| P-43 | Library module | Prompts: Phase 2 to 4 Modules |
| P-44 | Inventory module | Prompts: Phase 2 to 4 Modules |
| P-45 | Transport module | Prompts: Phase 2 to 4 Modules |
| P-46 | Hostel module | Prompts: Phase 2 to 4 Modules |
| P-47 | Payroll module | Prompts: Phase 2 to 4 Modules |
| P-48 | AI Insights module | Prompts: Phase 2 to 4 Modules |
| P-49 | Write unit and integration tests for a module (Vitest, Supertest) | Prompts: Quality, Security and DevOps |
| P-50 | End-to-end tests for critical flows (Playwright) | Prompts: Quality, Security and DevOps |
| P-51 | Refactor a module safely | Prompts: Quality, Security and DevOps |
| P-52 | Security review of a module (OWASP, tenant isolation) | Prompts: Quality, Security and DevOps |
| P-53 | Performance review: slow queries, indexes, N+1, caching | Prompts: Quality, Security and DevOps |
| P-54 | Debug a production error from Sentry or logs | Prompts: Quality, Security and DevOps |
| P-55 | Dockerfiles and GitHub Actions CI/CD pipeline | Prompts: Quality, Security and DevOps |
| P-56 | Deploy to Railway and Vercel (staging and production) | Prompts: Quality, Security and DevOps |
| P-57 | Migrate to AWS (ECS Fargate, RDS, ElastiCache, S3, CloudFront) with Terraform | Prompts: Quality, Security and DevOps |
| P-58 | Seed realistic demo data for sales demos | Prompts: Quality, Security and DevOps |
| P-59 | Generate API docs, help-centre articles and release notes | Prompts: Quality, Security and DevOps |
| P-60 | Internationalization: Hindi and English UI, currency, timezone and locale packs | Prompts: Quality, Security and DevOps |

## 4. Sixty-day sprint skeleton (Founder Blueprint, Part II) — weekly themes are fixed

Daily rhythm: about 6 focused build hours + 2 sales/customer hours + 30 minutes review. Sunday = rest and weekly review.

| Week | Days | Dates (2026) | Theme | Prompts |
|---|---|---|---|---|
| 1 | 1–7 | 5–11 Oct | Foundation: repo, database, API skeleton, multi-tenancy | P-01 to P-06 |
| 2 | 8–14 | 12–18 Oct | Auth, RBAC, app shell, UI kit | P-07 to P-10, P-22 |
| 3 | 15–21 | 19–25 Oct | Organizations, campuses, academic setup, subjects, settings | P-11 to P-14, P-19 |
| 4 | 22–28 | 26 Oct – 1 Nov | Admissions, student profiles, teachers, file uploads, import | P-15 to P-17, P-21 |
| 5 | 29–35 | 2–8 Nov | Attendance and Fees (structures, invoices) | P-18, P-23, P-24 |
| 6 | 36–42 | 9–15 Nov | Payments (counter + Razorpay), discounts, receipts | P-25 to P-27 |
| 7 | 43–49 | 16–22 Nov | Notifications, WhatsApp, Parent Portal; pilot starts Day 45 | P-28 to P-30 |
| 8 | 50–56 | 23–29 Nov | Dashboard, tests, security review, CI/CD, staging and production deploy | P-20, P-49, P-50, P-52, P-55, P-56 |
| 9 | 57–60 | 30 Nov – 3 Dec | Pilot feedback fixes, demo data, launch checklist, go-live | P-54, P-58, P-59 |

Days 61–120 (4 Dec 2026 – 1 Feb 2027): Phase 2 modules with P-31, P-33 to P-42, P-51, P-53. Phase 3 (to June 2027): P-43 to P-47. Phase 4 (to Sep 2027): P-32, P-48, P-57, P-60.
