# EduFlow Prisma Schema — Index

Generated from the `.prisma` files in this folder (do not edit by hand). The schema is validated with `prisma validate` (Prisma ORM 6.x, PostgreSQL).

Conventions: UUID primary keys, `organizationId` on every tenant model, camelCase fields mapped to snake_case columns, snake_case plural table names, money as `Decimal(12, 2)` + `currency`, UTC timestamps, soft delete with `deletedAt` on business records, per-tenant unique keys.


**Totals: 189 models, 186 enums, 14 files.**


## 00-base.prisma — 0 models, 16 enums

Modules served: shared


## 01-platform.prisma — 19 models, 12 enums

Modules served: ORG, CAMP, SET, DASH (platform, plans, campuses, settings, files, imports)

| Model | Table | Tenant scoped | Fields | Purpose |
|---|---|---|---|---|
| `Country` | `countries` | No (platform) | 14 | Platform reference: ISO 3166 country with regional defaults. No tenant scope. |
| `Currency` | `currencies` | No (platform) | 8 | Platform reference: ISO 4217 currency. No tenant scope. |
| `ExchangeRate` | `exchange_rates` | No (platform) | 8 | Platform reference: daily exchange rate used to convert provider costs (USD) and cross-currency reports. No tenant scope. |
| `Plan` | `plans` | No (platform) | 16 | SaaS plan catalogue (Starter, Growth, Pro, Enterprise). Platform-level. |
| `PlanPrice` | `plan_prices` | No (platform) | 8 | Price of a plan per currency and billing cycle (tax excluded). Platform-level. |
| `PlanFeature` | `plan_features` | No (platform) | 9 | Module and feature gating per plan (which modules/limits a plan unlocks). Platform-level. |
| `Organization` | `organizations` | No (platform) | 41 | The tenant: one school, school group or coaching institute. |
| `Subscription` | `subscriptions` | Yes | 24 | A tenant's SaaS subscription to a plan (one live row per organization; history kept). One live row is enforced by a partial unique index in the SQL migration: UNIQUE (organization_id) WHERE status IN ('TRIALING','ACTIVE' |
| `SubscriptionInvoice` | `subscription_invoices` | Yes | 41 | Invoice raised by EduFlow to a tenant for the subscription and add-ons. |
| `AddOnPurchase` | `add_on_purchases` | Yes | 25 | Add-on bought by a tenant: extra campus, AI Insights, WhatsApp/SMS credit packs, migration, training. |
| `Campus` | `campuses` | Yes | 31 | A branch / centre of an organization. Most operational data is scoped to a campus. One main campus per organization is enforced by a partial unique index in the SQL migration: UNIQUE (organization_id) WHERE is_main AND d |
| `OrganizationSetting` | `organization_settings` | Yes | 8 | Key/value settings per organization, with an optional campus-level override. |
| `NumberSequence` | `number_sequences` | Yes | 14 | Gap-free counters for admission, receipt, invoice and other document numbers. |
| `CustomFieldDefinition` | `custom_field_definitions` | Yes | 18 | Tenant-defined extra field for students, staff, inquiries and other entities. |
| `CustomFieldValue` | `custom_field_values` | Yes | 8 | Value of a custom field for one entity row (polymorphic: entityType + entityId). |
| `FileAsset` | `file_assets` | Yes | 21 | Metadata of a file stored in a private S3 bucket; served through pre-signed URLs. Rows are never hard-deleted: purge sets status = DELETED + deletedAt and removes only the S3 object. |
| `ImportJob` | `import_jobs` | Yes | 20 | Bulk Excel/CSV import run (students, staff, fee dues ...) processed by a worker. |
| `ImportJobRowError` | `import_job_row_errors` | Yes | 9 | One rejected row (or cell) of an import job. Append-only: no updatedAt / deletedAt. |
| `ExportJob` | `export_jobs` | Yes | 17 | Asynchronous export of a list or report to Excel/CSV/PDF; file link expires. |

## 02-auth.prisma — 17 models, 19 enums

Modules served: AUTH, USR, SET (users, roles, permissions, sessions, audit, consent)

| Model | Table | Tenant scoped | Fields | Purpose |
|---|---|---|---|---|
| `User` | `users` | Yes | 34 | Login account. One row per person per organization and user type; PLATFORM users have no organization. SQL migration adds: CHECK ((user_type = 'PLATFORM') = (organization_id IS NULL)) so a tenant user can never have a NU |
| `Role` | `roles` | Yes | 12 | Role: the seven system roles (organizationId null, isSystem true) or a tenant's custom role. SQL migration adds: CHECK (is_system = (organization_id IS NULL)). |
| `Permission` | `permissions` | No (platform) | 10 | Platform-level catalogue of permission keys in module.action form (students.create, fees.collect). |
| `RolePermission` | `role_permissions` | Yes | 7 | Permission granted to a role, with the data scope (all / campus / own / view). |
| `UserRole` | `user_roles` | Yes | 7 | Role assigned to a user. Campus reach comes from UserCampus. The service (and a trigger in the SQL migration) verifies role.organization_id IS NULL OR role.organization_id = user_roles.organization_id. |
| `UserCampus` | `user_campuses` | Yes | 7 | Campuses a user may work in (ORG_ADMIN sees all campuses without rows here). |
| `RefreshToken` | `refresh_tokens` | Yes | 17 | Rotating refresh token (30 days), stored as a SHA-256 hash. One family per login session. |
| `OtpCode` | `otp_codes` | Yes | 14 | One-time code for OTP login, phone/email verification, MFA and consent verification. |
| `PasswordResetToken` | `password_reset_tokens` | Yes | 10 | Single-use password reset link token (hashed, short expiry). |
| `Invitation` | `invitations` | Yes | 17 | Invitation sent to a staff member, parent or student to create their login. |
| `LoginHistory` | `login_histories` | Yes | 14 | Every login attempt (success or failure). Append-only: no updatedAt / deletedAt. |
| `AuditLog` | `audit_logs` | Yes | 24 | Immutable trail of who changed what. Append-only: no updatedAt / deletedAt. |
| `ApiKey` | `api_keys` | Yes | 14 | API key for Enterprise integrations; only the hash is stored, the prefix identifies the key. |
| `PolicyDocument` | `policy_documents` | Yes | 12 | Versioned text of a privacy notice / policy per language; the exact notice a consent refers to. |
| `DataBreachIncident` | `data_breach_incidents` | Yes | 21 | Personal-data breach register: scope, containment and notification times (GDPR 72 h, NDB scheme, DPDP Board). |
| `ConsentRecord` | `consent_records` | Yes | 28 | Proof of consent (DPDP / GDPR / COPPA): who agreed to what, for which child, and how it was verified. |
| `DataSubjectRequest` | `data_subject_requests` | Yes | 30 | Privacy request from a data subject: access, export, correction or deletion of personal data. |

## 03-academics.prisma — 11 models, 7 enums

Modules served: BAT, SUB, TT (academic years, courses, batches, subjects, calendar)

| Model | Table | Tenant scoped | Fields | Purpose |
|---|---|---|---|---|
| `AcademicYear` | `academic_years` | Yes | 11 | Academic year / session, e.g. 2027-28. Organization-wide; exactly one row is current. Enforced by a partial unique index in the SQL migration: UNIQUE (organization_id) WHERE is_current AND deleted_at IS NULL |
| `Term` | `terms` | Yes | 11 | Term / semester / quarter inside an academic year (used by exams, fees and report cards). |
| `Course` | `courses` | Yes | 16 | Grade or program: "Class 10" in a school, "JEE Main 2028" in a coaching institute. |
| `Batch` | `batches` | Yes | 21 | Teaching group of a course in one academic year: "Section 10-A" or "Morning Batch M1". |
| `Subject` | `subjects` | Yes | 11 | Subject master, e.g. Mathematics, Physics. Shared by all campuses of the organization. |
| `CourseSubject` | `course_subjects` | Yes | 17 | Subject taught in a course (curriculum), with elective flag and weekly period count. |
| `BatchSubjectTeacher` | `batch_subject_teachers` | Yes | 11 | Which teacher teaches which subject in which batch; drives the TEACHER "own batches" data scope. |
| `Room` | `rooms` | Yes | 12 | Physical room of a campus (classroom, lab, hall) used by batches and the timetable. |
| `Holiday` | `holidays` | Yes | 14 | Holiday or vacation (one day or a date range); attendance is not expected on these dates. |
| `CalendarEvent` | `calendar_events` | Yes | 18 | Institute calendar entry: PTM, exam window, sports day, staff meeting. |
| `PtmBooking` | `ptm_bookings` | Yes | 14 | A parent's slot with one teacher in a PTM calendar event, with attendance and notes. |

