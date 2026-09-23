# EduFlow Canon — the single source of truth for all three documents

Every writer and reviewer MUST follow this file. If a chapter disagrees with the canon, the chapter is wrong.
Never invent a different price, role name, module name, table name, date, or target. If you need a fact that is
not here, choose a sensible value, state it as an assumption inside your chapter, and stay consistent with everything here.

## 1. Product identity

| Item | Value |
|---|---|
| Product name | EduFlow |
| One-line pitch | One simple system to run a school or coaching institute: admissions, attendance, fees, exams, staff and parent communication. |
| Type | Multi-tenant SaaS ERP (one codebase, one database, many organizations, strict data isolation by `organization_id`) |
| Customers | Coaching institutes (primary wedge) and K-12 private schools; later colleges and training centres |
| Markets | Phase 1: India. Phase 2: UAE, USA, Australia |
| Founder / document owner | Mehdi Alam (solo founder, builds with Claude Code) |
| Document date | 20 September 2026, version 1.0 |
| Prepared by | Mehdi Alam with Claude Code (Anthropic) as AI product, architecture and documentation assistant |
| Web app | `app.eduflow.app`; tenant subdomains `{slug}.eduflow.app`; API `api.eduflow.app/api/v1` |
| Vision | Become the operating system for every educational institution. |
| Mission | Give institutions of every size affordable, enterprise-grade software they can start using within one day. |
| Guiding principles | Simplicity (learn in hours), Automation (kill repetitive admin work), Transparency (parents always know), Scalability (1 campus to 100), Security (enterprise-grade data protection) |

### Timeline anchors (use these exact dates)

| Milestone | Date |
|---|---|
| Documentation v1.0 | 20 Sep 2026 |
| 60-day build sprint | Day 1 = Mon 5 Oct 2026, Day 60 = Thu 3 Dec 2026 |
| Pilot (5 friendly institutes, free) | starts Day 45 (18 Nov 2026) |
| Public launch in India (paid) | January 2027 — timed for the buying season before the April 2027 academic session |
| Phase 2 (V1.0) complete | Day 120 (1 Feb 2027) |
| Phase 3 (V1.5) complete | June 2027 |
| Phase 4 (V2.0) complete | September 2027 |
| Business Year 1 | Oct 2026 – Sep 2027. Year 2 = Oct 2027 – Sep 2028, and so on to Year 5 (ends Sep 2031) |
| International entry | UAE in Year 2 (Indian-curriculum schools first), USA and Australia pilots in Year 3 |

## 2. The 34 modules (names, codes, order and release phase are fixed)

| # | Module | Code | Phase | # | Module | Code | Phase |
|---|---|---|---|---|---|---|---|
| 1 | Dashboard | DASH | 1 | 18 | Discounts | DSC | 1 |
| 2 | Organizations | ORG | 1 | 19 | Scholarships | SCH | 2 |
| 3 | Multi Campus | CAMP | 1 | 20 | Parent Portal | PP | 1 |
| 4 | Student Admission | ADM | 1 | 21 | Student Portal | SP | 2 |
| 5 | Student Profile | STU | 1 | 22 | Notifications | NTF | 1 |
| 6 | Teachers | TCH | 1 | 23 | WhatsApp | WA | 1 |
| 7 | Staff | STF | 2 | 24 | Email | EML | 2 |
| 8 | Attendance | ATT | 1 | 25 | SMS | SMS | 2 |
| 9 | Leave | LEV | 2 | 26 | Library | LIB | 3 |
| 10 | Batch | BAT | 1 | 27 | Inventory | INV | 3 |
| 11 | Timetable | TT | 2 | 28 | Transport | TRN | 3 |
| 12 | Subjects | SUB | 1 | 29 | Hostel | HST | 3 |
| 13 | Homework | HW | 2 | 30 | Payroll | PRL | 3 |
| 14 | Exams | EXM | 2 | 31 | Certificates | CRT | 2 |
| 15 | Report Cards | RPT | 2 | 32 | Analytics | ANL | 2 |
| 16 | Fees | FEE | 1 | 33 | AI Insights | AI | 4 |
| 17 | Payments | PAY | 1 | 34 | Settings | SET | 1 |

