# Data Dictionary: Finance and Communication

**In simple words:** This chapter lists every table and column for fees, discounts and scholarships, payments, receipts, refunds and reconciliation, and every notification, WhatsApp, email and SMS table. It is generated directly from the validated Prisma schema, so it always matches the database exactly. Use it when you write a query, build a report, answer a support question or review a migration.

How to read each table entry:

- **Column** is the real PostgreSQL column name (snake_case). The Prisma field name is the camelCase version of it.
- **Type** is the PostgreSQL type. `numeric(12,2)` is money, always stored together with a `currency` column. `timestamptz` values are stored in UTC.
- **Null** says whether the column may be empty. **Default** is the value the database or Prisma fills in.
- **Notes** marks keys (PK primary key, UK unique, FK foreign key with its delete rule) and repeats the comment from the schema.

> **Rule:** Every tenant table has `organization_id`. Every query must filter by it; the Prisma tenant extension does this for you (see *Multi-Tenancy and Data Isolation*).

## Tables in This Chapter

| Schema file | Domain | Tables | Enums |
|---|---|---|---|
| `08-fees.prisma` | Fees, discounts and scholarships | 18 | 17 |
| `09-payments.prisma` | Payments and reconciliation | 11 | 13 |
| `10-communication.prisma` | Communication | 16 | 14 |

## Fees, discounts and scholarships

Schema file `server/prisma/schema/08-fees.prisma` — 18 tables and 17 enums.

### fee_heads

Prisma model `FeeHead`. Tenant table (filtered by `organization_id`). Kind of charge: Tuition, Transport, Hostel, Exam ... with tax settings.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `name` | varchar(100) | not null |  |  |
| `code` | varchar(30) | not null |  |  |
| `head_type` | enum `FeeHeadType` | not null | TUITION |  |
| `description` | varchar(255) | nullable |  |  |
| `is_taxable` | boolean | not null | false | most education fees are tax exempt; uniform / books may not be |
| `tax_rate` | decimal(5,2) | not null | 0 | percent, used only when isTaxable and taxRateId is null |
| `tax_rate_id` | uuid | nullable |  | FK to `tax_rates` (restrict on delete). effective-dated rate with components (CGST + SGST / IGST); wins over taxRate |
| `tax_treatment` | enum `TaxTreatment` | not null | EXEMPT |  |
| `is_tax_inclusive` | boolean | not null | false | price already includes tax (Australia GST) |
| `tax_code` | varchar(20) | nullable |  | HSN / SAC master value; frozen onto each invoice line |
| `settlement_priority` | integer | not null | 0 | lower = settled first when a partial payment is split over heads |
| `is_refundable` | boolean | not null | false | e.g. caution deposit |
| `account_code` | varchar(30) | nullable |  | ledger code for accounting exports |
| `sort_order` | integer | not null | 0 |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, code); Index (organization_id, head_type, status).

**Relations:** belongs to `organizations`, `tax_rates`; has many `fee_structure_items`, `fee_invoice_items`, `payment_allocation_items`, `refunds`, `inventory_items`, `transport_assignments`, `hostel_allocations`.

### tax_rates

Prisma model `TaxRate`. Tenant table (filtered by `organization_id`). Effective-dated tax rate with components: GST 18 % = CGST 9 + SGST 9 (intra-state) or IGST 18 (inter-state); VAT 5 %; US state sales tax.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (restrict on delete). null = every campus |
| `name` | varchar(80) | not null |  | "GST 18%" |
| `country_code` | char(2) | not null |  |  |
| `region` | varchar(10) | nullable |  | state code for per-state rates |
| `tax_type` | enum `TaxType` | not null |  |  |
| `rate_percent` | decimal(5,2) | not null |  |  |
| `components` | jsonb | nullable |  | [{ code: "CGST", percent: 9 }, { code: "SGST", percent: 9 }] |
| `inter_state_components` | jsonb | nullable |  | [{ code: "IGST", percent: 18 }] |
| `valid_from` | date | not null |  |  |
| `valid_to` | date | nullable |  |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, name, valid_from); Index (organization_id, country_code, region, status).

**Relations:** belongs to `organizations`, `campuses`; has many `fee_heads`.

### fee_structures

Prisma model `FeeStructure`. Tenant table (filtered by `organization_id`). Fee plan for a course (optionally one batch) in an academic year.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (restrict on delete). null = same plan at every campus |
| `campus_key` | varchar(36) | not null | "ALL" | "ALL" or the campusId; makes the unique key work without NULLs |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `course_id` | uuid | nullable |  | FK to `courses` (restrict on delete). null = generic plan (e.g. transport only) |
| `batch_id` | uuid | nullable |  | FK to `batches` (restrict on delete). set only when one batch has its own plan |
| `late_fee_rule_id` | uuid | nullable |  | FK to `late_fee_rules` (setnull on delete) |
| `name` | varchar(120) | not null |  |  |
| `description` | varchar(500) | nullable |  |  |
| `currency` | char(3) | not null |  |  |
| `total_amount` | decimal(12,2) | not null | 0 | cached yearly total of all items |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, academic_year_id, campus_key, name); Index (organization_id, academic_year_id, course_id, status); Index (organization_id, campus_id, academic_year_id); Index (organization_id, batch_id).

**Relations:** belongs to `organizations`, `campuses`, `academic_years`, `courses`, `batches`, `late_fee_rules`; has many `fee_structure_items`, `fee_installments`, `student_fee_assignments`.

### fee_structure_items

Prisma model `FeeStructureItem`. Tenant table (filtered by `organization_id`). One fee head inside a fee structure with its amount and billing frequency.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `fee_structure_id` | uuid | not null |  | FK to `fee_structures` (cascade on delete) |
| `fee_head_id` | uuid | not null |  | FK to `fee_heads` (restrict on delete) |
| `amount` | decimal(12,2) | not null |  | amount per frequency period, before tax |
| `frequency` | enum `FeeFrequency` | not null | ONE_TIME |  |
| `is_optional` | boolean | not null | false | e.g. transport; added per student in the assignment |
| `applicability` | enum `FeeApplicability` | not null | ALL_STUDENTS | admission fee / caution deposit: NEW_ADMISSIONS_ONLY |
| `installment_nos` | integer[] | not null |  | installments that carry this head; empty = spread by frequency |
| `student_categories` | enum `StudentCategory`[] | not null |  | empty = every category |
| `admission_quotas` | enum `AdmissionQuota`[] | not null |  | empty = every quota; e.g. exclude RTE / STAFF_WARD from a head |
| `sort_order` | integer | not null | 0 |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, fee_structure_id, fee_head_id); Index (organization_id, fee_head_id).

**Relations:** belongs to `organizations`, `fee_structures`, `fee_heads`.

### fee_installments

Prisma model `FeeInstallment`. Tenant table (filtered by `organization_id`). Payment schedule of a fee structure: installment 1 due 10 Apr, installment 2 due 10 Jul ...

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `fee_structure_id` | uuid | not null |  | FK to `fee_structures` (cascade on delete) |
| `installment_no` | smallint | not null |  |  |
| `name` | varchar(80) | not null |  | "Quarter 1", "April 2027" |
| `due_date` | date | not null |  |  |
| `period_start` | date | nullable |  |  |
| `period_end` | date | nullable |  |  |
| `amount` | decimal(12,2) | not null |  | planned amount before student-level overrides and discounts |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, fee_structure_id, installment_no); Index (organization_id, due_date).

**Relations:** belongs to `organizations`, `fee_structures`; has many `fee_invoices`.

### student_fee_assignments

