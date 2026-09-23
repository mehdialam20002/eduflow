# EduFlow API Registry — 03-finance-portals-comms

Modules: FEE, PAY, DSC, SCH, PP, SP, NTF, WA, EML, SMS. Schema sources: `08-fees.prisma`, `09-payments.prisma`, `10-communication.prisma` (plus read-only use of people, academics, attendance, homework, exams, certificates, auth and platform models).

Conventions used in every table:

- Paths are relative to `/api/v1`. Static segments (`/generate`, `/preview`, `/inbox`, `/sync`, `/import`) are routed before `/:id`.
- List endpoints accept `page`, `limit`, `sort`, `q` plus field filters and return `meta`. A list with `?status=ACTIVE&limit=100` is the dropdown lookup.
- **(IK)** in Purpose = `Idempotency-Key` header required. **(job)** = runs in a BullMQ worker and returns an `ImportJob` / `ExportJob` / queued count.
- Permission `public` = no JWT; the provider signature or a signed token is verified. `self` = any signed-in user, own rows only.
- PDF endpoints return a short-lived pre-signed S3 URL (`FileAsset`).
- Tenant comes from the JWT; campus scope from `X-Campus-Id` and `UserCampus`.

## FEE — Fees

Resource base path(s): `/fee-heads`, `/tax-rates`, `/late-fee-rules`, `/fee-structures`, `/student-fee-assignments`, `/fee-invoices`, `/fee-invoice-adjustments`, `/fee-reports`, `/students/:id/fee-ledger`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| FEE-API-01 | GET | `/fee-heads` | fees.view | List fee heads (type, status; dropdown) | FeeHead |
| FEE-API-02 | POST | `/fee-heads` | fees.manage | Create fee head with tax settings | FeeHead, TaxRate |
| FEE-API-03 | PATCH | `/fee-heads/:id` | fees.manage | Update fee head | FeeHead |
| FEE-API-04 | DELETE | `/fee-heads/:id` | fees.manage | Archive fee head (blocked if in an active structure) | FeeHead |
| FEE-API-05 | GET | `/tax-rates` | fees.view | List effective-dated tax rates | TaxRate |
| FEE-API-06 | POST | `/tax-rates` | fees.manage | Create tax rate with components (CGST/SGST/IGST, VAT) | TaxRate |
| FEE-API-07 | PATCH | `/tax-rates/:id` | fees.manage | Update, end-date or archive tax rate | TaxRate |
| FEE-API-08 | GET | `/late-fee-rules` | fees.view | List late-fee rules | LateFeeRule |
| FEE-API-09 | POST | `/late-fee-rules` | fees.manage | Create late-fee rule (fixed, per day, percent, cap) | LateFeeRule |
| FEE-API-10 | PATCH | `/late-fee-rules/:id` | fees.manage | Update, set default or archive rule | LateFeeRule |
| FEE-API-11 | GET | `/fee-structures` | fees.view | List structures (year, campus, course, batch) | FeeStructure |
| FEE-API-12 | POST | `/fee-structures` | fees.manage | Create structure with items and installments (or copy via `copyFromId`) | FeeStructure, FeeStructureItem, FeeInstallment |
| FEE-API-13 | GET | `/fee-structures/:id` | fees.view | Structure detail with items, installments, assignment count | FeeStructure, FeeStructureItem, FeeInstallment |
| FEE-API-14 | PATCH | `/fee-structures/:id` | fees.manage | Update structure, items, installments (locked once invoiced) | FeeStructure, FeeStructureItem, FeeInstallment |
| FEE-API-15 | DELETE | `/fee-structures/:id` | fees.manage | Archive structure | FeeStructure |
| FEE-API-16 | POST | `/fee-structures/:id/assign` | fees.create | Bulk assign to a course, batch or student list (job) | StudentFeeAssignment, Enrollment |
| FEE-API-17 | GET | `/student-fee-assignments` | fees.view | List assignments (student, batch, year, status) | StudentFeeAssignment |
| FEE-API-18 | POST | `/student-fee-assignments` | fees.create | Assign structure to one student: overrides, excluded heads, start date (proration) | StudentFeeAssignment |
| FEE-API-19 | PATCH | `/student-fee-assignments/:id` | fees.update | Update overrides, excluded heads, end date, notes | StudentFeeAssignment |
| FEE-API-20 | PUT | `/student-fee-assignments/:id/installments` | fees.update | Replace the student's custom payment schedule | StudentFeeInstallment, StudentFeeAssignment |
| FEE-API-21 | POST | `/student-fee-assignments/:id/pause` | fees.update | ACTIVE to PAUSED (invoicing on hold) | StudentFeeAssignment |
| FEE-API-22 | POST | `/student-fee-assignments/:id/resume` | fees.update | PAUSED to ACTIVE | StudentFeeAssignment |
| FEE-API-23 | POST | `/student-fee-assignments/:id/cancel` | fees.delete | Cancel assignment (no issued invoices allowed) | StudentFeeAssignment |
| FEE-API-24 | GET | `/fee-invoices` | fees.view | List invoices (status, student, batch, due date, q) | FeeInvoice |
| FEE-API-25 | POST | `/fee-invoices` | fees.create | Create ad-hoc DRAFT invoice (fine, certificate fee, misc.) | FeeInvoice, FeeInvoiceItem |
| FEE-API-26 | GET | `/fee-invoices/:id` | fees.view | Invoice detail: items, adjustments, allocations, reminders | FeeInvoice, FeeInvoiceItem, FeeReminderLog |
| FEE-API-27 | PATCH | `/fee-invoices/:id` | fees.update | Edit a DRAFT invoice only | FeeInvoice, FeeInvoiceItem |
| FEE-API-28 | POST | `/fee-invoices/:id/issue` | fees.create | DRAFT to ISSUED: invoice number, tax freeze, PDF | FeeInvoice, NumberSequence |
| FEE-API-29 | POST | `/fee-invoices/:id/cancel` | fees.delete | Discard DRAFT or cancel issued invoice (credit note, optional reissue) | FeeInvoice, ScholarshipDisbursement |
| FEE-API-30 | POST | `/fee-invoices/:id/write-off` | fees.approve | Write off the balance, status WRITTEN_OFF | FeeInvoice |
| FEE-API-31 | GET | `/fee-invoices/:id/pdf` | fees.view | Invoice PDF link | FeeInvoice, FileAsset |
| FEE-API-32 | POST | `/fee-invoices/:id/remind` | fees.remind | Send a manual reminder to the fee payer | FeeReminderLog, MessageLog |
| FEE-API-33 | POST | `/fee-invoices/:id/adjustments` | fees.update | Request credit/debit note: concession, late-fee waiver, correction, partial write-off | FeeInvoiceAdjustment |
| FEE-API-34 | GET | `/fee-invoice-adjustments` | fees.view | Adjustment approval queue | FeeInvoiceAdjustment |
| FEE-API-35 | POST | `/fee-invoice-adjustments/:id/approve` | fees.approve | Approve; recompute adjustmentTotal, total, balance | FeeInvoiceAdjustment, FeeInvoice |
| FEE-API-36 | POST | `/fee-invoice-adjustments/:id/reject` | fees.approve | Reject with reason | FeeInvoiceAdjustment |
| FEE-API-37 | POST | `/fee-invoices/generate` | fees.create | Bulk generate for an installment or period (`dryRun`, `autoIssue`) (job) | FeeInvoice, StudentFeeAssignment, FeeInstallment |
| FEE-API-38 | POST | `/fee-invoices/bulk-issue` | fees.create | Issue many DRAFT invoices (job) | FeeInvoice |
| FEE-API-39 | POST | `/fee-invoices/bulk-remind` | fees.remind | Remind by filter or id list (job) | FeeReminderLog, MessageLog |
| FEE-API-40 | POST | `/fee-invoices/carry-forward` | fees.manage | Year end: move balances to ARREARS invoices (CARRIED_FORWARD) (job) | FeeInvoice |
| FEE-API-41 | POST | `/fee-invoices/import` | fees.import | Import opening dues from Excel (FEE_DUES) (job) | ImportJob, FeeInvoice |
| FEE-API-42 | GET | `/students/:id/fee-ledger` | fees.view | Student ledger: invoices, payments, refunds, credits, advance | FeeInvoice, PaymentAllocation, Refund, ScholarshipDisbursement |
| FEE-API-43 | GET | `/fee-reports/dues` | fees.view | Dues report by student, batch, course or fee head | FeeInvoice, FeeInvoiceItem |
| FEE-API-44 | GET | `/fee-reports/defaulters` | fees.view | Defaulters: overdue age buckets, reminder count | FeeInvoice, FeeReminderLog |
| FEE-API-45 | GET | `/fee-reports/summary` | fees.view | Dashboard stats: billed, collected, outstanding, overdue | FeeInvoice, DailyMetricSnapshot |
| FEE-API-46 | POST | `/fee-reports/export` | fees.export | Export invoices, dues or defaulters to Excel/PDF (job) | ExportJob |