- Phase 1 = MVP, built in the 60-day sprint (16 modules). Phase 2 = V1.0, Day 61–120 (12 modules). Phase 3 = V1.5, by June 2027 (5 modules). Phase 4 = V2.0, by Sep 2027 (AI Insights + international packs + white-label mobile apps).
- ID formats: screens `FEE-S01`, user stories `FEE-US-01`, acceptance criteria `FEE-AC-01`, API endpoints `FEE-API-01`, business requirements (BRD) `BR-001`, risks `R-01`, Claude Code prompts (Blueprint) `P-01`.

## 3. Roles (exactly these seven system roles)

| Role key | Display name | Who it is | Data scope |
|---|---|---|---|
| `SUPER_ADMIN` | Super Admin | EduFlow platform staff (us) | All organizations (platform console) |
| `ORG_ADMIN` | Organization Admin | Institute owner / director / head admin | Whole organization, all campuses |
| `PRINCIPAL` | Principal | Academic head of a campus (centre head in coaching) | Assigned campus(es) |
| `TEACHER` | Teacher | Teaching staff | Own batches and subjects |
| `ACCOUNTANT` | Accountant | Fee counter / finance staff | Finance data of assigned campus(es) |
| `PARENT` | Parent | Parent or guardian | Own children only |
| `STUDENT` | Student | Learner | Own record only |

Organizations can also create **custom roles** (for example Librarian, Transport Manager, Hostel Warden, HR Manager, Front Desk) by picking permissions. Permission keys use `module.action`, for example `students.create`, `fees.collect`, `attendance.mark`. Matrix cell values in RBAC tables: `Yes`, `No`, `Own` (own records only), `Campus` (assigned campus only), `View` (read only).

## 4. Domain language (works for both schools and coaching)

| Concept | Model | School label | Coaching label |
|---|---|---|---|
| Tenant | `Organization` | School / School group | Institute |
| Branch | `Campus` | Campus / Branch | Centre / Branch |
| Session | `AcademicYear` | Academic year 2027-28 | Session 2027-28 |
| Grade or program | `Course` | Class 10 | JEE Main 2028 |
| Teaching group | `Batch` | Section 10-A | Morning Batch M1 |
| Student joins a batch | `Enrollment` | Enrolled in 10-A | Enrolled in M1 |
| Guardian | `Guardian` | Parent | Parent |

The UI label changes by `Organization.type` (`SCHOOL`, `COACHING`, `COLLEGE`, `TRAINING_CENTRE`). Use sample names consistently: school = "Bright Future Public School" (Lucknow, 1,200 students, 2 campuses); coaching = "Sharma Classes" (Patna, 350 students, JEE/NEET); owner "Rajesh Sharma"; principal "Dr. Anita Verma"; teacher "Priya Nair"; accountant "Suresh Gupta"; parent "Sunita Devi"; student "Aarav Sharma" (Class 10-A, admission no. `BF-2027-0142`).

## 5. Technology (fixed stack)

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript, Tailwind CSS, shadcn/ui components, TanStack Query, React Hook Form + Zod |
| Backend | Node.js 24 LTS, Express.js 5, TypeScript, Zod validation, Pino logs, OpenAPI (Swagger) docs |
| Database | PostgreSQL 16+, Prisma ORM 6.x (pin the version; upgrade after MVP) |
| Cache / queue | Redis 7+; BullMQ workers for notifications, PDFs, imports, reports, webhooks |
| Auth | JWT access token (15 min) + rotating refresh token (30 days, httpOnly cookie, stored hashed); OTP login for parents/students; bcrypt password hashing |
| Files | AWS S3 (private buckets, pre-signed URLs), region `ap-south-1` (Mumbai) for India |
| Payments | Razorpay (India), Stripe (USA, Australia, UAE) |
| Messaging | WhatsApp Cloud API (Meta) via a BSP-free direct integration, SMS via MSG91 (India, DLT compliant) and Twilio (international), email via Amazon SES |
| Hosting path | Start: Vercel (client) + Railway (API, worker, Postgres, Redis). Scale: AWS (ECS Fargate, RDS PostgreSQL, ElastiCache, S3, CloudFront) |
| Repo | One Git monorepo with `client/`, `server/`, `shared/` folders (npm workspaces), GitHub, GitHub Actions CI/CD, Docker |
| Monitoring | Sentry (errors), Better Stack or Grafana Cloud (uptime, logs), PostHog (product analytics) |

### Multi-tenancy rules