Prisma model `StudentFeeAssignment`. Tenant table (filtered by `organization_id`). A fee structure applied to one student for one academic year, with per-student overrides.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `enrollment_id` | uuid | nullable |  | FK to `enrollments` (setnull on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `fee_structure_id` | uuid | not null |  | FK to `fee_structures` (restrict on delete) |
| `status` | enum `FeeAssignmentStatus` | not null | ACTIVE |  |
| `start_date` | date | not null |  | mid-year joiners are billed from this date |
| `end_date` | date | nullable |  |  |
| `overrides` | jsonb | nullable |  | [{ feeHeadId, amount, reason }] amounts that replace the structure amounts |
| `excluded_fee_head_ids` | uuid[] | not null |  | optional heads the student does not take |
| `has_custom_schedule` | boolean | not null | false | true = StudentFeeInstallment rows replace the structure's installments |
| `currency` | char(3) | not null |  |  |
| `net_yearly_amount` | decimal(12,2) | nullable |  | cached total after overrides, before discounts |
| `notes` | varchar(500) | nullable |  |  |
| `assigned_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, student_id, fee_structure_id, academic_year_id); Index (organization_id, student_id, status); Index (organization_id, campus_id, academic_year_id, status); Index (organization_id, fee_structure_id).

**Relations:** belongs to `organizations`, `campuses`, `students`, `enrollments`, `academic_years`, `fee_structures`; has many `fee_invoices`, `student_fee_installments`.

### fee_invoices

Prisma model `FeeInvoice`. Tenant table (filtered by `organization_id`). Fee bill raised to a student for a period. Cached money columns (kept in the row for fast dues lists): total   = subtotal - discountTotal + taxTotal + lateFee + adjustmentTotal balance = total - scholarshipCredit - amountPaid - writtenOffAmount Issued invoices are cancelled, never deleted; a corrected invoice points back with replacesInvoiceId. One LIVE invoice per student per installment is enforced by a partial unique index in the SQL migration: uq_fee_invoice_installment (organization_id, student_id, assignment_id, installment_id) WHERE status <> 'CANCELLED' AND deleted_at IS NULL

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `assignment_id` | uuid | nullable |  | FK to `student_fee_assignments` (restrict on delete). null for ad-hoc invoices (fine, certificate fee) |
| `installment_id` | uuid | nullable |  | FK to `fee_installments` (restrict on delete) |
| `invoice_no` | varchar(40) | not null |  | from NumberSequence FEE_INVOICE_NO; max 16 chars when the issuer is GST-registered (India) |
| `replaces_invoice_id` | uuid | nullable |  | FK to `fee_invoices` (setnull on delete). cancelled invoice that this one corrects |
| `carried_from_invoice_id` | uuid | nullable |  | UK. FK to `fee_invoices` (setnull on delete). old-year invoice whose balance this ARREARS invoice carries |
| `title` | varchar(150) | nullable |  | "Quarter 1 fees 2027-28" |
| `period_start` | date | nullable |  |  |
| `period_end` | date | nullable |  |  |
| `issue_date` | date | not null |  |  |
| `due_date` | date | not null |  |  |
| `currency` | char(3) | not null |  |  |
| `subtotal` | decimal(12,2) | not null |  | sum of item amounts |
| `discount_total` | decimal(12,2) | not null | 0 | discounts applied at issue (scholarship money is in scholarshipCredit) |
| `tax_total` | decimal(12,2) | not null | 0 |  |
| `tax_breakdown` | jsonb | nullable |  | invoice-level totals per tax component: [{ code: CGST\|SGST\|IGST\|GST\|VAT\|SALES_TAX, percent, amount }] |
| `is_tax_inclusive` | boolean | not null | false |  |
| `seller_tax_id` | varchar(30) | nullable |  | campus / organization GSTIN / ABN / TRN frozen at issue |
| `buyer_tax_id` | varchar(30) | nullable |  | payer GSTIN for B2B invoices |
| `place_of_supply` | varchar(10) | nullable |  | GST state code / US state / emirate |
| `late_fee` | decimal(12,2) | not null | 0 |  |
| `adjustment_total` | decimal(12,2) | not null | 0 | signed net of APPROVED FeeInvoiceAdjustment rows (credits negative) |
| `total` | decimal(12,2) | not null |  | subtotal - discountTotal + taxTotal + lateFee + adjustmentTotal |
| `scholarship_credit` | decimal(12,2) | not null | 0 | sum of active ScholarshipDisbursement rows |
| `amount_paid` | decimal(12,2) | not null | 0 | sum of active PaymentAllocation rows minus refunds |
| `written_off_amount` | decimal(12,2) | not null | 0 |  |
| `balance` | decimal(12,2) | not null |  | total - scholarshipCredit - amountPaid - writtenOffAmount |
| `status` | enum `FeeInvoiceStatus` | not null | DRAFT |  |
| `applied_discounts` | jsonb | nullable |  | [{ studentDiscountId \| scholarshipAwardId, name, amount }] |
| `late_fee_applied_at` | timestamptz | nullable |  |  |
| `late_fee_waived` | boolean | not null | false |  |
| `late_fee_waived_amount` | decimal(12,2) | not null | 0 |  |
| `late_fee_waived_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `late_fee_waived_at` | timestamptz | nullable |  |  |
| `late_fee_waive_reason` | varchar(255) | nullable |  |  |
| `last_reminder_at` | timestamptz | nullable |  |  |
| `reminder_count` | integer | not null | 0 |  |
| `paid_at` | timestamptz | nullable |  | when the balance reached zero |
| `cancelled_at` | timestamptz | nullable |  |  |
| `cancelled_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `cancel_reason` | varchar(255) | nullable |  |  |
| `written_off_at` | timestamptz | nullable |  |  |
| `write_off_reason` | varchar(255) | nullable |  |  |
| `written_off_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `credit_note_no` | varchar(40) | nullable |  | GST credit note raised when an issued taxable invoice is cancelled (NumberSequence CREDIT_NOTE_NO) |
| `credit_note_date` | date | nullable |  |  |
| `notes` | varchar(500) | nullable |  |  |
| `pdf_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete) |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK); null when generated by the worker |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  | only DRAFT invoices may be deleted; issued ones are cancelled |

**Indexes and constraints:** Unique (id, organization_id); Unique (organization_id, invoice_no); Unique (organization_id, credit_note_no); Index (organization_id, student_id, assignment_id, installment_id); Index (organization_id, assignment_id); Index (organization_id, installment_id); Index (organization_id, student_id, status); Index (organization_id, campus_id, status, due_date); Index (organization_id, academic_year_id, status); Index (organization_id, status, due_date); Index (organization_id, campus_id, issue_date).

**Relations:** belongs to `organizations`, `campuses`, `academic_years`, `students`, `student_fee_assignments`, `fee_installments`, `file_assets`, `fee_invoices`, `student_fee_installments`; has many `fee_invoices`, `fee_invoice_items`, `fee_invoice_adjustments`, `scholarship_disbursements`, `fee_reminder_logs`, `payment_allocations`, `book_issues`, `certificate_requests`, `payments`, `exam_re_evaluation_requests`, `refunds`, `refund_allocations`, `stock_transactions`.

### fee_invoice_items

Prisma model `FeeInvoiceItem`. Tenant table (filtered by `organization_id`). One line of a fee invoice (a fee head with amount, discount and tax).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `invoice_id` | uuid | not null |  | FK to `fee_invoices` (restrict on delete) |
| `fee_head_id` | uuid | not null |  | FK to `fee_heads` (restrict on delete) |
| `description` | varchar(200) | nullable |  |  |
| `amount` | decimal(12,2) | not null |  | before discount and tax |
| `discount_amount` | decimal(12,2) | not null | 0 |  |
| `tax_treatment` | enum `TaxTreatment` | not null | EXEMPT | frozen from FeeHead at issue |
| `tax_code` | varchar(20) | nullable |  | HSN / SAC snapshot from FeeHead |
| `taxable_amount` | decimal(12,2) | not null | 0 | amount - discountAmount when TAXABLE |
| `tax_rate` | decimal(5,2) | not null | 0 |  |
| `tax_amount` | decimal(12,2) | not null | 0 | sum of the components in taxBreakdown |
| `tax_breakdown` | jsonb | nullable |  | [{ code: CGST\|SGST\|IGST\|GST\|VAT\|SALES_TAX, percent, amount }] |
| `net_amount` | decimal(12,2) | not null |  | amount - discountAmount + taxAmount |
| `amount_paid` | decimal(12,2) | not null | 0 | sum of active PaymentAllocationItem rows; updated in the same transaction (head-wise collection) |
| `amount_refunded` | decimal(12,2) | not null | 0 |  |
| `transport_assignment_id` | uuid | nullable |  | FK to `transport_assignments` (setnull on delete). transport line: the assignment it bills |
| `hostel_allocation_id` | uuid | nullable |  | FK to `hostel_allocations` (setnull on delete). hostel line: the allocation it bills |
| `period_start` | date | nullable |  | billed period of a recurring line (prevents double billing) |
| `period_end` | date | nullable |  |  |
| `sort_order` | integer | not null | 0 |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, invoice_id, sort_order); Index (organization_id, fee_head_id); Index (organization_id, transport_assignment_id); Index (organization_id, hostel_allocation_id).

**Relations:** belongs to `organizations`, `fee_invoices`, `fee_heads`, `transport_assignments`, `hostel_allocations`; has many `fee_invoice_adjustments`, `payment_allocation_items`.

### fee_invoice_adjustments

Prisma model `FeeInvoiceAdjustment`. Tenant table (filtered by `organization_id`). Approved change to an issued invoice (credit / debit note): post-issue concession, late-fee waiver, correction, partial write-off.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `invoice_id` | uuid | not null |  | FK to `fee_invoices` (restrict on delete) |
| `invoice_item_id` | uuid | nullable |  | FK to `fee_invoice_items` (setnull on delete). set when the adjustment targets one fee head line |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `adjustment_type` | enum `FeeAdjustmentType` | not null |  |  |
| `amount` | decimal(12,2) | not null |  | always positive; the sign comes from the type |
| `currency` | char(3) | not null |  |  |
| `reason` | varchar(500) | not null |  |  |
| `status` | enum `ApprovalStatus` | not null | PENDING | only APPROVED rows change FeeInvoice.adjustmentTotal |
| `requested_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `approved_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `approved_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, invoice_id); Index (organization_id, campus_id, status, created_at); Index (organization_id, student_id).

**Relations:** belongs to `organizations`, `campuses`, `fee_invoices`, `fee_invoice_items`, `students`, `users`.

### student_fee_installments

Prisma model `StudentFeeInstallment`. Tenant table (filtered by `organization_id`). Per-student payment schedule negotiated at the counter; replaces the structure's installments when hasCustomSchedule is true.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `assignment_id` | uuid | not null |  | FK to `student_fee_assignments` (restrict on delete) |
| `installment_no` | smallint | not null |  |  |
| `name` | varchar(80) | nullable |  |  |
| `due_date` | date | not null |  |  |
| `amount` | decimal(12,2) | not null |  |  |
| `currency` | char(3) | not null |  |  |
| `invoice_id` | uuid | nullable |  | UK. FK to `fee_invoices` (setnull on delete). set once the invoice is generated; one invoice per installment |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, assignment_id, installment_no); Index (organization_id, due_date).

**Relations:** belongs to `organizations`, `student_fee_assignments`, `fee_invoices`.

### late_fee_rules

Prisma model `LateFeeRule`. Tenant table (filtered by `organization_id`). How the late fee is calculated after the due date. One default rule per organization / campus is enforced by a partial unique index in the SQL migration (WHERE is_default AND deleted_at IS NULL).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (cascade on delete). null = all campuses |
| `name` | varchar(100) | not null |  |  |
| `calculation` | enum `LateFeeCalculation` | not null |  |  |
| `amount` | decimal(12,2) | nullable |  | for FIXED_* calculations |
| `percent` | decimal(5,2) | nullable |  | for PERCENT_* calculations |
| `currency` | char(3) | not null |  |  |
| `grace_days` | smallint | not null | 0 |  |
| `max_amount` | decimal(12,2) | nullable |  | cap per invoice |
| `is_default` | boolean | not null | false | used when a fee structure has no rule of its own |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, name); Index (organization_id, campus_id, status).

**Relations:** belongs to `organizations`, `campuses`; has many `fee_structures`.

### discounts