Events emitted: fee.structure.assigned, fee.invoices.generated, fee.invoice.issued, fee.invoice.due_soon, fee.invoice.due_today, fee.invoice.overdue, fee.late_fee.applied, fee.invoice.paid, fee.invoice.cancelled, fee.invoice.written_off, fee.invoice.carried_forward, fee.adjustment.requested, fee.adjustment.approved, fee.adjustment.rejected, fee.reminder.sent

## PAY — Payments

Resource base path(s): `/payments`, `/receipts`, `/payment-orders`, `/refunds`, `/payment-gateway-accounts`, `/settlements`, `/day-closes`, `/webhooks/razorpay`, `/webhooks/stripe`, `/webhook-events`, `/payment-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| PAY-API-01 | GET | `/payments` | payments.view | List payments (date, method, status, collector, student) | Payment |
| PAY-API-02 | POST | `/payments` | fees.collect | Record counter payment with allocations (oldest first or manual); issues receipt (IK) | Payment, PaymentAllocation, PaymentAllocationItem, Receipt |
| PAY-API-03 | GET | `/payments/:id` | payments.view | Payment detail: allocations, receipt, refunds | Payment, PaymentAllocation, Receipt |
| PAY-API-04 | POST | `/payments/:id/cancel` | payments.cancel | Cancel payment: reverse allocations, cancel receipt | Payment, PaymentAllocation, Receipt |
| PAY-API-05 | POST | `/payments/:id/allocate` | fees.collect | Allocate the unallocated advance to invoices | PaymentAllocation, PaymentAllocationItem, FeeInvoice |
| PAY-API-06 | POST | `/payments/:id/update-cheque` | payments.update | Mark cheque DEPOSITED, CLEARED or RETURNED | Payment |
| PAY-API-07 | POST | `/payments/:id/bounce-cheque` | payments.update | Cheque BOUNCED: reverse allocations, raise bounce-charge invoice | Payment, PaymentAllocation, FeeInvoice |
| PAY-API-08 | GET | `/receipts` | payments.view | List receipts (no, date, status) | Receipt |
| PAY-API-09 | GET | `/receipts/:id/pdf` | payments.view | Receipt PDF link | Receipt, FileAsset |
| PAY-API-10 | POST | `/receipts/:id/send` | fees.collect | Send receipt on WhatsApp, email or SMS | Receipt, MessageLog |
| PAY-API-11 | POST | `/receipts/:id/reissue` | payments.cancel | Cancel receipt and issue a replacement | Receipt, NumberSequence |
| PAY-API-12 | GET | `/payment-orders` | payments.view | List online orders (created, failed, paid, expired) | PaymentOrder |
| PAY-API-13 | POST | `/payment-orders` | fees.collect | Create Razorpay/Stripe order for invoices: counter checkout or pay link (IK) | PaymentOrder, PaymentGatewayAccount |
| PAY-API-14 | GET | `/payment-orders/:id` | payments.view | Order status (poll after checkout) | PaymentOrder, Payment |
| PAY-API-15 | POST | `/payment-orders/:id/verify` | fees.collect | Verify checkout signature; capture if the webhook is not in yet | PaymentOrder, Payment, Receipt |
| PAY-API-16 | POST | `/payment-orders/:id/send-link` | fees.collect | Send pay link to the guardian (opens portal checkout) | PaymentOrder, MessageLog |
| PAY-API-17 | POST | `/payment-orders/:id/cancel` | fees.collect | Cancel an unpaid order or link | PaymentOrder |
| PAY-API-18 | GET | `/refunds` | payments.view | List refunds (status, type, date) | Refund |
| PAY-API-19 | POST | `/refunds` | payments.refund | Request refund: full or part, deductions, split (IK) | Refund, RefundAllocation |
| PAY-API-20 | GET | `/refunds/:id` | payments.view | Refund detail | Refund, RefundAllocation |
| PAY-API-21 | POST | `/refunds/:id/approve` | payments.approve | REQUESTED to APPROVED | Refund |
| PAY-API-22 | POST | `/refunds/:id/reject` | payments.approve | REQUESTED to REJECTED with reason | Refund |
| PAY-API-23 | POST | `/refunds/:id/process` | payments.refund | Gateway refund or record offline payout; reopen invoices | Refund, Payment, FeeInvoice |
| PAY-API-24 | GET | `/payment-gateway-accounts` | payments.manage | List gateway accounts | PaymentGatewayAccount |
| PAY-API-25 | POST | `/payment-gateway-accounts` | payments.manage | Connect Razorpay/Stripe account (secrets stored encrypted) | PaymentGatewayAccount |
| PAY-API-26 | PATCH | `/payment-gateway-accounts/:id` | payments.manage | Update mode, methods, convenience fee, default | PaymentGatewayAccount |
| PAY-API-27 | DELETE | `/payment-gateway-accounts/:id` | payments.manage | Disconnect account | PaymentGatewayAccount |
| PAY-API-28 | POST | `/payment-gateway-accounts/:id/verify` | payments.manage | Test credentials; sets lastVerifiedAt | PaymentGatewayAccount |
| PAY-API-29 | GET | `/settlements` | payments.view | List gateway payouts | Settlement |
| PAY-API-30 | GET | `/settlements/:id` | payments.view | Payout detail with payments and refunds | Settlement, Payment, Refund |
| PAY-API-31 | POST | `/settlements/sync` | payments.reconcile | Fetch payouts from the gateway (job) | Settlement |
| PAY-API-32 | POST | `/settlements/:id/reconcile` | payments.reconcile | Mark RECONCILED or resolve MISMATCH | Settlement, Payment |
| PAY-API-33 | GET | `/day-closes` | payments.view | List day closes | DayClose |
| PAY-API-34 | POST | `/day-closes` | payments.close_day | Open or refresh today's close with system totals | DayClose, Payment, Refund |
| PAY-API-35 | GET | `/day-closes/:id` | payments.view | Day-close detail with payments | DayClose, Payment |
| PAY-API-36 | POST | `/day-closes/:id/submit` | payments.close_day | Counted cash, denominations, deposit; status SUBMITTED | DayClose |
| PAY-API-37 | POST | `/day-closes/:id/verify` | payments.approve | Set VERIFIED or DISCREPANCY | DayClose |
| PAY-API-38 | POST | `/webhooks/razorpay/:gatewayAccountId` | public | Razorpay webhook receiver (signature, idempotent) | WebhookEvent, Payment, Refund, Settlement |
| PAY-API-39 | POST | `/webhooks/stripe/:gatewayAccountId` | public | Stripe webhook receiver (signature, idempotent) | WebhookEvent, Payment, Refund, Settlement |
| PAY-API-40 | GET | `/webhook-events` | payments.manage | Webhook inbox log (provider, status) | WebhookEvent |
| PAY-API-41 | POST | `/webhook-events/:id/retry` | payments.manage | Re-process a FAILED event | WebhookEvent |
| PAY-API-42 | POST | `/payments/import` | payments.import | Import historical payments from Excel (FEE_PAYMENTS) (job) | ImportJob, Payment, PaymentAllocation |
| PAY-API-43 | GET | `/payment-reports/summary` | payments.view | Collection stats: today, month, by method, online share | Payment, DailyMetricSnapshot |
| PAY-API-44 | GET | `/payment-reports/day-book` | payments.view | Day book by date, method, collector | Payment, Refund |
| PAY-API-45 | GET | `/payment-reports/head-wise` | payments.view | Head-wise collection with tax portion | PaymentAllocationItem, FeeHead |
| PAY-API-46 | POST | `/payment-reports/export` | payments.export | Export payments, receipts, refunds or day book (job) | ExportJob |

Events emitted: payment.order.created, payment.link.sent, payment.captured, payment.failed, payment.cancelled, payment.cheque.cleared, payment.cheque.bounced, payment.disputed, receipt.issued, receipt.cancelled, refund.requested, refund.approved, refund.rejected, refund.processed, refund.failed, settlement.reconciled, settlement.mismatch, dayclose.submitted, dayclose.discrepancy

## DSC — Discounts

Resource base path(s): `/discounts`, `/student-discounts`, `/discount-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| DSC-API-01 | GET | `/discounts` | discounts.view | List discount schemes (category, status; dropdown) | Discount |
| DSC-API-02 | POST | `/discounts` | discounts.manage | Create scheme: percent/fixed, scope, stacking, cap, validity | Discount |
| DSC-API-03 | GET | `/discounts/:id` | discounts.view | Scheme detail with grant count | Discount, StudentDiscount |
| DSC-API-04 | PATCH | `/discounts/:id` | discounts.manage | Update scheme | Discount |
| DSC-API-05 | DELETE | `/discounts/:id` | discounts.manage | Archive scheme | Discount |
| DSC-API-06 | GET | `/student-discounts` | discounts.view | List grants and approval queue (status, student, year) | StudentDiscount |
| DSC-API-07 | POST | `/student-discounts` | discounts.create | Grant discount to a student (PENDING or auto-approved) | StudentDiscount, Discount |
| DSC-API-08 | PATCH | `/student-discounts/:id` | discounts.update | Edit a PENDING grant (value override, validity, reason) | StudentDiscount |
| DSC-API-09 | POST | `/student-discounts/:id/approve` | discounts.approve | Approve; applies to DRAFT and future invoices | StudentDiscount, FeeInvoice |
| DSC-API-10 | POST | `/student-discounts/:id/reject` | discounts.approve | Reject with reason | StudentDiscount |
| DSC-API-11 | POST | `/student-discounts/:id/revoke` | discounts.delete | Revoke an approved grant from a date | StudentDiscount |
| DSC-API-12 | POST | `/student-discounts/bulk` | discounts.create | Grant one scheme to many students (job) | StudentDiscount |
| DSC-API-13 | POST | `/student-discounts/preview` | discounts.view | Preview net effect on a student's fees (stacking, priority, cap) | Discount, StudentDiscount, StudentFeeAssignment |
| DSC-API-14 | GET | `/student-discounts/sibling-suggestions` | discounts.view | Auto-detected sibling-discount candidates | Family, StudentGuardian, Discount |
| DSC-API-15 | GET | `/discount-reports/impact` | discounts.view | Discount impact by scheme, category, batch | StudentDiscount, FeeInvoice |
| DSC-API-16 | POST | `/discount-reports/export` | discounts.export | Export grants or impact report (job) | ExportJob |