1. Shared database, shared schema. **Every tenant table has `organization_id` (UUID, NOT NULL, FK to `organizations`)** and an index that starts with `organization_id`.
2. The tenant comes from the JWT (`orgId` claim). It is never accepted from the request body. `SUPER_ADMIN` may act on a tenant with the `X-Organization-Id` header.
3. A Prisma client extension adds `organizationId` to every query automatically. PostgreSQL Row-Level Security (RLS) is the second safety net (`SET app.current_org`).
4. Campus scoping: most operational tables also have `campus_id`. Users see only their assigned campuses. Requests may send `X-Campus-Id`.
5. Unique keys are always per tenant, for example `@@unique([organizationId, admissionNo])`.
6. Platform-level tables without tenant scope are only: `plans`, `permissions`, `countries`, `currencies` and similar reference data.

### Database conventions

- Prisma models: PascalCase singular (`FeeInvoice`), mapped to snake_case plural tables with `@@map("fee_invoices")`. Fields camelCase mapped with `@map("snake_case")`.
- Primary key: `id String @id @default(uuid()) @db.Uuid`. Timestamps `createdAt`, `updatedAt`; soft delete `deletedAt` on business records; `createdById` where useful.
- Money: `Decimal @db.Decimal(12, 2)` plus a 3-letter `currency` code. Never use Float for money.
- Dates: store UTC (`timestamptz`); show in the organization's timezone. Pure calendar dates use `@db.Date`.
- Enums in UPPER_SNAKE_CASE. Flexible settings in `Json` columns.
- The full schema lives in the folder `docs/src/_schema/` as a multi-file Prisma schema (one `.prisma` file per domain, validated with `prisma validate`). Module chapters must copy model definitions from it and must not invent new tables or fields.

### API conventions

- Base URL `/api/v1`. JSON only. Plural kebab-case resources: `/students`, `/fee-invoices`. Nested only one level: `/students/:id/documents`.
- Auth header `Authorization: Bearer <accessToken>`. Optional `X-Campus-Id`. `Idempotency-Key` header on payment-creating POSTs.
- Success envelope: `{ "success": true, "data": {...}, "meta": { "page": 1, "limit": 20, "total": 134, "totalPages": 7 } }` (`meta` only on lists).
- Error envelope: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Human readable message", "details": [ { "field": "phone", "issue": "Invalid phone number" } ] }, "requestId": "req_8f3a..." }`.
- Standard error codes: `VALIDATION_ERROR` (400), `UNAUTHENTICATED` (401), `TOKEN_EXPIRED` (401), `FORBIDDEN` (403), `PLAN_LIMIT_REACHED` (403), `NOT_FOUND` (404), `CONFLICT` (409), `BUSINESS_RULE_VIOLATION` (422), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500), `SERVICE_UNAVAILABLE` (503).
- Lists: `?page=1&limit=20&sort=-createdAt&q=aarav` plus field filters (`?batchId=...&status=ACTIVE`). Max `limit` = 100.
- Rate limits: 100 requests/min per user, 1,000/min per organization, 5 login attempts per 15 min per account+IP.
- The endpoint registry lives in `docs/src/_api/` (one file per module group). Module chapters must use those exact endpoint IDs, methods, paths and permission keys.

## 6. Pricing (fixed; all prices exclude tax)

Yearly price = 10 × monthly (2 months free). Student limit counts active students.

| Plan | Students | Campuses | India (INR) | USA (USD) | Australia (AUD) | UAE (AED) |
|---|---|---|---|---|---|---|
| Starter (free forever) | up to 50 | 1 | ₹0 | $0 | A$0 | AED 0 |
| Growth | up to 300 | 1 | ₹2,499/mo · ₹24,990/yr | $79/mo · $790/yr | A$119/mo · A$1,190/yr | AED 299/mo · AED 2,990/yr |
| Pro | up to 1,000 | up to 3 | ₹5,999/mo · ₹59,990/yr | $199/mo · $1,990/yr | A$299/mo · A$2,990/yr | AED 749/mo · AED 7,490/yr |
| Enterprise | unlimited | unlimited | from ₹14,999/mo (custom yearly contract) | from $499/mo | from A$749/mo | from AED 1,849/mo |

Tax: India GST 18% on the subscription; Australia GST 10%; UAE VAT 5%; USA sales tax by state where applicable (Stripe Tax).