Prisma model `Discount`. Tenant table (filtered by `organization_id`). Discount scheme: sibling, early-bird, staff child, merit ... percent or fixed.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `name` | varchar(100) | not null |  |  |
| `code` | varchar(30) | not null |  |  |
| `category` | enum `DiscountCategory` | not null |  |  |
| `discount_type` | enum `DiscountType` | not null |  |  |
| `value` | decimal(12,2) | not null |  | percent (0-100) or fixed amount, by discountType |
| `currency` | char(3) | nullable |  | FIXED discounts only |
| `max_amount` | decimal(12,2) | nullable |  | cap for PERCENT discounts |
| `scope` | enum `DiscountScope` | not null | INVOICE_TOTAL |  |
| `fee_head_ids` | uuid[] | not null |  | used when scope is FEE_HEADS |
| `course_ids` | uuid[] | not null |  | empty = every course |
| `criteria` | jsonb | nullable |  | auto-apply rules, e.g. { siblingIndex: 2 } or { payBeforeDays: 15 } |
| `valid_from` | date | nullable |  |  |
| `valid_to` | date | nullable |  |  |
| `is_stackable` | boolean | not null | false | may combine with other discounts |
| `priority` | integer | not null | 0 | order of application when stacked; lower first |
| `requires_approval` | boolean | not null | true |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, code); Index (organization_id, category, status).

**Relations:** belongs to `organizations`; has many `student_discounts`.

### student_discounts

Prisma model `StudentDiscount`. Tenant table (filtered by `organization_id`). A discount granted to one student for an academic year, with approval.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete). student's campus at grant time; scopes the approval queue for ACCOUNTANT / PRINCIPAL |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `discount_id` | uuid | not null |  | FK to `discounts` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `sibling_student_id` | uuid | nullable |  | FK to `students` (setnull on delete). sibling that qualifies the student for a SIBLING discount; revoke when that sibling leaves |
| `value_override` | decimal(12,2) | nullable |  | replaces Discount.value for this student |
| `reason` | varchar(500) | nullable |  |  |
| `status` | enum `ApprovalStatus` | not null | PENDING |  |
| `valid_from` | date | nullable |  |  |
| `valid_to` | date | nullable |  |  |
| `requested_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `approved_by_id` | uuid | nullable |  | FK to `users` (setnull on delete). User who approved or rejected |
| `approved_at` | timestamptz | nullable |  |  |
| `rejection_reason` | varchar(255) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, student_id, discount_id, academic_year_id); Index (organization_id, campus_id, status, created_at); Index (organization_id, status, created_at); Index (organization_id, discount_id).

**Relations:** belongs to `organizations`, `campuses`, `students`, `discounts`, `academic_years`, `users`.

### scholarships

Prisma model `Scholarship`. Tenant table (filtered by `organization_id`). Scholarship scheme with funding source, eligibility criteria, seats and value.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `academic_year_id` | uuid | nullable |  | FK to `academic_years` (setnull on delete). null = runs every year |
| `name` | varchar(150) | not null |  |  |
| `code` | varchar(30) | not null |  |  |
| `scheme_name` | varchar(150) | nullable |  | official scheme, e.g. a state post-matric scholarship |
| `description` | text | nullable |  |  |
| `funding_source` | enum `ScholarshipFundingSource` | not null | INSTITUTE |  |
| `funder_name` | varchar(150) | nullable |  |  |
| `value_type` | enum `DiscountType` | not null |  | PERCENT of fees or FIXED amount |
| `amount` | decimal(12,2) | nullable |  | FIXED value per student per year |
| `percent` | decimal(5,2) | nullable |  | PERCENT value |
| `currency` | char(3) | not null |  |  |
| `max_amount_per_student` | decimal(12,2) | nullable |  |  |
| `fee_head_ids` | uuid[] | not null |  | heads the scholarship may pay; empty = all |
| `criteria` | jsonb | nullable |  | { minPercentage, maxFamilyIncome, categories: [...], courseIds: [...] } |
| `seats` | integer | nullable |  | null = unlimited |
| `seats_awarded` | integer | not null | 0 |  |
| `application_start_date` | date | nullable |  |  |
| `application_end_date` | date | nullable |  |  |
| `is_renewable` | boolean | not null | false |  |
| `status` | enum `ScholarshipStatus` | not null | DRAFT |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, code); Index (organization_id, status, application_end_date).

**Relations:** belongs to `organizations`, `academic_years`; has many `scholarship_applications`, `scholarship_awards`.

### scholarship_applications

Prisma model `ScholarshipApplication`. Tenant table (filtered by `organization_id`). A student's application to a scholarship with documents, score and review decision.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `scholarship_id` | uuid | not null |  | FK to `scholarships` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `application_no` | varchar(30) | not null |  |  |
| `status` | enum `ScholarshipApplicationStatus` | not null | DRAFT |  |
| `statement` | text | nullable |  | why the student needs / deserves it |
| `family_income` | decimal(12,2) | nullable |  | declared annual income |
| `currency` | char(3) | nullable |  |  |
| `last_percentage` | decimal(5,2) | nullable |  | last exam result used for merit |
| `documents` | jsonb | nullable |  | [{ type, title, fileId }] FileAsset ids of income / category / marksheet proofs |
| `score` | decimal(6,2) | nullable |  | committee score used for ranking |
| `submitted_at` | timestamptz | nullable |  |  |
| `submitted_by_id` | uuid | nullable |  | User id of the parent or staff (audit only, no FK) |
| `reviewed_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `reviewed_at` | timestamptz | nullable |  |  |
| `review_remarks` | varchar(500) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, application_no); Unique (organization_id, scholarship_id, student_id, academic_year_id); Index (organization_id, scholarship_id, status, score); Index (organization_id, student_id); Index (organization_id, campus_id, status).

**Relations:** belongs to `organizations`, `campuses`, `scholarships`, `students`, `academic_years`, `users`, `scholarship_awards`.

### scholarship_awards

Prisma model `ScholarshipAward`. Tenant table (filtered by `organization_id`). Scholarship granted to a student for a year; money reaches invoices through ScholarshipDisbursement.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `scholarship_id` | uuid | not null |  | FK to `scholarships` (restrict on delete) |
| `application_id` | uuid | nullable |  | UK. FK to `scholarship_applications` (setnull on delete). null when awarded directly without an application |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `awarded_amount` | decimal(12,2) | not null |  | total value for the year |
| `awarded_percent` | decimal(5,2) | nullable |  | when the scheme is PERCENT |
| `disbursed_amount` | decimal(12,2) | not null | 0 | sum of active disbursements |
| `currency` | char(3) | not null |  |  |
| `status` | enum `ScholarshipAwardStatus` | not null | ACTIVE |  |
| `awarded_on` | date | not null |  |  |
| `valid_from` | date | nullable |  |  |
| `valid_to` | date | nullable |  |  |
| `approved_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `renewed_from_award_id` | uuid | nullable |  | UK. FK to `scholarship_awards` (setnull on delete). previous year's award that this one renews |
| `revoked_at` | timestamptz | nullable |  |  |
| `revoke_reason` | varchar(255) | nullable |  |  |
| `notes` | varchar(500) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, scholarship_id, student_id, academic_year_id); Index (organization_id, student_id, status); Index (organization_id, campus_id, academic_year_id, status).

**Relations:** belongs to `organizations`, `campuses`, `scholarships`, `scholarship_applications`, `students`, `academic_years`, `users`, `scholarship_awards`; has many `scholarship_disbursements`.

### scholarship_disbursements

Prisma model `ScholarshipDisbursement`. Tenant table (filtered by `organization_id`). Part of a scholarship award: credited against a fee invoice (adds to FeeInvoice.scholarshipCredit), or paid by the funder straight to the beneficiary (invoiceId null, paidToBeneficiary true). A retried job cannot credit twice: partial unique index in the SQL migration, uq_disbursement_active (organization_id, award_id, invoice_id) WHERE reversed_at IS NULL

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `award_id` | uuid | not null |  | FK to `scholarship_awards` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete). denormalised from the award |
| `invoice_id` | uuid | nullable |  | FK to `fee_invoices` (restrict on delete). null when the money did not go against an invoice |
| `paid_to_beneficiary` | boolean | not null | false | government / trust paid the student's or parent's bank account directly |
| `payment_id` | uuid | nullable |  | FK to `payments` (restrict on delete). Payment row created when the external funder pays the institute |
| `amount` | decimal(12,2) | not null |  |  |
| `currency` | char(3) | not null |  |  |
| `disbursed_on` | date | not null |  |  |
| `reference` | varchar(100) | nullable |  | sanction / transfer reference from the funder |
| `reversed_at` | timestamptz | nullable |  | set when the invoice is cancelled or the award revoked |
| `reversal_reason` | varchar(255) | nullable |  |  |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, award_id); Index (organization_id, invoice_id); Index (organization_id, student_id); Index (organization_id, campus_id, disbursed_on); Index (organization_id, payment_id).

**Relations:** belongs to `organizations`, `campuses`, `scholarship_awards`, `students`, `fee_invoices`, `payments`.

### fee_reminder_logs

Prisma model `FeeReminderLog`. Tenant table (filtered by `organization_id`). One fee reminder sent for an invoice. Append-only: no updatedAt / deletedAt.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `invoice_id` | uuid | not null |  | FK to `fee_invoices` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `guardian_id` | uuid | nullable |  | FK to `guardians` (setnull on delete). fee payer who received the reminder |
| `reminder_type` | enum `FeeReminderType` | not null |  |  |
| `channel` | enum `Channel` | not null |  |  |
| `message_log_id` | uuid | nullable |  | FK to `message_logs` (setnull on delete). delivery status lives in MessageLog |
| `balance_at_send` | decimal(12,2) | not null |  |  |
| `currency` | char(3) | not null |  |  |
| `is_automatic` | boolean | not null | true | false = sent by a user from the dues list |
| `triggered_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `sent_at` | timestamptz | not null | now() |  |
| `created_at` | timestamptz | not null | now() |  |

**Indexes and constraints:** Index (organization_id, invoice_id, sent_at); Index (organization_id, student_id, sent_at); Index (organization_id, campus_id, reminder_type, sent_at).

**Relations:** belongs to `organizations`, `campuses`, `fee_invoices`, `students`, `guardians`, `message_logs`.

### Enums in 08-fees.prisma