Events emitted: discount.requested, discount.approved, discount.rejected, discount.revoked

## SCH — Scholarships

Resource base path(s): `/scholarships`, `/scholarship-applications`, `/scholarship-awards`, `/scholarship-disbursements`, `/scholarship-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| SCH-API-01 | GET | `/scholarships` | scholarships.view | List schemes (status, funding source; dropdown) | Scholarship |
| SCH-API-02 | POST | `/scholarships` | scholarships.manage | Create scheme: value, criteria, seats, dates (DRAFT) | Scholarship |
| SCH-API-03 | GET | `/scholarships/:id` | scholarships.view | Scheme detail with seats and utilisation | Scholarship, ScholarshipAward |
| SCH-API-04 | PATCH | `/scholarships/:id` | scholarships.manage | Update scheme | Scholarship |
| SCH-API-05 | DELETE | `/scholarships/:id` | scholarships.manage | Archive scheme | Scholarship |
| SCH-API-06 | POST | `/scholarships/:id/open` | scholarships.manage | DRAFT or CLOSED to OPEN | Scholarship |
| SCH-API-07 | POST | `/scholarships/:id/close` | scholarships.manage | OPEN to CLOSED | Scholarship |
| SCH-API-08 | GET | `/scholarship-applications` | scholarships.view | List applications (scheme, status, score) | ScholarshipApplication |
| SCH-API-09 | POST | `/scholarship-applications` | scholarships.create | Create application for a student (staff) | ScholarshipApplication |
| SCH-API-10 | GET | `/scholarship-applications/:id` | scholarships.view | Application detail with documents | ScholarshipApplication, FileAsset |
| SCH-API-11 | PATCH | `/scholarship-applications/:id` | scholarships.update | Edit DRAFT fields, documents | ScholarshipApplication |
| SCH-API-12 | POST | `/scholarship-applications/:id/submit` | scholarships.create | DRAFT to SUBMITTED | ScholarshipApplication |
| SCH-API-13 | POST | `/scholarship-applications/:id/review` | scholarships.update | UNDER_REVIEW with score and remarks | ScholarshipApplication |
| SCH-API-14 | POST | `/scholarship-applications/:id/shortlist` | scholarships.update | UNDER_REVIEW to SHORTLISTED | ScholarshipApplication |
| SCH-API-15 | POST | `/scholarship-applications/:id/approve` | scholarships.approve | Approve (seat check) | ScholarshipApplication, Scholarship |
| SCH-API-16 | POST | `/scholarship-applications/:id/reject` | scholarships.approve | Reject with remarks | ScholarshipApplication |
| SCH-API-17 | POST | `/scholarship-applications/:id/withdraw` | scholarships.update | Mark WITHDRAWN | ScholarshipApplication |
| SCH-API-18 | GET | `/scholarship-awards` | scholarships.view | List awards (scheme, student, year, status) | ScholarshipAward |
| SCH-API-19 | POST | `/scholarship-awards` | scholarships.approve | Award from an approved application or directly | ScholarshipAward, ScholarshipApplication, Scholarship |
| SCH-API-20 | GET | `/scholarship-awards/:id` | scholarships.view | Award detail with disbursements | ScholarshipAward, ScholarshipDisbursement |
| SCH-API-21 | POST | `/scholarship-awards/:id/suspend` | scholarships.approve | ACTIVE to SUSPENDED (renewal condition failed) | ScholarshipAward |
| SCH-API-22 | POST | `/scholarship-awards/:id/reinstate` | scholarships.approve | SUSPENDED to ACTIVE | ScholarshipAward |
| SCH-API-23 | POST | `/scholarship-awards/:id/revoke` | scholarships.approve | Revoke; reverse unpaid-invoice credits | ScholarshipAward, ScholarshipDisbursement |
| SCH-API-24 | POST | `/scholarship-awards/:id/renew` | scholarships.approve | Create next-year award (renewedFromAwardId) | ScholarshipAward |
| SCH-API-25 | POST | `/scholarship-disbursements` | scholarships.disburse | Credit an invoice or record direct payment to beneficiary | ScholarshipDisbursement, FeeInvoice, Payment |
| SCH-API-26 | POST | `/scholarship-disbursements/:id/reverse` | scholarships.disburse | Reverse a disbursement with reason | ScholarshipDisbursement, FeeInvoice |
| SCH-API-27 | GET | `/scholarship-reports/utilisation` | scholarships.view | Funder and scheme utilisation: seats, awarded, disbursed | Scholarship, ScholarshipAward, ScholarshipDisbursement |
| SCH-API-28 | POST | `/scholarship-reports/export` | scholarships.export | Export applications, awards or utilisation (job) | ExportJob |

Events emitted: scholarship.opened, scholarship.closed, scholarship.application.submitted, scholarship.application.shortlisted, scholarship.application.approved, scholarship.application.rejected, scholarship.awarded, scholarship.disbursed, scholarship.disbursement.reversed, scholarship.award.suspended, scholarship.award.reinstated, scholarship.award.revoked, scholarship.award.renewed

## PP — Parent Portal

Resource base path(s): `/portal/parent/...`. Login is OTP through the auth endpoints. The in-app feed, notification preferences and device tokens use NTF-API-19 to NTF-API-26 (`self`). Every `:studentId` must be linked to the guardian through `StudentGuardian`.

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| PP-API-01 | GET | `/portal/parent/me` | parentportal.access | Own profile, language, branding, pending consents | Guardian, User, Organization |
| PP-API-02 | PATCH | `/portal/parent/me` | parentportal.access | Update allowed contact fields and language | Guardian, User |
| PP-API-03 | GET | `/portal/parent/children` | parentportal.access | Children for the switcher (batch, photo, badges) | StudentGuardian, Student, Enrollment |
| PP-API-04 | GET | `/portal/parent/home` | parentportal.access | Home feed per child: today, dues, homework, notices | AttendanceRecord, FeeInvoice, Homework, Announcement |
| PP-API-05 | GET | `/portal/parent/children/:studentId/attendance` | parentportal.access | Month calendar and summary | AttendanceRecord, AttendanceSession, Holiday |
| PP-API-06 | GET | `/portal/parent/children/:studentId/timetable` | parentportal.access | Weekly timetable and class changes | TimetableEntry, PeriodSlot, ClassSession |
| PP-API-07 | GET | `/portal/parent/children/:studentId/homework` | parentportal.access | Homework with submission status | Homework, HomeworkSubmission |
| PP-API-08 | GET | `/portal/parent/children/:studentId/exams` | parentportal.access | Exam schedule (date sheet) | Exam, ExamSchedule |
| PP-API-09 | GET | `/portal/parent/children/:studentId/results` | parentportal.access | Published marks by exam | ExamMark, ExamSchedule |
| PP-API-10 | GET | `/portal/parent/children/:studentId/report-cards` | parentportal.access | Published report cards | ReportCard |
| PP-API-11 | GET | `/portal/parent/report-cards/:id/pdf` | parentportal.access | Report card PDF link | ReportCard, FileAsset |
| PP-API-12 | GET | `/portal/parent/children/:studentId/notes` | parentportal.access | Teacher remarks shared with the parent | StudentNote |
| PP-API-13 | GET | `/portal/parent/fee-invoices` | parentportal.access | Dues and invoice history of all children (no DRAFT) | FeeInvoice |
| PP-API-14 | GET | `/portal/parent/fee-invoices/:id` | parentportal.access | Invoice detail with lines and payments | FeeInvoice, FeeInvoiceItem, PaymentAllocation |
| PP-API-15 | GET | `/portal/parent/fee-invoices/:id/pdf` | parentportal.access | Invoice PDF link | FeeInvoice, FileAsset |
| PP-API-16 | POST | `/portal/parent/payment-orders` | parentportal.access | Create checkout order for one or more invoices (IK) | PaymentOrder, PaymentGatewayAccount |
| PP-API-17 | POST | `/portal/parent/payment-orders/:id/verify` | parentportal.access | Verify checkout signature; return payment and receipt | PaymentOrder, Payment, Receipt |
| PP-API-18 | GET | `/portal/parent/payments` | parentportal.access | Payment history with receipts | Payment, Receipt |
| PP-API-19 | GET | `/portal/parent/receipts/:id/pdf` | parentportal.access | Receipt PDF link | Receipt, FileAsset |
| PP-API-20 | GET | `/portal/parent/leave-requests` | parentportal.access | List leave requests of own children | StudentLeaveRequest |
| PP-API-21 | POST | `/portal/parent/leave-requests` | parentportal.access | Apply leave for a child | StudentLeaveRequest |
| PP-API-22 | POST | `/portal/parent/leave-requests/:id/cancel` | parentportal.access | Cancel a PENDING request | StudentLeaveRequest |
| PP-API-23 | GET | `/portal/parent/announcements` | parentportal.access | Notice inbox (unread, pinned) | AnnouncementRecipient, Announcement |
| PP-API-24 | GET | `/portal/parent/announcements/:id` | parentportal.access | Notice detail; marks read | Announcement, AnnouncementRecipient |
| PP-API-25 | POST | `/portal/parent/announcements/:id/acknowledge` | parentportal.access | Confirm "I have read this" | AnnouncementRecipient |
| PP-API-26 | GET | `/portal/parent/consents` | parentportal.access | Consents per child with policy text | ConsentRecord, PolicyDocument |
| PP-API-27 | POST | `/portal/parent/consents` | parentportal.access | Grant consent (OTP-verified) | ConsentRecord, OtpCode |
| PP-API-28 | POST | `/portal/parent/consents/:id/withdraw` | parentportal.access | Withdraw a consent | ConsentRecord |
| PP-API-29 | GET | `/portal/parent/certificate-requests` | parentportal.access | List certificate requests | CertificateRequest, IssuedCertificate |
| PP-API-30 | POST | `/portal/parent/certificate-requests` | parentportal.access | Request a certificate for a child | CertificateRequest |
| PP-API-31 | GET | `/portal/parent/scholarship-applications` | parentportal.access | Open schemes and own application status | Scholarship, ScholarshipApplication, ScholarshipAward |
| PP-API-32 | POST | `/portal/parent/scholarship-applications` | parentportal.access | Apply to an OPEN scheme with documents | ScholarshipApplication |

Events emitted: portal.parent.first_login, student.leave.requested, student.leave.cancelled, consent.granted, consent.withdrawn, announcement.acknowledged, certificate.requested, scholarship.application.submitted, payment.order.created (payment.captured and receipt.issued come from PAY)

## SP — Student Portal

Resource base path(s): `/portal/student/...`. The in-app feed, notification preferences and device tokens use NTF-API-19 to NTF-API-26 (`self`). All data is limited to the student linked to the signed-in user. PP-style payment endpoints work only when the organization setting allows student payments.

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| SP-API-01 | GET | `/portal/student/me` | studentportal.access | Own profile, batch, branding, enabled features | Student, Enrollment, User |
| SP-API-02 | PATCH | `/portal/student/me` | studentportal.access | Update allowed fields only (photo, language) | Student, User |
| SP-API-03 | GET | `/portal/student/home` | studentportal.access | Dashboard: today's classes, homework due, attendance %, notices | TimetableEntry, Homework, AttendanceRecord, Announcement |
| SP-API-04 | GET | `/portal/student/timetable` | studentportal.access | Weekly timetable and class changes | TimetableEntry, PeriodSlot, ClassSession |
| SP-API-05 | GET | `/portal/student/attendance` | studentportal.access | Month calendar and summary | AttendanceRecord, AttendanceSession |
| SP-API-06 | GET | `/portal/student/homework` | studentportal.access | Homework list with own status | Homework, HomeworkSubmission |
| SP-API-07 | GET | `/portal/student/homework/:id` | studentportal.access | Homework detail, attachments, own submission | Homework, HomeworkAttachment, HomeworkSubmission |
| SP-API-08 | POST | `/portal/student/homework/:id/submissions` | studentportal.access | Submit or resubmit work with files | HomeworkSubmission, HomeworkSubmissionFile |
| SP-API-09 | GET | `/portal/student/study-materials` | studentportal.access | Notes, worksheets, video links of own batches | StudyMaterial |
| SP-API-10 | GET | `/portal/student/exams` | studentportal.access | Exam schedule (date sheet) | Exam, ExamSchedule |
| SP-API-11 | GET | `/portal/student/results` | studentportal.access | Published marks by exam | ExamMark, ExamSchedule |
| SP-API-12 | GET | `/portal/student/report-cards` | studentportal.access | Published report cards | ReportCard |
| SP-API-13 | GET | `/portal/student/report-cards/:id/pdf` | studentportal.access | Report card PDF link | ReportCard, FileAsset |
| SP-API-14 | GET | `/portal/student/announcements` | studentportal.access | Notice inbox | AnnouncementRecipient, Announcement |
| SP-API-15 | GET | `/portal/student/announcements/:id` | studentportal.access | Notice detail; marks read | Announcement, AnnouncementRecipient |
| SP-API-16 | GET | `/portal/student/library-loans` | studentportal.access | Books issued, due dates, fines | BookIssue, BookCopy, Book |
| SP-API-17 | GET | `/portal/student/certificate-requests` | studentportal.access | List own certificate requests | CertificateRequest, IssuedCertificate |
| SP-API-18 | POST | `/portal/student/certificate-requests` | studentportal.access | Request a certificate | CertificateRequest |
| SP-API-19 | GET | `/portal/student/fee-invoices` | studentportal.access | Own dues and invoices (read only by default) | FeeInvoice, FeeInvoiceItem |
| SP-API-20 | POST | `/portal/student/payment-orders` | studentportal.access | Create checkout order, if student payment is enabled (IK) | PaymentOrder, PaymentGatewayAccount |
| SP-API-21 | POST | `/portal/student/payment-orders/:id/verify` | studentportal.access | Verify checkout signature | PaymentOrder, Payment, Receipt |
| SP-API-22 | GET | `/portal/student/receipts/:id/pdf` | studentportal.access | Receipt PDF link | Receipt, FileAsset |

Events emitted: portal.student.first_login, homework.submitted, homework.resubmitted, certificate.requested, payment.order.created

## NTF — Notifications

Resource base path(s): `/notification-templates`, `/notification-events`, `/announcements`, `/notifications`, `/notification-preferences`, `/device-tokens`, `/message-logs`, `/notification-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| NTF-API-01 | GET | `/notification-templates` | notifications.view | List templates: tenant overrides merged over system defaults | NotificationTemplate |
| NTF-API-02 | POST | `/notification-templates` | notifications.manage | Create tenant template for event + channel + language | NotificationTemplate, WhatsAppTemplate, SmsDltTemplate |
| NTF-API-03 | PATCH | `/notification-templates/:id` | notifications.manage | Update body, subject, linked provider template, status | NotificationTemplate |
| NTF-API-04 | DELETE | `/notification-templates/:id` | notifications.manage | Remove override; fall back to system default | NotificationTemplate |
| NTF-API-05 | POST | `/notification-templates/:id/preview` | notifications.view | Render with sample variables | NotificationTemplate |
| NTF-API-06 | POST | `/notification-templates/:id/test` | notifications.manage | Send a test message to own phone or email | NotificationTemplate, MessageLog |
| NTF-API-07 | GET | `/notification-events` | notifications.view | Event catalog: variables, channels, active templates | NotificationTemplate |
| NTF-API-08 | GET | `/announcements` | notifications.view | List announcements (status, campus, audience) | Announcement |
| NTF-API-09 | POST | `/announcements` | notifications.create | Create DRAFT with audience filter, channels, attachments | Announcement |
| NTF-API-10 | GET | `/announcements/:id` | notifications.view | Announcement detail with delivery counts | Announcement, MessageLog |
| NTF-API-11 | PATCH | `/announcements/:id` | notifications.update | Edit DRAFT or SCHEDULED; pin or unpin | Announcement |
| NTF-API-12 | DELETE | `/announcements/:id` | notifications.delete | Delete DRAFT or hide a sent notice | Announcement |
| NTF-API-13 | POST | `/announcements/audience-preview` | notifications.create | Recipient count and credit cost for a filter | Announcement, MessageCreditWallet |
| NTF-API-14 | POST | `/announcements/:id/send` | notifications.send | Send now or schedule; reserves credits (job) | Announcement, AnnouncementRecipient, CreditTransaction |
| NTF-API-15 | POST | `/announcements/:id/cancel` | notifications.send | Cancel SCHEDULED; release credits | Announcement, CreditTransaction |
| NTF-API-16 | GET | `/announcements/:id/recipients` | notifications.view | Recipients with read and acknowledgement status | AnnouncementRecipient |
| NTF-API-17 | GET | `/announcements/inbox` | self | Notices addressed to the signed-in staff user | AnnouncementRecipient, Announcement |
| NTF-API-18 | POST | `/announcements/:id/acknowledge` | self | Mark read or acknowledged (staff) | AnnouncementRecipient |
| NTF-API-19 | GET | `/notifications` | self | Own in-app feed (`unread`, category) | Notification |
| NTF-API-20 | GET | `/notifications/unread-count` | self | Bell badge count | Notification |
| NTF-API-21 | POST | `/notifications/:id/read` | self | Mark one as read | Notification |
| NTF-API-22 | POST | `/notifications/read-all` | self | Mark all as read | Notification |
| NTF-API-23 | GET | `/notification-preferences` | self | Own channel x category matrix | NotificationPreference |
| NTF-API-24 | PUT | `/notification-preferences` | self | Bulk upsert own preferences | NotificationPreference |
| NTF-API-25 | POST | `/device-tokens` | self | Register or refresh a push token | DeviceToken |
| NTF-API-26 | DELETE | `/device-tokens/:id` | self | Unregister token on logout | DeviceToken |
| NTF-API-27 | GET | `/message-logs` | notifications.view | Delivery log, all channels (status, event, student) | MessageLog |
| NTF-API-28 | GET | `/message-logs/:id` | notifications.view | Message detail: body, variables, error, cost | MessageLog |
| NTF-API-29 | POST | `/message-logs/:id/resend` | notifications.send | Resend a FAILED message as a new log row | MessageLog, CreditTransaction |
| NTF-API-30 | POST | `/message-logs/export` | notifications.export | Export delivery log (job) | ExportJob |
| NTF-API-31 | GET | `/notification-reports/summary` | notifications.view | Sent, delivered, read, failed and cost by channel | MessageLog |

