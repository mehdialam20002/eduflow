# Data Dictionary: Platform and People

**In simple words:** This chapter lists every table and column for the platform tables (plans, organizations, campuses, settings, files), authentication and permissions, and the people tables (staff, students, guardians, admissions). It is generated directly from the validated Prisma schema, so it always matches the database exactly. Use it when you write a query, build a report, answer a support question or review a migration.

How to read each table entry:

- **Column** is the real PostgreSQL column name (snake_case). The Prisma field name is the camelCase version of it.
- **Type** is the PostgreSQL type. `numeric(12,2)` is money, always stored together with a `currency` column. `timestamptz` values are stored in UTC.
- **Null** says whether the column may be empty. **Default** is the value the database or Prisma fills in.
- **Notes** marks keys (PK primary key, UK unique, FK foreign key with its delete rule) and repeats the comment from the schema.

> **Rule:** Every tenant table has `organization_id`. Every query must filter by it; the Prisma tenant extension does this for you (see *Multi-Tenancy and Data Isolation*).

## Tables in This Chapter

| Schema file | Domain | Tables | Enums |
|---|---|---|---|
| `00-base.prisma` | Shared enums | 0 | 16 |
| `01-platform.prisma` | Platform and tenancy | 19 | 12 |
| `02-auth.prisma` | Authentication, RBAC, audit and consent | 17 | 19 |
| `04-people.prisma` | People and admissions | 19 | 22 |

## Shared enums

Schema file `server/prisma/schema/00-base.prisma` — 0 tables and 16 enums.

### Enums in 00-base.prisma

| Enum | Values | Meaning |
|---|---|---|
| `OrganizationType` | SCHOOL, COACHING, COLLEGE, TRAINING_CENTRE | Kind of institution; drives UI labels (Class/Section vs Program/Batch). |
| `RecordStatus` | ACTIVE, INACTIVE, ARCHIVED | Generic lifecycle for master data (courses, subjects, rooms, leave types ...). |
| `Gender` | MALE, FEMALE, OTHER, UNDISCLOSED |  |
| `BloodGroup` | A_POS, A_NEG, B_POS, B_NEG, AB_POS, AB_NEG, O_POS, O_NEG, UNKNOWN |  |
| `Channel` | IN_APP, WHATSAPP, SMS, EMAIL, PUSH | Delivery channel for notifications, OTPs and parent communication. |
| `WeekDay` | MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY |  |
| `ApprovalStatus` | PENDING, APPROVED, REJECTED, CANCELLED | Generic approval outcome (leave, student leave, discounts, refunds ...). |
| `JobStatus` | QUEUED, PROCESSING, COMPLETED, COMPLETED_WITH_ERRORS, FAILED, CANCELLED | Lifecycle of a background job processed by BullMQ workers (imports, exports, PDFs). |
| `ModuleCode` | DASH, ORG, CAMP, ADM, STU, TCH, STF, ATT, LEV, BAT, TT, SUB, HW, EXM, RPT, FEE, PAY, DSC, SCH, PP, SP, NTF, WA, EML, SMS, LIB, INV, TRN, HST, PRL, CRT, ANL, AI, SET | The 34 product modules (canon codes); used for plan gating and permissions. |
| `PaymentGateway` | RAZORPAY, STRIPE, OFFLINE | Payment gateway used for SaaS billing and for online fee collection. |
| `BillingCycle` | MONTHLY, YEARLY |  |
| `DevicePlatform` | WEB, ANDROID, IOS, API | Client platform of a session, device or push token. |
| `Audience` | ALL, STAFF, STUDENTS, PARENTS, STUDENTS_AND_PARENTS | Who a calendar item, holiday or announcement applies to. |
| `Shift` | MORNING, AFTERNOON, EVENING, FULL_DAY, WEEKEND | Part of the day a batch or period slot belongs to. |
| `HalfDaySession` | FIRST_HALF, SECOND_HALF | Which half of a day a half-day leave or attendance refers to. |
| `FileFormat` | XLSX, CSV, PDF, JSON, ZIP | Output format of generated files (exports, reports). |

## Platform and tenancy

Schema file `server/prisma/schema/01-platform.prisma` — 19 tables and 12 enums.

### countries

Prisma model `Country`. Platform table (shared by all tenants, no `organization_id`). Platform reference: ISO 3166 country with regional defaults. No tenant scope.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `code` | char(2) | not null |  | UK. ISO 3166-1 alpha-2, e.g. IN |
| `iso3` | char(3) | not null |  | UK |
| `name` | varchar(100) | not null |  |  |
| `dial_code` | varchar(8) | not null |  | e.g. +91 |
| `default_currency_code` | char(3) | not null |  | FK to `currencies` (restrict on delete) |
| `default_timezone` | varchar(64) | not null |  | IANA, e.g. Asia/Kolkata |
| `default_locale` | varchar(10) | not null |  | e.g. en-IN |
| `tax_name` | varchar(20) | nullable |  | GST, VAT, Sales Tax |
| `tax_percent` | decimal(5,2) | nullable |  | tax on the EduFlow subscription |
| `tax_id_label` | varchar(20) | nullable |  | GSTIN, ABN, TRN, EIN |
| `is_supported` | boolean | not null | false | open for signup |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Relations:** belongs to `currencies`; has many `organizations`, `campuses`.

### currencies

Prisma model `Currency`. Platform table (shared by all tenants, no `organization_id`). Platform reference: ISO 4217 currency. No tenant scope.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `code` | char(3) | not null |  | UK. ISO 4217, e.g. INR |
| `name` | varchar(60) | not null |  |  |
| `symbol` | varchar(8) | not null |  |  |
| `decimal_digits` | smallint | not null | 2 |  |
| `is_active` | boolean | not null | true |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Relations:** has many `countries`, `organizations`, `plan_prices`.

### exchange_rates

Prisma model `ExchangeRate`. Platform table (shared by all tenants, no `organization_id`). Platform reference: daily exchange rate used to convert provider costs (USD) and cross-currency reports. No tenant scope.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `base_currency` | char(3) | not null |  |  |
| `quote_currency` | char(3) | not null |  |  |
| `rate` | decimal(18,8) | not null |  | 1 base = rate quote |
| `rate_date` | date | not null |  |  |
| `source` | varchar(40) | not null |  | e.g. ECB, RBI, MANUAL |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (base_currency, quote_currency, rate_date).

### plans

Prisma model `Plan`. Platform table (shared by all tenants, no `organization_id`). SaaS plan catalogue (Starter, Growth, Pro, Enterprise). Platform-level.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `code` | varchar(30) | not null |  | UK. STARTER, GROWTH, PRO, ENTERPRISE |
| `name` | varchar(60) | not null |  |  |
| `description` | text | nullable |  |  |
| `max_students` | integer | nullable |  | active students; null = unlimited |
| `max_campuses` | integer | nullable |  | null = unlimited |
| `max_admin_users` | integer | nullable |  |  |
| `max_staff_users` | integer | nullable |  | null = unlimited |
| `storage_gb` | integer | nullable |  |  |
| `trial_days` | integer | not null | 14 |  |
| `is_public` | boolean | not null | true | shown on the pricing page |
| `is_custom_priced` | boolean | not null | false | Enterprise: price agreed per contract |
| `sort_order` | integer | not null | 0 |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Relations:** has many `plan_prices`, `plan_features`, `organizations`, `subscriptions`.

### plan_prices

Prisma model `PlanPrice`. Platform table (shared by all tenants, no `organization_id`). Price of a plan per currency and billing cycle (tax excluded). Platform-level.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `plan_id` | uuid | not null |  | FK to `plans` (cascade on delete) |
| `currency` | char(3) | not null |  | FK to `currencies` (restrict on delete) |
| `billing_cycle` | enum `BillingCycle` | not null |  |  |
| `amount` | decimal(12,2) | not null |  |  |
| `is_active` | boolean | not null | true |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (plan_id, currency, billing_cycle).

**Relations:** belongs to `plans`, `currencies`.

### plan_features

Prisma model `PlanFeature`. Platform table (shared by all tenants, no `organization_id`). Module and feature gating per plan (which modules/limits a plan unlocks). Platform-level.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `plan_id` | uuid | not null |  | FK to `plans` (cascade on delete) |
| `feature_key` | varchar(60) | not null |  | e.g. module.LIB, custom_roles, whatsapp_sending, api_access |
| `module` | enum `ModuleCode` | nullable |  | set when the feature row gates a whole module |
| `is_enabled` | boolean | not null | true |  |
| `limit_value` | integer | nullable |  | numeric cap for metered features; null = no cap |
| `config` | jsonb | nullable |  | extra options, e.g. { "branding": "eduflow" } |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (plan_id, feature_key); Index (plan_id, module).

**Relations:** belongs to `plans`.

### organizations

Prisma model `Organization`. Platform table (shared by all tenants, no `organization_id`). The tenant: one school, school group or coaching institute.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `name` | varchar(150) | not null |  |  |
| `legal_name` | varchar(200) | nullable |  |  |
| `slug` | varchar(63) | not null |  | UK. subdomain: {slug}.eduflow.app |
| `custom_domain` | varchar(255) | nullable |  | UK. white-label (Enterprise) |
| `type` | enum `OrganizationType` | not null |  |  |
| `status` | enum `OrganizationStatus` | not null | TRIAL |  |
| `plan_id` | uuid | not null |  | FK to `plans` (restrict on delete). current plan, denormalised from the live subscription for fast gating |
| `country_code` | char(2) | not null |  | FK to `countries` (restrict on delete) |
| `currency` | char(3) | not null |  | FK to `currencies` (restrict on delete). default currency for fees |
| `timezone` | varchar(64) | not null | "Asia/Kolkata" | IANA name |
| `locale` | varchar(10) | not null | "en-IN" |  |
| `state_code` | varchar(10) | nullable |  | GST state code (e.g. 09) / ISO 3166-2; decides CGST+SGST vs IGST |
| `is_tax_registered` | boolean | not null | false |  |
| `tax_id_type` | varchar(10) | nullable |  | GSTIN \| ABN \| TRN \| EIN |
| `financial_year_start_month` | smallint | not null | 4 | 4 = April (India), 7 = July (Australia), 1 = January (UAE, USA) |
| `week_starts_on` | enum `WeekDay` | not null | MONDAY |  |
| `data_region` | varchar(20) | not null | "ap-south-1" | AWS region that holds this tenant's files and backups |
| `email` | varchar(255) | not null |  |  |
| `phone` | varchar(20) | nullable |  | E.164 |
| `website` | varchar(255) | nullable |  |  |
| `address_line1` | varchar(200) | nullable |  |  |
| `address_line2` | varchar(200) | nullable |  |  |
| `city` | varchar(100) | nullable |  |  |
| `state` | varchar(100) | nullable |  |  |
| `postal_code` | varchar(20) | nullable |  |  |
| `tax_id` | varchar(30) | nullable |  | GSTIN in India; ABN / TRN / EIN elsewhere |
| `registration_no` | varchar(60) | nullable |  | board affiliation / registration number |
| `logo_url` | varchar(500) | nullable |  |  |
| `branding` | jsonb | nullable |  | { primaryColor, secondaryColor, faviconUrl, receiptFooter, hideEduflowBranding } |
| `owner_user_id` | uuid | nullable |  | User id of the account owner (no FK to avoid a circular dependency) |
| `trial_starts_at` | timestamptz | nullable |  |  |
| `trial_ends_at` | timestamptz | nullable |  |  |
| `onboarding_completed_at` | timestamptz | nullable |  |  |
| `activated_at` | timestamptz | nullable |  | first fee receipt or first attendance |
| `suspended_at` | timestamptz | nullable |  |  |
| `suspended_reason` | varchar(255) | nullable |  |  |
| `signup_source` | varchar(60) | nullable |  | website, referral, partner, sales |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (status); Index (plan_id); Index (country_code, type).