| Enum | Values | Meaning |
|---|---|---|
| `FeeHeadType` | TUITION, ADMISSION, REGISTRATION, TRANSPORT, HOSTEL, EXAM, LIBRARY, LAB, ACTIVITY, UNIFORM, BOOKS, CAUTION_DEPOSIT, FINE, ARREARS, MESS, CHEQUE_BOUNCE_CHARGE, CERTIFICATE, MISCELLANEOUS |  |
| `TaxTreatment` | TAXABLE, EXEMPT, NIL_RATED, ZERO_RATED, OUT_OF_SCOPE | How a supply is treated for tax. Most education fees are EXEMPT; coaching in India is TAXABLE; UAE education is ZERO_RATED. |
| `TaxType` | GST, VAT, SALES_TAX, NONE |  |
| `FeeApplicability` | ALL_STUDENTS, NEW_ADMISSIONS_ONLY, EXISTING_STUDENTS_ONLY | Which students a fee structure item is charged to. |
| `FeeAdjustmentType` | CONCESSION, WAIVER, LATE_FEE_WAIVER, DEBIT_CORRECTION, CREDIT_CORRECTION, PARTIAL_WRITE_OFF | Credit / debit note types for an issued invoice; the sign of the amount comes from the type. |
| `FeeFrequency` | ONE_TIME, MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY |  |
| `FeeAssignmentStatus` | ACTIVE, PAUSED, ENDED, CANCELLED |  |
| `FeeInvoiceStatus` | DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED, WRITTEN_OFF, CARRIED_FORWARD |  |
| `LateFeeCalculation` | FIXED_ONCE, FIXED_PER_DAY, FIXED_PER_MONTH, PERCENT_OF_BALANCE, PERCENT_PER_MONTH |  |
| `DiscountType` | PERCENT, FIXED |  |
| `DiscountCategory` | SIBLING, EARLY_BIRD, STAFF_CHILD, MERIT, FULL_PAYMENT, REFERRAL, FINANCIAL_AID, PROMOTIONAL, CUSTOM |  |
| `DiscountScope` | INVOICE_TOTAL, FEE_HEADS |  |
| `ScholarshipFundingSource` | INSTITUTE, GOVERNMENT, TRUST, DONOR, CORPORATE_CSR |  |
| `ScholarshipStatus` | DRAFT, OPEN, CLOSED, ARCHIVED |  |
| `ScholarshipApplicationStatus` | DRAFT, SUBMITTED, UNDER_REVIEW, SHORTLISTED, APPROVED, AWARDED, REJECTED, WITHDRAWN | Lifecycle: DRAFT -> SUBMITTED -> UNDER_REVIEW -> SHORTLISTED -> APPROVED -> AWARDED, or REJECTED / WITHDRAWN. |
| `ScholarshipAwardStatus` | ACTIVE, FULLY_DISBURSED, SUSPENDED, REVOKED, EXPIRED |  |
| `FeeReminderType` | UPCOMING_DUE, DUE_TODAY, OVERDUE, FINAL_NOTICE, MANUAL |  |

## Payments and reconciliation

Schema file `server/prisma/schema/09-payments.prisma` — 11 tables and 13 enums.

### payment_gateway_accounts

Prisma model `PaymentGatewayAccount`. Tenant table (filtered by `organization_id`). A tenant's own Razorpay / Stripe account used to collect fees online (optionally one per campus). One default account per organization is enforced by a partial unique index in the SQL migration (WHERE is_default AND deleted_at IS NULL).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (restrict on delete). null = used by every campus without its own account |
| `provider` | enum `PaymentGateway` | not null |  | RAZORPAY or STRIPE (OFFLINE is never stored here) |
| `mode` | enum `GatewayMode` | not null | TEST |  |
| `display_name` | varchar(100) | not null |  |  |
| `merchant_id` | varchar(100) | nullable |  | Razorpay merchant id / Stripe account id |
| `public_key` | varchar(200) | not null |  | key id / publishable key (safe for the client) |
| `secret_ref` | varchar(255) | not null |  | reference to the encrypted key secret in the secrets store; never the secret itself |
| `webhook_secret_ref` | varchar(255) | nullable |  | reference to the encrypted webhook signing secret |
| `currency` | char(3) | not null |  | settlement currency of the account |
| `pass_fee_to_payer` | boolean | not null | false | add the gateway charge as a convenience fee |
| `enabled_methods` | jsonb | nullable |  | e.g. ["upi", "card", "netbanking"] |
| `is_default` | boolean | not null | false |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `last_verified_at` | timestamptz | nullable |  | last successful credentials test |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, campus_id, provider, mode); Index (organization_id, provider, mode, status).

**Relations:** belongs to `organizations`, `campuses`; has many `payment_orders`, `payments`, `settlements`, `webhook_events`.

### payment_orders

Prisma model `PaymentOrder`. Tenant table (filtered by `organization_id`). Online checkout order created at the gateway before the parent pays; safe to retry with the same idempotency key.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `gateway_account_id` | uuid | not null |  | FK to `payment_gateway_accounts` (restrict on delete) |
| `purpose` | enum `PaymentPurpose` | not null | FEE |  |
| `student_id` | uuid | nullable |  | FK to `students` (restrict on delete). primary student; null for APPLICATION_FEE orders (no Student row yet) |
| `family_id` | uuid | nullable |  | FK to `families` (setnull on delete). one checkout for all children of a family |
| `admission_application_id` | uuid | nullable |  | FK to `admission_applications` (restrict on delete). APPLICATION_FEE orders |
| `payer_user_id` | uuid | nullable |  | FK to `users` (setnull on delete). parent / student login that started the checkout |
| `gateway` | enum `PaymentGateway` | not null |  |  |
| `gateway_order_id` | varchar(100) | nullable |  | Razorpay order id / Stripe PaymentIntent id |
| `amount` | decimal(12,2) | not null |  |  |
| `convenience_fee` | decimal(12,2) | not null | 0 | included in amount when passFeeToPayer |
| `convenience_fee_tax` | decimal(12,2) | not null | 0 | tax on the convenience fee; included in amount |
| `currency` | char(3) | not null |  |  |
| `status` | enum `PaymentOrderStatus` | not null | CREATED |  |
| `idempotency_key` | varchar(100) | not null |  | from the Idempotency-Key header |
| `invoice_split` | jsonb | not null |  | [{ invoiceId, amount }] intended allocation |
| `platform` | enum `DevicePlatform` | not null | WEB |  |
| `attempts` | smallint | not null | 0 |  |
| `expires_at` | timestamptz | not null |  |  |
| `paid_at` | timestamptz | nullable |  |  |
| `failure_reason` | varchar(255) | nullable |  |  |
| `metadata` | jsonb | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, idempotency_key); Unique (gateway, gateway_order_id); Index (organization_id, student_id, created_at); Index (organization_id, campus_id, status, created_at); Index (organization_id, gateway_account_id); Index (organization_id, admission_application_id); Index (organization_id, status, expires_at).

**Relations:** belongs to `organizations`, `campuses`, `payment_gateway_accounts`, `students`, `families`, `admission_applications`, `users`; has many `payments`.

### payments