Events emitted: notification.created, announcement.scheduled, announcement.sent, announcement.cancelled, announcement.acknowledged, message.queued, message.sent, message.delivered, message.read, message.failed, message.fallback_triggered

## WA — WhatsApp

Resource base path(s): `/whatsapp-accounts`, `/whatsapp-templates`, `/whatsapp-messages`, `/whatsapp-inbound-messages`, `/whatsapp-opt-ins`, `/whatsapp-wallet`, `/webhooks/whatsapp`, `/whatsapp-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| WA-API-01 | GET | `/whatsapp-accounts` | whatsapp.view | List connected numbers | WhatsAppAccount |
| WA-API-02 | POST | `/whatsapp-accounts` | whatsapp.manage | Connect a WABA number (embedded signup code exchange) | WhatsAppAccount |
| WA-API-03 | GET | `/whatsapp-accounts/:id` | whatsapp.view | Account health: quality rating, messaging tier | WhatsAppAccount |
| WA-API-04 | PATCH | `/whatsapp-accounts/:id` | whatsapp.manage | Update campus, default flag, status | WhatsAppAccount |
| WA-API-05 | DELETE | `/whatsapp-accounts/:id` | whatsapp.manage | Disconnect number | WhatsAppAccount |
| WA-API-06 | POST | `/whatsapp-accounts/:id/sync` | whatsapp.manage | Refresh verified name, quality, tier from Meta | WhatsAppAccount |
| WA-API-07 | GET | `/whatsapp-templates` | whatsapp.view | List templates (status, category, language) | WhatsAppTemplate |
| WA-API-08 | POST | `/whatsapp-templates` | whatsapp.manage | Create template and submit to Meta | WhatsAppTemplate |
| WA-API-09 | PATCH | `/whatsapp-templates/:id` | whatsapp.manage | Edit DRAFT or REJECTED template and resubmit | WhatsAppTemplate |
| WA-API-10 | DELETE | `/whatsapp-templates/:id` | whatsapp.manage | Delete template (also at Meta) | WhatsAppTemplate |
| WA-API-11 | POST | `/whatsapp-templates/sync` | whatsapp.manage | Pull templates and approval status from Meta (job) | WhatsAppTemplate |
| WA-API-12 | GET | `/whatsapp-messages` | whatsapp.view | Outbound WhatsApp log (status, category, cost) | MessageLog |
| WA-API-13 | POST | `/whatsapp-messages` | whatsapp.send | Send template message to recipients; PDF or pay-link header; credit check (job) | MessageLog, WhatsAppTemplate, MessageCreditWallet |
| WA-API-14 | GET | `/whatsapp-inbound-messages` | whatsapp.view | Front-desk inbox (unread, phone, guardian) | WhatsAppInboundMessage |
| WA-API-15 | POST | `/whatsapp-inbound-messages/:id/read` | whatsapp.send | Mark message read and handled | WhatsAppInboundMessage |
| WA-API-16 | POST | `/whatsapp-inbound-messages/:id/reply` | whatsapp.send | Free-form reply inside the 24-hour window | WhatsAppInboundMessage, MessageLog |
| WA-API-17 | GET | `/whatsapp-opt-ins` | whatsapp.view | Guardians with WhatsApp consent status and proof | ConsentRecord, Guardian |
| WA-API-18 | POST | `/whatsapp-opt-ins` | whatsapp.manage | Record opt-in or opt-out with proof (form, in person) | ConsentRecord |
| WA-API-19 | GET | `/whatsapp-wallet` | whatsapp.view | Balance, reserved, available, packs on offer | MessageCreditWallet |
| WA-API-20 | PATCH | `/whatsapp-wallet` | whatsapp.manage | Set low-balance threshold | MessageCreditWallet |
| WA-API-21 | GET | `/whatsapp-wallet/transactions` | whatsapp.view | Wallet ledger (type, date) | CreditTransaction |
| WA-API-22 | POST | `/whatsapp-wallet/top-ups` | whatsapp.manage | Buy a credit pack; returns checkout (IK) | AddOnPurchase, CreditTransaction |
| WA-API-23 | GET | `/webhooks/whatsapp` | public | Meta webhook verification handshake | — |
| WA-API-24 | POST | `/webhooks/whatsapp` | public | Inbound messages, delivery/read statuses, template and quality updates | WebhookEvent, WhatsAppInboundMessage, MessageLog, WhatsAppTemplate |
| WA-API-25 | GET | `/whatsapp-reports/summary` | whatsapp.view | Sent, delivered, read, failed and cost by category | MessageLog, CreditTransaction |
| WA-API-26 | POST | `/whatsapp-messages/export` | whatsapp.export | Export WhatsApp log (job) | ExportJob |

Events emitted: whatsapp.account.connected, whatsapp.account.disconnected, whatsapp.account.quality_changed, whatsapp.template.approved, whatsapp.template.rejected, whatsapp.template.paused, whatsapp.message.received, whatsapp.opt_in.recorded, whatsapp.opt_out.recorded, whatsapp.wallet.topped_up, whatsapp.wallet.low_balance, whatsapp.wallet.exhausted

## EML — Email

Resource base path(s): `/email-sender-identities`, `/email-messages`, `/email-suppressions`, `/webhooks/ses`, `/email-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| EML-API-01 | GET | `/email-sender-identities` | email.view | List sender identities with DKIM/SPF records and status | EmailSenderIdentity |
| EML-API-02 | POST | `/email-sender-identities` | email.manage | Add custom domain sender; returns DNS records | EmailSenderIdentity |
| EML-API-03 | PATCH | `/email-sender-identities/:id` | email.manage | Update from name, reply-to, default flag | EmailSenderIdentity |
| EML-API-04 | DELETE | `/email-sender-identities/:id` | email.manage | Remove identity (falls back to shared domain) | EmailSenderIdentity |
| EML-API-05 | POST | `/email-sender-identities/:id/verify` | email.manage | Re-check DKIM and SPF in SES | EmailSenderIdentity |
| EML-API-06 | GET | `/email-messages` | email.view | Email log (status, event, recipient) | MessageLog |
| EML-API-07 | POST | `/email-messages` | email.send | Send ad-hoc email to recipients with secure file links (job) | MessageLog, NotificationTemplate, EmailSuppression |
| EML-API-08 | GET | `/email-messages/:id` | email.view | Email detail with bounce diagnostics | MessageLog, EmailSuppression |
| EML-API-09 | POST | `/email-messages/:id/resend` | email.send | Resend a FAILED email | MessageLog |
| EML-API-10 | GET | `/email-suppressions` | email.view | Suppression list (reason, email) | EmailSuppression |
| EML-API-11 | POST | `/email-suppressions` | email.manage | Add an address manually | EmailSuppression |
| EML-API-12 | DELETE | `/email-suppressions/:id` | email.manage | Clear a suppression (sets removedAt) | EmailSuppression |
| EML-API-13 | POST | `/email-suppressions/unsubscribe` | public | One-click unsubscribe from the email footer (signed token) | EmailSuppression, NotificationPreference |
| EML-API-14 | POST | `/webhooks/ses` | public | SES/SNS delivery, bounce and complaint receiver | WebhookEvent, MessageLog, EmailSuppression |
| EML-API-15 | GET | `/email-reports/summary` | email.view | Sent, delivered, bounce rate, complaint rate | MessageLog, EmailSuppression |
| EML-API-16 | POST | `/email-messages/export` | email.export | Export email log (job) | ExportJob |