## 04-people.prisma — 19 models, 22 enums

Modules served: STU, ADM, TCH, STF (students, guardians, admissions, staff)

| Model | Table | Tenant scoped | Fields | Purpose |
|---|---|---|---|---|
| `Department` | `departments` | Yes | 10 | Staff department, e.g. Science, Accounts, Administration. |
| `Designation` | `designations` | Yes | 9 | Job title, e.g. PGT Mathematics, Accountant, Front Desk Executive. |
| `Staff` | `staff` | Yes | 53 | Employee profile (teacher or non-teaching). The login lives in User and is linked by userId. |
| `StaffDocument` | `staff_documents` | Yes | 16 | Document uploaded for a staff member (ID proof, degree, contract). |
| `TeacherSubject` | `teacher_subjects` | Yes | 7 | Subjects a teacher is qualified to teach (used when assigning batches and substitutions). |
| `Student` | `students` | Yes | 59 | Student master record. Batch membership per year lives in Enrollment. |
| `Guardian` | `guardians` | Yes | 30 | Parent or guardian. One row per person per organization; linked to children through StudentGuardian. |
| `Family` | `families` | Yes | 9 | Household that groups siblings and their guardians (sibling discount, family statement, one parent login). |
| `StudentGuardian` | `student_guardians` | Yes | 13 | Link between a student and a guardian with the relationship and contact flags. |
| `Enrollment` | `enrollments` | Yes | 18 | A student's membership of a batch in an academic year (history is kept across years). Ended rows (TRANSFERRED, WITHDRAWN, CANCELLED, soft-deleted) must not block a new row, so the rules live in partial unique indexes in  |
| `StudentDocument` | `student_documents` | Yes | 16 | Document uploaded for a student (birth certificate, transfer certificate, marksheet). |
| `StudentNote` | `student_notes` | Yes | 12 | Staff remark on a student (academic, behaviour, medical, counselling), optionally shared with parents. |
| `StudentStatusHistory` | `student_status_histories` | Yes | 9 | Every change of Student.status with reason and actor. Append-only: no updatedAt / deletedAt. |
| `StaffStatusHistory` | `staff_status_histories` | Yes | 12 | Every status, campus, department or designation change of a staff member. Append-only: no updatedAt / deletedAt. |
| `StudentTransfer` | `student_transfers` | Yes | 19 | Request to move a student to another batch, course or campus, with approval and fee treatment. |
| `AdmissionInquiry` | `admission_inquiries` | Yes | 40 | Admission lead captured from walk-in, website form, phone or WhatsApp. |
| `InquiryFollowUp` | `inquiry_follow_ups` | Yes | 12 | A planned or completed contact with an admission lead. |
| `AdmissionApplication` | `admission_applications` | Yes | 45 | Admission form submitted online or at the front desk; approved applications become students. |
| `AdmissionApplicationDocument` | `admission_application_documents` | Yes | 11 | Document attached to an admission application; copied to StudentDocument on conversion. |

## 05-attendance-leave.prisma — 9 models, 5 enums

Modules served: ATT, LEV

| Model | Table | Tenant scoped | Fields | Purpose |
|---|---|---|---|---|
| `AttendanceSession` | `attendance_sessions` | Yes | 23 | One attendance-taking event for a batch: the whole day, or one period of the day. |
| `AttendanceRecord` | `attendance_records` | Yes | 20 | Attendance of one student in one session. |
| `StaffAttendance` | `staff_attendance` | Yes | 21 | Daily attendance of a staff member with check-in / check-out. |
| `LeaveType` | `leave_types` | Yes | 13 | Kind of staff leave: Casual, Sick, Earned, Maternity, Loss of Pay. |
| `LeavePolicy` | `leave_policies` | Yes | 22 | Entitlement rule for a leave type: quota, accrual, carry-forward, who it applies to. |
| `LeaveBalance` | `leave_balances` | Yes | 15 | Leave balance of one staff member for one leave type in one academic year. Available = opening + carriedForward + accrued + adjusted - used - pending - encashed - lapsed. |
| `LeaveRequest` | `leave_requests` | Yes | 25 | Staff leave application; approvals are tracked level by level in LeaveApprovalStep. |
| `LeaveApprovalStep` | `leave_approval_steps` | Yes | 10 | One level of the approval chain of a staff leave request. |
| `StudentLeaveRequest` | `student_leave_requests` | Yes | 23 | Leave application for a student, raised by a parent in the Parent Portal (or by staff on their behalf). |

## 06-timetable-homework.prisma — 9 models, 8 enums

Modules served: TT, HW

| Model | Table | Tenant scoped | Fields | Purpose |
|---|---|---|---|---|
| `PeriodSlot` | `period_slots` | Yes | 13 | A row of the campus bell schedule: Period 1 08:00-08:40, Lunch 11:20-11:50. |
| `TimetableEntry` | `timetable_entries` | Yes | 18 | One cell of a batch's weekly timetable. Rows are replaced (hard delete) when the timetable changes, so the three unique keys below guarantee: no double booking of a batch, a teacher or a room. Elective split: one row per |
| `Substitution` | `substitutions` | Yes | 16 | Replacement teacher for one timetable entry on one date (absent teacher, leave). |
| `Homework` | `homework` | Yes | 20 | Homework / assignment given to a batch for a subject. |
| `HomeworkAttachment` | `homework_attachments` | Yes | 9 | File or link attached to a homework by the teacher. |
| `HomeworkSubmission` | `homework_submissions` | Yes | 16 | A student's work for a homework: status, files, marks and teacher feedback. |
| `HomeworkSubmissionFile` | `homework_submission_files` | Yes | 7 | File uploaded by the student / parent as part of a homework submission. |
| `ClassSession` | `class_sessions` | Yes | 23 | One dated lecture of a batch (generated from the weekly timetable or created ad hoc): extra class, doubt session, cancelled / rescheduled lecture, online class. Coaching attendance and per-lecture faculty pay attach to i |
| `StudyMaterial` | `study_materials` | Yes | 18 | Learning resource (notes, DPP sheet, recorded-lecture link) shared with one or more batches; no due date or submission. |

## 07-exams.prisma — 11 models, 10 enums

Modules served: EXM, RPT

| Model | Table | Tenant scoped | Fields | Purpose |
|---|---|---|---|---|
| `GradeScale` | `grade_scales` | Yes | 10 | Grading scheme of the organization, e.g. "CBSE 9-point" or "GPA 4.0". |
| `GradeBand` | `grade_bands` | Yes | 12 | One band of a grade scale: grade A1 = 91-100 %, grade point 10. |
| `Exam` | `exams` | Yes | 23 | An examination of a campus in an academic year / term: "Unit Test 1", "Half Yearly", "JEE Mock 7". |
| `ExamSchedule` | `exam_schedules` | Yes | 23 | One paper of an exam: exam + batch + subject with date, time, room and marks limits (the date sheet). |
| `ExamMark` | `exam_marks` | Yes | 27 | Marks of one student in one exam paper. |
| `ExamScheduleComponent` | `exam_schedule_components` | Yes | 10 | Marks component of an exam paper: Theory 80 + Internal 20, or Theory 70 + Practical 30. |
| `ExamMarkComponent` | `exam_mark_components` | Yes | 8 | Marks of one student in one component of a paper; ExamMark.marksObtained holds the cached total. |
| `ExamReEvaluationRequest` | `exam_re_evaluation_requests` | Yes | 16 | Re-checking / re-totalling request for one exam paper of a student, raised after results are published. |
| `ReportCardTemplate` | `report_card_templates` | Yes | 12 | Report card design: board style, layout blocks and display options. |
| `ReportCard` | `report_cards` | Yes | 33 | Generated result of one student for an exam, a term or the whole year, with the PDF. |
| `ReportCardRemark` | `report_card_remarks` | Yes | 11 | Remark written on a report card by the class teacher, principal or a subject teacher. |