**Relations:** belongs to `plans`, `countries`, `currencies`; has many `subscriptions`, `subscription_invoices`, `add_on_purchases`, `campuses`, `organization_settings`, `number_sequences`, `custom_field_definitions`, `custom_field_values`, `file_assets`, `import_jobs`, `import_job_row_errors`, `export_jobs`, `users`, `roles`, `role_permissions`, `user_roles`, `user_campuses`, `refresh_tokens`, `otp_codes`, `password_reset_tokens`, `invitations`, `login_histories`, `audit_logs`, `api_keys`, `consent_records`, `data_subject_requests`, `academic_years`, `terms`, `courses`, `batches`, `subjects`, `course_subjects`, `batch_subject_teachers`, `rooms`, `holidays`, `calendar_events`, `departments`, `designations`, `staff`, `staff_documents`, `teacher_subjects`, `students`, `guardians`, `student_guardians`, `enrollments`, `student_documents`, `student_notes`, `student_status_histories`, `admission_inquiries`, `inquiry_follow_ups`, `admission_applications`, `admission_application_documents`, `attendance_sessions`, `attendance_records`, `staff_attendance`, `leave_types`, `leave_policies`, `leave_balances`, `leave_requests`, `leave_approval_steps`, `student_leave_requests`, `period_slots`, `timetable_entries`, `substitutions`, `homework`, `homework_attachments`, `homework_submissions`, `homework_submission_files`, `grade_scales`, `grade_bands`, `exams`, `exam_schedules`, `exam_marks`, `report_card_templates`, `report_cards`, `report_card_remarks`, `fee_heads`, `fee_structures`, `fee_structure_items`, `fee_installments`, `student_fee_assignments`, `fee_invoices`, `fee_invoice_items`, `late_fee_rules`, `discounts`, `student_discounts`, `scholarships`, `scholarship_applications`, `scholarship_awards`, `scholarship_disbursements`, `fee_reminder_logs`, `payment_gateway_accounts`, `payment_orders`, `payments`, `payment_allocations`, `receipts`, `refunds`, `webhook_events`, `settlements`, `day_closes`, `notification_templates`, `notifications`, `notification_preferences`, `announcements`, `announcement_recipients`, `message_logs`, `whats_app_accounts`, `whats_app_templates`, `whats_app_inbound_messages`, `email_sender_identities`, `email_suppressions`, `sms_sender_ids`, `message_credit_wallets`, `credit_transactions`, `device_tokens`, `library_categories`, `books`, `book_copies`, `book_issues`, `inventory_categories`, `inventory_items`, `vendors`, `purchase_orders`, `purchase_order_items`, `stock_transactions`, `asset_assignments`, `vehicles`, `driver_profiles`, `transport_routes`, `route_stops`, `transport_assignments`, `vehicle_trips`, `vehicle_maintenances`, `hostels`, `hostel_rooms`, `hostel_beds`, `hostel_allocations`, `hostel_attendance`, `hostel_visitor_logs`, `salary_components`, `salary_structures`, `salary_structure_items`, `staff_salaries`, `payroll_runs`, `payslips`, `payslip_items`, `staff_loan_advances`, `payroll_adjustments`, `certificate_templates`, `issued_certificates`, `certificate_requests`, `saved_reports`, `report_schedules`, `daily_metric_snapshots`, `dashboard_preferences`, `ai_insights`, `student_risk_scores`, `ai_query_logs`, `ai_usage_quotas`, `policy_documents`, `data_breach_incidents`, `ptm_bookings`, `families`, `staff_status_histories`, `student_transfers`, `class_sessions`, `study_materials`, `exam_schedule_components`, `exam_mark_components`, `exam_re_evaluation_requests`, `tax_rates`, `fee_invoice_adjustments`, `student_fee_installments`, `payment_allocation_items`, `refund_allocations`, `sms_dlt_templates`, `book_reservations`, `transport_attendance`, `hostel_leave_requests`, `payroll_statutory_settings`, `staff_tax_declarations`.

### subscriptions

Prisma model `Subscription`. Tenant table (filtered by `organization_id`). A tenant's SaaS subscription to a plan (one live row per organization; history kept). One live row is enforced by a partial unique index in the SQL migration: UNIQUE (organization_id) WHERE status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED')

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `plan_id` | uuid | not null |  | FK to `plans` (restrict on delete) |
| `status` | enum `SubscriptionStatus` | not null | TRIALING |  |
| `billing_cycle` | enum `BillingCycle` | not null | MONTHLY |  |
| `currency` | char(3) | not null |  |  |
| `unit_amount` | decimal(12,2) | not null |  | price per cycle before tax |
| `discount_amount` | decimal(12,2) | not null | 0 |  |
| `tax_percent` | decimal(5,2) | not null | 0 |  |
| `student_limit_override` | integer | nullable |  | Enterprise contracts |
| `campus_limit_override` | integer | nullable |  |  |
| `start_date` | date | not null |  |  |
| `current_period_start` | timestamptz | not null |  |  |
| `current_period_end` | timestamptz | not null |  |  |
| `trial_ends_at` | timestamptz | nullable |  |  |
| `cancel_at_period_end` | boolean | not null | false |  |
| `cancelled_at` | timestamptz | nullable |  |  |
| `cancel_reason` | varchar(255) | nullable |  |  |
| `gateway` | enum `PaymentGateway` | not null | OFFLINE |  |
| `gateway_customer_id` | varchar(100) | nullable |  |  |
| `gateway_subscription_id` | varchar(100) | nullable |  |  |
| `notes` | text | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (gateway, gateway_subscription_id); Index (organization_id, status); Index (status, current_period_end).

**Relations:** belongs to `organizations`, `plans`; has many `subscription_invoices`, `add_on_purchases`.

### subscription_invoices

Prisma model `SubscriptionInvoice`. Tenant table (filtered by `organization_id`). Invoice raised by EduFlow to a tenant for the subscription and add-ons.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `subscription_id` | uuid | nullable |  | FK to `subscriptions` (restrict on delete). null for one-time add-on invoices |
| `invoice_no` | varchar(40) | not null |  | UK. platform-wide series, e.g. EF/26-27/000123; max 16 chars when the issuer is GST-registered (India, GST Rule 46) |
| `status` | enum `SubscriptionInvoiceStatus` | not null | OPEN |  |
| `currency` | char(3) | not null |  |  |
| `supplier_entity` | varchar(30) | not null | "EDUFLOW_IN" | EduFlow billing entity that issued the invoice |
| `supplier_tax_id` | varchar(30) | nullable |  | supplier GSTIN / TRN / ABN frozen at issue |
| `sac_code` | varchar(10) | nullable |  | e.g. 998314 |
| `billing_country_code` | char(2) | not null |  |  |
| `billing_state_code` | varchar(10) | nullable |  |  |
| `place_of_supply` | varchar(10) | nullable |  |  |
| `tax_name` | varchar(20) | nullable |  | GST, VAT, Sales Tax |
| `tax_breakdown` | jsonb | nullable |  | [{ code: CGST\|SGST\|IGST\|GST\|VAT\|SALES_TAX, percent, amount }] |
| `is_reverse_charge` | boolean | not null | false | export of services / B2B reverse charge |
| `amount_refunded` | decimal(12,2) | not null | 0 |  |
| `credit_note_no` | varchar(40) | nullable |  | UK |
| `credit_note_date` | date | nullable |  |  |
| `voided_at` | timestamptz | nullable |  |  |
| `void_reason` | varchar(255) | nullable |  |  |
| `subtotal` | decimal(12,2) | not null |  |  |
| `discount_amount` | decimal(12,2) | not null | 0 |  |
| `tax_percent` | decimal(5,2) | not null | 0 |  |
| `tax_amount` | decimal(12,2) | not null | 0 |  |
| `total_amount` | decimal(12,2) | not null |  |  |
| `amount_paid` | decimal(12,2) | not null | 0 |  |
| `period_start` | date | nullable |  |  |
| `period_end` | date | nullable |  |  |
| `issue_date` | date | not null |  |  |
| `due_date` | date | not null |  |  |
| `paid_at` | timestamptz | nullable |  |  |
| `gateway` | enum `PaymentGateway` | not null | OFFLINE |  |
| `gateway_invoice_id` | varchar(100) | nullable |  |  |
| `gateway_payment_id` | varchar(100) | nullable |  |  |
| `billing_name` | varchar(200) | not null |  |  |
| `billing_tax_id` | varchar(30) | nullable |  | customer GSTIN at the time of invoicing |
| `billing_address` | jsonb | nullable |  |  |
| `line_items` | jsonb | not null |  | [{ description, quantity, unitAmount, amount, addOnPurchaseId? }] |
| `pdf_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (gateway, gateway_invoice_id); Unique (gateway, gateway_payment_id); Index (organization_id, status); Index (organization_id, issue_date); Index (status, due_date).

**Relations:** belongs to `organizations`, `subscriptions`, `file_assets`; has many `add_on_purchases`.

### add_on_purchases

Prisma model `AddOnPurchase`. Tenant table (filtered by `organization_id`). Add-on bought by a tenant: extra campus, AI Insights, WhatsApp/SMS credit packs, migration, training.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `subscription_id` | uuid | nullable |  | FK to `subscriptions` (setnull on delete) |
| `invoice_id` | uuid | nullable |  | FK to `subscription_invoices` (setnull on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (setnull on delete). the campus unlocked by EXTRA_CAMPUS |
| `add_on_type` | enum `AddOnType` | not null |  |  |
| `description` | varchar(255) | nullable |  |  |
| `quantity` | integer | not null | 1 |  |
| `unit_amount` | decimal(12,2) | not null |  |  |
| `total_amount` | decimal(12,2) | not null |  | before tax |
| `currency` | char(3) | not null |  |  |
| `is_recurring` | boolean | not null | false |  |
| `billing_cycle` | enum `BillingCycle` | nullable |  | only when recurring |
| `status` | enum `AddOnStatus` | not null | PENDING |  |
| `credits_granted` | decimal(12,4) | nullable |  | message credits (SMS) or wallet money (WhatsApp) for credit packs |
| `credits_remaining` | decimal(12,4) | nullable |  | unexpired remainder; used for FIFO pack expiry |
| `credit_unit` | enum `CreditUnit` | nullable |  |  |
| `tax_amount` | decimal(12,2) | not null | 0 |  |
| `refunded_amount` | decimal(12,2) | not null | 0 |  |
| `cancelled_at` | timestamptz | nullable |  |  |
| `starts_at` | timestamptz | nullable |  |  |
| `expires_at` | timestamptz | nullable |  |  |
| `purchased_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, add_on_type, status); Index (organization_id, add_on_type, expires_at).

**Relations:** belongs to `organizations`, `subscriptions`, `subscription_invoices`, `campuses`; has many `credit_transactions`.

### campuses

Prisma model `Campus`. Tenant table (filtered by `organization_id`). A branch / centre of an organization. Most operational data is scoped to a campus. One main campus per organization is enforced by a partial unique index in the SQL migration: UNIQUE (organization_id) WHERE is_main AND deleted_at IS NULL

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `name` | varchar(150) | not null |  |  |
| `code` | varchar(20) | not null |  | short code used in numbering, e.g. LKO1 |
| `is_main` | boolean | not null | false |  |
| `email` | varchar(255) | nullable |  |  |
| `phone` | varchar(20) | nullable |  |  |
| `address_line1` | varchar(200) | nullable |  |  |
| `address_line2` | varchar(200) | nullable |  |  |
| `city` | varchar(100) | nullable |  |  |
| `state` | varchar(100) | nullable |  |  |
| `postal_code` | varchar(20) | nullable |  |  |
| `country_code` | char(2) | nullable |  | FK to `countries` (restrict on delete) |
| `timezone` | varchar(64) | nullable |  | overrides the organization timezone when set |
| `latitude` | decimal(9,6) | nullable |  | used for geo-fenced staff attendance |
| `longitude` | decimal(9,6) | nullable |  |  |
| `geo_radius_meters` | integer | nullable |  |  |
| `tax_id` | varchar(30) | nullable |  | campus-level GSTIN when registered separately |
| `is_tax_registered` | boolean | not null | false |  |
| `state_code` | varchar(10) | nullable |  | GST state code / ISO 3166-2 |
| `currency` | char(3) | nullable |  | overrides Organization.currency |
| `locale` | varchar(10) | nullable |  | overrides Organization.locale |
| `board` | varchar(60) | nullable |  | CBSE, ICSE, UP Board ... |
| `affiliation_no` | varchar(40) | nullable |  | printed on TCs, report cards and board forms |
| `school_code` | varchar(40) | nullable |  |  |
| `udise_code` | varchar(20) | nullable |  |  |
| `logo_url` | varchar(500) | nullable |  | overrides Organization.logoUrl |
| `weekly_off_days` | enum `WeekDay`[] | not null |  | used by attendance, leave day counts and payroll working days |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, code); Index (organization_id, status).