Events emitted: email.identity.verified, email.identity.failed, email.bounced, email.complained, email.unsubscribed, email.suppression.added, email.suppression.removed

## SMS — SMS

Resource base path(s): `/sms-sender-ids`, `/sms-dlt-templates`, `/sms-messages`, `/sms-wallet`, `/webhooks/msg91`, `/webhooks/twilio`, `/sms-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| SMS-API-01 | GET | `/sms-sender-ids` | sms.view | List headers / sender numbers (dropdown) | SmsSenderId |
| SMS-API-02 | POST | `/sms-sender-ids` | sms.manage | Add header with DLT entity and telemarketer ids | SmsSenderId |
| SMS-API-03 | PATCH | `/sms-sender-ids/:id` | sms.manage | Update header, default flag, status | SmsSenderId |
| SMS-API-04 | DELETE | `/sms-sender-ids/:id` | sms.manage | Remove header | SmsSenderId |
| SMS-API-05 | POST | `/sms-sender-ids/:id/verify` | sms.manage | Test send and set verification status | SmsSenderId, MessageLog |
| SMS-API-06 | GET | `/sms-dlt-templates` | sms.view | List DLT content templates (header, status, language) | SmsDltTemplate |
| SMS-API-07 | POST | `/sms-dlt-templates` | sms.manage | Register a DLT template id with exact text | SmsDltTemplate |
| SMS-API-08 | PATCH | `/sms-dlt-templates/:id` | sms.manage | Update text, category, approval status | SmsDltTemplate |
| SMS-API-09 | DELETE | `/sms-dlt-templates/:id` | sms.manage | Remove DLT template | SmsDltTemplate |
| SMS-API-10 | POST | `/sms-dlt-templates/import` | sms.import | Import templates from the DLT portal Excel (job) | ImportJob, SmsDltTemplate |
| SMS-API-11 | GET | `/sms-messages` | sms.view | SMS log with delivery reports | MessageLog |
| SMS-API-12 | POST | `/sms-messages` | sms.send | Send SMS by DLT template to recipients; credit check (job) | MessageLog, SmsDltTemplate, MessageCreditWallet |
| SMS-API-13 | POST | `/sms-messages/preview` | sms.view | DLT text match, Unicode check, segments, cost | SmsDltTemplate |
| SMS-API-14 | GET | `/sms-wallet` | sms.view | Balance, reserved, available, packs on offer | MessageCreditWallet |
| SMS-API-15 | PATCH | `/sms-wallet` | sms.manage | Set low-balance threshold | MessageCreditWallet |
| SMS-API-16 | GET | `/sms-wallet/transactions` | sms.view | Wallet ledger (type, date) | CreditTransaction |
| SMS-API-17 | POST | `/sms-wallet/top-ups` | sms.manage | Buy an SMS pack; returns checkout (IK) | AddOnPurchase, CreditTransaction |
| SMS-API-18 | POST | `/webhooks/msg91` | public | MSG91 delivery report receiver | WebhookEvent, MessageLog |
| SMS-API-19 | POST | `/webhooks/twilio` | public | Twilio status callback and STOP replies | WebhookEvent, MessageLog, NotificationPreference |
| SMS-API-20 | GET | `/sms-reports/summary` | sms.view | Sent, delivered, failed, segments and cost | MessageLog, CreditTransaction |
| SMS-API-21 | POST | `/sms-messages/export` | sms.export | Export SMS log (job) | ExportJob |

Events emitted: sms.sender.verified, sms.sender.failed, sms.dlt_template.approved, sms.dlt_template.rejected, sms.opted_out, sms.wallet.topped_up, sms.wallet.low_balance, sms.wallet.exhausted

## Permission keys used in this file

| Permission | Meaning |
|---|---|
| public | No login; provider signature or signed token is verified |
| self | Any signed-in user; own rows only |
| fees.view | View fee setup, assignments, invoices, ledgers, fee reports |
| fees.manage | Manage fee heads, tax rates, late-fee rules, fee structures; year-end carry-forward |
| fees.create | Assign fee structures; create, generate and issue invoices |
| fees.update | Edit assignments and DRAFT invoices; request invoice adjustments |
| fees.delete | Cancel assignments; discard DRAFT and cancel issued invoices |
| fees.approve | Approve or reject adjustments; write off balances |
| fees.remind | Send single and bulk fee reminders |
| fees.collect | Record counter payments, allocate advances, create orders and pay links, send receipts |
| fees.import | Import opening dues from Excel |
| fees.export | Export invoices, dues and defaulter reports |
| payments.view | View payments, receipts, orders, refunds, settlements, day closes, payment reports |
| payments.update | Update cheque status, record cheque bounce |
| payments.cancel | Cancel a payment; cancel and reissue a receipt |
| payments.refund | Request and process refunds |
| payments.approve | Approve or reject refunds; verify day closes |
| payments.close_day | Prepare and submit the daily cash close |
| payments.reconcile | Sync and reconcile gateway settlements |
| payments.manage | Manage gateway accounts; view and retry webhook events |
| payments.import | Import historical payments from Excel |
| payments.export | Export payment, receipt, refund and day-book data |
| discounts.view | View schemes, grants, previews, sibling suggestions, impact report |
| discounts.manage | Create, update and archive discount schemes |
| discounts.create | Grant a discount to one or many students |
| discounts.update | Edit a pending grant |
| discounts.approve | Approve or reject grants |
| discounts.delete | Revoke an approved grant |
| discounts.export | Export grants and impact report |
| scholarships.view | View schemes, applications, awards, utilisation report |
| scholarships.manage | Create, update, archive, open and close schemes |
| scholarships.create | Create and submit applications for a student |
| scholarships.update | Edit, review, shortlist or withdraw applications |
| scholarships.approve | Approve or reject applications; award, suspend, reinstate, revoke, renew |
| scholarships.disburse | Record and reverse disbursements |
| scholarships.export | Export scholarship data |
| parentportal.access | Use the Parent Portal; own children only (checked in code) |
| studentportal.access | Use the Student Portal; own record only (checked in code) |
| notifications.view | View templates, event catalog, announcements, delivery log, summary |
| notifications.manage | Create, update, delete and test notification templates |
| notifications.create | Create announcements and preview audiences |
| notifications.update | Edit draft or scheduled announcements |
| notifications.delete | Delete announcements |
| notifications.send | Send, schedule or cancel announcements; resend messages |
| notifications.export | Export the delivery log |
| whatsapp.view | View accounts, templates, log, inbox, opt-ins, wallet, summary |
| whatsapp.manage | Connect accounts, manage templates, record opt-ins, wallet settings and top-ups |
| whatsapp.send | Send WhatsApp messages; handle and reply to inbound messages |
| whatsapp.export | Export the WhatsApp log |
| email.view | View sender identities, email log, suppressions, summary |
| email.manage | Manage sender identities and the suppression list |
| email.send | Send and resend emails |
| email.export | Export the email log |
| sms.view | View headers, DLT templates, SMS log, wallet, summary; preview messages |
| sms.manage | Manage headers, DLT templates, wallet settings and top-ups |
| sms.send | Send SMS |
| sms.import | Import DLT templates from Excel |
| sms.export | Export the SMS log |