Prisma model `Payment`. Tenant table (filtered by `organization_id`). Money received from a payer by any method. Never deleted: mistakes are cancelled or refunded. advance (unallocated money) = amount - convenienceFee - convenienceFeeTax - amountAllocated - amountRefunded. Student ledgers are built from PaymentAllocation.studentId, not Payment.studentId (family payments cover several children).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `purpose` | enum `PaymentPurpose` | not null | FEE |  |
| `student_id` | uuid | nullable |  | FK to `students` (restrict on delete). primary student; null for application fees and staff payments |
| `family_id` | uuid | nullable |  | FK to `families` (setnull on delete). family payment: one cheque / UPI transfer for several children |
| `admission_application_id` | uuid | nullable |  | FK to `admission_applications` (restrict on delete). APPLICATION_FEE payments |
| `staff_id` | uuid | nullable |  | FK to `staff` (restrict on delete). staff payer, e.g. LIBRARY_FINE of a staff member |
| `payer_guardian_id` | uuid | nullable |  | FK to `guardians` (setnull on delete) |
| `payer_name` | varchar(160) | nullable |  | printed on the receipt |
| `payment_order_id` | uuid | nullable |  | FK to `payment_orders` (restrict on delete). online payments only |
| `gateway_account_id` | uuid | nullable |  | FK to `payment_gateway_accounts` (restrict on delete) |
| `settlement_id` | uuid | nullable |  | FK to `settlements` (setnull on delete). gateway payout that contained this payment |
| `day_close_id` | uuid | nullable |  | FK to `day_closes` (setnull on delete). daily cash close that included this payment |
| `method` | enum `PaymentMethod` | not null |  |  |
| `amount` | decimal(12,2) | not null |  |  |
| `convenience_fee` | decimal(12,2) | not null | 0 | part of amount that is not fee income (gateway charge passed to the payer) |
| `convenience_fee_tax` | decimal(12,2) | not null | 0 |  |
| `currency` | char(3) | not null |  |  |
| `status` | enum `PaymentStatus` | not null | SUCCESS |  |
| `payment_date` | date | not null |  | day-book date in the campus timezone |
| `paid_at` | timestamptz | not null | now() |  |
| `received_by_id` | uuid | nullable |  | FK to `users` (setnull on delete). accountant at the counter; null for online payments |
| `gateway` | enum `PaymentGateway` | not null | OFFLINE |  |
| `gateway_payment_id` | varchar(100) | nullable |  |  |
| `gateway_fee` | decimal(12,2) | nullable |  |  |
| `gateway_tax` | decimal(12,2) | nullable |  | tax on the gateway fee |
| `method_details` | jsonb | nullable |  | masked only: { vpa, cardLast4, cardNetwork, bank, wallet } |
| `cheque_no` | varchar(20) | nullable |  |  |
| `cheque_date` | date | nullable |  |  |
| `cheque_bank` | varchar(100) | nullable |  |  |
| `cheque_branch` | varchar(100) | nullable |  |  |
| `cheque_status` | enum `ChequeStatus` | nullable |  |  |
| `cheque_deposited_on` | date | nullable |  |  |
| `cheque_cleared_on` | date | nullable |  |  |
| `cheque_bounced_on` | date | nullable |  |  |
| `bounce_reason` | varchar(255) | nullable |  |  |
| `bounce_charge` | decimal(12,2) | nullable |  | charge debited by the bank |
| `bounce_charge_invoice_id` | uuid | nullable |  | FK to `fee_invoices` (setnull on delete). ad-hoc CHEQUE_BOUNCE_CHARGE invoice raised to the parent |
| `gateway_dispute_id` | varchar(100) | nullable |  |  |
| `dispute_status` | varchar(30) | nullable |  | provider status, e.g. needs_response, won, lost |
| `dispute_reason` | varchar(255) | nullable |  |  |
| `disputed_amount` | decimal(12,2) | nullable |  |  |
| `dispute_opened_at` | timestamptz | nullable |  |  |
| `dispute_resolved_at` | timestamptz | nullable |  |  |
| `reference` | varchar(100) | nullable |  | UTR / transaction reference for UPI, bank transfer, card slip |
| `idempotency_key` | varchar(100) | nullable |  | from the Idempotency-Key header on counter payments |
| `amount_allocated` | decimal(12,2) | not null | 0 | sum of active allocations; the rest is an advance |
| `amount_refunded` | decimal(12,2) | not null | 0 |  |
| `failure_reason` | varchar(255) | nullable |  |  |
| `notes` | varchar(500) | nullable |  |  |
| `cancelled_at` | timestamptz | nullable |  |  |
| `cancelled_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `cancel_reason` | varchar(255) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (id, organization_id); Unique (gateway, gateway_payment_id); Unique (organization_id, idempotency_key); Index (organization_id, student_id, payment_date); Index (organization_id, campus_id, payment_date, method); Index (organization_id, campus_id, status, payment_date); Index (organization_id, purpose, payment_date); Index (organization_id, received_by_id, payment_date); Index (organization_id, cheque_status, cheque_date); Index (organization_id, settlement_id); Index (organization_id, payment_order_id); Index (organization_id, day_close_id); Index (organization_id, gateway_account_id, payment_date); Index (organization_id, admission_application_id); Index (organization_id, family_id).

**Relations:** belongs to `organizations`, `campuses`, `students`, `families`, `admission_applications`, `staff`, `fee_invoices`, `guardians`, `payment_orders`, `payment_gateway_accounts`, `settlements`, `day_closes`, `users`, `receipts`; has many `payment_allocations`, `refunds`, `scholarship_disbursements`, `book_issues`.

### payment_allocations

Prisma model `PaymentAllocation`. Tenant table (filtered by `organization_id`). Split of a payment across fee invoices. Reversed (not deleted) when the payment is cancelled or bounced. One ACTIVE allocation per payment + invoice is enforced by a partial unique index in the SQL migration: uq_payment_allocation_active (organization_id, payment_id, invoice_id) WHERE reversed_at IS NULL so a re-presented cheque or a corrected split can be allocated to the same invoice again.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `payment_id` | uuid | not null |  | FK to `payments` (restrict on delete) |
| `invoice_id` | uuid | not null |  | FK to `fee_invoices` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete). denormalised from the invoice; may differ from Payment.studentId for family payments |
| `amount` | decimal(12,2) | not null |  |  |
| `amount_refunded` | decimal(12,2) | not null | 0 | sum of RefundAllocation rows |
| `currency` | char(3) | not null |  |  |
| `allocated_at` | timestamptz | not null | now() |  |
| `allocated_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `reversed_at` | timestamptz | nullable |  |  |
| `reversed_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `reversal_reason` | varchar(255) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, payment_id, invoice_id); Index (organization_id, invoice_id); Index (organization_id, student_id, allocated_at).

**Relations:** belongs to `organizations`, `payments`, `fee_invoices`, `students`; has many `payment_allocation_items`, `refund_allocations`.

### payment_allocation_items

Prisma model `PaymentAllocationItem`. Tenant table (filtered by `organization_id`). Head-wise split of one payment allocation (which fee heads a partial payment settled, by FeeHead.settlementPriority).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `allocation_id` | uuid | not null |  | FK to `payment_allocations` (restrict on delete) |
| `invoice_item_id` | uuid | not null |  | FK to `fee_invoice_items` (restrict on delete) |
| `fee_head_id` | uuid | not null |  | FK to `fee_heads` (restrict on delete). denormalised from the invoice item for the head-wise collection report |
| `amount` | decimal(12,2) | not null |  |  |
| `tax_portion` | decimal(12,2) | not null | 0 | part of amount that is tax (receipt-basis GST) |
| `currency` | char(3) | not null |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, allocation_id, invoice_item_id); Index (organization_id, fee_head_id); Index (organization_id, invoice_item_id).

**Relations:** belongs to `organizations`, `payment_allocations`, `fee_invoice_items`, `fee_heads`.

### receipts

Prisma model `Receipt`. Tenant table (filtered by `organization_id`). Numbered receipt for a successful payment (one per payment) with the PDF. Cancelled, never deleted.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `payment_id` | uuid | not null |  | UK. FK to `payments` (restrict on delete) |
| `purpose` | enum `PaymentPurpose` | not null | FEE |  |
| `student_id` | uuid | nullable |  | FK to `students` (restrict on delete). null for application-fee and staff receipts |
| `admission_application_id` | uuid | nullable |  | FK to `admission_applications` (restrict on delete) |
| `receipt_no` | varchar(40) | not null |  | gap-free, from NumberSequence RECEIPT_NO |
| `receipt_date` | date | not null |  |  |
| `financial_year` | varchar(9) | nullable |  | 2027-28 |
| `method` | enum `PaymentMethod` | not null |  | frozen from the payment |
| `amount` | decimal(12,2) | not null |  |  |
| `tax_amount` | decimal(12,2) | not null | 0 |  |
| `currency` | char(3) | not null |  |  |
| `status` | enum `ReceiptStatus` | not null | ISSUED |  |
| `snapshot` | jsonb | not null |  | frozen student, batch, payer, method, allocations [{ invoiceNo, amount }], fee-head lines and tax breakdown used to render the PDF |
| `content_hash` | char(64) | nullable |  | SHA-256 of snapshot; verified before re-render |
| `replaced_by_receipt_id` | uuid | nullable |  | FK to `receipts` (setnull on delete). receipt issued in place of this cancelled one |
| `pdf_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete) |
| `sent_at` | timestamptz | nullable |  | shared with the parent on WhatsApp / email |
| `issued_by_id` | uuid | nullable |  | User id (audit only, no FK); null for online payments |
| `cancelled_at` | timestamptz | nullable |  |  |
| `cancelled_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `cancel_reason` | varchar(255) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (payment_id, organization_id); Unique (organization_id, receipt_no); Index (organization_id, student_id, receipt_date); Index (organization_id, campus_id, receipt_date, status).

**Relations:** belongs to `organizations`, `campuses`, `payments`, `students`, `admission_applications`, `file_assets`, `users`, `receipts`; has many `receipts`.

### refunds

Prisma model `Refund`. Tenant table (filtered by `organization_id`). Refund of a payment (full or part) with approval; online refunds go back through the gateway.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `payment_id` | uuid | not null |  | FK to `payments` (restrict on delete) |
| `student_id` | uuid | nullable |  | FK to `students` (restrict on delete). null for application-fee refunds |
| `refund_no` | varchar(40) | not null |  | from NumberSequence REFUND_NO |
| `refund_type` | enum `RefundType` | not null | PAYMENT_REVERSAL |  |
| `invoice_id` | uuid | nullable |  | FK to `fee_invoices` (restrict on delete). main invoice the money goes back against; the exact split is in RefundAllocation |
| `fee_head_id` | uuid | nullable |  | FK to `fee_heads` (restrict on delete). e.g. the refundable caution deposit head |
| `gross_amount` | decimal(12,2) | nullable |  | before deductions; amount = grossAmount - deductionAmount |
| `deduction_amount` | decimal(12,2) | not null | 0 | damage / cancellation charges kept back |
| `deduction_reason` | varchar(255) | nullable |  |  |
| `amount` | decimal(12,2) | not null |  | money actually paid back |
| `currency` | char(3) | not null |  |  |
| `refund_date` | date | nullable |  | day-book date in the campus timezone |
| `idempotency_key` | varchar(100) | nullable |  | from the Idempotency-Key header; stops double refunds on retry / double click |
| `day_close_id` | uuid | nullable |  | FK to `day_closes` (setnull on delete). cash refunds summed in DayClose.cashRefunded |
| `settlement_id` | uuid | nullable |  | FK to `settlements` (setnull on delete). gateway payout that netted this refund |
| `reason` | varchar(500) | not null |  |  |
| `status` | enum `RefundStatus` | not null | REQUESTED |  |
| `method` | enum `PaymentMethod` | not null |  | how the money goes back |
| `gateway` | enum `PaymentGateway` | not null | OFFLINE |  |
| `gateway_refund_id` | varchar(100) | nullable |  |  |
| `reference` | varchar(100) | nullable |  | UTR / cheque number of an offline refund |
| `requested_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `approved_by_id` | uuid | nullable |  | FK to `users` (setnull on delete). User who approved or rejected |
| `approved_at` | timestamptz | nullable |  |  |
| `rejection_reason` | varchar(255) | nullable |  |  |
| `processed_at` | timestamptz | nullable |  |  |
| `processed_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `voucher_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete). signed refund voucher |
| `failure_reason` | varchar(255) | nullable |  |  |
| `cancelled_at` | timestamptz | nullable |  |  |
| `cancel_reason` | varchar(255) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, refund_no); Unique (organization_id, idempotency_key); Unique (gateway, gateway_refund_id); Index (organization_id, payment_id); Index (organization_id, invoice_id); Index (organization_id, settlement_id); Index (organization_id, day_close_id); Index (organization_id, campus_id, refund_date); Index (organization_id, campus_id, status, created_at); Index (organization_id, student_id).

**Relations:** belongs to `organizations`, `campuses`, `payments`, `students`, `fee_invoices`, `fee_heads`, `day_closes`, `settlements`, `file_assets`, `users`; has many `refund_allocations`.

### refund_allocations

Prisma model `RefundAllocation`. Tenant table (filtered by `organization_id`). Which allocation / invoice the refunded money comes out of, so amountPaid and balance can be recomputed and the right invoice reopens.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `refund_id` | uuid | not null |  | FK to `refunds` (restrict on delete) |
| `payment_allocation_id` | uuid | nullable |  | FK to `payment_allocations` (restrict on delete). null = refund of the unallocated advance |
| `invoice_id` | uuid | nullable |  | FK to `fee_invoices` (restrict on delete) |
| `amount` | decimal(12,2) | not null |  |  |
| `currency` | char(3) | not null |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, refund_id); Index (organization_id, invoice_id); Index (organization_id, payment_allocation_id).