**Relations:** belongs to `organizations`, `countries`; has many `add_on_purchases`, `organization_settings`, `number_sequences`, `file_assets`, `import_jobs`, `export_jobs`, `user_campuses`, `audit_logs`, `courses`, `batches`, `batch_subject_teachers`, `rooms`, `holidays`, `calendar_events`, `departments`, `staff`, `students`, `enrollments`, `admission_inquiries`, `admission_applications`, `attendance_sessions`, `attendance_records`, `staff_attendance`, `leave_requests`, `student_leave_requests`, `period_slots`, `timetable_entries`, `substitutions`, `homework`, `exams`, `exam_schedules`, `report_cards`, `fee_structures`, `student_fee_assignments`, `fee_invoices`, `late_fee_rules`, `scholarship_applications`, `scholarship_awards`, `fee_reminder_logs`, `payment_gateway_accounts`, `payment_orders`, `payments`, `receipts`, `refunds`, `day_closes`, `announcements`, `message_logs`, `whats_app_accounts`, `book_copies`, `book_issues`, `inventory_items`, `purchase_orders`, `stock_transactions`, `asset_assignments`, `vehicles`, `transport_routes`, `transport_assignments`, `vehicle_trips`, `vehicle_maintenances`, `hostels`, `hostel_allocations`, `payroll_runs`, `payslips`, `payroll_adjustments`, `issued_certificates`, `certificate_requests`, `saved_reports`, `daily_metric_snapshots`, `ai_insights`, `student_risk_scores`, `student_transfers`, `ptm_bookings`, `class_sessions`, `study_materials`, `exam_marks`, `exam_re_evaluation_requests`, `tax_rates`, `fee_invoice_adjustments`, `student_discounts`, `scholarship_disbursements`, `book_reservations`, `transport_attendance`, `hostel_attendance`, `hostel_visitor_logs`, `hostel_leave_requests`, `staff_salaries`, `staff_loan_advances`, `payroll_statutory_settings`.

### organization_settings

Prisma model `OrganizationSetting`. Tenant table (filtered by `organization_id`). Key/value settings per organization, with an optional campus-level override.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (cascade on delete). null = organization-wide value |
| `key` | varchar(100) | not null |  | e.g. attendance.lock_after_hours, fees.late_fee_policy |
| `value` | jsonb | not null |  |  |
| `updated_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, campus_id, key); Index (organization_id, key).

**Relations:** belongs to `organizations`, `campuses`.

### number_sequences

Prisma model `NumberSequence`. Tenant table (filtered by `organization_id`). Gap-free counters for admission, receipt, invoice and other document numbers.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (cascade on delete). null = one series for the whole organization |
| `sequence_type` | enum `NumberSequenceType` | not null |  |  |
| `period_key` | varchar(20) | not null | "" | "2027", "2027-28", "2027-04" or "" when never reset |
| `prefix` | varchar(20) | nullable |  |  |
| `suffix` | varchar(20) | nullable |  |  |
| `format` | varchar(100) | not null | "{PREFIX}-{YYYY}-{SEQ}" | tokens: {PREFIX} {CAMPUS} {YYYY} {YY} {AY} {MM} {SEQ} {SUFFIX} |
| `pad_length` | smallint | not null | 4 |  |
| `max_length` | smallint | nullable |  | 16 for GST tax-invoice series; validated when the format is saved |
| `next_value` | integer | not null | 1 | incremented with SELECT ... FOR UPDATE inside the business transaction |
| `reset_policy` | enum `SequenceResetPolicy` | not null | NEVER |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, campus_id, sequence_type, period_key); Index (organization_id, sequence_type).

**Relations:** belongs to `organizations`, `campuses`.

### custom_field_definitions

Prisma model `CustomFieldDefinition`. Tenant table (filtered by `organization_id`). Tenant-defined extra field for students, staff, inquiries and other entities.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `entity_type` | enum `CustomFieldEntity` | not null |  |  |
| `key` | varchar(60) | not null |  | machine name, e.g. aadhaar_seeded |
| `label` | varchar(120) | not null |  |  |
| `field_type` | enum `CustomFieldType` | not null |  |  |
| `options` | jsonb | nullable |  | choices for SELECT / MULTI_SELECT: [{ value, label }] |
| `validation` | jsonb | nullable |  | { min, max, regex, maxLength } |
| `default_value` | jsonb | nullable |  |  |
| `help_text` | varchar(255) | nullable |  |  |
| `is_required` | boolean | not null | false |  |
| `show_in_list` | boolean | not null | false |  |
| `visible_to_parent` | boolean | not null | false |  |
| `sort_order` | integer | not null | 0 |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, entity_type, key); Index (organization_id, entity_type, status, sort_order).

**Relations:** belongs to `organizations`; has many `custom_field_values`.

### custom_field_values

Prisma model `CustomFieldValue`. Tenant table (filtered by `organization_id`). Value of a custom field for one entity row (polymorphic: entityType + entityId).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `definition_id` | uuid | not null |  | FK to `custom_field_definitions` (cascade on delete) |
| `entity_type` | enum `CustomFieldEntity` | not null |  |  |
| `entity_id` | uuid | not null |  | id of the Student, Staff ... row |
| `value` | jsonb | not null |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, definition_id, entity_id); Index (organization_id, entity_type, entity_id).

**Relations:** belongs to `organizations`, `custom_field_definitions`.

### file_assets

Prisma model `FileAsset`. Tenant table (filtered by `organization_id`). Metadata of a file stored in a private S3 bucket; served through pre-signed URLs. Rows are never hard-deleted: purge sets status = DELETED + deletedAt and removes only the S3 object.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (setnull on delete) |
| `bucket` | varchar(100) | not null |  |  |
| `region` | varchar(20) | not null | "ap-south-1" | AWS region of the bucket (data residency) |
| `contains_personal_data` | boolean | not null | true |  |
| `retention_until` | date | nullable |  |  |
| `s3_key` | varchar(500) | not null |  | UK. org/{orgId}/{category}/{uuid}-{name} |
| `original_name` | varchar(255) | not null |  |  |
| `mime_type` | varchar(127) | not null |  |  |
| `size_bytes` | integer | not null |  | max upload size is far below 2 GB |
| `checksum_sha256` | char(64) | nullable |  |  |
| `category` | varchar(40) | nullable |  | student-photo, student-document, homework, receipt, import, export ... |
| `owner_type` | varchar(60) | nullable |  | owning entity model name, e.g. Student, Homework |
| `owner_id` | uuid | nullable |  | id of the owning entity row |
| `visibility` | enum `FileVisibility` | not null | PRIVATE |  |
| `status` | enum `FileStatus` | not null | PENDING_UPLOAD |  |
| `uploaded_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, owner_type, owner_id); Index (organization_id, category, created_at); Index (organization_id, status, deleted_at).

**Relations:** belongs to `organizations`, `campuses`, `users`; has many `import_jobs`, `subscription_invoices`, `export_jobs`, `consent_records`, `data_subject_requests`, `staff`, `staff_documents`, `students`, `student_documents`, `admission_application_documents`, `leave_requests`, `student_leave_requests`, `homework_attachments`, `homework_submission_files`, `report_cards`, `fee_invoices`, `receipts`, `day_closes`, `whats_app_inbound_messages`, `books`, `vehicle_maintenances`, `payslips`, `certificate_templates`, `issued_certificates`, `study_materials`, `refunds`.

### import_jobs

Prisma model `ImportJob`. Tenant table (filtered by `organization_id`). Bulk Excel/CSV import run (students, staff, fee dues ...) processed by a worker.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (setnull on delete) |
| `import_type` | enum `ImportType` | not null |  |  |
| `status` | enum `JobStatus` | not null | QUEUED |  |
| `is_dry_run` | boolean | not null | false | validate only, write nothing |
| `source_file_id` | uuid | not null |  | FK to `file_assets` (restrict on delete) |
| `error_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete). generated workbook with the failed rows and reasons |
| `column_mapping` | jsonb | nullable |  | { "Excel column": "fieldName" } |
| `options` | jsonb | nullable |  | { updateExisting, academicYearId, batchId, dateFormat } |
| `total_rows` | integer | not null | 0 |  |
| `processed_rows` | integer | not null | 0 |  |
| `success_rows` | integer | not null | 0 |  |
| `failed_rows` | integer | not null | 0 |  |
| `error_message` | text | nullable |  | fatal job-level error |
| `started_at` | timestamptz | nullable |  |  |
| `finished_at` | timestamptz | nullable |  |  |
| `created_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, import_type, created_at); Index (organization_id, status).

**Relations:** belongs to `organizations`, `campuses`, `file_assets`, `users`; has many `import_job_row_errors`.

### import_job_row_errors

Prisma model `ImportJobRowError`. Tenant table (filtered by `organization_id`). One rejected row (or cell) of an import job. Append-only: no updatedAt / deletedAt.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `import_job_id` | uuid | not null |  | FK to `import_jobs` (cascade on delete) |
| `row_number` | integer | not null |  | 1-based row in the uploaded sheet |
| `column_name` | varchar(100) | nullable |  |  |
| `error_code` | varchar(60) | not null |  | e.g. REQUIRED, INVALID_DATE, DUPLICATE_ADMISSION_NO |
| `message` | varchar(500) | not null |  |  |
| `row_data` | jsonb | nullable |  | original row values for the error workbook |
| `created_at` | timestamptz | not null | now() |  |

**Indexes and constraints:** Index (organization_id, import_job_id, row_number).

**Relations:** belongs to `organizations`, `import_jobs`.

### export_jobs

Prisma model `ExportJob`. Tenant table (filtered by `organization_id`). Asynchronous export of a list or report to Excel/CSV/PDF; file link expires.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (setnull on delete) |
| `export_type` | varchar(80) | not null |  | e.g. students.list, fees.defaulters, attendance.monthly |
| `format` | enum `FileFormat` | not null | XLSX |  |
| `filters` | jsonb | nullable |  | the list filters that were active when the export was requested |
| `columns` | jsonb | nullable |  | selected columns |
| `status` | enum `JobStatus` | not null | QUEUED |  |
| `file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete) |
| `row_count` | integer | nullable |  |  |
| `error_message` | text | nullable |  |  |
| `started_at` | timestamptz | nullable |  |  |
| `finished_at` | timestamptz | nullable |  |  |
| `expires_at` | timestamptz | nullable |  | file is purged after this time |
| `requested_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, requested_by_id, created_at); Index (organization_id, status).

**Relations:** belongs to `organizations`, `campuses`, `file_assets`, `users`.

### Enums in 01-platform.prisma

| Enum | Values | Meaning |
|---|---|---|
| `OrganizationStatus` | TRIAL, ACTIVE, PAST_DUE, SUSPENDED, CANCELLED |  |
| `SubscriptionStatus` | TRIALING, ACTIVE, PAST_DUE, PAUSED, CANCELLED, EXPIRED |  |
| `SubscriptionInvoiceStatus` | DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE, REFUNDED |  |
| `AddOnType` | EXTRA_CAMPUS, AI_INSIGHTS, WHITE_LABEL_APP, WHATSAPP_CREDITS, SMS_CREDITS, DATA_MIGRATION, ONSITE_TRAINING |  |
| `AddOnStatus` | PENDING, ACTIVE, CONSUMED, EXPIRED, CANCELLED |  |
| `NumberSequenceType` | ADMISSION_NO, APPLICATION_NO, INQUIRY_NO, ROLL_NO, EMPLOYEE_CODE, FEE_INVOICE_NO, RECEIPT_NO, REFUND_NO, CERTIFICATE_NO, PAYSLIP_NO, PURCHASE_ORDER_NO, LIBRARY_ACCESSION_NO, CREDIT_NOTE_NO, DSR_REQUEST_NO, OTHER |  |
| `SequenceResetPolicy` | NEVER, CALENDAR_YEAR, ACADEMIC_YEAR, FINANCIAL_YEAR, MONTHLY |  |
| `CustomFieldEntity` | STUDENT, GUARDIAN, STAFF, ADMISSION_INQUIRY, ADMISSION_APPLICATION, COURSE, BATCH |  |
| `CustomFieldType` | TEXT, TEXTAREA, NUMBER, DATE, BOOLEAN, SELECT, MULTI_SELECT, PHONE, EMAIL, URL, FILE |  |
| `FileVisibility` | PRIVATE, ORGANIZATION, PUBLIC |  |
| `FileStatus` | PENDING_UPLOAD, ACTIVE, QUARANTINED, DELETED |  |
| `ImportType` | STUDENTS, GUARDIANS, STAFF, ENROLLMENTS, INQUIRIES, ATTENDANCE, FEE_DUES, FEE_PAYMENTS, EXAM_MARKS, LIBRARY_BOOKS, INVENTORY_ITEMS, OTHER |  |