Plan contents: Starter = Phase 1 core modules with EduFlow branding, 1 admin + 3 staff users, no WhatsApp/SMS sending (in-app + email only). Growth = all Phase 1 + Phase 2 modules, unlimited staff users, WhatsApp/SMS via credits, online fee payment. Pro = everything in Growth + Phase 3 modules (Library, Inventory, Transport, Hostel, Payroll), multi-campus, custom roles, advanced analytics, priority support. Enterprise = everything + AI Insights included, white-label, SSO, dedicated account manager, custom SLA, data migration included, API access.

Add-ons (India prices): extra campus ₹999/mo; AI Insights ₹1,499/mo (Growth/Pro); white-label mobile app ₹49,999 setup + ₹4,999/mo; WhatsApp credit packs ₹499 / ₹1,999 / ₹7,999 (charged per message at Meta cost + 15% margin); SMS pack ₹1,250 per 5,000 SMS (₹0.25 each); assisted data migration ₹9,999 one-time; on-site training ₹4,999/day. Online fee payments: gateway charges passed through at cost (about 2% on cards/netbanking; UPI low or zero); EduFlow adds no markup in Year 1.

Planning exchange rates (assumption): US$1 = ₹85, A$1 = ₹56, AED 1 = ₹23.

## 7. Business targets (targets, not forecasts — always label them as targets)

| End of | Paying organizations | Blended ARPA / month | MRR | ARR (run-rate) | Team size |
|---|---|---|---|---|---|
| Year 1 (Sep 2027) | 120 | ₹5,000 | ₹6 lakh | ₹72 lakh | 4 |
| Year 2 (Sep 2028) | 500 | ₹6,000 | ₹30 lakh | ₹3.6 crore | 14 |
| Year 3 (Sep 2029) | 1,500 (incl. 100 international) | ₹7,500 | ₹1.1 crore | ₹13.5 crore | 40 |
| Year 4 (Sep 2030) | 4,000 (incl. 500 international) | ₹8,500 | ₹3.4 crore | ₹41 crore | 95 |
| Year 5 (Sep 2031) | 10,000 (incl. 1,500 international) | ₹9,500 | ₹9.5 crore | ₹114 crore | 220 |

Other Year-1 targets: 300 free (Starter) organizations, 60,000 active students on the platform, free-to-paid conversion 15%, monthly logo churn under 3%, NPS 50+, activation (first fee receipt or first attendance within 7 days of signup) 60%, online fee collection share 40% of fee value, parent app/portal adoption 70%, CAC under ₹12,000, LTV:CAC above 4:1, gross margin 80%+. Funding stance: bootstrap to ₹3–5 lakh MRR, then optionally raise a seed round (₹3–5 crore) in Year 2.

The scaling stages used in the Founder Blueprint: 100 customers, 500 customers, 1,000 customers, 10,000 customers.

## 8. Competitors (always this set, in this order)

Teachmint, Classplus, PowerSchool, Blackboard (Anthology), Fedena, MyClassCampus. Secondary mentions allowed: Entab CampusCare, Edunext, Vidyalaya, LEAD, Proctur, Google Classroom, Compass (Australia), Sentral (Australia), Infinite Campus (USA), Skyward (USA). Competitor facts must be described as "based on public information as of September 2026; verify before external use". Never state unverifiable private numbers as facts.

## 9. Compliance anchors

India: Digital Personal Data Protection Act 2023 and DPDP Rules (children's data needs verifiable parental consent; no tracking or targeted ads to children), IT Act 2000, GST law, TRAI DLT rules for SMS, RBI rules via payment gateways (no card data stored by EduFlow), Ministry of Education 2024 guidelines for coaching centres. USA: FERPA, COPPA, state student-privacy laws, PCI DSS through Stripe. Australia: Privacy Act 1988 and Australian Privacy Principles, Notifiable Data Breaches scheme. UAE: PDPL (Federal Decree-Law 45 of 2021), KHDA/ADEK expectations for schools. EU-style GDPR principles are followed as the baseline everywhere (consent, access, correction, deletion, portability, breach notice within 72 hours).

## 10. Honesty rules for all content

- Market sizes, competitor details and legal points: use web search where available, cite the source name and year in a "Sources" list at the end of the chapter, and mark anything unverified as "Estimate" or "Assumption". Never fabricate a citation or URL.
- Financial numbers are targets and models, not promises. Show the formula behind every number so the founder can change the inputs.
- Do not claim a feature exists in a competitor unless public information supports it; otherwise write "Not publicly listed".