## 08-fees.prisma — 18 models, 17 enums

Modules served: FEE, DSC, SCH

| Model | Table | Tenant scoped | Fields | Purpose |
|---|---|---|---|---|
| `FeeHead` | `fee_heads` | Yes | 20 | Kind of charge: Tuition, Transport, Hostel, Exam ... with tax settings. |
| `TaxRate` | `tax_rates` | Yes | 16 | Effective-dated tax rate with components: GST 18 % = CGST 9 + SGST 9 (intra-state) or IGST 18 (inter-state); VAT 5 %; US state sales tax. |
| `FeeStructure` | `fee_structures` | Yes | 17 | Fee plan for a course (optionally one batch) in an academic year. |
| `FeeStructureItem` | `fee_structure_items` | Yes | 11 | One fee head inside a fee structure with its amount and billing frequency. |
| `FeeInstallment` | `fee_installments` | Yes | 11 | Payment schedule of a fee structure: installment 1 due 10 Apr, installment 2 due 10 Jul ... |
| `StudentFeeAssignment` | `student_fee_assignments` | Yes | 19 | A fee structure applied to one student for one academic year, with per-student overrides. |
| `FeeInvoice` | `fee_invoices` | Yes | 57 | Fee bill raised to a student for a period. Cached money columns (kept in the row for fast dues lists): total   = subtotal - discountTotal + taxTotal + lateFee + adjustmentTotal balance = total - scholarshipCredit - amoun |
| `FeeInvoiceItem` | `fee_invoice_items` | Yes | 23 | One line of a fee invoice (a fee head with amount, discount and tax). |
| `FeeInvoiceAdjustment` | `fee_invoice_adjustments` | Yes | 16 | Approved change to an issued invoice (credit / debit note): post-issue concession, late-fee waiver, correction, partial write-off. |
| `StudentFeeInstallment` | `student_fee_installments` | Yes | 11 | Per-student payment schedule negotiated at the counter; replaces the structure's installments when hasCustomSchedule is true. |
| `LateFeeRule` | `late_fee_rules` | Yes | 15 | How the late fee is calculated after the due date. One default rule per organization / campus is enforced by a partial unique index in the SQL migration (WHERE is_default AND deleted_at IS NULL). |
| `Discount` | `discounts` | Yes | 20 | Discount scheme: sibling, early-bird, staff child, merit ... percent or fixed. |
| `StudentDiscount` | `student_discounts` | Yes | 19 | A discount granted to one student for an academic year, with approval. |
| `Scholarship` | `scholarships` | Yes | 24 | Scholarship scheme with funding source, eligibility criteria, seats and value. |
| `ScholarshipApplication` | `scholarship_applications` | Yes | 23 | A student's application to a scholarship with documents, score and review decision. |
| `ScholarshipAward` | `scholarship_awards` | Yes | 23 | Scholarship granted to a student for a year; money reaches invoices through ScholarshipDisbursement. |
| `ScholarshipDisbursement` | `scholarship_disbursements` | Yes | 17 | Part of a scholarship award: credited against a fee invoice (adds to FeeInvoice.scholarshipCredit), or paid by the funder straight to the beneficiary (invoiceId null, paidToBeneficiary true). A retried job cannot credit  |
| `FeeReminderLog` | `fee_reminder_logs` | Yes | 15 | One fee reminder sent for an invoice. Append-only: no updatedAt / deletedAt. |

## 09-payments.prisma — 11 models, 13 enums

Modules served: PAY

| Model | Table | Tenant scoped | Fields | Purpose |
|---|---|---|---|---|
| `PaymentGatewayAccount` | `payment_gateway_accounts` | Yes | 20 | A tenant's own Razorpay / Stripe account used to collect fees online (optionally one per campus). One default account per organization is enforced by a partial unique index in the SQL migration (WHERE is_default AND dele |
| `PaymentOrder` | `payment_orders` | Yes | 26 | Online checkout order created at the gateway before the parent pays; safe to retry with the same idempotency key. |
| `Payment` | `payments` | Yes | 57 | Money received from a payer by any method. Never deleted: mistakes are cancelled or refunded. advance (unallocated money) = amount - convenienceFee - convenienceFeeTax - amountAllocated - amountRefunded. Student ledgers  |
| `PaymentAllocation` | `payment_allocations` | Yes | 15 | Split of a payment across fee invoices. Reversed (not deleted) when the payment is cancelled or bounced. One ACTIVE allocation per payment + invoice is enforced by a partial unique index in the SQL migration: uq_payment_ |
| `PaymentAllocationItem` | `payment_allocation_items` | Yes | 10 | Head-wise split of one payment allocation (which fee heads a partial payment settled, by FeeHead.settlementPriority). |
| `Receipt` | `receipts` | Yes | 26 | Numbered receipt for a successful payment (one per payment) with the PDF. Cancelled, never deleted. |
| `Refund` | `refunds` | Yes | 36 | Refund of a payment (full or part) with approval; online refunds go back through the gateway. |
| `RefundAllocation` | `refund_allocations` | Yes | 9 | Which allocation / invoice the refunded money comes out of, so amountPaid and balance can be recomputed and the right invoice reopens. |
| `WebhookEvent` | `webhook_events` | Yes | 19 | Inbox of provider webhooks. The unique (provider, eventId) key makes handling idempotent. |
| `Settlement` | `settlements` | Yes | 23 | Gateway payout to the institute's bank account, reconciled against the payments it contains. |
| `DayClose` | `day_closes` | Yes | 28 | Daily cash closing by an accountant: counted cash vs system cash, and the bank deposit. |

## 10-communication.prisma — 16 models, 14 enums

Modules served: NTF, WA, EML, SMS, PP, SP