## Authentication, RBAC, audit and consent

Schema file `server/prisma/schema/02-auth.prisma` — 17 tables and 19 enums.

### users

Prisma model `User`. Tenant table (filtered by `organization_id`). Login account. One row per person per organization and user type; PLATFORM users have no organization. SQL migration adds: CHECK ((user_type = 'PLATFORM') = (organization_id IS NULL)) so a tenant user can never have a NULL organization.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | nullable |  | FK to `organizations` (restrict on delete). null ONLY for userType PLATFORM |
| `user_type` | enum `UserType` | not null |  |  |
| `status` | enum `UserStatus` | not null | INVITED |  |
| `email` | varchar(255) | nullable |  | stored lower-case; optional for OTP-only parents |
| `email_verified_at` | timestamptz | nullable |  |  |
| `phone` | varchar(20) | nullable |  | E.164, e.g. +919876543210 |
| `phone_verified_at` | timestamptz | nullable |  |  |
| `password_hash` | varchar(100) | nullable |  | bcrypt; null for OTP-only accounts |
| `password_changed_at` | timestamptz | nullable |  |  |
| `must_change_password` | boolean | not null | false |  |
| `first_name` | varchar(80) | not null |  |  |
| `last_name` | varchar(80) | nullable |  |  |
| `avatar_url` | varchar(500) | nullable |  |  |
| `locale` | varchar(10) | nullable |  | null = inherit Campus.locale, then Organization.locale |
| `timezone` | varchar(64) | nullable |  |  |
| `analytics_opt_out` | boolean | not null | false | forced true for minors: no tracking of children (DPDP s.9, COPPA) |
| `anonymized_at` | timestamptz | nullable |  | PII overwritten after an approved deletion request; row kept for legal retention |
| `mfa_enabled` | boolean | not null | false |  |
| `mfa_method` | enum `MfaMethod` | nullable |  |  |
| `mfa_secret_encrypted` | text | nullable |  | AES-256-GCM encrypted TOTP secret |
| `mfa_recovery_codes` | jsonb | nullable |  | array of bcrypt-hashed one-time codes |
| `failed_login_count` | integer | not null | 0 |  |
| `locked_until` | timestamptz | nullable |  |  |
| `last_login_at` | timestamptz | nullable |  |  |
| `last_login_ip` | varchar(45) | nullable |  |  |
| `notification_prefs` | jsonb | nullable |  | per-channel opt-in/opt-out |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, user_type, email); Unique (organization_id, user_type, phone); Index (organization_id, email); Index (organization_id, phone); Index (organization_id, user_type, status); Index (email); Index (phone).

**Relations:** belongs to `organizations`, `staff`, `students`, `guardians`; has many `user_roles`, `user_campuses`, `refresh_tokens`, `password_reset_tokens`, `invitations`, `data_subject_requests`, `student_leave_requests`, `file_assets`, `import_jobs`, `export_jobs`, `otp_codes`, `login_histories`, `audit_logs`, `api_keys`, `consent_records`, `student_notes`, `student_status_histories`, `admission_inquiries`, `inquiry_follow_ups`, `admission_applications`, `attendance_sessions`, `leave_requests`, `leave_approval_steps`, `exam_marks`, `day_closes`, `certificate_requests`, `report_card_remarks`, `student_discounts`, `scholarship_applications`, `scholarship_awards`, `payment_orders`, `payments`, `receipts`, `refunds`, `notifications`, `notification_preferences`, `announcements`, `announcement_recipients`, `device_tokens`, `purchase_orders`, `payroll_runs`, `staff_loan_advances`, `payroll_adjustments`, `issued_certificates`, `saved_reports`, `dashboard_preferences`, `ai_query_logs`, `exam_re_evaluation_requests`, `student_transfers`, `fee_invoice_adjustments`.

### roles

Prisma model `Role`. Tenant table (filtered by `organization_id`). Role: the seven system roles (organizationId null, isSystem true) or a tenant's custom role. SQL migration adds: CHECK (is_system = (organization_id IS NULL)).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | nullable |  | FK to `organizations` (cascade on delete). null ONLY for system roles shared by all tenants |
| `key` | varchar(50) | not null |  | SUPER_ADMIN, ORG_ADMIN, PRINCIPAL, TEACHER, ACCOUNTANT, PARENT, STUDENT or custom e.g. LIBRARIAN |
| `name` | varchar(80) | not null |  |  |
| `description` | varchar(255) | nullable |  |  |
| `is_system` | boolean | not null | false | system roles cannot be edited or deleted |
| `user_type` | enum `UserType` | not null | STAFF | which kind of user may hold the role |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, key); Index (organization_id, status).

**Relations:** belongs to `organizations`; has many `role_permissions`, `user_roles`, `invitations`.

### permissions

Prisma model `Permission`. Platform table (shared by all tenants, no `organization_id`). Platform-level catalogue of permission keys in module.action form (students.create, fees.collect).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `key` | varchar(80) | not null |  | UK. module.action |
| `resource` | varchar(40) | not null |  | part before the dot, e.g. students |
| `action` | varchar(40) | not null |  | part after the dot, e.g. create |
| `module` | enum `ModuleCode` | nullable |  | product module that owns the permission (plan gating) |
| `name` | varchar(120) | not null |  |  |
| `description` | varchar(255) | nullable |  |  |
| `sort_order` | integer | not null | 0 |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (module); Index (resource).

**Relations:** has many `role_permissions`.

### role_permissions

Prisma model `RolePermission`. Tenant table (filtered by `organization_id`). Permission granted to a role, with the data scope (all / campus / own / view).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | nullable |  | FK to `organizations` (cascade on delete). mirrors Role.organizationId; null for system roles |
| `role_id` | uuid | not null |  | FK to `roles` (cascade on delete) |
| `permission_id` | uuid | not null |  | FK to `permissions` (cascade on delete) |
| `scope` | enum `PermissionScope` | not null | ALL |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (role_id, permission_id); Index (organization_id, role_id).

**Relations:** belongs to `organizations`, `roles`, `permissions`.

### user_roles

Prisma model `UserRole`. Tenant table (filtered by `organization_id`). Role assigned to a user. Campus reach comes from UserCampus. The service (and a trigger in the SQL migration) verifies role.organization_id IS NULL OR role.organization_id = user_roles.organization_id.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | nullable |  | FK to `organizations` (cascade on delete). null ONLY for PLATFORM users |
| `user_id` | uuid | not null |  | FK to `users` (cascade on delete) |
| `role_id` | uuid | not null |  | FK to `roles` (restrict on delete) |
| `assigned_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (user_id, role_id); Index (organization_id, role_id); Index (organization_id, user_id).

**Relations:** belongs to `organizations`, `users`, `roles`.

### user_campuses

Prisma model `UserCampus`. Tenant table (filtered by `organization_id`). Campuses a user may work in (ORG_ADMIN sees all campuses without rows here).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `user_id` | uuid | not null |  | FK to `users` (cascade on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (cascade on delete) |
| `is_default` | boolean | not null | false | campus selected after login |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (user_id, campus_id); Index (organization_id, campus_id).

**Relations:** belongs to `organizations`, `users`, `campuses`.

### refresh_tokens

Prisma model `RefreshToken`. Tenant table (filtered by `organization_id`). Rotating refresh token (30 days), stored as a SHA-256 hash. One family per login session.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | nullable |  | FK to `organizations` (cascade on delete). null for PLATFORM users |
| `user_id` | uuid | not null |  | FK to `users` (cascade on delete) |
| `token_hash` | char(64) | not null |  | UK. SHA-256 hex of the opaque token |
| `family_id` | uuid | not null |  | same for every rotation of one login; reuse of a rotated token revokes the family |
| `replaced_by_token_id` | uuid | nullable |  | next token in the rotation chain |
| `device_id` | varchar(100) | nullable |  |  |
| `device_name` | varchar(150) | nullable |  |  |
| `platform` | enum `DevicePlatform` | not null | WEB |  |
| `user_agent` | varchar(500) | nullable |  |  |
| `ip_address` | varchar(45) | nullable |  |  |
| `expires_at` | timestamptz | not null |  |  |
| `last_used_at` | timestamptz | nullable |  |  |
| `revoked_at` | timestamptz | nullable |  |  |
| `revoked_reason` | enum `TokenRevokeReason` | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, user_id); Index (user_id, revoked_at); Index (family_id); Index (expires_at).

**Relations:** belongs to `organizations`, `users`.

### otp_codes

Prisma model `OtpCode`. Tenant table (filtered by `organization_id`). One-time code for OTP login, phone/email verification, MFA and consent verification.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | nullable |  | FK to `organizations` (cascade on delete). null when the tenant is not resolved yet |
| `user_id` | uuid | nullable |  | FK to `users` (cascade on delete) |
| `identifier` | varchar(255) | not null |  | phone (E.164) or email the code was sent to |
| `channel` | enum `Channel` | not null |  |  |
| `purpose` | enum `OtpPurpose` | not null |  |  |
| `code_hash` | varchar(100) | not null |  | bcrypt hash of the 6-digit code |
| `attempts` | smallint | not null | 0 |  |
| `max_attempts` | smallint | not null | 5 |  |
| `expires_at` | timestamptz | not null |  |  |
| `consumed_at` | timestamptz | nullable |  |  |
| `ip_address` | varchar(45) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, identifier, purpose); Index (identifier, purpose, created_at); Index (expires_at).

**Relations:** belongs to `organizations`, `users`.

### password_reset_tokens

Prisma model `PasswordResetToken`. Tenant table (filtered by `organization_id`). Single-use password reset link token (hashed, short expiry).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | nullable |  | FK to `organizations` (cascade on delete). null for PLATFORM users |
| `user_id` | uuid | not null |  | FK to `users` (cascade on delete) |
| `token_hash` | char(64) | not null |  | UK |
| `expires_at` | timestamptz | not null |  |  |
| `used_at` | timestamptz | nullable |  |  |
| `ip_address` | varchar(45) | nullable |  |  |
| `user_agent` | varchar(500) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, user_id).

**Relations:** belongs to `organizations`, `users`.

### invitations

Prisma model `Invitation`. Tenant table (filtered by `organization_id`). Invitation sent to a staff member, parent or student to create their login.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `email` | varchar(255) | nullable |  |  |
| `phone` | varchar(20) | nullable |  |  |
| `user_type` | enum `UserType` | not null |  |  |
| `role_id` | uuid | not null |  | FK to `roles` (restrict on delete) |
| `campus_ids` | uuid[] | not null |  | campuses granted on acceptance |
| `linked_entity` | varchar(20) | nullable |  | Staff, Guardian or Student profile to link on acceptance |
| `linked_entity_id` | uuid | nullable |  |  |
| `token_hash` | char(64) | not null |  | UK |
| `status` | enum `InvitationStatus` | not null | PENDING |  |
| `message` | varchar(500) | nullable |  |  |
| `expires_at` | timestamptz | not null |  |  |
| `accepted_at` | timestamptz | nullable |  |  |
| `invited_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `accepted_user_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, status, created_at); Index (organization_id, email); Index (organization_id, phone).

**Relations:** belongs to `organizations`, `roles`, `users`.

### login_histories

Prisma model `LoginHistory`. Tenant table (filtered by `organization_id`). Every login attempt (success or failure). Append-only: no updatedAt / deletedAt.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | nullable |  | FK to `organizations` (cascade on delete). null when the tenant could not be resolved or for PLATFORM users |
| `user_id` | uuid | nullable |  | FK to `users` (setnull on delete). null when the identifier matched no account |
| `identifier` | varchar(255) | not null |  | email or phone that was typed |
| `method` | enum `LoginMethod` | not null |  |  |
| `result` | enum `LoginResult` | not null |  |  |
| `failure_reason` | varchar(100) | nullable |  |  |
| `platform` | enum `DevicePlatform` | not null | WEB |  |
| `ip_address` | varchar(45) | nullable |  |  |
| `user_agent` | varchar(500) | nullable |  |  |
| `geo_country` | char(2) | nullable |  |  |
| `geo_city` | varchar(100) | nullable |  |  |
| `request_id` | varchar(64) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |

**Indexes and constraints:** Index (organization_id, user_id, created_at); Index (organization_id, created_at); Index (identifier, created_at).

**Relations:** belongs to `organizations`, `users`.

### audit_logs

Prisma model `AuditLog`. Tenant table (filtered by `organization_id`). Immutable trail of who changed what. Append-only: no updatedAt / deletedAt.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | nullable |  | FK to `organizations` (restrict on delete). null only for platform-console actions |
| `campus_id` | uuid | nullable |  | FK to `campuses` (setnull on delete) |
| `actor_type` | enum `AuditActorType` | not null | USER |  |
| `actor_user_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `actor_label` | varchar(200) | nullable |  | name + role key frozen at write time (survives user deletion) |
| `actor_role_keys` | text[] | not null |  |  |
| `impersonator_user_id` | uuid | nullable |  | SUPER_ADMIN user id when actorType is IMPERSONATION (no FK) |
| `outcome` | enum `AuditOutcome` | not null | SUCCESS |  |
| `reason` | varchar(500) | nullable |  | mandatory for money overrides: receipt cancel, late-fee waiver, write-off |
| `is_sensitive_read` | boolean | not null | false | disclosure log (FERPA): a read of sensitive data |
| `prev_hash` | char(64) | nullable |  |  |
| `row_hash` | char(64) | nullable |  | SHA-256 chain per organization (tamper evidence) |
| `api_key_id` | uuid | nullable |  | FK to `api_keys` (setnull on delete) |
| `action` | varchar(80) | not null |  | permission-style verb, e.g. students.update, fees.receipt.cancel |
| `entity_type` | varchar(60) | not null |  | model name, e.g. Student |
| `entity_id` | uuid | nullable |  |  |
| `entity_label` | varchar(200) | nullable |  | human-readable snapshot, e.g. "Aarav Sharma (BF-2027-0142)" |
| `before` | jsonb | nullable |  | state before the change (sensitive fields masked) |
| `after` | jsonb | nullable |  | state after the change (sensitive fields masked) |
| `changed_fields` | text[] | not null |  |  |
| `metadata` | jsonb | nullable |  |  |
| `ip_address` | varchar(45) | nullable |  |  |
| `user_agent` | varchar(500) | nullable |  |  |
| `request_id` | varchar(64) | nullable |  | same id as in the API error envelope and Pino logs |
| `created_at` | timestamptz | not null | now() |  |

