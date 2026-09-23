# Full Prisma Schema

**In simple words:** This appendix is the complete database definition of EduFlow, exactly as the code will use it. It is split into one file per domain. It was checked with the real Prisma tool (`prisma validate`), so it is ready to copy into `server/prisma/schema/`.

The schema has **189 models** (database tables) and **186 enums** (fixed value lists) in 14 files. Every tenant table carries `organization_id`, every table has a UUID primary key, money uses `Decimal(12, 2)` with a currency code, and all names map to snake_case tables and columns.

> **Rule:** Module chapters show only the models they use. If a module chapter and this appendix ever disagree, this appendix wins.

> **Tip:** Copy the `.prisma` files from `docs/schema/` in the repository instead of retyping them from this PDF.

## Base: generator, datasource and shared enums

File `server/prisma/schema/00-base.prisma` — 0 models, 16 enums.

```prisma
// EduFlow — multi-file Prisma schema (Prisma ORM 6.x, PostgreSQL 16+)
// 00-base: generator, datasource and the enums shared by more than one domain.
// Domain-specific enums live in their own domain file.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Kind of institution; drives UI labels (Class/Section vs Program/Batch).
enum OrganizationType {
  SCHOOL
  COACHING
  COLLEGE
  TRAINING_CENTRE
}

// Generic lifecycle for master data (courses, subjects, rooms, leave types ...).
enum RecordStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}

enum Gender {
  MALE
  FEMALE
  OTHER
  UNDISCLOSED
}

enum BloodGroup {
  A_POS
  A_NEG
  B_POS
  B_NEG
  AB_POS
  AB_NEG
  O_POS
  O_NEG
  UNKNOWN
}

// Delivery channel for notifications, OTPs and parent communication.
enum Channel {
  IN_APP
  WHATSAPP
  SMS
  EMAIL
  PUSH
}

enum WeekDay {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

// Generic approval outcome (leave, student leave, discounts, refunds ...).
enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

// Lifecycle of a background job processed by BullMQ workers (imports, exports, PDFs).
enum JobStatus {
  QUEUED
  PROCESSING
  COMPLETED
  COMPLETED_WITH_ERRORS
  FAILED
  CANCELLED
}

// The 34 product modules (canon codes); used for plan gating and permissions.
enum ModuleCode {
  DASH
  ORG
  CAMP
  ADM
  STU
  TCH
  STF
  ATT
  LEV
  BAT
  TT
  SUB
  HW
  EXM
  RPT
  FEE
  PAY
  DSC
  SCH
  PP
  SP
  NTF
  WA
  EML
  SMS
  LIB
  INV
  TRN
  HST
  PRL
  CRT
  ANL
  AI
  SET
}

// Payment gateway used for SaaS billing and for online fee collection.
enum PaymentGateway {
  RAZORPAY
  STRIPE
  OFFLINE
}

enum BillingCycle {
  MONTHLY
  YEARLY
}

// Client platform of a session, device or push token.
enum DevicePlatform {
  WEB
  ANDROID
  IOS
  API
}

// Who a calendar item, holiday or announcement applies to.
enum Audience {
  ALL
  STAFF
  STUDENTS
  PARENTS
  STUDENTS_AND_PARENTS
}

// Part of the day a batch or period slot belongs to.
enum Shift {
  MORNING
  AFTERNOON
  EVENING
  FULL_DAY
  WEEKEND
}

// Which half of a day a half-day leave or attendance refers to.
enum HalfDaySession {
  FIRST_HALF
  SECOND_HALF
}

// Output format of generated files (exports, reports).
enum FileFormat {
  XLSX
  CSV
  PDF
  JSON
  ZIP
}
```

## Platform: plans, organizations, campuses, settings, files

File `server/prisma/schema/01-platform.prisma` — 19 models, 12 enums.

```prisma
// 01-platform: SaaS plans and billing, tenants (Organization, Campus), settings,
// numbering, custom fields, files, import/export jobs and platform reference data.

enum OrganizationStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  SUSPENDED
  CANCELLED
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  PAUSED
  CANCELLED
  EXPIRED
}

enum SubscriptionInvoiceStatus {
  DRAFT
  OPEN
  PAID
  VOID
  UNCOLLECTIBLE
  REFUNDED
}

enum AddOnType {
  EXTRA_CAMPUS
  AI_INSIGHTS
  WHITE_LABEL_APP
  WHATSAPP_CREDITS
  SMS_CREDITS
  DATA_MIGRATION
  ONSITE_TRAINING
}

enum AddOnStatus {
  PENDING
  ACTIVE
  CONSUMED
  EXPIRED
  CANCELLED
}

enum NumberSequenceType {
  ADMISSION_NO
  APPLICATION_NO
  INQUIRY_NO
  ROLL_NO
  EMPLOYEE_CODE
  FEE_INVOICE_NO
  RECEIPT_NO
  REFUND_NO
  CERTIFICATE_NO
  PAYSLIP_NO
  PURCHASE_ORDER_NO
  LIBRARY_ACCESSION_NO
  CREDIT_NOTE_NO
  DSR_REQUEST_NO
  OTHER
}

enum SequenceResetPolicy {
  NEVER
  CALENDAR_YEAR
  ACADEMIC_YEAR
  FINANCIAL_YEAR
  MONTHLY
}

enum CustomFieldEntity {
  STUDENT
  GUARDIAN
  STAFF
  ADMISSION_INQUIRY
  ADMISSION_APPLICATION
  COURSE
  BATCH
}

enum CustomFieldType {
  TEXT
  TEXTAREA
  NUMBER
  DATE
  BOOLEAN
  SELECT
  MULTI_SELECT
  PHONE
  EMAIL
  URL
  FILE
}

enum FileVisibility {
  PRIVATE // owner entity + permitted staff only
  ORGANIZATION // any signed-in user of the tenant
  PUBLIC // served through CloudFront (logos, public notices)
}

enum FileStatus {
  PENDING_UPLOAD // pre-signed URL issued, upload not confirmed yet
  ACTIVE
  QUARANTINED // failed virus scan
  DELETED
}

enum ImportType {
  STUDENTS
  GUARDIANS
  STAFF
  ENROLLMENTS
  INQUIRIES
  ATTENDANCE
  FEE_DUES
  FEE_PAYMENTS
  EXAM_MARKS
  LIBRARY_BOOKS
  INVENTORY_ITEMS
  OTHER
}

// Platform reference: ISO 3166 country with regional defaults. No tenant scope.
model Country {
  id                  String   @id @default(uuid()) @db.Uuid
  code                String   @unique @db.Char(2) // ISO 3166-1 alpha-2, e.g. IN
  iso3                String   @unique @db.Char(3)
  name                String   @db.VarChar(100)
  dialCode            String   @map("dial_code") @db.VarChar(8) // e.g. +91
  defaultCurrencyCode String   @map("default_currency_code") @db.Char(3)
  defaultTimezone     String   @map("default_timezone") @db.VarChar(64) // IANA, e.g. Asia/Kolkata
  defaultLocale       String   @map("default_locale") @db.VarChar(10) // e.g. en-IN
  taxName             String?  @map("tax_name") @db.VarChar(20) // GST, VAT, Sales Tax
  taxPercent          Decimal? @map("tax_percent") @db.Decimal(5, 2) // tax on the EduFlow subscription
  taxIdLabel          String?  @map("tax_id_label") @db.VarChar(20) // GSTIN, ABN, TRN, EIN
  isSupported         Boolean  @default(false) @map("is_supported") // open for signup
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  defaultCurrency Currency       @relation(fields: [defaultCurrencyCode], references: [code], onDelete: Restrict)
  organizations   Organization[]
  campuses        Campus[]

  @@map("countries")
}

// Platform reference: ISO 4217 currency. No tenant scope.
model Currency {
  id            String   @id @default(uuid()) @db.Uuid
  code          String   @unique @db.Char(3) // ISO 4217, e.g. INR
  name          String   @db.VarChar(60)
  symbol        String   @db.VarChar(8)
  decimalDigits Int      @default(2) @map("decimal_digits") @db.SmallInt
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  countries     Country[]
  organizations Organization[]
  planPrices    PlanPrice[]

  @@map("currencies")
}

// Platform reference: daily exchange rate used to convert provider costs (USD) and cross-currency reports. No tenant scope.
model ExchangeRate {
  id            String   @id @default(uuid()) @db.Uuid
  baseCurrency  String   @map("base_currency") @db.Char(3)
  quoteCurrency String   @map("quote_currency") @db.Char(3)
  rate          Decimal  @db.Decimal(18, 8) // 1 base = rate quote
  rateDate      DateTime @map("rate_date") @db.Date
  source        String   @db.VarChar(40) // e.g. ECB, RBI, MANUAL
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@unique([baseCurrency, quoteCurrency, rateDate])
  @@map("exchange_rates")
}

// SaaS plan catalogue (Starter, Growth, Pro, Enterprise). Platform-level.
model Plan {
  id             String       @id @default(uuid()) @db.Uuid
  code           String       @unique @db.VarChar(30) // STARTER, GROWTH, PRO, ENTERPRISE
  name           String       @db.VarChar(60)
  description    String?      @db.Text
  maxStudents    Int?         @map("max_students") // active students; null = unlimited
  maxCampuses    Int?         @map("max_campuses") // null = unlimited
  maxAdminUsers  Int?         @map("max_admin_users")
  maxStaffUsers  Int?         @map("max_staff_users") // null = unlimited
  storageGb      Int?         @map("storage_gb")
  trialDays      Int          @default(14) @map("trial_days")
  isPublic       Boolean      @default(true) @map("is_public") // shown on the pricing page
  isCustomPriced Boolean      @default(false) @map("is_custom_priced") // Enterprise: price agreed per contract
  sortOrder      Int          @default(0) @map("sort_order")
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)

  prices        PlanPrice[]
  features      PlanFeature[]
  organizations Organization[]
  subscriptions Subscription[]

  @@map("plans")
}

// Price of a plan per currency and billing cycle (tax excluded). Platform-level.
model PlanPrice {
  id           String       @id @default(uuid()) @db.Uuid
  planId       String       @map("plan_id") @db.Uuid
  currency     String       @db.Char(3)
  billingCycle BillingCycle @map("billing_cycle")
  amount       Decimal      @db.Decimal(12, 2)
  isActive     Boolean      @default(true) @map("is_active")
  createdAt    DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)

  plan        Plan     @relation(fields: [planId], references: [id], onDelete: Cascade)
  currencyRef Currency @relation(fields: [currency], references: [code], onDelete: Restrict)

  @@unique([planId, currency, billingCycle])
  @@map("plan_prices")
}

// Module and feature gating per plan (which modules/limits a plan unlocks). Platform-level.
model PlanFeature {
  id         String      @id @default(uuid()) @db.Uuid
  planId     String      @map("plan_id") @db.Uuid
  featureKey String      @map("feature_key") @db.VarChar(60) // e.g. module.LIB, custom_roles, whatsapp_sending, api_access
  module     ModuleCode? // set when the feature row gates a whole module
  isEnabled  Boolean     @default(true) @map("is_enabled")
  limitValue Int?        @map("limit_value") // numeric cap for metered features; null = no cap
  config     Json? // extra options, e.g. { "branding": "eduflow" }
  createdAt  DateTime    @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime    @updatedAt @map("updated_at") @db.Timestamptz(6)

  plan Plan @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@unique([planId, featureKey])
  @@index([planId, module])
  @@map("plan_features")
}

// The tenant: one school, school group or coaching institute.
model Organization {
  id                      String             @id @default(uuid()) @db.Uuid
  name                    String             @db.VarChar(150)
  legalName               String?            @map("legal_name") @db.VarChar(200)
  slug                    String             @unique @db.VarChar(63) // subdomain: {slug}.eduflow.app
  customDomain            String?            @unique @map("custom_domain") @db.VarChar(255) // white-label (Enterprise)
  type                    OrganizationType
  status                  OrganizationStatus @default(TRIAL)
  planId                  String             @map("plan_id") @db.Uuid // current plan, denormalised from the live subscription for fast gating
  countryCode             String             @map("country_code") @db.Char(2)
  currency                String             @db.Char(3) // default currency for fees
  // timezone, locale and currency are set at signup from Country.defaultTimezone / defaultLocale / defaultCurrencyCode; the column defaults are only a fallback
  timezone                String             @default("Asia/Kolkata") @db.VarChar(64) // IANA name
  locale                  String             @default("en-IN") @db.VarChar(10)
  stateCode               String?            @map("state_code") @db.VarChar(10) // GST state code (e.g. 09) / ISO 3166-2; decides CGST+SGST vs IGST
  isTaxRegistered         Boolean            @default(false) @map("is_tax_registered")
  taxIdType               String?            @map("tax_id_type") @db.VarChar(10) // GSTIN | ABN | TRN | EIN
  financialYearStartMonth Int                @default(4) @map("financial_year_start_month") @db.SmallInt // 4 = April (India), 7 = July (Australia), 1 = January (UAE, USA)
  weekStartsOn            WeekDay            @default(MONDAY) @map("week_starts_on")
  dataRegion              String             @default("ap-south-1") @map("data_region") @db.VarChar(20) // AWS region that holds this tenant's files and backups
  email                   String             @db.VarChar(255)
  phone                   String?            @db.VarChar(20) // E.164
  website                 String?            @db.VarChar(255)
  addressLine1            String?            @map("address_line1") @db.VarChar(200)
  addressLine2            String?            @map("address_line2") @db.VarChar(200)
  city                    String?            @db.VarChar(100)
  state                   String?            @db.VarChar(100)
  postalCode              String?            @map("postal_code") @db.VarChar(20)
  taxId                   String?            @map("tax_id") @db.VarChar(30) // GSTIN in India; ABN / TRN / EIN elsewhere
  registrationNo          String?            @map("registration_no") @db.VarChar(60) // board affiliation / registration number
  logoUrl                 String?            @map("logo_url") @db.VarChar(500)
  branding                Json? // { primaryColor, secondaryColor, faviconUrl, receiptFooter, hideEduflowBranding }
  ownerUserId             String?            @map("owner_user_id") @db.Uuid // User id of the account owner (no FK to avoid a circular dependency)
  trialStartsAt           DateTime?          @map("trial_starts_at") @db.Timestamptz(6)
  trialEndsAt             DateTime?          @map("trial_ends_at") @db.Timestamptz(6)
  onboardingCompletedAt   DateTime?          @map("onboarding_completed_at") @db.Timestamptz(6)
  activatedAt             DateTime?          @map("activated_at") @db.Timestamptz(6) // first fee receipt or first attendance
  suspendedAt             DateTime?          @map("suspended_at") @db.Timestamptz(6)
  suspendedReason         String?            @map("suspended_reason") @db.VarChar(255)
  signupSource            String?            @map("signup_source") @db.VarChar(60) // website, referral, partner, sales
  createdAt               DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt               DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt               DateTime?          @map("deleted_at") @db.Timestamptz(6)

  plan                          Plan                           @relation(fields: [planId], references: [id], onDelete: Restrict)
  country                       Country                        @relation(fields: [countryCode], references: [code], onDelete: Restrict)
  currencyRef                   Currency                       @relation(fields: [currency], references: [code], onDelete: Restrict)
  subscriptions                 Subscription[]
  subscriptionInvoices          SubscriptionInvoice[]
  addOnPurchases                AddOnPurchase[]
  campuses                      Campus[]
  organizationSettings          OrganizationSetting[]
  numberSequences               NumberSequence[]
  customFieldDefinitions        CustomFieldDefinition[]
  customFieldValues             CustomFieldValue[]
  fileAssets                    FileAsset[]
  importJobs                    ImportJob[]
  importJobRowErrors            ImportJobRowError[]
  exportJobs                    ExportJob[]
  users                         User[]
  roles                         Role[]
  rolePermissions               RolePermission[]
  userRoles                     UserRole[]
  userCampuses                  UserCampus[]
  refreshTokens                 RefreshToken[]
  otpCodes                      OtpCode[]
  passwordResetTokens           PasswordResetToken[]
  invitations                   Invitation[]
  loginHistories                LoginHistory[]
  auditLogs                     AuditLog[]
  apiKeys                       ApiKey[]
  consentRecords                ConsentRecord[]
  dataSubjectRequests           DataSubjectRequest[]
  academicYears                 AcademicYear[]
  terms                         Term[]
  courses                       Course[]
  batches                       Batch[]
  subjects                      Subject[]
  courseSubjects                CourseSubject[]
  batchSubjectTeachers          BatchSubjectTeacher[]
  rooms                         Room[]
  holidays                      Holiday[]
  calendarEvents                CalendarEvent[]
  departments                   Department[]
  designations                  Designation[]
  staff                         Staff[]
  staffDocuments                StaffDocument[]
  teacherSubjects               TeacherSubject[]
  students                      Student[]
  guardians                     Guardian[]
  studentGuardians              StudentGuardian[]
  enrollments                   Enrollment[]
  studentDocuments              StudentDocument[]
  studentNotes                  StudentNote[]
  studentStatusHistories        StudentStatusHistory[]
  admissionInquiries            AdmissionInquiry[]
  inquiryFollowUps              InquiryFollowUp[]
  admissionApplications         AdmissionApplication[]
  admissionApplicationDocuments AdmissionApplicationDocument[]
  attendanceSessions            AttendanceSession[]
  attendanceRecords             AttendanceRecord[]
  staffAttendances              StaffAttendance[]
  leaveTypes                    LeaveType[]
  leavePolicies                 LeavePolicy[]
  leaveBalances                 LeaveBalance[]
  leaveRequests                 LeaveRequest[]
  leaveApprovalSteps            LeaveApprovalStep[]
  studentLeaveRequests          StudentLeaveRequest[]
  periodSlots                   PeriodSlot[]
  timetableEntries              TimetableEntry[]
  substitutions                 Substitution[]
  homework                      Homework[]
  homeworkAttachments           HomeworkAttachment[]
  homeworkSubmissions           HomeworkSubmission[]
  homeworkSubmissionFiles       HomeworkSubmissionFile[]
  gradeScales                   GradeScale[]
  gradeBands                    GradeBand[]
  exams                         Exam[]
  examSchedules                 ExamSchedule[]
  examMarks                     ExamMark[]
  reportCardTemplates           ReportCardTemplate[]
  reportCards                   ReportCard[]
  reportCardRemarks             ReportCardRemark[]
  feeHeads                      FeeHead[]
  feeStructures                 FeeStructure[]
  feeStructureItems             FeeStructureItem[]
  feeInstallments               FeeInstallment[]
  studentFeeAssignments         StudentFeeAssignment[]
  feeInvoices                   FeeInvoice[]
  feeInvoiceItems               FeeInvoiceItem[]
  lateFeeRules                  LateFeeRule[]
  discounts                     Discount[]
  studentDiscounts              StudentDiscount[]
  scholarships                  Scholarship[]
  scholarshipApplications       ScholarshipApplication[]
  scholarshipAwards             ScholarshipAward[]
  scholarshipDisbursements      ScholarshipDisbursement[]
  feeReminderLogs               FeeReminderLog[]
  paymentGatewayAccounts        PaymentGatewayAccount[]
  paymentOrders                 PaymentOrder[]
  payments                      Payment[]
  paymentAllocations            PaymentAllocation[]
  receipts                      Receipt[]
  refunds                       Refund[]
  webhookEvents                 WebhookEvent[]
  settlements                   Settlement[]
  dayCloses                     DayClose[]
  notificationTemplates         NotificationTemplate[]
  notifications                 Notification[]
  notificationPreferences       NotificationPreference[]
  announcements                 Announcement[]
  announcementRecipients        AnnouncementRecipient[]
  messageLogs                   MessageLog[]
  whatsAppAccounts              WhatsAppAccount[]
  whatsAppTemplates             WhatsAppTemplate[]
  whatsAppInboundMessages       WhatsAppInboundMessage[]
  emailSenderIdentities         EmailSenderIdentity[]
  emailSuppressions             EmailSuppression[]
  smsSenderIds                  SmsSenderId[]
  messageCreditWallets          MessageCreditWallet[]
  creditTransactions            CreditTransaction[]
  deviceTokens                  DeviceToken[]
  libraryCategories             LibraryCategory[]
  books                         Book[]
  bookCopies                    BookCopy[]
  bookIssues                    BookIssue[]
  inventoryCategories           InventoryCategory[]
  inventoryItems                InventoryItem[]
  vendors                       Vendor[]
  purchaseOrders                PurchaseOrder[]
  purchaseOrderItems            PurchaseOrderItem[]
  stockTransactions             StockTransaction[]
  assetAssignments              AssetAssignment[]
  vehicles                      Vehicle[]
  driverProfiles                DriverProfile[]
  transportRoutes               TransportRoute[]
  routeStops                    RouteStop[]
  transportAssignments          TransportAssignment[]
  vehicleTrips                  VehicleTrip[]
  vehicleMaintenances           VehicleMaintenance[]
  hostels                       Hostel[]
  hostelRooms                   HostelRoom[]
  hostelBeds                    HostelBed[]
  hostelAllocations             HostelAllocation[]
  hostelAttendances             HostelAttendance[]
  hostelVisitorLogs             HostelVisitorLog[]
  salaryComponents              SalaryComponent[]
  salaryStructures              SalaryStructure[]
  salaryStructureItems          SalaryStructureItem[]
  staffSalaries                 StaffSalary[]
  payrollRuns                   PayrollRun[]
  payslips                      Payslip[]
  payslipItems                  PayslipItem[]
  staffLoanAdvances             StaffLoanAdvance[]
  payrollAdjustments            PayrollAdjustment[]
  certificateTemplates          CertificateTemplate[]
  issuedCertificates            IssuedCertificate[]
  certificateRequests           CertificateRequest[]
  savedReports                  SavedReport[]
  reportSchedules               ReportSchedule[]
  dailyMetricSnapshots          DailyMetricSnapshot[]
  dashboardPreferences          DashboardPreference[]
  aiInsights                    AiInsight[]
  studentRiskScores             StudentRiskScore[]
  aiQueryLogs                   AiQueryLog[]
  aiUsageQuotas                 AiUsageQuota[]
  policyDocuments               PolicyDocument[]
  dataBreachIncidents           DataBreachIncident[]
  ptmBookings                   PtmBooking[]
  families                      Family[]
  staffStatusHistories          StaffStatusHistory[]
  studentTransfers              StudentTransfer[]
  classSessions                 ClassSession[]
  studyMaterials                StudyMaterial[]
  examScheduleComponents        ExamScheduleComponent[]
  examMarkComponents            ExamMarkComponent[]
  examReEvaluationRequests      ExamReEvaluationRequest[]
  taxRates                      TaxRate[]
  feeInvoiceAdjustments         FeeInvoiceAdjustment[]
  studentFeeInstallments        StudentFeeInstallment[]
  paymentAllocationItems        PaymentAllocationItem[]
  refundAllocations             RefundAllocation[]
  smsDltTemplates               SmsDltTemplate[]
  bookReservations              BookReservation[]
  transportAttendances          TransportAttendance[]
  hostelLeaveRequests           HostelLeaveRequest[]
  payrollStatutorySettings      PayrollStatutorySetting[]
  staffTaxDeclarations          StaffTaxDeclaration[]

  @@index([status])
  @@index([planId])
  @@index([countryCode, type])
  @@map("organizations")
}

// A tenant's SaaS subscription to a plan (one live row per organization; history kept).
// One live row is enforced by a partial unique index in the SQL migration:
// UNIQUE (organization_id) WHERE status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED')
model Subscription {
  id                    String             @id @default(uuid()) @db.Uuid
  organizationId        String             @map("organization_id") @db.Uuid
  planId                String             @map("plan_id") @db.Uuid
  status                SubscriptionStatus @default(TRIALING)
  billingCycle          BillingCycle       @default(MONTHLY) @map("billing_cycle")
  currency              String             @db.Char(3)
  unitAmount            Decimal            @map("unit_amount") @db.Decimal(12, 2) // price per cycle before tax
  discountAmount        Decimal            @default(0) @map("discount_amount") @db.Decimal(12, 2)
  taxPercent            Decimal            @default(0) @map("tax_percent") @db.Decimal(5, 2)
  studentLimitOverride  Int?               @map("student_limit_override") // Enterprise contracts
  campusLimitOverride   Int?               @map("campus_limit_override")
  startDate             DateTime           @map("start_date") @db.Date
  currentPeriodStart    DateTime           @map("current_period_start") @db.Timestamptz(6)
  currentPeriodEnd      DateTime           @map("current_period_end") @db.Timestamptz(6)
  trialEndsAt           DateTime?          @map("trial_ends_at") @db.Timestamptz(6)
  cancelAtPeriodEnd     Boolean            @default(false) @map("cancel_at_period_end")
  cancelledAt           DateTime?          @map("cancelled_at") @db.Timestamptz(6)
  cancelReason          String?            @map("cancel_reason") @db.VarChar(255)
  gateway               PaymentGateway     @default(OFFLINE)
  gatewayCustomerId     String?            @map("gateway_customer_id") @db.VarChar(100)
  gatewaySubscriptionId String?            @map("gateway_subscription_id") @db.VarChar(100)
  notes                 String?            @db.Text
  createdAt             DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization          @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  plan         Plan                  @relation(fields: [planId], references: [id], onDelete: Restrict)
  invoices     SubscriptionInvoice[]
  addOns       AddOnPurchase[]

  @@unique([gateway, gatewaySubscriptionId])
  @@index([organizationId, status])
  @@index([status, currentPeriodEnd]) // renewal and dunning worker
  @@map("subscriptions")
}

// Invoice raised by EduFlow to a tenant for the subscription and add-ons.
model SubscriptionInvoice {
  id                 String                    @id @default(uuid()) @db.Uuid
  organizationId     String                    @map("organization_id") @db.Uuid
  subscriptionId     String?                   @map("subscription_id") @db.Uuid // null for one-time add-on invoices
  invoiceNo          String                    @unique @map("invoice_no") @db.VarChar(40) // platform-wide series, e.g. EF/26-27/000123; max 16 chars when the issuer is GST-registered (India, GST Rule 46)
  status             SubscriptionInvoiceStatus @default(OPEN)
  currency           String                    @db.Char(3)
  supplierEntity     String                    @default("EDUFLOW_IN") @map("supplier_entity") @db.VarChar(30) // EduFlow billing entity that issued the invoice
  supplierTaxId      String?                   @map("supplier_tax_id") @db.VarChar(30) // supplier GSTIN / TRN / ABN frozen at issue
  sacCode            String?                   @map("sac_code") @db.VarChar(10) // e.g. 998314
  billingCountryCode String                    @map("billing_country_code") @db.Char(2)
  billingStateCode   String?                   @map("billing_state_code") @db.VarChar(10)
  placeOfSupply      String?                   @map("place_of_supply") @db.VarChar(10)
  taxName            String?                   @map("tax_name") @db.VarChar(20) // GST, VAT, Sales Tax
  taxBreakdown       Json?                     @map("tax_breakdown") // [{ code: CGST|SGST|IGST|GST|VAT|SALES_TAX, percent, amount }]
  isReverseCharge    Boolean                   @default(false) @map("is_reverse_charge") // export of services / B2B reverse charge
  amountRefunded     Decimal                   @default(0) @map("amount_refunded") @db.Decimal(12, 2)
  creditNoteNo       String?                   @unique @map("credit_note_no") @db.VarChar(40)
  creditNoteDate     DateTime?                 @map("credit_note_date") @db.Date
  voidedAt           DateTime?                 @map("voided_at") @db.Timestamptz(6)
  voidReason         String?                   @map("void_reason") @db.VarChar(255)
  subtotal           Decimal                   @db.Decimal(12, 2)
  discountAmount     Decimal                   @default(0) @map("discount_amount") @db.Decimal(12, 2)
  taxPercent         Decimal                   @default(0) @map("tax_percent") @db.Decimal(5, 2)
  taxAmount          Decimal                   @default(0) @map("tax_amount") @db.Decimal(12, 2)
  totalAmount        Decimal                   @map("total_amount") @db.Decimal(12, 2)
  amountPaid         Decimal                   @default(0) @map("amount_paid") @db.Decimal(12, 2)
  periodStart        DateTime?                 @map("period_start") @db.Date
  periodEnd          DateTime?                 @map("period_end") @db.Date
  issueDate          DateTime                  @map("issue_date") @db.Date
  dueDate            DateTime                  @map("due_date") @db.Date
  paidAt             DateTime?                 @map("paid_at") @db.Timestamptz(6)
  gateway            PaymentGateway            @default(OFFLINE)
  gatewayInvoiceId   String?                   @map("gateway_invoice_id") @db.VarChar(100)
  gatewayPaymentId   String?                   @map("gateway_payment_id") @db.VarChar(100)
  billingName        String                    @map("billing_name") @db.VarChar(200)
  billingTaxId       String?                   @map("billing_tax_id") @db.VarChar(30) // customer GSTIN at the time of invoicing
  billingAddress     Json?                     @map("billing_address")
  lineItems          Json                      @map("line_items") // [{ description, quantity, unitAmount, amount, addOnPurchaseId? }]
  pdfFileId          String?                   @map("pdf_file_id") @db.Uuid
  createdAt          DateTime                  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime                  @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization    @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  subscription Subscription?   @relation(fields: [subscriptionId], references: [id], onDelete: Restrict)
  pdfFile      FileAsset?      @relation(fields: [pdfFileId], references: [id], onDelete: SetNull)
  addOns       AddOnPurchase[]

  @@unique([gateway, gatewayInvoiceId]) // idempotent webhook upserts; NULLs allowed for OFFLINE invoices
  @@unique([gateway, gatewayPaymentId])
  @@index([organizationId, status])
  @@index([organizationId, issueDate])
  @@index([status, dueDate]) // dunning worker
  @@map("subscription_invoices")
}

// Add-on bought by a tenant: extra campus, AI Insights, WhatsApp/SMS credit packs, migration, training.
model AddOnPurchase {
  id               String        @id @default(uuid()) @db.Uuid
  organizationId   String        @map("organization_id") @db.Uuid
  subscriptionId   String?       @map("subscription_id") @db.Uuid
  invoiceId        String?       @map("invoice_id") @db.Uuid
  campusId         String?       @map("campus_id") @db.Uuid // the campus unlocked by EXTRA_CAMPUS
  addOnType        AddOnType     @map("add_on_type")
  description      String?       @db.VarChar(255)
  quantity         Int           @default(1)
  unitAmount       Decimal       @map("unit_amount") @db.Decimal(12, 2)
  totalAmount      Decimal       @map("total_amount") @db.Decimal(12, 2) // before tax
  currency         String        @db.Char(3)
  isRecurring      Boolean       @default(false) @map("is_recurring")
  billingCycle     BillingCycle? @map("billing_cycle") // only when recurring
  status           AddOnStatus   @default(PENDING)
  creditsGranted   Decimal?      @map("credits_granted") @db.Decimal(12, 4) // message credits (SMS) or wallet money (WhatsApp) for credit packs
  creditsRemaining Decimal?      @map("credits_remaining") @db.Decimal(12, 4) // unexpired remainder; used for FIFO pack expiry
  creditUnit       CreditUnit?   @map("credit_unit")
  taxAmount        Decimal       @default(0) @map("tax_amount") @db.Decimal(12, 2)
  refundedAmount   Decimal       @default(0) @map("refunded_amount") @db.Decimal(12, 2)
  cancelledAt      DateTime?     @map("cancelled_at") @db.Timestamptz(6)
  startsAt         DateTime?     @map("starts_at") @db.Timestamptz(6)
  expiresAt        DateTime?     @map("expires_at") @db.Timestamptz(6)
  purchasedById    String?       @map("purchased_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt        DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime      @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization       Organization         @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  subscription       Subscription?        @relation(fields: [subscriptionId], references: [id], onDelete: SetNull)
  invoice            SubscriptionInvoice? @relation(fields: [invoiceId], references: [id], onDelete: SetNull)
  campus             Campus?              @relation(fields: [campusId], references: [id], onDelete: SetNull)
  creditTransactions CreditTransaction[]

  @@index([organizationId, addOnType, status])
  @@index([organizationId, addOnType, expiresAt])
  @@map("add_on_purchases")
}

// A branch / centre of an organization. Most operational data is scoped to a campus.
// One main campus per organization is enforced by a partial unique index in the SQL migration:
// UNIQUE (organization_id) WHERE is_main AND deleted_at IS NULL
model Campus {
  id              String       @id @default(uuid()) @db.Uuid
  organizationId  String       @map("organization_id") @db.Uuid
  name            String       @db.VarChar(150)
  code            String       @db.VarChar(20) // short code used in numbering, e.g. LKO1
  isMain          Boolean      @default(false) @map("is_main")
  email           String?      @db.VarChar(255)
  phone           String?      @db.VarChar(20)
  addressLine1    String?      @map("address_line1") @db.VarChar(200)
  addressLine2    String?      @map("address_line2") @db.VarChar(200)
  city            String?      @db.VarChar(100)
  state           String?      @db.VarChar(100)
  postalCode      String?      @map("postal_code") @db.VarChar(20)
  countryCode     String?      @map("country_code") @db.Char(2)
  timezone        String?      @db.VarChar(64) // overrides the organization timezone when set
  latitude        Decimal?     @db.Decimal(9, 6) // used for geo-fenced staff attendance
  longitude       Decimal?     @db.Decimal(9, 6)
  geoRadiusMeters Int?         @map("geo_radius_meters")
  taxId           String?      @map("tax_id") @db.VarChar(30) // campus-level GSTIN when registered separately
  isTaxRegistered Boolean      @default(false) @map("is_tax_registered")
  stateCode       String?      @map("state_code") @db.VarChar(10) // GST state code / ISO 3166-2
  currency        String?      @db.Char(3) // overrides Organization.currency
  locale          String?      @db.VarChar(10) // overrides Organization.locale
  board           String?      @db.VarChar(60) // CBSE, ICSE, UP Board ...
  affiliationNo   String?      @map("affiliation_no") @db.VarChar(40) // printed on TCs, report cards and board forms
  schoolCode      String?      @map("school_code") @db.VarChar(40)
  udiseCode       String?      @map("udise_code") @db.VarChar(20)
  logoUrl         String?      @map("logo_url") @db.VarChar(500) // overrides Organization.logoUrl
  weeklyOffDays   WeekDay[]    @map("weekly_off_days") // used by attendance, leave day counts and payroll working days
  status          RecordStatus @default(ACTIVE)
  createdAt       DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt       DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization             Organization              @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  country                  Country?                  @relation(fields: [countryCode], references: [code], onDelete: Restrict)
  addOnPurchases           AddOnPurchase[]
  organizationSettings     OrganizationSetting[]
  numberSequences          NumberSequence[]
  fileAssets               FileAsset[]
  importJobs               ImportJob[]
  exportJobs               ExportJob[]
  userCampuses             UserCampus[]
  auditLogs                AuditLog[]
  courses                  Course[]
  batches                  Batch[]
  batchSubjectTeachers     BatchSubjectTeacher[]
  rooms                    Room[]
  holidays                 Holiday[]
  calendarEvents           CalendarEvent[]
  departments              Department[]
  staff                    Staff[]
  students                 Student[]
  enrollments              Enrollment[]
  admissionInquiries       AdmissionInquiry[]
  admissionApplications    AdmissionApplication[]
  attendanceSessions       AttendanceSession[]
  attendanceRecords        AttendanceRecord[]
  staffAttendances         StaffAttendance[]
  leaveRequests            LeaveRequest[]
  studentLeaveRequests     StudentLeaveRequest[]
  periodSlots              PeriodSlot[]
  timetableEntries         TimetableEntry[]
  substitutions            Substitution[]
  homework                 Homework[]
  exams                    Exam[]
  examSchedules            ExamSchedule[]
  reportCards              ReportCard[]
  feeStructures            FeeStructure[]
  studentFeeAssignments    StudentFeeAssignment[]
  feeInvoices              FeeInvoice[]
  lateFeeRules             LateFeeRule[]
  scholarshipApplications  ScholarshipApplication[]
  scholarshipAwards        ScholarshipAward[]
  feeReminderLogs          FeeReminderLog[]
  paymentGatewayAccounts   PaymentGatewayAccount[]
  paymentOrders            PaymentOrder[]
  payments                 Payment[]
  receipts                 Receipt[]
  refunds                  Refund[]
  dayCloses                DayClose[]
  announcements            Announcement[]
  messageLogs              MessageLog[]
  whatsAppAccounts         WhatsAppAccount[]
  bookCopies               BookCopy[]
  bookIssues               BookIssue[]
  inventoryItems           InventoryItem[]
  purchaseOrders           PurchaseOrder[]
  stockTransactions        StockTransaction[]        @relation("StockTransactionCampus")
  stockTransfersReceived   StockTransaction[]        @relation("StockTransferCounterCampus")
  assetAssignments         AssetAssignment[]
  vehicles                 Vehicle[]
  transportRoutes          TransportRoute[]
  transportAssignments     TransportAssignment[]
  vehicleTrips             VehicleTrip[]
  vehicleMaintenances      VehicleMaintenance[]
  hostels                  Hostel[]
  hostelAllocations        HostelAllocation[]
  payrollRuns              PayrollRun[]
  payslips                 Payslip[]
  payrollAdjustments       PayrollAdjustment[]
  issuedCertificates       IssuedCertificate[]
  certificateRequests      CertificateRequest[]
  savedReports             SavedReport[]
  dailyMetricSnapshots     DailyMetricSnapshot[]
  aiInsights               AiInsight[]
  studentRiskScores        StudentRiskScore[]
  studentTransfersFrom     StudentTransfer[]         @relation("StudentTransferFromCampus")
  studentTransfersTo       StudentTransfer[]         @relation("StudentTransferToCampus")
  ptmBookings              PtmBooking[]
  classSessions            ClassSession[]
  studyMaterials           StudyMaterial[]
  examMarks                ExamMark[]
  examReEvaluationRequests ExamReEvaluationRequest[]
  taxRates                 TaxRate[]
  feeInvoiceAdjustments    FeeInvoiceAdjustment[]
  studentDiscounts         StudentDiscount[]
  scholarshipDisbursements ScholarshipDisbursement[]
  bookReservations         BookReservation[]
  transportAttendances     TransportAttendance[]
  hostelAttendances        HostelAttendance[]
  hostelVisitorLogs        HostelVisitorLog[]
  hostelLeaveRequests      HostelLeaveRequest[]
  staffSalaries            StaffSalary[]
  staffLoanAdvances        StaffLoanAdvance[]
  payrollStatutorySettings PayrollStatutorySetting[]

  @@unique([organizationId, code])
  @@index([organizationId, status])
  @@map("campuses")
}

// Key/value settings per organization, with an optional campus-level override.
model OrganizationSetting {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  campusId       String?  @map("campus_id") @db.Uuid // null = organization-wide value
  key            String   @db.VarChar(100) // e.g. attendance.lock_after_hours, fees.late_fee_policy
  value          Json
  updatedById    String?  @map("updated_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus       Campus?      @relation(fields: [campusId], references: [id], onDelete: Cascade)

  // NULL campus_id rows are kept unique by a partial unique index added in the SQL migration:
  // UNIQUE (organization_id, key) WHERE campus_id IS NULL
  @@unique([organizationId, campusId, key])
  @@index([organizationId, key])
  @@map("organization_settings")
}

// Gap-free counters for admission, receipt, invoice and other document numbers.
model NumberSequence {
  id             String              @id @default(uuid()) @db.Uuid
  organizationId String              @map("organization_id") @db.Uuid
  campusId       String?             @map("campus_id") @db.Uuid // null = one series for the whole organization
  sequenceType   NumberSequenceType  @map("sequence_type")
  periodKey      String              @default("") @map("period_key") @db.VarChar(20) // "2027", "2027-28", "2027-04" or "" when never reset
  prefix         String?             @db.VarChar(20)
  suffix         String?             @db.VarChar(20)
  format         String              @default("{PREFIX}-{YYYY}-{SEQ}") @db.VarChar(100) // tokens: {PREFIX} {CAMPUS} {YYYY} {YY} {AY} {MM} {SEQ} {SUFFIX}
  padLength      Int                 @default(4) @map("pad_length") @db.SmallInt
  maxLength      Int?                @map("max_length") @db.SmallInt // 16 for GST tax-invoice series; validated when the format is saved
  nextValue      Int                 @default(1) @map("next_value") // incremented with SELECT ... FOR UPDATE inside the business transaction
  resetPolicy    SequenceResetPolicy @default(NEVER) @map("reset_policy")
  createdAt      DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus       Campus?      @relation(fields: [campusId], references: [id], onDelete: Cascade)

  // NULL campus_id rows are kept unique by a partial unique index added in the SQL migration.
  @@unique([organizationId, campusId, sequenceType, periodKey])
  @@index([organizationId, sequenceType])
  @@map("number_sequences")
}

// Tenant-defined extra field for students, staff, inquiries and other entities.
model CustomFieldDefinition {
  id              String            @id @default(uuid()) @db.Uuid
  organizationId  String            @map("organization_id") @db.Uuid
  entityType      CustomFieldEntity @map("entity_type")
  key             String            @db.VarChar(60) // machine name, e.g. aadhaar_seeded
  label           String            @db.VarChar(120)
  fieldType       CustomFieldType   @map("field_type")
  options         Json? // choices for SELECT / MULTI_SELECT: [{ value, label }]
  validation      Json? // { min, max, regex, maxLength }
  defaultValue    Json?             @map("default_value")
  helpText        String?           @map("help_text") @db.VarChar(255)
  isRequired      Boolean           @default(false) @map("is_required")
  showInList      Boolean           @default(false) @map("show_in_list")
  visibleToParent Boolean           @default(false) @map("visible_to_parent")
  sortOrder       Int               @default(0) @map("sort_order")
  status          RecordStatus      @default(ACTIVE)
  createdAt       DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt       DateTime?         @map("deleted_at") @db.Timestamptz(6)

  organization Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  values       CustomFieldValue[]

  @@unique([organizationId, entityType, key])
  @@index([organizationId, entityType, status, sortOrder])
  @@map("custom_field_definitions")
}

// Value of a custom field for one entity row (polymorphic: entityType + entityId).
model CustomFieldValue {
  id             String            @id @default(uuid()) @db.Uuid
  organizationId String            @map("organization_id") @db.Uuid
  definitionId   String            @map("definition_id") @db.Uuid
  entityType     CustomFieldEntity @map("entity_type")
  entityId       String            @map("entity_id") @db.Uuid // id of the Student, Staff ... row
  value          Json
  createdAt      DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization          @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  definition   CustomFieldDefinition @relation(fields: [definitionId], references: [id], onDelete: Cascade)

  @@unique([organizationId, definitionId, entityId])
  @@index([organizationId, entityType, entityId])
  @@map("custom_field_values")
}

// Metadata of a file stored in a private S3 bucket; served through pre-signed URLs.
// Rows are never hard-deleted: purge sets status = DELETED + deletedAt and removes only the S3 object.
model FileAsset {
  id                   String         @id @default(uuid()) @db.Uuid
  organizationId       String         @map("organization_id") @db.Uuid
  campusId             String?        @map("campus_id") @db.Uuid
  bucket               String         @db.VarChar(100)
  region               String         @default("ap-south-1") @db.VarChar(20) // AWS region of the bucket (data residency)
  containsPersonalData Boolean        @default(true) @map("contains_personal_data")
  retentionUntil       DateTime?      @map("retention_until") @db.Date
  s3Key                String         @unique @map("s3_key") @db.VarChar(500) // org/{orgId}/{category}/{uuid}-{name}
  originalName         String         @map("original_name") @db.VarChar(255)
  mimeType             String         @map("mime_type") @db.VarChar(127)
  sizeBytes            Int            @map("size_bytes") // max upload size is far below 2 GB
  checksumSha256       String?        @map("checksum_sha256") @db.Char(64)
  category             String?        @db.VarChar(40) // student-photo, student-document, homework, receipt, import, export ...
  ownerType            String?        @map("owner_type") @db.VarChar(60) // owning entity model name, e.g. Student, Homework
  ownerId              String?        @map("owner_id") @db.Uuid // id of the owning entity row
  visibility           FileVisibility @default(PRIVATE)
  status               FileStatus     @default(PENDING_UPLOAD)
  uploadedById         String?        @map("uploaded_by_id") @db.Uuid
  createdAt            DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt            DateTime?      @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus?      @relation(fields: [campusId], references: [id], onDelete: SetNull)
  uploadedBy   User?        @relation(fields: [uploadedById], references: [id], onDelete: SetNull)

  importSourceJobs               ImportJob[]                    @relation("ImportJobSourceFile")
  importErrorJobs                ImportJob[]                    @relation("ImportJobErrorFile")
  subscriptionInvoices           SubscriptionInvoice[]
  exportJobs                     ExportJob[]
  consentRecords                 ConsentRecord[]
  dataSubjectRequests            DataSubjectRequest[]
  staffPhotos                    Staff[]
  staffDocuments                 StaffDocument[]
  studentPhotos                  Student[]
  studentDocuments               StudentDocument[]
  admissionApplicationDocuments  AdmissionApplicationDocument[]
  leaveRequests                  LeaveRequest[]
  studentLeaveRequests           StudentLeaveRequest[]
  homeworkAttachments            HomeworkAttachment[]
  homeworkSubmissionFiles        HomeworkSubmissionFile[]
  reportCards                    ReportCard[]
  feeInvoices                    FeeInvoice[]
  receipts                       Receipt[]
  dayCloseDepositSlips           DayClose[]
  whatsAppInboundMessages        WhatsAppInboundMessage[]
  bookCovers                     Book[]
  vehicleMaintenanceBills        VehicleMaintenance[]
  payslips                       Payslip[]
  certificateTemplateBackgrounds CertificateTemplate[]
  issuedCertificates             IssuedCertificate[]
  studyMaterials                 StudyMaterial[]
  refunds                        Refund[]

  @@index([organizationId, ownerType, ownerId])
  @@index([organizationId, category, createdAt])
  @@index([organizationId, status, deletedAt]) // purge worker
  @@map("file_assets")
}

// Bulk Excel/CSV import run (students, staff, fee dues ...) processed by a worker.
model ImportJob {
  id             String     @id @default(uuid()) @db.Uuid
  organizationId String     @map("organization_id") @db.Uuid
  campusId       String?    @map("campus_id") @db.Uuid
  importType     ImportType @map("import_type")
  status         JobStatus  @default(QUEUED)
  isDryRun       Boolean    @default(false) @map("is_dry_run") // validate only, write nothing
  sourceFileId   String     @map("source_file_id") @db.Uuid
  errorFileId    String?    @map("error_file_id") @db.Uuid // generated workbook with the failed rows and reasons
  columnMapping  Json?      @map("column_mapping") // { "Excel column": "fieldName" }
  options        Json? // { updateExisting, academicYearId, batchId, dateFormat }
  totalRows      Int        @default(0) @map("total_rows")
  processedRows  Int        @default(0) @map("processed_rows")
  successRows    Int        @default(0) @map("success_rows")
  failedRows     Int        @default(0) @map("failed_rows")
  errorMessage   String?    @map("error_message") @db.Text // fatal job-level error
  startedAt      DateTime?  @map("started_at") @db.Timestamptz(6)
  finishedAt     DateTime?  @map("finished_at") @db.Timestamptz(6)
  createdById    String?    @map("created_by_id") @db.Uuid
  createdAt      DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus       Campus?             @relation(fields: [campusId], references: [id], onDelete: SetNull)
  sourceFile   FileAsset           @relation("ImportJobSourceFile", fields: [sourceFileId], references: [id], onDelete: Restrict)
  errorFile    FileAsset?          @relation("ImportJobErrorFile", fields: [errorFileId], references: [id], onDelete: SetNull)
  createdBy    User?               @relation(fields: [createdById], references: [id], onDelete: SetNull)
  rowErrors    ImportJobRowError[]

  @@index([organizationId, importType, createdAt])
  @@index([organizationId, status])
  @@map("import_jobs")
}

// One rejected row (or cell) of an import job. Append-only: no updatedAt / deletedAt.
model ImportJobRowError {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  importJobId    String   @map("import_job_id") @db.Uuid
  rowNumber      Int      @map("row_number") // 1-based row in the uploaded sheet
  columnName     String?  @map("column_name") @db.VarChar(100)
  errorCode      String   @map("error_code") @db.VarChar(60) // e.g. REQUIRED, INVALID_DATE, DUPLICATE_ADMISSION_NO
  message        String   @db.VarChar(500)
  rowData        Json?    @map("row_data") // original row values for the error workbook
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  importJob    ImportJob    @relation(fields: [importJobId], references: [id], onDelete: Cascade)

  @@index([organizationId, importJobId, rowNumber])
  @@map("import_job_row_errors")
}

// Asynchronous export of a list or report to Excel/CSV/PDF; file link expires.
model ExportJob {
  id             String     @id @default(uuid()) @db.Uuid
  organizationId String     @map("organization_id") @db.Uuid
  campusId       String?    @map("campus_id") @db.Uuid
  exportType     String     @map("export_type") @db.VarChar(80) // e.g. students.list, fees.defaulters, attendance.monthly
  format         FileFormat @default(XLSX)
  filters        Json? // the list filters that were active when the export was requested
  columns        Json? // selected columns
  status         JobStatus  @default(QUEUED)
  fileId         String?    @map("file_id") @db.Uuid
  rowCount       Int?       @map("row_count")
  errorMessage   String?    @map("error_message") @db.Text
  startedAt      DateTime?  @map("started_at") @db.Timestamptz(6)
  finishedAt     DateTime?  @map("finished_at") @db.Timestamptz(6)
  expiresAt      DateTime?  @map("expires_at") @db.Timestamptz(6) // file is purged after this time
  requestedById  String?    @map("requested_by_id") @db.Uuid
  createdAt      DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus       Campus?      @relation(fields: [campusId], references: [id], onDelete: SetNull)
  file         FileAsset?   @relation(fields: [fileId], references: [id], onDelete: SetNull)
  requestedBy  User?        @relation(fields: [requestedById], references: [id], onDelete: SetNull)

  @@index([organizationId, requestedById, createdAt])
  @@index([organizationId, status])
  @@map("export_jobs")
}
```

## Auth: users, roles, permissions, sessions, audit, consent

File `server/prisma/schema/02-auth.prisma` — 17 models, 19 enums.

```prisma
// 02-auth: identity, RBAC, sessions, OTP, invitations, audit trail, API keys
// and privacy records (DPDP / GDPR consent and data-subject requests).

enum UserType {
  STAFF
  PARENT
  STUDENT
  PLATFORM // EduFlow employees (SUPER_ADMIN); organizationId is null
}

enum UserStatus {
  INVITED
  ACTIVE
  SUSPENDED
  LOCKED
  DEACTIVATED
}

enum MfaMethod {
  TOTP
  SMS
  EMAIL
}

// Data scope granted with a permission; maps to the RBAC matrix cells Yes / Campus / Own / View.
enum PermissionScope {
  ALL
  CAMPUS
  OWN
  VIEW
}

enum TokenRevokeReason {
  LOGOUT
  ROTATED
  REUSE_DETECTED
  PASSWORD_CHANGED
  ADMIN_REVOKED
  USER_DEACTIVATED
}

enum OtpPurpose {
  LOGIN
  VERIFY_PHONE
  VERIFY_EMAIL
  PASSWORD_RESET
  MFA
  CONSENT_VERIFICATION
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}

enum LoginMethod {
  PASSWORD
  OTP
  SSO
  API_KEY
}

enum LoginResult {
  SUCCESS
  FAILED
  LOCKED
  MFA_REQUIRED
  MFA_FAILED
}

enum AuditActorType {
  USER
  SYSTEM // background worker or scheduler
  API_KEY
  IMPERSONATION // SUPER_ADMIN acting inside a tenant
}

enum ConsentType {
  TERMS_OF_SERVICE
  PRIVACY_POLICY
  DATA_PROCESSING
  CHILD_DATA_PROCESSING // verifiable parental consent (DPDP Act s.9, COPPA)
  COMMUNICATION_WHATSAPP
  COMMUNICATION_SMS
  COMMUNICATION_EMAIL
  PHOTO_MEDIA
  THIRD_PARTY_SHARING
}

enum ConsentStatus {
  GRANTED
  WITHDRAWN
  EXPIRED
}

enum ConsentVerificationMethod {
  OTP
  EMAIL_LINK
  SIGNED_FORM
  IN_PERSON
  DIGILOCKER
}

enum DataSubjectRequestType {
  ACCESS
  EXPORT
  CORRECTION
  DELETION
  RESTRICT_PROCESSING
  WITHDRAW_CONSENT
  OBJECTION // GDPR right to object
  NOMINATION // DPDP: nominate a person to exercise rights
  GRIEVANCE // DPDP grievance redressal
}

// Result of an audited action; DENIED / FAILED attempts on money actions are logged too.
enum AuditOutcome {
  SUCCESS
  DENIED
  FAILED
}

enum BreachSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum BreachStatus {
  DETECTED
  INVESTIGATING
  CONTAINED
  NOTIFIED
  CLOSED
}

enum DataSubjectRequestStatus {
  RECEIVED
  IDENTITY_VERIFICATION
  IN_PROGRESS
  COMPLETED
  REJECTED
  CANCELLED
}

enum DataSubjectType {
  USER
  STUDENT
  GUARDIAN
  STAFF
}

// Login account. One row per person per organization and user type; PLATFORM users have no organization.
// SQL migration adds: CHECK ((user_type = 'PLATFORM') = (organization_id IS NULL)) so a tenant user can never have a NULL organization.
model User {
  id                 String     @id @default(uuid()) @db.Uuid
  organizationId     String?    @map("organization_id") @db.Uuid // null ONLY for userType PLATFORM
  userType           UserType   @map("user_type")
  status             UserStatus @default(INVITED)
  email              String?    @db.VarChar(255) // stored lower-case; optional for OTP-only parents
  emailVerifiedAt    DateTime?  @map("email_verified_at") @db.Timestamptz(6)
  phone              String?    @db.VarChar(20) // E.164, e.g. +919876543210
  phoneVerifiedAt    DateTime?  @map("phone_verified_at") @db.Timestamptz(6)
  passwordHash       String?    @map("password_hash") @db.VarChar(100) // bcrypt; null for OTP-only accounts
  passwordChangedAt  DateTime?  @map("password_changed_at") @db.Timestamptz(6)
  mustChangePassword Boolean    @default(false) @map("must_change_password")
  firstName          String     @map("first_name") @db.VarChar(80)
  lastName           String?    @map("last_name") @db.VarChar(80)
  avatarUrl          String?    @map("avatar_url") @db.VarChar(500)
  locale             String?    @db.VarChar(10) // null = inherit Campus.locale, then Organization.locale
  timezone           String?    @db.VarChar(64)
  analyticsOptOut    Boolean    @default(false) @map("analytics_opt_out") // forced true for minors: no tracking of children (DPDP s.9, COPPA)
  anonymizedAt       DateTime?  @map("anonymized_at") @db.Timestamptz(6) // PII overwritten after an approved deletion request; row kept for legal retention
  mfaEnabled         Boolean    @default(false) @map("mfa_enabled")
  mfaMethod          MfaMethod? @map("mfa_method")
  mfaSecretEncrypted String?    @map("mfa_secret_encrypted") @db.Text // AES-256-GCM encrypted TOTP secret
  mfaRecoveryCodes   Json?      @map("mfa_recovery_codes") // array of bcrypt-hashed one-time codes
  failedLoginCount   Int        @default(0) @map("failed_login_count")
  lockedUntil        DateTime?  @map("locked_until") @db.Timestamptz(6)
  lastLoginAt        DateTime?  @map("last_login_at") @db.Timestamptz(6)
  lastLoginIp        String?    @map("last_login_ip") @db.VarChar(45)
  notificationPrefs  Json?      @map("notification_prefs") // per-channel opt-in/opt-out
  createdById        String?    @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt          DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt          DateTime?  @map("deleted_at") @db.Timestamptz(6)

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: Restrict)

  roles                           UserRole[]
  campuses                        UserCampus[]
  refreshTokens                   RefreshToken[]
  passwordResetTokens             PasswordResetToken[]
  invitationsSent                 Invitation[]              @relation("InvitationInvitedBy")
  invitationsAccepted             Invitation[]              @relation("InvitationAcceptedUser")
  dsrRequested                    DataSubjectRequest[]      @relation("DataSubjectRequestRequestedBy")
  dsrHandled                      DataSubjectRequest[]      @relation("DataSubjectRequestHandledBy")
  staff                           Staff? // profile when userType is STAFF
  student                         Student? // profile when userType is STUDENT
  guardian                        Guardian? // profile when userType is PARENT
  studentLeavesRequested          StudentLeaveRequest[]     @relation("StudentLeaveRequestedBy")
  studentLeavesReviewed           StudentLeaveRequest[]     @relation("StudentLeaveReviewedBy")
  fileAssets                      FileAsset[]
  importJobs                      ImportJob[]
  exportJobs                      ExportJob[]
  otpCodes                        OtpCode[]
  loginHistories                  LoginHistory[]
  auditLogs                       AuditLog[]
  apiKeys                         ApiKey[]
  consentRecords                  ConsentRecord[]
  studentNotes                    StudentNote[]
  studentStatusHistories          StudentStatusHistory[]
  admissionInquiries              AdmissionInquiry[]
  inquiryFollowUps                InquiryFollowUp[]
  admissionApplications           AdmissionApplication[]
  attendanceSessions              AttendanceSession[]
  leaveRequests                   LeaveRequest[]
  leaveApprovalSteps              LeaveApprovalStep[]
  examMarksEntered                ExamMark[]                @relation("ExamMarkEnteredBy")
  examMarksVerified               ExamMark[]                @relation("ExamMarkVerifiedBy")
  dayClosesClosed                 DayClose[]                @relation("DayCloseClosedBy")
  dayClosesVerified               DayClose[]                @relation("DayCloseVerifiedBy")
  certificateRequestsMade         CertificateRequest[]      @relation("CertificateRequestRequestedBy")
  certificateRequestsReviewed     CertificateRequest[]      @relation("CertificateRequestReviewedBy")
  reportCardRemarks               ReportCardRemark[]
  studentDiscountsApproved        StudentDiscount[]
  scholarshipApplicationsReviewed ScholarshipApplication[]
  scholarshipAwardsApproved       ScholarshipAward[]
  paymentOrders                   PaymentOrder[]
  paymentsReceived                Payment[]
  receiptsCancelled               Receipt[]
  refundsApproved                 Refund[]
  notifications                   Notification[]
  notificationPreferences         NotificationPreference[]
  announcementsAuthored           Announcement[]
  announcementRecipients          AnnouncementRecipient[]
  deviceTokens                    DeviceToken[]
  purchaseOrdersApproved          PurchaseOrder[]
  payrollRunsApproved             PayrollRun[]
  staffLoanAdvancesApproved       StaffLoanAdvance[]
  payrollAdjustmentsApproved      PayrollAdjustment[]
  certificatesIssued              IssuedCertificate[]
  savedReports                    SavedReport[]
  dashboardPreferences            DashboardPreference[]
  aiQueryLogs                     AiQueryLog[]
  reEvaluationsRequested          ExamReEvaluationRequest[] @relation("ReEvaluationRequestedBy")
  reEvaluationsReviewed           ExamReEvaluationRequest[] @relation("ReEvaluationReviewedBy")
  studentTransfers                StudentTransfer[]
  feeInvoiceAdjustments           FeeInvoiceAdjustment[]

  // A PARENT and a STUDENT login may share one phone / email, so uniqueness includes userType; login resolves by identifier + portal.
  // Platform users (organization_id IS NULL) and re-invites after a soft delete are handled by partial unique indexes
  // in the SQL migration (... WHERE deleted_at IS NULL).
  @@unique([organizationId, userType, email])
  @@unique([organizationId, userType, phone])
  @@index([organizationId, email])
  @@index([organizationId, phone])
  @@index([organizationId, userType, status])
  @@index([email])
  @@index([phone])
  @@map("users")
}

// Role: the seven system roles (organizationId null, isSystem true) or a tenant's custom role.
// SQL migration adds: CHECK (is_system = (organization_id IS NULL)).
model Role {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String?      @map("organization_id") @db.Uuid // null ONLY for system roles shared by all tenants
  key            String       @db.VarChar(50) // SUPER_ADMIN, ORG_ADMIN, PRINCIPAL, TEACHER, ACCOUNTANT, PARENT, STUDENT or custom e.g. LIBRARIAN
  name           String       @db.VarChar(80)
  description    String?      @db.VarChar(255)
  isSystem       Boolean      @default(false) @map("is_system") // system roles cannot be edited or deleted
  userType       UserType     @default(STAFF) @map("user_type") // which kind of user may hold the role
  status         RecordStatus @default(ACTIVE)
  createdById    String?      @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization Organization?    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  permissions  RolePermission[]
  users        UserRole[]
  invitations  Invitation[]

  // System role keys (organization_id IS NULL) are kept unique by a partial unique index in the SQL migration.
  @@unique([organizationId, key])
  @@index([organizationId, status])
  @@map("roles")
}

// Platform-level catalogue of permission keys in module.action form (students.create, fees.collect).
model Permission {
  id          String      @id @default(uuid()) @db.Uuid
  key         String      @unique @db.VarChar(80) // module.action
  resource    String      @db.VarChar(40) // part before the dot, e.g. students
  action      String      @db.VarChar(40) // part after the dot, e.g. create
  module      ModuleCode? // product module that owns the permission (plan gating)
  name        String      @db.VarChar(120)
  description String?     @db.VarChar(255)
  sortOrder   Int         @default(0) @map("sort_order")
  createdAt   DateTime    @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime    @updatedAt @map("updated_at") @db.Timestamptz(6)

  roles RolePermission[]

  @@index([module])
  @@index([resource])
  @@map("permissions")
}

// Permission granted to a role, with the data scope (all / campus / own / view).
model RolePermission {
  id             String          @id @default(uuid()) @db.Uuid
  organizationId String?         @map("organization_id") @db.Uuid // mirrors Role.organizationId; null for system roles
  roleId         String          @map("role_id") @db.Uuid
  permissionId   String          @map("permission_id") @db.Uuid
  scope          PermissionScope @default(ALL)
  createdAt      DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  role         Role          @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission    @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([organizationId, roleId])
  @@map("role_permissions")
}

// Role assigned to a user. Campus reach comes from UserCampus.
// The service (and a trigger in the SQL migration) verifies role.organization_id IS NULL OR role.organization_id = user_roles.organization_id.
model UserRole {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String?  @map("organization_id") @db.Uuid // null ONLY for PLATFORM users
  userId         String   @map("user_id") @db.Uuid
  roleId         String   @map("role_id") @db.Uuid
  assignedById   String?  @map("assigned_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  role         Role          @relation(fields: [roleId], references: [id], onDelete: Restrict)

  @@unique([userId, roleId])
  @@index([organizationId, roleId])
  @@index([organizationId, userId])
  @@map("user_roles")
}

// Campuses a user may work in (ORG_ADMIN sees all campuses without rows here).
model UserCampus {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  campusId       String   @map("campus_id") @db.Uuid
  isDefault      Boolean  @default(false) @map("is_default") // campus selected after login
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  campus       Campus       @relation(fields: [campusId], references: [id], onDelete: Cascade)

  @@unique([userId, campusId])
  @@index([organizationId, campusId])
  @@map("user_campuses")
}

// Rotating refresh token (30 days), stored as a SHA-256 hash. One family per login session.
model RefreshToken {
  id                String             @id @default(uuid()) @db.Uuid
  organizationId    String?            @map("organization_id") @db.Uuid // null for PLATFORM users
  userId            String             @map("user_id") @db.Uuid
  tokenHash         String             @unique @map("token_hash") @db.Char(64) // SHA-256 hex of the opaque token
  familyId          String             @map("family_id") @db.Uuid // same for every rotation of one login; reuse of a rotated token revokes the family
  replacedByTokenId String?            @map("replaced_by_token_id") @db.Uuid // next token in the rotation chain
  deviceId          String?            @map("device_id") @db.VarChar(100)
  deviceName        String?            @map("device_name") @db.VarChar(150)
  platform          DevicePlatform     @default(WEB)
  userAgent         String?            @map("user_agent") @db.VarChar(500)
  ipAddress         String?            @map("ip_address") @db.VarChar(45)
  expiresAt         DateTime           @map("expires_at") @db.Timestamptz(6)
  lastUsedAt        DateTime?          @map("last_used_at") @db.Timestamptz(6)
  revokedAt         DateTime?          @map("revoked_at") @db.Timestamptz(6)
  revokedReason     TokenRevokeReason? @map("revoked_reason")
  createdAt         DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([organizationId, userId])
  @@index([userId, revokedAt])
  @@index([familyId])
  @@index([expiresAt]) // cleanup job
  @@map("refresh_tokens")
}

// One-time code for OTP login, phone/email verification, MFA and consent verification.
model OtpCode {
  id             String     @id @default(uuid()) @db.Uuid
  organizationId String?    @map("organization_id") @db.Uuid // null when the tenant is not resolved yet
  userId         String?    @map("user_id") @db.Uuid
  identifier     String     @db.VarChar(255) // phone (E.164) or email the code was sent to
  channel        Channel
  purpose        OtpPurpose
  codeHash       String     @map("code_hash") @db.VarChar(100) // bcrypt hash of the 6-digit code
  attempts       Int        @default(0) @db.SmallInt
  maxAttempts    Int        @default(5) @map("max_attempts") @db.SmallInt
  expiresAt      DateTime   @map("expires_at") @db.Timestamptz(6)
  consumedAt     DateTime?  @map("consumed_at") @db.Timestamptz(6)
  ipAddress      String?    @map("ip_address") @db.VarChar(45)
  createdAt      DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User?         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([organizationId, identifier, purpose])
  @@index([identifier, purpose, createdAt])
  @@index([expiresAt]) // cleanup job
  @@map("otp_codes")
}

// Single-use password reset link token (hashed, short expiry).
model PasswordResetToken {
  id             String    @id @default(uuid()) @db.Uuid
  organizationId String?   @map("organization_id") @db.Uuid // null for PLATFORM users
  userId         String    @map("user_id") @db.Uuid
  tokenHash      String    @unique @map("token_hash") @db.Char(64)
  expiresAt      DateTime  @map("expires_at") @db.Timestamptz(6)
  usedAt         DateTime? @map("used_at") @db.Timestamptz(6)
  ipAddress      String?   @map("ip_address") @db.VarChar(45)
  userAgent      String?   @map("user_agent") @db.VarChar(500)
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([organizationId, userId])
  @@map("password_reset_tokens")
}

// Invitation sent to a staff member, parent or student to create their login.
model Invitation {
  id             String           @id @default(uuid()) @db.Uuid
  organizationId String           @map("organization_id") @db.Uuid
  email          String?          @db.VarChar(255)
  phone          String?          @db.VarChar(20)
  userType       UserType         @map("user_type")
  roleId         String           @map("role_id") @db.Uuid
  campusIds      String[]         @map("campus_ids") @db.Uuid // campuses granted on acceptance
  linkedEntity   String?          @map("linked_entity") @db.VarChar(20) // Staff, Guardian or Student profile to link on acceptance
  linkedEntityId String?          @map("linked_entity_id") @db.Uuid
  tokenHash      String           @unique @map("token_hash") @db.Char(64)
  status         InvitationStatus @default(PENDING)
  message        String?          @db.VarChar(500)
  expiresAt      DateTime         @map("expires_at") @db.Timestamptz(6)
  acceptedAt     DateTime?        @map("accepted_at") @db.Timestamptz(6)
  invitedById    String?          @map("invited_by_id") @db.Uuid
  acceptedUserId String?          @map("accepted_user_id") @db.Uuid
  createdAt      DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  role         Role         @relation(fields: [roleId], references: [id], onDelete: Restrict)
  invitedBy    User?        @relation("InvitationInvitedBy", fields: [invitedById], references: [id], onDelete: SetNull)
  acceptedUser User?        @relation("InvitationAcceptedUser", fields: [acceptedUserId], references: [id], onDelete: SetNull)

  @@index([organizationId, status, createdAt])
  @@index([organizationId, email])
  @@index([organizationId, phone])
  @@map("invitations")
}

// Every login attempt (success or failure). Append-only: no updatedAt / deletedAt.
model LoginHistory {
  id             String         @id @default(uuid()) @db.Uuid
  organizationId String?        @map("organization_id") @db.Uuid // null when the tenant could not be resolved or for PLATFORM users
  userId         String?        @map("user_id") @db.Uuid // null when the identifier matched no account
  identifier     String         @db.VarChar(255) // email or phone that was typed
  method         LoginMethod
  result         LoginResult
  failureReason  String?        @map("failure_reason") @db.VarChar(100)
  platform       DevicePlatform @default(WEB)
  ipAddress      String?        @map("ip_address") @db.VarChar(45)
  userAgent      String?        @map("user_agent") @db.VarChar(500)
  geoCountry     String?        @map("geo_country") @db.Char(2)
  geoCity        String?        @map("geo_city") @db.VarChar(100)
  requestId      String?        @map("request_id") @db.VarChar(64)
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User?         @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([organizationId, userId, createdAt])
  @@index([organizationId, createdAt])
  @@index([identifier, createdAt]) // rate limiting: 5 attempts per 15 min per account + IP
  @@map("login_histories")
}

// Immutable trail of who changed what. Append-only: no updatedAt / deletedAt.
model AuditLog {
  id                 String         @id @default(uuid()) @db.Uuid
  organizationId     String?        @map("organization_id") @db.Uuid // null only for platform-console actions
  campusId           String?        @map("campus_id") @db.Uuid
  actorType          AuditActorType @default(USER) @map("actor_type")
  actorUserId        String?        @map("actor_user_id") @db.Uuid
  actorLabel         String?        @map("actor_label") @db.VarChar(200) // name + role key frozen at write time (survives user deletion)
  actorRoleKeys      String[]       @map("actor_role_keys")
  impersonatorUserId String?        @map("impersonator_user_id") @db.Uuid // SUPER_ADMIN user id when actorType is IMPERSONATION (no FK)
  outcome            AuditOutcome   @default(SUCCESS)
  reason             String?        @db.VarChar(500) // mandatory for money overrides: receipt cancel, late-fee waiver, write-off
  isSensitiveRead    Boolean        @default(false) @map("is_sensitive_read") // disclosure log (FERPA): a read of sensitive data
  prevHash           String?        @map("prev_hash") @db.Char(64)
  rowHash            String?        @map("row_hash") @db.Char(64) // SHA-256 chain per organization (tamper evidence)
  apiKeyId           String?        @map("api_key_id") @db.Uuid
  action             String         @db.VarChar(80) // permission-style verb, e.g. students.update, fees.receipt.cancel
  entityType         String         @map("entity_type") @db.VarChar(60) // model name, e.g. Student
  entityId           String?        @map("entity_id") @db.Uuid
  entityLabel        String?        @map("entity_label") @db.VarChar(200) // human-readable snapshot, e.g. "Aarav Sharma (BF-2027-0142)"
  before             Json? // state before the change (sensitive fields masked)
  after              Json? // state after the change (sensitive fields masked)
  changedFields      String[]       @map("changed_fields")
  metadata           Json?
  ipAddress          String?        @map("ip_address") @db.VarChar(45)
  userAgent          String?        @map("user_agent") @db.VarChar(500)
  requestId          String?        @map("request_id") @db.VarChar(64) // same id as in the API error envelope and Pino logs
  createdAt          DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus?       @relation(fields: [campusId], references: [id], onDelete: SetNull)
  actor        User?         @relation(fields: [actorUserId], references: [id], onDelete: SetNull)
  apiKey       ApiKey?       @relation(fields: [apiKeyId], references: [id], onDelete: SetNull)

  @@index([organizationId, createdAt])
  @@index([organizationId, campusId, createdAt])
  @@index([organizationId, entityType, entityId])
  @@index([organizationId, actorUserId, createdAt])
  @@index([organizationId, action, createdAt])
  @@index([requestId])
  @@map("audit_logs")
}

// API key for Enterprise integrations; only the hash is stored, the prefix identifies the key.
model ApiKey {
  id              String       @id @default(uuid()) @db.Uuid
  organizationId  String       @map("organization_id") @db.Uuid
  name            String       @db.VarChar(100)
  keyPrefix       String       @map("key_prefix") @db.VarChar(16) // first characters shown in the UI, e.g. ef_live_8f3a
  keyHash         String       @unique @map("key_hash") @db.Char(64) // SHA-256 hex of the full key
  scopes          String[] // permission keys the key may use
  allowedIps      String[]     @map("allowed_ips") // optional CIDR allow-list
  rateLimitPerMin Int          @default(100) @map("rate_limit_per_min")
  status          RecordStatus @default(ACTIVE)
  lastUsedAt      DateTime?    @map("last_used_at") @db.Timestamptz(6)
  lastUsedIp      String?      @map("last_used_ip") @db.VarChar(45)
  expiresAt       DateTime?    @map("expires_at") @db.Timestamptz(6)
  revokedAt       DateTime?    @map("revoked_at") @db.Timestamptz(6)
  createdById     String?      @map("created_by_id") @db.Uuid
  createdAt       DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdBy    User?        @relation(fields: [createdById], references: [id], onDelete: SetNull)
  auditLogs    AuditLog[]

  @@unique([organizationId, name])
  @@index([organizationId, status])
  @@map("api_keys")
}

// Versioned text of a privacy notice / policy per language; the exact notice a consent refers to.
model PolicyDocument {
  id             String      @id @default(uuid()) @db.Uuid
  organizationId String?     @map("organization_id") @db.Uuid // null = EduFlow platform policy shown to every tenant
  consentType    ConsentType @map("consent_type")
  version        String      @db.VarChar(20)
  language       String      @default("en") @db.VarChar(10)
  title          String      @db.VarChar(200)
  body           String      @db.Text
  contentHash    String      @map("content_hash") @db.Char(64) // SHA-256 of body
  effectiveFrom  DateTime    @map("effective_from") @db.Timestamptz(6)
  retiredAt      DateTime?   @map("retired_at") @db.Timestamptz(6)
  createdAt      DateTime    @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime    @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization   Organization?   @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  consentRecords ConsentRecord[]

  // Platform rows (organization_id IS NULL) are kept unique by a partial unique index in the SQL migration.
  @@unique([organizationId, consentType, version, language])
  @@index([organizationId, consentType, effectiveFrom])
  @@map("policy_documents")
}

// Personal-data breach register: scope, containment and notification times (GDPR 72 h, NDB scheme, DPDP Board).
model DataBreachIncident {
  id                   String         @id @default(uuid()) @db.Uuid
  organizationId       String?        @map("organization_id") @db.Uuid // null = platform-wide incident
  incidentNo           String         @unique @map("incident_no") @db.VarChar(30)
  title                String         @db.VarChar(200)
  description          String         @db.Text
  severity             BreachSeverity
  status               BreachStatus   @default(DETECTED)
  dataCategories       String[]       @map("data_categories")
  affectedSubjectCount Int?           @map("affected_subject_count")
  involvesChildrenData Boolean        @default(false) @map("involves_children_data")
  occurredAt           DateTime?      @map("occurred_at") @db.Timestamptz(6)
  detectedAt           DateTime       @map("detected_at") @db.Timestamptz(6)
  containedAt          DateTime?      @map("contained_at") @db.Timestamptz(6)
  regulatorNotifyDueAt DateTime?      @map("regulator_notify_due_at") @db.Timestamptz(6)
  regulatorNotifiedAt  DateTime?      @map("regulator_notified_at") @db.Timestamptz(6)
  tenantNotifiedAt     DateTime?      @map("tenant_notified_at") @db.Timestamptz(6)
  subjectsNotifiedAt   DateTime?      @map("subjects_notified_at") @db.Timestamptz(6)
  regulations          String[] // DPDP, GDPR, NDB, PDPL ...
  rootCause            String?        @map("root_cause") @db.Text
  remediation          String?        @db.Text
  reportedById         String?        @map("reported_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt            DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: Restrict)

  @@index([organizationId, status, detectedAt])
  @@map("data_breach_incidents")
}

// Proof of consent (DPDP / GDPR / COPPA): who agreed to what, for which child, and how it was verified.
model ConsentRecord {
  id                    String                     @id @default(uuid()) @db.Uuid
  organizationId        String                     @map("organization_id") @db.Uuid
  consentType           ConsentType                @map("consent_type")
  status                ConsentStatus              @default(GRANTED)
  givenByUserId         String?                    @map("given_by_user_id") @db.Uuid // login that gave the consent
  guardianId            String?                    @map("guardian_id") @db.Uuid // parent giving consent for a child
  studentId             String?                    @map("student_id") @db.Uuid // the child whose data is covered
  policyVersion         String                     @map("policy_version") @db.VarChar(20) // version of the notice shown
  policyDocumentId      String?                    @map("policy_document_id") @db.Uuid // exact notice text + language that was shown
  inquiryId             String?                    @map("inquiry_id") @db.Uuid // consent collected from an admission lead
  subjectIsMinor        Boolean                    @default(false) @map("subject_is_minor")
  verificationReference String?                    @map("verification_reference") @db.VarChar(100) // DigiLocker transaction / signed-form id
  otpCodeId             String?                    @map("otp_code_id") @db.Uuid // OtpCode used for verification (no FK; OTP rows are purged)
  withdrawnByUserId     String?                    @map("withdrawn_by_user_id") @db.Uuid // User id (audit only, no FK)
  withdrawalReason      String?                    @map("withdrawal_reason") @db.VarChar(255)
  noticeLanguage        String                     @default("en") @map("notice_language") @db.VarChar(10)
  purposes              Json? // itemised purposes shown in the notice
  regulation            String?                    @db.VarChar(20) // DPDP, GDPR, COPPA, FERPA, PDPL, APP
  verificationMethod    ConsentVerificationMethod? @map("verification_method")
  verifiedAt            DateTime?                  @map("verified_at") @db.Timestamptz(6)
  evidenceFileId        String?                    @map("evidence_file_id") @db.Uuid // scanned signed form
  ipAddress             String?                    @map("ip_address") @db.VarChar(45)
  userAgent             String?                    @map("user_agent") @db.VarChar(500)
  grantedAt             DateTime                   @default(now()) @map("granted_at") @db.Timestamptz(6)
  withdrawnAt           DateTime?                  @map("withdrawn_at") @db.Timestamptz(6)
  expiresAt             DateTime?                  @map("expires_at") @db.Timestamptz(6)
  createdAt             DateTime                   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime                   @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization   Organization      @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  givenByUser    User?             @relation(fields: [givenByUserId], references: [id], onDelete: SetNull)
  guardian       Guardian?         @relation(fields: [guardianId], references: [id], onDelete: SetNull)
  student        Student?          @relation(fields: [studentId], references: [id], onDelete: SetNull)
  evidenceFile   FileAsset?        @relation(fields: [evidenceFileId], references: [id], onDelete: SetNull)
  policyDocument PolicyDocument?   @relation(fields: [policyDocumentId], references: [id], onDelete: Restrict)
  inquiry        AdmissionInquiry? @relation(fields: [inquiryId], references: [id], onDelete: SetNull)

  @@index([organizationId, studentId, consentType])
  @@index([organizationId, guardianId, consentType])
  @@index([organizationId, givenByUserId])
  @@index([organizationId, consentType, status])
  @@map("consent_records")
}

// Privacy request from a data subject: access, export, correction or deletion of personal data.
model DataSubjectRequest {
  id                         String                     @id @default(uuid()) @db.Uuid
  organizationId             String                     @map("organization_id") @db.Uuid
  requestNo                  String                     @map("request_no") @db.VarChar(30)
  requestType                DataSubjectRequestType     @map("request_type")
  status                     DataSubjectRequestStatus   @default(RECEIVED)
  subjectType                DataSubjectType            @map("subject_type")
  subjectId                  String                     @map("subject_id") @db.Uuid // id of the User / Student / Guardian / Staff row
  requestedById              String?                    @map("requested_by_id") @db.Uuid // e.g. the parent asking on behalf of a child
  requesterName              String?                    @map("requester_name") @db.VarChar(160) // requester without a login (former parent, alumni)
  requesterEmail             String?                    @map("requester_email") @db.VarChar(255)
  requesterPhone             String?                    @map("requester_phone") @db.VarChar(20)
  requesterRelation          String?                    @map("requester_relation") @db.VarChar(40)
  channel                    String?                    @db.VarChar(20) // PORTAL | EMAIL | LETTER | PHONE
  regulation                 String?                    @db.VarChar(20) // DPDP, GDPR, FERPA, PDPL, APP
  description                String?                    @db.Text
  receivedAt                 DateTime                   @default(now()) @map("received_at") @db.Timestamptz(6)
  acknowledgedAt             DateTime?                  @map("acknowledged_at") @db.Timestamptz(6)
  dueDate                    DateTime                   @map("due_date") @db.Date // statutory deadline
  extendedDueDate            DateTime?                  @map("extended_due_date") @db.Date // GDPR allows +2 months
  extensionReason            String?                    @map("extension_reason") @db.VarChar(500)
  identityVerificationMethod ConsentVerificationMethod? @map("identity_verification_method")
  identityVerifiedAt         DateTime?                  @map("identity_verified_at") @db.Timestamptz(6)
  actionsTaken               Json?                      @map("actions_taken") // [{ entity, action: ERASED|ANONYMISED|RETAINED, legalBasis }]
  handledById                String?                    @map("handled_by_id") @db.Uuid
  resolutionNotes            String?                    @map("resolution_notes") @db.Text
  rejectionReason            String?                    @map("rejection_reason") @db.VarChar(500)
  exportFileId               String?                    @map("export_file_id") @db.Uuid // data package for ACCESS / EXPORT requests
  completedAt                DateTime?                  @map("completed_at") @db.Timestamptz(6)
  createdAt                  DateTime                   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt                  DateTime                   @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  requestedBy  User?        @relation("DataSubjectRequestRequestedBy", fields: [requestedById], references: [id], onDelete: SetNull)
  handledBy    User?        @relation("DataSubjectRequestHandledBy", fields: [handledById], references: [id], onDelete: SetNull)
  exportFile   FileAsset?   @relation(fields: [exportFileId], references: [id], onDelete: SetNull)

  @@unique([organizationId, requestNo])
  @@index([organizationId, status, dueDate])
  @@index([organizationId, subjectType, subjectId])
  @@map("data_subject_requests")
}
```

## Academics: years, courses, batches, subjects, calendar

File `server/prisma/schema/03-academics.prisma` — 11 models, 7 enums.

```prisma
// 03-academics: sessions, terms, courses (class / program), batches (section / batch),
// subjects, teaching assignments, rooms, holidays and the institute calendar.

enum AcademicYearStatus {
  PLANNED
  ACTIVE
  CLOSED // locked: no more attendance, marks or enrollment changes
}

enum BatchStatus {
  PLANNED
  ACTIVE
  COMPLETED
  CANCELLED
}

enum SubjectType {
  THEORY
  PRACTICAL
  LANGUAGE
  CO_CURRICULAR
  TEST_SERIES
}

enum RoomType {
  CLASSROOM
  LAB
  LIBRARY
  HALL
  OFFICE
  STAFF_ROOM
  OTHER
}

enum HolidayType {
  PUBLIC
  FESTIVAL
  VACATION
  WEEKLY_OFF
  EMERGENCY
  OTHER
}

enum CalendarEventType {
  ACADEMIC
  EXAM
  PTM // parent-teacher meeting
  CULTURAL
  SPORTS
  MEETING
  ADMISSION
  OTHER
}

enum PtmBookingStatus {
  BOOKED
  ATTENDED
  NO_SHOW
  CANCELLED
}

// Academic year / session, e.g. 2027-28. Organization-wide; exactly one row is current.
// Enforced by a partial unique index in the SQL migration: UNIQUE (organization_id) WHERE is_current AND deleted_at IS NULL
model AcademicYear {
  id             String             @id @default(uuid()) @db.Uuid
  organizationId String             @map("organization_id") @db.Uuid
  name           String             @db.VarChar(30) // e.g. 2027-28
  startDate      DateTime           @map("start_date") @db.Date
  endDate        DateTime           @map("end_date") @db.Date
  isCurrent      Boolean            @default(false) @map("is_current") // single current year: service layer + partial unique index
  status         AcademicYearStatus @default(PLANNED)
  closedAt       DateTime?          @map("closed_at") @db.Timestamptz(6)
  createdAt      DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?          @map("deleted_at") @db.Timestamptz(6)

  organization            Organization             @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  terms                   Term[]
  batches                 Batch[]
  enrollments             Enrollment[]
  holidays                Holiday[]
  calendarEvents          CalendarEvent[]
  admissionInquiries      AdmissionInquiry[]
  admissionApplications   AdmissionApplication[]
  attendanceSessions      AttendanceSession[]
  leaveBalances           LeaveBalance[]
  leaveRequests           LeaveRequest[]
  timetableEntries        TimetableEntry[]
  homework                Homework[]
  exams                   Exam[]
  reportCards             ReportCard[]
  feeStructures           FeeStructure[]
  studentFeeAssignments   StudentFeeAssignment[]
  feeInvoices             FeeInvoice[]
  studentDiscounts        StudentDiscount[]
  scholarships            Scholarship[]
  scholarshipApplications ScholarshipApplication[]
  scholarshipAwards       ScholarshipAward[]
  transportAssignments    TransportAssignment[]
  hostelAllocations       HostelAllocation[]
  studentRiskScores       StudentRiskScore[]
  classSessions           ClassSession[]
  studyMaterials          StudyMaterial[]

  @@unique([organizationId, name])
  @@index([organizationId, isCurrent])
  @@index([organizationId, startDate])
  @@map("academic_years")
}

// Term / semester / quarter inside an academic year (used by exams, fees and report cards).
model Term {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  academicYearId String       @map("academic_year_id") @db.Uuid
  name           String       @db.VarChar(60) // Term 1, Semester 2
  sortOrder      Int          @default(0) @map("sort_order")
  startDate      DateTime     @map("start_date") @db.Date
  endDate        DateTime     @map("end_date") @db.Date
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  academicYear AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  exams        Exam[]
  reportCards  ReportCard[]

  @@unique([organizationId, academicYearId, name])
  @@index([organizationId, academicYearId, sortOrder])
  @@map("terms")
}

// Grade or program: "Class 10" in a school, "JEE Main 2028" in a coaching institute.
model Course {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  campusId       String?      @map("campus_id") @db.Uuid // null = offered at every campus
  name           String       @db.VarChar(120)
  code           String       @db.VarChar(30)
  description    String?      @db.Text
  level          Int?         @db.SmallInt // ordering of grades (Class 1 = 1 ... Class 12 = 12); drives promotion to the next course
  stream         String?      @db.VarChar(60) // Science, Commerce, Arts, JEE, NEET
  board          String?      @db.VarChar(60) // CBSE, ICSE, State Board, IB
  durationMonths Int?         @map("duration_months") @db.SmallInt // coaching programs
  sortOrder      Int          @default(0) @map("sort_order")
  status         RecordStatus @default(ACTIVE)
  customFields   Json?        @map("custom_fields") // cached CustomFieldValue rows
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization          Organization           @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus                Campus?                @relation(fields: [campusId], references: [id], onDelete: Restrict)
  subjects              CourseSubject[]
  batches               Batch[]
  enrollments           Enrollment[]
  admissionInquiries    AdmissionInquiry[]
  admissionApplications AdmissionApplication[]
  feeStructures         FeeStructure[]
  students              Student[]
  studyMaterials        StudyMaterial[]

  @@unique([organizationId, code])
  @@index([organizationId, campusId, status])
  @@index([organizationId, sortOrder])
  @@map("courses")
}

// Teaching group of a course in one academic year: "Section 10-A" or "Morning Batch M1".
model Batch {
  id             String      @id @default(uuid()) @db.Uuid
  organizationId String      @map("organization_id") @db.Uuid
  campusId       String      @map("campus_id") @db.Uuid
  academicYearId String      @map("academic_year_id") @db.Uuid
  courseId       String      @map("course_id") @db.Uuid
  name           String      @db.VarChar(80) // 10-A, Morning Batch M1
  code           String      @db.VarChar(30)
  capacity       Int? // max active enrollments; null = no cap
  classTeacherId String?     @map("class_teacher_id") @db.Uuid // Staff id of the class teacher / batch in-charge
  roomId         String?     @map("room_id") @db.Uuid // home room
  shift          Shift       @default(FULL_DAY)
  startTime      String?     @map("start_time") @db.VarChar(5) // HH:mm in the campus timezone
  endTime        String?     @map("end_time") @db.VarChar(5) // HH:mm in the campus timezone
  daysOfWeek     WeekDay[]   @map("days_of_week") // days the batch meets (coaching: MON/WED/FRI)
  startDate      DateTime?   @map("start_date") @db.Date // coaching batches may not follow the academic year dates
  endDate        DateTime?   @map("end_date") @db.Date
  medium         String?     @db.VarChar(30) // language of instruction
  status         BatchStatus @default(ACTIVE)
  customFields   Json?       @map("custom_fields") // cached CustomFieldValue rows
  createdAt      DateTime    @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime    @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?   @map("deleted_at") @db.Timestamptz(6)

  organization          Organization           @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus                Campus                 @relation(fields: [campusId], references: [id], onDelete: Restrict)
  academicYear          AcademicYear           @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  course                Course                 @relation(fields: [courseId], references: [id], onDelete: Restrict)
  classTeacher          Staff?                 @relation(fields: [classTeacherId], references: [id], onDelete: SetNull)
  room                  Room?                  @relation(fields: [roomId], references: [id], onDelete: SetNull)
  subjectTeachers       BatchSubjectTeacher[]
  enrollments           Enrollment[]
  currentStudents       Student[]
  admissionApplications AdmissionApplication[]
  attendanceSessions    AttendanceSession[]
  attendanceRecords     AttendanceRecord[]
  studentLeaveRequests  StudentLeaveRequest[]
  timetableEntries      TimetableEntry[]
  homework              Homework[]
  examSchedules         ExamSchedule[]
  reportCards           ReportCard[]
  feeStructures         FeeStructure[]
  studentTransfersFrom  StudentTransfer[]      @relation("StudentTransferFromBatch")
  studentTransfersTo    StudentTransfer[]      @relation("StudentTransferToBatch")
  admissionInquiries    AdmissionInquiry[]
  classSessions         ClassSession[]
  examMarks             ExamMark[]

  @@unique([id, organizationId]) // target of composite tenant-safe foreign keys
  @@unique([organizationId, campusId, academicYearId, code])
  @@index([organizationId, campusId, academicYearId, status])
  @@index([organizationId, courseId, academicYearId])
  @@index([organizationId, classTeacherId])
  @@map("batches")
}

// Subject master, e.g. Mathematics, Physics. Shared by all campuses of the organization.
model Subject {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  name           String       @db.VarChar(100)
  code           String       @db.VarChar(30)
  subjectType    SubjectType  @default(THEORY) @map("subject_type")
  description    String?      @db.VarChar(500)
  color          String?      @db.VarChar(7) // hex colour for the timetable grid
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization       Organization          @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  courses            CourseSubject[]
  batchTeachers      BatchSubjectTeacher[]
  teachers           TeacherSubject[]
  attendanceSessions AttendanceSession[]
  timetableEntries   TimetableEntry[]
  homework           Homework[]
  examSchedules      ExamSchedule[]
  reportCardRemarks  ReportCardRemark[]
  books              Book[]
  classSessions      ClassSession[]
  studyMaterials     StudyMaterial[]
  examMarks          ExamMark[]

  @@unique([organizationId, code])
  @@index([organizationId, status, name])
  @@map("subjects")
}

// Subject taught in a course (curriculum), with elective flag and weekly period count.
model CourseSubject {
  id                      String   @id @default(uuid()) @db.Uuid
  organizationId          String   @map("organization_id") @db.Uuid
  courseId                String   @map("course_id") @db.Uuid
  subjectId               String   @map("subject_id") @db.Uuid
  isElective              Boolean  @default(false) @map("is_elective") // students choose electives at enrollment
  electiveGroup           String?  @map("elective_group") @db.VarChar(40) // subjects sharing a group are alternatives, e.g. LANG2
  electiveGroupMinChoices Int?     @map("elective_group_min_choices") @db.SmallInt // same value on every row of the group
  electiveGroupMaxChoices Int?     @map("elective_group_max_choices") @db.SmallInt
  includeInTotal          Boolean  @default(true) @map("include_in_total") // false = graded only, left out of percentage and rank
  isAdditional            Boolean  @default(false) @map("is_additional") // optional 6th subject (best-of-five rules)
  defaultMaxMarks         Decimal? @map("default_max_marks") @db.Decimal(6, 2)
  defaultPassMarks        Decimal? @map("default_pass_marks") @db.Decimal(6, 2)
  weeklyPeriods           Int?     @map("weekly_periods") @db.SmallInt // target periods per week for the timetable
  creditHours             Decimal? @map("credit_hours") @db.Decimal(4, 1) // colleges
  sortOrder               Int      @default(0) @map("sort_order") // order on report cards
  createdAt               DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt               DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  course       Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  subject      Subject      @relation(fields: [subjectId], references: [id], onDelete: Restrict)

  @@unique([organizationId, courseId, subjectId])
  @@index([organizationId, subjectId])
  @@map("course_subjects")
}

// Which teacher teaches which subject in which batch; drives the TEACHER "own batches" data scope.
model BatchSubjectTeacher {
  id             String    @id @default(uuid()) @db.Uuid
  organizationId String    @map("organization_id") @db.Uuid
  campusId       String    @map("campus_id") @db.Uuid
  batchId        String    @map("batch_id") @db.Uuid
  subjectId      String    @map("subject_id") @db.Uuid
  staffId        String    @map("staff_id") @db.Uuid
  isPrimary      Boolean   @default(true) @map("is_primary") // false = co-teacher / assistant
  effectiveFrom  DateTime? @map("effective_from") @db.Date
  effectiveTo    DateTime? @map("effective_to") @db.Date
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus       Campus       @relation(fields: [campusId], references: [id], onDelete: Restrict)
  batch        Batch        @relation(fields: [batchId], references: [id], onDelete: Cascade)
  subject      Subject      @relation(fields: [subjectId], references: [id], onDelete: Restrict)
  staff        Staff        @relation(fields: [staffId], references: [id], onDelete: Restrict)

  @@unique([organizationId, batchId, subjectId, staffId])
  @@index([organizationId, staffId])
  @@index([organizationId, campusId, batchId])
  @@map("batch_subject_teachers")
}

// Physical room of a campus (classroom, lab, hall) used by batches and the timetable.
model Room {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  campusId       String       @map("campus_id") @db.Uuid
  name           String       @db.VarChar(80)
  building       String?      @db.VarChar(80)
  floor          String?      @db.VarChar(20)
  roomType       RoomType     @default(CLASSROOM) @map("room_type")
  capacity       Int?
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization     Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus           Campus            @relation(fields: [campusId], references: [id], onDelete: Restrict)
  batches          Batch[]
  timetableEntries TimetableEntry[]
  substitutions    Substitution[]
  examSchedules    ExamSchedule[]
  assetAssignments AssetAssignment[]
  classSessions    ClassSession[]

  @@unique([organizationId, campusId, name])
  @@index([organizationId, campusId, roomType, status])
  @@map("rooms")
}

// Holiday or vacation (one day or a date range); attendance is not expected on these dates.
model Holiday {
  id             String      @id @default(uuid()) @db.Uuid
  organizationId String      @map("organization_id") @db.Uuid
  campusId       String?     @map("campus_id") @db.Uuid // null = all campuses
  academicYearId String?     @map("academic_year_id") @db.Uuid
  name           String      @db.VarChar(120)
  holidayType    HolidayType @default(PUBLIC) @map("holiday_type")
  startDate      DateTime    @map("start_date") @db.Date
  endDate        DateTime    @map("end_date") @db.Date // same as startDate for a single day
  appliesTo      Audience    @default(ALL) @map("applies_to") // ALL, STAFF or STUDENTS
  description    String?     @db.VarChar(500)
  createdById    String?     @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt      DateTime    @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime    @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?   @map("deleted_at") @db.Timestamptz(6)

  organization Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus       Campus?       @relation(fields: [campusId], references: [id], onDelete: Cascade)
  academicYear AcademicYear? @relation(fields: [academicYearId], references: [id], onDelete: SetNull)

  @@index([organizationId, campusId, startDate])
  @@index([organizationId, startDate, endDate])
  @@map("holidays")
}

// Institute calendar entry: PTM, exam window, sports day, staff meeting.
model CalendarEvent {
  id             String            @id @default(uuid()) @db.Uuid
  organizationId String            @map("organization_id") @db.Uuid
  campusId       String?           @map("campus_id") @db.Uuid // null = all campuses
  academicYearId String?           @map("academic_year_id") @db.Uuid
  title          String            @db.VarChar(150)
  description    String?           @db.Text
  eventType      CalendarEventType @default(OTHER) @map("event_type")
  startAt        DateTime          @map("start_at") @db.Timestamptz(6)
  endAt          DateTime          @map("end_at") @db.Timestamptz(6)
  isAllDay       Boolean           @default(false) @map("is_all_day")
  location       String?           @db.VarChar(150)
  audience       Audience          @default(ALL)
  batchIds       String[]          @map("batch_ids") @db.Uuid // empty = every batch in scope; otherwise only these batches
  color          String?           @db.VarChar(7)
  isPublished    Boolean           @default(true) @map("is_published") // drafts are visible to staff with calendar.manage only
  createdById    String?           @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt      DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?         @map("deleted_at") @db.Timestamptz(6)

  organization Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus       Campus?       @relation(fields: [campusId], references: [id], onDelete: Cascade)
  academicYear AcademicYear? @relation(fields: [academicYearId], references: [id], onDelete: SetNull)
  ptmBookings  PtmBooking[]

  @@index([organizationId, campusId, startAt])
  @@index([organizationId, eventType, startAt])
  @@map("calendar_events")
}

// A parent's slot with one teacher in a PTM calendar event, with attendance and notes.
model PtmBooking {
  id              String           @id @default(uuid()) @db.Uuid
  organizationId  String           @map("organization_id") @db.Uuid
  campusId        String           @map("campus_id") @db.Uuid
  calendarEventId String           @map("calendar_event_id") @db.Uuid
  studentId       String           @map("student_id") @db.Uuid
  guardianId      String?          @map("guardian_id") @db.Uuid
  staffId         String           @map("staff_id") @db.Uuid
  slotStart       DateTime         @map("slot_start") @db.Timestamptz(6)
  slotEnd         DateTime         @map("slot_end") @db.Timestamptz(6)
  status          PtmBookingStatus @default(BOOKED)
  teacherNotes    String?          @map("teacher_notes") @db.Text
  parentFeedback  String?          @map("parent_feedback") @db.VarChar(1000)
  createdAt       DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization  Organization  @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus        Campus        @relation(fields: [campusId], references: [id], onDelete: Restrict)
  calendarEvent CalendarEvent @relation(fields: [calendarEventId], references: [id], onDelete: Cascade)
  student       Student       @relation(fields: [studentId], references: [id], onDelete: Restrict)
  guardian      Guardian?     @relation(fields: [guardianId], references: [id], onDelete: SetNull)
  staff         Staff         @relation(fields: [staffId], references: [id], onDelete: Restrict)

  @@unique([organizationId, calendarEventId, staffId, slotStart])
  @@index([organizationId, studentId])
  @@index([organizationId, calendarEventId, status])
  @@index([organizationId, campusId, slotStart])
  @@map("ptm_bookings")
}
```

## People: staff, students, guardians, admissions

File `server/prisma/schema/04-people.prisma` — 19 models, 22 enums.

```prisma
// 04-people: staff and teachers, students, guardians, enrollments and the
// admission funnel (inquiry -> follow-ups -> application -> student).

enum StaffType {
  TEACHING
  NON_TEACHING
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
  VISITING
  INTERN
}

enum StaffStatus {
  ACTIVE
  ON_LEAVE
  SUSPENDED
  RESIGNED
  TERMINATED
  RETIRED
}

enum StaffDocumentType {
  ID_PROOF
  ADDRESS_PROOF
  QUALIFICATION
  EXPERIENCE_LETTER
  APPOINTMENT_LETTER
  CONTRACT
  POLICE_VERIFICATION
  BANK_PROOF
  PHOTO
  OTHER
}

enum StudentStatus {
  ACTIVE
  INACTIVE // temporarily not attending (long leave, fee hold)
  SUSPENDED
  GRADUATED // completed the final course; alumni
  TRANSFERRED // left with a transfer certificate
  DROPPED_OUT
  EXPELLED
}

// Reservation / social category used in Indian admissions and scholarship reports.
enum StudentCategory {
  GENERAL
  OBC
  SC
  ST
  EWS
  OTHER
}

enum GuardianRelation {
  FATHER
  MOTHER
  GRANDFATHER
  GRANDMOTHER
  BROTHER
  SISTER
  UNCLE
  AUNT
  LEGAL_GUARDIAN
  OTHER
}

enum EnrollmentStatus {
  ACTIVE
  PROMOTED // moved to the next course at year end
  COMPLETED // finished the course / batch
  DETAINED // repeats the same course next year
  TRANSFERRED // moved to another batch or campus mid-year
  WITHDRAWN
  CANCELLED
}

enum StudentDocumentType {
  BIRTH_CERTIFICATE
  TRANSFER_CERTIFICATE
  MARKSHEET
  ID_PROOF
  ADDRESS_PROOF
  PHOTO
  CATEGORY_CERTIFICATE
  INCOME_CERTIFICATE
  MEDICAL
  OTHER
}

enum StudentNoteType {
  GENERAL
  ACADEMIC
  BEHAVIOUR
  MEDICAL
  COUNSELLING
  FEE
  ACHIEVEMENT
}

enum LeadSource {
  WALK_IN
  WEBSITE
  PHONE_CALL
  WHATSAPP
  REFERRAL
  SOCIAL_MEDIA
  GOOGLE_ADS
  NEWSPAPER
  EVENT
  PARTNER
  OTHER
}

enum InquiryStage {
  NEW
  CONTACTED
  FOLLOW_UP
  VISIT_SCHEDULED
  VISITED
  DEMO_SCHEDULED // coaching: free demo class booked
  DEMO_ATTENDED
  APPLICATION_STARTED
  CONVERTED
  LOST
  JUNK
}

enum LeadPriority {
  HOT
  WARM
  COLD
}

enum FollowUpType {
  CALL
  WHATSAPP
  SMS
  EMAIL
  VISIT
  MEETING
  DEMO_CLASS
  NOTE
}

enum FollowUpOutcome {
  INTERESTED
  NOT_INTERESTED
  NO_RESPONSE
  CALL_BACK_LATER
  VISIT_BOOKED
  DEMO_BOOKED
  APPLICATION_SHARED
  CONVERTED
}

enum ApplicationStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  DOCUMENTS_PENDING
  TEST_SCHEDULED
  INTERVIEW_SCHEDULED
  APPROVED
  WAITLISTED
  REJECTED
  WITHDRAWN
  ENROLLED // converted into a Student + Enrollment
}

enum ApplicationChannel {
  ONLINE_FORM
  FRONT_DESK
  IMPORT
}

enum ApplicationFeeStatus {
  NOT_REQUIRED
  PENDING
  PAID
  WAIVED
  REFUNDED
}

// How the student came in; needed by UDISE and admission reports.
enum AdmissionType {
  NEW
  RE_ADMISSION
  TRANSFER_IN
  INTERNAL_PROGRESSION
}

// Seat quota of the admission; drives fee rules and government returns.
enum AdmissionQuota {
  GENERAL
  RTE
  MANAGEMENT
  STAFF_WARD
  SPORTS
  NRI
  OTHER
}

enum StudentTransferType {
  BATCH_CHANGE
  CAMPUS_TRANSFER
  COURSE_CHANGE
}

enum StaffChangeType {
  STATUS
  CAMPUS_TRANSFER
  DESIGNATION
  DEPARTMENT
  EMPLOYMENT_TYPE
}

// Staff department, e.g. Science, Accounts, Administration.
model Department {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  campusId       String?      @map("campus_id") @db.Uuid // null = organization-wide department
  name           String       @db.VarChar(100)
  code           String       @db.VarChar(30)
  headStaffId    String?      @map("head_staff_id") @db.Uuid
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus       Campus?      @relation(fields: [campusId], references: [id], onDelete: Restrict)
  headStaff    Staff?       @relation("DepartmentHead", fields: [headStaffId], references: [id], onDelete: SetNull)
  staff        Staff[]      @relation("DepartmentStaff")

  @@unique([organizationId, code])
  @@index([organizationId, campusId, status])
  @@map("departments")
}

// Job title, e.g. PGT Mathematics, Accountant, Front Desk Executive.
model Designation {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  name           String       @db.VarChar(100)
  staffType      StaffType?   @map("staff_type") // null = usable for both
  level          Int?         @db.SmallInt // seniority ordering, 1 = most senior
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  staff        Staff[]

  @@unique([organizationId, name])
  @@index([organizationId, status])
  @@map("designations")
}

// Employee profile (teacher or non-teaching). The login lives in User and is linked by userId.
model Staff {
  id                    String         @id @default(uuid()) @db.Uuid
  organizationId        String         @map("organization_id") @db.Uuid
  campusId              String         @map("campus_id") @db.Uuid // home campus; extra campuses come from UserCampus
  userId                String?        @unique @map("user_id") @db.Uuid // linked login; null until invited
  employeeCode          String         @map("employee_code") @db.VarChar(30)
  staffType             StaffType      @map("staff_type")
  employmentType        EmploymentType @default(FULL_TIME) @map("employment_type")
  status                StaffStatus    @default(ACTIVE)
  firstName             String         @map("first_name") @db.VarChar(80)
  lastName              String?        @map("last_name") @db.VarChar(80)
  gender                Gender?
  dateOfBirth           DateTime?      @map("date_of_birth") @db.Date
  bloodGroup            BloodGroup?    @map("blood_group")
  email                 String?        @db.VarChar(255)
  phone                 String         @db.VarChar(20) // E.164
  alternatePhone        String?        @map("alternate_phone") @db.VarChar(20)
  photoFileId           String?        @map("photo_file_id") @db.Uuid
  departmentId          String?        @map("department_id") @db.Uuid
  designationId         String?        @map("designation_id") @db.Uuid
  reportsToId           String?        @map("reports_to_id") @db.Uuid // manager; first approver in the leave chain
  joiningDate           DateTime       @map("joining_date") @db.Date
  confirmationDate      DateTime?      @map("confirmation_date") @db.Date // end of probation
  qualification         String?        @db.VarChar(255) // e.g. M.Sc. Physics, B.Ed.
  specialization        String?        @db.VarChar(255)
  experienceYears       Decimal?       @map("experience_years") @db.Decimal(4, 1) // before joining
  addressLine1          String?        @map("address_line1") @db.VarChar(200)
  addressLine2          String?        @map("address_line2") @db.VarChar(200)
  city                  String?        @db.VarChar(100)
  state                 String?        @db.VarChar(100)
  postalCode            String?        @map("postal_code") @db.VarChar(20)
  countryCode           String?        @map("country_code") @db.Char(2)
  emergencyContactName  String?        @map("emergency_contact_name") @db.VarChar(120)
  emergencyContactPhone String?        @map("emergency_contact_phone") @db.VarChar(20)
  bankDetailsEncrypted  String?        @map("bank_details_encrypted") @db.Text // AES-256-GCM ciphertext of { accountName, accountNo, ifsc, bankName }; never returned in list APIs
  bankAccountLast4      String?        @map("bank_account_last4") @db.VarChar(4) // safe to display
  taxIdEncrypted        String?        @map("tax_id_encrypted") @db.Text // PAN / TFN / SSN ciphertext
  nationalIdEncrypted   String?        @map("national_id_encrypted") @db.Text // Aadhaar / Emirates ID ciphertext
  uan                   String?        @db.VarChar(12) // India PF Universal Account Number (lifetime id of the employee)
  pfMemberId            String?        @map("pf_member_id") @db.VarChar(30) // PF member id under this establishment
  esiIpNumber           String?        @map("esi_ip_number") @db.VarChar(20) // ESI insured person number
  statutoryIdsEncrypted String?        @map("statutory_ids_encrypted") @db.Text // ciphertext of { superFundUsi, superMemberNo, tfn, ssn, molPersonId, iban }
  noticePeriodDays      Int?           @map("notice_period_days") @db.SmallInt
  resignationDate       DateTime?      @map("resignation_date") @db.Date
  exitDate              DateTime?      @map("exit_date") @db.Date
  exitReason            String?        @map("exit_reason") @db.VarChar(255)
  anonymizedAt          DateTime?      @map("anonymized_at") @db.Timestamptz(6) // PII overwritten after an approved deletion request; row kept for financial/legal retention
  retentionUntil        DateTime?      @map("retention_until") @db.Date
  customFields          Json?          @map("custom_fields") // cached CustomFieldValue rows
  createdById           String?        @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt             DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt             DateTime?      @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus       @relation(fields: [campusId], references: [id], onDelete: Restrict)
  user         User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  photoFile    FileAsset?   @relation(fields: [photoFileId], references: [id], onDelete: SetNull)
  department   Department?  @relation("DepartmentStaff", fields: [departmentId], references: [id], onDelete: SetNull)
  designation  Designation? @relation(fields: [designationId], references: [id], onDelete: SetNull)
  reportsTo    Staff?       @relation("StaffManager", fields: [reportsToId], references: [id], onDelete: SetNull)

  directReports             Staff[]               @relation("StaffManager")
  headedDepartments         Department[]          @relation("DepartmentHead")
  documents                 StaffDocument[]
  subjects                  TeacherSubject[]
  classTeacherOf            Batch[]
  batchSubjects             BatchSubjectTeacher[]
  leaveRequests             LeaveRequest[]        @relation("LeaveRequestStaff")
  substituteForLeaves       LeaveRequest[]        @relation("LeaveRequestSubstitute")
  substitutionsAsOriginal   Substitution[]        @relation("SubstitutionOriginalStaff")
  substitutionsAsSubstitute Substitution[]        @relation("SubstitutionSubstituteStaff")
  staffAttendances          StaffAttendance[]
  leaveBalances             LeaveBalance[]
  timetableEntries          TimetableEntry[]
  assignedHomework          Homework[]
  homeworkSubmissions       HomeworkSubmission[]
  vehiclesAsDriver          Vehicle[]             @relation("VehicleDriver")
  vehiclesAsAttendant       Vehicle[]             @relation("VehicleAttendant")
  tripsAsDriver             VehicleTrip[]         @relation("VehicleTripDriver")
  tripsAsAttendant          VehicleTrip[]         @relation("VehicleTripAttendant")
  invigilationDuties        ExamSchedule[]
  bookIssues                BookIssue[]
  stockTransactions         StockTransaction[]
  assetAssignments          AssetAssignment[]
  driverProfile             DriverProfile?
  wardenOfHostels           Hostel[]
  staffSalaries             StaffSalary[]
  payslips                  Payslip[]
  staffLoanAdvances         StaffLoanAdvance[]
  payrollAdjustments        PayrollAdjustment[]
  ptmBookings               PtmBooking[]
  staffStatusHistories      StaffStatusHistory[]
  classSessions             ClassSession[]
  studyMaterials            StudyMaterial[]
  payments                  Payment[]
  bookReservations          BookReservation[]
  staffTaxDeclarations      StaffTaxDeclaration[]

  @@unique([organizationId, employeeCode])
  @@index([organizationId, campusId, staffType, status])
  @@index([organizationId, departmentId])
  @@index([organizationId, phone])
  @@index([organizationId, firstName, lastName])
  // ?q= contains search; needs CREATE EXTENSION pg_trgm in an earlier SQL migration
  @@index([firstName(ops: raw("gin_trgm_ops")), lastName(ops: raw("gin_trgm_ops")), employeeCode(ops: raw("gin_trgm_ops"))], type: Gin, map: "idx_staff_search_trgm")
  @@map("staff")
}

// Document uploaded for a staff member (ID proof, degree, contract).
model StaffDocument {
  id                  String            @id @default(uuid()) @db.Uuid
  organizationId      String            @map("organization_id") @db.Uuid
  staffId             String            @map("staff_id") @db.Uuid
  documentType        StaffDocumentType @map("document_type")
  title               String            @db.VarChar(150)
  documentNoEncrypted String?           @map("document_no_encrypted") @db.Text // AES-256-GCM ciphertext (Aadhaar, PAN, passport, bank account); never plain
  documentNoLast4     String?           @map("document_no_last4") @db.VarChar(4) // safe to display
  fileId              String            @map("file_id") @db.Uuid
  issuedOn            DateTime?         @map("issued_on") @db.Date
  expiresOn           DateTime?         @map("expires_on") @db.Date
  isVerified          Boolean           @default(false) @map("is_verified")
  verifiedById        String?           @map("verified_by_id") @db.Uuid // User id (audit only, no FK)
  verifiedAt          DateTime?         @map("verified_at") @db.Timestamptz(6)
  createdAt           DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt           DateTime?         @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  staff        Staff        @relation(fields: [staffId], references: [id], onDelete: Cascade)
  file         FileAsset    @relation(fields: [fileId], references: [id], onDelete: Restrict)

  @@index([organizationId, staffId])
  @@index([organizationId, expiresOn])
  @@map("staff_documents")
}

// Subjects a teacher is qualified to teach (used when assigning batches and substitutions).
model TeacherSubject {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  staffId        String   @map("staff_id") @db.Uuid
  subjectId      String   @map("subject_id") @db.Uuid
  isPrimary      Boolean  @default(false) @map("is_primary") // main subject of the teacher
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  staff        Staff        @relation(fields: [staffId], references: [id], onDelete: Cascade)
  subject      Subject      @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  @@unique([organizationId, staffId, subjectId])
  @@index([organizationId, subjectId])
  @@map("teacher_subjects")
}

// Student master record. Batch membership per year lives in Enrollment.
model Student {
  id                    String           @id @default(uuid()) @db.Uuid
  organizationId        String           @map("organization_id") @db.Uuid
  campusId              String           @map("campus_id") @db.Uuid
  userId                String?          @unique @map("user_id") @db.Uuid // linked Student Portal login; optional
  familyId              String?          @map("family_id") @db.Uuid // household; groups siblings
  admissionNo           String           @map("admission_no") @db.VarChar(30) // e.g. BF-2027-0142, from NumberSequence
  rollNo                String?          @map("roll_no") @db.VarChar(20) // copy of the roll number in the current primary enrollment
  status                StudentStatus    @default(ACTIVE)
  firstName             String           @map("first_name") @db.VarChar(80)
  middleName            String?          @map("middle_name") @db.VarChar(80)
  lastName              String?          @map("last_name") @db.VarChar(80)
  dateOfBirth           DateTime         @map("date_of_birth") @db.Date
  gender                Gender
  bloodGroup            BloodGroup?      @map("blood_group")
  category              StudentCategory? // optional; asked only where the institute needs it
  admissionType         AdmissionType    @default(NEW) @map("admission_type")
  admissionQuota        AdmissionQuota   @default(GENERAL) @map("admission_quota") // RTE / staff ward ... drives fee rules and government returns
  isMinority            Boolean          @default(false) @map("is_minority")
  isBpl                 Boolean          @default(false) @map("is_bpl") // below poverty line; used by scholarship criteria
  penNumber             String?          @map("pen_number") @db.VarChar(20) // UDISE+ Permanent Education Number
  apaarId               String?          @map("apaar_id") @db.VarChar(20)
  boardRegistrationNo   String?          @map("board_registration_no") @db.VarChar(40)
  house                 String?          @db.VarChar(40) // school house for sports and report cards
  rfidCardNo            String?          @map("rfid_card_no") @db.VarChar(40) // RFID / QR card used for gate attendance
  religion              String?          @db.VarChar(40)
  nationality           String?          @db.VarChar(60)
  motherTongue          String?          @map("mother_tongue") @db.VarChar(40)
  nationalIdEncrypted   String?          @map("national_id_encrypted") @db.Text // Aadhaar / passport ciphertext (AES-256-GCM)
  email                 String?          @db.VarChar(255)
  phone                 String?          @db.VarChar(20)
  addressLine1          String?          @map("address_line1") @db.VarChar(200)
  addressLine2          String?          @map("address_line2") @db.VarChar(200)
  city                  String?          @db.VarChar(100)
  state                 String?          @db.VarChar(100)
  postalCode            String?          @map("postal_code") @db.VarChar(20)
  countryCode           String?          @map("country_code") @db.Char(2)
  permanentAddress      Json?            @map("permanent_address") // only when different from the current address
  photoFileId           String?          @map("photo_file_id") @db.Uuid
  admissionDate         DateTime         @map("admission_date") @db.Date
  readmittedOn          DateTime?        @map("readmitted_on") @db.Date
  admittedCourseId      String?          @map("admitted_course_id") @db.Uuid // class at first admission, printed on the TC
  currentBatchId        String?          @map("current_batch_id") @db.Uuid // denormalised from the active primary enrollment for fast lists
  previousSchool        String?          @map("previous_school") @db.VarChar(200)
  previousClass         String?          @map("previous_class") @db.VarChar(60)
  previousTcNo          String?          @map("previous_tc_no") @db.VarChar(40) // TC number of the previous school
  medicalNotesEncrypted String?          @map("medical_notes_encrypted") @db.Text // allergies, conditions; AES-256-GCM, decrypted only for users with students.medical.view; never copied into AuditLog
  statusChangedAt       DateTime?        @map("status_changed_at") @db.Timestamptz(6)
  leavingDate           DateTime?        @map("leaving_date") @db.Date
  leavingReason         String?          @map("leaving_reason") @db.VarChar(255)
  tcNo                  String?          @map("tc_no") @db.VarChar(40) // transfer certificate register number issued by us
  tcIssuedOn            DateTime?        @map("tc_issued_on") @db.Date
  tcCertificateId       String?          @unique @map("tc_certificate_id") @db.Uuid // IssuedCertificate that closed the record
  anonymizedAt          DateTime?        @map("anonymized_at") @db.Timestamptz(6) // PII overwritten after an approved deletion request; row kept for financial/legal retention
  retentionUntil        DateTime?        @map("retention_until") @db.Date
  customFields          Json?            @map("custom_fields") // cached CustomFieldValue rows for fast profile reads
  createdById           String?          @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt             DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt             DateTime?        @map("deleted_at") @db.Timestamptz(6)

  organization   Organization       @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus         Campus             @relation(fields: [campusId], references: [id], onDelete: Restrict)
  user           User?              @relation(fields: [userId], references: [id], onDelete: SetNull)
  photoFile      FileAsset?         @relation(fields: [photoFileId], references: [id], onDelete: SetNull)
  currentBatch   Batch?             @relation(fields: [currentBatchId], references: [id], onDelete: SetNull)
  family         Family?            @relation(fields: [familyId], references: [id], onDelete: SetNull)
  admittedCourse Course?            @relation(fields: [admittedCourseId], references: [id], onDelete: SetNull)
  tcCertificate  IssuedCertificate? @relation("StudentTransferCertificate", fields: [tcCertificateId], references: [id], onDelete: SetNull)

  guardians                StudentGuardian[]
  enrollments              Enrollment[]
  documents                StudentDocument[]
  notes                    StudentNote[]
  statusHistory            StudentStatusHistory[]
  applications             AdmissionApplication[]    @relation("ApplicationConvertedStudent") // a returning student may have several applications
  applicationsAsExisting   AdmissionApplication[]    @relation("ApplicationExistingStudent")
  consentRecords           ConsentRecord[]
  attendanceRecords        AttendanceRecord[]
  studentLeaveRequests     StudentLeaveRequest[]
  homeworkSubmissions      HomeworkSubmission[]
  examMarks                ExamMark[]
  reportCards              ReportCard[]
  studentFeeAssignments    StudentFeeAssignment[]
  feeInvoices              FeeInvoice[]
  studentDiscounts         StudentDiscount[]         @relation("StudentDiscountStudent")
  siblingDiscountsEnabled  StudentDiscount[]         @relation("StudentDiscountSibling") // SIBLING discounts of brothers / sisters justified by this student
  scholarshipApplications  ScholarshipApplication[]
  scholarshipAwards        ScholarshipAward[]
  feeReminderLogs          FeeReminderLog[]
  paymentOrders            PaymentOrder[]
  payments                 Payment[]
  receipts                 Receipt[]
  refunds                  Refund[]
  announcementRecipients   AnnouncementRecipient[]
  messageLogs              MessageLog[]
  bookIssues               BookIssue[]
  stockTransactions        StockTransaction[]
  assetAssignments         AssetAssignment[]
  transportAssignments     TransportAssignment[]
  hostelAllocations        HostelAllocation[]
  hostelAttendances        HostelAttendance[]
  hostelVisitorLogs        HostelVisitorLog[]
  issuedCertificates       IssuedCertificate[]
  certificateRequests      CertificateRequest[]
  studentRiskScores        StudentRiskScore[]
  ptmBookings              PtmBooking[]
  studentTransfers         StudentTransfer[]
  examReEvaluationRequests ExamReEvaluationRequest[]
  feeInvoiceAdjustments    FeeInvoiceAdjustment[]
  scholarshipDisbursements ScholarshipDisbursement[]
  paymentAllocations       PaymentAllocation[]
  bookReservations         BookReservation[]
  transportAttendances     TransportAttendance[]
  hostelLeaveRequests      HostelLeaveRequest[]

  @@unique([id, organizationId]) // target of composite tenant-safe foreign keys
  @@unique([organizationId, admissionNo])
  @@unique([organizationId, rfidCardNo])
  @@index([organizationId, familyId])
  @@index([organizationId, admissionQuota])
  // ?q= contains search; needs CREATE EXTENSION pg_trgm in an earlier SQL migration
  @@index([firstName(ops: raw("gin_trgm_ops")), lastName(ops: raw("gin_trgm_ops")), admissionNo(ops: raw("gin_trgm_ops"))], type: Gin, map: "idx_students_search_trgm")
  @@index([organizationId, campusId, status])
  @@index([organizationId, currentBatchId, status])
  @@index([organizationId, firstName, lastName])
  @@index([organizationId, phone])
  @@index([organizationId, admissionDate])
  @@map("students")
}

// Parent or guardian. One row per person per organization; linked to children through StudentGuardian.
model Guardian {
  id                  String       @id @default(uuid()) @db.Uuid
  organizationId      String       @map("organization_id") @db.Uuid
  userId              String?      @unique @map("user_id") @db.Uuid // linked Parent Portal login
  familyId            String?      @map("family_id") @db.Uuid // household; one Parent Portal login sees every child of the family
  firstName           String       @map("first_name") @db.VarChar(80)
  lastName            String?      @map("last_name") @db.VarChar(80)
  gender              Gender?
  email               String?      @db.VarChar(255)
  phone               String       @db.VarChar(20) // E.164; used to match siblings to the same guardian
  alternatePhone      String?      @map("alternate_phone") @db.VarChar(20)
  whatsappPhone       String?      @map("whatsapp_phone") @db.VarChar(20) // when different from phone
  preferredChannel    Channel      @default(WHATSAPP) @map("preferred_channel")
  preferredLanguage   String       @default("en") @map("preferred_language") @db.VarChar(10)
  occupation          String?      @db.VarChar(100)
  education           String?      @db.VarChar(100)
  annualIncome        Decimal?     @map("annual_income") @db.Decimal(12, 2) // for scholarship eligibility
  currency            String?      @db.Char(3) // currency of annualIncome
  addressLine1        String?      @map("address_line1") @db.VarChar(200)
  addressLine2        String?      @map("address_line2") @db.VarChar(200)
  city                String?      @db.VarChar(100)
  state               String?      @db.VarChar(100)
  postalCode          String?      @map("postal_code") @db.VarChar(20)
  countryCode         String?      @map("country_code") @db.Char(2)
  nationalIdEncrypted String?      @map("national_id_encrypted") @db.Text // ciphertext; used for verifiable parental consent where required
  status              RecordStatus @default(ACTIVE)
  anonymizedAt        DateTime?    @map("anonymized_at") @db.Timestamptz(6) // PII overwritten after an approved deletion request
  customFields        Json?        @map("custom_fields") // cached CustomFieldValue rows
  createdAt           DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt           DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization            Organization             @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  user                    User?                    @relation(fields: [userId], references: [id], onDelete: SetNull)
  family                  Family?                  @relation(fields: [familyId], references: [id], onDelete: SetNull)
  students                StudentGuardian[]
  consentRecords          ConsentRecord[]
  studentLeaveRequests    StudentLeaveRequest[]    @relation("StudentLeaveRequestedByGuardian")
  studentLeavePickups     StudentLeaveRequest[]    @relation("StudentLeavePickupGuardian")
  feeReminderLogs         FeeReminderLog[]
  payments                Payment[]
  whatsAppInboundMessages WhatsAppInboundMessage[]
  hostelVisitorLogs       HostelVisitorLog[]
  ptmBookings             PtmBooking[]
  hostelLeaveRequests     HostelLeaveRequest[]

  @@index([organizationId, phone])
  @@index([organizationId, email])
  @@index([organizationId, firstName, lastName])
  @@index([organizationId, familyId])
  // ?q= contains search; needs CREATE EXTENSION pg_trgm in an earlier SQL migration
  @@index([firstName(ops: raw("gin_trgm_ops")), lastName(ops: raw("gin_trgm_ops")), phone(ops: raw("gin_trgm_ops"))], type: Gin, map: "idx_guardians_search_trgm")
  @@map("guardians")
}

// Household that groups siblings and their guardians (sibling discount, family statement, one parent login).
model Family {
  id                String    @id @default(uuid()) @db.Uuid
  organizationId    String    @map("organization_id") @db.Uuid
  familyCode        String    @map("family_code") @db.VarChar(30)
  name              String    @db.VarChar(160) // e.g. "Sharma family (Rajesh)"
  primaryGuardianId String?   @map("primary_guardian_id") @db.Uuid // Guardian id (no FK to avoid a circular dependency)
  notes             String?   @db.VarChar(500)
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt         DateTime? @map("deleted_at") @db.Timestamptz(6)

  organization  Organization   @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  students      Student[]
  guardians     Guardian[]
  paymentOrders PaymentOrder[]
  payments      Payment[]

  @@unique([organizationId, familyCode])
  @@index([organizationId, name])
  @@map("families")
}

// Link between a student and a guardian with the relationship and contact flags.
model StudentGuardian {
  id                    String           @id @default(uuid()) @db.Uuid
  organizationId        String           @map("organization_id") @db.Uuid
  studentId             String           @map("student_id") @db.Uuid
  guardianId            String           @map("guardian_id") @db.Uuid
  relation              GuardianRelation
  isPrimary             Boolean          @default(false) @map("is_primary") // main contact; one per student: partial unique index in the SQL migration, UNIQUE (organization_id, student_id) WHERE is_primary
  canPickup             Boolean          @default(true) @map("can_pickup")
  isEmergencyContact    Boolean          @default(false) @map("is_emergency_contact")
  isFeePayer            Boolean          @default(false) @map("is_fee_payer") // receives fee reminders and receipts
  receivesCommunication Boolean          @default(true) @map("receives_communication")
  hasPortalAccess       Boolean          @default(true) @map("has_portal_access") // false for custody restrictions
  createdAt             DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  student      Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  guardian     Guardian     @relation(fields: [guardianId], references: [id], onDelete: Cascade)

  @@unique([organizationId, studentId, guardianId])
  @@index([organizationId, guardianId])
  @@map("student_guardians")
}

// A student's membership of a batch in an academic year (history is kept across years).
// Ended rows (TRANSFERRED, WITHDRAWN, CANCELLED, soft-deleted) must not block a new row, so the rules live in
// partial unique indexes in the SQL migration:
//   uq_enrollment_student_batch_year (organization_id, student_id, batch_id, academic_year_id) WHERE status = 'ACTIVE' AND deleted_at IS NULL
//   uq_enrollment_batch_roll         (organization_id, batch_id, roll_no) WHERE status = 'ACTIVE' AND deleted_at IS NULL
//   uq_enrollment_primary            (organization_id, student_id, academic_year_id) WHERE is_primary AND status = 'ACTIVE' AND deleted_at IS NULL
model Enrollment {
  id                   String           @id @default(uuid()) @db.Uuid
  organizationId       String           @map("organization_id") @db.Uuid
  campusId             String           @map("campus_id") @db.Uuid
  studentId            String           @map("student_id") @db.Uuid
  academicYearId       String           @map("academic_year_id") @db.Uuid
  courseId             String           @map("course_id") @db.Uuid // denormalised from the batch for course-level reports
  batchId              String           @map("batch_id") @db.Uuid
  rollNo               String?          @map("roll_no") @db.VarChar(20)
  status               EnrollmentStatus @default(ACTIVE)
  isPrimary            Boolean          @default(true) @map("is_primary") // coaching students may join extra batches; one primary per year
  enrollmentDate       DateTime         @map("enrollment_date") @db.Date
  endDate              DateTime?        @map("end_date") @db.Date
  endReason            String?          @map("end_reason") @db.VarChar(255)
  electiveSubjectIds   String[]         @map("elective_subject_ids") @db.Uuid // chosen elective Subject ids
  previousEnrollmentId String?          @map("previous_enrollment_id") @db.Uuid // enrollment this one was promoted / transferred from
  createdById          String?          @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt            DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt            DateTime?        @map("deleted_at") @db.Timestamptz(6)

  organization          Organization           @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus                Campus                 @relation(fields: [campusId], references: [id], onDelete: Restrict)
  student               Student                @relation(fields: [studentId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK: same tenant guaranteed by the database
  academicYear          AcademicYear           @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  course                Course                 @relation(fields: [courseId], references: [id], onDelete: Restrict)
  batch                 Batch                  @relation(fields: [batchId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK
  previousEnrollment    Enrollment?            @relation("EnrollmentProgression", fields: [previousEnrollmentId], references: [id], onDelete: SetNull)
  nextEnrollments       Enrollment[]           @relation("EnrollmentProgression")
  studentFeeAssignments StudentFeeAssignment[]

  @@index([organizationId, studentId, batchId, academicYearId]) // uniqueness of ACTIVE rows: partial unique index (see model comment)
  @@index([organizationId, batchId, rollNo])
  @@index([organizationId, batchId, status])
  @@index([organizationId, studentId, academicYearId])
  @@index([organizationId, campusId, academicYearId, status])
  @@index([organizationId, courseId, academicYearId])
  @@map("enrollments")
}

// Document uploaded for a student (birth certificate, transfer certificate, marksheet).
model StudentDocument {
  id                  String              @id @default(uuid()) @db.Uuid
  organizationId      String              @map("organization_id") @db.Uuid
  studentId           String              @map("student_id") @db.Uuid
  documentType        StudentDocumentType @map("document_type")
  title               String              @db.VarChar(150)
  documentNoEncrypted String?             @map("document_no_encrypted") @db.Text // AES-256-GCM ciphertext (Aadhaar, passport); never plain
  documentNoLast4     String?             @map("document_no_last4") @db.VarChar(4) // safe to display
  fileId              String              @map("file_id") @db.Uuid
  issuedOn            DateTime?           @map("issued_on") @db.Date
  isVerified          Boolean             @default(false) @map("is_verified")
  verifiedById        String?             @map("verified_by_id") @db.Uuid // User id (audit only, no FK)
  verifiedAt          DateTime?           @map("verified_at") @db.Timestamptz(6)
  visibleToParent     Boolean             @default(true) @map("visible_to_parent")
  createdAt           DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt           DateTime?           @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  student      Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  file         FileAsset    @relation(fields: [fileId], references: [id], onDelete: Restrict)

  @@index([organizationId, studentId, documentType])
  @@map("student_documents")
}

// Staff remark on a student (academic, behaviour, medical, counselling), optionally shared with parents.
model StudentNote {
  id                 String          @id @default(uuid()) @db.Uuid
  organizationId     String          @map("organization_id") @db.Uuid
  studentId          String          @map("student_id") @db.Uuid
  noteType           StudentNoteType @default(GENERAL) @map("note_type")
  title              String?         @db.VarChar(150)
  body               String          @db.Text
  isSharedWithParent Boolean         @default(false) @map("is_shared_with_parent")
  isPinned           Boolean         @default(false) @map("is_pinned")
  authorId           String?         @map("author_id") @db.Uuid
  createdAt          DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt          DateTime?       @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  student      Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  author       User?        @relation(fields: [authorId], references: [id], onDelete: SetNull)

  @@index([organizationId, studentId, createdAt])
  @@index([organizationId, noteType, createdAt])
  @@map("student_notes")
}

// Every change of Student.status with reason and actor. Append-only: no updatedAt / deletedAt.
model StudentStatusHistory {
  id             String         @id @default(uuid()) @db.Uuid
  organizationId String         @map("organization_id") @db.Uuid
  studentId      String         @map("student_id") @db.Uuid
  fromStatus     StudentStatus? @map("from_status") // null for the first row written at admission
  toStatus       StudentStatus  @map("to_status")
  reason         String?        @db.VarChar(500)
  effectiveDate  DateTime       @map("effective_date") @db.Date
  changedById    String?        @map("changed_by_id") @db.Uuid
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  student      Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  changedBy    User?        @relation(fields: [changedById], references: [id], onDelete: SetNull)

  @@index([organizationId, studentId, createdAt])
  @@index([organizationId, toStatus, effectiveDate])
  @@map("student_status_histories")
}

// Every status, campus, department or designation change of a staff member. Append-only: no updatedAt / deletedAt.
model StaffStatusHistory {
  id             String          @id @default(uuid()) @db.Uuid
  organizationId String          @map("organization_id") @db.Uuid
  staffId        String          @map("staff_id") @db.Uuid
  changeType     StaffChangeType @map("change_type")
  fromValue      String?         @map("from_value") @db.VarChar(100) // status / designation / department name before
  toValue        String          @map("to_value") @db.VarChar(100)
  fromCampusId   String?         @map("from_campus_id") @db.Uuid // Campus id (no FK); set for CAMPUS_TRANSFER
  toCampusId     String?         @map("to_campus_id") @db.Uuid
  effectiveDate  DateTime        @map("effective_date") @db.Date
  reason         String?         @db.VarChar(500)
  changedById    String?         @map("changed_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt      DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  staff        Staff        @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@index([organizationId, staffId, effectiveDate])
  @@index([organizationId, changeType, effectiveDate])
  @@map("staff_status_histories")
}

// Request to move a student to another batch, course or campus, with approval and fee treatment.
model StudentTransfer {
  id               String              @id @default(uuid()) @db.Uuid
  organizationId   String              @map("organization_id") @db.Uuid
  studentId        String              @map("student_id") @db.Uuid
  transferType     StudentTransferType @map("transfer_type")
  fromCampusId     String              @map("from_campus_id") @db.Uuid
  toCampusId       String              @map("to_campus_id") @db.Uuid
  fromBatchId      String              @map("from_batch_id") @db.Uuid
  toBatchId        String              @map("to_batch_id") @db.Uuid
  fromEnrollmentId String?             @map("from_enrollment_id") @db.Uuid // Enrollment id that ends (no FK)
  toEnrollmentId   String?             @map("to_enrollment_id") @db.Uuid // Enrollment id created on approval (no FK)
  effectiveDate    DateTime            @map("effective_date") @db.Date
  reason           String              @db.VarChar(500)
  feeTreatment     Json?               @map("fee_treatment") // { carryDues, newFeeStructureId, endTransport }
  status           ApprovalStatus      @default(PENDING)
  requestedById    String?             @map("requested_by_id") @db.Uuid // User id (audit only, no FK)
  approvedById     String?             @map("approved_by_id") @db.Uuid
  approvedAt       DateTime?           @map("approved_at") @db.Timestamptz(6)
  createdAt        DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  student      Student      @relation(fields: [studentId], references: [id], onDelete: Restrict)
  fromCampus   Campus       @relation("StudentTransferFromCampus", fields: [fromCampusId], references: [id], onDelete: Restrict)
  toCampus     Campus       @relation("StudentTransferToCampus", fields: [toCampusId], references: [id], onDelete: Restrict)
  fromBatch    Batch        @relation("StudentTransferFromBatch", fields: [fromBatchId], references: [id], onDelete: Restrict)
  toBatch      Batch        @relation("StudentTransferToBatch", fields: [toBatchId], references: [id], onDelete: Restrict)
  approvedBy   User?        @relation(fields: [approvedById], references: [id], onDelete: SetNull)

  @@index([organizationId, studentId, effectiveDate])
  @@index([organizationId, toCampusId, status])
  @@index([organizationId, fromCampusId, status])
  @@map("student_transfers")
}

// Admission lead captured from walk-in, website form, phone or WhatsApp.
model AdmissionInquiry {
  id               String            @id @default(uuid()) @db.Uuid
  organizationId   String            @map("organization_id") @db.Uuid
  campusId         String            @map("campus_id") @db.Uuid
  inquiryNo        String            @map("inquiry_no") @db.VarChar(30)
  academicYearId   String?           @map("academic_year_id") @db.Uuid // session the lead wants to join
  courseId         String?           @map("course_id") @db.Uuid // course of interest
  studentFirstName String            @map("student_first_name") @db.VarChar(80)
  studentLastName  String?           @map("student_last_name") @db.VarChar(80)
  dateOfBirth      DateTime?         @map("date_of_birth") @db.Date
  gender           Gender?
  guardianName     String            @map("guardian_name") @db.VarChar(160)
  guardianRelation GuardianRelation? @map("guardian_relation")
  phone            String            @db.VarChar(20)
  alternatePhone   String?           @map("alternate_phone") @db.VarChar(20)
  email            String?           @db.VarChar(255)
  city             String?           @db.VarChar(100)
  address          String?           @db.VarChar(500)
  previousSchool   String?           @map("previous_school") @db.VarChar(200)
  source           LeadSource        @default(WALK_IN)
  sourceDetail     String?           @map("source_detail") @db.VarChar(200) // campaign name, referrer name
  utm              Json? // utm_source / utm_medium / utm_campaign from the website form
  stage            InquiryStage      @default(NEW)
  priority         LeadPriority      @default(WARM)
  assignedToId     String?           @map("assigned_to_id") @db.Uuid // counsellor (User) who owns the lead
  lastContactedAt  DateTime?         @map("last_contacted_at") @db.Timestamptz(6)
  nextFollowUpAt   DateTime?         @map("next_follow_up_at") @db.Timestamptz(6) // denormalised from the latest follow-up
  lostReason       String?           @map("lost_reason") @db.VarChar(255)
  notes            String?           @db.Text
  demoBatchId      String?           @map("demo_batch_id") @db.Uuid // coaching: batch of the free demo class
  demoAt           DateTime?         @map("demo_at") @db.Timestamptz(6)
  demoAttended     Boolean?          @map("demo_attended")
  consentToContact Boolean           @default(false) @map("consent_to_contact") // never pre-ticked: needs a clear affirmative action (DPDP / GDPR / TRAI)
  consentAt        DateTime?         @map("consent_at") @db.Timestamptz(6)
  consentSource    String?           @map("consent_source") @db.VarChar(40) // WEB_FORM | FRONT_DESK | WHATSAPP_OPT_IN
  consentIp        String?           @map("consent_ip") @db.VarChar(45)
  customFields     Json?             @map("custom_fields") // cached CustomFieldValue rows
  createdById      String?           @map("created_by_id") @db.Uuid // User id (audit only, no FK); null for website leads
  createdAt        DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt        DateTime?         @map("deleted_at") @db.Timestamptz(6)

  organization   Organization           @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus         Campus                 @relation(fields: [campusId], references: [id], onDelete: Restrict)
  academicYear   AcademicYear?          @relation(fields: [academicYearId], references: [id], onDelete: SetNull)
  course         Course?                @relation(fields: [courseId], references: [id], onDelete: SetNull)
  assignedTo     User?                  @relation(fields: [assignedToId], references: [id], onDelete: SetNull)
  demoBatch      Batch?                 @relation(fields: [demoBatchId], references: [id], onDelete: SetNull)
  followUps      InquiryFollowUp[]
  applications   AdmissionApplication[]
  consentRecords ConsentRecord[]

  @@unique([organizationId, inquiryNo])
  @@index([organizationId, campusId, stage, createdAt])
  @@index([organizationId, assignedToId, nextFollowUpAt])
  @@index([organizationId, phone])
  @@index([organizationId, source, createdAt])
  @@map("admission_inquiries")
}

// A planned or completed contact with an admission lead.
model InquiryFollowUp {
  id             String           @id @default(uuid()) @db.Uuid
  organizationId String           @map("organization_id") @db.Uuid
  inquiryId      String           @map("inquiry_id") @db.Uuid
  followUpType   FollowUpType     @map("follow_up_type")
  scheduledAt    DateTime?        @map("scheduled_at") @db.Timestamptz(6)
  completedAt    DateTime?        @map("completed_at") @db.Timestamptz(6) // null = still pending
  outcome        FollowUpOutcome?
  stageAfter     InquiryStage?    @map("stage_after") // stage the inquiry moved to after this contact
  notes          String?          @db.Text
  doneById       String?          @map("done_by_id") @db.Uuid
  createdAt      DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  inquiry      AdmissionInquiry @relation(fields: [inquiryId], references: [id], onDelete: Cascade)
  doneBy       User?            @relation(fields: [doneById], references: [id], onDelete: SetNull)

  @@index([organizationId, inquiryId, createdAt])
  @@index([organizationId, doneById, scheduledAt])
  @@index([organizationId, completedAt, scheduledAt]) // today's pending follow-ups
  @@map("inquiry_follow_ups")
}

// Admission form submitted online or at the front desk; approved applications become students.
model AdmissionApplication {
  id                      String               @id @default(uuid()) @db.Uuid
  organizationId          String               @map("organization_id") @db.Uuid
  campusId                String               @map("campus_id") @db.Uuid
  applicationNo           String               @map("application_no") @db.VarChar(30)
  inquiryId               String?              @map("inquiry_id") @db.Uuid
  academicYearId          String               @map("academic_year_id") @db.Uuid
  courseId                String               @map("course_id") @db.Uuid
  preferredBatchId        String?              @map("preferred_batch_id") @db.Uuid
  status                  ApplicationStatus    @default(DRAFT)
  admissionType           AdmissionType        @default(NEW) @map("admission_type")
  existingStudentId       String?              @map("existing_student_id") @db.Uuid // returning student chosen at the front desk (re-admission / progression)
  siblingStudentId        String?              @map("sibling_student_id") @db.Uuid // Student id of a sibling already studying here (priority + sibling discount); no FK
  submittedVia            ApplicationChannel   @default(FRONT_DESK) @map("submitted_via")
  studentFirstName        String               @map("student_first_name") @db.VarChar(80)
  studentLastName         String?              @map("student_last_name") @db.VarChar(80)
  dateOfBirth             DateTime?            @map("date_of_birth") @db.Date
  gender                  Gender?
  guardianName            String               @map("guardian_name") @db.VarChar(160)
  phone                   String               @db.VarChar(20)
  email                   String?              @db.VarChar(255)
  // national id / bank numbers must be stripped or field-level encrypted before save
  formData                Json                 @map("form_data") // full form: student, guardians, address, previous school, custom fields
  consentAt               DateTime?            @map("consent_at") @db.Timestamptz(6) // guardian consent for the child's data at application time
  consentSource           String?              @map("consent_source") @db.VarChar(40) // WEB_FORM | FRONT_DESK | WHATSAPP_OPT_IN
  consentIp               String?              @map("consent_ip") @db.VarChar(45)
  applicationFeeAmount    Decimal              @default(0) @map("application_fee_amount") @db.Decimal(12, 2)
  currency                String               @db.Char(3)
  applicationFeeStatus    ApplicationFeeStatus @default(NOT_REQUIRED) @map("application_fee_status")
  applicationFeePaidAt    DateTime?            @map("application_fee_paid_at") @db.Timestamptz(6)
  applicationFeePaymentId String?              @unique @map("application_fee_payment_id") @db.Uuid // Payment (purpose APPLICATION_FEE) that settled the fee: receipt, day book and DayClose
  applicationFeeRef       String?              @map("application_fee_ref") @db.VarChar(100) // legacy receipt no.; imports only
  submittedAt             DateTime?            @map("submitted_at") @db.Timestamptz(6)
  entranceTestAt          DateTime?            @map("entrance_test_at") @db.Timestamptz(6)
  entranceTestVenue       String?              @map("entrance_test_venue") @db.VarChar(150)
  entranceTestMaxScore    Decimal?             @map("entrance_test_max_score") @db.Decimal(6, 2)
  entranceTestScore       Decimal?             @map("entrance_test_score") @db.Decimal(6, 2)
  interviewAt             DateTime?            @map("interview_at") @db.Timestamptz(6)
  reviewedById            String?              @map("reviewed_by_id") @db.Uuid
  reviewedAt              DateTime?            @map("reviewed_at") @db.Timestamptz(6)
  decisionRemarks         String?              @map("decision_remarks") @db.VarChar(500)
  convertedStudentId      String?              @map("converted_student_id") @db.Uuid // Student created from (or re-admitted by) this application; not unique: a student may return
  convertedAt             DateTime?            @map("converted_at") @db.Timestamptz(6)
  createdById             String?              @map("created_by_id") @db.Uuid // User id (audit only, no FK); null for online forms
  createdAt               DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt               DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt               DateTime?            @map("deleted_at") @db.Timestamptz(6)

  organization          Organization                   @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus                Campus                         @relation(fields: [campusId], references: [id], onDelete: Restrict)
  inquiry               AdmissionInquiry?              @relation(fields: [inquiryId], references: [id], onDelete: SetNull)
  academicYear          AcademicYear                   @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  course                Course                         @relation(fields: [courseId], references: [id], onDelete: Restrict)
  preferredBatch        Batch?                         @relation(fields: [preferredBatchId], references: [id], onDelete: SetNull)
  reviewedBy            User?                          @relation(fields: [reviewedById], references: [id], onDelete: SetNull)
  convertedStudent      Student?                       @relation("ApplicationConvertedStudent", fields: [convertedStudentId], references: [id], onDelete: SetNull)
  existingStudent       Student?                       @relation("ApplicationExistingStudent", fields: [existingStudentId], references: [id], onDelete: SetNull)
  applicationFeePayment Payment?                       @relation("ApplicationFeePayment", fields: [applicationFeePaymentId], references: [id], onDelete: SetNull)
  documents             AdmissionApplicationDocument[]
  payments              Payment[]                      @relation("PaymentAdmissionApplication") // every APPLICATION_FEE payment attempt of this application
  paymentOrders         PaymentOrder[]
  receipts              Receipt[]

  @@unique([organizationId, applicationNo])
  @@index([organizationId, convertedStudentId])
  @@index([organizationId, campusId, status, createdAt])
  @@index([organizationId, academicYearId, courseId, status])
  @@index([organizationId, phone])
  @@map("admission_applications")
}

// Document attached to an admission application; copied to StudentDocument on conversion.
model AdmissionApplicationDocument {
  id             String              @id @default(uuid()) @db.Uuid
  organizationId String              @map("organization_id") @db.Uuid
  applicationId  String              @map("application_id") @db.Uuid
  documentType   StudentDocumentType @map("document_type")
  title          String              @db.VarChar(150)
  fileId         String              @map("file_id") @db.Uuid
  isVerified     Boolean             @default(false) @map("is_verified")
  verifiedById   String?             @map("verified_by_id") @db.Uuid // User id (audit only, no FK)
  verifiedAt     DateTime?           @map("verified_at") @db.Timestamptz(6)
  createdAt      DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization         @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  application  AdmissionApplication @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  file         FileAsset            @relation(fields: [fileId], references: [id], onDelete: Restrict)

  @@index([organizationId, applicationId])
  @@map("admission_application_documents")
}
```

## Attendance and leave

File `server/prisma/schema/05-attendance-leave.prisma` — 9 models, 5 enums.

```prisma
// 05-attendance-leave: student attendance (daily or per period), staff attendance,
// staff leave (types, policies, balances, requests with approval chain) and student leave.

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  HALF_DAY
  LEAVE // approved leave
  HOLIDAY
}

enum StaffAttendanceStatus {
  PRESENT
  ABSENT
  LATE
  HALF_DAY
  ON_LEAVE
  HOLIDAY
  WEEK_OFF
}

enum AttendanceSource {
  MANUAL
  BIOMETRIC
  GEO // mobile check-in inside the campus geo-fence
  RFID // card tap at the gate
  QR_CODE
  FACE
  PARENT_APP
}

enum LeaveAccrual {
  YEARLY_UPFRONT
  MONTHLY
  QUARTERLY
  NONE // unpaid / on-request leave without a quota
}

enum StudentLeaveCategory {
  SICK
  FAMILY
  TRAVEL
  EXAM_OR_EVENT
  OTHER
}

// One attendance-taking event for a batch: the whole day, or one period of the day.
model AttendanceSession {
  id                String    @id @default(uuid()) @db.Uuid
  organizationId    String    @map("organization_id") @db.Uuid
  campusId          String    @map("campus_id") @db.Uuid
  academicYearId    String    @map("academic_year_id") @db.Uuid
  batchId           String    @map("batch_id") @db.Uuid
  date              DateTime  @db.Date
  periodSlotId      String?   @map("period_slot_id") @db.Uuid // null = daily attendance
  slotKey           String    @default("DAY") @map("slot_key") @db.VarChar(36) // "DAY", the periodSlotId or the classSessionId; makes the unique key work without NULLs
  classSessionId    String?   @map("class_session_id") @db.Uuid // coaching: the dated lecture this attendance belongs to
  subjectId         String?   @map("subject_id") @db.Uuid // period-wise attendance only
  takenById         String?   @map("taken_by_id") @db.Uuid // User who marked the attendance
  takenAt           DateTime? @map("taken_at") @db.Timestamptz(6)
  isLocked          Boolean   @default(false) @map("is_locked") // locked sessions need attendance.unlock to edit
  lockedAt          DateTime? @map("locked_at") @db.Timestamptz(6)
  totalCount        Int       @default(0) @map("total_count") // cached counters for dashboards
  presentCount      Int       @default(0) @map("present_count")
  absentCount       Int       @default(0) @map("absent_count")
  lateCount         Int       @default(0) @map("late_count")
  leaveCount        Int       @default(0) @map("leave_count")
  parentsNotifiedAt DateTime? @map("parents_notified_at") @db.Timestamptz(6) // absence alerts queued
  notes             String?   @db.VarChar(500)
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization       @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus             @relation(fields: [campusId], references: [id], onDelete: Restrict)
  academicYear AcademicYear       @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  batch        Batch              @relation(fields: [batchId], references: [id], onDelete: Restrict)
  periodSlot   PeriodSlot?        @relation(fields: [periodSlotId], references: [id], onDelete: Restrict)
  subject      Subject?           @relation(fields: [subjectId], references: [id], onDelete: SetNull)
  takenBy      User?              @relation(fields: [takenById], references: [id], onDelete: SetNull)
  classSession ClassSession?      @relation(fields: [classSessionId], references: [id], onDelete: SetNull)
  records      AttendanceRecord[]

  @@unique([id, organizationId]) // target of composite tenant-safe foreign keys
  @@unique([organizationId, batchId, date, slotKey])
  @@index([organizationId, classSessionId])
  @@index([organizationId, campusId, date])
  @@index([organizationId, academicYearId, batchId, date])
  @@index([organizationId, takenById, date])
  @@map("attendance_sessions")
}

// Attendance of one student in one session.
model AttendanceRecord {
  id             String           @id @default(uuid()) @db.Uuid
  organizationId String           @map("organization_id") @db.Uuid
  campusId       String           @map("campus_id") @db.Uuid
  sessionId      String           @map("session_id") @db.Uuid
  studentId      String           @map("student_id") @db.Uuid
  batchId        String           @map("batch_id") @db.Uuid // denormalised from the session for reports
  date           DateTime         @db.Date // denormalised from the session for reports
  status         AttendanceStatus
  lateMinutes    Int?             @map("late_minutes") @db.SmallInt
  halfDaySession HalfDaySession?  @map("half_day_session") // which half was attended when HALF_DAY
  source         AttendanceSource @default(MANUAL)
  checkInAt      DateTime?        @map("check_in_at") @db.Timestamptz(6) // device punch (RFID / QR / face)
  checkOutAt     DateTime?        @map("check_out_at") @db.Timestamptz(6)
  deviceRef      String?          @map("device_ref") @db.VarChar(100)
  remark         String?          @db.VarChar(255)
  leaveRequestId String?          @map("leave_request_id") @db.Uuid // approved student leave that produced status LEAVE
  markedById     String?          @map("marked_by_id") @db.Uuid // User id (audit only, no FK)
  notifiedAt     DateTime?        @map("notified_at") @db.Timestamptz(6) // absence alert sent to the parent
  createdAt      DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization         @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus               @relation(fields: [campusId], references: [id], onDelete: Restrict)
  session      AttendanceSession    @relation(fields: [sessionId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK; attendance is a statutory record, never cascade-deleted
  student      Student              @relation(fields: [studentId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK: same tenant guaranteed by the database
  batch        Batch                @relation(fields: [batchId], references: [id], onDelete: Restrict)
  leaveRequest StudentLeaveRequest? @relation(fields: [leaveRequestId], references: [id], onDelete: SetNull)

  @@unique([organizationId, sessionId, studentId])
  @@index([organizationId, studentId, date])
  @@index([organizationId, batchId, date, status])
  @@index([organizationId, campusId, date, status])
  @@map("attendance_records")
}

// Daily attendance of a staff member with check-in / check-out.
model StaffAttendance {
  id             String                @id @default(uuid()) @db.Uuid
  organizationId String                @map("organization_id") @db.Uuid
  campusId       String                @map("campus_id") @db.Uuid
  staffId        String                @map("staff_id") @db.Uuid
  date           DateTime              @db.Date
  status         StaffAttendanceStatus
  checkInAt      DateTime?             @map("check_in_at") @db.Timestamptz(6)
  checkOutAt     DateTime?             @map("check_out_at") @db.Timestamptz(6)
  workedMinutes  Int?                  @map("worked_minutes")
  lateMinutes    Int?                  @map("late_minutes") @db.SmallInt
  source         AttendanceSource      @default(MANUAL)
  checkInLat     Decimal?              @map("check_in_lat") @db.Decimal(9, 6) // GEO source only
  checkInLng     Decimal?              @map("check_in_lng") @db.Decimal(9, 6)
  checkOutLat    Decimal?              @map("check_out_lat") @db.Decimal(9, 6)
  checkOutLng    Decimal?              @map("check_out_lng") @db.Decimal(9, 6)
  deviceRef      String?               @map("device_ref") @db.VarChar(100) // biometric device id or mobile device id
  leaveRequestId String?               @map("leave_request_id") @db.Uuid // approved leave that produced status ON_LEAVE
  remark         String?               @db.VarChar(255)
  markedById     String?               @map("marked_by_id") @db.Uuid // User id (audit only, no FK); null for device punches
  createdAt      DateTime              @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime              @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization  @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus        @relation(fields: [campusId], references: [id], onDelete: Restrict)
  staff        Staff         @relation(fields: [staffId], references: [id], onDelete: Restrict)
  leaveRequest LeaveRequest? @relation(fields: [leaveRequestId], references: [id], onDelete: SetNull)

  @@unique([organizationId, staffId, date])
  @@index([organizationId, campusId, date, status])
  @@map("staff_attendance")
}

// Kind of staff leave: Casual, Sick, Earned, Maternity, Loss of Pay.
model LeaveType {
  id                   String       @id @default(uuid()) @db.Uuid
  organizationId       String       @map("organization_id") @db.Uuid
  name                 String       @db.VarChar(80)
  code                 String       @db.VarChar(10) // CL, SL, EL, LOP
  isPaid               Boolean      @default(true) @map("is_paid") // unpaid leave reduces salary in Payroll
  allowHalfDay         Boolean      @default(true) @map("allow_half_day")
  isCompOff            Boolean      @default(false) @map("is_comp_off") // compensatory off earned by working on a holiday / exam duty
  requiresDocumentDays Int?         @map("requires_document_days") @db.SmallInt // attachment needed when the leave is longer than this many days
  color                String?      @db.VarChar(7)
  status               RecordStatus @default(ACTIVE)
  createdAt            DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt            DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  policies     LeavePolicy[]
  balances     LeaveBalance[]
  requests     LeaveRequest[]

  @@unique([organizationId, code])
  @@index([organizationId, status])
  @@map("leave_types")
}

// Entitlement rule for a leave type: quota, accrual, carry-forward, who it applies to.
model LeavePolicy {
  id                  String          @id @default(uuid()) @db.Uuid
  organizationId      String          @map("organization_id") @db.Uuid
  leaveTypeId         String          @map("leave_type_id") @db.Uuid
  name                String          @db.VarChar(120)
  staffType           StaffType?      @map("staff_type") // null = all staff
  employmentType      EmploymentType? @map("employment_type") // null = all employment types
  genderRestriction   Gender?         @map("gender_restriction") // e.g. FEMALE for maternity leave
  annualQuota         Decimal         @map("annual_quota") @db.Decimal(5, 1) // days per academic year
  accrual             LeaveAccrual    @default(YEARLY_UPFRONT)
  carryForwardAllowed Boolean         @default(false) @map("carry_forward_allowed")
  maxCarryForward     Decimal?        @map("max_carry_forward") @db.Decimal(5, 1)
  isEncashable        Boolean         @default(false) @map("is_encashable")
  maxConsecutiveDays  Int?            @map("max_consecutive_days") @db.SmallInt
  minNoticeDays       Int             @default(0) @map("min_notice_days") @db.SmallInt
  appliesInProbation  Boolean         @default(true) @map("applies_in_probation")
  approvalLevels      Int             @default(1) @map("approval_levels") @db.SmallInt // 1 = manager only, 2 = manager then principal ...
  effectiveFrom       DateTime        @map("effective_from") @db.Date
  effectiveTo         DateTime?       @map("effective_to") @db.Date
  status              RecordStatus    @default(ACTIVE)
  createdAt           DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt           DateTime?       @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  leaveType    LeaveType    @relation(fields: [leaveTypeId], references: [id], onDelete: Cascade)

  @@index([organizationId, leaveTypeId, status])
  @@index([organizationId, staffType, status])
  @@map("leave_policies")
}

// Leave balance of one staff member for one leave type in one academic year.
// Available = opening + carriedForward + accrued + adjusted - used - pending - encashed - lapsed.
model LeaveBalance {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  staffId        String   @map("staff_id") @db.Uuid
  leaveTypeId    String   @map("leave_type_id") @db.Uuid
  academicYearId String   @map("academic_year_id") @db.Uuid
  opening        Decimal  @default(0) @db.Decimal(5, 1)
  carriedForward Decimal  @default(0) @map("carried_forward") @db.Decimal(5, 1)
  accrued        Decimal  @default(0) @db.Decimal(5, 1)
  adjusted       Decimal  @default(0) @db.Decimal(5, 1) // manual corrections (+/-), always audited
  used           Decimal  @default(0) @db.Decimal(5, 1) // approved leave days
  pending        Decimal  @default(0) @db.Decimal(5, 1) // days in requests awaiting approval
  encashed       Decimal  @default(0) @db.Decimal(5, 1) // days paid out through payroll (LEAVE_ENCASHMENT adjustment)
  lapsed         Decimal  @default(0) @db.Decimal(5, 1) // days lost at year end
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  staff        Staff        @relation(fields: [staffId], references: [id], onDelete: Cascade)
  leaveType    LeaveType    @relation(fields: [leaveTypeId], references: [id], onDelete: Restrict)
  academicYear AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Restrict)

  @@unique([organizationId, staffId, leaveTypeId, academicYearId])
  @@index([organizationId, academicYearId, leaveTypeId])
  @@map("leave_balances")
}

// Staff leave application; approvals are tracked level by level in LeaveApprovalStep.
model LeaveRequest {
  id                   String          @id @default(uuid()) @db.Uuid
  organizationId       String          @map("organization_id") @db.Uuid
  campusId             String          @map("campus_id") @db.Uuid
  staffId              String          @map("staff_id") @db.Uuid
  leaveTypeId          String          @map("leave_type_id") @db.Uuid
  academicYearId       String          @map("academic_year_id") @db.Uuid
  startDate            DateTime        @map("start_date") @db.Date
  endDate              DateTime        @map("end_date") @db.Date
  startHalf            HalfDaySession? @map("start_half") // set when the first day is a half day
  endHalf              HalfDaySession? @map("end_half") // set when the last day is a half day
  totalDays            Decimal         @map("total_days") @db.Decimal(4, 1) // working days, excluding holidays and weekly offs
  reason               String          @db.VarChar(1000)
  workedOnDate         DateTime?       @map("worked_on_date") @db.Date // comp-off: the holiday / Sunday that was worked
  attachmentFileId     String?         @map("attachment_file_id") @db.Uuid // medical certificate etc.
  contactDuringLeave   String?         @map("contact_during_leave") @db.VarChar(20)
  substituteStaffId    String?         @map("substitute_staff_id") @db.Uuid // suggested substitute teacher
  status               ApprovalStatus  @default(PENDING)
  currentApprovalLevel Int             @default(1) @map("current_approval_level") @db.SmallInt // level waiting for action
  decidedById          String?         @map("decided_by_id") @db.Uuid // User who gave the final decision
  decidedAt            DateTime?       @map("decided_at") @db.Timestamptz(6)
  cancelledAt          DateTime?       @map("cancelled_at") @db.Timestamptz(6)
  cancelReason         String?         @map("cancel_reason") @db.VarChar(255)
  createdAt            DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt            DateTime?       @map("deleted_at") @db.Timestamptz(6)

  organization    Organization        @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus          Campus              @relation(fields: [campusId], references: [id], onDelete: Restrict)
  staff           Staff               @relation("LeaveRequestStaff", fields: [staffId], references: [id], onDelete: Restrict)
  substituteStaff Staff?              @relation("LeaveRequestSubstitute", fields: [substituteStaffId], references: [id], onDelete: SetNull)
  leaveType       LeaveType           @relation(fields: [leaveTypeId], references: [id], onDelete: Restrict)
  academicYear    AcademicYear        @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  attachmentFile  FileAsset?          @relation(fields: [attachmentFileId], references: [id], onDelete: SetNull)
  decidedBy       User?               @relation(fields: [decidedById], references: [id], onDelete: SetNull)
  approvalSteps   LeaveApprovalStep[]
  staffAttendance StaffAttendance[]
  substitutions   Substitution[]

  @@index([organizationId, staffId, startDate])
  @@index([organizationId, campusId, status, startDate])
  @@index([organizationId, academicYearId, leaveTypeId])
  @@map("leave_requests")
}

// One level of the approval chain of a staff leave request.
model LeaveApprovalStep {
  id             String         @id @default(uuid()) @db.Uuid
  organizationId String         @map("organization_id") @db.Uuid
  leaveRequestId String         @map("leave_request_id") @db.Uuid
  level          Int            @db.SmallInt // 1 = first approver
  approverId     String         @map("approver_id") @db.Uuid // User expected to act at this level
  status         ApprovalStatus @default(PENDING)
  remarks        String?        @db.VarChar(500)
  actedAt        DateTime?      @map("acted_at") @db.Timestamptz(6)
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  leaveRequest LeaveRequest @relation(fields: [leaveRequestId], references: [id], onDelete: Cascade)
  approver     User         @relation(fields: [approverId], references: [id], onDelete: Restrict)

  @@unique([organizationId, leaveRequestId, level])
  @@index([organizationId, approverId, status]) // "my pending approvals"
  @@map("leave_approval_steps")
}

// Leave application for a student, raised by a parent in the Parent Portal (or by staff on their behalf).
model StudentLeaveRequest {
  id                    String               @id @default(uuid()) @db.Uuid
  organizationId        String               @map("organization_id") @db.Uuid
  campusId              String               @map("campus_id") @db.Uuid
  studentId             String               @map("student_id") @db.Uuid
  batchId               String?              @map("batch_id") @db.Uuid // batch at the time of the request; routes it to the class teacher
  requestedByGuardianId String?              @map("requested_by_guardian_id") @db.Uuid
  requestedByUserId     String?              @map("requested_by_user_id") @db.Uuid // login that submitted the request
  category              StudentLeaveCategory @default(OTHER)
  startDate             DateTime             @map("start_date") @db.Date
  endDate               DateTime             @map("end_date") @db.Date
  startHalf             HalfDaySession?      @map("start_half") // set when the first day is a half day
  endHalf               HalfDaySession?      @map("end_half")
  totalDays             Decimal?             @map("total_days") @db.Decimal(4, 1)
  pickupGuardianId      String?              @map("pickup_guardian_id") @db.Uuid // who collects the child for an early-leave request
  reason                String               @db.VarChar(1000)
  attachmentFileId      String?              @map("attachment_file_id") @db.Uuid
  status                ApprovalStatus       @default(PENDING)
  reviewedById          String?              @map("reviewed_by_id") @db.Uuid
  reviewedAt            DateTime?            @map("reviewed_at") @db.Timestamptz(6)
  reviewRemarks         String?              @map("review_remarks") @db.VarChar(500)
  createdAt             DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt             DateTime?            @map("deleted_at") @db.Timestamptz(6)

  organization        Organization       @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus              Campus             @relation(fields: [campusId], references: [id], onDelete: Restrict)
  student             Student            @relation(fields: [studentId], references: [id], onDelete: Restrict)
  batch               Batch?             @relation(fields: [batchId], references: [id], onDelete: SetNull)
  requestedByGuardian Guardian?          @relation("StudentLeaveRequestedByGuardian", fields: [requestedByGuardianId], references: [id], onDelete: SetNull)
  pickupGuardian      Guardian?          @relation("StudentLeavePickupGuardian", fields: [pickupGuardianId], references: [id], onDelete: SetNull)
  requestedByUser     User?              @relation("StudentLeaveRequestedBy", fields: [requestedByUserId], references: [id], onDelete: SetNull)
  reviewedBy          User?              @relation("StudentLeaveReviewedBy", fields: [reviewedById], references: [id], onDelete: SetNull)
  attachmentFile      FileAsset?         @relation(fields: [attachmentFileId], references: [id], onDelete: SetNull)
  attendanceRecords   AttendanceRecord[]

  @@index([organizationId, studentId, startDate])
  @@index([organizationId, campusId, status, startDate])
  @@index([organizationId, batchId, status])
  @@map("student_leave_requests")
}
```

## Timetable and homework

File `server/prisma/schema/06-timetable-homework.prisma` — 9 models, 8 enums.

```prisma
// 06-timetable-homework: period slots, weekly timetable with clash protection,
// daily substitutions, homework, attachments and student submissions.

enum PeriodSlotType {
  PERIOD
  BREAK
  LUNCH
  ASSEMBLY
  ACTIVITY
}

enum SubstitutionStatus {
  ASSIGNED
  COMPLETED
  CANCELLED
}

enum HomeworkStatus {
  DRAFT
  PUBLISHED
  CLOSED // past due date and no more submissions accepted
  CANCELLED
}

enum HomeworkSubmissionMode {
  ONLINE // students / parents upload files or text
  OFFLINE // notebook checked in class; the teacher only marks the status
  NOT_REQUIRED // reading / revision work
}

enum HomeworkSubmissionStatus {
  PENDING
  SUBMITTED
  LATE
  RESUBMIT_REQUESTED
  GRADED
  MISSING
  EXCUSED
}

enum ClassSessionType {
  REGULAR
  EXTRA
  DOUBT_CLEARING
  REVISION
  TEST_DISCUSSION
  ONLINE
}

enum ClassSessionStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
  RESCHEDULED
}

enum StudyMaterialType {
  NOTES
  WORKSHEET // DPP / practice sheet
  VIDEO_LINK
  QUESTION_PAPER
  SOLUTION
  SYLLABUS
  OTHER
}

// A row of the campus bell schedule: Period 1 08:00-08:40, Lunch 11:20-11:50.
model PeriodSlot {
  id             String         @id @default(uuid()) @db.Uuid
  organizationId String         @map("organization_id") @db.Uuid
  campusId       String         @map("campus_id") @db.Uuid
  shift          Shift          @default(FULL_DAY) // each shift has its own bell schedule
  name           String         @db.VarChar(40)
  slotType       PeriodSlotType @default(PERIOD) @map("slot_type")
  startTime      String         @map("start_time") @db.VarChar(5) // HH:mm in the campus timezone
  endTime        String         @map("end_time") @db.VarChar(5) // HH:mm in the campus timezone
  sortOrder      Int            @default(0) @map("sort_order")
  status         RecordStatus   @default(ACTIVE)
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?      @map("deleted_at") @db.Timestamptz(6)

  organization       Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus             Campus              @relation(fields: [campusId], references: [id], onDelete: Restrict)
  timetableEntries   TimetableEntry[]
  substitutions      Substitution[]
  attendanceSessions AttendanceSession[]

  @@unique([organizationId, campusId, shift, name])
  @@index([organizationId, campusId, shift, sortOrder])
  @@map("period_slots")
}

// One cell of a batch's weekly timetable. Rows are replaced (hard delete) when the timetable changes,
// so the three unique keys below guarantee: no double booking of a batch, a teacher or a room.
// Elective split: one row per elective group (groupLabel) in the same slot. Combined class (11-A + 11-B together):
// one owner row holds staffId / roomId; follower rows keep them NULL and point to the owner with combinedWithEntryId.
model TimetableEntry {
  id                  String    @id @default(uuid()) @db.Uuid
  organizationId      String    @map("organization_id") @db.Uuid
  campusId            String    @map("campus_id") @db.Uuid
  academicYearId      String    @map("academic_year_id") @db.Uuid
  batchId             String    @map("batch_id") @db.Uuid
  weekDay             WeekDay   @map("week_day")
  periodSlotId        String    @map("period_slot_id") @db.Uuid
  subjectId           String?   @map("subject_id") @db.Uuid // null for non-subject periods (assembly, library, sports)
  staffId             String?   @map("staff_id") @db.Uuid // teacher; NULLs never clash in the unique key
  roomId              String?   @map("room_id") @db.Uuid // NULLs never clash in the unique key
  groupLabel          String    @default("") @map("group_label") @db.VarChar(30) // "" = whole batch; otherwise the elective group, e.g. SANSKRIT
  combinedWithEntryId String?   @map("combined_with_entry_id") @db.Uuid // follower row of a combined class: points to the owner row
  label               String?   @db.VarChar(80) // shown when subjectId is null, e.g. "Library"
  effectiveFrom       DateTime? @map("effective_from") @db.Date // informational; one timetable version is live per academic year
  notes               String?   @db.VarChar(255)
  createdById         String?   @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization    Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus          Campus           @relation(fields: [campusId], references: [id], onDelete: Restrict)
  academicYear    AcademicYear     @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  batch           Batch            @relation(fields: [batchId], references: [id], onDelete: Cascade)
  periodSlot      PeriodSlot       @relation(fields: [periodSlotId], references: [id], onDelete: Restrict)
  subject         Subject?         @relation(fields: [subjectId], references: [id], onDelete: Restrict)
  staff           Staff?           @relation(fields: [staffId], references: [id], onDelete: SetNull)
  room            Room?            @relation(fields: [roomId], references: [id], onDelete: SetNull)
  combinedWith    TimetableEntry?  @relation("TimetableCombined", fields: [combinedWithEntryId], references: [id], onDelete: Cascade)
  combinedEntries TimetableEntry[] @relation("TimetableCombined")
  substitutions   Substitution[]
  classSessions   ClassSession[]

  @@unique([organizationId, academicYearId, batchId, weekDay, periodSlotId, groupLabel], map: "uq_timetable_batch_slot") // batch clash (per elective group)
  @@unique([organizationId, academicYearId, staffId, weekDay, periodSlotId], map: "uq_timetable_teacher_slot") // teacher clash
  @@unique([organizationId, academicYearId, roomId, weekDay, periodSlotId], map: "uq_timetable_room_slot") // room clash
  @@index([organizationId, campusId, academicYearId, weekDay])
  @@index([organizationId, staffId, weekDay])
  @@map("timetable_entries")
}

// Replacement teacher for one timetable entry on one date (absent teacher, leave).
model Substitution {
  id                String             @id @default(uuid()) @db.Uuid
  organizationId    String             @map("organization_id") @db.Uuid
  campusId          String             @map("campus_id") @db.Uuid
  timetableEntryId  String             @map("timetable_entry_id") @db.Uuid
  date              DateTime           @db.Date
  periodSlotId      String             @map("period_slot_id") @db.Uuid // denormalised from the entry for the clash key
  originalStaffId   String             @map("original_staff_id") @db.Uuid
  substituteStaffId String?            @map("substitute_staff_id") @db.Uuid // null = free / self-study period
  roomId            String?            @map("room_id") @db.Uuid // room override for the day
  leaveRequestId    String?            @map("leave_request_id") @db.Uuid // leave that caused the substitution
  reason            String?            @db.VarChar(255)
  status            SubstitutionStatus @default(ASSIGNED)
  notifiedAt        DateTime?          @map("notified_at") @db.Timestamptz(6)
  assignedById      String?            @map("assigned_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt         DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization    Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus          Campus         @relation(fields: [campusId], references: [id], onDelete: Restrict)
  timetableEntry  TimetableEntry @relation(fields: [timetableEntryId], references: [id], onDelete: Cascade)
  periodSlot      PeriodSlot     @relation(fields: [periodSlotId], references: [id], onDelete: Restrict)
  originalStaff   Staff          @relation("SubstitutionOriginalStaff", fields: [originalStaffId], references: [id], onDelete: Restrict)
  substituteStaff Staff?         @relation("SubstitutionSubstituteStaff", fields: [substituteStaffId], references: [id], onDelete: SetNull)
  room            Room?          @relation(fields: [roomId], references: [id], onDelete: SetNull)
  leaveRequest    LeaveRequest?  @relation(fields: [leaveRequestId], references: [id], onDelete: SetNull)

  @@unique([organizationId, timetableEntryId, date])
  @@unique([organizationId, substituteStaffId, date, periodSlotId], map: "uq_substitution_teacher_slot") // a substitute cannot cover two classes at once
  @@index([organizationId, campusId, date])
  @@index([organizationId, originalStaffId, date])
  @@map("substitutions")
}

// Homework / assignment given to a batch for a subject.
model Homework {
  id                  String                 @id @default(uuid()) @db.Uuid
  organizationId      String                 @map("organization_id") @db.Uuid
  campusId            String                 @map("campus_id") @db.Uuid
  academicYearId      String                 @map("academic_year_id") @db.Uuid
  batchId             String                 @map("batch_id") @db.Uuid
  subjectId           String                 @map("subject_id") @db.Uuid
  assignedById        String                 @map("assigned_by_id") @db.Uuid // teacher (Staff) who set the homework
  title               String                 @db.VarChar(200)
  description         String?                @db.Text
  assignedDate        DateTime               @map("assigned_date") @db.Date
  dueDate             DateTime               @map("due_date") @db.Date
  submissionMode      HomeworkSubmissionMode @default(OFFLINE) @map("submission_mode")
  allowLateSubmission Boolean                @default(true) @map("allow_late_submission")
  maxMarks            Decimal?               @map("max_marks") @db.Decimal(6, 2) // null = not graded
  status              HomeworkStatus         @default(DRAFT)
  publishedAt         DateTime?              @map("published_at") @db.Timestamptz(6)
  notifyParents       Boolean                @default(true) @map("notify_parents")
  createdAt           DateTime               @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime               @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt           DateTime?              @map("deleted_at") @db.Timestamptz(6)

  organization Organization         @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus               @relation(fields: [campusId], references: [id], onDelete: Restrict)
  academicYear AcademicYear         @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  batch        Batch                @relation(fields: [batchId], references: [id], onDelete: Restrict)
  subject      Subject              @relation(fields: [subjectId], references: [id], onDelete: Restrict)
  assignedBy   Staff                @relation(fields: [assignedById], references: [id], onDelete: Restrict)
  attachments  HomeworkAttachment[]
  submissions  HomeworkSubmission[]

  @@index([organizationId, batchId, dueDate])
  @@index([organizationId, campusId, status, dueDate])
  @@index([organizationId, assignedById, status])
  @@index([organizationId, batchId, subjectId, assignedDate])
  @@map("homework")
}

// File or link attached to a homework by the teacher.
model HomeworkAttachment {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  homeworkId     String   @map("homework_id") @db.Uuid
  fileId         String?  @map("file_id") @db.Uuid // either a file ...
  externalUrl    String?  @map("external_url") @db.VarChar(1000) // ... or a link (video, Google Drive)
  title          String?  @db.VarChar(150)
  sortOrder      Int      @default(0) @map("sort_order")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  homework     Homework     @relation(fields: [homeworkId], references: [id], onDelete: Cascade)
  file         FileAsset?   @relation(fields: [fileId], references: [id], onDelete: Restrict)

  @@index([organizationId, homeworkId, sortOrder])
  @@map("homework_attachments")
}

// A student's work for a homework: status, files, marks and teacher feedback.
model HomeworkSubmission {
  id             String                   @id @default(uuid()) @db.Uuid
  organizationId String                   @map("organization_id") @db.Uuid
  homeworkId     String                   @map("homework_id") @db.Uuid
  studentId      String                   @map("student_id") @db.Uuid
  status         HomeworkSubmissionStatus @default(PENDING)
  answerText     String?                  @map("answer_text") @db.Text
  submittedAt    DateTime?                @map("submitted_at") @db.Timestamptz(6)
  submittedById  String?                  @map("submitted_by_id") @db.Uuid // User id of the student or parent (audit only, no FK)
  attemptNo      Int                      @default(1) @map("attempt_no") @db.SmallInt // increases after RESUBMIT_REQUESTED
  marksObtained  Decimal?                 @map("marks_obtained") @db.Decimal(6, 2)
  grade          String?                  @db.VarChar(10)
  feedback       String?                  @db.Text
  gradedById     String?                  @map("graded_by_id") @db.Uuid // teacher (Staff)
  gradedAt       DateTime?                @map("graded_at") @db.Timestamptz(6)
  createdAt      DateTime                 @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime                 @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization             @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  homework     Homework                 @relation(fields: [homeworkId], references: [id], onDelete: Restrict) // homework is soft-deleted; submissions and marks are never cascade-deleted
  student      Student                  @relation(fields: [studentId], references: [id], onDelete: Restrict)
  gradedBy     Staff?                   @relation(fields: [gradedById], references: [id], onDelete: SetNull)
  files        HomeworkSubmissionFile[]

  @@unique([organizationId, homeworkId, studentId])
  @@index([organizationId, studentId, status])
  @@index([organizationId, homeworkId, status])
  @@map("homework_submissions")
}

// File uploaded by the student / parent as part of a homework submission.
model HomeworkSubmissionFile {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  submissionId   String   @map("submission_id") @db.Uuid
  fileId         String   @map("file_id") @db.Uuid
  sortOrder      Int      @default(0) @map("sort_order")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  submission   HomeworkSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  file         FileAsset          @relation(fields: [fileId], references: [id], onDelete: Restrict)

  @@index([organizationId, submissionId])
  @@map("homework_submission_files")
}

// One dated lecture of a batch (generated from the weekly timetable or created ad hoc): extra class, doubt session,
// cancelled / rescheduled lecture, online class. Coaching attendance and per-lecture faculty pay attach to it.
model ClassSession {
  id                String             @id @default(uuid()) @db.Uuid
  organizationId    String             @map("organization_id") @db.Uuid
  campusId          String             @map("campus_id") @db.Uuid
  academicYearId    String             @map("academic_year_id") @db.Uuid
  batchId           String             @map("batch_id") @db.Uuid
  subjectId         String?            @map("subject_id") @db.Uuid
  staffId           String?            @map("staff_id") @db.Uuid // faculty who takes the lecture
  roomId            String?            @map("room_id") @db.Uuid
  timetableEntryId  String?            @map("timetable_entry_id") @db.Uuid // weekly cell this session was generated from
  date              DateTime           @db.Date
  startTime         String             @map("start_time") @db.VarChar(5) // HH:mm in the campus timezone
  endTime           String             @map("end_time") @db.VarChar(5)
  sessionType       ClassSessionType   @default(REGULAR) @map("session_type")
  status            ClassSessionStatus @default(SCHEDULED)
  topic             String?            @db.VarChar(255) // syllabus covered
  meetingUrl        String?            @map("meeting_url") @db.VarChar(500) // online class link
  cancelReason      String?            @map("cancel_reason") @db.VarChar(255)
  rescheduledFromId String?            @map("rescheduled_from_id") @db.Uuid // the session this one replaces
  parentsNotifiedAt DateTime?          @map("parents_notified_at") @db.Timestamptz(6) // cancel / reschedule alert queued
  createdById       String?            @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt         DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt         DateTime?          @map("deleted_at") @db.Timestamptz(6)

  organization       Organization        @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus             Campus              @relation(fields: [campusId], references: [id], onDelete: Restrict)
  academicYear       AcademicYear        @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  batch              Batch               @relation(fields: [batchId], references: [id], onDelete: Restrict)
  subject            Subject?            @relation(fields: [subjectId], references: [id], onDelete: SetNull)
  staff              Staff?              @relation(fields: [staffId], references: [id], onDelete: SetNull)
  room               Room?               @relation(fields: [roomId], references: [id], onDelete: SetNull)
  timetableEntry     TimetableEntry?     @relation(fields: [timetableEntryId], references: [id], onDelete: SetNull)
  rescheduledFrom    ClassSession?       @relation("ClassSessionReschedule", fields: [rescheduledFromId], references: [id], onDelete: SetNull)
  rescheduledTo      ClassSession[]      @relation("ClassSessionReschedule")
  attendanceSessions AttendanceSession[]

  @@index([organizationId, batchId, date])
  @@index([organizationId, staffId, date])
  @@index([organizationId, campusId, date, status])
  @@map("class_sessions")
}

// Learning resource (notes, DPP sheet, recorded-lecture link) shared with one or more batches; no due date or submission.
model StudyMaterial {
  id               String            @id @default(uuid()) @db.Uuid
  organizationId   String            @map("organization_id") @db.Uuid
  campusId         String            @map("campus_id") @db.Uuid
  academicYearId   String            @map("academic_year_id") @db.Uuid
  courseId         String?           @map("course_id") @db.Uuid
  subjectId        String?           @map("subject_id") @db.Uuid
  batchIds         String[]          @map("batch_ids") @db.Uuid // empty = every batch of the course
  title            String            @db.VarChar(200)
  description      String?           @db.Text
  materialType     StudyMaterialType @default(NOTES) @map("material_type")
  fileId           String?           @map("file_id") @db.Uuid // either a file ...
  externalUrl      String?           @map("external_url") @db.VarChar(1000) // ... or a link
  topic            String?           @db.VarChar(150)
  isPublished      Boolean           @default(true) @map("is_published")
  visibleToParents Boolean           @default(true) @map("visible_to_parents")
  uploadedById     String?           @map("uploaded_by_id") @db.Uuid // Staff
  createdAt        DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt        DateTime?         @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus       @relation(fields: [campusId], references: [id], onDelete: Restrict)
  academicYear AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  course       Course?      @relation(fields: [courseId], references: [id], onDelete: SetNull)
  subject      Subject?     @relation(fields: [subjectId], references: [id], onDelete: SetNull)
  file         FileAsset?   @relation(fields: [fileId], references: [id], onDelete: Restrict)
  uploadedBy   Staff?       @relation(fields: [uploadedById], references: [id], onDelete: SetNull)

  @@index([organizationId, campusId, subjectId, createdAt])
  @@index([organizationId, courseId, isPublished])
  @@map("study_materials")
}
```

## Exams and report cards

File `server/prisma/schema/07-exams.prisma` — 11 models, 10 enums.

```prisma
// 07-exams: grade scales, exams, exam schedules (date sheet), marks entry,
// report card templates and generated report cards with remarks.

enum GradeScaleType {
  PERCENTAGE_BANDS // A1, A2, B1 ... by percentage (CBSE style)
  GRADE_POINT // GPA / CGPA with grade points
  PASS_FAIL
}

enum ExamType {
  UNIT_TEST
  MID_TERM
  FINAL
  MOCK
  WEEKLY_TEST
  PRE_BOARD
  PRACTICAL
  SUPPLEMENTARY // compartment exam; linked to the original through Exam.parentExamId
  RETEST
  ENTRANCE
}

enum ReEvaluationStatus {
  REQUESTED
  FEE_PENDING
  UNDER_REVIEW
  NO_CHANGE
  MARKS_REVISED
  REJECTED
}

// Lifecycle: DRAFT -> SCHEDULED -> ONGOING -> MARKS_ENTRY -> PUBLISHED. CANCELLED is a terminal side exit.
enum ExamStatus {
  DRAFT
  SCHEDULED
  ONGOING
  MARKS_ENTRY
  PUBLISHED
  CANCELLED
}

// Marks-entry progress of one exam paper (ExamSchedule).
enum MarksEntryStatus {
  PENDING
  IN_PROGRESS
  SUBMITTED // teacher finished; waiting for verification
  VERIFIED
  LOCKED // published; changes need exams.marks.unlock
}

enum ReportCardBoardStyle {
  CBSE
  ICSE
  STATE
  COACHING
  GPA
}

enum ReportCardScope {
  EXAM // one exam
  TERM // all exams of a term, weighted
  ANNUAL // whole academic year
}

enum ReportCardStatus {
  DRAFT
  GENERATED // PDF ready, not visible to parents yet
  PUBLISHED
  WITHHELD // e.g. fee dues; hidden from the portals
}

enum ReportCardResult {
  PASS
  FAIL
  COMPARTMENT // must re-appear in one or more subjects
  PROMOTED
  DETAINED
  ABSENT
  NOT_APPLICABLE // coaching tests without pass / fail
}

enum ReportCardRemarkType {
  CLASS_TEACHER
  PRINCIPAL
  SUBJECT_TEACHER
  CO_SCHOLASTIC // art, sports, discipline, values
}

// Grading scheme of the organization, e.g. "CBSE 9-point" or "GPA 4.0".
model GradeScale {
  id             String         @id @default(uuid()) @db.Uuid
  organizationId String         @map("organization_id") @db.Uuid
  name           String         @db.VarChar(80)
  scaleType      GradeScaleType @default(PERCENTAGE_BANDS) @map("scale_type")
  description    String?        @db.VarChar(255)
  isDefault      Boolean        @default(false) @map("is_default") // single default: service layer + partial unique index in the SQL migration, UNIQUE (organization_id) WHERE is_default AND deleted_at IS NULL
  status         RecordStatus   @default(ACTIVE)
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?      @map("deleted_at") @db.Timestamptz(6)

  organization        Organization         @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  bands               GradeBand[]
  exams               Exam[]
  reportCardTemplates ReportCardTemplate[]

  @@unique([organizationId, name])
  @@index([organizationId, status])
  @@map("grade_scales")
}

// One band of a grade scale: grade A1 = 91-100 %, grade point 10.
model GradeBand {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  gradeScaleId   String   @map("grade_scale_id") @db.Uuid
  grade          String   @db.VarChar(10) // A1, B+, Distinction
  minPercent     Decimal  @map("min_percent") @db.Decimal(5, 2) // inclusive
  maxPercent     Decimal  @map("max_percent") @db.Decimal(5, 2) // inclusive
  gradePoint     Decimal? @map("grade_point") @db.Decimal(4, 2)
  description    String?  @db.VarChar(120) // Outstanding, Needs improvement
  isPass         Boolean  @default(true) @map("is_pass")
  sortOrder      Int      @default(0) @map("sort_order")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  gradeScale   GradeScale   @relation(fields: [gradeScaleId], references: [id], onDelete: Cascade)

  @@unique([organizationId, gradeScaleId, grade])
  @@index([organizationId, gradeScaleId, sortOrder])
  @@map("grade_bands")
}

// An examination of a campus in an academic year / term: "Unit Test 1", "Half Yearly", "JEE Mock 7".
model Exam {
  id                 String     @id @default(uuid()) @db.Uuid
  organizationId     String     @map("organization_id") @db.Uuid
  campusId           String     @map("campus_id") @db.Uuid
  academicYearId     String     @map("academic_year_id") @db.Uuid
  termId             String?    @map("term_id") @db.Uuid
  gradeScaleId       String?    @map("grade_scale_id") @db.Uuid // null = organization default scale
  parentExamId       String?    @map("parent_exam_id") @db.Uuid // original exam that this supplementary / re-test replaces
  name               String     @db.VarChar(120)
  code               String?    @db.VarChar(30)
  examType           ExamType   @map("exam_type")
  status             ExamStatus @default(DRAFT)
  startDate          DateTime   @map("start_date") @db.Date
  endDate            DateTime   @map("end_date") @db.Date
  weightage          Decimal?   @db.Decimal(5, 2) // % contribution to the term / annual result
  marksEntryDeadline DateTime?  @map("marks_entry_deadline") @db.Date
  instructions       String?    @db.Text
  showRank           Boolean    @default(false) @map("show_rank") // coaching tests usually show ranks; many schools do not
  publishedAt        DateTime?  @map("published_at") @db.Timestamptz(6)
  publishedById      String?    @map("published_by_id") @db.Uuid // User id (audit only, no FK)
  createdById        String?    @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt          DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt          DateTime?  @map("deleted_at") @db.Timestamptz(6)

  organization Organization   @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus         @relation(fields: [campusId], references: [id], onDelete: Restrict)
  academicYear AcademicYear   @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  term         Term?          @relation(fields: [termId], references: [id], onDelete: SetNull)
  gradeScale   GradeScale?    @relation(fields: [gradeScaleId], references: [id], onDelete: SetNull)
  parentExam   Exam?          @relation("ExamRetest", fields: [parentExamId], references: [id], onDelete: SetNull)
  retests      Exam[]         @relation("ExamRetest")
  schedules    ExamSchedule[]
  marks        ExamMark[]
  reportCards  ReportCard[]

  @@unique([organizationId, campusId, academicYearId, name])
  @@index([organizationId, parentExamId])
  @@index([organizationId, campusId, academicYearId, status])
  @@index([organizationId, termId])
  @@index([organizationId, examType, startDate])
  @@map("exams")
}

// One paper of an exam: exam + batch + subject with date, time, room and marks limits (the date sheet).
model ExamSchedule {
  id                   String           @id @default(uuid()) @db.Uuid
  organizationId       String           @map("organization_id") @db.Uuid
  campusId             String           @map("campus_id") @db.Uuid
  examId               String           @map("exam_id") @db.Uuid
  batchId              String           @map("batch_id") @db.Uuid
  subjectId            String           @map("subject_id") @db.Uuid
  examDate             DateTime         @map("exam_date") @db.Date
  startTime            String?          @map("start_time") @db.VarChar(5) // HH:mm in the campus timezone
  endTime              String?          @map("end_time") @db.VarChar(5) // HH:mm in the campus timezone
  durationMinutes      Int?             @map("duration_minutes") @db.SmallInt
  roomId               String?          @map("room_id") @db.Uuid
  invigilatorId        String?          @map("invigilator_id") @db.Uuid // Staff on duty
  maxMarks             Decimal          @map("max_marks") @db.Decimal(6, 2)
  passMarks            Decimal          @map("pass_marks") @db.Decimal(6, 2)
  negativeMarkPerWrong Decimal?         @map("negative_mark_per_wrong") @db.Decimal(4, 2) // JEE / NEET style mock tests
  totalQuestions       Int?             @map("total_questions") @db.SmallInt
  syllabus             String?          @db.Text
  marksEntryStatus     MarksEntryStatus @default(PENDING) @map("marks_entry_status")
  marksSubmittedAt     DateTime?        @map("marks_submitted_at") @db.Timestamptz(6)
  marksVerifiedAt      DateTime?        @map("marks_verified_at") @db.Timestamptz(6)
  createdAt            DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt            DateTime?        @map("deleted_at") @db.Timestamptz(6)

  organization Organization            @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus                  @relation(fields: [campusId], references: [id], onDelete: Restrict)
  exam         Exam                    @relation(fields: [examId], references: [id], onDelete: Restrict) // exams are soft-deleted; marks are never cascade-deleted
  batch        Batch                   @relation(fields: [batchId], references: [id], onDelete: Restrict)
  subject      Subject                 @relation(fields: [subjectId], references: [id], onDelete: Restrict)
  room         Room?                   @relation(fields: [roomId], references: [id], onDelete: SetNull)
  invigilator  Staff?                  @relation(fields: [invigilatorId], references: [id], onDelete: SetNull)
  marks        ExamMark[]
  components   ExamScheduleComponent[]

  @@unique([id, organizationId]) // target of composite tenant-safe foreign keys
  @@unique([organizationId, examId, batchId, subjectId])
  @@index([organizationId, campusId, examDate])
  @@index([organizationId, batchId, examDate])
  @@index([organizationId, invigilatorId, examDate])
  @@index([organizationId, examId, marksEntryStatus])
  @@map("exam_schedules")
}

// Marks of one student in one exam paper.
model ExamMark {
  id               String    @id @default(uuid()) @db.Uuid
  organizationId   String    @map("organization_id") @db.Uuid
  campusId         String    @map("campus_id") @db.Uuid // denormalised from the schedule for campus scoping
  examScheduleId   String    @map("exam_schedule_id") @db.Uuid
  examId           String    @map("exam_id") @db.Uuid // denormalised from the schedule for result queries
  batchId          String    @map("batch_id") @db.Uuid // denormalised from the schedule
  subjectId        String    @map("subject_id") @db.Uuid // denormalised from the schedule
  studentId        String    @map("student_id") @db.Uuid
  marksObtained    Decimal?  @map("marks_obtained") @db.Decimal(6, 2) // null when absent or exempt; cached total when the paper has components
  correctCount     Int?      @map("correct_count") @db.SmallInt // objective tests
  incorrectCount   Int?      @map("incorrect_count") @db.SmallInt
  unattemptedCount Int?      @map("unattempted_count") @db.SmallInt
  negativeMarks    Decimal?  @map("negative_marks") @db.Decimal(6, 2)
  subjectRank      Int?      @map("subject_rank") // rank in this paper across all batches that took it
  isSupplementary  Boolean   @default(false) @map("is_supplementary") // mark earned in a SUPPLEMENTARY / RETEST exam
  revisionCount    Int       @default(0) @map("revision_count") @db.SmallInt // times changed after re-evaluation
  grade            String?   @db.VarChar(10) // from the grade scale at save time
  gradePoint       Decimal?  @map("grade_point") @db.Decimal(4, 2)
  isAbsent         Boolean   @default(false) @map("is_absent")
  isExempt         Boolean   @default(false) @map("is_exempt") // medical or other exemption; left out of totals
  remarks          String?   @db.VarChar(255)
  enteredById      String?   @map("entered_by_id") @db.Uuid
  enteredAt        DateTime? @map("entered_at") @db.Timestamptz(6)
  verifiedById     String?   @map("verified_by_id") @db.Uuid
  verifiedAt       DateTime? @map("verified_at") @db.Timestamptz(6)
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization         Organization              @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus               Campus                    @relation(fields: [campusId], references: [id], onDelete: Restrict)
  examSchedule         ExamSchedule              @relation(fields: [examScheduleId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK: same tenant guaranteed by the database
  exam                 Exam                      @relation(fields: [examId], references: [id], onDelete: Restrict)
  batch                Batch                     @relation(fields: [batchId], references: [id], onDelete: Restrict)
  subject              Subject                   @relation(fields: [subjectId], references: [id], onDelete: Restrict)
  student              Student                   @relation(fields: [studentId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK
  enteredBy            User?                     @relation("ExamMarkEnteredBy", fields: [enteredById], references: [id], onDelete: SetNull)
  verifiedBy           User?                     @relation("ExamMarkVerifiedBy", fields: [verifiedById], references: [id], onDelete: SetNull)
  components           ExamMarkComponent[]
  reEvaluationRequests ExamReEvaluationRequest[]

  @@unique([organizationId, examScheduleId, studentId])
  @@index([organizationId, campusId, examId])
  @@index([organizationId, studentId, examId])
  @@index([organizationId, examId, subjectId])
  @@index([organizationId, examId, batchId])
  @@map("exam_marks")
}

// Marks component of an exam paper: Theory 80 + Internal 20, or Theory 70 + Practical 30.
model ExamScheduleComponent {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  examScheduleId String   @map("exam_schedule_id") @db.Uuid
  name           String   @db.VarChar(60) // Theory, Practical, Internal Assessment
  code           String   @db.VarChar(20) // TH, PR, IA
  maxMarks       Decimal  @map("max_marks") @db.Decimal(6, 2)
  passMarks      Decimal? @map("pass_marks") @db.Decimal(6, 2) // set when the component has its own pass rule
  sortOrder      Int      @default(0) @map("sort_order")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization        @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  examSchedule ExamSchedule        @relation(fields: [examScheduleId], references: [id], onDelete: Cascade)
  marks        ExamMarkComponent[]

  @@unique([organizationId, examScheduleId, code])
  @@map("exam_schedule_components")
}

// Marks of one student in one component of a paper; ExamMark.marksObtained holds the cached total.
model ExamMarkComponent {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  examMarkId     String   @map("exam_mark_id") @db.Uuid
  componentId    String   @map("component_id") @db.Uuid
  marksObtained  Decimal? @map("marks_obtained") @db.Decimal(6, 2)
  isAbsent       Boolean  @default(false) @map("is_absent")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization          @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  examMark     ExamMark              @relation(fields: [examMarkId], references: [id], onDelete: Cascade)
  component    ExamScheduleComponent @relation(fields: [componentId], references: [id], onDelete: Restrict)

  @@unique([organizationId, examMarkId, componentId])
  @@index([organizationId, componentId])
  @@map("exam_mark_components")
}

// Re-checking / re-totalling request for one exam paper of a student, raised after results are published.
model ExamReEvaluationRequest {
  id                String             @id @default(uuid()) @db.Uuid
  organizationId    String             @map("organization_id") @db.Uuid
  campusId          String             @map("campus_id") @db.Uuid
  examMarkId        String             @map("exam_mark_id") @db.Uuid
  studentId         String             @map("student_id") @db.Uuid
  requestedByUserId String?            @map("requested_by_user_id") @db.Uuid // parent / student login
  reason            String             @db.VarChar(500)
  status            ReEvaluationStatus @default(REQUESTED)
  feeInvoiceId      String?            @map("fee_invoice_id") @db.Uuid // ad-hoc invoice for the re-checking fee
  originalMarks     Decimal?           @map("original_marks") @db.Decimal(6, 2)
  revisedMarks      Decimal?           @map("revised_marks") @db.Decimal(6, 2)
  reviewedById      String?            @map("reviewed_by_id") @db.Uuid
  reviewedAt        DateTime?          @map("reviewed_at") @db.Timestamptz(6)
  reviewRemarks     String?            @map("review_remarks") @db.VarChar(500)
  createdAt         DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus          Campus       @relation(fields: [campusId], references: [id], onDelete: Restrict)
  examMark        ExamMark     @relation(fields: [examMarkId], references: [id], onDelete: Restrict)
  student         Student      @relation(fields: [studentId], references: [id], onDelete: Restrict)
  feeInvoice      FeeInvoice?  @relation(fields: [feeInvoiceId], references: [id], onDelete: SetNull)
  requestedByUser User?        @relation("ReEvaluationRequestedBy", fields: [requestedByUserId], references: [id], onDelete: SetNull)
  reviewedBy      User?        @relation("ReEvaluationReviewedBy", fields: [reviewedById], references: [id], onDelete: SetNull)

  @@index([organizationId, campusId, status, createdAt])
  @@index([organizationId, studentId])
  @@index([organizationId, examMarkId])
  @@map("exam_re_evaluation_requests")
}

// Report card design: board style, layout blocks and display options.
model ReportCardTemplate {
  id             String               @id @default(uuid()) @db.Uuid
  organizationId String               @map("organization_id") @db.Uuid
  name           String               @db.VarChar(100)
  boardStyle     ReportCardBoardStyle @map("board_style")
  gradeScaleId   String?              @map("grade_scale_id") @db.Uuid
  layout         Json // blocks, columns, fonts, logo position, signature slots
  settings       Json? // { showRank, showAttendance, showCoScholastic, showGradeOnly, showPercentage }
  courseIds      String[]             @map("course_ids") @db.Uuid // empty = usable for every course
  isDefault      Boolean              @default(false) @map("is_default")
  status         RecordStatus         @default(ACTIVE)
  createdAt      DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?            @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  gradeScale   GradeScale?  @relation(fields: [gradeScaleId], references: [id], onDelete: SetNull)
  reportCards  ReportCard[]

  @@unique([organizationId, name])
  @@index([organizationId, boardStyle, status])
  @@map("report_card_templates")
}

// Generated result of one student for an exam, a term or the whole year, with the PDF.
model ReportCard {
  id                String           @id @default(uuid()) @db.Uuid
  organizationId    String           @map("organization_id") @db.Uuid
  campusId          String           @map("campus_id") @db.Uuid
  academicYearId    String           @map("academic_year_id") @db.Uuid
  studentId         String           @map("student_id") @db.Uuid
  batchId           String           @map("batch_id") @db.Uuid // batch at the time of the result
  scope             ReportCardScope
  examId            String?          @map("exam_id") @db.Uuid // set when scope is EXAM
  termId            String?          @map("term_id") @db.Uuid // set when scope is TERM
  scopeKey          String           @map("scope_key") @db.VarChar(45) // "EXAM:{examId}", "TERM:{termId}" or "ANNUAL"; makes the unique key work without NULLs
  templateId        String?          @map("template_id") @db.Uuid
  totalMarks        Decimal?         @map("total_marks") @db.Decimal(8, 2) // marks obtained
  maxMarks          Decimal?         @map("max_marks") @db.Decimal(8, 2)
  percentage        Decimal?         @db.Decimal(5, 2)
  grade             String?          @db.VarChar(10)
  gradePoint        Decimal?         @map("grade_point") @db.Decimal(4, 2) // GPA / CGPA
  rank              Int? // rank in the batch; null when ranks are switched off
  rankOutOf         Int?             @map("rank_out_of")
  overallRank       Int?             @map("overall_rank") // rank across all batches that took the exam ("AIR-style")
  overallRankOutOf  Int?             @map("overall_rank_out_of")
  percentile        Decimal?         @db.Decimal(5, 2)
  result            ReportCardResult @default(NOT_APPLICABLE)
  remarks           String?          @db.Text // overall remark printed on the card
  attendanceSummary Json?            @map("attendance_summary") // { workingDays, presentDays, percent }
  subjectResults    Json?            @map("subject_results") // frozen per-subject rows used to render the PDF
  status            ReportCardStatus @default(DRAFT)
  pdfFileId         String?          @map("pdf_file_id") @db.Uuid
  generatedAt       DateTime?        @map("generated_at") @db.Timestamptz(6)
  publishedAt       DateTime?        @map("published_at") @db.Timestamptz(6)
  publishedById     String?          @map("published_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt         DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt         DateTime?        @map("deleted_at") @db.Timestamptz(6)

  organization Organization        @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus              @relation(fields: [campusId], references: [id], onDelete: Restrict)
  academicYear AcademicYear        @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  student      Student             @relation(fields: [studentId], references: [id], onDelete: Restrict)
  batch        Batch               @relation(fields: [batchId], references: [id], onDelete: Restrict)
  exam         Exam?               @relation(fields: [examId], references: [id], onDelete: Restrict)
  term         Term?               @relation(fields: [termId], references: [id], onDelete: Restrict)
  template     ReportCardTemplate? @relation(fields: [templateId], references: [id], onDelete: SetNull)
  pdfFile      FileAsset?          @relation(fields: [pdfFileId], references: [id], onDelete: SetNull)
  remarkRows   ReportCardRemark[]

  @@unique([organizationId, studentId, academicYearId, scopeKey])
  @@index([organizationId, batchId, scopeKey, status])
  @@index([organizationId, campusId, academicYearId, status])
  @@index([organizationId, examId])
  @@map("report_cards")
}

// Remark written on a report card by the class teacher, principal or a subject teacher.
model ReportCardRemark {
  id             String               @id @default(uuid()) @db.Uuid
  organizationId String               @map("organization_id") @db.Uuid
  reportCardId   String               @map("report_card_id") @db.Uuid
  remarkType     ReportCardRemarkType @map("remark_type")
  subjectId      String?              @map("subject_id") @db.Uuid // SUBJECT_TEACHER remarks only
  area           String?              @db.VarChar(80) // CO_SCHOLASTIC area, e.g. Discipline, Art
  grade          String?              @db.VarChar(10) // optional grade for co-scholastic areas
  body           String               @db.Text
  authorId       String?              @map("author_id") @db.Uuid
  createdAt      DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  reportCard   ReportCard   @relation(fields: [reportCardId], references: [id], onDelete: Cascade)
  subject      Subject?     @relation(fields: [subjectId], references: [id], onDelete: SetNull)
  author       User?        @relation(fields: [authorId], references: [id], onDelete: SetNull)

  @@index([organizationId, reportCardId, remarkType])
  @@map("report_card_remarks")
}
```

## Fees, discounts and scholarships

File `server/prisma/schema/08-fees.prisma` — 18 models, 17 enums.

```prisma
// 08-fees: fee heads, fee structures and installments, student fee assignments, invoices,
// late-fee rules, discounts, scholarships (scheme -> application -> award -> disbursement) and reminder log.

enum FeeHeadType {
  TUITION
  ADMISSION
  REGISTRATION
  TRANSPORT
  HOSTEL
  EXAM
  LIBRARY
  LAB
  ACTIVITY
  UNIFORM
  BOOKS
  CAUTION_DEPOSIT // refundable security / caution money (school or hostel)
  FINE
  ARREARS // previous-year dues carried forward
  MESS // hostel mess charges
  CHEQUE_BOUNCE_CHARGE
  CERTIFICATE
  MISCELLANEOUS
}

// How a supply is treated for tax. Most education fees are EXEMPT; coaching in India is TAXABLE; UAE education is ZERO_RATED.
enum TaxTreatment {
  TAXABLE
  EXEMPT
  NIL_RATED
  ZERO_RATED
  OUT_OF_SCOPE
}

enum TaxType {
  GST
  VAT
  SALES_TAX
  NONE
}

// Which students a fee structure item is charged to.
enum FeeApplicability {
  ALL_STUDENTS
  NEW_ADMISSIONS_ONLY // admission fee, registration fee, caution deposit
  EXISTING_STUDENTS_ONLY
}

// Credit / debit note types for an issued invoice; the sign of the amount comes from the type.
enum FeeAdjustmentType {
  CONCESSION // credit
  WAIVER // credit
  LATE_FEE_WAIVER // credit
  DEBIT_CORRECTION // debit
  CREDIT_CORRECTION // credit
  PARTIAL_WRITE_OFF // credit
}

enum FeeFrequency {
  ONE_TIME
  MONTHLY
  QUARTERLY
  HALF_YEARLY
  YEARLY
}

enum FeeAssignmentStatus {
  ACTIVE
  PAUSED // invoicing on hold (long leave)
  ENDED // student left or the year closed
  CANCELLED
}

enum FeeInvoiceStatus {
  DRAFT
  ISSUED
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
  WRITTEN_OFF
  CARRIED_FORWARD // closed old-year invoice whose balance moved to an ARREARS invoice of the new session
}

enum LateFeeCalculation {
  FIXED_ONCE // one flat amount after the grace period
  FIXED_PER_DAY
  FIXED_PER_MONTH
  PERCENT_OF_BALANCE // one-time % of the unpaid balance
  PERCENT_PER_MONTH
}

enum DiscountType {
  PERCENT
  FIXED
}

enum DiscountCategory {
  SIBLING
  EARLY_BIRD
  STAFF_CHILD
  MERIT
  FULL_PAYMENT // pays the whole year upfront
  REFERRAL
  FINANCIAL_AID
  PROMOTIONAL
  CUSTOM
}

enum DiscountScope {
  INVOICE_TOTAL // applies to the whole invoice subtotal
  FEE_HEADS // applies only to the fee heads listed in feeHeadIds
}

enum ScholarshipFundingSource {
  INSTITUTE
  GOVERNMENT
  TRUST
  DONOR
  CORPORATE_CSR
}

enum ScholarshipStatus {
  DRAFT
  OPEN // accepting applications
  CLOSED
  ARCHIVED
}

// Lifecycle: DRAFT -> SUBMITTED -> UNDER_REVIEW -> SHORTLISTED -> APPROVED -> AWARDED, or REJECTED / WITHDRAWN.
enum ScholarshipApplicationStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  SHORTLISTED
  APPROVED
  AWARDED
  REJECTED
  WITHDRAWN
}

enum ScholarshipAwardStatus {
  ACTIVE
  FULLY_DISBURSED
  SUSPENDED
  REVOKED
  EXPIRED
}

enum FeeReminderType {
  UPCOMING_DUE
  DUE_TODAY
  OVERDUE
  FINAL_NOTICE
  MANUAL
}

// Kind of charge: Tuition, Transport, Hostel, Exam ... with tax settings.
model FeeHead {
  id                 String       @id @default(uuid()) @db.Uuid
  organizationId     String       @map("organization_id") @db.Uuid
  name               String       @db.VarChar(100)
  code               String       @db.VarChar(30)
  headType           FeeHeadType  @default(TUITION) @map("head_type")
  description        String?      @db.VarChar(255)
  isTaxable          Boolean      @default(false) @map("is_taxable") // most education fees are tax exempt; uniform / books may not be
  taxRate            Decimal      @default(0) @map("tax_rate") @db.Decimal(5, 2) // percent, used only when isTaxable and taxRateId is null
  taxRateId          String?      @map("tax_rate_id") @db.Uuid // effective-dated rate with components (CGST + SGST / IGST); wins over taxRate
  taxTreatment       TaxTreatment @default(EXEMPT) @map("tax_treatment")
  isTaxInclusive     Boolean      @default(false) @map("is_tax_inclusive") // price already includes tax (Australia GST)
  taxCode            String?      @map("tax_code") @db.VarChar(20) // HSN / SAC master value; frozen onto each invoice line
  settlementPriority Int          @default(0) @map("settlement_priority") // lower = settled first when a partial payment is split over heads
  isRefundable       Boolean      @default(false) @map("is_refundable") // e.g. caution deposit
  accountCode        String?      @map("account_code") @db.VarChar(30) // ledger code for accounting exports
  sortOrder          Int          @default(0) @map("sort_order")
  status             RecordStatus @default(ACTIVE)
  createdAt          DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt          DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization           Organization            @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  taxRateRef             TaxRate?                @relation(fields: [taxRateId], references: [id], onDelete: Restrict)
  structureItems         FeeStructureItem[]
  invoiceItems           FeeInvoiceItem[]
  paymentAllocationItems PaymentAllocationItem[]
  refunds                Refund[]
  inventoryItems         InventoryItem[]
  transportAssignments   TransportAssignment[]
  hostelAllocations      HostelAllocation[]

  @@unique([organizationId, code])
  @@index([organizationId, headType, status])
  @@map("fee_heads")
}

// Effective-dated tax rate with components: GST 18 % = CGST 9 + SGST 9 (intra-state) or IGST 18 (inter-state); VAT 5 %; US state sales tax.
model TaxRate {
  id                   String       @id @default(uuid()) @db.Uuid
  organizationId       String       @map("organization_id") @db.Uuid
  campusId             String?      @map("campus_id") @db.Uuid // null = every campus
  name                 String       @db.VarChar(80) // "GST 18%"
  countryCode          String       @map("country_code") @db.Char(2)
  region               String?      @db.VarChar(10) // state code for per-state rates
  taxType              TaxType      @map("tax_type")
  ratePercent          Decimal      @map("rate_percent") @db.Decimal(5, 2)
  components           Json? // [{ code: "CGST", percent: 9 }, { code: "SGST", percent: 9 }]
  interStateComponents Json?        @map("inter_state_components") // [{ code: "IGST", percent: 18 }]
  validFrom            DateTime     @map("valid_from") @db.Date
  validTo              DateTime?    @map("valid_to") @db.Date
  status               RecordStatus @default(ACTIVE)
  createdAt            DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt            DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus?      @relation(fields: [campusId], references: [id], onDelete: Restrict)
  feeHeads     FeeHead[]

  @@unique([organizationId, name, validFrom])
  @@index([organizationId, countryCode, region, status])
  @@map("tax_rates")
}

// Fee plan for a course (optionally one batch) in an academic year.
model FeeStructure {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  campusId       String?      @map("campus_id") @db.Uuid // null = same plan at every campus
  campusKey      String       @default("ALL") @map("campus_key") @db.VarChar(36) // "ALL" or the campusId; makes the unique key work without NULLs
  academicYearId String       @map("academic_year_id") @db.Uuid
  courseId       String?      @map("course_id") @db.Uuid // null = generic plan (e.g. transport only)
  batchId        String?      @map("batch_id") @db.Uuid // set only when one batch has its own plan
  lateFeeRuleId  String?      @map("late_fee_rule_id") @db.Uuid
  name           String       @db.VarChar(120)
  description    String?      @db.VarChar(500)
  currency       String       @db.Char(3)
  totalAmount    Decimal      @default(0) @map("total_amount") @db.Decimal(12, 2) // cached yearly total of all items
  status         RecordStatus @default(ACTIVE)
  createdById    String?      @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization Organization           @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus?                @relation(fields: [campusId], references: [id], onDelete: Restrict)
  academicYear AcademicYear           @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  course       Course?                @relation(fields: [courseId], references: [id], onDelete: Restrict)
  batch        Batch?                 @relation(fields: [batchId], references: [id], onDelete: Restrict)
  lateFeeRule  LateFeeRule?           @relation(fields: [lateFeeRuleId], references: [id], onDelete: SetNull)
  items        FeeStructureItem[]
  installments FeeInstallment[]
  assignments  StudentFeeAssignment[]

  @@unique([organizationId, academicYearId, campusKey, name]) // two campuses may each have "Class 10 Fees 2027-28"
  @@index([organizationId, academicYearId, courseId, status])
  @@index([organizationId, campusId, academicYearId])
  @@index([organizationId, batchId])
  @@map("fee_structures")
}

// One fee head inside a fee structure with its amount and billing frequency.
model FeeStructureItem {
  id                String            @id @default(uuid()) @db.Uuid
  organizationId    String            @map("organization_id") @db.Uuid
  feeStructureId    String            @map("fee_structure_id") @db.Uuid
  feeHeadId         String            @map("fee_head_id") @db.Uuid
  amount            Decimal           @db.Decimal(12, 2) // amount per frequency period, before tax
  frequency         FeeFrequency      @default(ONE_TIME)
  isOptional        Boolean           @default(false) @map("is_optional") // e.g. transport; added per student in the assignment
  applicability     FeeApplicability  @default(ALL_STUDENTS) // admission fee / caution deposit: NEW_ADMISSIONS_ONLY
  installmentNos    Int[]             @map("installment_nos") // installments that carry this head; empty = spread by frequency
  studentCategories StudentCategory[] @map("student_categories") // empty = every category
  admissionQuotas   AdmissionQuota[]  @map("admission_quotas") // empty = every quota; e.g. exclude RTE / STAFF_WARD from a head
  sortOrder         Int               @default(0) @map("sort_order")
  createdAt         DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  feeStructure FeeStructure @relation(fields: [feeStructureId], references: [id], onDelete: Cascade)
  feeHead      FeeHead      @relation(fields: [feeHeadId], references: [id], onDelete: Restrict)

  @@unique([organizationId, feeStructureId, feeHeadId])
  @@index([organizationId, feeHeadId])
  @@map("fee_structure_items")
}

// Payment schedule of a fee structure: installment 1 due 10 Apr, installment 2 due 10 Jul ...
model FeeInstallment {
  id             String    @id @default(uuid()) @db.Uuid
  organizationId String    @map("organization_id") @db.Uuid
  feeStructureId String    @map("fee_structure_id") @db.Uuid
  installmentNo  Int       @map("installment_no") @db.SmallInt
  name           String    @db.VarChar(80) // "Quarter 1", "April 2027"
  dueDate        DateTime  @map("due_date") @db.Date
  periodStart    DateTime? @map("period_start") @db.Date
  periodEnd      DateTime? @map("period_end") @db.Date
  amount         Decimal   @db.Decimal(12, 2) // planned amount before student-level overrides and discounts
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  feeStructure FeeStructure @relation(fields: [feeStructureId], references: [id], onDelete: Cascade)
  invoices     FeeInvoice[]

  @@unique([organizationId, feeStructureId, installmentNo])
  @@index([organizationId, dueDate])
  @@map("fee_installments")
}

// A fee structure applied to one student for one academic year, with per-student overrides.
model StudentFeeAssignment {
  id                 String              @id @default(uuid()) @db.Uuid
  organizationId     String              @map("organization_id") @db.Uuid
  campusId           String              @map("campus_id") @db.Uuid
  studentId          String              @map("student_id") @db.Uuid
  enrollmentId       String?             @map("enrollment_id") @db.Uuid
  academicYearId     String              @map("academic_year_id") @db.Uuid
  feeStructureId     String              @map("fee_structure_id") @db.Uuid
  status             FeeAssignmentStatus @default(ACTIVE)
  startDate          DateTime            @map("start_date") @db.Date // mid-year joiners are billed from this date
  endDate            DateTime?           @map("end_date") @db.Date
  overrides          Json? // [{ feeHeadId, amount, reason }] amounts that replace the structure amounts
  excludedFeeHeadIds String[]            @map("excluded_fee_head_ids") @db.Uuid // optional heads the student does not take
  hasCustomSchedule  Boolean             @default(false) @map("has_custom_schedule") // true = StudentFeeInstallment rows replace the structure's installments
  currency           String              @db.Char(3)
  netYearlyAmount    Decimal?            @map("net_yearly_amount") @db.Decimal(12, 2) // cached total after overrides, before discounts
  notes              String?             @db.VarChar(500)
  assignedById       String?             @map("assigned_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt          DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt          DateTime?           @map("deleted_at") @db.Timestamptz(6)

  organization       Organization            @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus             Campus                  @relation(fields: [campusId], references: [id], onDelete: Restrict)
  student            Student                 @relation(fields: [studentId], references: [id], onDelete: Restrict)
  enrollment         Enrollment?             @relation(fields: [enrollmentId], references: [id], onDelete: SetNull)
  academicYear       AcademicYear            @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  feeStructure       FeeStructure            @relation(fields: [feeStructureId], references: [id], onDelete: Restrict)
  invoices           FeeInvoice[]
  customInstallments StudentFeeInstallment[]

  // One live assignment per student + structure + year: partial unique index in the SQL migration,
  // uq_student_fee_assignment_live (organization_id, student_id, fee_structure_id, academic_year_id) WHERE deleted_at IS NULL AND status <> 'CANCELLED'
  @@index([organizationId, studentId, feeStructureId, academicYearId])
  @@index([organizationId, studentId, status])
  @@index([organizationId, campusId, academicYearId, status])
  @@index([organizationId, feeStructureId])
  @@map("student_fee_assignments")
}

// Fee bill raised to a student for a period. Cached money columns (kept in the row for fast dues lists):
//   total   = subtotal - discountTotal + taxTotal + lateFee + adjustmentTotal
//   balance = total - scholarshipCredit - amountPaid - writtenOffAmount
// Issued invoices are cancelled, never deleted; a corrected invoice points back with replacesInvoiceId.
// One LIVE invoice per student per installment is enforced by a partial unique index in the SQL migration:
//   uq_fee_invoice_installment (organization_id, student_id, assignment_id, installment_id) WHERE status <> 'CANCELLED' AND deleted_at IS NULL
model FeeInvoice {
  id                   String           @id @default(uuid()) @db.Uuid
  organizationId       String           @map("organization_id") @db.Uuid
  campusId             String           @map("campus_id") @db.Uuid
  academicYearId       String           @map("academic_year_id") @db.Uuid
  studentId            String           @map("student_id") @db.Uuid
  assignmentId         String?          @map("assignment_id") @db.Uuid // null for ad-hoc invoices (fine, certificate fee)
  installmentId        String?          @map("installment_id") @db.Uuid
  invoiceNo            String           @map("invoice_no") @db.VarChar(40) // from NumberSequence FEE_INVOICE_NO; max 16 chars when the issuer is GST-registered (India)
  replacesInvoiceId    String?          @map("replaces_invoice_id") @db.Uuid // cancelled invoice that this one corrects
  carriedFromInvoiceId String?          @unique @map("carried_from_invoice_id") @db.Uuid // old-year invoice whose balance this ARREARS invoice carries
  title                String?          @db.VarChar(150) // "Quarter 1 fees 2027-28"
  periodStart          DateTime?        @map("period_start") @db.Date
  periodEnd            DateTime?        @map("period_end") @db.Date
  issueDate            DateTime         @map("issue_date") @db.Date
  dueDate              DateTime         @map("due_date") @db.Date
  currency             String           @db.Char(3)
  subtotal             Decimal          @db.Decimal(12, 2) // sum of item amounts
  discountTotal        Decimal          @default(0) @map("discount_total") @db.Decimal(12, 2) // discounts applied at issue (scholarship money is in scholarshipCredit)
  taxTotal             Decimal          @default(0) @map("tax_total") @db.Decimal(12, 2)
  taxBreakdown         Json?            @map("tax_breakdown") // invoice-level totals per tax component: [{ code: CGST|SGST|IGST|GST|VAT|SALES_TAX, percent, amount }]
  isTaxInclusive       Boolean          @default(false) @map("is_tax_inclusive")
  sellerTaxId          String?          @map("seller_tax_id") @db.VarChar(30) // campus / organization GSTIN / ABN / TRN frozen at issue
  buyerTaxId           String?          @map("buyer_tax_id") @db.VarChar(30) // payer GSTIN for B2B invoices
  placeOfSupply        String?          @map("place_of_supply") @db.VarChar(10) // GST state code / US state / emirate
  lateFee              Decimal          @default(0) @map("late_fee") @db.Decimal(12, 2)
  adjustmentTotal      Decimal          @default(0) @map("adjustment_total") @db.Decimal(12, 2) // signed net of APPROVED FeeInvoiceAdjustment rows (credits negative)
  total                Decimal          @db.Decimal(12, 2) // subtotal - discountTotal + taxTotal + lateFee + adjustmentTotal
  scholarshipCredit    Decimal          @default(0) @map("scholarship_credit") @db.Decimal(12, 2) // sum of active ScholarshipDisbursement rows
  amountPaid           Decimal          @default(0) @map("amount_paid") @db.Decimal(12, 2) // sum of active PaymentAllocation rows minus refunds
  writtenOffAmount     Decimal          @default(0) @map("written_off_amount") @db.Decimal(12, 2)
  balance              Decimal          @db.Decimal(12, 2) // total - scholarshipCredit - amountPaid - writtenOffAmount
  status               FeeInvoiceStatus @default(DRAFT)
  appliedDiscounts     Json?            @map("applied_discounts") // [{ studentDiscountId | scholarshipAwardId, name, amount }]
  lateFeeAppliedAt     DateTime?        @map("late_fee_applied_at") @db.Timestamptz(6)
  lateFeeWaived        Boolean          @default(false) @map("late_fee_waived")
  lateFeeWaivedAmount  Decimal          @default(0) @map("late_fee_waived_amount") @db.Decimal(12, 2)
  lateFeeWaivedById    String?          @map("late_fee_waived_by_id") @db.Uuid // User id (audit only, no FK)
  lateFeeWaivedAt      DateTime?        @map("late_fee_waived_at") @db.Timestamptz(6)
  lateFeeWaiveReason   String?          @map("late_fee_waive_reason") @db.VarChar(255)
  lastReminderAt       DateTime?        @map("last_reminder_at") @db.Timestamptz(6)
  reminderCount        Int              @default(0) @map("reminder_count")
  paidAt               DateTime?        @map("paid_at") @db.Timestamptz(6) // when the balance reached zero
  cancelledAt          DateTime?        @map("cancelled_at") @db.Timestamptz(6)
  cancelledById        String?          @map("cancelled_by_id") @db.Uuid // User id (audit only, no FK)
  cancelReason         String?          @map("cancel_reason") @db.VarChar(255)
  writtenOffAt         DateTime?        @map("written_off_at") @db.Timestamptz(6)
  writeOffReason       String?          @map("write_off_reason") @db.VarChar(255)
  writtenOffById       String?          @map("written_off_by_id") @db.Uuid // User id (audit only, no FK)
  creditNoteNo         String?          @map("credit_note_no") @db.VarChar(40) // GST credit note raised when an issued taxable invoice is cancelled (NumberSequence CREDIT_NOTE_NO)
  creditNoteDate       DateTime?        @map("credit_note_date") @db.Date
  notes                String?          @db.VarChar(500)
  pdfFileId            String?          @map("pdf_file_id") @db.Uuid
  createdById          String?          @map("created_by_id") @db.Uuid // User id (audit only, no FK); null when generated by the worker
  createdAt            DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt            DateTime?        @map("deleted_at") @db.Timestamptz(6) // only DRAFT invoices may be deleted; issued ones are cancelled

  organization             Organization              @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus                   Campus                    @relation(fields: [campusId], references: [id], onDelete: Restrict)
  academicYear             AcademicYear              @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  student                  Student                   @relation(fields: [studentId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK: same tenant guaranteed by the database
  assignment               StudentFeeAssignment?     @relation(fields: [assignmentId], references: [id], onDelete: Restrict) // never strip the link from an issued invoice
  installment              FeeInstallment?           @relation(fields: [installmentId], references: [id], onDelete: Restrict)
  pdfFile                  FileAsset?                @relation(fields: [pdfFileId], references: [id], onDelete: SetNull)
  replacesInvoice          FeeInvoice?               @relation("FeeInvoiceReplacement", fields: [replacesInvoiceId], references: [id], onDelete: SetNull)
  replacedBy               FeeInvoice[]              @relation("FeeInvoiceReplacement")
  carriedFromInvoice       FeeInvoice?               @relation("FeeInvoiceCarryForward", fields: [carriedFromInvoiceId], references: [id], onDelete: SetNull)
  carriedToInvoice         FeeInvoice?               @relation("FeeInvoiceCarryForward")
  items                    FeeInvoiceItem[]
  adjustments              FeeInvoiceAdjustment[]
  customInstallment        StudentFeeInstallment?
  scholarshipDisbursements ScholarshipDisbursement[]
  reminderLogs             FeeReminderLog[]
  paymentAllocations       PaymentAllocation[]
  bookIssues               BookIssue[]
  certificateRequests      CertificateRequest[]
  bouncedPayments          Payment[]                 @relation("PaymentBounceChargeInvoice") // cheque payments whose bounce charge this invoice bills
  examReEvaluationRequests ExamReEvaluationRequest[]
  refunds                  Refund[]
  refundAllocations        RefundAllocation[]
  stockTransactions        StockTransaction[]

  @@unique([id, organizationId]) // target of composite tenant-safe foreign keys
  @@unique([organizationId, invoiceNo])
  @@unique([organizationId, creditNoteNo])
  @@index([organizationId, studentId, assignmentId, installmentId]) // uniqueness of LIVE rows: partial unique index (see model comment)
  @@index([organizationId, assignmentId])
  @@index([organizationId, installmentId]) // FK check and "invoices of installment X" worker query
  @@index([organizationId, studentId, status])
  @@index([organizationId, campusId, status, dueDate])
  @@index([organizationId, academicYearId, status])
  @@index([organizationId, status, dueDate]) // overdue and late-fee worker
  @@index([organizationId, campusId, issueDate])
  @@map("fee_invoices")
}

// One line of a fee invoice (a fee head with amount, discount and tax).
model FeeInvoiceItem {
  id                    String       @id @default(uuid()) @db.Uuid
  organizationId        String       @map("organization_id") @db.Uuid
  invoiceId             String       @map("invoice_id") @db.Uuid
  feeHeadId             String       @map("fee_head_id") @db.Uuid
  description           String?      @db.VarChar(200)
  amount                Decimal      @db.Decimal(12, 2) // before discount and tax
  discountAmount        Decimal      @default(0) @map("discount_amount") @db.Decimal(12, 2)
  taxTreatment          TaxTreatment @default(EXEMPT) @map("tax_treatment") // frozen from FeeHead at issue
  taxCode               String?      @map("tax_code") @db.VarChar(20) // HSN / SAC snapshot from FeeHead
  taxableAmount         Decimal      @default(0) @map("taxable_amount") @db.Decimal(12, 2) // amount - discountAmount when TAXABLE
  taxRate               Decimal      @default(0) @map("tax_rate") @db.Decimal(5, 2)
  taxAmount             Decimal      @default(0) @map("tax_amount") @db.Decimal(12, 2) // sum of the components in taxBreakdown
  taxBreakdown          Json?        @map("tax_breakdown") // [{ code: CGST|SGST|IGST|GST|VAT|SALES_TAX, percent, amount }]
  netAmount             Decimal      @map("net_amount") @db.Decimal(12, 2) // amount - discountAmount + taxAmount
  amountPaid            Decimal      @default(0) @map("amount_paid") @db.Decimal(12, 2) // sum of active PaymentAllocationItem rows; updated in the same transaction (head-wise collection)
  amountRefunded        Decimal      @default(0) @map("amount_refunded") @db.Decimal(12, 2)
  transportAssignmentId String?      @map("transport_assignment_id") @db.Uuid // transport line: the assignment it bills
  hostelAllocationId    String?      @map("hostel_allocation_id") @db.Uuid // hostel line: the allocation it bills
  periodStart           DateTime?    @map("period_start") @db.Date // billed period of a recurring line (prevents double billing)
  periodEnd             DateTime?    @map("period_end") @db.Date
  sortOrder             Int          @default(0) @map("sort_order")
  createdAt             DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization           Organization            @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  invoice                FeeInvoice              @relation(fields: [invoiceId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK; the service deletes items explicitly when a DRAFT is discarded
  feeHead                FeeHead                 @relation(fields: [feeHeadId], references: [id], onDelete: Restrict)
  transportAssignment    TransportAssignment?    @relation(fields: [transportAssignmentId], references: [id], onDelete: SetNull)
  hostelAllocation       HostelAllocation?       @relation(fields: [hostelAllocationId], references: [id], onDelete: SetNull)
  adjustments            FeeInvoiceAdjustment[]
  paymentAllocationItems PaymentAllocationItem[]

  @@index([organizationId, invoiceId, sortOrder])
  @@index([organizationId, feeHeadId]) // head-wise collection report
  @@index([organizationId, transportAssignmentId])
  @@index([organizationId, hostelAllocationId])
  @@map("fee_invoice_items")
}

// Approved change to an issued invoice (credit / debit note): post-issue concession, late-fee waiver, correction, partial write-off.
model FeeInvoiceAdjustment {
  id             String            @id @default(uuid()) @db.Uuid
  organizationId String            @map("organization_id") @db.Uuid
  campusId       String            @map("campus_id") @db.Uuid
  invoiceId      String            @map("invoice_id") @db.Uuid
  invoiceItemId  String?           @map("invoice_item_id") @db.Uuid // set when the adjustment targets one fee head line
  studentId      String            @map("student_id") @db.Uuid
  adjustmentType FeeAdjustmentType @map("adjustment_type")
  amount         Decimal           @db.Decimal(12, 2) // always positive; the sign comes from the type
  currency       String            @db.Char(3)
  reason         String            @db.VarChar(500)
  status         ApprovalStatus    @default(PENDING) // only APPROVED rows change FeeInvoice.adjustmentTotal
  requestedById  String?           @map("requested_by_id") @db.Uuid // User id (audit only, no FK)
  approvedById   String?           @map("approved_by_id") @db.Uuid
  approvedAt     DateTime?         @map("approved_at") @db.Timestamptz(6)
  createdAt      DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization    @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus          @relation(fields: [campusId], references: [id], onDelete: Restrict)
  invoice      FeeInvoice      @relation(fields: [invoiceId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK
  invoiceItem  FeeInvoiceItem? @relation(fields: [invoiceItemId], references: [id], onDelete: SetNull)
  student      Student         @relation(fields: [studentId], references: [id], onDelete: Restrict)
  approvedBy   User?           @relation(fields: [approvedById], references: [id], onDelete: SetNull)

  @@index([organizationId, invoiceId])
  @@index([organizationId, campusId, status, createdAt]) // approval queue
  @@index([organizationId, studentId])
  @@map("fee_invoice_adjustments")
}

// Per-student payment schedule negotiated at the counter; replaces the structure's installments when hasCustomSchedule is true.
model StudentFeeInstallment {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  assignmentId   String   @map("assignment_id") @db.Uuid
  installmentNo  Int      @map("installment_no") @db.SmallInt
  name           String?  @db.VarChar(80)
  dueDate        DateTime @map("due_date") @db.Date
  amount         Decimal  @db.Decimal(12, 2)
  currency       String   @db.Char(3)
  invoiceId      String?  @unique @map("invoice_id") @db.Uuid // set once the invoice is generated; one invoice per installment
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization         @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  assignment   StudentFeeAssignment @relation(fields: [assignmentId], references: [id], onDelete: Restrict)
  invoice      FeeInvoice?          @relation(fields: [invoiceId], references: [id], onDelete: SetNull)

  @@unique([organizationId, assignmentId, installmentNo])
  @@index([organizationId, dueDate]) // invoice and reminder workers
  @@map("student_fee_installments")
}

// How the late fee is calculated after the due date.
// One default rule per organization / campus is enforced by a partial unique index in the SQL migration (WHERE is_default AND deleted_at IS NULL).
model LateFeeRule {
  id             String             @id @default(uuid()) @db.Uuid
  organizationId String             @map("organization_id") @db.Uuid
  campusId       String?            @map("campus_id") @db.Uuid // null = all campuses
  name           String             @db.VarChar(100)
  calculation    LateFeeCalculation
  amount         Decimal?           @db.Decimal(12, 2) // for FIXED_* calculations
  percent        Decimal?           @db.Decimal(5, 2) // for PERCENT_* calculations
  currency       String             @db.Char(3)
  graceDays      Int                @default(0) @map("grace_days") @db.SmallInt
  maxAmount      Decimal?           @map("max_amount") @db.Decimal(12, 2) // cap per invoice
  isDefault      Boolean            @default(false) @map("is_default") // used when a fee structure has no rule of its own
  status         RecordStatus       @default(ACTIVE)
  createdAt      DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?          @map("deleted_at") @db.Timestamptz(6)

  organization  Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus        Campus?        @relation(fields: [campusId], references: [id], onDelete: Cascade)
  feeStructures FeeStructure[]

  @@unique([organizationId, name])
  @@index([organizationId, campusId, status])
  @@map("late_fee_rules")
}

// Discount scheme: sibling, early-bird, staff child, merit ... percent or fixed.
model Discount {
  id               String           @id @default(uuid()) @db.Uuid
  organizationId   String           @map("organization_id") @db.Uuid
  name             String           @db.VarChar(100)
  code             String           @db.VarChar(30)
  category         DiscountCategory
  discountType     DiscountType     @map("discount_type")
  value            Decimal          @db.Decimal(12, 2) // percent (0-100) or fixed amount, by discountType
  currency         String?          @db.Char(3) // FIXED discounts only
  maxAmount        Decimal?         @map("max_amount") @db.Decimal(12, 2) // cap for PERCENT discounts
  scope            DiscountScope    @default(INVOICE_TOTAL)
  feeHeadIds       String[]         @map("fee_head_ids") @db.Uuid // used when scope is FEE_HEADS
  courseIds        String[]         @map("course_ids") @db.Uuid // empty = every course
  criteria         Json? // auto-apply rules, e.g. { siblingIndex: 2 } or { payBeforeDays: 15 }
  validFrom        DateTime?        @map("valid_from") @db.Date
  validTo          DateTime?        @map("valid_to") @db.Date
  isStackable      Boolean          @default(false) @map("is_stackable") // may combine with other discounts
  priority         Int              @default(0) // order of application when stacked; lower first
  requiresApproval Boolean          @default(true) @map("requires_approval")
  status           RecordStatus     @default(ACTIVE)
  createdAt        DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt        DateTime?        @map("deleted_at") @db.Timestamptz(6)

  organization     Organization      @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  studentDiscounts StudentDiscount[]

  @@unique([organizationId, code])
  @@index([organizationId, category, status])
  @@map("discounts")
}

// A discount granted to one student for an academic year, with approval.
model StudentDiscount {
  id               String         @id @default(uuid()) @db.Uuid
  organizationId   String         @map("organization_id") @db.Uuid
  campusId         String         @map("campus_id") @db.Uuid // student's campus at grant time; scopes the approval queue for ACCOUNTANT / PRINCIPAL
  studentId        String         @map("student_id") @db.Uuid
  discountId       String         @map("discount_id") @db.Uuid
  academicYearId   String         @map("academic_year_id") @db.Uuid
  siblingStudentId String?        @map("sibling_student_id") @db.Uuid // sibling that qualifies the student for a SIBLING discount; revoke when that sibling leaves
  valueOverride    Decimal?       @map("value_override") @db.Decimal(12, 2) // replaces Discount.value for this student
  reason           String?        @db.VarChar(500)
  status           ApprovalStatus @default(PENDING)
  validFrom        DateTime?      @map("valid_from") @db.Date
  validTo          DateTime?      @map("valid_to") @db.Date
  requestedById    String?        @map("requested_by_id") @db.Uuid // User id (audit only, no FK)
  approvedById     String?        @map("approved_by_id") @db.Uuid // User who approved or rejected
  approvedAt       DateTime?      @map("approved_at") @db.Timestamptz(6)
  rejectionReason  String?        @map("rejection_reason") @db.VarChar(255)
  createdAt        DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt        DateTime?      @map("deleted_at") @db.Timestamptz(6)

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus         Campus       @relation(fields: [campusId], references: [id], onDelete: Restrict)
  student        Student      @relation("StudentDiscountStudent", fields: [studentId], references: [id], onDelete: Restrict)
  siblingStudent Student?     @relation("StudentDiscountSibling", fields: [siblingStudentId], references: [id], onDelete: SetNull)
  discount       Discount     @relation(fields: [discountId], references: [id], onDelete: Restrict)
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  approvedBy     User?        @relation(fields: [approvedById], references: [id], onDelete: SetNull)

  // One live grant per student + discount + year: partial unique index in the SQL migration,
  // uq_student_discount_live (organization_id, student_id, discount_id, academic_year_id) WHERE deleted_at IS NULL AND status IN ('PENDING','APPROVED')
  @@index([organizationId, studentId, discountId, academicYearId])
  @@index([organizationId, campusId, status, createdAt]) // approval queue per campus
  @@index([organizationId, status, createdAt]) // approval queue
  @@index([organizationId, discountId])
  @@map("student_discounts")
}

// Scholarship scheme with funding source, eligibility criteria, seats and value.
model Scholarship {
  id                   String                   @id @default(uuid()) @db.Uuid
  organizationId       String                   @map("organization_id") @db.Uuid
  academicYearId       String?                  @map("academic_year_id") @db.Uuid // null = runs every year
  name                 String                   @db.VarChar(150)
  code                 String                   @db.VarChar(30)
  schemeName           String?                  @map("scheme_name") @db.VarChar(150) // official scheme, e.g. a state post-matric scholarship
  description          String?                  @db.Text
  fundingSource        ScholarshipFundingSource @default(INSTITUTE) @map("funding_source")
  funderName           String?                  @map("funder_name") @db.VarChar(150)
  valueType            DiscountType             @map("value_type") // PERCENT of fees or FIXED amount
  amount               Decimal?                 @db.Decimal(12, 2) // FIXED value per student per year
  percent              Decimal?                 @db.Decimal(5, 2) // PERCENT value
  currency             String                   @db.Char(3)
  maxAmountPerStudent  Decimal?                 @map("max_amount_per_student") @db.Decimal(12, 2)
  feeHeadIds           String[]                 @map("fee_head_ids") @db.Uuid // heads the scholarship may pay; empty = all
  criteria             Json? // { minPercentage, maxFamilyIncome, categories: [...], courseIds: [...] }
  seats                Int? // null = unlimited
  seatsAwarded         Int                      @default(0) @map("seats_awarded")
  applicationStartDate DateTime?                @map("application_start_date") @db.Date
  applicationEndDate   DateTime?                @map("application_end_date") @db.Date
  isRenewable          Boolean                  @default(false) @map("is_renewable")
  status               ScholarshipStatus        @default(DRAFT)
  createdAt            DateTime                 @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime                 @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt            DateTime?                @map("deleted_at") @db.Timestamptz(6)

  organization Organization             @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  academicYear AcademicYear?            @relation(fields: [academicYearId], references: [id], onDelete: SetNull)
  applications ScholarshipApplication[]
  awards       ScholarshipAward[]

  @@unique([organizationId, code])
  @@index([organizationId, status, applicationEndDate])
  @@map("scholarships")
}

// A student's application to a scholarship with documents, score and review decision.
model ScholarshipApplication {
  id             String                       @id @default(uuid()) @db.Uuid
  organizationId String                       @map("organization_id") @db.Uuid
  campusId       String                       @map("campus_id") @db.Uuid
  scholarshipId  String                       @map("scholarship_id") @db.Uuid
  studentId      String                       @map("student_id") @db.Uuid
  academicYearId String                       @map("academic_year_id") @db.Uuid
  applicationNo  String                       @map("application_no") @db.VarChar(30)
  status         ScholarshipApplicationStatus @default(DRAFT)
  statement      String?                      @db.Text // why the student needs / deserves it
  familyIncome   Decimal?                     @map("family_income") @db.Decimal(12, 2) // declared annual income
  currency       String?                      @db.Char(3)
  lastPercentage Decimal?                     @map("last_percentage") @db.Decimal(5, 2) // last exam result used for merit
  documents      Json? // [{ type, title, fileId }] FileAsset ids of income / category / marksheet proofs
  score          Decimal?                     @db.Decimal(6, 2) // committee score used for ranking
  submittedAt    DateTime?                    @map("submitted_at") @db.Timestamptz(6)
  submittedById  String?                      @map("submitted_by_id") @db.Uuid // User id of the parent or staff (audit only, no FK)
  reviewedById   String?                      @map("reviewed_by_id") @db.Uuid
  reviewedAt     DateTime?                    @map("reviewed_at") @db.Timestamptz(6)
  reviewRemarks  String?                      @map("review_remarks") @db.VarChar(500)
  createdAt      DateTime                     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime                     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?                    @map("deleted_at") @db.Timestamptz(6)

  organization Organization      @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus            @relation(fields: [campusId], references: [id], onDelete: Restrict)
  scholarship  Scholarship       @relation(fields: [scholarshipId], references: [id], onDelete: Restrict)
  student      Student           @relation(fields: [studentId], references: [id], onDelete: Restrict)
  academicYear AcademicYear      @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  reviewedBy   User?             @relation(fields: [reviewedById], references: [id], onDelete: SetNull)
  award        ScholarshipAward?

  @@unique([organizationId, applicationNo])
  @@unique([organizationId, scholarshipId, studentId, academicYearId])
  @@index([organizationId, scholarshipId, status, score])
  @@index([organizationId, studentId])
  @@index([organizationId, campusId, status])
  @@map("scholarship_applications")
}

// Scholarship granted to a student for a year; money reaches invoices through ScholarshipDisbursement.
model ScholarshipAward {
  id                 String                 @id @default(uuid()) @db.Uuid
  organizationId     String                 @map("organization_id") @db.Uuid
  campusId           String                 @map("campus_id") @db.Uuid
  scholarshipId      String                 @map("scholarship_id") @db.Uuid
  applicationId      String?                @unique @map("application_id") @db.Uuid // null when awarded directly without an application
  studentId          String                 @map("student_id") @db.Uuid
  academicYearId     String                 @map("academic_year_id") @db.Uuid
  awardedAmount      Decimal                @map("awarded_amount") @db.Decimal(12, 2) // total value for the year
  awardedPercent     Decimal?               @map("awarded_percent") @db.Decimal(5, 2) // when the scheme is PERCENT
  disbursedAmount    Decimal                @default(0) @map("disbursed_amount") @db.Decimal(12, 2) // sum of active disbursements
  currency           String                 @db.Char(3)
  status             ScholarshipAwardStatus @default(ACTIVE)
  awardedOn          DateTime               @map("awarded_on") @db.Date
  validFrom          DateTime?              @map("valid_from") @db.Date
  validTo            DateTime?              @map("valid_to") @db.Date
  approvedById       String?                @map("approved_by_id") @db.Uuid
  renewedFromAwardId String?                @unique @map("renewed_from_award_id") @db.Uuid // previous year's award that this one renews
  revokedAt          DateTime?              @map("revoked_at") @db.Timestamptz(6)
  revokeReason       String?                @map("revoke_reason") @db.VarChar(255)
  notes              String?                @db.VarChar(500)
  createdAt          DateTime               @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime               @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt          DateTime?              @map("deleted_at") @db.Timestamptz(6)

  organization     Organization              @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus           Campus                    @relation(fields: [campusId], references: [id], onDelete: Restrict)
  scholarship      Scholarship               @relation(fields: [scholarshipId], references: [id], onDelete: Restrict)
  application      ScholarshipApplication?   @relation(fields: [applicationId], references: [id], onDelete: SetNull)
  student          Student                   @relation(fields: [studentId], references: [id], onDelete: Restrict)
  academicYear     AcademicYear              @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  approvedBy       User?                     @relation(fields: [approvedById], references: [id], onDelete: SetNull)
  renewedFromAward ScholarshipAward?         @relation("ScholarshipAwardRenewal", fields: [renewedFromAwardId], references: [id], onDelete: SetNull)
  renewedByAward   ScholarshipAward?         @relation("ScholarshipAwardRenewal")
  disbursements    ScholarshipDisbursement[]

  @@unique([organizationId, scholarshipId, studentId, academicYearId])
  @@index([organizationId, studentId, status])
  @@index([organizationId, campusId, academicYearId, status])
  @@map("scholarship_awards")
}

// Part of a scholarship award: credited against a fee invoice (adds to FeeInvoice.scholarshipCredit), or paid by the
// funder straight to the beneficiary (invoiceId null, paidToBeneficiary true).
// A retried job cannot credit twice: partial unique index in the SQL migration,
// uq_disbursement_active (organization_id, award_id, invoice_id) WHERE reversed_at IS NULL
model ScholarshipDisbursement {
  id                String    @id @default(uuid()) @db.Uuid
  organizationId    String    @map("organization_id") @db.Uuid
  campusId          String    @map("campus_id") @db.Uuid
  awardId           String    @map("award_id") @db.Uuid
  studentId         String    @map("student_id") @db.Uuid // denormalised from the award
  invoiceId         String?   @map("invoice_id") @db.Uuid // null when the money did not go against an invoice
  paidToBeneficiary Boolean   @default(false) @map("paid_to_beneficiary") // government / trust paid the student's or parent's bank account directly
  paymentId         String?   @map("payment_id") @db.Uuid // Payment row created when the external funder pays the institute
  amount            Decimal   @db.Decimal(12, 2)
  currency          String    @db.Char(3)
  disbursedOn       DateTime  @map("disbursed_on") @db.Date
  reference         String?   @db.VarChar(100) // sanction / transfer reference from the funder
  reversedAt        DateTime? @map("reversed_at") @db.Timestamptz(6) // set when the invoice is cancelled or the award revoked
  reversalReason    String?   @map("reversal_reason") @db.VarChar(255)
  createdById       String?   @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization     @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus           @relation(fields: [campusId], references: [id], onDelete: Restrict)
  award        ScholarshipAward @relation(fields: [awardId], references: [id], onDelete: Restrict)
  student      Student          @relation(fields: [studentId], references: [id], onDelete: Restrict)
  invoice      FeeInvoice?      @relation(fields: [invoiceId], references: [id], onDelete: Restrict)
  payment      Payment?         @relation(fields: [paymentId], references: [id], onDelete: Restrict)

  @@index([organizationId, awardId])
  @@index([organizationId, invoiceId])
  @@index([organizationId, studentId])
  @@index([organizationId, campusId, disbursedOn])
  @@index([organizationId, paymentId])
  @@map("scholarship_disbursements")
}

// One fee reminder sent for an invoice. Append-only: no updatedAt / deletedAt.
model FeeReminderLog {
  id             String          @id @default(uuid()) @db.Uuid
  organizationId String          @map("organization_id") @db.Uuid
  campusId       String          @map("campus_id") @db.Uuid
  invoiceId      String          @map("invoice_id") @db.Uuid
  studentId      String          @map("student_id") @db.Uuid
  guardianId     String?         @map("guardian_id") @db.Uuid // fee payer who received the reminder
  reminderType   FeeReminderType @map("reminder_type")
  channel        Channel
  messageLogId   String?         @map("message_log_id") @db.Uuid // delivery status lives in MessageLog
  balanceAtSend  Decimal         @map("balance_at_send") @db.Decimal(12, 2)
  currency       String          @db.Char(3)
  isAutomatic    Boolean         @default(true) @map("is_automatic") // false = sent by a user from the dues list
  triggeredById  String?         @map("triggered_by_id") @db.Uuid // User id (audit only, no FK)
  sentAt         DateTime        @default(now()) @map("sent_at") @db.Timestamptz(6)
  createdAt      DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus       @relation(fields: [campusId], references: [id], onDelete: Restrict)
  invoice      FeeInvoice   @relation(fields: [invoiceId], references: [id], onDelete: Restrict) // the reminder trail is financial history
  student      Student      @relation(fields: [studentId], references: [id], onDelete: Restrict)
  guardian     Guardian?    @relation(fields: [guardianId], references: [id], onDelete: SetNull)
  messageLog   MessageLog?  @relation(fields: [messageLogId], references: [id], onDelete: SetNull)

  @@index([organizationId, invoiceId, sentAt])
  @@index([organizationId, studentId, sentAt])
  @@index([organizationId, campusId, reminderType, sentAt])
  @@map("fee_reminder_logs")
}
```

## Payments, receipts, refunds and reconciliation

File `server/prisma/schema/09-payments.prisma` — 11 models, 13 enums.

```prisma
// 09-payments: gateway accounts, online payment orders, payments (all methods), allocation to invoices,
// receipts, refunds, idempotent webhook inbox, gateway settlements and the daily cash close.
// EduFlow never stores card numbers or CVV; only gateway tokens / ids and masked details.

enum GatewayMode {
  TEST
  LIVE
}

enum PaymentOrderStatus {
  CREATED
  ATTEMPTED // checkout opened, at least one attempt made
  PAID
  FAILED
  EXPIRED
  CANCELLED
}

enum PaymentMethod {
  CASH
  UPI
  CARD
  NETBANKING
  CHEQUE
  DEMAND_DRAFT // uses the cheque* columns (number, date, bank)
  BANK_TRANSFER
  WALLET
  ONLINE_GATEWAY // paid through Razorpay / Stripe checkout; the instrument is in methodDetails
}

enum PaymentStatus {
  PENDING // cheque not cleared yet, or gateway payment not captured yet
  SUCCESS
  FAILED
  CANCELLED // receipt cancelled by the accountant
  BOUNCED // cheque returned by the bank
  PARTIALLY_REFUNDED
  REFUNDED
  DISPUTED // card dispute opened at the gateway; money may be held
  CHARGED_BACK // dispute lost; allocations are reversed and the invoices reopen
}

// What the money was paid for. Only FEE payments are allocated to fee invoices.
enum PaymentPurpose {
  FEE
  APPLICATION_FEE // paid before a Student row exists; linked to AdmissionApplication
  LIBRARY_FINE
  CERTIFICATE_FEE
  DEPOSIT
  OTHER
}

enum RefundType {
  PAYMENT_REVERSAL
  EXCESS_PAYMENT // refund of an advance / unallocated amount
  WITHDRAWAL // student left; fees refunded with deductions
  CAUTION_DEPOSIT // refundable deposit returned at TC time
  APPLICATION_FEE
  OTHER
}

enum ChequeStatus {
  RECEIVED
  DEPOSITED
  CLEARED
  BOUNCED
  RETURNED // handed back to the payer without depositing
}

enum ReceiptStatus {
  ISSUED
  CANCELLED
}

enum RefundStatus {
  REQUESTED
  APPROVED
  REJECTED
  PROCESSING // sent to the gateway or the bank
  PROCESSED
  FAILED
}

enum WebhookProvider {
  RAZORPAY
  STRIPE
  WHATSAPP
  MSG91
  TWILIO
  SES
}

enum WebhookEventStatus {
  RECEIVED
  PROCESSING
  PROCESSED
  FAILED // will be retried until attempts reach the limit
  IGNORED // event type not used, or the tenant could not be resolved
}

enum SettlementStatus {
  PENDING
  PROCESSED // paid out by the gateway
  RECONCILED // matched with the payments in EduFlow
  MISMATCH
  FAILED
}

enum DayCloseStatus {
  OPEN
  SUBMITTED
  VERIFIED
  DISCREPANCY
}

// A tenant's own Razorpay / Stripe account used to collect fees online (optionally one per campus).
// One default account per organization is enforced by a partial unique index in the SQL migration (WHERE is_default AND deleted_at IS NULL).
model PaymentGatewayAccount {
  id               String         @id @default(uuid()) @db.Uuid
  organizationId   String         @map("organization_id") @db.Uuid
  campusId         String?        @map("campus_id") @db.Uuid // null = used by every campus without its own account
  provider         PaymentGateway // RAZORPAY or STRIPE (OFFLINE is never stored here)
  mode             GatewayMode    @default(TEST)
  displayName      String         @map("display_name") @db.VarChar(100)
  merchantId       String?        @map("merchant_id") @db.VarChar(100) // Razorpay merchant id / Stripe account id
  publicKey        String         @map("public_key") @db.VarChar(200) // key id / publishable key (safe for the client)
  secretRef        String         @map("secret_ref") @db.VarChar(255) // reference to the encrypted key secret in the secrets store; never the secret itself
  webhookSecretRef String?        @map("webhook_secret_ref") @db.VarChar(255) // reference to the encrypted webhook signing secret
  currency         String         @db.Char(3) // settlement currency of the account
  passFeeToPayer   Boolean        @default(false) @map("pass_fee_to_payer") // add the gateway charge as a convenience fee
  enabledMethods   Json?          @map("enabled_methods") // e.g. ["upi", "card", "netbanking"]
  isDefault        Boolean        @default(false) @map("is_default")
  status           RecordStatus   @default(ACTIVE)
  lastVerifiedAt   DateTime?      @map("last_verified_at") @db.Timestamptz(6) // last successful credentials test
  createdById      String?        @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt        DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt        DateTime?      @map("deleted_at") @db.Timestamptz(6)

  organization  Organization   @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus        Campus?        @relation(fields: [campusId], references: [id], onDelete: Restrict)
  orders        PaymentOrder[]
  payments      Payment[]
  settlements   Settlement[]
  webhookEvents WebhookEvent[]

  // NULL campus_id rows are kept unique by a partial unique index added in the SQL migration.
  @@unique([organizationId, campusId, provider, mode])
  @@index([organizationId, provider, mode, status])
  @@map("payment_gateway_accounts")
}

// Online checkout order created at the gateway before the parent pays; safe to retry with the same idempotency key.
model PaymentOrder {
  id                     String             @id @default(uuid()) @db.Uuid
  organizationId         String             @map("organization_id") @db.Uuid
  campusId               String             @map("campus_id") @db.Uuid
  gatewayAccountId       String             @map("gateway_account_id") @db.Uuid
  purpose                PaymentPurpose     @default(FEE)
  studentId              String?            @map("student_id") @db.Uuid // primary student; null for APPLICATION_FEE orders (no Student row yet)
  familyId               String?            @map("family_id") @db.Uuid // one checkout for all children of a family
  admissionApplicationId String?            @map("admission_application_id") @db.Uuid // APPLICATION_FEE orders
  payerUserId            String?            @map("payer_user_id") @db.Uuid // parent / student login that started the checkout
  gateway                PaymentGateway
  gatewayOrderId         String?            @map("gateway_order_id") @db.VarChar(100) // Razorpay order id / Stripe PaymentIntent id
  amount                 Decimal            @db.Decimal(12, 2)
  convenienceFee         Decimal            @default(0) @map("convenience_fee") @db.Decimal(12, 2) // included in amount when passFeeToPayer
  convenienceFeeTax      Decimal            @default(0) @map("convenience_fee_tax") @db.Decimal(12, 2) // tax on the convenience fee; included in amount
  currency               String             @db.Char(3)
  status                 PaymentOrderStatus @default(CREATED)
  idempotencyKey         String             @map("idempotency_key") @db.VarChar(100) // from the Idempotency-Key header
  invoiceSplit           Json               @map("invoice_split") // [{ invoiceId, amount }] intended allocation
  platform               DevicePlatform     @default(WEB)
  attempts               Int                @default(0) @db.SmallInt
  expiresAt              DateTime           @map("expires_at") @db.Timestamptz(6)
  paidAt                 DateTime?          @map("paid_at") @db.Timestamptz(6)
  failureReason          String?            @map("failure_reason") @db.VarChar(255)
  metadata               Json?
  createdAt              DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt              DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization         Organization          @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus               Campus                @relation(fields: [campusId], references: [id], onDelete: Restrict)
  gatewayAccount       PaymentGatewayAccount @relation(fields: [gatewayAccountId], references: [id], onDelete: Restrict)
  student              Student?              @relation(fields: [studentId], references: [id], onDelete: Restrict)
  family               Family?               @relation(fields: [familyId], references: [id], onDelete: SetNull)
  admissionApplication AdmissionApplication? @relation(fields: [admissionApplicationId], references: [id], onDelete: Restrict)
  payerUser            User?                 @relation(fields: [payerUserId], references: [id], onDelete: SetNull)
  payments             Payment[]

  @@unique([organizationId, idempotencyKey])
  @@unique([gateway, gatewayOrderId])
  @@index([organizationId, studentId, createdAt])
  @@index([organizationId, campusId, status, createdAt]) // "online payments" screen
  @@index([organizationId, gatewayAccountId])
  @@index([organizationId, admissionApplicationId])
  @@index([organizationId, status, expiresAt]) // expiry worker
  @@map("payment_orders")
}

// Money received from a payer by any method. Never deleted: mistakes are cancelled or refunded.
// advance (unallocated money) = amount - convenienceFee - convenienceFeeTax - amountAllocated - amountRefunded.
// Student ledgers are built from PaymentAllocation.studentId, not Payment.studentId (family payments cover several children).
model Payment {
  id                     String         @id @default(uuid()) @db.Uuid
  organizationId         String         @map("organization_id") @db.Uuid
  campusId               String         @map("campus_id") @db.Uuid
  purpose                PaymentPurpose @default(FEE)
  studentId              String?        @map("student_id") @db.Uuid // primary student; null for application fees and staff payments
  familyId               String?        @map("family_id") @db.Uuid // family payment: one cheque / UPI transfer for several children
  admissionApplicationId String?        @map("admission_application_id") @db.Uuid // APPLICATION_FEE payments
  staffId                String?        @map("staff_id") @db.Uuid // staff payer, e.g. LIBRARY_FINE of a staff member
  payerGuardianId        String?        @map("payer_guardian_id") @db.Uuid
  payerName              String?        @map("payer_name") @db.VarChar(160) // printed on the receipt
  paymentOrderId         String?        @map("payment_order_id") @db.Uuid // online payments only
  gatewayAccountId       String?        @map("gateway_account_id") @db.Uuid
  settlementId           String?        @map("settlement_id") @db.Uuid // gateway payout that contained this payment
  dayCloseId             String?        @map("day_close_id") @db.Uuid // daily cash close that included this payment
  method                 PaymentMethod
  amount                 Decimal        @db.Decimal(12, 2)
  convenienceFee         Decimal        @default(0) @map("convenience_fee") @db.Decimal(12, 2) // part of amount that is not fee income (gateway charge passed to the payer)
  convenienceFeeTax      Decimal        @default(0) @map("convenience_fee_tax") @db.Decimal(12, 2)
  currency               String         @db.Char(3)
  status                 PaymentStatus  @default(SUCCESS)
  paymentDate            DateTime       @map("payment_date") @db.Date // day-book date in the campus timezone
  paidAt                 DateTime       @default(now()) @map("paid_at") @db.Timestamptz(6)
  receivedById           String?        @map("received_by_id") @db.Uuid // accountant at the counter; null for online payments
  gateway                PaymentGateway @default(OFFLINE)
  gatewayPaymentId       String?        @map("gateway_payment_id") @db.VarChar(100)
  gatewayFee             Decimal?       @map("gateway_fee") @db.Decimal(12, 2)
  gatewayTax             Decimal?       @map("gateway_tax") @db.Decimal(12, 2) // tax on the gateway fee
  methodDetails          Json?          @map("method_details") // masked only: { vpa, cardLast4, cardNetwork, bank, wallet }
  chequeNo               String?        @map("cheque_no") @db.VarChar(20)
  chequeDate             DateTime?      @map("cheque_date") @db.Date
  chequeBank             String?        @map("cheque_bank") @db.VarChar(100)
  chequeBranch           String?        @map("cheque_branch") @db.VarChar(100)
  chequeStatus           ChequeStatus?  @map("cheque_status")
  chequeDepositedOn      DateTime?      @map("cheque_deposited_on") @db.Date
  chequeClearedOn        DateTime?      @map("cheque_cleared_on") @db.Date
  chequeBouncedOn        DateTime?      @map("cheque_bounced_on") @db.Date
  bounceReason           String?        @map("bounce_reason") @db.VarChar(255)
  bounceCharge           Decimal?       @map("bounce_charge") @db.Decimal(12, 2) // charge debited by the bank
  bounceChargeInvoiceId  String?        @map("bounce_charge_invoice_id") @db.Uuid // ad-hoc CHEQUE_BOUNCE_CHARGE invoice raised to the parent
  gatewayDisputeId       String?        @map("gateway_dispute_id") @db.VarChar(100)
  disputeStatus          String?        @map("dispute_status") @db.VarChar(30) // provider status, e.g. needs_response, won, lost
  disputeReason          String?        @map("dispute_reason") @db.VarChar(255)
  disputedAmount         Decimal?       @map("disputed_amount") @db.Decimal(12, 2)
  disputeOpenedAt        DateTime?      @map("dispute_opened_at") @db.Timestamptz(6)
  disputeResolvedAt      DateTime?      @map("dispute_resolved_at") @db.Timestamptz(6)
  reference              String?        @db.VarChar(100) // UTR / transaction reference for UPI, bank transfer, card slip
  idempotencyKey         String?        @map("idempotency_key") @db.VarChar(100) // from the Idempotency-Key header on counter payments
  amountAllocated        Decimal        @default(0) @map("amount_allocated") @db.Decimal(12, 2) // sum of active allocations; the rest is an advance
  amountRefunded         Decimal        @default(0) @map("amount_refunded") @db.Decimal(12, 2)
  failureReason          String?        @map("failure_reason") @db.VarChar(255)
  notes                  String?        @db.VarChar(500)
  cancelledAt            DateTime?      @map("cancelled_at") @db.Timestamptz(6)
  cancelledById          String?        @map("cancelled_by_id") @db.Uuid // User id (audit only, no FK)
  cancelReason           String?        @map("cancel_reason") @db.VarChar(255)
  createdAt              DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt              DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization             Organization              @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus                   Campus                    @relation(fields: [campusId], references: [id], onDelete: Restrict)
  student                  Student?                  @relation(fields: [studentId], references: [id], onDelete: Restrict)
  family                   Family?                   @relation(fields: [familyId], references: [id], onDelete: SetNull)
  admissionApplication     AdmissionApplication?     @relation("PaymentAdmissionApplication", fields: [admissionApplicationId], references: [id], onDelete: Restrict)
  applicationFeeFor        AdmissionApplication?     @relation("ApplicationFeePayment") // back-link of AdmissionApplication.applicationFeePaymentId
  staff                    Staff?                    @relation(fields: [staffId], references: [id], onDelete: Restrict)
  bounceChargeInvoice      FeeInvoice?               @relation("PaymentBounceChargeInvoice", fields: [bounceChargeInvoiceId], references: [id], onDelete: SetNull)
  payerGuardian            Guardian?                 @relation(fields: [payerGuardianId], references: [id], onDelete: SetNull)
  paymentOrder             PaymentOrder?             @relation(fields: [paymentOrderId], references: [id], onDelete: Restrict)
  gatewayAccount           PaymentGatewayAccount?    @relation(fields: [gatewayAccountId], references: [id], onDelete: Restrict)
  settlement               Settlement?               @relation(fields: [settlementId], references: [id], onDelete: SetNull)
  dayClose                 DayClose?                 @relation(fields: [dayCloseId], references: [id], onDelete: SetNull)
  receivedBy               User?                     @relation(fields: [receivedById], references: [id], onDelete: SetNull)
  allocations              PaymentAllocation[]
  receipt                  Receipt?
  refunds                  Refund[]
  scholarshipDisbursements ScholarshipDisbursement[]
  bookIssues               BookIssue[]

  @@unique([id, organizationId]) // target of composite tenant-safe foreign keys
  @@unique([gateway, gatewayPaymentId])
  @@unique([organizationId, idempotencyKey])
  @@index([organizationId, studentId, paymentDate])
  @@index([organizationId, campusId, paymentDate, method]) // day book and collection report
  @@index([organizationId, campusId, status, paymentDate])
  @@index([organizationId, purpose, paymentDate])
  @@index([organizationId, receivedById, paymentDate])
  @@index([organizationId, chequeStatus, chequeDate]) // "cheques to deposit today" and PDC follow-up
  @@index([organizationId, settlementId])
  @@index([organizationId, paymentOrderId]) // webhook capture
  @@index([organizationId, dayCloseId])
  @@index([organizationId, gatewayAccountId, paymentDate]) // reconciliation
  @@index([organizationId, admissionApplicationId])
  @@index([organizationId, familyId])
  @@map("payments")
}

// Split of a payment across fee invoices. Reversed (not deleted) when the payment is cancelled or bounced.
// One ACTIVE allocation per payment + invoice is enforced by a partial unique index in the SQL migration:
//   uq_payment_allocation_active (organization_id, payment_id, invoice_id) WHERE reversed_at IS NULL
// so a re-presented cheque or a corrected split can be allocated to the same invoice again.
model PaymentAllocation {
  id             String    @id @default(uuid()) @db.Uuid
  organizationId String    @map("organization_id") @db.Uuid
  paymentId      String    @map("payment_id") @db.Uuid
  invoiceId      String    @map("invoice_id") @db.Uuid
  studentId      String    @map("student_id") @db.Uuid // denormalised from the invoice; may differ from Payment.studentId for family payments
  amount         Decimal   @db.Decimal(12, 2)
  amountRefunded Decimal   @default(0) @map("amount_refunded") @db.Decimal(12, 2) // sum of RefundAllocation rows
  currency       String    @db.Char(3)
  allocatedAt    DateTime  @default(now()) @map("allocated_at") @db.Timestamptz(6)
  allocatedById  String?   @map("allocated_by_id") @db.Uuid // User id (audit only, no FK)
  reversedAt     DateTime? @map("reversed_at") @db.Timestamptz(6)
  reversedById   String?   @map("reversed_by_id") @db.Uuid // User id (audit only, no FK)
  reversalReason String?   @map("reversal_reason") @db.VarChar(255)
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization      Organization            @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  payment           Payment                 @relation(fields: [paymentId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK: payment and invoice are always of the same tenant
  invoice           FeeInvoice              @relation(fields: [invoiceId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK
  student           Student                 @relation(fields: [studentId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK
  items             PaymentAllocationItem[]
  refundAllocations RefundAllocation[]

  @@index([organizationId, paymentId, invoiceId]) // uniqueness of ACTIVE rows: partial unique index (see model comment)
  @@index([organizationId, invoiceId])
  @@index([organizationId, studentId, allocatedAt]) // student ledger
  @@map("payment_allocations")
}

// Head-wise split of one payment allocation (which fee heads a partial payment settled, by FeeHead.settlementPriority).
model PaymentAllocationItem {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  allocationId   String   @map("allocation_id") @db.Uuid
  invoiceItemId  String   @map("invoice_item_id") @db.Uuid
  feeHeadId      String   @map("fee_head_id") @db.Uuid // denormalised from the invoice item for the head-wise collection report
  amount         Decimal  @db.Decimal(12, 2)
  taxPortion     Decimal  @default(0) @map("tax_portion") @db.Decimal(12, 2) // part of amount that is tax (receipt-basis GST)
  currency       String   @db.Char(3)
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization      @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  allocation   PaymentAllocation @relation(fields: [allocationId], references: [id], onDelete: Restrict)
  invoiceItem  FeeInvoiceItem    @relation(fields: [invoiceItemId], references: [id], onDelete: Restrict)
  feeHead      FeeHead           @relation(fields: [feeHeadId], references: [id], onDelete: Restrict)

  @@unique([organizationId, allocationId, invoiceItemId])
  @@index([organizationId, feeHeadId])
  @@index([organizationId, invoiceItemId])
  @@map("payment_allocation_items")
}

// Numbered receipt for a successful payment (one per payment) with the PDF. Cancelled, never deleted.
model Receipt {
  id                     String         @id @default(uuid()) @db.Uuid
  organizationId         String         @map("organization_id") @db.Uuid
  campusId               String         @map("campus_id") @db.Uuid
  paymentId              String         @unique @map("payment_id") @db.Uuid
  purpose                PaymentPurpose @default(FEE)
  studentId              String?        @map("student_id") @db.Uuid // null for application-fee and staff receipts
  admissionApplicationId String?        @map("admission_application_id") @db.Uuid
  receiptNo              String         @map("receipt_no") @db.VarChar(40) // gap-free, from NumberSequence RECEIPT_NO
  receiptDate            DateTime       @map("receipt_date") @db.Date
  financialYear          String?        @map("financial_year") @db.VarChar(9) // 2027-28
  method                 PaymentMethod // frozen from the payment
  amount                 Decimal        @db.Decimal(12, 2)
  taxAmount              Decimal        @default(0) @map("tax_amount") @db.Decimal(12, 2)
  currency               String         @db.Char(3)
  status                 ReceiptStatus  @default(ISSUED)
  snapshot               Json // frozen student, batch, payer, method, allocations [{ invoiceNo, amount }], fee-head lines and tax breakdown used to render the PDF
  contentHash            String?        @map("content_hash") @db.Char(64) // SHA-256 of snapshot; verified before re-render
  replacedByReceiptId    String?        @map("replaced_by_receipt_id") @db.Uuid // receipt issued in place of this cancelled one
  pdfFileId              String?        @map("pdf_file_id") @db.Uuid
  sentAt                 DateTime?      @map("sent_at") @db.Timestamptz(6) // shared with the parent on WhatsApp / email
  issuedById             String?        @map("issued_by_id") @db.Uuid // User id (audit only, no FK); null for online payments
  cancelledAt            DateTime?      @map("cancelled_at") @db.Timestamptz(6)
  cancelledById          String?        @map("cancelled_by_id") @db.Uuid
  cancelReason           String?        @map("cancel_reason") @db.VarChar(255)
  createdAt              DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt              DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization         Organization          @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus               Campus                @relation(fields: [campusId], references: [id], onDelete: Restrict)
  payment              Payment               @relation(fields: [paymentId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK: same tenant guaranteed by the database
  student              Student?              @relation(fields: [studentId], references: [id], onDelete: Restrict)
  admissionApplication AdmissionApplication? @relation(fields: [admissionApplicationId], references: [id], onDelete: Restrict)
  pdfFile              FileAsset?            @relation(fields: [pdfFileId], references: [id], onDelete: SetNull)
  cancelledBy          User?                 @relation(fields: [cancelledById], references: [id], onDelete: SetNull)
  replacedByReceipt    Receipt?              @relation("ReceiptReplacement", fields: [replacedByReceiptId], references: [id], onDelete: SetNull)
  replacesReceipts     Receipt[]             @relation("ReceiptReplacement")

  @@unique([paymentId, organizationId]) // required by the composite one-to-one FK to Payment
  @@unique([organizationId, receiptNo])
  @@index([organizationId, studentId, receiptDate])
  @@index([organizationId, campusId, receiptDate, status])
  @@map("receipts")
}

// Refund of a payment (full or part) with approval; online refunds go back through the gateway.
model Refund {
  id              String         @id @default(uuid()) @db.Uuid
  organizationId  String         @map("organization_id") @db.Uuid
  campusId        String         @map("campus_id") @db.Uuid
  paymentId       String         @map("payment_id") @db.Uuid
  studentId       String?        @map("student_id") @db.Uuid // null for application-fee refunds
  refundNo        String         @map("refund_no") @db.VarChar(40) // from NumberSequence REFUND_NO
  refundType      RefundType     @default(PAYMENT_REVERSAL) @map("refund_type")
  invoiceId       String?        @map("invoice_id") @db.Uuid // main invoice the money goes back against; the exact split is in RefundAllocation
  feeHeadId       String?        @map("fee_head_id") @db.Uuid // e.g. the refundable caution deposit head
  grossAmount     Decimal?       @map("gross_amount") @db.Decimal(12, 2) // before deductions; amount = grossAmount - deductionAmount
  deductionAmount Decimal        @default(0) @map("deduction_amount") @db.Decimal(12, 2) // damage / cancellation charges kept back
  deductionReason String?        @map("deduction_reason") @db.VarChar(255)
  amount          Decimal        @db.Decimal(12, 2) // money actually paid back
  currency        String         @db.Char(3)
  refundDate      DateTime?      @map("refund_date") @db.Date // day-book date in the campus timezone
  idempotencyKey  String?        @map("idempotency_key") @db.VarChar(100) // from the Idempotency-Key header; stops double refunds on retry / double click
  dayCloseId      String?        @map("day_close_id") @db.Uuid // cash refunds summed in DayClose.cashRefunded
  settlementId    String?        @map("settlement_id") @db.Uuid // gateway payout that netted this refund
  reason          String         @db.VarChar(500)
  status          RefundStatus   @default(REQUESTED)
  method          PaymentMethod // how the money goes back
  gateway         PaymentGateway @default(OFFLINE)
  gatewayRefundId String?        @map("gateway_refund_id") @db.VarChar(100)
  reference       String?        @db.VarChar(100) // UTR / cheque number of an offline refund
  requestedById   String?        @map("requested_by_id") @db.Uuid // User id (audit only, no FK)
  approvedById    String?        @map("approved_by_id") @db.Uuid // User who approved or rejected
  approvedAt      DateTime?      @map("approved_at") @db.Timestamptz(6)
  rejectionReason String?        @map("rejection_reason") @db.VarChar(255)
  processedAt     DateTime?      @map("processed_at") @db.Timestamptz(6)
  processedById   String?        @map("processed_by_id") @db.Uuid // User id (audit only, no FK)
  voucherFileId   String?        @map("voucher_file_id") @db.Uuid // signed refund voucher
  failureReason   String?        @map("failure_reason") @db.VarChar(255)
  cancelledAt     DateTime?      @map("cancelled_at") @db.Timestamptz(6)
  cancelReason    String?        @map("cancel_reason") @db.VarChar(255)
  createdAt       DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization       @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus             @relation(fields: [campusId], references: [id], onDelete: Restrict)
  payment      Payment            @relation(fields: [paymentId, organizationId], references: [id, organizationId], onDelete: Restrict) // composite FK: same tenant guaranteed by the database
  student      Student?           @relation(fields: [studentId], references: [id], onDelete: Restrict)
  invoice      FeeInvoice?        @relation(fields: [invoiceId], references: [id], onDelete: Restrict)
  feeHead      FeeHead?           @relation(fields: [feeHeadId], references: [id], onDelete: Restrict)
  dayClose     DayClose?          @relation(fields: [dayCloseId], references: [id], onDelete: SetNull)
  settlement   Settlement?        @relation(fields: [settlementId], references: [id], onDelete: SetNull)
  voucherFile  FileAsset?         @relation(fields: [voucherFileId], references: [id], onDelete: SetNull)
  approvedBy   User?              @relation(fields: [approvedById], references: [id], onDelete: SetNull)
  allocations  RefundAllocation[]

  @@unique([organizationId, refundNo])
  @@unique([organizationId, idempotencyKey])
  @@unique([gateway, gatewayRefundId])
  @@index([organizationId, paymentId])
  @@index([organizationId, invoiceId])
  @@index([organizationId, settlementId])
  @@index([organizationId, dayCloseId])
  @@index([organizationId, campusId, refundDate])
  @@index([organizationId, campusId, status, createdAt])
  @@index([organizationId, studentId])
  @@map("refunds")
}

// Which allocation / invoice the refunded money comes out of, so amountPaid and balance can be recomputed and the right invoice reopens.
model RefundAllocation {
  id                  String   @id @default(uuid()) @db.Uuid
  organizationId      String   @map("organization_id") @db.Uuid
  refundId            String   @map("refund_id") @db.Uuid
  paymentAllocationId String?  @map("payment_allocation_id") @db.Uuid // null = refund of the unallocated advance
  invoiceId           String?  @map("invoice_id") @db.Uuid
  amount              Decimal  @db.Decimal(12, 2)
  currency            String   @db.Char(3)
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization      Organization       @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  refund            Refund             @relation(fields: [refundId], references: [id], onDelete: Restrict)
  paymentAllocation PaymentAllocation? @relation(fields: [paymentAllocationId], references: [id], onDelete: Restrict)
  invoice           FeeInvoice?        @relation(fields: [invoiceId], references: [id], onDelete: Restrict)

  @@index([organizationId, refundId])
  @@index([organizationId, invoiceId])
  @@index([organizationId, paymentAllocationId])
  @@map("refund_allocations")
}

// Inbox of provider webhooks. The unique (provider, eventId) key makes handling idempotent.
model WebhookEvent {
  id                String             @id @default(uuid()) @db.Uuid
  organizationId    String?            @map("organization_id") @db.Uuid // null until the worker resolves the tenant from the payload
  gatewayAccountId  String?            @map("gateway_account_id") @db.Uuid // payment providers only
  provider          WebhookProvider
  eventId           String             @map("event_id") @db.VarChar(150) // provider's event id (or a payload hash when none is sent)
  eventType         String             @map("event_type") @db.VarChar(100) // e.g. payment.captured, charge.refunded
  signatureValid    Boolean            @default(false) @map("signature_valid")
  payload           Json
  headers           Json? // selected request headers kept for debugging
  status            WebhookEventStatus @default(RECEIVED)
  attempts          Int                @default(0) @db.SmallInt
  lastError         String?            @map("last_error") @db.Text
  nextRetryAt       DateTime?          @map("next_retry_at") @db.Timestamptz(6)
  relatedEntityType String?            @map("related_entity_type") @db.VarChar(60) // Payment, Refund, MessageLog ...
  relatedEntityId   String?            @map("related_entity_id") @db.Uuid
  receivedAt        DateTime           @default(now()) @map("received_at") @db.Timestamptz(6)
  processedAt       DateTime?          @map("processed_at") @db.Timestamptz(6)
  createdAt         DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization   Organization?          @relation(fields: [organizationId], references: [id], onDelete: Restrict) // evidence trail for gateway disputes; never purged with a cascade
  gatewayAccount PaymentGatewayAccount? @relation(fields: [gatewayAccountId], references: [id], onDelete: SetNull)

  @@unique([provider, eventId])
  @@index([organizationId, provider, receivedAt])
  @@index([organizationId, status, receivedAt]) // tenant-facing webhook log
  @@index([status, nextRetryAt]) // retry worker
  @@map("webhook_events")
}

// Gateway payout to the institute's bank account, reconciled against the payments it contains.
model Settlement {
  id                  String           @id @default(uuid()) @db.Uuid
  organizationId      String           @map("organization_id") @db.Uuid
  gatewayAccountId    String           @map("gateway_account_id") @db.Uuid
  gateway             PaymentGateway
  gatewaySettlementId String           @map("gateway_settlement_id") @db.VarChar(100)
  settlementDate      DateTime         @map("settlement_date") @db.Date
  currency            String           @db.Char(3)
  grossAmount         Decimal          @map("gross_amount") @db.Decimal(12, 2)
  feeAmount           Decimal          @default(0) @map("fee_amount") @db.Decimal(12, 2)
  taxAmount           Decimal          @default(0) @map("tax_amount") @db.Decimal(12, 2)
  refundAmount        Decimal          @default(0) @map("refund_amount") @db.Decimal(12, 2)
  chargebackAmount    Decimal          @default(0) @map("chargeback_amount") @db.Decimal(12, 2) // disputes debited in this payout
  adjustmentAmount    Decimal          @default(0) @map("adjustment_amount") @db.Decimal(12, 2) // other gateway adjustments (+/-)
  netAmount           Decimal          @map("net_amount") @db.Decimal(12, 2) // credited to the bank: gross - fee - tax - refund - chargeback + adjustment
  utr                 String?          @db.VarChar(50) // bank reference of the payout
  paymentCount        Int              @default(0) @map("payment_count")
  status              SettlementStatus @default(PENDING)
  mismatchAmount      Decimal?         @map("mismatch_amount") @db.Decimal(12, 2)
  reconciledAt        DateTime?        @map("reconciled_at") @db.Timestamptz(6)
  reconciledById      String?          @map("reconciled_by_id") @db.Uuid // User id (audit only, no FK); null when auto-reconciled
  rawData             Json?            @map("raw_data") // settlement report rows from the gateway
  createdAt           DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization   Organization          @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  gatewayAccount PaymentGatewayAccount @relation(fields: [gatewayAccountId], references: [id], onDelete: Restrict)
  payments       Payment[]
  refunds        Refund[]

  @@unique([organizationId, gateway, gatewaySettlementId])
  @@index([organizationId, settlementDate])
  @@index([organizationId, status])
  @@map("settlements")
}

// Daily cash closing by an accountant: counted cash vs system cash, and the bank deposit.
model DayClose {
  id              String         @id @default(uuid()) @db.Uuid
  organizationId  String         @map("organization_id") @db.Uuid
  campusId        String         @map("campus_id") @db.Uuid
  closeDate       DateTime       @map("close_date") @db.Date
  closedById      String         @map("closed_by_id") @db.Uuid // accountant whose counter is closed
  currency        String         @db.Char(3)
  openingCash     Decimal        @default(0) @map("opening_cash") @db.Decimal(12, 2)
  cashCollected   Decimal        @default(0) @map("cash_collected") @db.Decimal(12, 2)
  cashRefunded    Decimal        @default(0) @map("cash_refunded") @db.Decimal(12, 2)
  expectedCash    Decimal        @map("expected_cash") @db.Decimal(12, 2) // opening + collected - refunded
  countedCash     Decimal        @map("counted_cash") @db.Decimal(12, 2)
  variance        Decimal        @default(0) @db.Decimal(12, 2) // counted - expected
  denominations   Json? // { "500": 12, "200": 5, ... }
  totalsByMethod  Json?          @map("totals_by_method") // { CASH, UPI, CARD, CHEQUE ... } for the day
  paymentCount    Int            @default(0) @map("payment_count")
  depositedAmount Decimal?       @map("deposited_amount") @db.Decimal(12, 2)
  depositBank     String?        @map("deposit_bank") @db.VarChar(100)
  depositSlipNo   String?        @map("deposit_slip_no") @db.VarChar(50)
  depositedOn     DateTime?      @map("deposited_on") @db.Date
  depositSlipId   String?        @map("deposit_slip_id") @db.Uuid // scanned deposit slip
  closingCash     Decimal?       @map("closing_cash") @db.Decimal(12, 2) // cash kept in hand; next day's opening
  status          DayCloseStatus @default(OPEN)
  notes           String?        @db.VarChar(500)
  submittedAt     DateTime?      @map("submitted_at") @db.Timestamptz(6)
  verifiedById    String?        @map("verified_by_id") @db.Uuid
  verifiedAt      DateTime?      @map("verified_at") @db.Timestamptz(6)
  createdAt       DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus       @relation(fields: [campusId], references: [id], onDelete: Restrict)
  closedBy     User         @relation("DayCloseClosedBy", fields: [closedById], references: [id], onDelete: Restrict)
  verifiedBy   User?        @relation("DayCloseVerifiedBy", fields: [verifiedById], references: [id], onDelete: SetNull)
  depositSlip  FileAsset?   @relation(fields: [depositSlipId], references: [id], onDelete: SetNull)
  payments     Payment[]
  refunds      Refund[]

  @@unique([organizationId, campusId, closeDate, closedById])
  @@index([organizationId, campusId, closeDate])
  @@index([organizationId, status, closeDate])
  @@map("day_closes")
}
```

## Communication: notifications, WhatsApp, email, SMS, credits

File `server/prisma/schema/10-communication.prisma` — 16 models, 14 enums.

```prisma
// 10-communication: notification templates, in-app notifications and preferences, announcements,
// the outbound message log, WhatsApp / email / SMS sender setup, message credits and push tokens.

enum NotificationCategory {
  ATTENDANCE
  FEES
  EXAMS
  HOMEWORK
  ANNOUNCEMENTS
  ADMISSIONS
  LEAVE
  TIMETABLE
  TRANSPORT
  LIBRARY
  HOSTEL
  PAYROLL
  ACCOUNT // login, OTP, password, security alerts
  SYSTEM
}

// Approval state of a template at the provider (Meta for WhatsApp, DLT for SMS).
enum TemplateApprovalStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
  PAUSED
  DISABLED
  NOT_REQUIRED // in-app, push and email templates
}

enum AnnouncementStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  CANCELLED
  FAILED
}

enum MessageStatus {
  QUEUED
  SENT
  DELIVERED
  READ
  FAILED
}

enum MessageProvider {
  META_WHATSAPP
  MSG91
  TWILIO
  AMAZON_SES
  FCM
  INTERNAL // in-app only
}

enum MessageRecipientType {
  USER
  GUARDIAN
  STUDENT
  STAFF
  LEAD // admission inquiry contact
  OTHER
}

enum WhatsAppTemplateCategory {
  UTILITY
  MARKETING
  AUTHENTICATION
}

enum WhatsAppQualityRating {
  GREEN
  YELLOW
  RED
  UNKNOWN
}

enum WhatsAppMessageType {
  TEXT
  IMAGE
  DOCUMENT
  AUDIO
  VIDEO
  LOCATION
  BUTTON_REPLY
  INTERACTIVE
  OTHER
}

enum SenderVerificationStatus {
  PENDING
  VERIFIED
  FAILED
}

enum EmailSuppressionReason {
  HARD_BOUNCE
  SOFT_BOUNCE_LIMIT
  COMPLAINT
  UNSUBSCRIBED
  MANUAL
}

enum CreditUnit {
  MESSAGES // SMS packs: one credit = one SMS segment
  MONEY // WhatsApp: prepaid money balance, charged per message at Meta cost + margin
}

enum CreditTransactionType {
  PURCHASE
  CONSUME
  REFUND // failed message credited back
  ADJUSTMENT
  EXPIRY
  BONUS
  RESERVE // hold for a queued bulk campaign; moves balance into reserved
  RELEASE // unused part of a reservation returned
}

// TRAI DLT content template category (India).
enum DltTemplateCategory {
  TRANSACTIONAL
  SERVICE_IMPLICIT
  SERVICE_EXPLICIT
  PROMOTIONAL
}

// Message template per event, channel and language. organizationId null = EduFlow default used until a tenant overrides it.
model NotificationTemplate {
  id                 String                 @id @default(uuid()) @db.Uuid
  organizationId     String?                @map("organization_id") @db.Uuid // null ONLY for system default templates
  eventKey           String                 @map("event_key") @db.VarChar(80) // e.g. attendance.absent, fees.receipt, fees.reminder.overdue
  channel            Channel
  language           String                 @default("en") @db.VarChar(10)
  category           NotificationCategory
  name               String                 @db.VarChar(120)
  subject            String?                @db.VarChar(200) // email subject / push title
  body               String                 @db.Text // text with {{variables}}, e.g. "{{studentName}} was absent on {{date}}"
  variables          String[] // allowed variable names, in order for WhatsApp / DLT positional placeholders
  whatsAppTemplateId String?                @map("whats_app_template_id") @db.Uuid // approved Meta template used for the WHATSAPP channel
  smsDltTemplateId   String?                @map("sms_dlt_template_id") @db.Uuid // registered TRAI DLT content template for the SMS channel (India); language-specific
  smsSenderIdId      String?                @map("sms_sender_id_id") @db.Uuid // SMS header to send with
  approvalStatus     TemplateApprovalStatus @default(NOT_REQUIRED) @map("approval_status")
  isSystem           Boolean                @default(false) @map("is_system")
  status             RecordStatus           @default(ACTIVE)
  updatedById        String?                @map("updated_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt          DateTime               @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime               @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt          DateTime?              @map("deleted_at") @db.Timestamptz(6)

  organization     Organization?     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  whatsAppTemplate WhatsAppTemplate? @relation(fields: [whatsAppTemplateId], references: [id], onDelete: SetNull)
  smsSenderId      SmsSenderId?      @relation(fields: [smsSenderIdId], references: [id], onDelete: SetNull)
  smsDltTemplate   SmsDltTemplate?   @relation(fields: [smsDltTemplateId], references: [id], onDelete: SetNull)
  messageLogs      MessageLog[]

  // System defaults (organization_id IS NULL) are kept unique by a partial unique index in the SQL migration.
  @@unique([organizationId, eventKey, channel, language])
  @@index([organizationId, category, status])
  @@index([eventKey, channel, language])
  @@map("notification_templates")
}

// In-app notification shown in the bell menu of one user.
model Notification {
  id             String               @id @default(uuid()) @db.Uuid
  organizationId String               @map("organization_id") @db.Uuid
  userId         String               @map("user_id") @db.Uuid
  category       NotificationCategory
  eventKey       String?              @map("event_key") @db.VarChar(80)
  title          String               @db.VarChar(200)
  body           String               @db.VarChar(1000)
  deepLink       String?              @map("deep_link") @db.VarChar(500) // app route, e.g. /fees/invoices/{id}
  entityType     String?              @map("entity_type") @db.VarChar(60)
  entityId       String?              @map("entity_id") @db.Uuid
  data           Json? // extra payload for the client
  readAt         DateTime?            @map("read_at") @db.Timestamptz(6)
  createdAt      DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([organizationId, userId, readAt, createdAt]) // unread list and badge count
  @@index([organizationId, userId, createdAt])
  @@index([createdAt]) // retention cleanup
  @@map("notifications")
}

// A user's opt-in / opt-out per channel and category.
model NotificationPreference {
  id             String               @id @default(uuid()) @db.Uuid
  organizationId String               @map("organization_id") @db.Uuid
  userId         String               @map("user_id") @db.Uuid
  channel        Channel
  category       NotificationCategory
  isEnabled      Boolean              @default(true) @map("is_enabled")
  createdAt      DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId, channel, category])
  @@index([organizationId, channel, category, isEnabled]) // fan-out: who opted out of a channel for a category
  @@map("notification_preferences")
}

// Notice / circular sent to a filtered audience over one or more channels, now or scheduled.
model Announcement {
  id                String             @id @default(uuid()) @db.Uuid
  organizationId    String             @map("organization_id") @db.Uuid
  campusId          String?            @map("campus_id") @db.Uuid // null = all campuses
  title             String             @db.VarChar(200)
  body              String             @db.Text
  audience          Audience           @default(ALL)
  audienceFilter    Json?              @map("audience_filter") // { courseIds, batchIds, roleKeys, studentIds, feeDefaultersOnly }
  channels          Channel[] // IN_APP is always implied
  attachmentFileIds String[]           @map("attachment_file_ids") @db.Uuid // FileAsset ids
  status            AnnouncementStatus @default(DRAFT)
  isPinned          Boolean            @default(false) @map("is_pinned")
  requiresAck       Boolean            @default(false) @map("requires_ack") // parents must tap "I have read this"
  scheduledAt       DateTime?          @map("scheduled_at") @db.Timestamptz(6)
  sentAt            DateTime?          @map("sent_at") @db.Timestamptz(6)
  expiresAt         DateTime?          @map("expires_at") @db.Timestamptz(6) // hidden from the portals after this time
  recipientCount    Int                @default(0) @map("recipient_count")
  readCount         Int                @default(0) @map("read_count")
  authorId          String?            @map("author_id") @db.Uuid
  createdAt         DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt         DateTime?          @map("deleted_at") @db.Timestamptz(6)

  organization Organization            @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus?                 @relation(fields: [campusId], references: [id], onDelete: Restrict)
  author       User?                   @relation(fields: [authorId], references: [id], onDelete: SetNull)
  recipients   AnnouncementRecipient[]
  messageLogs  MessageLog[]

  @@index([organizationId, campusId, status, createdAt])
  @@index([organizationId, status, scheduledAt]) // scheduler
  @@map("announcements")
}

// One resolved recipient of an announcement with read / acknowledgement tracking.
model AnnouncementRecipient {
  id             String               @id @default(uuid()) @db.Uuid
  organizationId String               @map("organization_id") @db.Uuid
  announcementId String               @map("announcement_id") @db.Uuid
  recipientType  MessageRecipientType @map("recipient_type")
  recipientId    String               @map("recipient_id") @db.Uuid // id of the Guardian / Student / Staff / User row
  userId         String?              @map("user_id") @db.Uuid // login of the recipient when one exists (portal inbox)
  studentId      String?              @map("student_id") @db.Uuid // the child the notice is about, for parents
  readAt         DateTime?            @map("read_at") @db.Timestamptz(6)
  acknowledgedAt DateTime?            @map("acknowledged_at") @db.Timestamptz(6)
  createdAt      DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  announcement Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id], onDelete: Cascade)
  student      Student?     @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([organizationId, announcementId, recipientType, recipientId])
  @@index([organizationId, userId, readAt])
  @@map("announcement_recipients")
}

// Every WhatsApp, SMS, email and push message sent, with delivery status and cost. High volume; never soft-deleted.
// cost / currency = amount debited from the tenant wallet; providerCost + marginAmount explain it (WhatsApp: Meta cost + 15 % margin).
model MessageLog {
  id                   String               @id @default(uuid()) @db.Uuid
  organizationId       String               @map("organization_id") @db.Uuid
  campusId             String?              @map("campus_id") @db.Uuid
  channel              Channel
  provider             MessageProvider
  toAddress            String               @map("to_address") @db.VarChar(255) // phone (E.164), email or device token id
  recipientType        MessageRecipientType @map("recipient_type")
  recipientId          String?              @map("recipient_id") @db.Uuid // id of the Guardian / Student / Staff / User / inquiry row
  studentId            String?              @map("student_id") @db.Uuid // student the message is about (communication timeline)
  templateId           String?              @map("template_id") @db.Uuid
  whatsAppTemplateId   String?              @map("whats_app_template_id") @db.Uuid
  whatsAppAccountId    String?              @map("whats_app_account_id") @db.Uuid // sending number
  smsSenderIdId        String?              @map("sms_sender_id_id") @db.Uuid // SMS header used
  dltTemplateId        String?              @map("dlt_template_id") @db.VarChar(30) // snapshot of the DLT content template id actually sent
  dltEntityId          String?              @map("dlt_entity_id") @db.VarChar(30) // snapshot of the DLT principal entity id
  recipientCountryCode String?              @map("recipient_country_code") @db.Char(2) // per-country WhatsApp / SMS rates
  pricingCategory      String?              @map("pricing_category") @db.VarChar(20) // MARKETING | UTILITY | AUTHENTICATION | SERVICE
  isBillable           Boolean              @default(true) @map("is_billable") // false for free-window / service conversations
  announcementId       String?              @map("announcement_id") @db.Uuid
  eventKey             String?              @map("event_key") @db.VarChar(80)
  subject              String?              @db.VarChar(200)
  body                 String?              @db.Text // rendered text (OTP values are masked)
  variables            Json? // values used to render the template
  status               MessageStatus        @default(QUEUED)
  providerMessageId    String?              @map("provider_message_id") @db.VarChar(150)
  segments             Int                  @default(1) @db.SmallInt // SMS parts
  cost                 Decimal              @default(0) @db.Decimal(12, 4) // amount charged to the tenant wallet; 4 decimals: per-message prices are fractions of a rupee
  currency             String?              @db.Char(3) // wallet currency
  providerCost         Decimal              @default(0) @map("provider_cost") @db.Decimal(12, 4) // what Meta / MSG91 / Twilio charges EduFlow
  providerCurrency     String?              @map("provider_currency") @db.Char(3)
  exchangeRate         Decimal?             @map("exchange_rate") @db.Decimal(18, 8) // providerCurrency -> currency at send time (ExchangeRate)
  marginAmount         Decimal              @default(0) @map("margin_amount") @db.Decimal(12, 4) // in the wallet currency
  errorCode            String?              @map("error_code") @db.VarChar(60)
  error                String?              @db.VarChar(500)
  retryCount           Int                  @default(0) @map("retry_count") @db.SmallInt
  queuedAt             DateTime             @default(now()) @map("queued_at") @db.Timestamptz(6)
  sentAt               DateTime?            @map("sent_at") @db.Timestamptz(6)
  deliveredAt          DateTime?            @map("delivered_at") @db.Timestamptz(6)
  readAt               DateTime?            @map("read_at") @db.Timestamptz(6)
  failedAt             DateTime?            @map("failed_at") @db.Timestamptz(6)
  triggeredById        String?              @map("triggered_by_id") @db.Uuid // User id (audit only, no FK); null for automatic messages
  createdAt            DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization       Organization             @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus             Campus?                  @relation(fields: [campusId], references: [id], onDelete: SetNull)
  student            Student?                 @relation(fields: [studentId], references: [id], onDelete: SetNull)
  template           NotificationTemplate?    @relation(fields: [templateId], references: [id], onDelete: SetNull)
  whatsAppTemplate   WhatsAppTemplate?        @relation(fields: [whatsAppTemplateId], references: [id], onDelete: SetNull)
  whatsAppAccount    WhatsAppAccount?         @relation(fields: [whatsAppAccountId], references: [id], onDelete: SetNull)
  smsSenderId        SmsSenderId?             @relation(fields: [smsSenderIdId], references: [id], onDelete: SetNull)
  announcement       Announcement?            @relation(fields: [announcementId], references: [id], onDelete: SetNull)
  creditTransactions CreditTransaction[]
  inboundReplies     WhatsAppInboundMessage[]
  emailSuppressions  EmailSuppression[]
  feeReminderLogs    FeeReminderLog[]

  @@unique([provider, providerMessageId]) // delivery webhooks find the row by this key
  @@index([organizationId, channel, status, createdAt])
  @@index([organizationId, channel, pricingCategory, createdAt]) // cost and margin reports, Meta bill reconciliation
  @@index([organizationId, campusId, createdAt])
  @@index([organizationId, recipientType, recipientId, createdAt])
  @@index([organizationId, studentId, createdAt])
  @@index([organizationId, announcementId])
  @@index([organizationId, toAddress, createdAt])
  @@map("message_logs")
}

// A tenant's WhatsApp Business Account number connected through the Meta Cloud API.
// phoneNumberId routes inbound webhooks, so it is unique among LIVE rows only (a disconnected number can be reconnected):
//   partial unique index in the SQL migration, uq_whatsapp_phone_number_live (phone_number_id) WHERE deleted_at IS NULL
// One default account per organization: partial unique index WHERE is_default AND deleted_at IS NULL.
model WhatsAppAccount {
  id                 String                @id @default(uuid()) @db.Uuid
  organizationId     String                @map("organization_id") @db.Uuid
  campusId           String?               @map("campus_id") @db.Uuid // null = shared by all campuses
  wabaId             String                @map("waba_id") @db.VarChar(40) // WhatsApp Business Account id
  phoneNumberId      String                @map("phone_number_id") @db.VarChar(40) // Meta phone number id; routes inbound webhooks to the tenant
  displayPhoneNumber String                @map("display_phone_number") @db.VarChar(20)
  verifiedName       String?               @map("verified_name") @db.VarChar(150)
  accessTokenRef     String                @map("access_token_ref") @db.VarChar(255) // reference to the encrypted system-user token in the secrets store
  qualityRating      WhatsAppQualityRating @default(UNKNOWN) @map("quality_rating")
  messagingLimitTier String?               @map("messaging_limit_tier") @db.VarChar(20) // TIER_1K, TIER_10K ...
  isDefault          Boolean               @default(false) @map("is_default")
  status             RecordStatus          @default(ACTIVE)
  connectedAt        DateTime?             @map("connected_at") @db.Timestamptz(6)
  lastSyncedAt       DateTime?             @map("last_synced_at") @db.Timestamptz(6)
  createdAt          DateTime              @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime              @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt          DateTime?             @map("deleted_at") @db.Timestamptz(6)

  organization    Organization             @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus          Campus?                  @relation(fields: [campusId], references: [id], onDelete: Restrict)
  templates       WhatsAppTemplate[]
  inboundMessages WhatsAppInboundMessage[]
  messageLogs     MessageLog[]

  @@index([organizationId, status])
  @@index([organizationId, campusId])
  @@index([phoneNumberId]) // webhook routing
  @@map("whats_app_accounts")
}

// WhatsApp message template registered with Meta (name + language), synced with its approval status.
model WhatsAppTemplate {
  id                String                   @id @default(uuid()) @db.Uuid
  organizationId    String                   @map("organization_id") @db.Uuid
  whatsAppAccountId String                   @map("whats_app_account_id") @db.Uuid
  name              String                   @db.VarChar(120) // lower_snake_case name at Meta
  category          WhatsAppTemplateCategory
  language          String                   @db.VarChar(10) // en, hi, en_US
  status            TemplateApprovalStatus   @default(DRAFT)
  metaTemplateId    String?                  @map("meta_template_id") @db.VarChar(60)
  components        Json // header, body, footer and buttons as sent to Meta
  bodyText          String                   @map("body_text") @db.Text
  variableCount     Int                      @default(0) @map("variable_count") @db.SmallInt
  rejectionReason   String?                  @map("rejection_reason") @db.VarChar(500)
  submittedAt       DateTime?                @map("submitted_at") @db.Timestamptz(6)
  lastSyncedAt      DateTime?                @map("last_synced_at") @db.Timestamptz(6)
  createdAt         DateTime                 @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime                 @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt         DateTime?                @map("deleted_at") @db.Timestamptz(6)

  organization          Organization           @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  whatsAppAccount       WhatsAppAccount        @relation(fields: [whatsAppAccountId], references: [id], onDelete: Cascade)
  notificationTemplates NotificationTemplate[]
  messageLogs           MessageLog[]

  @@unique([organizationId, whatsAppAccountId, name, language])
  @@index([organizationId, status, category])
  @@map("whats_app_templates")
}

// Message received from a parent on the institute's WhatsApp number (opens the 24-hour reply window).
model WhatsAppInboundMessage {
  id                  String              @id @default(uuid()) @db.Uuid
  organizationId      String              @map("organization_id") @db.Uuid
  whatsAppAccountId   String              @map("whats_app_account_id") @db.Uuid
  waMessageId         String              @map("wa_message_id") @db.VarChar(150) // Meta message id (wamid...)
  fromPhone           String              @map("from_phone") @db.VarChar(20) // E.164
  profileName         String?             @map("profile_name") @db.VarChar(150)
  messageType         WhatsAppMessageType @default(TEXT) @map("message_type")
  text                String?             @db.Text
  mediaFileId         String?             @map("media_file_id") @db.Uuid // media downloaded into S3
  payload             Json // raw message object from the webhook
  replyToMessageLogId String?             @map("reply_to_message_log_id") @db.Uuid // outbound message this one replies to
  guardianId          String?             @map("guardian_id") @db.Uuid // matched by phone number
  receivedAt          DateTime            @map("received_at") @db.Timestamptz(6)
  readAt              DateTime?           @map("read_at") @db.Timestamptz(6) // opened by staff in the inbox
  handledById         String?             @map("handled_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt           DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization      Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  whatsAppAccount   WhatsAppAccount @relation(fields: [whatsAppAccountId], references: [id], onDelete: Cascade)
  mediaFile         FileAsset?      @relation(fields: [mediaFileId], references: [id], onDelete: SetNull)
  replyToMessageLog MessageLog?     @relation(fields: [replyToMessageLogId], references: [id], onDelete: SetNull)
  guardian          Guardian?       @relation(fields: [guardianId], references: [id], onDelete: SetNull)

  @@unique([organizationId, waMessageId])
  @@index([organizationId, whatsAppAccountId, receivedAt])
  @@index([organizationId, fromPhone, receivedAt])
  @@index([organizationId, readAt])
  @@map("whats_app_inbound_messages")
}

// "From" address of a tenant verified in Amazon SES (domain with DKIM).
model EmailSenderIdentity {
  id                 String                   @id @default(uuid()) @db.Uuid
  organizationId     String                   @map("organization_id") @db.Uuid
  fromName           String                   @map("from_name") @db.VarChar(120)
  fromEmail          String                   @map("from_email") @db.VarChar(255)
  replyToEmail       String?                  @map("reply_to_email") @db.VarChar(255)
  domain             String                   @db.VarChar(255)
  dkimVerified       Boolean                  @default(false) @map("dkim_verified")
  dkimRecords        Json?                    @map("dkim_records") // CNAME records the tenant must add to DNS
  spfVerified        Boolean                  @default(false) @map("spf_verified")
  verificationStatus SenderVerificationStatus @default(PENDING) @map("verification_status")
  verifiedAt         DateTime?                @map("verified_at") @db.Timestamptz(6)
  lastCheckedAt      DateTime?                @map("last_checked_at") @db.Timestamptz(6)
  isDefault          Boolean                  @default(false) @map("is_default")
  status             RecordStatus             @default(ACTIVE)
  createdAt          DateTime                 @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime                 @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt          DateTime?                @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([organizationId, fromEmail])
  @@index([organizationId, status])
  @@index([domain])
  @@map("email_sender_identities")
}

// Email address that must not be mailed again (hard bounce, spam complaint, unsubscribe).
model EmailSuppression {
  id             String                 @id @default(uuid()) @db.Uuid
  organizationId String                 @map("organization_id") @db.Uuid
  email          String                 @db.VarChar(255) // lower-case
  reason         EmailSuppressionReason
  detail         String?                @db.VarChar(500) // bounce sub-type or diagnostic code from SES
  messageLogId   String?                @map("message_log_id") @db.Uuid // message that caused the suppression
  suppressedAt   DateTime               @default(now()) @map("suppressed_at") @db.Timestamptz(6)
  expiresAt      DateTime?              @map("expires_at") @db.Timestamptz(6) // soft-bounce blocks expire; hard bounces do not
  removedAt      DateTime?              @map("removed_at") @db.Timestamptz(6) // manually cleared by an admin
  removedById    String?                @map("removed_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt      DateTime               @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime               @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  messageLog   MessageLog?  @relation(fields: [messageLogId], references: [id], onDelete: SetNull)

  @@unique([organizationId, email])
  @@index([organizationId, reason])
  @@map("email_suppressions")
}

// SMS header (sender id) with the TRAI DLT registration needed in India; Twilio numbers for other countries.
model SmsSenderId {
  id                 String                   @id @default(uuid()) @db.Uuid
  organizationId     String                   @map("organization_id") @db.Uuid
  provider           MessageProvider          @default(MSG91)
  header             String                   @db.VarChar(20) // 6-character DLT header, e.g. BFPSCH, or a phone number for Twilio
  countryCode        String                   @default("IN") @map("country_code") @db.Char(2)
  dltEntityId        String?                  @map("dlt_entity_id") @db.VarChar(30) // principal entity id on the DLT portal
  dltTelemarketerId  String?                  @map("dlt_telemarketer_id") @db.VarChar(30) // telemarketer id of the PE-TM chain (MSG91)
  verificationStatus SenderVerificationStatus @default(PENDING) @map("verification_status")
  isDefault          Boolean                  @default(false) @map("is_default")
  status             RecordStatus             @default(ACTIVE)
  createdAt          DateTime                 @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime                 @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt          DateTime?                @map("deleted_at") @db.Timestamptz(6)

  organization          Organization           @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  notificationTemplates NotificationTemplate[]
  dltTemplates          SmsDltTemplate[]
  messageLogs           MessageLog[]

  @@unique([organizationId, header])
  @@index([organizationId, status])
  @@map("sms_sender_ids")
}

// DLT content template registered on the TRAI DLT portal under one header: exact text, category, language and approval.
model SmsDltTemplate {
  id             String                 @id @default(uuid()) @db.Uuid
  organizationId String                 @map("organization_id") @db.Uuid
  smsSenderIdId  String                 @map("sms_sender_id_id") @db.Uuid
  dltTemplateId  String                 @map("dlt_template_id") @db.VarChar(30) // id issued by the DLT portal
  name           String                 @db.VarChar(120)
  category       DltTemplateCategory
  language       String                 @default("en") @db.VarChar(10)
  isUnicode      Boolean                @default(false) @map("is_unicode") // Hindi and other non-Latin scripts
  bodyText       String                 @map("body_text") @db.Text // registered text with {#var#} placeholders; messages are validated against it before sending
  variableCount  Int                    @default(0) @map("variable_count") @db.SmallInt
  approvalStatus TemplateApprovalStatus @default(PENDING) @map("approval_status")
  approvedAt     DateTime?              @map("approved_at") @db.Timestamptz(6)
  createdAt      DateTime               @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime               @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?              @map("deleted_at") @db.Timestamptz(6)

  organization          Organization           @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  smsSenderId           SmsSenderId            @relation(fields: [smsSenderIdId], references: [id], onDelete: Cascade)
  notificationTemplates NotificationTemplate[]

  @@unique([organizationId, dltTemplateId])
  @@index([organizationId, smsSenderIdId, approvalStatus])
  @@map("sms_dlt_templates")
}

// Prepaid balance of a tenant for one paid channel (WhatsApp or SMS). available = balance - reserved.
// SQL migration adds: CHECK (balance >= 0 AND reserved >= 0) so concurrent campaigns cannot overdraw the wallet.
model MessageCreditWallet {
  id                   String     @id @default(uuid()) @db.Uuid
  organizationId       String     @map("organization_id") @db.Uuid
  channel              Channel // WHATSAPP or SMS
  unit                 CreditUnit
  balance              Decimal    @default(0) @db.Decimal(12, 4) // messages or money, by unit; updated in the same transaction as CreditTransaction
  currency             String?    @db.Char(3) // set when unit is MONEY
  totalPurchased       Decimal    @default(0) @map("total_purchased") @db.Decimal(12, 4)
  reserved             Decimal    @default(0) @db.Decimal(12, 4) // held for queued campaigns (RESERVE / RELEASE rows)
  totalConsumed        Decimal    @default(0) @map("total_consumed") @db.Decimal(12, 4)
  totalRefunded        Decimal    @default(0) @map("total_refunded") @db.Decimal(12, 4)
  lowBalanceThreshold  Decimal?   @map("low_balance_threshold") @db.Decimal(12, 4)
  lowBalanceNotifiedAt DateTime?  @map("low_balance_notified_at") @db.Timestamptz(6)
  createdAt            DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization        @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  transactions CreditTransaction[]

  @@unique([organizationId, channel])
  @@index([organizationId, unit])
  @@map("message_credit_wallets")
}

// Ledger row of a credit wallet. Append-only: no updatedAt / deletedAt.
// Duplicates are impossible by design: one CONSUME and one REFUND per MessageLog, one PURCHASE per AddOnPurchase
// (a BullMQ retry or a replayed payment webhook hits the unique keys). A manual resend creates a new MessageLog.
model CreditTransaction {
  id              String                @id @default(uuid()) @db.Uuid
  organizationId  String                @map("organization_id") @db.Uuid
  walletId        String                @map("wallet_id") @db.Uuid
  transactionType CreditTransactionType @map("transaction_type")
  unit            CreditUnit // snapshot of the wallet unit
  currency        String?               @db.Char(3) // snapshot when unit is MONEY
  amount          Decimal               @db.Decimal(12, 4) // positive = credit to the wallet, negative = debit
  balanceAfter    Decimal               @map("balance_after") @db.Decimal(12, 4)
  idempotencyKey  String?               @map("idempotency_key") @db.VarChar(100) // job id / request key for rows without a messageLogId
  messageLogId    String?               @map("message_log_id") @db.Uuid // CONSUME / REFUND rows
  announcementId  String?               @map("announcement_id") @db.Uuid // RESERVE / RELEASE rows of a bulk campaign (no FK)
  addOnPurchaseId String?               @map("add_on_purchase_id") @db.Uuid // PURCHASE rows: the credit pack that was bought
  description     String?               @db.VarChar(255)
  createdById     String?               @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt       DateTime              @default(now()) @map("created_at") @db.Timestamptz(6)

  organization  Organization        @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  wallet        MessageCreditWallet @relation(fields: [walletId], references: [id], onDelete: Restrict)
  messageLog    MessageLog?         @relation(fields: [messageLogId], references: [id], onDelete: SetNull)
  addOnPurchase AddOnPurchase?      @relation(fields: [addOnPurchaseId], references: [id], onDelete: SetNull)

  @@unique([organizationId, messageLogId, transactionType]) // NULL ids never clash: ADJUSTMENT, BONUS, EXPIRY rows are not affected
  @@unique([organizationId, addOnPurchaseId, transactionType])
  @@unique([organizationId, idempotencyKey])
  @@index([organizationId, walletId, createdAt])
  @@index([organizationId, transactionType, createdAt])
  @@index([organizationId, announcementId])
  @@map("credit_transactions")
}

// Push notification token (FCM / APNs) of a user's device.
model DeviceToken {
  id             String         @id @default(uuid()) @db.Uuid
  organizationId String         @map("organization_id") @db.Uuid
  userId         String         @map("user_id") @db.Uuid
  platform       DevicePlatform
  token          String         @db.VarChar(512) // not globally unique: one phone may hold User rows of two organizations
  deviceId       String?        @map("device_id") @db.VarChar(100)
  deviceName     String?        @map("device_name") @db.VarChar(150)
  appVersion     String?        @map("app_version") @db.VarChar(20)
  locale         String?        @db.VarChar(10)
  isActive       Boolean        @default(true) @map("is_active") // set false when the provider reports the token as invalid
  lastSeenAt     DateTime?      @map("last_seen_at") @db.Timestamptz(6)
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, token])
  @@index([organizationId, userId, isActive])
  @@index([token]) // deactivate every row of a token that FCM reports as invalid
  @@map("device_tokens")
}
```

## Operations: library, inventory, transport, hostel

File `server/prisma/schema/11-operations.prisma` — 27 models, 22 enums.

```prisma
// 11-operations: Library, Inventory, Transport and Hostel (Phase 3 modules).
// Library and hostel rules (loan days, fine per day, max books, roll-call time) live in OrganizationSetting.

enum BookCopyStatus {
  AVAILABLE
  ISSUED
  RESERVED
  LOST
  DAMAGED
  UNDER_REPAIR
  WITHDRAWN
}

enum BookIssueStatus {
  ISSUED
  RETURNED
  OVERDUE
  LOST
}

enum LibraryMemberType {
  STUDENT
  STAFF
}

enum InventoryItemType {
  CONSUMABLE // stationery, chalk, cleaning supplies
  ASSET // projector, laptop, furniture
}

enum PurchaseOrderStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  ORDERED
  PARTIALLY_RECEIVED
  RECEIVED
  CANCELLED
}

enum StockTransactionType {
  IN
  OUT
  ADJUST
  ISSUE_TO_STAFF
  ISSUE_TO_STUDENT
  RETURN // issued stock brought back
  SALE // uniform / books / stationery sold to a student; unitPrice + feeInvoiceId set
  TRANSFER_OUT // stock moved to another campus store
  TRANSFER_IN
  WRITE_OFF // damaged / expired stock
}

enum BookReservationStatus {
  WAITING
  READY_FOR_PICKUP
  FULFILLED
  EXPIRED
  CANCELLED
}

enum TransportBoardingStatus {
  BOARDED
  NOT_BOARDED
  DROPPED
  ABSENT
}

enum HostelLeaveType {
  HOME_VISIT
  DAY_OUT
  MEDICAL
  EMERGENCY
}

enum AssetAssignmentStatus {
  ASSIGNED
  RETURNED
  LOST
  DAMAGED
}

enum VehicleType {
  BUS
  MINI_BUS
  VAN
  CAR
  AUTO
  OTHER
}

enum VehicleStatus {
  ACTIVE
  UNDER_MAINTENANCE
  RETIRED
}

enum TransportServiceType {
  BOTH
  PICKUP_ONLY
  DROP_ONLY
}

enum TransportAssignmentStatus {
  ACTIVE
  SUSPENDED // e.g. fee hold
  ENDED
}

enum TripType {
  PICKUP
  DROP
  SPECIAL // excursion, event
}

enum TripStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum MaintenanceType {
  SERVICE
  REPAIR
  TYRE
  INSURANCE_RENEWAL
  FITNESS_RENEWAL
  PUC_RENEWAL
  ACCIDENT
  OTHER
}

enum HostelType {
  BOYS
  GIRLS
  MIXED
}

enum HostelRoomType {
  SINGLE
  DOUBLE
  TRIPLE
  DORMITORY
}

enum HostelBedStatus {
  AVAILABLE
  OCCUPIED
  RESERVED
  MAINTENANCE
}

enum HostelAllocationStatus {
  RESERVED
  ACTIVE
  VACATED
  CANCELLED
}

enum HostelAttendanceStatus {
  PRESENT
  ABSENT
  ON_LEAVE // approved leave / home visit
  LATE_ENTRY
}

// ---------------------------------------------------------------- Library

// Library catalogue category (may be nested): Fiction > Hindi Fiction.
model LibraryCategory {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  parentId       String?      @map("parent_id") @db.Uuid
  name           String       @db.VarChar(100)
  code           String?      @db.VarChar(30) // e.g. a Dewey class
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  parent       LibraryCategory?  @relation("LibraryCategoryTree", fields: [parentId], references: [id], onDelete: SetNull)
  children     LibraryCategory[] @relation("LibraryCategoryTree")
  books        Book[]

  @@unique([organizationId, name])
  @@index([organizationId, parentId])
  @@map("library_categories")
}

// A title in the library catalogue; physical copies are BookCopy rows.
model Book {
  id              String       @id @default(uuid()) @db.Uuid
  organizationId  String       @map("organization_id") @db.Uuid
  categoryId      String?      @map("category_id") @db.Uuid
  subjectId       String?      @map("subject_id") @db.Uuid // links textbooks and reference books to a subject
  title           String       @db.VarChar(300)
  subtitle        String?      @db.VarChar(300)
  authors         String       @db.VarChar(500) // comma-separated
  isbn            String?      @db.VarChar(20)
  publisher       String?      @db.VarChar(150)
  edition         String?      @db.VarChar(50)
  publicationYear Int?         @map("publication_year") @db.SmallInt
  language        String?      @db.VarChar(30)
  pages           Int?
  description     String?      @db.Text
  tags            String[]
  coverFileId     String?      @map("cover_file_id") @db.Uuid
  price           Decimal?     @db.Decimal(12, 2) // replacement price charged when a copy is lost
  currency        String?      @db.Char(3)
  totalCopies     Int          @default(0) @map("total_copies") // cached
  availableCopies Int          @default(0) @map("available_copies") // cached
  status          RecordStatus @default(ACTIVE)
  createdAt       DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt       DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization     Organization      @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  category         LibraryCategory?  @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  subject          Subject?          @relation(fields: [subjectId], references: [id], onDelete: SetNull)
  coverFile        FileAsset?        @relation(fields: [coverFileId], references: [id], onDelete: SetNull)
  copies           BookCopy[]
  issues           BookIssue[]
  bookReservations BookReservation[]

  @@index([organizationId, title])
  @@index([organizationId, isbn])
  @@index([organizationId, categoryId, status])
  @@map("books")
}

// One physical copy of a book with its accession number and barcode.
model BookCopy {
  id             String         @id @default(uuid()) @db.Uuid
  organizationId String         @map("organization_id") @db.Uuid
  campusId       String         @map("campus_id") @db.Uuid // library that holds the copy
  bookId         String         @map("book_id") @db.Uuid
  accessionNo    String         @map("accession_no") @db.VarChar(30) // from NumberSequence LIBRARY_ACCESSION_NO
  barcode        String?        @db.VarChar(50)
  status         BookCopyStatus @default(AVAILABLE)
  condition      String?        @db.VarChar(30) // New, Good, Worn
  shelfLocation  String?        @map("shelf_location") @db.VarChar(50) // rack / shelf
  purchaseDate   DateTime?      @map("purchase_date") @db.Date
  price          Decimal?       @db.Decimal(12, 2)
  currency       String?        @db.Char(3)
  withdrawnAt    DateTime?      @map("withdrawn_at") @db.Timestamptz(6)
  withdrawReason String?        @map("withdraw_reason") @db.VarChar(255)
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?      @map("deleted_at") @db.Timestamptz(6)

  organization     Organization      @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus           Campus            @relation(fields: [campusId], references: [id], onDelete: Restrict)
  book             Book              @relation(fields: [bookId], references: [id], onDelete: Restrict)
  issues           BookIssue[]
  bookReservations BookReservation[]

  @@unique([organizationId, accessionNo])
  @@unique([organizationId, barcode])
  @@index([organizationId, campusId, status])
  @@index([organizationId, bookId, status])
  @@map("book_copies")
}

// Loan of a book copy to a student or staff member, with renewals and overdue fine.
// One open loan per copy is enforced by a partial unique index in the SQL migration:
//   uq_book_issue_open (organization_id, book_copy_id) WHERE status IN ('ISSUED','OVERDUE')
model BookIssue {
  id             String            @id @default(uuid()) @db.Uuid
  organizationId String            @map("organization_id") @db.Uuid
  campusId       String            @map("campus_id") @db.Uuid
  bookCopyId     String            @map("book_copy_id") @db.Uuid
  bookId         String            @map("book_id") @db.Uuid // denormalised from the copy for title-level reports
  memberType     LibraryMemberType @map("member_type")
  studentId      String?           @map("student_id") @db.Uuid // set when memberType is STUDENT
  staffId        String?           @map("staff_id") @db.Uuid // set when memberType is STAFF
  issueDate      DateTime          @map("issue_date") @db.Date
  dueDate        DateTime          @map("due_date") @db.Date
  returnDate     DateTime?         @map("return_date") @db.Date
  renewalCount   Int               @default(0) @map("renewal_count") @db.SmallInt
  lastRenewedOn  DateTime?         @map("last_renewed_on") @db.Date
  status         BookIssueStatus   @default(ISSUED)
  fineAmount     Decimal           @default(0) @map("fine_amount") @db.Decimal(12, 2) // overdue / damage / lost-book charge
  finePaid       Decimal           @default(0) @map("fine_paid") @db.Decimal(12, 2)
  fineWaived     Boolean           @default(false) @map("fine_waived")
  currency       String            @db.Char(3)
  fineInvoiceId  String?           @map("fine_invoice_id") @db.Uuid // fee invoice that carries the fine for a student
  finePaymentId  String?           @map("fine_payment_id") @db.Uuid // Payment (purpose LIBRARY_FINE) when the fine is paid at the counter, e.g. by staff
  remarks        String?           @db.VarChar(255)
  issuedById     String?           @map("issued_by_id") @db.Uuid // User id (audit only, no FK)
  returnedToId   String?           @map("returned_to_id") @db.Uuid // User id (audit only, no FK)
  createdAt      DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization     @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus           @relation(fields: [campusId], references: [id], onDelete: Restrict)
  bookCopy     BookCopy         @relation(fields: [bookCopyId], references: [id], onDelete: Restrict)
  book         Book             @relation(fields: [bookId], references: [id], onDelete: Restrict)
  student      Student?         @relation(fields: [studentId], references: [id], onDelete: Restrict)
  staff        Staff?           @relation(fields: [staffId], references: [id], onDelete: Restrict)
  fineInvoice  FeeInvoice?      @relation(fields: [fineInvoiceId], references: [id], onDelete: SetNull)
  finePayment  Payment?         @relation(fields: [finePaymentId], references: [id], onDelete: SetNull)
  reservation  BookReservation?

  @@index([organizationId, bookCopyId, status])
  @@index([organizationId, studentId, status])
  @@index([organizationId, staffId, status])
  @@index([organizationId, campusId, status, dueDate]) // overdue list
  @@map("book_issues")
}

// Hold placed on a title by a member (Student Portal / librarian); served in queue order by reservedAt.
model BookReservation {
  id             String                @id @default(uuid()) @db.Uuid
  organizationId String                @map("organization_id") @db.Uuid
  campusId       String                @map("campus_id") @db.Uuid
  bookId         String                @map("book_id") @db.Uuid
  bookCopyId     String?               @map("book_copy_id") @db.Uuid // copy set aside when READY_FOR_PICKUP (BookCopy.status = RESERVED)
  memberType     LibraryMemberType     @map("member_type")
  studentId      String?               @map("student_id") @db.Uuid
  staffId        String?               @map("staff_id") @db.Uuid
  status         BookReservationStatus @default(WAITING)
  reservedAt     DateTime              @default(now()) @map("reserved_at") @db.Timestamptz(6)
  readyAt        DateTime?             @map("ready_at") @db.Timestamptz(6)
  expiresAt      DateTime?             @map("expires_at") @db.Timestamptz(6) // pickup deadline
  bookIssueId    String?               @unique @map("book_issue_id") @db.Uuid // loan that fulfilled the hold
  createdAt      DateTime              @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime              @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus       @relation(fields: [campusId], references: [id], onDelete: Restrict)
  book         Book         @relation(fields: [bookId], references: [id], onDelete: Restrict)
  bookCopy     BookCopy?    @relation(fields: [bookCopyId], references: [id], onDelete: SetNull)
  student      Student?     @relation(fields: [studentId], references: [id], onDelete: Restrict)
  staff        Staff?       @relation(fields: [staffId], references: [id], onDelete: Restrict)
  bookIssue    BookIssue?   @relation(fields: [bookIssueId], references: [id], onDelete: SetNull)

  @@index([organizationId, bookId, status, reservedAt]) // queue of a title
  @@index([organizationId, studentId, status])
  @@index([organizationId, staffId, status])
  @@index([organizationId, campusId, status, expiresAt]) // expiry worker
  @@map("book_reservations")
}

// ---------------------------------------------------------------- Inventory

// Group of inventory items: Stationery, IT Equipment, Furniture, Sports.
model InventoryCategory {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  name           String       @db.VarChar(100)
  code           String?      @db.VarChar(30)
  description    String?      @db.VarChar(255)
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  items        InventoryItem[]

  @@unique([organizationId, name])
  @@index([organizationId, status])
  @@map("inventory_categories")
}

// Stock-keeping item of one campus store with current stock and reorder level.
model InventoryItem {
  id             String            @id @default(uuid()) @db.Uuid
  organizationId String            @map("organization_id") @db.Uuid
  campusId       String            @map("campus_id") @db.Uuid // stock is kept per campus store
  categoryId     String?           @map("category_id") @db.Uuid
  name           String            @db.VarChar(150)
  sku            String            @db.VarChar(40)
  itemType       InventoryItemType @default(CONSUMABLE) @map("item_type")
  unit           String            @db.VarChar(20) // pcs, box, kg, litre
  description    String?           @db.VarChar(500)
  currentStock   Decimal           @default(0) @map("current_stock") @db.Decimal(12, 3) // equals balanceAfter of the latest StockTransaction
  reorderLevel   Decimal?          @map("reorder_level") @db.Decimal(12, 3) // low-stock alert when currentStock falls to this level
  unitCost       Decimal?          @map("unit_cost") @db.Decimal(12, 2) // latest purchase cost
  sellingPrice   Decimal?          @map("selling_price") @db.Decimal(12, 2) // price charged to students for SALE rows
  currency       String?           @db.Char(3)
  feeHeadId      String?           @map("fee_head_id") @db.Uuid // fee head (UNIFORM / BOOKS) used when a sale is invoiced
  location       String?           @db.VarChar(100) // store room / rack
  status         RecordStatus      @default(ACTIVE)
  createdAt      DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?         @map("deleted_at") @db.Timestamptz(6)

  organization       Organization        @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus             Campus              @relation(fields: [campusId], references: [id], onDelete: Restrict)
  category           InventoryCategory?  @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  feeHead            FeeHead?            @relation(fields: [feeHeadId], references: [id], onDelete: SetNull)
  purchaseOrderItems PurchaseOrderItem[]
  stockTransactions  StockTransaction[]
  assetAssignments   AssetAssignment[]

  @@unique([organizationId, campusId, sku])
  @@index([organizationId, campusId, categoryId, status])
  @@index([organizationId, name])
  @@map("inventory_items")
}

// Supplier of goods and services (inventory, books, vehicle maintenance).
model Vendor {
  id                   String       @id @default(uuid()) @db.Uuid
  organizationId       String       @map("organization_id") @db.Uuid
  name                 String       @db.VarChar(150)
  code                 String       @db.VarChar(30)
  contactPerson        String?      @map("contact_person") @db.VarChar(120)
  phone                String?      @db.VarChar(20)
  email                String?      @db.VarChar(255)
  addressLine1         String?      @map("address_line1") @db.VarChar(200)
  city                 String?      @db.VarChar(100)
  state                String?      @db.VarChar(100)
  postalCode           String?      @map("postal_code") @db.VarChar(20)
  countryCode          String?      @map("country_code") @db.Char(2)
  stateCode            String?      @map("state_code") @db.VarChar(10) // GST state code; decides CGST+SGST vs IGST on purchases
  taxId                String?      @map("tax_id") @db.VarChar(30) // GSTIN / ABN / TRN
  taxIdType            String?      @map("tax_id_type") @db.VarChar(10) // GSTIN | ABN | TRN | EIN
  panEncrypted         String?      @map("pan_encrypted") @db.Text // AES-256-GCM; needed for TDS u/s 194C / 194J
  bankDetailsEncrypted String?      @map("bank_details_encrypted") @db.Text // AES-256-GCM ciphertext of { accountName, accountNo, ifsc, bankName }
  bankAccountLast4     String?      @map("bank_account_last4") @db.VarChar(4) // safe to display
  paymentTerms         String?      @map("payment_terms") @db.VarChar(100) // e.g. Net 30
  notes                String?      @db.VarChar(500)
  status               RecordStatus @default(ACTIVE)
  createdAt            DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt            DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization        Organization         @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  purchaseOrders      PurchaseOrder[]
  vehicleMaintenances VehicleMaintenance[]

  @@unique([organizationId, code])
  @@index([organizationId, status, name])
  @@map("vendors")
}

// Order placed with a vendor; receiving goods creates StockTransaction IN rows.
model PurchaseOrder {
  id              String              @id @default(uuid()) @db.Uuid
  organizationId  String              @map("organization_id") @db.Uuid
  campusId        String              @map("campus_id") @db.Uuid
  vendorId        String              @map("vendor_id") @db.Uuid
  poNumber        String              @map("po_number") @db.VarChar(40) // from NumberSequence PURCHASE_ORDER_NO
  status          PurchaseOrderStatus @default(DRAFT)
  orderDate       DateTime            @map("order_date") @db.Date
  expectedDate    DateTime?           @map("expected_date") @db.Date
  receivedDate    DateTime?           @map("received_date") @db.Date // when fully received
  currency        String              @db.Char(3)
  subtotal        Decimal             @default(0) @db.Decimal(12, 2)
  taxTotal        Decimal             @default(0) @map("tax_total") @db.Decimal(12, 2)
  taxBreakdown    Json?               @map("tax_breakdown") // [{ code: CGST|SGST|IGST|GST|VAT, percent, amount }] for input-tax records
  total           Decimal             @default(0) @db.Decimal(12, 2)
  vendorTaxId     String?             @map("vendor_tax_id") @db.VarChar(30) // vendor GSTIN frozen at order time
  vendorInvoiceNo String?             @map("vendor_invoice_no") @db.VarChar(60)
  notes           String?             @db.VarChar(500)
  requestedById   String?             @map("requested_by_id") @db.Uuid // User id (audit only, no FK)
  approvedById    String?             @map("approved_by_id") @db.Uuid
  approvedAt      DateTime?           @map("approved_at") @db.Timestamptz(6)
  createdAt       DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt       DateTime?           @map("deleted_at") @db.Timestamptz(6)

  organization Organization        @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus              @relation(fields: [campusId], references: [id], onDelete: Restrict)
  vendor       Vendor              @relation(fields: [vendorId], references: [id], onDelete: Restrict)
  approvedBy   User?               @relation(fields: [approvedById], references: [id], onDelete: SetNull)
  items        PurchaseOrderItem[]

  @@unique([organizationId, poNumber])
  @@index([organizationId, campusId, status, orderDate])
  @@index([organizationId, vendorId])
  @@map("purchase_orders")
}

// One line of a purchase order.
model PurchaseOrderItem {
  id               String   @id @default(uuid()) @db.Uuid
  organizationId   String   @map("organization_id") @db.Uuid
  purchaseOrderId  String   @map("purchase_order_id") @db.Uuid
  itemId           String   @map("item_id") @db.Uuid
  description      String?  @db.VarChar(255)
  quantityOrdered  Decimal  @map("quantity_ordered") @db.Decimal(12, 3)
  quantityReceived Decimal  @default(0) @map("quantity_received") @db.Decimal(12, 3)
  unitPrice        Decimal  @map("unit_price") @db.Decimal(12, 2)
  taxCode          String?  @map("tax_code") @db.VarChar(20) // HSN
  taxRate          Decimal  @default(0) @map("tax_rate") @db.Decimal(5, 2)
  taxAmount        Decimal  @default(0) @map("tax_amount") @db.Decimal(12, 2)
  lineTotal        Decimal  @map("line_total") @db.Decimal(12, 2)
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization      Organization       @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  purchaseOrder     PurchaseOrder      @relation(fields: [purchaseOrderId], references: [id], onDelete: Restrict) // purchase orders are soft-deleted; posted stock rows keep their PO reference
  item              InventoryItem      @relation(fields: [itemId], references: [id], onDelete: Restrict)
  stockTransactions StockTransaction[]

  @@index([organizationId, purchaseOrderId])
  @@index([organizationId, itemId])
  @@map("purchase_order_items")
}

// Stock ledger row of an item. Append-only: no updatedAt / deletedAt; corrections are new ADJUST rows.
model StockTransaction {
  id                  String               @id @default(uuid()) @db.Uuid
  organizationId      String               @map("organization_id") @db.Uuid
  campusId            String               @map("campus_id") @db.Uuid
  itemId              String               @map("item_id") @db.Uuid
  transactionType     StockTransactionType @map("transaction_type")
  quantity            Decimal              @db.Decimal(12, 3) // always positive, except ADJUST which may be negative
  balanceAfter        Decimal              @map("balance_after") @db.Decimal(12, 3) // item stock after this row
  unitCost            Decimal?             @map("unit_cost") @db.Decimal(12, 2)
  unitPrice           Decimal?             @map("unit_price") @db.Decimal(12, 2) // selling price for SALE rows
  currency            String?              @db.Char(3)
  feeInvoiceId        String?              @map("fee_invoice_id") @db.Uuid // SALE rows: invoice that charges the student
  counterCampusId     String?              @map("counter_campus_id") @db.Uuid // other side of a TRANSFER_OUT / TRANSFER_IN
  transferRef         String?              @map("transfer_ref") @db.Uuid // pairs the OUT and IN rows of one transfer
  transactionDate     DateTime             @map("transaction_date") @db.Date
  purchaseOrderItemId String?              @map("purchase_order_item_id") @db.Uuid // IN rows from a purchase order
  staffId             String?              @map("staff_id") @db.Uuid // ISSUE_TO_STAFF / RETURN
  studentId           String?              @map("student_id") @db.Uuid // ISSUE_TO_STUDENT / RETURN
  reference           String?              @db.VarChar(100) // bill number, issue slip number
  reason              String?              @db.VarChar(255)
  createdById         String?              @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt           DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)

  organization      Organization       @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus            Campus             @relation("StockTransactionCampus", fields: [campusId], references: [id], onDelete: Restrict)
  counterCampus     Campus?            @relation("StockTransferCounterCampus", fields: [counterCampusId], references: [id], onDelete: Restrict)
  item              InventoryItem      @relation(fields: [itemId], references: [id], onDelete: Restrict)
  purchaseOrderItem PurchaseOrderItem? @relation(fields: [purchaseOrderItemId], references: [id], onDelete: Restrict) // the ledger is append-only: never blank the PO reference
  feeInvoice        FeeInvoice?        @relation(fields: [feeInvoiceId], references: [id], onDelete: SetNull)
  staff             Staff?             @relation(fields: [staffId], references: [id], onDelete: SetNull)
  student           Student?           @relation(fields: [studentId], references: [id], onDelete: SetNull)

  @@index([organizationId, feeInvoiceId])
  @@index([organizationId, transferRef])
  @@index([organizationId, itemId, createdAt])
  @@index([organizationId, campusId, transactionType, transactionDate])
  @@index([organizationId, staffId])
  @@index([organizationId, studentId])
  @@map("stock_transactions")
}

// A returnable asset (laptop, projector, lab kit) handed to a staff member, student or room.
model AssetAssignment {
  id                 String                @id @default(uuid()) @db.Uuid
  organizationId     String                @map("organization_id") @db.Uuid
  campusId           String                @map("campus_id") @db.Uuid
  itemId             String                @map("item_id") @db.Uuid
  assetTag           String?               @map("asset_tag") @db.VarChar(50) // serial number / asset sticker
  staffId            String?               @map("staff_id") @db.Uuid
  studentId          String?               @map("student_id") @db.Uuid
  roomId             String?               @map("room_id") @db.Uuid // asset installed in a room
  quantity           Int                   @default(1)
  assignedDate       DateTime              @map("assigned_date") @db.Date
  expectedReturnDate DateTime?             @map("expected_return_date") @db.Date
  returnedDate       DateTime?             @map("returned_date") @db.Date
  status             AssetAssignmentStatus @default(ASSIGNED)
  conditionOnIssue   String?               @map("condition_on_issue") @db.VarChar(100)
  conditionOnReturn  String?               @map("condition_on_return") @db.VarChar(100)
  notes              String?               @db.VarChar(500)
  assignedById       String?               @map("assigned_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt          DateTime              @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime              @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt          DateTime?             @map("deleted_at") @db.Timestamptz(6)

  organization Organization  @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus        @relation(fields: [campusId], references: [id], onDelete: Restrict)
  item         InventoryItem @relation(fields: [itemId], references: [id], onDelete: Restrict)
  staff        Staff?        @relation(fields: [staffId], references: [id], onDelete: Restrict)
  student      Student?      @relation(fields: [studentId], references: [id], onDelete: Restrict)
  room         Room?         @relation(fields: [roomId], references: [id], onDelete: SetNull)

  @@index([organizationId, itemId, status])
  @@index([organizationId, staffId, status])
  @@index([organizationId, studentId, status])
  @@index([organizationId, campusId, status])
  @@map("asset_assignments")
}

// ---------------------------------------------------------------- Transport

// School bus / van with compliance expiry dates and GPS device.
model Vehicle {
  id              String        @id @default(uuid()) @db.Uuid
  organizationId  String        @map("organization_id") @db.Uuid
  campusId        String        @map("campus_id") @db.Uuid
  registrationNo  String        @map("registration_no") @db.VarChar(20) // e.g. UP32 AB 1234
  vehicleType     VehicleType   @default(BUS) @map("vehicle_type")
  make            String?       @db.VarChar(60)
  model           String?       @db.VarChar(60)
  manufactureYear Int?          @map("manufacture_year") @db.SmallInt
  capacity        Int           @db.SmallInt // seats for students
  fuelType        String?       @map("fuel_type") @db.VarChar(20)
  isContracted    Boolean       @default(false) @map("is_contracted") // hired from a transport contractor
  contractorName  String?       @map("contractor_name") @db.VarChar(150)
  insuranceExpiry DateTime?     @map("insurance_expiry") @db.Date
  fitnessExpiry   DateTime?     @map("fitness_expiry") @db.Date
  pucExpiry       DateTime?     @map("puc_expiry") @db.Date // pollution-under-control certificate
  permitExpiry    DateTime?     @map("permit_expiry") @db.Date
  gpsDeviceId     String?       @map("gps_device_id") @db.VarChar(60)
  gpsProvider     String?       @map("gps_provider") @db.VarChar(60)
  driverId        String?       @map("driver_id") @db.Uuid // default driver (Staff)
  attendantId     String?       @map("attendant_id") @db.Uuid // default attendant / conductor (Staff)
  odometerKm      Int?          @map("odometer_km")
  status          VehicleStatus @default(ACTIVE)
  createdAt       DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime      @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt       DateTime?     @map("deleted_at") @db.Timestamptz(6)

  organization Organization         @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus               @relation(fields: [campusId], references: [id], onDelete: Restrict)
  driver       Staff?               @relation("VehicleDriver", fields: [driverId], references: [id], onDelete: SetNull)
  attendant    Staff?               @relation("VehicleAttendant", fields: [attendantId], references: [id], onDelete: SetNull)
  routes       TransportRoute[]
  trips        VehicleTrip[]
  maintenances VehicleMaintenance[]

  @@unique([organizationId, registrationNo])
  @@index([organizationId, campusId, status])
  @@index([organizationId, insuranceExpiry]) // expiry alerts
  @@map("vehicles")
}

// Driving licence and verification details of a staff member who drives (driver = Staff + this profile).
model DriverProfile {
  id                 String    @id @default(uuid()) @db.Uuid
  organizationId     String    @map("organization_id") @db.Uuid
  staffId            String    @unique @map("staff_id") @db.Uuid
  licenseNoEncrypted String    @map("license_no_encrypted") @db.Text // AES-256-GCM ciphertext
  licenseLast4       String?   @map("license_last4") @db.VarChar(4) // safe to display
  licenseType        String?   @map("license_type") @db.VarChar(30) // e.g. HMV, LMV, transport endorsement
  licenseExpiry      DateTime  @map("license_expiry") @db.Date
  badgeNo            String?   @map("badge_no") @db.VarChar(30)
  policeVerifiedOn   DateTime? @map("police_verified_on") @db.Date
  medicalCheckOn     DateTime? @map("medical_check_on") @db.Date
  experienceYears    Int?      @map("experience_years") @db.SmallInt
  createdAt          DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  staff        Staff        @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@index([organizationId, licenseExpiry]) // expiry alerts
  @@map("driver_profiles")
}

// Bus route of a campus with its usual vehicle.
model TransportRoute {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  campusId       String       @map("campus_id") @db.Uuid
  vehicleId      String?      @map("vehicle_id") @db.Uuid
  name           String       @db.VarChar(100) // Route 3 - Gomti Nagar
  code           String       @db.VarChar(20)
  shift          Shift        @default(FULL_DAY)
  startPoint     String?      @map("start_point") @db.VarChar(150)
  endPoint       String?      @map("end_point") @db.VarChar(150)
  distanceKm     Decimal?     @map("distance_km") @db.Decimal(6, 2)
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization Organization          @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus                @relation(fields: [campusId], references: [id], onDelete: Restrict)
  vehicle      Vehicle?              @relation(fields: [vehicleId], references: [id], onDelete: SetNull)
  stops        RouteStop[]
  assignments  TransportAssignment[]
  trips        VehicleTrip[]

  @@unique([organizationId, campusId, code])
  @@index([organizationId, campusId, status])
  @@index([organizationId, vehicleId])
  @@map("transport_routes")
}

// Stop on a route with its order, timings and monthly transport fee.
model RouteStop {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  routeId        String       @map("route_id") @db.Uuid
  name           String       @db.VarChar(120)
  sequence       Int          @db.SmallInt // order from the first pickup
  pickupTime     String?      @map("pickup_time") @db.VarChar(5) // HH:mm in the campus timezone
  dropTime       String?      @map("drop_time") @db.VarChar(5) // HH:mm in the campus timezone
  landmark       String?      @db.VarChar(200)
  latitude       Decimal?     @db.Decimal(9, 6)
  longitude      Decimal?     @db.Decimal(9, 6)
  fee            Decimal      @default(0) @db.Decimal(12, 2) // monthly transport fee from this stop
  currency       String       @db.Char(3)
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization         Organization          @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  route                TransportRoute        @relation(fields: [routeId], references: [id], onDelete: Cascade)
  pickupAssignments    TransportAssignment[] @relation("TransportPickupStop")
  dropAssignments      TransportAssignment[] @relation("TransportDropStop")
  transportAttendances TransportAttendance[]

  @@unique([organizationId, routeId, sequence])
  @@index([organizationId, routeId, status])
  @@map("route_stops")
}

// A student's use of a route and stop(s) for an academic year. The invoice worker bills monthlyFee under feeHeadId
// per billingFrequency, writes FeeInvoiceItem.transportAssignmentId + period, and advances billedUpTo (no double billing after a stop change).
// One ACTIVE assignment per student per year is enforced by a partial unique index in the SQL migration:
//   uq_transport_assignment_active (organization_id, student_id, academic_year_id) WHERE status = 'ACTIVE' AND deleted_at IS NULL
model TransportAssignment {
  id               String                    @id @default(uuid()) @db.Uuid
  organizationId   String                    @map("organization_id") @db.Uuid
  campusId         String                    @map("campus_id") @db.Uuid
  studentId        String                    @map("student_id") @db.Uuid
  academicYearId   String                    @map("academic_year_id") @db.Uuid
  routeId          String                    @map("route_id") @db.Uuid
  pickupStopId     String?                   @map("pickup_stop_id") @db.Uuid // null when serviceType is DROP_ONLY
  dropStopId       String?                   @map("drop_stop_id") @db.Uuid // null when serviceType is PICKUP_ONLY
  serviceType      TransportServiceType      @default(BOTH) @map("service_type")
  startDate        DateTime                  @map("start_date") @db.Date
  endDate          DateTime?                 @map("end_date") @db.Date
  monthlyFee       Decimal                   @map("monthly_fee") @db.Decimal(12, 2) // copied from the stop; may be overridden
  currency         String                    @db.Char(3)
  feeHeadId        String?                   @map("fee_head_id") @db.Uuid // TRANSPORT fee head used on invoices
  billingFrequency FeeFrequency              @default(MONTHLY) @map("billing_frequency")
  billedUpTo       DateTime?                 @map("billed_up_to") @db.Date // last period already invoiced
  status           TransportAssignmentStatus @default(ACTIVE)
  notes            String?                   @db.VarChar(255)
  createdById      String?                   @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt        DateTime                  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime                  @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt        DateTime?                 @map("deleted_at") @db.Timestamptz(6)

  organization    Organization     @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus          Campus           @relation(fields: [campusId], references: [id], onDelete: Restrict)
  student         Student          @relation(fields: [studentId], references: [id], onDelete: Restrict)
  academicYear    AcademicYear     @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  route           TransportRoute   @relation(fields: [routeId], references: [id], onDelete: Restrict)
  pickupStop      RouteStop?       @relation("TransportPickupStop", fields: [pickupStopId], references: [id], onDelete: Restrict)
  dropStop        RouteStop?       @relation("TransportDropStop", fields: [dropStopId], references: [id], onDelete: Restrict)
  feeHead         FeeHead?         @relation(fields: [feeHeadId], references: [id], onDelete: Restrict)
  feeInvoiceItems FeeInvoiceItem[]

  @@index([organizationId, studentId, academicYearId, status])
  @@index([organizationId, routeId, status])
  @@index([organizationId, campusId, academicYearId, status])
  @@map("transport_assignments")
}

// Daily trip log of a vehicle on a route (morning pickup, afternoon drop).
model VehicleTrip {
  id              String     @id @default(uuid()) @db.Uuid
  organizationId  String     @map("organization_id") @db.Uuid
  campusId        String     @map("campus_id") @db.Uuid
  vehicleId       String     @map("vehicle_id") @db.Uuid
  routeId         String?    @map("route_id") @db.Uuid // null for SPECIAL trips
  driverId        String?    @map("driver_id") @db.Uuid // Staff who drove
  attendantId     String?    @map("attendant_id") @db.Uuid // Staff attendant on board
  tripDate        DateTime   @map("trip_date") @db.Date
  tripType        TripType   @map("trip_type")
  status          TripStatus @default(SCHEDULED)
  startedAt       DateTime?  @map("started_at") @db.Timestamptz(6)
  endedAt         DateTime?  @map("ended_at") @db.Timestamptz(6)
  startOdometerKm Int?       @map("start_odometer_km")
  endOdometerKm   Int?       @map("end_odometer_km")
  studentsBoarded Int?       @map("students_boarded")
  fuelLitres      Decimal?   @map("fuel_litres") @db.Decimal(6, 2)
  incidentNotes   String?    @map("incident_notes") @db.Text // delays, breakdowns, incidents
  createdAt       DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization          @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus                @relation(fields: [campusId], references: [id], onDelete: Restrict)
  vehicle      Vehicle               @relation(fields: [vehicleId], references: [id], onDelete: Restrict)
  route        TransportRoute?       @relation(fields: [routeId], references: [id], onDelete: SetNull)
  driver       Staff?                @relation("VehicleTripDriver", fields: [driverId], references: [id], onDelete: SetNull)
  attendant    Staff?                @relation("VehicleTripAttendant", fields: [attendantId], references: [id], onDelete: SetNull)
  boardings    TransportAttendance[]

  @@unique([organizationId, vehicleId, routeId, tripDate, tripType])
  @@index([organizationId, campusId, tripDate])
  @@index([organizationId, driverId, tripDate])
  @@map("vehicle_trips")
}

// Boarding / drop record of one student on one trip: parent alert ("Aarav boarded the bus at 7:12") and safety register.
model TransportAttendance {
  id             String                  @id @default(uuid()) @db.Uuid
  organizationId String                  @map("organization_id") @db.Uuid
  campusId       String                  @map("campus_id") @db.Uuid
  tripId         String                  @map("trip_id") @db.Uuid
  studentId      String                  @map("student_id") @db.Uuid
  stopId         String?                 @map("stop_id") @db.Uuid
  status         TransportBoardingStatus
  boardedAt      DateTime?               @map("boarded_at") @db.Timestamptz(6)
  droppedAt      DateTime?               @map("dropped_at") @db.Timestamptz(6)
  markedById     String?                 @map("marked_by_id") @db.Uuid // User id of the attendant / driver (audit only, no FK)
  notifiedAt     DateTime?               @map("notified_at") @db.Timestamptz(6) // alert sent to the parent
  createdAt      DateTime                @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime                @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus       @relation(fields: [campusId], references: [id], onDelete: Restrict)
  trip         VehicleTrip  @relation(fields: [tripId], references: [id], onDelete: Restrict)
  student      Student      @relation(fields: [studentId], references: [id], onDelete: Restrict)
  stop         RouteStop?   @relation(fields: [stopId], references: [id], onDelete: SetNull)

  @@unique([organizationId, tripId, studentId])
  @@index([organizationId, studentId, createdAt])
  @@index([organizationId, campusId, createdAt])
  @@map("transport_attendance")
}

// Service, repair or compliance renewal of a vehicle with cost and next due date.
model VehicleMaintenance {
  id              String          @id @default(uuid()) @db.Uuid
  organizationId  String          @map("organization_id") @db.Uuid
  campusId        String          @map("campus_id") @db.Uuid
  vehicleId       String          @map("vehicle_id") @db.Uuid
  vendorId        String?         @map("vendor_id") @db.Uuid // workshop / insurer
  maintenanceType MaintenanceType @map("maintenance_type")
  description     String?         @db.VarChar(500)
  serviceDate     DateTime        @map("service_date") @db.Date
  nextDueDate     DateTime?       @map("next_due_date") @db.Date
  odometerKm      Int?            @map("odometer_km")
  cost            Decimal         @default(0) @db.Decimal(12, 2)
  currency        String          @db.Char(3)
  billNo          String?         @map("bill_no") @db.VarChar(60)
  billFileId      String?         @map("bill_file_id") @db.Uuid
  createdById     String?         @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt       DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt       DateTime?       @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus       @relation(fields: [campusId], references: [id], onDelete: Restrict)
  vehicle      Vehicle      @relation(fields: [vehicleId], references: [id], onDelete: Restrict)
  vendor       Vendor?      @relation(fields: [vendorId], references: [id], onDelete: SetNull)
  billFile     FileAsset?   @relation(fields: [billFileId], references: [id], onDelete: SetNull)

  @@index([organizationId, vehicleId, serviceDate])
  @@index([organizationId, campusId, nextDueDate])
  @@map("vehicle_maintenances")
}

// ---------------------------------------------------------------- Hostel

// Hostel building of a campus with its warden.
model Hostel {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  campusId       String       @map("campus_id") @db.Uuid
  name           String       @db.VarChar(100)
  code           String       @db.VarChar(20)
  hostelType     HostelType   @map("hostel_type")
  wardenId       String?      @map("warden_id") @db.Uuid // Staff
  phone          String?      @db.VarChar(20)
  address        String?      @db.VarChar(300)
  capacity       Int          @default(0) // cached number of beds
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization        Organization         @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus              Campus               @relation(fields: [campusId], references: [id], onDelete: Restrict)
  warden              Staff?               @relation(fields: [wardenId], references: [id], onDelete: SetNull)
  rooms               HostelRoom[]
  beds                HostelBed[]
  allocations         HostelAllocation[]
  attendances         HostelAttendance[]
  visitorLogs         HostelVisitorLog[]
  hostelLeaveRequests HostelLeaveRequest[]

  @@unique([organizationId, campusId, code])
  @@index([organizationId, campusId, status])
  @@map("hostels")
}

// Room of a hostel with floor, type, bed capacity and monthly rent per bed.
model HostelRoom {
  id             String         @id @default(uuid()) @db.Uuid
  organizationId String         @map("organization_id") @db.Uuid
  hostelId       String         @map("hostel_id") @db.Uuid
  roomNo         String         @map("room_no") @db.VarChar(20)
  floor          String?        @db.VarChar(20)
  roomType       HostelRoomType @default(DOUBLE) @map("room_type")
  capacity       Int            @db.SmallInt // number of beds
  rent           Decimal        @default(0) @db.Decimal(12, 2) // monthly rent per bed
  currency       String         @db.Char(3)
  amenities      String[] // AC, attached bath, balcony
  status         RecordStatus   @default(ACTIVE)
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?      @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  hostel       Hostel       @relation(fields: [hostelId], references: [id], onDelete: Restrict)
  beds         HostelBed[]

  @@unique([organizationId, hostelId, roomNo])
  @@index([organizationId, hostelId, status])
  @@map("hostel_rooms")
}

// One bed in a hostel room; the unit that is allocated to a student.
model HostelBed {
  id             String          @id @default(uuid()) @db.Uuid
  organizationId String          @map("organization_id") @db.Uuid
  hostelId       String          @map("hostel_id") @db.Uuid // denormalised from the room for vacancy counts
  roomId         String          @map("room_id") @db.Uuid
  bedNo          String          @map("bed_no") @db.VarChar(10)
  status         HostelBedStatus @default(AVAILABLE)
  createdAt      DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?       @map("deleted_at") @db.Timestamptz(6)

  organization Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  hostel       Hostel             @relation(fields: [hostelId], references: [id], onDelete: Restrict)
  room         HostelRoom         @relation(fields: [roomId], references: [id], onDelete: Restrict)
  allocations  HostelAllocation[]

  @@unique([organizationId, roomId, bedNo])
  @@index([organizationId, hostelId, status])
  @@map("hostel_beds")
}

// A student's stay in a hostel bed from a date to a date. One ACTIVE allocation per bed (service-layer rule + partial unique index).
// The invoice worker bills monthlyRent under feeHeadId per billingFrequency, writes FeeInvoiceItem.hostelAllocationId + period, and advances billedUpTo.
model HostelAllocation {
  id               String                 @id @default(uuid()) @db.Uuid
  organizationId   String                 @map("organization_id") @db.Uuid
  campusId         String                 @map("campus_id") @db.Uuid
  hostelId         String                 @map("hostel_id") @db.Uuid
  bedId            String                 @map("bed_id") @db.Uuid
  studentId        String                 @map("student_id") @db.Uuid
  academicYearId   String                 @map("academic_year_id") @db.Uuid
  fromDate         DateTime               @map("from_date") @db.Date
  toDate           DateTime?              @map("to_date") @db.Date // planned or actual end of stay
  status           HostelAllocationStatus @default(ACTIVE)
  monthlyRent      Decimal                @map("monthly_rent") @db.Decimal(12, 2) // copied from the room; may be overridden
  depositAmount    Decimal                @default(0) @map("deposit_amount") @db.Decimal(12, 2)
  currency         String                 @db.Char(3)
  feeHeadId        String?                @map("fee_head_id") @db.Uuid // HOSTEL fee head used on invoices
  billingFrequency FeeFrequency           @default(MONTHLY) @map("billing_frequency")
  billedUpTo       DateTime?              @map("billed_up_to") @db.Date // last period already invoiced
  vacatedOn        DateTime?              @map("vacated_on") @db.Date
  vacateReason     String?                @map("vacate_reason") @db.VarChar(255)
  notes            String?                @db.VarChar(500)
  allocatedById    String?                @map("allocated_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt        DateTime               @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime               @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt        DateTime?              @map("deleted_at") @db.Timestamptz(6)

  organization        Organization         @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus              Campus               @relation(fields: [campusId], references: [id], onDelete: Restrict)
  hostel              Hostel               @relation(fields: [hostelId], references: [id], onDelete: Restrict)
  bed                 HostelBed            @relation(fields: [bedId], references: [id], onDelete: Restrict)
  student             Student              @relation(fields: [studentId], references: [id], onDelete: Restrict)
  academicYear        AcademicYear         @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  feeHead             FeeHead?             @relation(fields: [feeHeadId], references: [id], onDelete: Restrict)
  feeInvoiceItems     FeeInvoiceItem[]
  hostelLeaveRequests HostelLeaveRequest[]

  @@index([organizationId, bedId, status])
  @@index([organizationId, studentId, status])
  @@index([organizationId, hostelId, academicYearId, status])
  @@map("hostel_allocations")
}

// Night roll call of one hostel resident on one date.
model HostelAttendance {
  id             String                 @id @default(uuid()) @db.Uuid
  organizationId String                 @map("organization_id") @db.Uuid
  campusId       String                 @map("campus_id") @db.Uuid
  hostelId       String                 @map("hostel_id") @db.Uuid
  studentId      String                 @map("student_id") @db.Uuid
  date           DateTime               @db.Date
  status         HostelAttendanceStatus
  leaveRequestId String?                @map("leave_request_id") @db.Uuid // approved out-pass that produced status ON_LEAVE
  markedAt       DateTime?              @map("marked_at") @db.Timestamptz(6)
  remark         String?                @db.VarChar(255)
  markedById     String?                @map("marked_by_id") @db.Uuid // User id (audit only, no FK)
  notifiedAt     DateTime?              @map("notified_at") @db.Timestamptz(6) // absence alert sent to the parent
  createdAt      DateTime               @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime               @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization        @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus              @relation(fields: [campusId], references: [id], onDelete: Restrict)
  hostel       Hostel              @relation(fields: [hostelId], references: [id], onDelete: Restrict)
  student      Student             @relation(fields: [studentId], references: [id], onDelete: Restrict)
  leaveRequest HostelLeaveRequest? @relation(fields: [leaveRequestId], references: [id], onDelete: SetNull)

  @@unique([organizationId, hostelId, studentId, date])
  @@index([organizationId, campusId, date, status]) // nightly roll-call dashboard per campus
  @@index([organizationId, hostelId, date, status])
  @@index([organizationId, studentId, date])
  @@map("hostel_attendance")
}

// Visitor entry at the hostel gate: who met which resident, when they came and left.
model HostelVisitorLog {
  id             String    @id @default(uuid()) @db.Uuid
  organizationId String    @map("organization_id") @db.Uuid
  campusId       String    @map("campus_id") @db.Uuid
  hostelId       String    @map("hostel_id") @db.Uuid
  studentId      String    @map("student_id") @db.Uuid // resident visited
  guardianId     String?   @map("guardian_id") @db.Uuid // set when the visitor is a registered guardian
  visitorName    String    @map("visitor_name") @db.VarChar(160)
  relation       String?   @db.VarChar(40) // relation to the student as stated at the gate
  phone          String?   @db.VarChar(20)
  idProofType    String?   @map("id_proof_type") @db.VarChar(40)
  idProofLast4   String?   @map("id_proof_last4") @db.VarChar(4) // only the last 4 characters are kept
  purpose        String?   @db.VarChar(255)
  checkInAt      DateTime  @map("check_in_at") @db.Timestamptz(6)
  checkOutAt     DateTime? @map("check_out_at") @db.Timestamptz(6)
  approvedById   String?   @map("approved_by_id") @db.Uuid // User id of the warden (audit only, no FK)
  notes          String?   @db.VarChar(500)
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  hostel       Hostel       @relation(fields: [hostelId], references: [id], onDelete: Restrict)
  student      Student      @relation(fields: [studentId], references: [id], onDelete: Restrict)
  guardian     Guardian?    @relation(fields: [guardianId], references: [id], onDelete: SetNull)
  campus       Campus       @relation(fields: [campusId], references: [id], onDelete: Restrict)

  @@index([organizationId, campusId, checkInAt])
  @@index([organizationId, hostelId, checkInAt])
  @@index([organizationId, studentId, checkInAt])
  @@map("hostel_visitor_logs")
}

// Out-pass / leave of a hostel resident: parent request, warden approval, escort and gate timestamps.
model HostelLeaveRequest {
  id                    String          @id @default(uuid()) @db.Uuid
  organizationId        String          @map("organization_id") @db.Uuid
  campusId              String          @map("campus_id") @db.Uuid
  hostelId              String          @map("hostel_id") @db.Uuid
  studentId             String          @map("student_id") @db.Uuid
  allocationId          String?         @map("allocation_id") @db.Uuid
  leaveType             HostelLeaveType @map("leave_type")
  fromAt                DateTime        @map("from_at") @db.Timestamptz(6)
  expectedReturnAt      DateTime        @map("expected_return_at") @db.Timestamptz(6)
  reason                String          @db.VarChar(500)
  requestedByGuardianId String?         @map("requested_by_guardian_id") @db.Uuid
  escortName            String?         @map("escort_name") @db.VarChar(160) // who collects the student
  escortPhone           String?         @map("escort_phone") @db.VarChar(20)
  status                ApprovalStatus  @default(PENDING)
  approvedById          String?         @map("approved_by_id") @db.Uuid // User id of the warden (audit only, no FK)
  approvedAt            DateTime?       @map("approved_at") @db.Timestamptz(6)
  checkedOutAt          DateTime?       @map("checked_out_at") @db.Timestamptz(6) // actual time out at the gate
  checkedInAt           DateTime?       @map("checked_in_at") @db.Timestamptz(6) // actual return
  createdAt             DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization        Organization       @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus              Campus             @relation(fields: [campusId], references: [id], onDelete: Restrict)
  hostel              Hostel             @relation(fields: [hostelId], references: [id], onDelete: Restrict)
  student             Student            @relation(fields: [studentId], references: [id], onDelete: Restrict)
  allocation          HostelAllocation?  @relation(fields: [allocationId], references: [id], onDelete: SetNull)
  requestedByGuardian Guardian?          @relation(fields: [requestedByGuardianId], references: [id], onDelete: SetNull)
  attendances         HostelAttendance[]

  @@index([organizationId, hostelId, status, fromAt])
  @@index([organizationId, studentId, fromAt])
  @@index([organizationId, campusId, status])
  @@map("hostel_leave_requests")
}
```

## Payroll

File `server/prisma/schema/12-payroll.prisma` — 11 models, 12 enums.

```prisma
// 12-payroll: salary components and structures, staff salary assignments, monthly payroll runs,
// payslips with line items, staff loans / advances and one-off payroll adjustments.

enum SalaryComponentType {
  EARNING
  DEDUCTION
  EMPLOYER_CONTRIBUTION // employer PF / ESI: part of CTC, not of take-home pay
}

enum SalaryCalculationType {
  FIXED
  PERCENT_OF_BASIC
  PERCENT_OF_GROSS
  FORMULA
}

// Statutory scheme a component belongs to (India first, then the Phase 2 markets).
enum StatutoryType {
  NONE
  PF // Provident Fund (India)
  ESI // Employees' State Insurance (India)
  PT // Professional Tax (India)
  TDS // income tax deducted at source (India)
  LWF // Labour Welfare Fund (India)
  SUPERANNUATION // Australia
  PAYG_WITHHOLDING // Australia
  FEDERAL_INCOME_TAX // USA
  STATE_INCOME_TAX // USA
  SOCIAL_SECURITY // USA FICA
  MEDICARE // USA FICA
  GRATUITY // UAE end-of-service / India gratuity
  PENSION_GPSSA // UAE nationals
  OTHER_STATUTORY
}

// How a staff member is paid. Visiting / part-time faculty are paid per lecture or hour.
enum PayBasis {
  MONTHLY
  PER_LECTURE
  PER_HOUR
  PER_DAY
}

// India income-tax regime of the employee.
enum TaxRegime {
  OLD
  NEW
  NOT_APPLICABLE
}

enum PayrollRunType {
  REGULAR
  OFF_CYCLE
  FULL_AND_FINAL
  BONUS
  ARREARS
}

enum PayrollRunStatus {
  DRAFT
  PROCESSED
  APPROVED
  PAID
  LOCKED
}

enum PayslipStatus {
  DRAFT
  FINALIZED
  PAID
  ON_HOLD
  CANCELLED
}

enum SalaryPaymentMode {
  BANK_TRANSFER
  CASH
  CHEQUE
  UPI
}

enum LoanAdvanceType {
  LOAN
  SALARY_ADVANCE
}

enum LoanAdvanceStatus {
  PENDING
  APPROVED
  REJECTED
  ACTIVE // disbursed; recovery in progress
  CLOSED
  CANCELLED
}

enum PayrollAdjustmentType {
  BONUS
  INCENTIVE
  ARREARS
  REIMBURSEMENT
  OVERTIME
  SUBSTITUTION_PAY // covered periods (Substitution.status = COMPLETED)
  LEAVE_ENCASHMENT // LeaveBalance.encashed days paid out
  OTHER_EARNING
  FINE
  RECOVERY
  OTHER_DEDUCTION
}

// Pay head: Basic, HRA, Conveyance, PF, Professional Tax, TDS ...
model SalaryComponent {
  id              String                @id @default(uuid()) @db.Uuid
  organizationId  String                @map("organization_id") @db.Uuid
  name            String                @db.VarChar(100)
  code            String                @db.VarChar(20) // BASIC, HRA, PF_EE ... also used as the variable name in formulas
  componentType   SalaryComponentType   @map("component_type")
  calculationType SalaryCalculationType @default(FIXED) @map("calculation_type")
  defaultAmount   Decimal?              @map("default_amount") @db.Decimal(12, 2) // FIXED
  currency        String?               @db.Char(3) // currency of defaultAmount; required when calculationType is FIXED
  countryCode     String?               @map("country_code") @db.Char(2) // null = usable in every country; else limits the component to one payroll country
  defaultPercent  Decimal?              @map("default_percent") @db.Decimal(5, 2) // PERCENT_OF_BASIC / PERCENT_OF_GROSS
  formula         String?               @db.VarChar(500) // FORMULA, e.g. "min(BASIC, 15000) * 0.12"; evaluated by a safe expression parser
  statutoryType   StatutoryType         @default(NONE) @map("statutory_type")
  isTaxable       Boolean               @default(true) @map("is_taxable")
  isProrated      Boolean               @default(true) @map("is_prorated") // reduced for loss-of-pay days
  showOnPayslip   Boolean               @default(true) @map("show_on_payslip")
  sortOrder       Int                   @default(0) @map("sort_order")
  status          RecordStatus          @default(ACTIVE)
  createdAt       DateTime              @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime              @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt       DateTime?             @map("deleted_at") @db.Timestamptz(6)

  organization   Organization          @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  structureItems SalaryStructureItem[]
  payslipItems   PayslipItem[]

  @@unique([organizationId, code])
  @@index([organizationId, componentType, status])
  @@map("salary_components")
}

// Reusable salary template, e.g. "Teaching staff - Grade A".
model SalaryStructure {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  name           String       @db.VarChar(120)
  code           String       @db.VarChar(30)
  description    String?      @db.VarChar(500)
  staffType      StaffType?   @map("staff_type") // null = usable for all staff
  currency       String       @db.Char(3)
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?    @map("deleted_at") @db.Timestamptz(6)

  organization  Organization          @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  items         SalaryStructureItem[]
  staffSalaries StaffSalary[]

  @@unique([organizationId, code])
  @@index([organizationId, status])
  @@map("salary_structures")
}

// A component inside a salary structure with its rule for this structure.
model SalaryStructureItem {
  id                String                @id @default(uuid()) @db.Uuid
  organizationId    String                @map("organization_id") @db.Uuid
  salaryStructureId String                @map("salary_structure_id") @db.Uuid
  componentId       String                @map("component_id") @db.Uuid
  calculationType   SalaryCalculationType @map("calculation_type")
  amount            Decimal?              @db.Decimal(12, 2)
  percent           Decimal?              @db.Decimal(5, 2)
  formula           String?               @db.VarChar(500)
  sortOrder         Int                   @default(0) @map("sort_order")
  createdAt         DateTime              @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime              @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization    Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  salaryStructure SalaryStructure @relation(fields: [salaryStructureId], references: [id], onDelete: Cascade)
  component       SalaryComponent @relation(fields: [componentId], references: [id], onDelete: Restrict)

  @@unique([organizationId, salaryStructureId, componentId])
  @@index([organizationId, componentId])
  @@map("salary_structure_items")
}

// Salary of a staff member for a date range (a new row for every revision).
model StaffSalary {
  id                 String            @id @default(uuid()) @db.Uuid
  organizationId     String            @map("organization_id") @db.Uuid
  campusId           String            @map("campus_id") @db.Uuid // staff campus when the revision was made; history survives a later transfer
  staffId            String            @map("staff_id") @db.Uuid
  salaryStructureId  String            @map("salary_structure_id") @db.Uuid
  payBasis           PayBasis          @default(MONTHLY) @map("pay_basis")
  ratePerUnit        Decimal?          @map("rate_per_unit") @db.Decimal(12, 2) // per lecture / hour / day when payBasis is not MONTHLY
  effectiveFrom      DateTime          @map("effective_from") @db.Date
  effectiveTo        DateTime?         @map("effective_to") @db.Date // null = current
  ctcAnnual          Decimal           @map("ctc_annual") @db.Decimal(12, 2) // cost to company per year
  grossMonthly       Decimal           @map("gross_monthly") @db.Decimal(12, 2)
  basicMonthly       Decimal           @map("basic_monthly") @db.Decimal(12, 2)
  currency           String            @db.Char(3)
  componentOverrides Json?             @map("component_overrides") // [{ componentId, amount | percent }] values that differ from the structure
  paymentMode        SalaryPaymentMode @default(BANK_TRANSFER) @map("payment_mode")
  pfApplicable       Boolean           @default(false) @map("pf_applicable")
  esiApplicable      Boolean           @default(false) @map("esi_applicable")
  ptApplicable       Boolean           @default(false) @map("pt_applicable")
  tdsApplicable      Boolean           @default(false) @map("tds_applicable")
  // PF UAN, PF member id and ESI number are lifetime ids of the employee and live on Staff (uan, pfMemberId, esiIpNumber)
  taxRegime          TaxRegime?        @map("tax_regime") // India
  revisionReason     String?           @map("revision_reason") @db.VarChar(255) // joining, increment, promotion
  approvedById       String?           @map("approved_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt          DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt          DateTime?         @map("deleted_at") @db.Timestamptz(6)

  organization    Organization    @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus          Campus          @relation(fields: [campusId], references: [id], onDelete: Restrict)
  staff           Staff           @relation(fields: [staffId], references: [id], onDelete: Restrict)
  salaryStructure SalaryStructure @relation(fields: [salaryStructureId], references: [id], onDelete: Restrict)
  payslips        Payslip[]

  @@unique([organizationId, staffId, effectiveFrom])
  @@index([organizationId, campusId, effectiveTo])
  @@index([organizationId, staffId, effectiveTo])
  @@index([organizationId, salaryStructureId])
  @@map("staff_salaries")
}

// Monthly payroll of a campus. LOCKED runs can never be changed; off-cycle runs (full-and-final, bonus, arrears) get their own row.
model PayrollRun {
  id                String           @id @default(uuid()) @db.Uuid
  organizationId    String           @map("organization_id") @db.Uuid
  campusId          String           @map("campus_id") @db.Uuid
  runType           PayrollRunType   @default(REGULAR) @map("run_type")
  runNo             Int              @default(1) @map("run_no") @db.SmallInt // 1 for the regular run; counts up for off-cycle runs of the same type and month
  month             Int              @db.SmallInt // 1-12
  year              Int              @db.SmallInt
  periodStart       DateTime         @map("period_start") @db.Date
  periodEnd         DateTime         @map("period_end") @db.Date
  status            PayrollRunStatus @default(DRAFT)
  currency          String           @db.Char(3)
  staffCount        Int              @default(0) @map("staff_count")
  totalGross        Decimal          @default(0) @map("total_gross") @db.Decimal(12, 2)
  totalDeductions   Decimal          @default(0) @map("total_deductions") @db.Decimal(12, 2)
  totalNet          Decimal          @default(0) @map("total_net") @db.Decimal(12, 2)
  totalEmployerCost Decimal          @default(0) @map("total_employer_cost") @db.Decimal(12, 2) // employer PF / ESI contributions
  paymentDate       DateTime?        @map("payment_date") @db.Date
  processedAt       DateTime?        @map("processed_at") @db.Timestamptz(6)
  processedById     String?          @map("processed_by_id") @db.Uuid // User id (audit only, no FK)
  approvedById      String?          @map("approved_by_id") @db.Uuid
  approvedAt        DateTime?        @map("approved_at") @db.Timestamptz(6)
  paidAt            DateTime?        @map("paid_at") @db.Timestamptz(6)
  lockedAt          DateTime?        @map("locked_at") @db.Timestamptz(6)
  notes             String?          @db.VarChar(500)
  createdAt         DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization        @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus              @relation(fields: [campusId], references: [id], onDelete: Restrict)
  approvedBy   User?               @relation(fields: [approvedById], references: [id], onDelete: SetNull)
  payslips     Payslip[]
  adjustments  PayrollAdjustment[]

  @@unique([organizationId, campusId, year, month, runType, runNo])
  @@index([organizationId, status, year, month])
  @@map("payroll_runs")
}

// Salary slip of one staff member in one payroll run.
// A staff member transferred mid-month must not get two regular payslips: partial unique index in the SQL migration,
//   uq_payslip_staff_month (organization_id, staff_id, year, month) WHERE run_type = 'REGULAR' AND status <> 'CANCELLED'
model Payslip {
  id                   String            @id @default(uuid()) @db.Uuid
  organizationId       String            @map("organization_id") @db.Uuid
  campusId             String            @map("campus_id") @db.Uuid
  payrollRunId         String            @map("payroll_run_id") @db.Uuid
  staffId              String            @map("staff_id") @db.Uuid
  staffSalaryId        String?           @map("staff_salary_id") @db.Uuid // salary revision used for the calculation
  payslipNo            String            @map("payslip_no") @db.VarChar(40) // from NumberSequence PAYSLIP_NO
  runType              PayrollRunType    @default(REGULAR) @map("run_type") // denormalised from the run for the partial unique index
  month                Int               @db.SmallInt
  year                 Int               @db.SmallInt
  financialYear        String?           @map("financial_year") @db.VarChar(9) // 2027-28
  workingDays          Decimal           @map("working_days") @db.Decimal(4, 1)
  paidDays             Decimal           @map("paid_days") @db.Decimal(4, 1)
  lopDays              Decimal           @default(0) @map("lop_days") @db.Decimal(4, 1) // loss-of-pay days from unpaid leave and absence
  unitsWorked          Decimal?          @map("units_worked") @db.Decimal(6, 2) // lectures / hours / days counted from COMPLETED ClassSession rows when payBasis is not MONTHLY
  ratePerUnit          Decimal?          @map("rate_per_unit") @db.Decimal(12, 2) // frozen from StaffSalary
  pfWages              Decimal?          @map("pf_wages") @db.Decimal(12, 2) // statutory wage bases frozen for ECR / returns
  epsWages             Decimal?          @map("eps_wages") @db.Decimal(12, 2)
  esiWages             Decimal?          @map("esi_wages") @db.Decimal(12, 2)
  ptWages              Decimal?          @map("pt_wages") @db.Decimal(12, 2)
  taxableIncome        Decimal?          @map("taxable_income") @db.Decimal(12, 2)
  tdsYtd               Decimal?          @map("tds_ytd") @db.Decimal(12, 2) // TDS deducted so far in the financial year (Form 16 / 24Q)
  statutorySummary     Json?             @map("statutory_summary") // { pfEmployee, pfEmployer, eps, esiEmployee, esiEmployer, pt, tds, lwf }
  grossEarnings        Decimal           @map("gross_earnings") @db.Decimal(12, 2)
  totalDeductions      Decimal           @map("total_deductions") @db.Decimal(12, 2)
  netPay               Decimal           @map("net_pay") @db.Decimal(12, 2) // grossEarnings - totalDeductions
  employerContribution Decimal           @default(0) @map("employer_contribution") @db.Decimal(12, 2)
  currency             String            @db.Char(3)
  status               PayslipStatus     @default(DRAFT)
  paymentMode          SalaryPaymentMode @default(BANK_TRANSFER) @map("payment_mode")
  paymentReference     String?           @map("payment_reference") @db.VarChar(100) // UTR / cheque number
  paidAt               DateTime?         @map("paid_at") @db.Timestamptz(6)
  bankAccountLast4     String?           @map("bank_account_last4") @db.VarChar(4)
  snapshot             Json? // frozen staff name, code, designation, department and attendance summary for the PDF
  holdReason           String?           @map("hold_reason") @db.VarChar(255)
  cancelledAt          DateTime?         @map("cancelled_at") @db.Timestamptz(6)
  cancelledById        String?           @map("cancelled_by_id") @db.Uuid // User id (audit only, no FK)
  cancelReason         String?           @map("cancel_reason") @db.VarChar(255)
  pdfFileId            String?           @map("pdf_file_id") @db.Uuid
  sentAt               DateTime?         @map("sent_at") @db.Timestamptz(6) // emailed / shared with the staff member
  createdAt            DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization        @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus              @relation(fields: [campusId], references: [id], onDelete: Restrict)
  payrollRun   PayrollRun          @relation(fields: [payrollRunId], references: [id], onDelete: Restrict)
  staff        Staff               @relation(fields: [staffId], references: [id], onDelete: Restrict)
  staffSalary  StaffSalary?        @relation(fields: [staffSalaryId], references: [id], onDelete: SetNull)
  pdfFile      FileAsset?          @relation(fields: [pdfFileId], references: [id], onDelete: SetNull)
  items        PayslipItem[]
  adjustments  PayrollAdjustment[]

  @@unique([organizationId, payrollRunId, staffId])
  @@unique([organizationId, payslipNo])
  @@index([organizationId, staffId, year, month])
  @@index([organizationId, campusId, status])
  @@map("payslips")
}

// One earning or deduction line of a payslip (values are frozen at processing time).
model PayslipItem {
  id             String              @id @default(uuid()) @db.Uuid
  organizationId String              @map("organization_id") @db.Uuid
  payslipId      String              @map("payslip_id") @db.Uuid
  componentId    String?             @map("component_id") @db.Uuid // null for loan recovery and ad-hoc adjustment lines
  loanAdvanceId  String?             @map("loan_advance_id") @db.Uuid // EMI recovery line
  name           String              @db.VarChar(100)
  code           String?             @db.VarChar(20)
  componentType  SalaryComponentType @map("component_type")
  statutoryType  StatutoryType       @default(NONE) @map("statutory_type")
  amount         Decimal             @db.Decimal(12, 2)
  sortOrder      Int                 @default(0) @map("sort_order")
  createdAt      DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  payslip      Payslip           @relation(fields: [payslipId], references: [id], onDelete: Cascade)
  component    SalaryComponent?  @relation(fields: [componentId], references: [id], onDelete: Restrict)
  loanAdvance  StaffLoanAdvance? @relation(fields: [loanAdvanceId], references: [id], onDelete: Restrict)

  @@index([organizationId, payslipId, sortOrder])
  @@index([organizationId, componentId])
  @@index([organizationId, loanAdvanceId])
  @@map("payslip_items")
}

// Loan or salary advance given to a staff member and recovered through payslip deductions.
model StaffLoanAdvance {
  id                String            @id @default(uuid()) @db.Uuid
  organizationId    String            @map("organization_id") @db.Uuid
  campusId          String            @map("campus_id") @db.Uuid // staff campus when the loan was given
  staffId           String            @map("staff_id") @db.Uuid
  loanType          LoanAdvanceType   @map("loan_type")
  principalAmount   Decimal           @map("principal_amount") @db.Decimal(12, 2)
  interestRate      Decimal           @default(0) @map("interest_rate") @db.Decimal(5, 2) // % per year; 0 for advances
  totalPayable      Decimal           @map("total_payable") @db.Decimal(12, 2)
  emiAmount         Decimal           @map("emi_amount") @db.Decimal(12, 2) // monthly deduction
  installments      Int               @db.SmallInt
  installmentsPaid  Int               @default(0) @map("installments_paid") @db.SmallInt
  amountRecovered   Decimal           @default(0) @map("amount_recovered") @db.Decimal(12, 2)
  balance           Decimal           @db.Decimal(12, 2) // totalPayable - amountRecovered
  currency          String            @db.Char(3)
  status            LoanAdvanceStatus @default(PENDING)
  reason            String?           @db.VarChar(500)
  disbursedOn       DateTime?         @map("disbursed_on") @db.Date
  recoveryStartDate DateTime?         @map("recovery_start_date") @db.Date // first payroll month that deducts the EMI
  approvedById      String?           @map("approved_by_id") @db.Uuid
  approvedAt        DateTime?         @map("approved_at") @db.Timestamptz(6)
  closedAt          DateTime?         @map("closed_at") @db.Timestamptz(6)
  createdById       String?           @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt         DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt         DateTime?         @map("deleted_at") @db.Timestamptz(6)

  organization Organization  @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus        @relation(fields: [campusId], references: [id], onDelete: Restrict)
  staff        Staff         @relation(fields: [staffId], references: [id], onDelete: Restrict)
  approvedBy   User?         @relation(fields: [approvedById], references: [id], onDelete: SetNull)
  payslipItems PayslipItem[]

  @@index([organizationId, campusId, status])
  @@index([organizationId, staffId, status])
  @@index([organizationId, status])
  @@map("staff_loan_advances")
}

// One-off earning or deduction for a staff member in a payroll month (bonus, arrears, fine).
model PayrollAdjustment {
  id             String                @id @default(uuid()) @db.Uuid
  organizationId String                @map("organization_id") @db.Uuid
  campusId       String                @map("campus_id") @db.Uuid
  staffId        String                @map("staff_id") @db.Uuid
  month          Int                   @db.SmallInt // payroll month the adjustment belongs to
  year           Int                   @db.SmallInt
  adjustmentType PayrollAdjustmentType @map("adjustment_type")
  componentType  SalaryComponentType   @map("component_type") // EARNING or DEDUCTION
  amount         Decimal               @db.Decimal(12, 2)
  currency       String                @db.Char(3)
  isTaxable      Boolean               @default(true) @map("is_taxable")
  reason         String                @db.VarChar(500)
  status         ApprovalStatus        @default(PENDING)
  payrollRunId   String?               @map("payroll_run_id") @db.Uuid // run that picked the adjustment up
  payslipId      String?               @map("payslip_id") @db.Uuid // payslip it was applied to
  approvedById   String?               @map("approved_by_id") @db.Uuid
  approvedAt     DateTime?             @map("approved_at") @db.Timestamptz(6)
  createdById    String?               @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt      DateTime              @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime              @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?             @map("deleted_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus       @relation(fields: [campusId], references: [id], onDelete: Restrict)
  staff        Staff        @relation(fields: [staffId], references: [id], onDelete: Restrict)
  payrollRun   PayrollRun?  @relation(fields: [payrollRunId], references: [id], onDelete: SetNull)
  payslip      Payslip?     @relation(fields: [payslipId], references: [id], onDelete: SetNull)
  approvedBy   User?        @relation(fields: [approvedById], references: [id], onDelete: SetNull)

  @@index([organizationId, staffId, year, month])
  @@index([organizationId, campusId, status, year, month])
  @@index([organizationId, payrollRunId])
  @@map("payroll_adjustments")
}

// Employer statutory registrations per organization or campus: PF establishment, ESI, TAN, PT, LWF (India) and ids for other countries.
model PayrollStatutorySetting {
  id                  String   @id @default(uuid()) @db.Uuid
  organizationId      String   @map("organization_id") @db.Uuid
  campusId            String?  @map("campus_id") @db.Uuid // null = whole organization
  campusKey           String   @default("ALL") @map("campus_key") @db.VarChar(36) // "ALL" or the campusId; makes the unique key work without NULLs
  countryCode         String   @map("country_code") @db.Char(2)
  pfEstablishmentCode String?  @map("pf_establishment_code") @db.VarChar(30)
  esiEmployerCode     String?  @map("esi_employer_code") @db.VarChar(30)
  tan                 String?  @db.VarChar(15) // needed for TDS 24Q and Form 16
  ptRegistrationNo    String?  @map("pt_registration_no") @db.VarChar(30)
  ptStateCode         String?  @map("pt_state_code") @db.VarChar(10)
  lwfRegistrationNo   String?  @map("lwf_registration_no") @db.VarChar(30)
  pfWageCeiling       Decimal? @map("pf_wage_ceiling") @db.Decimal(12, 2) // e.g. 15000.00
  esiWageCeiling      Decimal? @map("esi_wage_ceiling") @db.Decimal(12, 2)
  currency            String   @db.Char(3)
  otherRegistrations  Json?    @map("other_registrations") // { abn, paygWithholdingNo, wpsEstablishmentId, ein, stateUnemploymentId }
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus?      @relation(fields: [campusId], references: [id], onDelete: Restrict)

  @@unique([organizationId, campusKey])
  @@index([organizationId, countryCode])
  @@map("payroll_statutory_settings")
}

// A staff member's annual investment / HRA declaration and previous-employer income; drives monthly TDS and Form 12BB.
model StaffTaxDeclaration {
  id                     String         @id @default(uuid()) @db.Uuid
  organizationId         String         @map("organization_id") @db.Uuid
  staffId                String         @map("staff_id") @db.Uuid
  financialYear          String         @map("financial_year") @db.VarChar(9) // 2027-28
  regime                 TaxRegime
  declarations           Json // [{ section: "80C", declared, verified, proofFileId }]
  hraRentAnnual          Decimal?       @map("hra_rent_annual") @db.Decimal(12, 2)
  previousEmployerIncome Decimal?       @map("previous_employer_income") @db.Decimal(12, 2)
  previousEmployerTds    Decimal?       @map("previous_employer_tds") @db.Decimal(12, 2)
  currency               String         @db.Char(3)
  status                 ApprovalStatus @default(PENDING)
  verifiedById           String?        @map("verified_by_id") @db.Uuid // User id (audit only, no FK)
  verifiedAt             DateTime?      @map("verified_at") @db.Timestamptz(6)
  createdAt              DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt              DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  staff        Staff        @relation(fields: [staffId], references: [id], onDelete: Restrict)

  @@unique([organizationId, staffId, financialYear])
  @@index([organizationId, financialYear, status])
  @@map("staff_tax_declarations")
}
```

## Certificates, analytics and AI insights

File `server/prisma/schema/13-certificates-analytics-ai.prisma` — 11 models, 9 enums.

```prisma
// 13-certificates-analytics-ai: certificate templates, issued certificates with public QR verification
// and requests; saved reports, schedules, daily metric snapshots and dashboard preferences;
// AI insights, student risk scores, natural-language query log and AI usage quota.

enum CertificateType {
  BONAFIDE
  TRANSFER
  CHARACTER
  COURSE_COMPLETION
  MERIT
  FEE // fee-paid certificate for income-tax or bank purposes
  CUSTOM
}

enum CertificateRequestStatus {
  PENDING
  APPROVED
  REJECTED
  ISSUED
  CANCELLED
}

enum ReportCategory {
  STUDENTS
  ADMISSIONS
  ATTENDANCE
  FEES
  EXAMS
  STAFF
  PAYROLL
  COMMUNICATION
  OPERATIONS
  CUSTOM
}

enum ScheduleFrequency {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
}

enum AiInsightType {
  ATTENDANCE_DROP
  DROPOUT_RISK
  FEE_DEFAULT_RISK
  ACADEMIC_DECLINE
  ADMISSION_TREND
  COLLECTION_FORECAST
  STAFF_WORKLOAD
  ANOMALY
  OTHER
}

enum AiInsightSeverity {
  INFO
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum AiInsightStatus {
  NEW
  SEEN
  ACTED
  DISMISSED
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum AiQueryStatus {
  SUCCESS
  FAILED
  BLOCKED // question outside the user's permissions or the allowed scope
  QUOTA_EXCEEDED
}

// ---------------------------------------------------------------- Certificates

// Certificate design: body text with merge variables, layout and signatories.
model CertificateTemplate {
  id               String          @id @default(uuid()) @db.Uuid
  organizationId   String          @map("organization_id") @db.Uuid
  name             String          @db.VarChar(120)
  certificateType  CertificateType @map("certificate_type")
  body             String          @db.Text // text with {{variables}}, e.g. "This is to certify that {{studentName}} ..."
  variables        String[] // merge variables used in the body
  layout           Json // page size, orientation, margins, fonts, logo / seal / QR positions
  signatories      Json? // [{ name, designation, signatureFileId }]
  backgroundFileId String?         @map("background_file_id") @db.Uuid // letterhead / border image
  requiresApproval Boolean         @default(true) @map("requires_approval") // requests need approval before issue
  feeAmount        Decimal?        @map("fee_amount") @db.Decimal(12, 2) // charge for issuing; null = free
  currency         String?         @db.Char(3)
  isDefault        Boolean         @default(false) @map("is_default") // default template of its certificateType
  status           RecordStatus    @default(ACTIVE)
  createdAt        DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt        DateTime?       @map("deleted_at") @db.Timestamptz(6)

  organization       Organization         @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  backgroundFile     FileAsset?           @relation(fields: [backgroundFileId], references: [id], onDelete: SetNull)
  issuedCertificates IssuedCertificate[]
  requests           CertificateRequest[]

  @@unique([organizationId, name])
  @@index([organizationId, certificateType, status])
  @@map("certificate_templates")
}

// Certificate issued to a student. The data snapshot and PDF never change; a wrong certificate is revoked and re-issued.
model IssuedCertificate {
  id                String          @id @default(uuid()) @db.Uuid
  organizationId    String          @map("organization_id") @db.Uuid
  campusId          String          @map("campus_id") @db.Uuid
  templateId        String          @map("template_id") @db.Uuid
  requestId         String?         @unique @map("request_id") @db.Uuid // request that led to this certificate
  studentId         String          @map("student_id") @db.Uuid
  certificateType   CertificateType @map("certificate_type") // denormalised from the template
  serialNo          String          @map("serial_no") @db.VarChar(40) // from NumberSequence CERTIFICATE_NO
  issueDate         DateTime        @map("issue_date") @db.Date
  purpose           String?         @db.VarChar(255)
  dataSnapshot      Json            @map("data_snapshot") // merge values frozen at issue time
  pdfFileId         String?         @map("pdf_file_id") @db.Uuid
  verificationCode  String          @unique @map("verification_code") @db.VarChar(32) // random code in the QR; public page /verify/{code} works without login
  verificationCount Int             @default(0) @map("verification_count")
  lastVerifiedAt    DateTime?       @map("last_verified_at") @db.Timestamptz(6)
  issuedById        String?         @map("issued_by_id") @db.Uuid
  revokedAt         DateTime?       @map("revoked_at") @db.Timestamptz(6)
  revokedById       String?         @map("revoked_by_id") @db.Uuid // User id (audit only, no FK)
  revokeReason      String?         @map("revoke_reason") @db.VarChar(255)
  createdAt         DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization        @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus       Campus              @relation(fields: [campusId], references: [id], onDelete: Restrict)
  template     CertificateTemplate @relation(fields: [templateId], references: [id], onDelete: Restrict)
  request      CertificateRequest? @relation(fields: [requestId], references: [id], onDelete: SetNull)
  student      Student             @relation(fields: [studentId], references: [id], onDelete: Restrict)
  pdfFile      FileAsset?          @relation(fields: [pdfFileId], references: [id], onDelete: SetNull)
  issuedBy     User?               @relation(fields: [issuedById], references: [id], onDelete: SetNull)
  tcForStudent Student?            @relation("StudentTransferCertificate") // student whose record this transfer certificate closed

  @@unique([organizationId, serialNo])
  @@index([organizationId, studentId, certificateType])
  @@index([organizationId, campusId, issueDate])
  @@map("issued_certificates")
}

// Request for a certificate raised by a parent or student in the portal (or by staff), with approval.
model CertificateRequest {
  id                String                   @id @default(uuid()) @db.Uuid
  organizationId    String                   @map("organization_id") @db.Uuid
  campusId          String                   @map("campus_id") @db.Uuid
  studentId         String                   @map("student_id") @db.Uuid
  certificateType   CertificateType          @map("certificate_type")
  templateId        String?                  @map("template_id") @db.Uuid
  purpose           String                   @db.VarChar(500)
  copies            Int                      @default(1) @db.SmallInt
  status            CertificateRequestStatus @default(PENDING)
  requestedByUserId String?                  @map("requested_by_user_id") @db.Uuid // parent, student or staff login
  reviewedById      String?                  @map("reviewed_by_id") @db.Uuid
  reviewedAt        DateTime?                @map("reviewed_at") @db.Timestamptz(6)
  reviewRemarks     String?                  @map("review_remarks") @db.VarChar(500)
  feeInvoiceId      String?                  @map("fee_invoice_id") @db.Uuid // invoice for the certificate fee, when charged
  createdAt         DateTime                 @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime                 @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt         DateTime?                @map("deleted_at") @db.Timestamptz(6)

  organization      Organization         @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  campus            Campus               @relation(fields: [campusId], references: [id], onDelete: Restrict)
  student           Student              @relation(fields: [studentId], references: [id], onDelete: Restrict)
  template          CertificateTemplate? @relation(fields: [templateId], references: [id], onDelete: SetNull)
  requestedByUser   User?                @relation("CertificateRequestRequestedBy", fields: [requestedByUserId], references: [id], onDelete: SetNull)
  reviewedBy        User?                @relation("CertificateRequestReviewedBy", fields: [reviewedById], references: [id], onDelete: SetNull)
  feeInvoice        FeeInvoice?          @relation(fields: [feeInvoiceId], references: [id], onDelete: SetNull)
  issuedCertificate IssuedCertificate?

  @@index([organizationId, campusId, status, createdAt])
  @@index([organizationId, studentId, createdAt])
  @@map("certificate_requests")
}

// ---------------------------------------------------------------- Analytics

// Report built in the report builder and saved for reuse; may be shared and scheduled.
model SavedReport {
  id             String         @id @default(uuid()) @db.Uuid
  organizationId String         @map("organization_id") @db.Uuid
  campusId       String?        @map("campus_id") @db.Uuid // null = all campuses the viewer may see
  name           String         @db.VarChar(150)
  description    String?        @db.VarChar(500)
  category       ReportCategory
  definition     Json // { dataset, columns, filters, groupBy, sort, chart }
  isShared       Boolean        @default(false) @map("is_shared") // false = visible to the owner only
  sharedRoleKeys String[]       @map("shared_role_keys") // role keys that may open a shared report; empty = every role with analytics.view
  ownerId        String?        @map("owner_id") @db.Uuid
  lastRunAt      DateTime?      @map("last_run_at") @db.Timestamptz(6)
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?      @map("deleted_at") @db.Timestamptz(6)

  organization Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus       Campus?          @relation(fields: [campusId], references: [id], onDelete: Cascade)
  owner        User?            @relation(fields: [ownerId], references: [id], onDelete: SetNull)
  schedules    ReportSchedule[]

  @@index([organizationId, category, isShared])
  @@index([organizationId, ownerId])
  @@map("saved_reports")
}

// Automatic delivery of a saved report by email (daily, weekly, monthly).
model ReportSchedule {
  id               String            @id @default(uuid()) @db.Uuid
  organizationId   String            @map("organization_id") @db.Uuid
  savedReportId    String            @map("saved_report_id") @db.Uuid
  frequency        ScheduleFrequency
  dayOfWeek        WeekDay?          @map("day_of_week") // WEEKLY
  dayOfMonth       Int?              @map("day_of_month") @db.SmallInt // MONTHLY / QUARTERLY; 1-28
  timeOfDay        String            @map("time_of_day") @db.VarChar(5) // HH:mm in the organization timezone
  format           FileFormat        @default(PDF)
  recipientUserIds String[]          @map("recipient_user_ids") @db.Uuid
  recipientEmails  String[]          @map("recipient_emails") // extra addresses, e.g. a trustee
  isActive         Boolean           @default(true) @map("is_active")
  nextRunAt        DateTime?         @map("next_run_at") @db.Timestamptz(6)
  lastRunAt        DateTime?         @map("last_run_at") @db.Timestamptz(6)
  lastRunStatus    JobStatus?        @map("last_run_status")
  lastError        String?           @map("last_error") @db.VarChar(500)
  createdById      String?           @map("created_by_id") @db.Uuid // User id (audit only, no FK)
  createdAt        DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  savedReport  SavedReport  @relation(fields: [savedReportId], references: [id], onDelete: Cascade)

  @@index([organizationId, savedReportId])
  @@index([isActive, nextRunAt]) // scheduler
  @@map("report_schedules")
}

// Pre-computed daily numbers per organization and campus; dashboards read this table instead of scanning raw data.
model DailyMetricSnapshot {
  id                 String   @id @default(uuid()) @db.Uuid
  organizationId     String   @map("organization_id") @db.Uuid
  campusId           String?  @map("campus_id") @db.Uuid // null = roll-up of the whole organization
  campusKey          String   @default("ALL") @map("campus_key") @db.VarChar(36) // "ALL" or the campusId; makes the unique key work without NULLs
  date               DateTime @db.Date
  activeStudents     Int      @default(0) @map("active_students")
  newAdmissions      Int      @default(0) @map("new_admissions")
  newInquiries       Int      @default(0) @map("new_inquiries")
  withdrawals        Int      @default(0)
  studentsMarked     Int      @default(0) @map("students_marked") // students with attendance marked on the date
  studentsPresent    Int      @default(0) @map("students_present")
  attendancePercent  Decimal? @map("attendance_percent") @db.Decimal(5, 2) // null on holidays
  staffTotal         Int      @default(0) @map("staff_total")
  staffPresent       Int      @default(0) @map("staff_present")
  currency           String   @db.Char(3)
  feeInvoiced        Decimal  @default(0) @map("fee_invoiced") @db.Decimal(14, 2) // invoices issued on the date
  feeCollected       Decimal  @default(0) @map("fee_collected") @db.Decimal(14, 2) // successful payments on the date
  feeCollectedOnline Decimal  @default(0) @map("fee_collected_online") @db.Decimal(14, 2)
  feeDues            Decimal  @default(0) @map("fee_dues") @db.Decimal(14, 2) // total outstanding balance at the end of the day
  feeOverdue         Decimal  @default(0) @map("fee_overdue") @db.Decimal(14, 2) // part of feeDues past the due date
  messagesSent       Int      @default(0) @map("messages_sent")
  extra              Json? // module-specific counters (library issues, transport trips ...)
  computedAt         DateTime @default(now()) @map("computed_at") @db.Timestamptz(6)
  createdAt          DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus       Campus?      @relation(fields: [campusId], references: [id], onDelete: Cascade)

  @@unique([organizationId, campusKey, date])
  @@index([organizationId, date])
  @@map("daily_metric_snapshots")
}

// A user's dashboard layout: widget order, hidden widgets and default filters.
model DashboardPreference {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String   @map("organization_id") @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  dashboardKey    String   @default("home") @map("dashboard_key") @db.VarChar(40) // home, fees, attendance, admissions
  layout          Json // [{ widgetKey, x, y, w, h }]
  hiddenWidgets   String[] @map("hidden_widgets")
  defaultCampusId String?  @map("default_campus_id") @db.Uuid // Campus id (no FK); null = all assigned campuses
  defaultRange    String?  @map("default_range") @db.VarChar(20) // today, this_week, this_month, this_year
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId, dashboardKey])
  @@index([organizationId, dashboardKey])
  @@map("dashboard_preferences")
}

// ---------------------------------------------------------------- AI Insights

// Finding produced by the AI engine with a plain-language explanation and a suggested action.
model AiInsight {
  id              String            @id @default(uuid()) @db.Uuid
  organizationId  String            @map("organization_id") @db.Uuid
  campusId        String?           @map("campus_id") @db.Uuid // null = organization-level insight
  insightType     AiInsightType     @map("insight_type")
  severity        AiInsightSeverity @default(INFO)
  title           String            @db.VarChar(200)
  explanation     String            @db.Text // why the engine raised it, in simple words
  suggestedAction String?           @map("suggested_action") @db.Text
  entityType      String?           @map("entity_type") @db.VarChar(60) // model name the insight is about: Student, Batch, Campus ...
  entityId        String?           @map("entity_id") @db.Uuid
  evidence        Json? // numbers and trends behind the insight
  confidence      Decimal?          @db.Decimal(4, 3) // 0.000 - 1.000
  status          AiInsightStatus   @default(NEW)
  modelVersion    String            @map("model_version") @db.VarChar(60)
  generatedAt     DateTime          @default(now()) @map("generated_at") @db.Timestamptz(6)
  validUntil      DateTime?         @map("valid_until") @db.Timestamptz(6) // stale insights are hidden after this time
  seenAt          DateTime?         @map("seen_at") @db.Timestamptz(6)
  actedAt         DateTime?         @map("acted_at") @db.Timestamptz(6)
  actionTaken     String?           @map("action_taken") @db.VarChar(500)
  dismissedAt     DateTime?         @map("dismissed_at") @db.Timestamptz(6)
  dismissReason   String?           @map("dismiss_reason") @db.VarChar(255)
  handledById     String?           @map("handled_by_id") @db.Uuid // User id (audit only, no FK)
  wasHelpful      Boolean?          @map("was_helpful") // user feedback, used to tune the engine
  createdAt       DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus       Campus?      @relation(fields: [campusId], references: [id], onDelete: Cascade)

  @@index([organizationId, campusId, status, severity])
  @@index([organizationId, insightType, generatedAt])
  @@index([organizationId, entityType, entityId])
  @@map("ai_insights")
}

// Risk scores of a student (0-100) with the contributing factors; history is kept, isLatest marks the current row.
model StudentRiskScore {
  id             String    @id @default(uuid()) @db.Uuid
  organizationId String    @map("organization_id") @db.Uuid
  campusId       String    @map("campus_id") @db.Uuid
  studentId      String    @map("student_id") @db.Uuid
  academicYearId String?   @map("academic_year_id") @db.Uuid
  dropoutRisk    Decimal   @map("dropout_risk") @db.Decimal(5, 2)
  feeDefaultRisk Decimal   @map("fee_default_risk") @db.Decimal(5, 2)
  academicRisk   Decimal   @map("academic_risk") @db.Decimal(5, 2)
  overallRisk    Decimal   @map("overall_risk") @db.Decimal(5, 2)
  riskLevel      RiskLevel @map("risk_level") // band of overallRisk
  factors        Json // [{ factor, weight, value, direction }] e.g. attendance down 18% in 30 days
  modelVersion   String    @map("model_version") @db.VarChar(60)
  isLatest       Boolean   @default(true) @map("is_latest")
  computedAt     DateTime  @default(now()) @map("computed_at") @db.Timestamptz(6)
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campus       Campus        @relation(fields: [campusId], references: [id], onDelete: Cascade)
  student      Student       @relation(fields: [studentId], references: [id], onDelete: Cascade)
  academicYear AcademicYear? @relation(fields: [academicYearId], references: [id], onDelete: SetNull)

  @@index([organizationId, studentId, computedAt])
  @@index([organizationId, campusId, isLatest, riskLevel])
  @@map("student_risk_scores")
}

// One natural-language question asked to the AI assistant. Append-only: no updatedAt / deletedAt.
model AiQueryLog {
  id               String        @id @default(uuid()) @db.Uuid
  organizationId   String        @map("organization_id") @db.Uuid
  campusId         String?       @map("campus_id") @db.Uuid // Campus id of the active campus filter (no FK)
  userId           String?       @map("user_id") @db.Uuid
  question         String        @db.Text
  queryPlan        Json?         @map("query_plan") // structured, permission-checked query the model produced (never raw SQL)
  summary          String?       @db.Text // generated answer shown to the user
  resultRowCount   Int?          @map("result_row_count")
  status           AiQueryStatus @default(SUCCESS)
  modelVersion     String        @map("model_version") @db.VarChar(60)
  promptTokens     Int           @default(0) @map("prompt_tokens")
  completionTokens Int           @default(0) @map("completion_tokens")
  totalTokens      Int           @default(0) @map("total_tokens")
  cost             Decimal       @default(0) @db.Decimal(12, 4) // 4 decimals: a single query costs a fraction of a currency unit
  currency         String        @default("USD") @db.Char(3)
  latencyMs        Int?          @map("latency_ms")
  feedbackRating   Int?          @map("feedback_rating") @db.SmallInt // 1 = not helpful, 5 = very helpful
  errorMessage     String?       @map("error_message") @db.VarChar(500)
  createdAt        DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([organizationId, createdAt])
  @@index([organizationId, userId, createdAt])
  @@map("ai_query_logs")
}

// AI allowance of an organization for one calendar month (queries and tokens) with usage counters.
model AiUsageQuota {
  id              String    @id @default(uuid()) @db.Uuid
  organizationId  String    @map("organization_id") @db.Uuid
  periodKey       String    @map("period_key") @db.VarChar(7) // "2027-04"
  periodStart     DateTime  @map("period_start") @db.Date
  periodEnd       DateTime  @map("period_end") @db.Date
  queryLimit      Int?      @map("query_limit") // null = unlimited (Enterprise)
  queriesUsed     Int       @default(0) @map("queries_used")
  tokenLimit      Int?      @map("token_limit")
  tokensUsed      Int       @default(0) @map("tokens_used")
  insightRunsUsed Int       @default(0) @map("insight_runs_used")
  costAccrued     Decimal   @default(0) @map("cost_accrued") @db.Decimal(12, 4)
  currency        String    @default("USD") @db.Char(3)
  limitReachedAt  DateTime? @map("limit_reached_at") @db.Timestamptz(6)
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([organizationId, periodKey])
  @@index([organizationId, periodStart])
  @@map("ai_usage_quotas")
}
```