**Relations:** belongs to `organizations`, `refunds`, `payment_allocations`, `fee_invoices`.

### webhook_events

Prisma model `WebhookEvent`. Tenant table (filtered by `organization_id`). Inbox of provider webhooks. The unique (provider, eventId) key makes handling idempotent.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | nullable |  | FK to `organizations` (restrict on delete). null until the worker resolves the tenant from the payload |
| `gateway_account_id` | uuid | nullable |  | FK to `payment_gateway_accounts` (setnull on delete). payment providers only |
| `provider` | enum `WebhookProvider` | not null |  |  |
| `event_id` | varchar(150) | not null |  | provider's event id (or a payload hash when none is sent) |
| `event_type` | varchar(100) | not null |  | e.g. payment.captured, charge.refunded |
| `signature_valid` | boolean | not null | false |  |
| `payload` | jsonb | not null |  |  |
| `headers` | jsonb | nullable |  | selected request headers kept for debugging |
| `status` | enum `WebhookEventStatus` | not null | RECEIVED |  |
| `attempts` | smallint | not null | 0 |  |
| `last_error` | text | nullable |  |  |
| `next_retry_at` | timestamptz | nullable |  |  |
| `related_entity_type` | varchar(60) | nullable |  | Payment, Refund, MessageLog ... |
| `related_entity_id` | uuid | nullable |  |  |
| `received_at` | timestamptz | not null | now() |  |
| `processed_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (provider, event_id); Index (organization_id, provider, received_at); Index (organization_id, status, received_at); Index (status, next_retry_at).

**Relations:** belongs to `organizations`, `payment_gateway_accounts`.

### settlements

Prisma model `Settlement`. Tenant table (filtered by `organization_id`). Gateway payout to the institute's bank account, reconciled against the payments it contains.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `gateway_account_id` | uuid | not null |  | FK to `payment_gateway_accounts` (restrict on delete) |
| `gateway` | enum `PaymentGateway` | not null |  |  |
| `gateway_settlement_id` | varchar(100) | not null |  |  |
| `settlement_date` | date | not null |  |  |
| `currency` | char(3) | not null |  |  |
| `gross_amount` | decimal(12,2) | not null |  |  |
| `fee_amount` | decimal(12,2) | not null | 0 |  |
| `tax_amount` | decimal(12,2) | not null | 0 |  |
| `refund_amount` | decimal(12,2) | not null | 0 |  |
| `chargeback_amount` | decimal(12,2) | not null | 0 | disputes debited in this payout |
| `adjustment_amount` | decimal(12,2) | not null | 0 | other gateway adjustments (+/-) |
| `net_amount` | decimal(12,2) | not null |  | credited to the bank: gross - fee - tax - refund - chargeback + adjustment |
| `utr` | varchar(50) | nullable |  | bank reference of the payout |
| `payment_count` | integer | not null | 0 |  |
| `status` | enum `SettlementStatus` | not null | PENDING |  |
| `mismatch_amount` | decimal(12,2) | nullable |  |  |
| `reconciled_at` | timestamptz | nullable |  |  |
| `reconciled_by_id` | uuid | nullable |  | User id (audit only, no FK); null when auto-reconciled |
| `raw_data` | jsonb | nullable |  | settlement report rows from the gateway |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, gateway, gateway_settlement_id); Index (organization_id, settlement_date); Index (organization_id, status).

**Relations:** belongs to `organizations`, `payment_gateway_accounts`; has many `payments`, `refunds`.

### day_closes

Prisma model `DayClose`. Tenant table (filtered by `organization_id`). Daily cash closing by an accountant: counted cash vs system cash, and the bank deposit.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `close_date` | date | not null |  |  |
| `closed_by_id` | uuid | not null |  | FK to `users` (restrict on delete). accountant whose counter is closed |
| `currency` | char(3) | not null |  |  |
| `opening_cash` | decimal(12,2) | not null | 0 |  |
| `cash_collected` | decimal(12,2) | not null | 0 |  |
| `cash_refunded` | decimal(12,2) | not null | 0 |  |
| `expected_cash` | decimal(12,2) | not null |  | opening + collected - refunded |
| `counted_cash` | decimal(12,2) | not null |  |  |
| `variance` | decimal(12,2) | not null | 0 | counted - expected |
| `denominations` | jsonb | nullable |  | { "500": 12, "200": 5, ... } |
| `totals_by_method` | jsonb | nullable |  | { CASH, UPI, CARD, CHEQUE ... } for the day |
| `payment_count` | integer | not null | 0 |  |
| `deposited_amount` | decimal(12,2) | nullable |  |  |
| `deposit_bank` | varchar(100) | nullable |  |  |
| `deposit_slip_no` | varchar(50) | nullable |  |  |
| `deposited_on` | date | nullable |  |  |
| `deposit_slip_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete). scanned deposit slip |
| `closing_cash` | decimal(12,2) | nullable |  | cash kept in hand; next day's opening |
| `status` | enum `DayCloseStatus` | not null | OPEN |  |
| `notes` | varchar(500) | nullable |  |  |
| `submitted_at` | timestamptz | nullable |  |  |
| `verified_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `verified_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, campus_id, close_date, closed_by_id); Index (organization_id, campus_id, close_date); Index (organization_id, status, close_date).

**Relations:** belongs to `organizations`, `campuses`, `users`, `file_assets`; has many `payments`, `refunds`.

### Enums in 09-payments.prisma

| Enum | Values | Meaning |
|---|---|---|
| `GatewayMode` | TEST, LIVE |  |
| `PaymentOrderStatus` | CREATED, ATTEMPTED, PAID, FAILED, EXPIRED, CANCELLED |  |
| `PaymentMethod` | CASH, UPI, CARD, NETBANKING, CHEQUE, DEMAND_DRAFT, BANK_TRANSFER, WALLET, ONLINE_GATEWAY |  |
| `PaymentStatus` | PENDING, SUCCESS, FAILED, CANCELLED, BOUNCED, PARTIALLY_REFUNDED, REFUNDED, DISPUTED, CHARGED_BACK |  |
| `PaymentPurpose` | FEE, APPLICATION_FEE, LIBRARY_FINE, CERTIFICATE_FEE, DEPOSIT, OTHER | What the money was paid for. Only FEE payments are allocated to fee invoices. |
| `RefundType` | PAYMENT_REVERSAL, EXCESS_PAYMENT, WITHDRAWAL, CAUTION_DEPOSIT, APPLICATION_FEE, OTHER |  |
| `ChequeStatus` | RECEIVED, DEPOSITED, CLEARED, BOUNCED, RETURNED |  |
| `ReceiptStatus` | ISSUED, CANCELLED |  |
| `RefundStatus` | REQUESTED, APPROVED, REJECTED, PROCESSING, PROCESSED, FAILED |  |
| `WebhookProvider` | RAZORPAY, STRIPE, WHATSAPP, MSG91, TWILIO, SES |  |
| `WebhookEventStatus` | RECEIVED, PROCESSING, PROCESSED, FAILED, IGNORED |  |
| `SettlementStatus` | PENDING, PROCESSED, RECONCILED, MISMATCH, FAILED |  |
| `DayCloseStatus` | OPEN, SUBMITTED, VERIFIED, DISCREPANCY |  |

## Communication

Schema file `server/prisma/schema/10-communication.prisma` — 16 tables and 14 enums.

### notification_templates

Prisma model `NotificationTemplate`. Tenant table (filtered by `organization_id`). Message template per event, channel and language. organizationId null = EduFlow default used until a tenant overrides it.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | nullable |  | FK to `organizations` (cascade on delete). null ONLY for system default templates |
| `event_key` | varchar(80) | not null |  | e.g. attendance.absent, fees.receipt, fees.reminder.overdue |
| `channel` | enum `Channel` | not null |  |  |
| `language` | varchar(10) | not null | "en" |  |
| `category` | enum `NotificationCategory` | not null |  |  |
| `name` | varchar(120) | not null |  |  |
| `subject` | varchar(200) | nullable |  | email subject / push title |
| `body` | text | not null |  | text with {{variables}}, e.g. "{{studentName}} was absent on {{date}}" |
| `variables` | text[] | not null |  | allowed variable names, in order for WhatsApp / DLT positional placeholders |
| `whats_app_template_id` | uuid | nullable |  | FK to `whats_app_templates` (setnull on delete). approved Meta template used for the WHATSAPP channel |
| `sms_dlt_template_id` | uuid | nullable |  | FK to `sms_dlt_templates` (setnull on delete). registered TRAI DLT content template for the SMS channel (India); language-specific |
| `sms_sender_id_id` | uuid | nullable |  | FK to `sms_sender_ids` (setnull on delete). SMS header to send with |
| `approval_status` | enum `TemplateApprovalStatus` | not null | NOT_REQUIRED |  |
| `is_system` | boolean | not null | false |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `updated_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, event_key, channel, language); Index (organization_id, category, status); Index (event_key, channel, language).

**Relations:** belongs to `organizations`, `whats_app_templates`, `sms_sender_ids`, `sms_dlt_templates`; has many `message_logs`.

### notifications

Prisma model `Notification`. Tenant table (filtered by `organization_id`). In-app notification shown in the bell menu of one user.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `user_id` | uuid | not null |  | FK to `users` (cascade on delete) |
| `category` | enum `NotificationCategory` | not null |  |  |
| `event_key` | varchar(80) | nullable |  |  |
| `title` | varchar(200) | not null |  |  |
| `body` | varchar(1000) | not null |  |  |
| `deep_link` | varchar(500) | nullable |  | app route, e.g. /fees/invoices/{id} |
| `entity_type` | varchar(60) | nullable |  |  |
| `entity_id` | uuid | nullable |  |  |
| `data` | jsonb | nullable |  | extra payload for the client |
| `read_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, user_id, read_at, created_at); Index (organization_id, user_id, created_at); Index (created_at).

**Relations:** belongs to `organizations`, `users`.

### notification_preferences

Prisma model `NotificationPreference`. Tenant table (filtered by `organization_id`). A user's opt-in / opt-out per channel and category.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `user_id` | uuid | not null |  | FK to `users` (cascade on delete) |
| `channel` | enum `Channel` | not null |  |  |
| `category` | enum `NotificationCategory` | not null |  |  |
| `is_enabled` | boolean | not null | true |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, user_id, channel, category); Index (organization_id, channel, category, is_enabled).