**Indexes and constraints:** Index (organization_id, created_at); Index (organization_id, campus_id, created_at); Index (organization_id, entity_type, entity_id); Index (organization_id, actor_user_id, created_at); Index (organization_id, action, created_at); Index (request_id).

**Relations:** belongs to `organizations`, `campuses`, `users`, `api_keys`.

### api_keys

Prisma model `ApiKey`. Tenant table (filtered by `organization_id`). API key for Enterprise integrations; only the hash is stored, the prefix identifies the key.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `name` | varchar(100) | not null |  |  |
| `key_prefix` | varchar(16) | not null |  | first characters shown in the UI, e.g. ef_live_8f3a |
| `key_hash` | char(64) | not null |  | UK. SHA-256 hex of the full key |
| `scopes` | text[] | not null |  | permission keys the key may use |
| `allowed_ips` | text[] | not null |  | optional CIDR allow-list |
| `rate_limit_per_min` | integer | not null | 100 |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `last_used_at` | timestamptz | nullable |  |  |
| `last_used_ip` | varchar(45) | nullable |  |  |
| `expires_at` | timestamptz | nullable |  |  |
| `revoked_at` | timestamptz | nullable |  |  |
| `created_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, name); Index (organization_id, status).

**Relations:** belongs to `organizations`, `users`; has many `audit_logs`.

### policy_documents

Prisma model `PolicyDocument`. Tenant table (filtered by `organization_id`). Versioned text of a privacy notice / policy per language; the exact notice a consent refers to.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | nullable |  | FK to `organizations` (restrict on delete). null = EduFlow platform policy shown to every tenant |
| `consent_type` | enum `ConsentType` | not null |  |  |
| `version` | varchar(20) | not null |  |  |
| `language` | varchar(10) | not null | "en" |  |
| `title` | varchar(200) | not null |  |  |
| `body` | text | not null |  |  |
| `content_hash` | char(64) | not null |  | SHA-256 of body |
| `effective_from` | timestamptz | not null |  |  |
| `retired_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, consent_type, version, language); Index (organization_id, consent_type, effective_from).

**Relations:** belongs to `organizations`; has many `consent_records`.

### data_breach_incidents

Prisma model `DataBreachIncident`. Tenant table (filtered by `organization_id`). Personal-data breach register: scope, containment and notification times (GDPR 72 h, NDB scheme, DPDP Board).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | nullable |  | FK to `organizations` (restrict on delete). null = platform-wide incident |
| `incident_no` | varchar(30) | not null |  | UK |
| `title` | varchar(200) | not null |  |  |
| `description` | text | not null |  |  |
| `severity` | enum `BreachSeverity` | not null |  |  |
| `status` | enum `BreachStatus` | not null | DETECTED |  |
| `data_categories` | text[] | not null |  |  |
| `affected_subject_count` | integer | nullable |  |  |
| `involves_children_data` | boolean | not null | false |  |
| `occurred_at` | timestamptz | nullable |  |  |
| `detected_at` | timestamptz | not null |  |  |
| `contained_at` | timestamptz | nullable |  |  |
| `regulator_notify_due_at` | timestamptz | nullable |  |  |
| `regulator_notified_at` | timestamptz | nullable |  |  |
| `tenant_notified_at` | timestamptz | nullable |  |  |
| `subjects_notified_at` | timestamptz | nullable |  |  |
| `regulations` | text[] | not null |  | DPDP, GDPR, NDB, PDPL ... |
| `root_cause` | text | nullable |  |  |
| `remediation` | text | nullable |  |  |
| `reported_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, status, detected_at).

**Relations:** belongs to `organizations`.

### consent_records

Prisma model `ConsentRecord`. Tenant table (filtered by `organization_id`). Proof of consent (DPDP / GDPR / COPPA): who agreed to what, for which child, and how it was verified.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `consent_type` | enum `ConsentType` | not null |  |  |
| `status` | enum `ConsentStatus` | not null | GRANTED |  |
| `given_by_user_id` | uuid | nullable |  | FK to `users` (setnull on delete). login that gave the consent |
| `guardian_id` | uuid | nullable |  | FK to `guardians` (setnull on delete). parent giving consent for a child |
| `student_id` | uuid | nullable |  | FK to `students` (setnull on delete). the child whose data is covered |
| `policy_version` | varchar(20) | not null |  | version of the notice shown |
| `policy_document_id` | uuid | nullable |  | FK to `policy_documents` (restrict on delete). exact notice text + language that was shown |
| `inquiry_id` | uuid | nullable |  | FK to `admission_inquiries` (setnull on delete). consent collected from an admission lead |
| `subject_is_minor` | boolean | not null | false |  |
| `verification_reference` | varchar(100) | nullable |  | DigiLocker transaction / signed-form id |
| `otp_code_id` | uuid | nullable |  | OtpCode used for verification (no FK; OTP rows are purged) |
| `withdrawn_by_user_id` | uuid | nullable |  | User id (audit only, no FK) |
| `withdrawal_reason` | varchar(255) | nullable |  |  |
| `notice_language` | varchar(10) | not null | "en" |  |
| `purposes` | jsonb | nullable |  | itemised purposes shown in the notice |
| `regulation` | varchar(20) | nullable |  | DPDP, GDPR, COPPA, FERPA, PDPL, APP |
| `verification_method` | enum `ConsentVerificationMethod` | nullable |  |  |
| `verified_at` | timestamptz | nullable |  |  |
| `evidence_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete). scanned signed form |
| `ip_address` | varchar(45) | nullable |  |  |
| `user_agent` | varchar(500) | nullable |  |  |
| `granted_at` | timestamptz | not null | now() |  |
| `withdrawn_at` | timestamptz | nullable |  |  |
| `expires_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, student_id, consent_type); Index (organization_id, guardian_id, consent_type); Index (organization_id, given_by_user_id); Index (organization_id, consent_type, status).

**Relations:** belongs to `organizations`, `users`, `guardians`, `students`, `file_assets`, `policy_documents`, `admission_inquiries`.

### data_subject_requests

Prisma model `DataSubjectRequest`. Tenant table (filtered by `organization_id`). Privacy request from a data subject: access, export, correction or deletion of personal data.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `request_no` | varchar(30) | not null |  |  |
| `request_type` | enum `DataSubjectRequestType` | not null |  |  |
| `status` | enum `DataSubjectRequestStatus` | not null | RECEIVED |  |
| `subject_type` | enum `DataSubjectType` | not null |  |  |
| `subject_id` | uuid | not null |  | id of the User / Student / Guardian / Staff row |
| `requested_by_id` | uuid | nullable |  | FK to `users` (setnull on delete). e.g. the parent asking on behalf of a child |
| `requester_name` | varchar(160) | nullable |  | requester without a login (former parent, alumni) |
| `requester_email` | varchar(255) | nullable |  |  |
| `requester_phone` | varchar(20) | nullable |  |  |
| `requester_relation` | varchar(40) | nullable |  |  |
| `channel` | varchar(20) | nullable |  | PORTAL \| EMAIL \| LETTER \| PHONE |
| `regulation` | varchar(20) | nullable |  | DPDP, GDPR, FERPA, PDPL, APP |
| `description` | text | nullable |  |  |
| `received_at` | timestamptz | not null | now() |  |
| `acknowledged_at` | timestamptz | nullable |  |  |
| `due_date` | date | not null |  | statutory deadline |
| `extended_due_date` | date | nullable |  | GDPR allows +2 months |
| `extension_reason` | varchar(500) | nullable |  |  |
| `identity_verification_method` | enum `ConsentVerificationMethod` | nullable |  |  |
| `identity_verified_at` | timestamptz | nullable |  |  |
| `actions_taken` | jsonb | nullable |  | [{ entity, action: ERASED\|ANONYMISED\|RETAINED, legalBasis }] |
| `handled_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `resolution_notes` | text | nullable |  |  |
| `rejection_reason` | varchar(500) | nullable |  |  |
| `export_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete). data package for ACCESS / EXPORT requests |
| `completed_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, request_no); Index (organization_id, status, due_date); Index (organization_id, subject_type, subject_id).

**Relations:** belongs to `organizations`, `users`, `file_assets`.

### Enums in 02-auth.prisma