| Model | Table | Tenant scoped | Fields | Purpose |
|---|---|---|---|---|
| `NotificationTemplate` | `notification_templates` | Yes | 19 | Message template per event, channel and language. organizationId null = EduFlow default used until a tenant overrides it. |
| `Notification` | `notifications` | Yes | 14 | In-app notification shown in the bell menu of one user. |
| `NotificationPreference` | `notification_preferences` | Yes | 8 | A user's opt-in / opt-out per channel and category. |
| `Announcement` | `announcements` | Yes | 19 | Notice / circular sent to a filtered audience over one or more channels, now or scheduled. |
| `AnnouncementRecipient` | `announcement_recipients` | Yes | 11 | One resolved recipient of an announcement with read / acknowledgement tracking. |
| `MessageLog` | `message_logs` | Yes | 43 | Every WhatsApp, SMS, email and push message sent, with delivery status and cost. High volume; never soft-deleted. cost / currency = amount debited from the tenant wallet; providerCost + marginAmount explain it (WhatsApp: |
| `WhatsAppAccount` | `whats_app_accounts` | Yes | 17 | A tenant's WhatsApp Business Account number connected through the Meta Cloud API. phoneNumberId routes inbound webhooks, so it is unique among LIVE rows only (a disconnected number can be reconnected): partial unique ind |
| `WhatsAppTemplate` | `whats_app_templates` | Yes | 17 | WhatsApp message template registered with Meta (name + language), synced with its approval status. |
| `WhatsAppInboundMessage` | `whats_app_inbound_messages` | Yes | 17 | Message received from a parent on the institute's WhatsApp number (opens the 24-hour reply window). |
| `EmailSenderIdentity` | `email_sender_identities` | Yes | 17 | "From" address of a tenant verified in Amazon SES (domain with DKIM). |
| `EmailSuppression` | `email_suppressions` | Yes | 12 | Email address that must not be mailed again (hard bounce, spam complaint, unsubscribe). |
| `SmsSenderId` | `sms_sender_ids` | Yes | 13 | SMS header (sender id) with the TRAI DLT registration needed in India; Twilio numbers for other countries. |
| `SmsDltTemplate` | `sms_dlt_templates` | Yes | 15 | DLT content template registered on the TRAI DLT portal under one header: exact text, category, language and approval. |
| `MessageCreditWallet` | `message_credit_wallets` | Yes | 14 | Prepaid balance of a tenant for one paid channel (WhatsApp or SMS). available = balance - reserved. SQL migration adds: CHECK (balance >= 0 AND reserved >= 0) so concurrent campaigns cannot overdraw the wallet. |
| `CreditTransaction` | `credit_transactions` | Yes | 15 | Ledger row of a credit wallet. Append-only: no updatedAt / deletedAt. Duplicates are impossible by design: one CONSUME and one REFUND per MessageLog, one PURCHASE per AddOnPurchase (a BullMQ retry or a replayed payment w |
| `DeviceToken` | `device_tokens` | Yes | 13 | Push notification token (FCM / APNs) of a user's device. |

## 11-operations.prisma — 27 models, 22 enums

Modules served: LIB, INV, TRN, HST

| Model | Table | Tenant scoped | Fields | Purpose |
|---|---|---|---|---|
| `LibraryCategory` | `library_categories` | Yes | 9 | Library catalogue category (may be nested): Fiction > Hindi Fiction. |
| `Book` | `books` | Yes | 23 | A title in the library catalogue; physical copies are BookCopy rows. |
| `BookCopy` | `book_copies` | Yes | 17 | One physical copy of a book with its accession number and barcode. |
| `BookIssue` | `book_issues` | Yes | 26 | Loan of a book copy to a student or staff member, with renewals and overdue fine. One open loan per copy is enforced by a partial unique index in the SQL migration: uq_book_issue_open (organization_id, book_copy_id) WHER |
| `BookReservation` | `book_reservations` | Yes | 15 | Hold placed on a title by a member (Student Portal / librarian); served in queue order by reservedAt. |
| `InventoryCategory` | `inventory_categories` | Yes | 9 | Group of inventory items: Stationery, IT Equipment, Furniture, Sports. |
| `InventoryItem` | `inventory_items` | Yes | 20 | Stock-keeping item of one campus store with current stock and reorder level. |
| `Vendor` | `vendors` | Yes | 24 | Supplier of goods and services (inventory, books, vehicle maintenance). |
| `PurchaseOrder` | `purchase_orders` | Yes | 23 | Order placed with a vendor; receiving goods creates StockTransaction IN rows. |
| `PurchaseOrderItem` | `purchase_order_items` | Yes | 14 | One line of a purchase order. |
| `StockTransaction` | `stock_transactions` | Yes | 21 | Stock ledger row of an item. Append-only: no updatedAt / deletedAt; corrections are new ADJUST rows. |
| `AssetAssignment` | `asset_assignments` | Yes | 20 | A returnable asset (laptop, projector, lab kit) handed to a staff member, student or room. |
| `Vehicle` | `vehicles` | Yes | 25 | School bus / van with compliance expiry dates and GPS device. |
| `DriverProfile` | `driver_profiles` | Yes | 13 | Driving licence and verification details of a staff member who drives (driver = Staff + this profile). |
| `TransportRoute` | `transport_routes` | Yes | 14 | Bus route of a campus with its usual vehicle. |
| `RouteStop` | `route_stops` | Yes | 16 | Stop on a route with its order, timings and monthly transport fee. |
| `TransportAssignment` | `transport_assignments` | Yes | 22 | A student's use of a route and stop(s) for an academic year. The invoice worker bills monthlyFee under feeHeadId per billingFrequency, writes FeeInvoiceItem.transportAssignmentId + period, and advances billedUpTo (no dou |
| `VehicleTrip` | `vehicle_trips` | Yes | 19 | Daily trip log of a vehicle on a route (morning pickup, afternoon drop). |
| `TransportAttendance` | `transport_attendance` | Yes | 13 | Boarding / drop record of one student on one trip: parent alert ("Aarav boarded the bus at 7:12") and safety register. |
| `VehicleMaintenance` | `vehicle_maintenances` | Yes | 18 | Service, repair or compliance renewal of a vehicle with cost and next due date. |
| `Hostel` | `hostels` | Yes | 14 | Hostel building of a campus with its warden. |
| `HostelRoom` | `hostel_rooms` | Yes | 13 | Room of a hostel with floor, type, bed capacity and monthly rent per bed. |
| `HostelBed` | `hostel_beds` | Yes | 9 | One bed in a hostel room; the unit that is allocated to a student. |
| `HostelAllocation` | `hostel_allocations` | Yes | 23 | A student's stay in a hostel bed from a date to a date. One ACTIVE allocation per bed (service-layer rule + partial unique index). The invoice worker bills monthlyRent under feeHeadId per billingFrequency, writes FeeInvo |
| `HostelAttendance` | `hostel_attendance` | Yes | 14 | Night roll call of one hostel resident on one date. |
| `HostelVisitorLog` | `hostel_visitor_logs` | Yes | 18 | Visitor entry at the hostel gate: who met which resident, when they came and left. |
| `HostelLeaveRequest` | `hostel_leave_requests` | Yes | 20 | Out-pass / leave of a hostel resident: parent request, warden approval, escort and gate timestamps. |

## 12-payroll.prisma — 11 models, 12 enums

Modules served: PRL

| Model | Table | Tenant scoped | Fields | Purpose |
|---|---|---|---|---|
| `SalaryComponent` | `salary_components` | Yes | 20 | Pay head: Basic, HRA, Conveyance, PF, Professional Tax, TDS ... |
| `SalaryStructure` | `salary_structures` | Yes | 11 | Reusable salary template, e.g. "Teaching staff - Grade A". |
| `SalaryStructureItem` | `salary_structure_items` | Yes | 11 | A component inside a salary structure with its rule for this structure. |
| `StaffSalary` | `staff_salaries` | Yes | 25 | Salary of a staff member for a date range (a new row for every revision). |
| `PayrollRun` | `payroll_runs` | Yes | 26 | Monthly payroll of a campus. LOCKED runs can never be changed; off-cycle runs (full-and-final, bonus, arrears) get their own row. |
| `Payslip` | `payslips` | Yes | 42 | Salary slip of one staff member in one payroll run. A staff member transferred mid-month must not get two regular payslips: partial unique index in the SQL migration, uq_payslip_staff_month (organization_id, staff_id, ye |
| `PayslipItem` | `payslip_items` | Yes | 13 | One earning or deduction line of a payslip (values are frozen at processing time). |
| `StaffLoanAdvance` | `staff_loan_advances` | Yes | 25 | Loan or salary advance given to a staff member and recovered through payslip deductions. |
| `PayrollAdjustment` | `payroll_adjustments` | Yes | 21 | One-off earning or deduction for a staff member in a payroll month (bonus, arrears, fine). |
| `PayrollStatutorySetting` | `payroll_statutory_settings` | Yes | 17 | Employer statutory registrations per organization or campus: PF establishment, ESI, TAN, PT, LWF (India) and ids for other countries. |
| `StaffTaxDeclaration` | `staff_tax_declarations` | Yes | 15 | A staff member's annual investment / HRA declaration and previous-employer income; drives monthly TDS and Form 12BB. |

## 13-certificates-analytics-ai.prisma — 11 models, 9 enums

Modules served: CRT, ANL, AI, DASH

| Model | Table | Tenant scoped | Fields | Purpose |
|---|---|---|---|---|
| `CertificateTemplate` | `certificate_templates` | Yes | 16 | Certificate design: body text with merge variables, layout and signatories. |
| `IssuedCertificate` | `issued_certificates` | Yes | 21 | Certificate issued to a student. The data snapshot and PDF never change; a wrong certificate is revoked and re-issued. |
| `CertificateRequest` | `certificate_requests` | Yes | 18 | Request for a certificate raised by a parent or student in the portal (or by staff), with approval. |
| `SavedReport` | `saved_reports` | Yes | 13 | Report built in the report builder and saved for reuse; may be shared and scheduled. |
| `ReportSchedule` | `report_schedules` | Yes | 16 | Automatic delivery of a saved report by email (daily, weekly, monthly). |
| `DailyMetricSnapshot` | `daily_metric_snapshots` | Yes | 25 | Pre-computed daily numbers per organization and campus; dashboards read this table instead of scanning raw data. |
| `DashboardPreference` | `dashboard_preferences` | Yes | 9 | A user's dashboard layout: widget order, hidden widgets and default filters. |
| `AiInsight` | `ai_insights` | Yes | 25 | Finding produced by the AI engine with a plain-language explanation and a suggested action. |
| `StudentRiskScore` | `student_risk_scores` | Yes | 16 | Risk scores of a student (0-100) with the contributing factors; history is kept, isLatest marks the current row. |
| `AiQueryLog` | `ai_query_logs` | Yes | 19 | One natural-language question asked to the AI assistant. Append-only: no updatedAt / deletedAt. |
| `AiUsageQuota` | `ai_usage_quotas` | Yes | 15 | AI allowance of an organization for one calendar month (queries and tokens) with usage counters. |

## All enums

| Enum | File | Values |
|---|---|---|
| `OrganizationType` | 00-base.prisma | SCHOOL, COACHING, COLLEGE, TRAINING_CENTRE |
| `RecordStatus` | 00-base.prisma | ACTIVE, INACTIVE, ARCHIVED |
| `Gender` | 00-base.prisma | MALE, FEMALE, OTHER, UNDISCLOSED |
| `BloodGroup` | 00-base.prisma | A_POS, A_NEG, B_POS, B_NEG, AB_POS, AB_NEG, O_POS, O_NEG, UNKNOWN |
| `Channel` | 00-base.prisma | IN_APP, WHATSAPP, SMS, EMAIL, PUSH |
| `WeekDay` | 00-base.prisma | MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY |
| `ApprovalStatus` | 00-base.prisma | PENDING, APPROVED, REJECTED, CANCELLED |
| `JobStatus` | 00-base.prisma | QUEUED, PROCESSING, COMPLETED, COMPLETED_WITH_ERRORS, FAILED, CANCELLED |
| `ModuleCode` | 00-base.prisma | DASH, ORG, CAMP, ADM, STU, TCH, STF, ATT, LEV, BAT, TT, SUB, HW, EXM, RPT, FEE, PAY, DSC, SCH, PP, SP, NTF, WA, EML, SMS, LIB, INV, TRN, HST, PRL, CRT, ANL, AI, SET |
| `PaymentGateway` | 00-base.prisma | RAZORPAY, STRIPE, OFFLINE |
| `BillingCycle` | 00-base.prisma | MONTHLY, YEARLY |
| `DevicePlatform` | 00-base.prisma | WEB, ANDROID, IOS, API |
| `Audience` | 00-base.prisma | ALL, STAFF, STUDENTS, PARENTS, STUDENTS_AND_PARENTS |
| `Shift` | 00-base.prisma | MORNING, AFTERNOON, EVENING, FULL_DAY, WEEKEND |
| `HalfDaySession` | 00-base.prisma | FIRST_HALF, SECOND_HALF |
| `FileFormat` | 00-base.prisma | XLSX, CSV, PDF, JSON, ZIP |
| `OrganizationStatus` | 01-platform.prisma | TRIAL, ACTIVE, PAST_DUE, SUSPENDED, CANCELLED |
| `SubscriptionStatus` | 01-platform.prisma | TRIALING, ACTIVE, PAST_DUE, PAUSED, CANCELLED, EXPIRED |
| `SubscriptionInvoiceStatus` | 01-platform.prisma | DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE, REFUNDED |
| `AddOnType` | 01-platform.prisma | EXTRA_CAMPUS, AI_INSIGHTS, WHITE_LABEL_APP, WHATSAPP_CREDITS, SMS_CREDITS, DATA_MIGRATION, ONSITE_TRAINING |
| `AddOnStatus` | 01-platform.prisma | PENDING, ACTIVE, CONSUMED, EXPIRED, CANCELLED |
| `NumberSequenceType` | 01-platform.prisma | ADMISSION_NO, APPLICATION_NO, INQUIRY_NO, ROLL_NO, EMPLOYEE_CODE, FEE_INVOICE_NO, RECEIPT_NO, REFUND_NO, CERTIFICATE_NO, PAYSLIP_NO, PURCHASE_ORDER_NO, LIBRARY_ACCESSION_NO, CREDIT_NOTE_NO, DSR_REQUEST_NO, OTHER |
| `SequenceResetPolicy` | 01-platform.prisma | NEVER, CALENDAR_YEAR, ACADEMIC_YEAR, FINANCIAL_YEAR, MONTHLY |
| `CustomFieldEntity` | 01-platform.prisma | STUDENT, GUARDIAN, STAFF, ADMISSION_INQUIRY, ADMISSION_APPLICATION, COURSE, BATCH |
| `CustomFieldType` | 01-platform.prisma | TEXT, TEXTAREA, NUMBER, DATE, BOOLEAN, SELECT, MULTI_SELECT, PHONE, EMAIL, URL, FILE |
| `FileVisibility` | 01-platform.prisma | PRIVATE, ORGANIZATION, PUBLIC |
| `FileStatus` | 01-platform.prisma | PENDING_UPLOAD, ACTIVE, QUARANTINED, DELETED |
| `ImportType` | 01-platform.prisma | STUDENTS, GUARDIANS, STAFF, ENROLLMENTS, INQUIRIES, ATTENDANCE, FEE_DUES, FEE_PAYMENTS, EXAM_MARKS, LIBRARY_BOOKS, INVENTORY_ITEMS, OTHER |
| `UserType` | 02-auth.prisma | STAFF, PARENT, STUDENT, PLATFORM |
| `UserStatus` | 02-auth.prisma | INVITED, ACTIVE, SUSPENDED, LOCKED, DEACTIVATED |
| `MfaMethod` | 02-auth.prisma | TOTP, SMS, EMAIL |
| `PermissionScope` | 02-auth.prisma | ALL, CAMPUS, OWN, VIEW |
| `TokenRevokeReason` | 02-auth.prisma | LOGOUT, ROTATED, REUSE_DETECTED, PASSWORD_CHANGED, ADMIN_REVOKED, USER_DEACTIVATED |
| `OtpPurpose` | 02-auth.prisma | LOGIN, VERIFY_PHONE, VERIFY_EMAIL, PASSWORD_RESET, MFA, CONSENT_VERIFICATION |
| `InvitationStatus` | 02-auth.prisma | PENDING, ACCEPTED, EXPIRED, REVOKED |
| `LoginMethod` | 02-auth.prisma | PASSWORD, OTP, SSO, API_KEY |
| `LoginResult` | 02-auth.prisma | SUCCESS, FAILED, LOCKED, MFA_REQUIRED, MFA_FAILED |
| `AuditActorType` | 02-auth.prisma | USER, SYSTEM, API_KEY, IMPERSONATION |
| `ConsentType` | 02-auth.prisma | TERMS_OF_SERVICE, PRIVACY_POLICY, DATA_PROCESSING, CHILD_DATA_PROCESSING, COMMUNICATION_WHATSAPP, COMMUNICATION_SMS, COMMUNICATION_EMAIL, PHOTO_MEDIA, THIRD_PARTY_SHARING |
| `ConsentStatus` | 02-auth.prisma | GRANTED, WITHDRAWN, EXPIRED |
| `ConsentVerificationMethod` | 02-auth.prisma | OTP, EMAIL_LINK, SIGNED_FORM, IN_PERSON, DIGILOCKER |
| `DataSubjectRequestType` | 02-auth.prisma | ACCESS, EXPORT, CORRECTION, DELETION, RESTRICT_PROCESSING, WITHDRAW_CONSENT, OBJECTION, NOMINATION, GRIEVANCE |
| `AuditOutcome` | 02-auth.prisma | SUCCESS, DENIED, FAILED |
| `BreachSeverity` | 02-auth.prisma | LOW, MEDIUM, HIGH, CRITICAL |
| `BreachStatus` | 02-auth.prisma | DETECTED, INVESTIGATING, CONTAINED, NOTIFIED, CLOSED |
| `DataSubjectRequestStatus` | 02-auth.prisma | RECEIVED, IDENTITY_VERIFICATION, IN_PROGRESS, COMPLETED, REJECTED, CANCELLED |
| `DataSubjectType` | 02-auth.prisma | USER, STUDENT, GUARDIAN, STAFF |
| `AcademicYearStatus` | 03-academics.prisma | PLANNED, ACTIVE, CLOSED |
| `BatchStatus` | 03-academics.prisma | PLANNED, ACTIVE, COMPLETED, CANCELLED |
| `SubjectType` | 03-academics.prisma | THEORY, PRACTICAL, LANGUAGE, CO_CURRICULAR, TEST_SERIES |
| `RoomType` | 03-academics.prisma | CLASSROOM, LAB, LIBRARY, HALL, OFFICE, STAFF_ROOM, OTHER |
| `HolidayType` | 03-academics.prisma | PUBLIC, FESTIVAL, VACATION, WEEKLY_OFF, EMERGENCY, OTHER |
| `CalendarEventType` | 03-academics.prisma | ACADEMIC, EXAM, PTM, CULTURAL, SPORTS, MEETING, ADMISSION, OTHER |
| `PtmBookingStatus` | 03-academics.prisma | BOOKED, ATTENDED, NO_SHOW, CANCELLED |
| `StaffType` | 04-people.prisma | TEACHING, NON_TEACHING |
| `EmploymentType` | 04-people.prisma | FULL_TIME, PART_TIME, CONTRACT, VISITING, INTERN |
| `StaffStatus` | 04-people.prisma | ACTIVE, ON_LEAVE, SUSPENDED, RESIGNED, TERMINATED, RETIRED |
| `StaffDocumentType` | 04-people.prisma | ID_PROOF, ADDRESS_PROOF, QUALIFICATION, EXPERIENCE_LETTER, APPOINTMENT_LETTER, CONTRACT, POLICE_VERIFICATION, BANK_PROOF, PHOTO, OTHER |
| `StudentStatus` | 04-people.prisma | ACTIVE, INACTIVE, SUSPENDED, GRADUATED, TRANSFERRED, DROPPED_OUT, EXPELLED |
| `StudentCategory` | 04-people.prisma | GENERAL, OBC, SC, ST, EWS, OTHER |
| `GuardianRelation` | 04-people.prisma | FATHER, MOTHER, GRANDFATHER, GRANDMOTHER, BROTHER, SISTER, UNCLE, AUNT, LEGAL_GUARDIAN, OTHER |
| `EnrollmentStatus` | 04-people.prisma | ACTIVE, PROMOTED, COMPLETED, DETAINED, TRANSFERRED, WITHDRAWN, CANCELLED |
| `StudentDocumentType` | 04-people.prisma | BIRTH_CERTIFICATE, TRANSFER_CERTIFICATE, MARKSHEET, ID_PROOF, ADDRESS_PROOF, PHOTO, CATEGORY_CERTIFICATE, INCOME_CERTIFICATE, MEDICAL, OTHER |
| `StudentNoteType` | 04-people.prisma | GENERAL, ACADEMIC, BEHAVIOUR, MEDICAL, COUNSELLING, FEE, ACHIEVEMENT |
| `LeadSource` | 04-people.prisma | WALK_IN, WEBSITE, PHONE_CALL, WHATSAPP, REFERRAL, SOCIAL_MEDIA, GOOGLE_ADS, NEWSPAPER, EVENT, PARTNER, OTHER |
| `InquiryStage` | 04-people.prisma | NEW, CONTACTED, FOLLOW_UP, VISIT_SCHEDULED, VISITED, DEMO_SCHEDULED, DEMO_ATTENDED, APPLICATION_STARTED, CONVERTED, LOST, JUNK |
| `LeadPriority` | 04-people.prisma | HOT, WARM, COLD |
| `FollowUpType` | 04-people.prisma | CALL, WHATSAPP, SMS, EMAIL, VISIT, MEETING, DEMO_CLASS, NOTE |
| `FollowUpOutcome` | 04-people.prisma | INTERESTED, NOT_INTERESTED, NO_RESPONSE, CALL_BACK_LATER, VISIT_BOOKED, DEMO_BOOKED, APPLICATION_SHARED, CONVERTED |
| `ApplicationStatus` | 04-people.prisma | DRAFT, SUBMITTED, UNDER_REVIEW, DOCUMENTS_PENDING, TEST_SCHEDULED, INTERVIEW_SCHEDULED, APPROVED, WAITLISTED, REJECTED, WITHDRAWN, ENROLLED |
| `ApplicationChannel` | 04-people.prisma | ONLINE_FORM, FRONT_DESK, IMPORT |
| `ApplicationFeeStatus` | 04-people.prisma | NOT_REQUIRED, PENDING, PAID, WAIVED, REFUNDED |
| `AdmissionType` | 04-people.prisma | NEW, RE_ADMISSION, TRANSFER_IN, INTERNAL_PROGRESSION |
| `AdmissionQuota` | 04-people.prisma | GENERAL, RTE, MANAGEMENT, STAFF_WARD, SPORTS, NRI, OTHER |
| `StudentTransferType` | 04-people.prisma | BATCH_CHANGE, CAMPUS_TRANSFER, COURSE_CHANGE |
| `StaffChangeType` | 04-people.prisma | STATUS, CAMPUS_TRANSFER, DESIGNATION, DEPARTMENT, EMPLOYMENT_TYPE |
| `AttendanceStatus` | 05-attendance-leave.prisma | PRESENT, ABSENT, LATE, HALF_DAY, LEAVE, HOLIDAY |
| `StaffAttendanceStatus` | 05-attendance-leave.prisma | PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE, HOLIDAY, WEEK_OFF |
| `AttendanceSource` | 05-attendance-leave.prisma | MANUAL, BIOMETRIC, GEO, RFID, QR_CODE, FACE, PARENT_APP |
| `LeaveAccrual` | 05-attendance-leave.prisma | YEARLY_UPFRONT, MONTHLY, QUARTERLY, NONE |
| `StudentLeaveCategory` | 05-attendance-leave.prisma | SICK, FAMILY, TRAVEL, EXAM_OR_EVENT, OTHER |
| `PeriodSlotType` | 06-timetable-homework.prisma | PERIOD, BREAK, LUNCH, ASSEMBLY, ACTIVITY |
| `SubstitutionStatus` | 06-timetable-homework.prisma | ASSIGNED, COMPLETED, CANCELLED |
| `HomeworkStatus` | 06-timetable-homework.prisma | DRAFT, PUBLISHED, CLOSED, CANCELLED |
| `HomeworkSubmissionMode` | 06-timetable-homework.prisma | ONLINE, OFFLINE, NOT_REQUIRED |
| `HomeworkSubmissionStatus` | 06-timetable-homework.prisma | PENDING, SUBMITTED, LATE, RESUBMIT_REQUESTED, GRADED, MISSING, EXCUSED |
| `ClassSessionType` | 06-timetable-homework.prisma | REGULAR, EXTRA, DOUBT_CLEARING, REVISION, TEST_DISCUSSION, ONLINE |
| `ClassSessionStatus` | 06-timetable-homework.prisma | SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED |
| `StudyMaterialType` | 06-timetable-homework.prisma | NOTES, WORKSHEET, VIDEO_LINK, QUESTION_PAPER, SOLUTION, SYLLABUS, OTHER |
| `GradeScaleType` | 07-exams.prisma | PERCENTAGE_BANDS, GRADE_POINT, PASS_FAIL |
| `ExamType` | 07-exams.prisma | UNIT_TEST, MID_TERM, FINAL, MOCK, WEEKLY_TEST, PRE_BOARD, PRACTICAL, SUPPLEMENTARY, RETEST, ENTRANCE |
| `ReEvaluationStatus` | 07-exams.prisma | REQUESTED, FEE_PENDING, UNDER_REVIEW, NO_CHANGE, MARKS_REVISED, REJECTED |
| `ExamStatus` | 07-exams.prisma | DRAFT, SCHEDULED, ONGOING, MARKS_ENTRY, PUBLISHED, CANCELLED |
| `MarksEntryStatus` | 07-exams.prisma | PENDING, IN_PROGRESS, SUBMITTED, VERIFIED, LOCKED |
| `ReportCardBoardStyle` | 07-exams.prisma | CBSE, ICSE, STATE, COACHING, GPA |
| `ReportCardScope` | 07-exams.prisma | EXAM, TERM, ANNUAL |
| `ReportCardStatus` | 07-exams.prisma | DRAFT, GENERATED, PUBLISHED, WITHHELD |
| `ReportCardResult` | 07-exams.prisma | PASS, FAIL, COMPARTMENT, PROMOTED, DETAINED, ABSENT, NOT_APPLICABLE |
| `ReportCardRemarkType` | 07-exams.prisma | CLASS_TEACHER, PRINCIPAL, SUBJECT_TEACHER, CO_SCHOLASTIC |
| `FeeHeadType` | 08-fees.prisma | TUITION, ADMISSION, REGISTRATION, TRANSPORT, HOSTEL, EXAM, LIBRARY, LAB, ACTIVITY, UNIFORM, BOOKS, CAUTION_DEPOSIT, FINE, ARREARS, MESS, CHEQUE_BOUNCE_CHARGE, CERTIFICATE, MISCELLANEOUS |
| `TaxTreatment` | 08-fees.prisma | TAXABLE, EXEMPT, NIL_RATED, ZERO_RATED, OUT_OF_SCOPE |
| `TaxType` | 08-fees.prisma | GST, VAT, SALES_TAX, NONE |
| `FeeApplicability` | 08-fees.prisma | ALL_STUDENTS, NEW_ADMISSIONS_ONLY, EXISTING_STUDENTS_ONLY |
| `FeeAdjustmentType` | 08-fees.prisma | CONCESSION, WAIVER, LATE_FEE_WAIVER, DEBIT_CORRECTION, CREDIT_CORRECTION, PARTIAL_WRITE_OFF |
| `FeeFrequency` | 08-fees.prisma | ONE_TIME, MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY |
| `FeeAssignmentStatus` | 08-fees.prisma | ACTIVE, PAUSED, ENDED, CANCELLED |
| `FeeInvoiceStatus` | 08-fees.prisma | DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED, WRITTEN_OFF, CARRIED_FORWARD |
| `LateFeeCalculation` | 08-fees.prisma | FIXED_ONCE, FIXED_PER_DAY, FIXED_PER_MONTH, PERCENT_OF_BALANCE, PERCENT_PER_MONTH |
| `DiscountType` | 08-fees.prisma | PERCENT, FIXED |
| `DiscountCategory` | 08-fees.prisma | SIBLING, EARLY_BIRD, STAFF_CHILD, MERIT, FULL_PAYMENT, REFERRAL, FINANCIAL_AID, PROMOTIONAL, CUSTOM |
| `DiscountScope` | 08-fees.prisma | INVOICE_TOTAL, FEE_HEADS |
| `ScholarshipFundingSource` | 08-fees.prisma | INSTITUTE, GOVERNMENT, TRUST, DONOR, CORPORATE_CSR |
| `ScholarshipStatus` | 08-fees.prisma | DRAFT, OPEN, CLOSED, ARCHIVED |
| `ScholarshipApplicationStatus` | 08-fees.prisma | DRAFT, SUBMITTED, UNDER_REVIEW, SHORTLISTED, APPROVED, AWARDED, REJECTED, WITHDRAWN |
| `ScholarshipAwardStatus` | 08-fees.prisma | ACTIVE, FULLY_DISBURSED, SUSPENDED, REVOKED, EXPIRED |
| `FeeReminderType` | 08-fees.prisma | UPCOMING_DUE, DUE_TODAY, OVERDUE, FINAL_NOTICE, MANUAL |
| `GatewayMode` | 09-payments.prisma | TEST, LIVE |
| `PaymentOrderStatus` | 09-payments.prisma | CREATED, ATTEMPTED, PAID, FAILED, EXPIRED, CANCELLED |
| `PaymentMethod` | 09-payments.prisma | CASH, UPI, CARD, NETBANKING, CHEQUE, DEMAND_DRAFT, BANK_TRANSFER, WALLET, ONLINE_GATEWAY |
| `PaymentStatus` | 09-payments.prisma | PENDING, SUCCESS, FAILED, CANCELLED, BOUNCED, PARTIALLY_REFUNDED, REFUNDED, DISPUTED, CHARGED_BACK |
| `PaymentPurpose` | 09-payments.prisma | FEE, APPLICATION_FEE, LIBRARY_FINE, CERTIFICATE_FEE, DEPOSIT, OTHER |
| `RefundType` | 09-payments.prisma | PAYMENT_REVERSAL, EXCESS_PAYMENT, WITHDRAWAL, CAUTION_DEPOSIT, APPLICATION_FEE, OTHER |
| `ChequeStatus` | 09-payments.prisma | RECEIVED, DEPOSITED, CLEARED, BOUNCED, RETURNED |
| `ReceiptStatus` | 09-payments.prisma | ISSUED, CANCELLED |
| `RefundStatus` | 09-payments.prisma | REQUESTED, APPROVED, REJECTED, PROCESSING, PROCESSED, FAILED |
| `WebhookProvider` | 09-payments.prisma | RAZORPAY, STRIPE, WHATSAPP, MSG91, TWILIO, SES |
| `WebhookEventStatus` | 09-payments.prisma | RECEIVED, PROCESSING, PROCESSED, FAILED, IGNORED |
| `SettlementStatus` | 09-payments.prisma | PENDING, PROCESSED, RECONCILED, MISMATCH, FAILED |
| `DayCloseStatus` | 09-payments.prisma | OPEN, SUBMITTED, VERIFIED, DISCREPANCY |
| `NotificationCategory` | 10-communication.prisma | ATTENDANCE, FEES, EXAMS, HOMEWORK, ANNOUNCEMENTS, ADMISSIONS, LEAVE, TIMETABLE, TRANSPORT, LIBRARY, HOSTEL, PAYROLL, ACCOUNT, SYSTEM |
| `TemplateApprovalStatus` | 10-communication.prisma | DRAFT, PENDING, APPROVED, REJECTED, PAUSED, DISABLED, NOT_REQUIRED |
| `AnnouncementStatus` | 10-communication.prisma | DRAFT, SCHEDULED, SENDING, SENT, CANCELLED, FAILED |
| `MessageStatus` | 10-communication.prisma | QUEUED, SENT, DELIVERED, READ, FAILED |
| `MessageProvider` | 10-communication.prisma | META_WHATSAPP, MSG91, TWILIO, AMAZON_SES, FCM, INTERNAL |
| `MessageRecipientType` | 10-communication.prisma | USER, GUARDIAN, STUDENT, STAFF, LEAD, OTHER |
| `WhatsAppTemplateCategory` | 10-communication.prisma | UTILITY, MARKETING, AUTHENTICATION |
| `WhatsAppQualityRating` | 10-communication.prisma | GREEN, YELLOW, RED, UNKNOWN |
| `WhatsAppMessageType` | 10-communication.prisma | TEXT, IMAGE, DOCUMENT, AUDIO, VIDEO, LOCATION, BUTTON_REPLY, INTERACTIVE, OTHER |
| `SenderVerificationStatus` | 10-communication.prisma | PENDING, VERIFIED, FAILED |
| `EmailSuppressionReason` | 10-communication.prisma | HARD_BOUNCE, SOFT_BOUNCE_LIMIT, COMPLAINT, UNSUBSCRIBED, MANUAL |
| `CreditUnit` | 10-communication.prisma | MESSAGES, MONEY |
| `CreditTransactionType` | 10-communication.prisma | PURCHASE, CONSUME, REFUND, ADJUSTMENT, EXPIRY, BONUS, RESERVE, RELEASE |
| `DltTemplateCategory` | 10-communication.prisma | TRANSACTIONAL, SERVICE_IMPLICIT, SERVICE_EXPLICIT, PROMOTIONAL |
| `BookCopyStatus` | 11-operations.prisma | AVAILABLE, ISSUED, RESERVED, LOST, DAMAGED, UNDER_REPAIR, WITHDRAWN |
| `BookIssueStatus` | 11-operations.prisma | ISSUED, RETURNED, OVERDUE, LOST |
| `LibraryMemberType` | 11-operations.prisma | STUDENT, STAFF |
| `InventoryItemType` | 11-operations.prisma | CONSUMABLE, ASSET |
| `PurchaseOrderStatus` | 11-operations.prisma | DRAFT, PENDING_APPROVAL, APPROVED, ORDERED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED |
| `StockTransactionType` | 11-operations.prisma | IN, OUT, ADJUST, ISSUE_TO_STAFF, ISSUE_TO_STUDENT, RETURN, SALE, TRANSFER_OUT, TRANSFER_IN, WRITE_OFF |
| `BookReservationStatus` | 11-operations.prisma | WAITING, READY_FOR_PICKUP, FULFILLED, EXPIRED, CANCELLED |
| `TransportBoardingStatus` | 11-operations.prisma | BOARDED, NOT_BOARDED, DROPPED, ABSENT |
| `HostelLeaveType` | 11-operations.prisma | HOME_VISIT, DAY_OUT, MEDICAL, EMERGENCY |
| `AssetAssignmentStatus` | 11-operations.prisma | ASSIGNED, RETURNED, LOST, DAMAGED |
| `VehicleType` | 11-operations.prisma | BUS, MINI_BUS, VAN, CAR, AUTO, OTHER |
| `VehicleStatus` | 11-operations.prisma | ACTIVE, UNDER_MAINTENANCE, RETIRED |
| `TransportServiceType` | 11-operations.prisma | BOTH, PICKUP_ONLY, DROP_ONLY |
| `TransportAssignmentStatus` | 11-operations.prisma | ACTIVE, SUSPENDED, ENDED |
| `TripType` | 11-operations.prisma | PICKUP, DROP, SPECIAL |
| `TripStatus` | 11-operations.prisma | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| `MaintenanceType` | 11-operations.prisma | SERVICE, REPAIR, TYRE, INSURANCE_RENEWAL, FITNESS_RENEWAL, PUC_RENEWAL, ACCIDENT, OTHER |
| `HostelType` | 11-operations.prisma | BOYS, GIRLS, MIXED |
| `HostelRoomType` | 11-operations.prisma | SINGLE, DOUBLE, TRIPLE, DORMITORY |
| `HostelBedStatus` | 11-operations.prisma | AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE |
| `HostelAllocationStatus` | 11-operations.prisma | RESERVED, ACTIVE, VACATED, CANCELLED |
| `HostelAttendanceStatus` | 11-operations.prisma | PRESENT, ABSENT, ON_LEAVE, LATE_ENTRY |
| `SalaryComponentType` | 12-payroll.prisma | EARNING, DEDUCTION, EMPLOYER_CONTRIBUTION |
| `SalaryCalculationType` | 12-payroll.prisma | FIXED, PERCENT_OF_BASIC, PERCENT_OF_GROSS, FORMULA |
| `StatutoryType` | 12-payroll.prisma | NONE, PF, ESI, PT, TDS, LWF, SUPERANNUATION, PAYG_WITHHOLDING, FEDERAL_INCOME_TAX, STATE_INCOME_TAX, SOCIAL_SECURITY, MEDICARE, GRATUITY, PENSION_GPSSA, OTHER_STATUTORY |
| `PayBasis` | 12-payroll.prisma | MONTHLY, PER_LECTURE, PER_HOUR, PER_DAY |
| `TaxRegime` | 12-payroll.prisma | OLD, NEW, NOT_APPLICABLE |
| `PayrollRunType` | 12-payroll.prisma | REGULAR, OFF_CYCLE, FULL_AND_FINAL, BONUS, ARREARS |
| `PayrollRunStatus` | 12-payroll.prisma | DRAFT, PROCESSED, APPROVED, PAID, LOCKED |
| `PayslipStatus` | 12-payroll.prisma | DRAFT, FINALIZED, PAID, ON_HOLD, CANCELLED |
| `SalaryPaymentMode` | 12-payroll.prisma | BANK_TRANSFER, CASH, CHEQUE, UPI |
| `LoanAdvanceType` | 12-payroll.prisma | LOAN, SALARY_ADVANCE |
| `LoanAdvanceStatus` | 12-payroll.prisma | PENDING, APPROVED, REJECTED, ACTIVE, CLOSED, CANCELLED |
| `PayrollAdjustmentType` | 12-payroll.prisma | BONUS, INCENTIVE, ARREARS, REIMBURSEMENT, OVERTIME, SUBSTITUTION_PAY, LEAVE_ENCASHMENT, OTHER_EARNING, FINE, RECOVERY, OTHER_DEDUCTION |
| `CertificateType` | 13-certificates-analytics-ai.prisma | BONAFIDE, TRANSFER, CHARACTER, COURSE_COMPLETION, MERIT, FEE, CUSTOM |
| `CertificateRequestStatus` | 13-certificates-analytics-ai.prisma | PENDING, APPROVED, REJECTED, ISSUED, CANCELLED |
| `ReportCategory` | 13-certificates-analytics-ai.prisma | STUDENTS, ADMISSIONS, ATTENDANCE, FEES, EXAMS, STAFF, PAYROLL, COMMUNICATION, OPERATIONS, CUSTOM |
| `ScheduleFrequency` | 13-certificates-analytics-ai.prisma | DAILY, WEEKLY, MONTHLY, QUARTERLY |
| `AiInsightType` | 13-certificates-analytics-ai.prisma | ATTENDANCE_DROP, DROPOUT_RISK, FEE_DEFAULT_RISK, ACADEMIC_DECLINE, ADMISSION_TREND, COLLECTION_FORECAST, STAFF_WORKLOAD, ANOMALY, OTHER |
| `AiInsightSeverity` | 13-certificates-analytics-ai.prisma | INFO, LOW, MEDIUM, HIGH, CRITICAL |
| `AiInsightStatus` | 13-certificates-analytics-ai.prisma | NEW, SEEN, ACTED, DISMISSED |
| `RiskLevel` | 13-certificates-analytics-ai.prisma | LOW, MEDIUM, HIGH, CRITICAL |
| `AiQueryStatus` | 13-certificates-analytics-ai.prisma | SUCCESS, FAILED, BLOCKED, QUOTA_EXCEEDED |