**Relations:** belongs to `organizations`, `users`.

### announcements

Prisma model `Announcement`. Tenant table (filtered by `organization_id`). Notice / circular sent to a filtered audience over one or more channels, now or scheduled.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (restrict on delete). null = all campuses |
| `title` | varchar(200) | not null |  |  |
| `body` | text | not null |  |  |
| `audience` | enum `Audience` | not null | ALL |  |
| `audience_filter` | jsonb | nullable |  | { courseIds, batchIds, roleKeys, studentIds, feeDefaultersOnly } |
| `channels` | enum `Channel`[] | not null |  | IN_APP is always implied |
| `attachment_file_ids` | uuid[] | not null |  | FileAsset ids |
| `status` | enum `AnnouncementStatus` | not null | DRAFT |  |
| `is_pinned` | boolean | not null | false |  |
| `requires_ack` | boolean | not null | false | parents must tap "I have read this" |
| `scheduled_at` | timestamptz | nullable |  |  |
| `sent_at` | timestamptz | nullable |  |  |
| `expires_at` | timestamptz | nullable |  | hidden from the portals after this time |
| `recipient_count` | integer | not null | 0 |  |
| `read_count` | integer | not null | 0 |  |
| `author_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, campus_id, status, created_at); Index (organization_id, status, scheduled_at).

**Relations:** belongs to `organizations`, `campuses`, `users`; has many `announcement_recipients`, `message_logs`.

### announcement_recipients

Prisma model `AnnouncementRecipient`. Tenant table (filtered by `organization_id`). One resolved recipient of an announcement with read / acknowledgement tracking.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `announcement_id` | uuid | not null |  | FK to `announcements` (cascade on delete) |
| `recipient_type` | enum `MessageRecipientType` | not null |  |  |
| `recipient_id` | uuid | not null |  | id of the Guardian / Student / Staff / User row |
| `user_id` | uuid | nullable |  | FK to `users` (cascade on delete). login of the recipient when one exists (portal inbox) |
| `student_id` | uuid | nullable |  | FK to `students` (cascade on delete). the child the notice is about, for parents |
| `read_at` | timestamptz | nullable |  |  |
| `acknowledged_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, announcement_id, recipient_type, recipient_id); Index (organization_id, user_id, read_at).

**Relations:** belongs to `organizations`, `announcements`, `users`, `students`.

### message_logs

Prisma model `MessageLog`. Tenant table (filtered by `organization_id`). Every WhatsApp, SMS, email and push message sent, with delivery status and cost. High volume; never soft-deleted. cost / currency = amount debited from the tenant wallet; providerCost + marginAmount explain it (WhatsApp: Meta cost + 15 % margin).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (setnull on delete) |
| `channel` | enum `Channel` | not null |  |  |
| `provider` | enum `MessageProvider` | not null |  |  |
| `to_address` | varchar(255) | not null |  | phone (E.164), email or device token id |
| `recipient_type` | enum `MessageRecipientType` | not null |  |  |
| `recipient_id` | uuid | nullable |  | id of the Guardian / Student / Staff / User / inquiry row |
| `student_id` | uuid | nullable |  | FK to `students` (setnull on delete). student the message is about (communication timeline) |
| `template_id` | uuid | nullable |  | FK to `notification_templates` (setnull on delete) |
| `whats_app_template_id` | uuid | nullable |  | FK to `whats_app_templates` (setnull on delete) |
| `whats_app_account_id` | uuid | nullable |  | FK to `whats_app_accounts` (setnull on delete). sending number |
| `sms_sender_id_id` | uuid | nullable |  | FK to `sms_sender_ids` (setnull on delete). SMS header used |
| `dlt_template_id` | varchar(30) | nullable |  | snapshot of the DLT content template id actually sent |
| `dlt_entity_id` | varchar(30) | nullable |  | snapshot of the DLT principal entity id |
| `recipient_country_code` | char(2) | nullable |  | per-country WhatsApp / SMS rates |
| `pricing_category` | varchar(20) | nullable |  | MARKETING \| UTILITY \| AUTHENTICATION \| SERVICE |
| `is_billable` | boolean | not null | true | false for free-window / service conversations |
| `announcement_id` | uuid | nullable |  | FK to `announcements` (setnull on delete) |
| `event_key` | varchar(80) | nullable |  |  |
| `subject` | varchar(200) | nullable |  |  |
| `body` | text | nullable |  | rendered text (OTP values are masked) |
| `variables` | jsonb | nullable |  | values used to render the template |
| `status` | enum `MessageStatus` | not null | QUEUED |  |
| `provider_message_id` | varchar(150) | nullable |  |  |
| `segments` | smallint | not null | 1 | SMS parts |
| `cost` | decimal(12,4) | not null | 0 | amount charged to the tenant wallet; 4 decimals: per-message prices are fractions of a rupee |
| `currency` | char(3) | nullable |  | wallet currency |
| `provider_cost` | decimal(12,4) | not null | 0 | what Meta / MSG91 / Twilio charges EduFlow |
| `provider_currency` | char(3) | nullable |  |  |
| `exchange_rate` | decimal(18,8) | nullable |  | providerCurrency -> currency at send time (ExchangeRate) |
| `margin_amount` | decimal(12,4) | not null | 0 | in the wallet currency |
| `error_code` | varchar(60) | nullable |  |  |
| `error` | varchar(500) | nullable |  |  |
| `retry_count` | smallint | not null | 0 |  |
| `queued_at` | timestamptz | not null | now() |  |
| `sent_at` | timestamptz | nullable |  |  |
| `delivered_at` | timestamptz | nullable |  |  |
| `read_at` | timestamptz | nullable |  |  |
| `failed_at` | timestamptz | nullable |  |  |
| `triggered_by_id` | uuid | nullable |  | User id (audit only, no FK); null for automatic messages |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (provider, provider_message_id); Index (organization_id, channel, status, created_at); Index (organization_id, channel, pricing_category, created_at); Index (organization_id, campus_id, created_at); Index (organization_id, recipient_type, recipient_id, created_at); Index (organization_id, student_id, created_at); Index (organization_id, announcement_id); Index (organization_id, to_address, created_at).

**Relations:** belongs to `organizations`, `campuses`, `students`, `notification_templates`, `whats_app_templates`, `whats_app_accounts`, `sms_sender_ids`, `announcements`; has many `credit_transactions`, `whats_app_inbound_messages`, `email_suppressions`, `fee_reminder_logs`.

### whats_app_accounts

Prisma model `WhatsAppAccount`. Tenant table (filtered by `organization_id`). A tenant's WhatsApp Business Account number connected through the Meta Cloud API. phoneNumberId routes inbound webhooks, so it is unique among LIVE rows only (a disconnected number can be reconnected): partial unique index in the SQL migration, uq_whatsapp_phone_number_live (phone_number_id) WHERE deleted_at IS NULL One default account per organization: partial unique index WHERE is_default AND deleted_at IS NULL.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (restrict on delete). null = shared by all campuses |
| `waba_id` | varchar(40) | not null |  | WhatsApp Business Account id |
| `phone_number_id` | varchar(40) | not null |  | Meta phone number id; routes inbound webhooks to the tenant |
| `display_phone_number` | varchar(20) | not null |  |  |
| `verified_name` | varchar(150) | nullable |  |  |
| `access_token_ref` | varchar(255) | not null |  | reference to the encrypted system-user token in the secrets store |
| `quality_rating` | enum `WhatsAppQualityRating` | not null | UNKNOWN |  |
| `messaging_limit_tier` | varchar(20) | nullable |  | TIER_1K, TIER_10K ... |
| `is_default` | boolean | not null | false |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `connected_at` | timestamptz | nullable |  |  |
| `last_synced_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, status); Index (organization_id, campus_id); Index (phone_number_id).

**Relations:** belongs to `organizations`, `campuses`; has many `whats_app_templates`, `whats_app_inbound_messages`, `message_logs`.

### whats_app_templates

Prisma model `WhatsAppTemplate`. Tenant table (filtered by `organization_id`). WhatsApp message template registered with Meta (name + language), synced with its approval status.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `whats_app_account_id` | uuid | not null |  | FK to `whats_app_accounts` (cascade on delete) |
| `name` | varchar(120) | not null |  | lower_snake_case name at Meta |
| `category` | enum `WhatsAppTemplateCategory` | not null |  |  |
| `language` | varchar(10) | not null |  | en, hi, en_US |
| `status` | enum `TemplateApprovalStatus` | not null | DRAFT |  |
| `meta_template_id` | varchar(60) | nullable |  |  |
| `components` | jsonb | not null |  | header, body, footer and buttons as sent to Meta |
| `body_text` | text | not null |  |  |
| `variable_count` | smallint | not null | 0 |  |
| `rejection_reason` | varchar(500) | nullable |  |  |
| `submitted_at` | timestamptz | nullable |  |  |
| `last_synced_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, whats_app_account_id, name, language); Index (organization_id, status, category).

**Relations:** belongs to `organizations`, `whats_app_accounts`; has many `notification_templates`, `message_logs`.

### whats_app_inbound_messages

Prisma model `WhatsAppInboundMessage`. Tenant table (filtered by `organization_id`). Message received from a parent on the institute's WhatsApp number (opens the 24-hour reply window).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `whats_app_account_id` | uuid | not null |  | FK to `whats_app_accounts` (cascade on delete) |
| `wa_message_id` | varchar(150) | not null |  | Meta message id (wamid...) |
| `from_phone` | varchar(20) | not null |  | E.164 |
| `profile_name` | varchar(150) | nullable |  |  |
| `message_type` | enum `WhatsAppMessageType` | not null | TEXT |  |
| `text` | text | nullable |  |  |
| `media_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete). media downloaded into S3 |
| `payload` | jsonb | not null |  | raw message object from the webhook |
| `reply_to_message_log_id` | uuid | nullable |  | FK to `message_logs` (setnull on delete). outbound message this one replies to |
| `guardian_id` | uuid | nullable |  | FK to `guardians` (setnull on delete). matched by phone number |
| `received_at` | timestamptz | not null |  |  |
| `read_at` | timestamptz | nullable |  | opened by staff in the inbox |
| `handled_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, wa_message_id); Index (organization_id, whats_app_account_id, received_at); Index (organization_id, from_phone, received_at); Index (organization_id, read_at).