| Enum | Values | Meaning |
|---|---|---|
| `UserType` | STAFF, PARENT, STUDENT, PLATFORM |  |
| `UserStatus` | INVITED, ACTIVE, SUSPENDED, LOCKED, DEACTIVATED |  |
| `MfaMethod` | TOTP, SMS, EMAIL |  |
| `PermissionScope` | ALL, CAMPUS, OWN, VIEW | Data scope granted with a permission; maps to the RBAC matrix cells Yes / Campus / Own / View. |
| `TokenRevokeReason` | LOGOUT, ROTATED, REUSE_DETECTED, PASSWORD_CHANGED, ADMIN_REVOKED, USER_DEACTIVATED |  |
| `OtpPurpose` | LOGIN, VERIFY_PHONE, VERIFY_EMAIL, PASSWORD_RESET, MFA, CONSENT_VERIFICATION |  |
| `InvitationStatus` | PENDING, ACCEPTED, EXPIRED, REVOKED |  |
| `LoginMethod` | PASSWORD, OTP, SSO, API_KEY |  |
| `LoginResult` | SUCCESS, FAILED, LOCKED, MFA_REQUIRED, MFA_FAILED |  |
| `AuditActorType` | USER, SYSTEM, API_KEY, IMPERSONATION |  |
| `ConsentType` | TERMS_OF_SERVICE, PRIVACY_POLICY, DATA_PROCESSING, CHILD_DATA_PROCESSING, COMMUNICATION_WHATSAPP, COMMUNICATION_SMS, COMMUNICATION_EMAIL, PHOTO_MEDIA, THIRD_PARTY_SHARING |  |
| `ConsentStatus` | GRANTED, WITHDRAWN, EXPIRED |  |
| `ConsentVerificationMethod` | OTP, EMAIL_LINK, SIGNED_FORM, IN_PERSON, DIGILOCKER |  |
| `DataSubjectRequestType` | ACCESS, EXPORT, CORRECTION, DELETION, RESTRICT_PROCESSING, WITHDRAW_CONSENT, OBJECTION, NOMINATION, GRIEVANCE |  |
| `AuditOutcome` | SUCCESS, DENIED, FAILED | Result of an audited action; DENIED / FAILED attempts on money actions are logged too. |
| `BreachSeverity` | LOW, MEDIUM, HIGH, CRITICAL |  |
| `BreachStatus` | DETECTED, INVESTIGATING, CONTAINED, NOTIFIED, CLOSED |  |
| `DataSubjectRequestStatus` | RECEIVED, IDENTITY_VERIFICATION, IN_PROGRESS, COMPLETED, REJECTED, CANCELLED |  |
| `DataSubjectType` | USER, STUDENT, GUARDIAN, STAFF |  |

## People and admissions

Schema file `server/prisma/schema/04-people.prisma` — 19 tables and 22 enums.

### departments

Prisma model `Department`. Tenant table (filtered by `organization_id`). Staff department, e.g. Science, Accounts, Administration.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (restrict on delete). null = organization-wide department |
| `name` | varchar(100) | not null |  |  |
| `code` | varchar(30) | not null |  |  |
| `head_staff_id` | uuid | nullable |  | FK to `staff` (setnull on delete) |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, code); Index (organization_id, campus_id, status).

**Relations:** belongs to `organizations`, `campuses`, `staff`; has many `staff`.

### designations

Prisma model `Designation`. Tenant table (filtered by `organization_id`). Job title, e.g. PGT Mathematics, Accountant, Front Desk Executive.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `name` | varchar(100) | not null |  |  |
| `staff_type` | enum `StaffType` | nullable |  | null = usable for both |
| `level` | smallint | nullable |  | seniority ordering, 1 = most senior |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, name); Index (organization_id, status).

**Relations:** belongs to `organizations`; has many `staff`.

### staff

Prisma model `Staff`. Tenant table (filtered by `organization_id`). Employee profile (teacher or non-teaching). The login lives in User and is linked by userId.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete). home campus; extra campuses come from UserCampus |
| `user_id` | uuid | nullable |  | UK. FK to `users` (setnull on delete). linked login; null until invited |
| `employee_code` | varchar(30) | not null |  |  |
| `staff_type` | enum `StaffType` | not null |  |  |
| `employment_type` | enum `EmploymentType` | not null | FULL_TIME |  |
| `status` | enum `StaffStatus` | not null | ACTIVE |  |
| `first_name` | varchar(80) | not null |  |  |
| `last_name` | varchar(80) | nullable |  |  |
| `gender` | enum `Gender` | nullable |  |  |
| `date_of_birth` | date | nullable |  |  |
| `blood_group` | enum `BloodGroup` | nullable |  |  |
| `email` | varchar(255) | nullable |  |  |
| `phone` | varchar(20) | not null |  | E.164 |
| `alternate_phone` | varchar(20) | nullable |  |  |
| `photo_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete) |
| `department_id` | uuid | nullable |  | FK to `departments` (setnull on delete) |
| `designation_id` | uuid | nullable |  | FK to `designations` (setnull on delete) |
| `reports_to_id` | uuid | nullable |  | FK to `staff` (setnull on delete). manager; first approver in the leave chain |
| `joining_date` | date | not null |  |  |
| `confirmation_date` | date | nullable |  | end of probation |
| `qualification` | varchar(255) | nullable |  | e.g. M.Sc. Physics, B.Ed. |
| `specialization` | varchar(255) | nullable |  |  |
| `experience_years` | decimal(4,1) | nullable |  | before joining |
| `address_line1` | varchar(200) | nullable |  |  |
| `address_line2` | varchar(200) | nullable |  |  |
| `city` | varchar(100) | nullable |  |  |
| `state` | varchar(100) | nullable |  |  |
| `postal_code` | varchar(20) | nullable |  |  |
| `country_code` | char(2) | nullable |  |  |
| `emergency_contact_name` | varchar(120) | nullable |  |  |
| `emergency_contact_phone` | varchar(20) | nullable |  |  |
| `bank_details_encrypted` | text | nullable |  | AES-256-GCM ciphertext of { accountName, accountNo, ifsc, bankName }; never returned in list APIs |
| `bank_account_last4` | varchar(4) | nullable |  | safe to display |
| `tax_id_encrypted` | text | nullable |  | PAN / TFN / SSN ciphertext |
| `national_id_encrypted` | text | nullable |  | Aadhaar / Emirates ID ciphertext |
| `uan` | varchar(12) | nullable |  | India PF Universal Account Number (lifetime id of the employee) |
| `pf_member_id` | varchar(30) | nullable |  | PF member id under this establishment |
| `esi_ip_number` | varchar(20) | nullable |  | ESI insured person number |
| `statutory_ids_encrypted` | text | nullable |  | ciphertext of { superFundUsi, superMemberNo, tfn, ssn, molPersonId, iban } |
| `notice_period_days` | smallint | nullable |  |  |
| `resignation_date` | date | nullable |  |  |
| `exit_date` | date | nullable |  |  |
| `exit_reason` | varchar(255) | nullable |  |  |
| `anonymized_at` | timestamptz | nullable |  | PII overwritten after an approved deletion request; row kept for financial/legal retention |
| `retention_until` | date | nullable |  |  |
| `custom_fields` | jsonb | nullable |  | cached CustomFieldValue rows |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, employee_code); Index (organization_id, campus_id, staff_type, status); Index (organization_id, department_id); Index (organization_id, phone); Index (organization_id, first_name, last_name); Index (first_name, last_name, employee_code) `idx_staff_search_trgm`.

**Relations:** belongs to `organizations`, `campuses`, `users`, `file_assets`, `departments`, `designations`, `staff`, `driver_profiles`; has many `staff`, `departments`, `staff_documents`, `teacher_subjects`, `batches`, `batch_subject_teachers`, `leave_requests`, `substitutions`, `staff_attendance`, `leave_balances`, `timetable_entries`, `homework`, `homework_submissions`, `vehicles`, `vehicle_trips`, `exam_schedules`, `book_issues`, `stock_transactions`, `asset_assignments`, `hostels`, `staff_salaries`, `payslips`, `staff_loan_advances`, `payroll_adjustments`, `ptm_bookings`, `staff_status_histories`, `class_sessions`, `study_materials`, `payments`, `book_reservations`, `staff_tax_declarations`.

### staff_documents

Prisma model `StaffDocument`. Tenant table (filtered by `organization_id`). Document uploaded for a staff member (ID proof, degree, contract).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `staff_id` | uuid | not null |  | FK to `staff` (cascade on delete) |
| `document_type` | enum `StaffDocumentType` | not null |  |  |
| `title` | varchar(150) | not null |  |  |
| `document_no_encrypted` | text | nullable |  | AES-256-GCM ciphertext (Aadhaar, PAN, passport, bank account); never plain |
| `document_no_last4` | varchar(4) | nullable |  | safe to display |
| `file_id` | uuid | not null |  | FK to `file_assets` (restrict on delete) |
| `issued_on` | date | nullable |  |  |
| `expires_on` | date | nullable |  |  |
| `is_verified` | boolean | not null | false |  |
| `verified_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `verified_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, staff_id); Index (organization_id, expires_on).

**Relations:** belongs to `organizations`, `staff`, `file_assets`.

### teacher_subjects

Prisma model `TeacherSubject`. Tenant table (filtered by `organization_id`). Subjects a teacher is qualified to teach (used when assigning batches and substitutions).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `staff_id` | uuid | not null |  | FK to `staff` (cascade on delete) |
| `subject_id` | uuid | not null |  | FK to `subjects` (cascade on delete) |
| `is_primary` | boolean | not null | false | main subject of the teacher |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, staff_id, subject_id); Index (organization_id, subject_id).

**Relations:** belongs to `organizations`, `staff`, `subjects`.

### students

Prisma model `Student`. Tenant table (filtered by `organization_id`). Student master record. Batch membership per year lives in Enrollment.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `user_id` | uuid | nullable |  | UK. FK to `users` (setnull on delete). linked Student Portal login; optional |
| `family_id` | uuid | nullable |  | FK to `families` (setnull on delete). household; groups siblings |
| `admission_no` | varchar(30) | not null |  | e.g. BF-2027-0142, from NumberSequence |
| `roll_no` | varchar(20) | nullable |  | copy of the roll number in the current primary enrollment |
| `status` | enum `StudentStatus` | not null | ACTIVE |  |
| `first_name` | varchar(80) | not null |  |  |
| `middle_name` | varchar(80) | nullable |  |  |
| `last_name` | varchar(80) | nullable |  |  |
| `date_of_birth` | date | not null |  |  |
| `gender` | enum `Gender` | not null |  |  |
| `blood_group` | enum `BloodGroup` | nullable |  |  |
| `category` | enum `StudentCategory` | nullable |  | optional; asked only where the institute needs it |
| `admission_type` | enum `AdmissionType` | not null | NEW |  |
| `admission_quota` | enum `AdmissionQuota` | not null | GENERAL | RTE / staff ward ... drives fee rules and government returns |
| `is_minority` | boolean | not null | false |  |
| `is_bpl` | boolean | not null | false | below poverty line; used by scholarship criteria |
| `pen_number` | varchar(20) | nullable |  | UDISE+ Permanent Education Number |
| `apaar_id` | varchar(20) | nullable |  |  |
| `board_registration_no` | varchar(40) | nullable |  |  |
| `house` | varchar(40) | nullable |  | school house for sports and report cards |
| `rfid_card_no` | varchar(40) | nullable |  | RFID / QR card used for gate attendance |
| `religion` | varchar(40) | nullable |  |  |
| `nationality` | varchar(60) | nullable |  |  |
| `mother_tongue` | varchar(40) | nullable |  |  |
| `national_id_encrypted` | text | nullable |  | Aadhaar / passport ciphertext (AES-256-GCM) |
| `email` | varchar(255) | nullable |  |  |
| `phone` | varchar(20) | nullable |  |  |
| `address_line1` | varchar(200) | nullable |  |  |
| `address_line2` | varchar(200) | nullable |  |  |
| `city` | varchar(100) | nullable |  |  |
| `state` | varchar(100) | nullable |  |  |
| `postal_code` | varchar(20) | nullable |  |  |
| `country_code` | char(2) | nullable |  |  |
| `permanent_address` | jsonb | nullable |  | only when different from the current address |
| `photo_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete) |
| `admission_date` | date | not null |  |  |
| `readmitted_on` | date | nullable |  |  |
| `admitted_course_id` | uuid | nullable |  | FK to `courses` (setnull on delete). class at first admission, printed on the TC |
| `current_batch_id` | uuid | nullable |  | FK to `batches` (setnull on delete). denormalised from the active primary enrollment for fast lists |
| `previous_school` | varchar(200) | nullable |  |  |
| `previous_class` | varchar(60) | nullable |  |  |
| `previous_tc_no` | varchar(40) | nullable |  | TC number of the previous school |
| `medical_notes_encrypted` | text | nullable |  | allergies, conditions; AES-256-GCM, decrypted only for users with students.medical.view; never copied into AuditLog |
| `status_changed_at` | timestamptz | nullable |  |  |
| `leaving_date` | date | nullable |  |  |
| `leaving_reason` | varchar(255) | nullable |  |  |
| `tc_no` | varchar(40) | nullable |  | transfer certificate register number issued by us |
| `tc_issued_on` | date | nullable |  |  |
| `tc_certificate_id` | uuid | nullable |  | UK. FK to `issued_certificates` (setnull on delete). IssuedCertificate that closed the record |
| `anonymized_at` | timestamptz | nullable |  | PII overwritten after an approved deletion request; row kept for financial/legal retention |
| `retention_until` | date | nullable |  |  |
| `custom_fields` | jsonb | nullable |  | cached CustomFieldValue rows for fast profile reads |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (id, organization_id); Unique (organization_id, admission_no); Unique (organization_id, rfid_card_no); Index (organization_id, family_id); Index (organization_id, admission_quota); Index (first_name, last_name, admission_no) `idx_students_search_trgm`; Index (organization_id, campus_id, status); Index (organization_id, current_batch_id, status); Index (organization_id, first_name, last_name); Index (organization_id, phone); Index (organization_id, admission_date).

**Relations:** belongs to `organizations`, `campuses`, `users`, `file_assets`, `batches`, `families`, `courses`, `issued_certificates`; has many `student_guardians`, `enrollments`, `student_documents`, `student_notes`, `student_status_histories`, `admission_applications`, `consent_records`, `attendance_records`, `student_leave_requests`, `homework_submissions`, `exam_marks`, `report_cards`, `student_fee_assignments`, `fee_invoices`, `student_discounts`, `scholarship_applications`, `scholarship_awards`, `fee_reminder_logs`, `payment_orders`, `payments`, `receipts`, `refunds`, `announcement_recipients`, `message_logs`, `book_issues`, `stock_transactions`, `asset_assignments`, `transport_assignments`, `hostel_allocations`, `hostel_attendance`, `hostel_visitor_logs`, `issued_certificates`, `certificate_requests`, `student_risk_scores`, `ptm_bookings`, `student_transfers`, `exam_re_evaluation_requests`, `fee_invoice_adjustments`, `scholarship_disbursements`, `payment_allocations`, `book_reservations`, `transport_attendance`, `hostel_leave_requests`.

### guardians

Prisma model `Guardian`. Tenant table (filtered by `organization_id`). Parent or guardian. One row per person per organization; linked to children through StudentGuardian.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `user_id` | uuid | nullable |  | UK. FK to `users` (setnull on delete). linked Parent Portal login |
| `family_id` | uuid | nullable |  | FK to `families` (setnull on delete). household; one Parent Portal login sees every child of the family |
| `first_name` | varchar(80) | not null |  |  |
| `last_name` | varchar(80) | nullable |  |  |
| `gender` | enum `Gender` | nullable |  |  |
| `email` | varchar(255) | nullable |  |  |
| `phone` | varchar(20) | not null |  | E.164; used to match siblings to the same guardian |
| `alternate_phone` | varchar(20) | nullable |  |  |
| `whatsapp_phone` | varchar(20) | nullable |  | when different from phone |
| `preferred_channel` | enum `Channel` | not null | WHATSAPP |  |
| `preferred_language` | varchar(10) | not null | "en" |  |
| `occupation` | varchar(100) | nullable |  |  |
| `education` | varchar(100) | nullable |  |  |
| `annual_income` | decimal(12,2) | nullable |  | for scholarship eligibility |
| `currency` | char(3) | nullable |  | currency of annualIncome |
| `address_line1` | varchar(200) | nullable |  |  |
| `address_line2` | varchar(200) | nullable |  |  |
| `city` | varchar(100) | nullable |  |  |
| `state` | varchar(100) | nullable |  |  |
| `postal_code` | varchar(20) | nullable |  |  |
| `country_code` | char(2) | nullable |  |  |
| `national_id_encrypted` | text | nullable |  | ciphertext; used for verifiable parental consent where required |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `anonymized_at` | timestamptz | nullable |  | PII overwritten after an approved deletion request |
| `custom_fields` | jsonb | nullable |  | cached CustomFieldValue rows |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, phone); Index (organization_id, email); Index (organization_id, first_name, last_name); Index (organization_id, family_id); Index (first_name, last_name, phone) `idx_guardians_search_trgm`.

**Relations:** belongs to `organizations`, `users`, `families`; has many `student_guardians`, `consent_records`, `student_leave_requests`, `fee_reminder_logs`, `payments`, `whats_app_inbound_messages`, `hostel_visitor_logs`, `ptm_bookings`, `hostel_leave_requests`.

### families

Prisma model `Family`. Tenant table (filtered by `organization_id`). Household that groups siblings and their guardians (sibling discount, family statement, one parent login).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `family_code` | varchar(30) | not null |  |  |
| `name` | varchar(160) | not null |  | e.g. "Sharma family (Rajesh)" |
| `primary_guardian_id` | uuid | nullable |  | Guardian id (no FK to avoid a circular dependency) |
| `notes` | varchar(500) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, family_code); Index (organization_id, name).

**Relations:** belongs to `organizations`; has many `students`, `guardians`, `payment_orders`, `payments`.

### student_guardians

Prisma model `StudentGuardian`. Tenant table (filtered by `organization_id`). Link between a student and a guardian with the relationship and contact flags.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `student_id` | uuid | not null |  | FK to `students` (cascade on delete) |
| `guardian_id` | uuid | not null |  | FK to `guardians` (cascade on delete) |
| `relation` | enum `GuardianRelation` | not null |  |  |
| `is_primary` | boolean | not null | false | main contact; one per student: partial unique index in the SQL migration, UNIQUE (organization_id, student_id) WHERE is_primary |
| `can_pickup` | boolean | not null | true |  |
| `is_emergency_contact` | boolean | not null | false |  |
| `is_fee_payer` | boolean | not null | false | receives fee reminders and receipts |
| `receives_communication` | boolean | not null | true |  |
| `has_portal_access` | boolean | not null | true | false for custody restrictions |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, student_id, guardian_id); Index (organization_id, guardian_id).

**Relations:** belongs to `organizations`, `students`, `guardians`.

### enrollments

Prisma model `Enrollment`. Tenant table (filtered by `organization_id`). A student's membership of a batch in an academic year (history is kept across years). Ended rows (TRANSFERRED, WITHDRAWN, CANCELLED, soft-deleted) must not block a new row, so the rules live in partial unique indexes in the SQL migration: uq_enrollment_student_batch_year (organization_id, student_id, batch_id, academic_year_id) WHERE status = 'ACTIVE' AND deleted_at IS NULL uq_enrollment_batch_roll         (organization_id, batch_id, roll_no) WHERE status = 'ACTIVE' AND deleted_at IS NULL uq_enrollment_primary            (organization_id, student_id, academic_year_id) WHERE is_primary AND status = 'ACTIVE' AND deleted_at IS NULL

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `course_id` | uuid | not null |  | FK to `courses` (restrict on delete). denormalised from the batch for course-level reports |
| `batch_id` | uuid | not null |  | FK to `batches` (restrict on delete) |
| `roll_no` | varchar(20) | nullable |  |  |
| `status` | enum `EnrollmentStatus` | not null | ACTIVE |  |
| `is_primary` | boolean | not null | true | coaching students may join extra batches; one primary per year |
| `enrollment_date` | date | not null |  |  |
| `end_date` | date | nullable |  |  |
| `end_reason` | varchar(255) | nullable |  |  |
| `elective_subject_ids` | uuid[] | not null |  | chosen elective Subject ids |
| `previous_enrollment_id` | uuid | nullable |  | FK to `enrollments` (setnull on delete). enrollment this one was promoted / transferred from |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, student_id, batch_id, academic_year_id); Index (organization_id, batch_id, roll_no); Index (organization_id, batch_id, status); Index (organization_id, student_id, academic_year_id); Index (organization_id, campus_id, academic_year_id, status); Index (organization_id, course_id, academic_year_id).

**Relations:** belongs to `organizations`, `campuses`, `students`, `academic_years`, `courses`, `batches`, `enrollments`; has many `enrollments`, `student_fee_assignments`.

### student_documents

Prisma model `StudentDocument`. Tenant table (filtered by `organization_id`). Document uploaded for a student (birth certificate, transfer certificate, marksheet).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `student_id` | uuid | not null |  | FK to `students` (cascade on delete) |
| `document_type` | enum `StudentDocumentType` | not null |  |  |
| `title` | varchar(150) | not null |  |  |
| `document_no_encrypted` | text | nullable |  | AES-256-GCM ciphertext (Aadhaar, passport); never plain |
| `document_no_last4` | varchar(4) | nullable |  | safe to display |
| `file_id` | uuid | not null |  | FK to `file_assets` (restrict on delete) |
| `issued_on` | date | nullable |  |  |
| `is_verified` | boolean | not null | false |  |
| `verified_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `verified_at` | timestamptz | nullable |  |  |
| `visible_to_parent` | boolean | not null | true |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, student_id, document_type).

**Relations:** belongs to `organizations`, `students`, `file_assets`.

### student_notes

Prisma model `StudentNote`. Tenant table (filtered by `organization_id`). Staff remark on a student (academic, behaviour, medical, counselling), optionally shared with parents.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `student_id` | uuid | not null |  | FK to `students` (cascade on delete) |
| `note_type` | enum `StudentNoteType` | not null | GENERAL |  |
| `title` | varchar(150) | nullable |  |  |
| `body` | text | not null |  |  |
| `is_shared_with_parent` | boolean | not null | false |  |
| `is_pinned` | boolean | not null | false |  |
| `author_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, student_id, created_at); Index (organization_id, note_type, created_at).

**Relations:** belongs to `organizations`, `students`, `users`.

### student_status_histories

Prisma model `StudentStatusHistory`. Tenant table (filtered by `organization_id`). Every change of Student.status with reason and actor. Append-only: no updatedAt / deletedAt.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `student_id` | uuid | not null |  | FK to `students` (cascade on delete) |
| `from_status` | enum `StudentStatus` | nullable |  | null for the first row written at admission |
| `to_status` | enum `StudentStatus` | not null |  |  |
| `reason` | varchar(500) | nullable |  |  |
| `effective_date` | date | not null |  |  |
| `changed_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `created_at` | timestamptz | not null | now() |  |

**Indexes and constraints:** Index (organization_id, student_id, created_at); Index (organization_id, to_status, effective_date).

**Relations:** belongs to `organizations`, `students`, `users`.

### staff_status_histories

Prisma model `StaffStatusHistory`. Tenant table (filtered by `organization_id`). Every status, campus, department or designation change of a staff member. Append-only: no updatedAt / deletedAt.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `staff_id` | uuid | not null |  | FK to `staff` (cascade on delete) |
| `change_type` | enum `StaffChangeType` | not null |  |  |
| `from_value` | varchar(100) | nullable |  | status / designation / department name before |
| `to_value` | varchar(100) | not null |  |  |
| `from_campus_id` | uuid | nullable |  | Campus id (no FK); set for CAMPUS_TRANSFER |
| `to_campus_id` | uuid | nullable |  |  |
| `effective_date` | date | not null |  |  |
| `reason` | varchar(500) | nullable |  |  |
| `changed_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |

**Indexes and constraints:** Index (organization_id, staff_id, effective_date); Index (organization_id, change_type, effective_date).

**Relations:** belongs to `organizations`, `staff`.

### student_transfers