**Relations:** belongs to `organizations`, `whats_app_accounts`, `file_assets`, `message_logs`, `guardians`.

### email_sender_identities

Prisma model `EmailSenderIdentity`. Tenant table (filtered by `organization_id`). "From" address of a tenant verified in Amazon SES (domain with DKIM).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `from_name` | varchar(120) | not null |  |  |
| `from_email` | varchar(255) | not null |  |  |
| `reply_to_email` | varchar(255) | nullable |  |  |
| `domain` | varchar(255) | not null |  |  |
| `dkim_verified` | boolean | not null | false |  |
| `dkim_records` | jsonb | nullable |  | CNAME records the tenant must add to DNS |
| `spf_verified` | boolean | not null | false |  |
| `verification_status` | enum `SenderVerificationStatus` | not null | PENDING |  |
| `verified_at` | timestamptz | nullable |  |  |
| `last_checked_at` | timestamptz | nullable |  |  |
| `is_default` | boolean | not null | false |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, from_email); Index (organization_id, status); Index (domain).

**Relations:** belongs to `organizations`.

### email_suppressions

Prisma model `EmailSuppression`. Tenant table (filtered by `organization_id`). Email address that must not be mailed again (hard bounce, spam complaint, unsubscribe).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `email` | varchar(255) | not null |  | lower-case |
| `reason` | enum `EmailSuppressionReason` | not null |  |  |
| `detail` | varchar(500) | nullable |  | bounce sub-type or diagnostic code from SES |
| `message_log_id` | uuid | nullable |  | FK to `message_logs` (setnull on delete). message that caused the suppression |
| `suppressed_at` | timestamptz | not null | now() |  |
| `expires_at` | timestamptz | nullable |  | soft-bounce blocks expire; hard bounces do not |
| `removed_at` | timestamptz | nullable |  | manually cleared by an admin |
| `removed_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, email); Index (organization_id, reason).

**Relations:** belongs to `organizations`, `message_logs`.

### sms_sender_ids

Prisma model `SmsSenderId`. Tenant table (filtered by `organization_id`). SMS header (sender id) with the TRAI DLT registration needed in India; Twilio numbers for other countries.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `provider` | enum `MessageProvider` | not null | MSG91 |  |
| `header` | varchar(20) | not null |  | 6-character DLT header, e.g. BFPSCH, or a phone number for Twilio |
| `country_code` | char(2) | not null | "IN" |  |
| `dlt_entity_id` | varchar(30) | nullable |  | principal entity id on the DLT portal |
| `dlt_telemarketer_id` | varchar(30) | nullable |  | telemarketer id of the PE-TM chain (MSG91) |
| `verification_status` | enum `SenderVerificationStatus` | not null | PENDING |  |
| `is_default` | boolean | not null | false |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, header); Index (organization_id, status).

**Relations:** belongs to `organizations`; has many `notification_templates`, `sms_dlt_templates`, `message_logs`.

### sms_dlt_templates

Prisma model `SmsDltTemplate`. Tenant table (filtered by `organization_id`). DLT content template registered on the TRAI DLT portal under one header: exact text, category, language and approval.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `sms_sender_id_id` | uuid | not null |  | FK to `sms_sender_ids` (cascade on delete) |
| `dlt_template_id` | varchar(30) | not null |  | id issued by the DLT portal |
| `name` | varchar(120) | not null |  |  |
| `category` | enum `DltTemplateCategory` | not null |  |  |
| `language` | varchar(10) | not null | "en" |  |
| `is_unicode` | boolean | not null | false | Hindi and other non-Latin scripts |
| `body_text` | text | not null |  | registered text with {#var#} placeholders; messages are validated against it before sending |
| `variable_count` | smallint | not null | 0 |  |
| `approval_status` | enum `TemplateApprovalStatus` | not null | PENDING |  |
| `approved_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, dlt_template_id); Index (organization_id, sms_sender_id_id, approval_status).

**Relations:** belongs to `organizations`, `sms_sender_ids`; has many `notification_templates`.

### message_credit_wallets

Prisma model `MessageCreditWallet`. Tenant table (filtered by `organization_id`). Prepaid balance of a tenant for one paid channel (WhatsApp or SMS). available = balance - reserved. SQL migration adds: CHECK (balance >= 0 AND reserved >= 0) so concurrent campaigns cannot overdraw the wallet.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `channel` | enum `Channel` | not null |  | WHATSAPP or SMS |
| `unit` | enum `CreditUnit` | not null |  |  |
| `balance` | decimal(12,4) | not null | 0 | messages or money, by unit; updated in the same transaction as CreditTransaction |
| `currency` | char(3) | nullable |  | set when unit is MONEY |
| `total_purchased` | decimal(12,4) | not null | 0 |  |
| `reserved` | decimal(12,4) | not null | 0 | held for queued campaigns (RESERVE / RELEASE rows) |
| `total_consumed` | decimal(12,4) | not null | 0 |  |
| `total_refunded` | decimal(12,4) | not null | 0 |  |
| `low_balance_threshold` | decimal(12,4) | nullable |  |  |
| `low_balance_notified_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, channel); Index (organization_id, unit).

**Relations:** belongs to `organizations`; has many `credit_transactions`.

### credit_transactions

Prisma model `CreditTransaction`. Tenant table (filtered by `organization_id`). Ledger row of a credit wallet. Append-only: no updatedAt / deletedAt. Duplicates are impossible by design: one CONSUME and one REFUND per MessageLog, one PURCHASE per AddOnPurchase (a BullMQ retry or a replayed payment webhook hits the unique keys). A manual resend creates a new MessageLog.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `wallet_id` | uuid | not null |  | FK to `message_credit_wallets` (restrict on delete) |
| `transaction_type` | enum `CreditTransactionType` | not null |  |  |
| `unit` | enum `CreditUnit` | not null |  | snapshot of the wallet unit |
| `currency` | char(3) | nullable |  | snapshot when unit is MONEY |
| `amount` | decimal(12,4) | not null |  | positive = credit to the wallet, negative = debit |
| `balance_after` | decimal(12,4) | not null |  |  |
| `idempotency_key` | varchar(100) | nullable |  | job id / request key for rows without a messageLogId |
| `message_log_id` | uuid | nullable |  | FK to `message_logs` (setnull on delete). CONSUME / REFUND rows |
| `announcement_id` | uuid | nullable |  | RESERVE / RELEASE rows of a bulk campaign (no FK) |
| `add_on_purchase_id` | uuid | nullable |  | FK to `add_on_purchases` (setnull on delete). PURCHASE rows: the credit pack that was bought |
| `description` | varchar(255) | nullable |  |  |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |

**Indexes and constraints:** Unique (organization_id, message_log_id, transaction_type); Unique (organization_id, add_on_purchase_id, transaction_type); Unique (organization_id, idempotency_key); Index (organization_id, wallet_id, created_at); Index (organization_id, transaction_type, created_at); Index (organization_id, announcement_id).

**Relations:** belongs to `organizations`, `message_credit_wallets`, `message_logs`, `add_on_purchases`.

### device_tokens

Prisma model `DeviceToken`. Tenant table (filtered by `organization_id`). Push notification token (FCM / APNs) of a user's device.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `user_id` | uuid | not null |  | FK to `users` (cascade on delete) |
| `platform` | enum `DevicePlatform` | not null |  |  |
| `token` | varchar(512) | not null |  | not globally unique: one phone may hold User rows of two organizations |
| `device_id` | varchar(100) | nullable |  |  |
| `device_name` | varchar(150) | nullable |  |  |
| `app_version` | varchar(20) | nullable |  |  |
| `locale` | varchar(10) | nullable |  |  |
| `is_active` | boolean | not null | true | set false when the provider reports the token as invalid |
| `last_seen_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (user_id, token); Index (organization_id, user_id, is_active); Index (token).

**Relations:** belongs to `organizations`, `users`.

### Enums in 10-communication.prisma

| Enum | Values | Meaning |
|---|---|---|
| `NotificationCategory` | ATTENDANCE, FEES, EXAMS, HOMEWORK, ANNOUNCEMENTS, ADMISSIONS, LEAVE, TIMETABLE, TRANSPORT, LIBRARY, HOSTEL, PAYROLL, ACCOUNT, SYSTEM |  |
| `TemplateApprovalStatus` | DRAFT, PENDING, APPROVED, REJECTED, PAUSED, DISABLED, NOT_REQUIRED | Approval state of a template at the provider (Meta for WhatsApp, DLT for SMS). |
| `AnnouncementStatus` | DRAFT, SCHEDULED, SENDING, SENT, CANCELLED, FAILED |  |
| `MessageStatus` | QUEUED, SENT, DELIVERED, READ, FAILED |  |
| `MessageProvider` | META_WHATSAPP, MSG91, TWILIO, AMAZON_SES, FCM, INTERNAL |  |
| `MessageRecipientType` | USER, GUARDIAN, STUDENT, STAFF, LEAD, OTHER |  |
| `WhatsAppTemplateCategory` | UTILITY, MARKETING, AUTHENTICATION |  |
| `WhatsAppQualityRating` | GREEN, YELLOW, RED, UNKNOWN |  |
| `WhatsAppMessageType` | TEXT, IMAGE, DOCUMENT, AUDIO, VIDEO, LOCATION, BUTTON_REPLY, INTERACTIVE, OTHER |  |
| `SenderVerificationStatus` | PENDING, VERIFIED, FAILED |  |
| `EmailSuppressionReason` | HARD_BOUNCE, SOFT_BOUNCE_LIMIT, COMPLAINT, UNSUBSCRIBED, MANUAL |  |
| `CreditUnit` | MESSAGES, MONEY |  |
| `CreditTransactionType` | PURCHASE, CONSUME, REFUND, ADJUSTMENT, EXPIRY, BONUS, RESERVE, RELEASE |  |
| `DltTemplateCategory` | TRANSACTIONAL, SERVICE_IMPLICIT, SERVICE_EXPLICIT, PROMOTIONAL | TRAI DLT content template category (India). |