Prisma model `StudentTransfer`. Tenant table (filtered by `organization_id`). Request to move a student to another batch, course or campus, with approval and fee treatment.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `transfer_type` | enum `StudentTransferType` | not null |  |  |
| `from_campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `to_campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `from_batch_id` | uuid | not null |  | FK to `batches` (restrict on delete) |
| `to_batch_id` | uuid | not null |  | FK to `batches` (restrict on delete) |
| `from_enrollment_id` | uuid | nullable |  | Enrollment id that ends (no FK) |
| `to_enrollment_id` | uuid | nullable |  | Enrollment id created on approval (no FK) |
| `effective_date` | date | not null |  |  |
| `reason` | varchar(500) | not null |  |  |
| `fee_treatment` | jsonb | nullable |  | { carryDues, newFeeStructureId, endTransport } |
| `status` | enum `ApprovalStatus` | not null | PENDING |  |
| `requested_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `approved_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `approved_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, student_id, effective_date); Index (organization_id, to_campus_id, status); Index (organization_id, from_campus_id, status).

**Relations:** belongs to `organizations`, `students`, `campuses`, `batches`, `users`.

### admission_inquiries

Prisma model `AdmissionInquiry`. Tenant table (filtered by `organization_id`). Admission lead captured from walk-in, website form, phone or WhatsApp.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `inquiry_no` | varchar(30) | not null |  |  |
| `academic_year_id` | uuid | nullable |  | FK to `academic_years` (setnull on delete). session the lead wants to join |
| `course_id` | uuid | nullable |  | FK to `courses` (setnull on delete). course of interest |
| `student_first_name` | varchar(80) | not null |  |  |
| `student_last_name` | varchar(80) | nullable |  |  |
| `date_of_birth` | date | nullable |  |  |
| `gender` | enum `Gender` | nullable |  |  |
| `guardian_name` | varchar(160) | not null |  |  |
| `guardian_relation` | enum `GuardianRelation` | nullable |  |  |
| `phone` | varchar(20) | not null |  |  |
| `alternate_phone` | varchar(20) | nullable |  |  |
| `email` | varchar(255) | nullable |  |  |
| `city` | varchar(100) | nullable |  |  |
| `address` | varchar(500) | nullable |  |  |
| `previous_school` | varchar(200) | nullable |  |  |
| `source` | enum `LeadSource` | not null | WALK_IN |  |
| `source_detail` | varchar(200) | nullable |  | campaign name, referrer name |
| `utm` | jsonb | nullable |  | utm_source / utm_medium / utm_campaign from the website form |
| `stage` | enum `InquiryStage` | not null | NEW |  |
| `priority` | enum `LeadPriority` | not null | WARM |  |
| `assigned_to_id` | uuid | nullable |  | FK to `users` (setnull on delete). counsellor (User) who owns the lead |
| `last_contacted_at` | timestamptz | nullable |  |  |
| `next_follow_up_at` | timestamptz | nullable |  | denormalised from the latest follow-up |
| `lost_reason` | varchar(255) | nullable |  |  |
| `notes` | text | nullable |  |  |
| `demo_batch_id` | uuid | nullable |  | FK to `batches` (setnull on delete). coaching: batch of the free demo class |
| `demo_at` | timestamptz | nullable |  |  |
| `demo_attended` | boolean | nullable |  |  |
| `consent_to_contact` | boolean | not null | false | never pre-ticked: needs a clear affirmative action (DPDP / GDPR / TRAI) |
| `consent_at` | timestamptz | nullable |  |  |
| `consent_source` | varchar(40) | nullable |  | WEB_FORM \| FRONT_DESK \| WHATSAPP_OPT_IN |
| `consent_ip` | varchar(45) | nullable |  |  |
| `custom_fields` | jsonb | nullable |  | cached CustomFieldValue rows |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK); null for website leads |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, inquiry_no); Index (organization_id, campus_id, stage, created_at); Index (organization_id, assigned_to_id, next_follow_up_at); Index (organization_id, phone); Index (organization_id, source, created_at).

**Relations:** belongs to `organizations`, `campuses`, `academic_years`, `courses`, `users`, `batches`; has many `inquiry_follow_ups`, `admission_applications`, `consent_records`.

### inquiry_follow_ups

Prisma model `InquiryFollowUp`. Tenant table (filtered by `organization_id`). A planned or completed contact with an admission lead.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `inquiry_id` | uuid | not null |  | FK to `admission_inquiries` (cascade on delete) |
| `follow_up_type` | enum `FollowUpType` | not null |  |  |
| `scheduled_at` | timestamptz | nullable |  |  |
| `completed_at` | timestamptz | nullable |  | null = still pending |
| `outcome` | enum `FollowUpOutcome` | nullable |  |  |
| `stage_after` | enum `InquiryStage` | nullable |  | stage the inquiry moved to after this contact |
| `notes` | text | nullable |  |  |
| `done_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, inquiry_id, created_at); Index (organization_id, done_by_id, scheduled_at); Index (organization_id, completed_at, scheduled_at).

**Relations:** belongs to `organizations`, `admission_inquiries`, `users`.

### admission_applications

Prisma model `AdmissionApplication`. Tenant table (filtered by `organization_id`). Admission form submitted online or at the front desk; approved applications become students.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `application_no` | varchar(30) | not null |  |  |
| `inquiry_id` | uuid | nullable |  | FK to `admission_inquiries` (setnull on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `course_id` | uuid | not null |  | FK to `courses` (restrict on delete) |
| `preferred_batch_id` | uuid | nullable |  | FK to `batches` (setnull on delete) |
| `status` | enum `ApplicationStatus` | not null | DRAFT |  |
| `admission_type` | enum `AdmissionType` | not null | NEW |  |
| `existing_student_id` | uuid | nullable |  | FK to `students` (setnull on delete). returning student chosen at the front desk (re-admission / progression) |
| `sibling_student_id` | uuid | nullable |  | Student id of a sibling already studying here (priority + sibling discount); no FK |
| `submitted_via` | enum `ApplicationChannel` | not null | FRONT_DESK |  |
| `student_first_name` | varchar(80) | not null |  |  |
| `student_last_name` | varchar(80) | nullable |  |  |
| `date_of_birth` | date | nullable |  |  |
| `gender` | enum `Gender` | nullable |  |  |
| `guardian_name` | varchar(160) | not null |  |  |
| `phone` | varchar(20) | not null |  |  |
| `email` | varchar(255) | nullable |  |  |
| `form_data` | jsonb | not null |  | full form: student, guardians, address, previous school, custom fields |
| `consent_at` | timestamptz | nullable |  | guardian consent for the child's data at application time |
| `consent_source` | varchar(40) | nullable |  | WEB_FORM \| FRONT_DESK \| WHATSAPP_OPT_IN |
| `consent_ip` | varchar(45) | nullable |  |  |
| `application_fee_amount` | decimal(12,2) | not null | 0 |  |
| `currency` | char(3) | not null |  |  |
| `application_fee_status` | enum `ApplicationFeeStatus` | not null | NOT_REQUIRED |  |
| `application_fee_paid_at` | timestamptz | nullable |  |  |
| `application_fee_payment_id` | uuid | nullable |  | UK. FK to `payments` (setnull on delete). Payment (purpose APPLICATION_FEE) that settled the fee: receipt, day book and DayClose |
| `application_fee_ref` | varchar(100) | nullable |  | legacy receipt no.; imports only |
| `submitted_at` | timestamptz | nullable |  |  |
| `entrance_test_at` | timestamptz | nullable |  |  |
| `entrance_test_venue` | varchar(150) | nullable |  |  |
| `entrance_test_max_score` | decimal(6,2) | nullable |  |  |
| `entrance_test_score` | decimal(6,2) | nullable |  |  |
| `interview_at` | timestamptz | nullable |  |  |
| `reviewed_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `reviewed_at` | timestamptz | nullable |  |  |
| `decision_remarks` | varchar(500) | nullable |  |  |
| `converted_student_id` | uuid | nullable |  | FK to `students` (setnull on delete). Student created from (or re-admitted by) this application; not unique: a student may return |
| `converted_at` | timestamptz | nullable |  |  |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK); null for online forms |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, application_no); Index (organization_id, converted_student_id); Index (organization_id, campus_id, status, created_at); Index (organization_id, academic_year_id, course_id, status); Index (organization_id, phone).

**Relations:** belongs to `organizations`, `campuses`, `admission_inquiries`, `academic_years`, `courses`, `batches`, `users`, `students`, `payments`; has many `admission_application_documents`, `payments`, `payment_orders`, `receipts`.

### admission_application_documents

Prisma model `AdmissionApplicationDocument`. Tenant table (filtered by `organization_id`). Document attached to an admission application; copied to StudentDocument on conversion.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `application_id` | uuid | not null |  | FK to `admission_applications` (cascade on delete) |
| `document_type` | enum `StudentDocumentType` | not null |  |  |
| `title` | varchar(150) | not null |  |  |
| `file_id` | uuid | not null |  | FK to `file_assets` (restrict on delete) |
| `is_verified` | boolean | not null | false |  |
| `verified_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `verified_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, application_id).

**Relations:** belongs to `organizations`, `admission_applications`, `file_assets`.

### Enums in 04-people.prisma

| Enum | Values | Meaning |
|---|---|---|
| `StaffType` | TEACHING, NON_TEACHING |  |
| `EmploymentType` | FULL_TIME, PART_TIME, CONTRACT, VISITING, INTERN |  |
| `StaffStatus` | ACTIVE, ON_LEAVE, SUSPENDED, RESIGNED, TERMINATED, RETIRED |  |
| `StaffDocumentType` | ID_PROOF, ADDRESS_PROOF, QUALIFICATION, EXPERIENCE_LETTER, APPOINTMENT_LETTER, CONTRACT, POLICE_VERIFICATION, BANK_PROOF, PHOTO, OTHER |  |
| `StudentStatus` | ACTIVE, INACTIVE, SUSPENDED, GRADUATED, TRANSFERRED, DROPPED_OUT, EXPELLED |  |
| `StudentCategory` | GENERAL, OBC, SC, ST, EWS, OTHER | Reservation / social category used in Indian admissions and scholarship reports. |
| `GuardianRelation` | FATHER, MOTHER, GRANDFATHER, GRANDMOTHER, BROTHER, SISTER, UNCLE, AUNT, LEGAL_GUARDIAN, OTHER |  |
| `EnrollmentStatus` | ACTIVE, PROMOTED, COMPLETED, DETAINED, TRANSFERRED, WITHDRAWN, CANCELLED |  |
| `StudentDocumentType` | BIRTH_CERTIFICATE, TRANSFER_CERTIFICATE, MARKSHEET, ID_PROOF, ADDRESS_PROOF, PHOTO, CATEGORY_CERTIFICATE, INCOME_CERTIFICATE, MEDICAL, OTHER |  |
| `StudentNoteType` | GENERAL, ACADEMIC, BEHAVIOUR, MEDICAL, COUNSELLING, FEE, ACHIEVEMENT |  |
| `LeadSource` | WALK_IN, WEBSITE, PHONE_CALL, WHATSAPP, REFERRAL, SOCIAL_MEDIA, GOOGLE_ADS, NEWSPAPER, EVENT, PARTNER, OTHER |  |
| `InquiryStage` | NEW, CONTACTED, FOLLOW_UP, VISIT_SCHEDULED, VISITED, DEMO_SCHEDULED, DEMO_ATTENDED, APPLICATION_STARTED, CONVERTED, LOST, JUNK |  |
| `LeadPriority` | HOT, WARM, COLD |  |
| `FollowUpType` | CALL, WHATSAPP, SMS, EMAIL, VISIT, MEETING, DEMO_CLASS, NOTE |  |
| `FollowUpOutcome` | INTERESTED, NOT_INTERESTED, NO_RESPONSE, CALL_BACK_LATER, VISIT_BOOKED, DEMO_BOOKED, APPLICATION_SHARED, CONVERTED |  |
| `ApplicationStatus` | DRAFT, SUBMITTED, UNDER_REVIEW, DOCUMENTS_PENDING, TEST_SCHEDULED, INTERVIEW_SCHEDULED, APPROVED, WAITLISTED, REJECTED, WITHDRAWN, ENROLLED |  |
| `ApplicationChannel` | ONLINE_FORM, FRONT_DESK, IMPORT |  |
| `ApplicationFeeStatus` | NOT_REQUIRED, PENDING, PAID, WAIVED, REFUNDED |  |
| `AdmissionType` | NEW, RE_ADMISSION, TRANSFER_IN, INTERNAL_PROGRESSION | How the student came in; needed by UDISE and admission reports. |
| `AdmissionQuota` | GENERAL, RTE, MANAGEMENT, STAFF_WARD, SPORTS, NRI, OTHER | Seat quota of the admission; drives fee rules and government returns. |
| `StudentTransferType` | BATCH_CHANGE, CAMPUS_TRANSFER, COURSE_CHANGE |  |
| `StaffChangeType` | STATUS, CAMPUS_TRANSFER, DESIGNATION, DEPARTMENT, EMPLOYMENT_TYPE |  |
