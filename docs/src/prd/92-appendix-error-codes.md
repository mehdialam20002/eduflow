# Error Codes

**In simple words:** This appendix lists everything that can go wrong in the EduFlow API and the exact code the server returns. First the eleven standard codes, then 120 precise sub-codes by area, each with the message the user sees, the cause and the fix. The envelope and the retry rules stay in *API Standards and Conventions*.

## How to Read This Catalog

Every failure has the same shape. `code` is one of eleven fixed values. `subCode` is the precise reason. `message` is what the user sees. `requestId` matches the `X-Request-Id` header.

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "subCode": "INVOICE_ALREADY_PAID",
    "message": "This invoice is already paid.",
    "details": [
      { "field": "invoiceId", "issue": "INV-0912 was paid on 08 Jul 2027 by receipt RC-1188" }
    ]
  },
  "requestId": "req_8f3a2c71d94e"
}
```

**Decision made here:** `subCode` is a new optional string inside `error`, so a client that reads only `code` keeps working. It rides on `BUSINESS_RULE_VIOLATION`, `CONFLICT`, `FORBIDDEN`, `PLAN_LIMIT_REACHED` and `SERVICE_UNAVAILABLE`, and is absent on `VALIDATION_ERROR`, where `details` names the bad field.

Names are UPPER_SNAKE_CASE, ASCII, at most 40 characters, and name the state, not the action: `INVOICE_ALREADY_PAID`, never `CANNOT_COLLECT`. A shipped code is permanent, never renamed, never reused; a dead code is marked retired and stays.

## Standard Codes

| Code | HTTP | Meaning | What the web app does |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Shape is wrong: type, length, format, enum | Show `details` under each input |
| `UNAUTHENTICATED` | 401 | No token, bad token or API key | Go to login |
| `TOKEN_EXPIRED` | 401 | Access token older than 15 minutes | Refresh once, retry once, silently |
| `FORBIDDEN` | 403 | Permission key or data scope missing | Toast; hide the button next time |
| `PLAN_LIMIT_REACHED` | 403 | A plan limit or a locked feature | Open the upgrade dialog |
| `NOT_FOUND` | 404 | Row missing, soft deleted, or another tenant | Show the empty state |
| `CONFLICT` | 409 | Unique clash, stale `If-Match`, idempotency clash | Reload, then retry |
| `BUSINESS_RULE_VIOLATION` | 422 | Shape is fine, the domain rule says no | Toast; keep the form |
| `RATE_LIMITED` | 429 | Too many calls; obey `Retry-After` | Disable the button for that time |
| `INTERNAL_ERROR` | 500 | Unhandled fault; cause only in the log | Show `requestId` and a report link |
| `SERVICE_UNAVAILABLE` | 503 | Dependency down or maintenance on | Retry three times, then wait |

> **Rule:** the client acts on `code` alone. `subCode` only changes wording, icon or an extra button, and a client must never break on one it has not seen.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are not correct",
    "details": [
      { "field": "phone", "issue": "Enter a 10-digit Indian mobile number" },
      { "field": "amount", "issue": "Amount must be greater than 0" }
    ]
  },
  "requestId": "req_2b71c0aa41f8"
}
```

```json
{
  "success": false,
  "error": {
    "code": "PLAN_LIMIT_REACHED",
    "subCode": "PLAN_STUDENT_LIMIT",
    "message": "Your Growth plan allows 300 students. You have 300.",
    "details": [
      { "field": "plan", "issue": "GROWTH" },
      { "field": "limit", "issue": "300" }
    ]
  },
  "requestId": "req_55c9d1e07b32"
}
```

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "subCode": "LOGIN_ATTEMPTS_EXCEEDED",
    "message": "Too many tries. Please wait 15 minutes and try again.",
    "details": [{ "field": "retryAfter", "issue": "900" }]
  },
  "requestId": "req_9f1004ba7c65"
}
```

## Auth and Session Codes

See *Authentication and Sessions*.

| Code | HTTP | Message shown to user | Typical cause | How to fix |
|---|---|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Email or password is wrong. | Wrong password | Retry or reset |
| `LOGIN_ATTEMPTS_EXCEEDED` | 429 | Too many tries. Wait 15 minutes. | 5 failed logins | Wait, retry |
| `USER_INACTIVE` | 403 | This account is switched off. | Status `INACTIVE` | Admin reactivates |
| `EMAIL_NOT_VERIFIED` | 403 | Please verify your email first. | Signup unfinished | Open the link |
| `OTP_INVALID` | 422 | This code is not correct. | Typing mistake | Re-enter |
| `OTP_EXPIRED` | 422 | This code has expired. | Over 10 minutes old | Resend |
| `OTP_ALREADY_USED` | 422 | This code is already used. | Entered twice | Request a new one |
| `OTP_MAX_ATTEMPTS` | 429 | Too many wrong codes. Wait 15 minutes. | 5 wrong tries | Resend later |
| `REFRESH_TOKEN_INVALID` | 401 | Please sign in again. | Token unknown | Sign in |
| `REFRESH_TOKEN_EXPIRED` | 401 | Your session has ended. | Over 30 days old | Sign in |
| `REFRESH_TOKEN_REUSED` | 401 | We signed you out for safety. | Reuse detected | Sign in, check devices |
| `MFA_REQUIRED` | 401 | Enter the code from your app. | MFA is on | Submit the code |
| `PASSWORD_TOO_WEAK` | 400 | Use 10 characters with a number. | Policy not met | Use a stronger one |
| `RESET_TOKEN_EXPIRED` | 422 | This reset link has expired. | Over 30 minutes old | Ask again |
| `INVITATION_EXPIRED` | 422 | This invite has expired. | Over 7 days old | Ask for a resend |
| `INVITATION_ALREADY_ACCEPTED` | 409 | This invite is already used. | User exists | Sign in |
| `API_KEY_REVOKED` | 401 | This API key no longer works. | Key revoked | Create a new key |

## Tenancy, Plan and Settings Codes

See *Release Plan and Plan Gating*.

| Code | HTTP | Message shown to user | Typical cause | How to fix |
|---|---|---|---|---|
| `ORG_SUSPENDED` | 403 | This account is suspended. | Platform action | Call support |
| `ORG_CANCELLED` | 403 | Account closed. Data kept 90 days. | Cancelled | Pay to restore |
| `TRIAL_EXPIRED` | 403 | Your free trial has ended. | 14 days over | Choose a plan |
| `SUBSCRIPTION_PAST_DUE` | 403 | Restricted mode. Fee collection still works. | Dunning day 10 | Pay the invoice |
| `PLAN_STUDENT_LIMIT` | 403 | Your plan allows 300 students. | Student cap | Upgrade or archive |
| `PLAN_CAMPUS_LIMIT` | 403 | Your plan allows 3 campuses. | Campus cap | Buy the add-on |
| `PLAN_USER_LIMIT` | 403 | Starter allows 1 admin, 3 staff. | Seat cap | Upgrade |
| `PLAN_MODULE_LOCKED` | 403 | Library is part of the Pro plan. | Phase 3 module | Upgrade |
| `FEATURE_NOT_IN_PLAN` | 403 | Custom roles need Pro. | Feature gated | Upgrade |
| `DOWNGRADE_BLOCKED` | 422 | You have 420 students. Pro allows 300. | Usage too high | Reduce usage |
| `CAMPUS_NOT_ASSIGNED` | 403 | You do not work in this campus. | Campus not assigned | Admin assigns it |
| `CAMPUS_HEADER_MISSING` | 400 | Choose a campus to continue. | No `X-Campus-Id` | Pick a campus |
| `CROSS_TENANT_REFERENCE` | 404 | We could not find that record. | Another tenant's id | Use a valid id |
| `CAMPUS_HAS_ACTIVE_STUDENTS` | 422 | Move the 212 students first. | Campus in use | Transfer them |
| `ACADEMIC_YEAR_CLOSED` | 422 | Session 2026-27 is closed. | Year closed | Use the current year |

## Student and Admission Codes

See *Student Admission Module*.

| Code | HTTP | Message shown to user | Typical cause | How to fix |
|---|---|---|---|---|
| `ADMISSION_NO_TAKEN` | 409 | This admission number is used. | Manual clash | Use the next free one |
| `DUPLICATE_STUDENT` | 409 | A student with this phone exists. | Same name and phone | Open the record |
| `STUDENT_NOT_ACTIVE` | 422 | This student is not active. | Left the institute | Readmit first |
| `STUDENT_ALREADY_ENROLLED` | 409 | Already enrolled in 10-A. | Already enrolled | Transfer instead |
| `ENROLLMENT_NOT_ACTIVE` | 422 | This enrollment is closed. | Status not `ACTIVE` | Use the live one |
| `BATCH_CAPACITY_FULL` | 422 | Batch 10-A is full (60 of 60). | Seats used | Raise capacity |
| `BATCH_CLOSED` | 422 | This batch is closed. | Batch not running | Pick another batch |
| `GUARDIAN_REQUIRED` | 422 | Add at least one guardian. | None linked | Add a guardian |
| `CONSENT_REQUIRED` | 403 | Parent consent is needed first. | DPDP child rule | Send the request |
| `CONSENT_WITHDRAWN` | 403 | The parent withdrew consent. | Consent revoked | Collect it again |
| `DOCUMENT_UNVERIFIED` | 422 | Verify the documents first. | Document pending | Verify or waive |
| `APPLICATION_STAGE_INVALID` | 422 | Finish the earlier step first. | Stage jumped | Go step by step |
| `STUDENT_HAS_OPEN_DUES` | 422 | Clear dues of Rs 8,400 first. | Unpaid invoices | Collect it |

## Attendance and Leave Codes

See *Attendance Module*.

| Code | HTTP | Message shown to user | Typical cause | How to fix |
|---|---|---|---|---|
| `ATTENDANCE_LOCKED` | 422 | This day is locked. | Locked after 72 hours | Ask to unlock |
| `ATTENDANCE_MONTH_CLOSED` | 422 | This month is closed. | Month close ran | Principal reopens |
| `ATTENDANCE_ALREADY_SUBMITTED` | 409 | Attendance is already submitted. | Second submit | Edit with reason |
| `ATTENDANCE_FUTURE_DATE` | 422 | You cannot mark a future date. | Wrong date | Pick an earlier day |
| `ATTENDANCE_ON_HOLIDAY` | 422 | 15 Aug is a holiday. | `Holiday` row | Remove it or skip |
| `ATTENDANCE_NOT_ENROLLED` | 422 | This student is not in the batch. | Moved batch | Refresh the roster |
| `UNLOCK_REASON_REQUIRED` | 400 | Write a reason (5 to 500 letters). | Reason missing | Type it |
| `LEAVE_OVERLAP` | 409 | Leave exists for these dates. | Dates overlap | Edit the old one |
| `LEAVE_BALANCE_EXCEEDED` | 422 | Only 2.5 days are left. | Balance too low | Ask for fewer |
| `LEAVE_SELF_APPROVAL` | 403 | You cannot approve your own leave. | Same person | Another approver acts |

## Academics and Exam Codes

See *Exams Module*.

| Code | HTTP | Message shown to user | Typical cause | How to fix |
|---|---|---|---|---|
| `TEACHER_DOUBLE_BOOKED` | 409 | Priya Nair already teaches at 10:00. | Slot clash | Pick another slot |
| `ROOM_DOUBLE_BOOKED` | 409 | Room 12 is busy at 10:00. | Room clash | Pick another room |
| `SUBJECT_NOT_IN_COURSE` | 422 | This subject is not in Class 10. | Not in curriculum | Add the subject |
| `HOMEWORK_DEADLINE_PASSED` | 422 | The last date has passed. | Late submission | Ask for an extension |
| `MARKS_LOCKED` | 422 | Marks are locked after publishing. | Status `LOCKED` | Unlock with permission |
| `MARKS_ABOVE_MAX` | 400 | Marks cannot be more than 80. | Above the maximum | Fix the mark |
| `MARKS_INCOMPLETE` | 422 | 4 students have no marks. | Blank cells | Fill or mark absent |
| `EXAM_ALREADY_PUBLISHED` | 409 | This result is already published. | Second publish | Unpublish first |
| `REEVALUATION_WINDOW_CLOSED` | 422 | The recheck window has closed. | Past the last date | Ask the principal |
| `REPORT_CARD_NOT_READY` | 422 | Results are not published yet. | Exam not published | Publish the exam |

## Fee and Payment Codes

See *Fees Module* and *Payments Module*.

| Code | HTTP | Message shown to user | Typical cause | How to fix |
|---|---|---|---|---|
| `INVOICE_ALREADY_PAID` | 422 | This invoice is already paid. | Balance is zero | Open the receipt |
| `INVOICE_CANCELLED` | 422 | This invoice is cancelled. | Status `CANCELLED` | Raise a new one |
| `ALREADY_INVOICED` | 409 | This fee is already billed. | Generation ran twice | Open the old invoice |
| `AMOUNT_EXCEEDS_BALANCE` | 422 | Balance is Rs 4,000 only. | Over-collection | Lower the amount |
| `ZERO_AMOUNT` | 400 | Enter an amount above zero. | Blank amount | Type the amount |
| `FEE_STRUCTURE_MISSING` | 422 | No fee plan for this class. | Structure not set | Create one |
| `DISCOUNT_NOT_STACKABLE` | 422 | This discount cannot be joined. | Exclusive discounts | Keep one |
| `DISCOUNT_EXPIRED` | 422 | This discount has ended. | Past its dates | Pick a live one |
| `DISCOUNT_ABOVE_LIMIT` | 403 | This needs approval. | Above the cap | Send it |
| `RECEIPT_CANCELLED` | 422 | This receipt is cancelled. | Payment reversed | Use the new receipt |
| `PAYMENT_NOT_CANCELLABLE` | 422 | The day is closed. Use a refund. | Day closed | Refund instead |
| `DAY_CLOSE_SUBMITTED` | 409 | Today is already closed. | Second close | Reopen with permission |
| `CHEQUE_DATE_IN_FUTURE` | 422 | This cheque is post-dated. | Early deposit | Deposit on its date |
| `REFUND_ABOVE_PAID` | 422 | Refund cannot cross Rs 12,000. | Amount too high | Lower it |
| `REFUND_NOT_APPROVED` | 422 | This refund needs approval. | Status `REQUESTED` | Principal approves |
| `PAYMENT_ORDER_EXPIRED` | 422 | This payment link has expired. | Over 15 minutes old | Start again |
| `PAYMENT_ALREADY_CAPTURED` | 409 | This payment is already done. | Double submit | Open the receipt |
| `IDEMPOTENCY_KEY_REUSED` | 409 | This request was already sent. | Same key, new body | New key |
| `WEBHOOK_SIGNATURE_INVALID` | 401 | Not shown to any user. | Wrong secret | Check the secret |
| `GATEWAY_REJECTED` | 422 | The bank declined this payment. | Card or UPI failed | Try another way |
| `GATEWAY_UNAVAILABLE` | 503 | Online payment is down. Use cash. | Gateway error | Retry in minutes |
| `WRITE_OFF_NOT_ALLOWED` | 403 | Only an admin can write off. | Missing `fees.approve` | Ask the admin |

## Communication Codes

See *Notifications Module* and *WhatsApp Module*.

| Code | HTTP | Message shown to user | Typical cause | How to fix |
|---|---|---|---|---|
| `INSUFFICIENT_CREDITS` | 403 | Your WhatsApp balance is Rs 12. | Wallet low | Buy credits |
| `TEMPLATE_NOT_APPROVED` | 422 | Meta has not approved this template. | Approval pending | Wait |
| `DLT_TEMPLATE_MISMATCH` | 422 | The SMS text does not match DLT. | Text edited later | Register it again |
| `WHATSAPP_OPT_OUT` | 422 | This parent stopped WhatsApp. | Parent replied STOP | Use SMS |
| `WHATSAPP_WINDOW_CLOSED` | 422 | Send an approved template instead. | 24-hour window over | Use a template |
| `WHATSAPP_QUALITY_LOW` | 429 | Sending is paused today. | Quality rating red | Send fewer |
| `INVALID_NUMBER` | 400 | This mobile number is not valid. | Wrong digits | Fix the number |
| `EMAIL_SUPPRESSED` | 422 | This email address is blocked. | Hard bounce | Ask for another |
| `SENDER_NOT_VERIFIED` | 422 | Verify your sender email first. | Domain unverified | Verify it |
| `QUIET_HOURS_BLOCKED` | 422 | Messages go out after 8 am. | Night send blocked | Schedule for morning |

## Operations Codes

See *Library Module* and *Hostel Module*.

| Code | HTTP | Message shown to user | Typical cause | How to fix |
|---|---|---|---|---|
| `BOOK_NOT_AVAILABLE` | 422 | No copy is free right now. | All copies issued | Reserve a copy |
| `ISSUE_LIMIT_REACHED` | 422 | You already have 3 books. | Member limit | Return one |
| `LIBRARY_FINE_PENDING` | 422 | Clear the Rs 40 fine first. | Unpaid fine | Collect the fine |
| `STOCK_INSUFFICIENT` | 422 | Only 4 items are in stock. | Above stock | Lower the quantity |
| `VEHICLE_UNAVAILABLE` | 422 | This bus is under maintenance. | In maintenance | Pick another |
| `VEHICLE_DOC_EXPIRED` | 422 | Insurance has expired. | Document past date | Upload a new one |
| `SEAT_NOT_AVAILABLE` | 422 | No seat is free on this route. | Route full | Pick another route |
| `HOSTEL_BED_OCCUPIED` | 409 | This bed is taken. | Bed status `OCCUPIED` | Pick a free bed |
| `HOSTEL_GENDER_MISMATCH` | 422 | This room is for girls only. | Room gender rule | Match the room |

## Payroll Codes

See *Payroll Module*.

| Code | HTTP | Message shown to user | Typical cause | How to fix |
|---|---|---|---|---|
| `PAYROLL_RUN_LOCKED` | 422 | This payroll month is locked. | Run status `LOCKED` | Use an adjustment |
| `PAYROLL_RUN_EXISTS` | 409 | July payroll already exists. | Second run | Open the old run |
| `ATTENDANCE_NOT_MARKED` | 422 | 3 staff have unmarked days. | Register has gaps | Mark them |
| `SALARY_STRUCTURE_MISSING` | 422 | Set a salary structure first. | None for this staff | Add the structure |
| `NEGATIVE_NET_PAY` | 422 | Deductions cross the salary. | Loan plus lost pay | Lower it |
| `PAYROLL_APPROVAL_REQUIRED` | 403 | This run needs approval. | Missing `payroll.approve` | Send it |

## Import, Export and File Codes

Raised by the upload endpoints and the import and export workers.

| Code | HTTP | Message shown to user | Typical cause | How to fix |
|---|---|---|---|---|
| `FILE_TOO_LARGE` | 400 | Files must be under 10 MB. | Oversized upload | Compress it |
| `FILE_TYPE_NOT_ALLOWED` | 400 | Upload a PDF, JPG or PNG. | Blocked type | Convert it |
| `UPLOAD_URL_EXPIRED` | 422 | The upload link has expired. | Link timed out | Upload again |
| `IMPORT_TEMPLATE_MISMATCH` | 400 | Use the EduFlow template. | Columns renamed | Use the template |
| `IMPORT_ROW_LIMIT` | 422 | Import 5,000 rows at a time. | File too big | Split it |
| `DUPLICATE_IN_FILE` | 422 | Row 214 repeats row 88. | Same key twice | Remove the repeat |
| `EXPORT_LINK_EXPIRED` | 422 | This download link has expired. | Over 24 hours old | Export again |
| `REPORT_TOO_LARGE` | 422 | This report is too big to open. | Range too wide | Narrow it |

## Writing Error Messages People Understand

A fee clerk and a worried parent read these lines. Code review checks six rules.

| Rule | Bad | Good |
|---|---|---|
| Say what happened, then the fix | `Operation failed` | This invoice is already paid. |
| Use the reader's words | `Enrollment constraint violated` | Aarav is already in batch 10-A. |
| Give the real number | `Limit reached` | Your plan allows 300 students. |
| No blame | `You entered an invalid date` | Pick today or an earlier date. |
| No internals | `P2002 unique constraint failed` | This admission number is used. |
| One sentence, under 12 words | A long paragraph | Balance is Rs 4,000 only. |

Never show a database id, a table name, an SQL fragment or another tenant's data. A `500` shows only the `requestId`. Write for translation: no slang.

Messages live in one file per language, keyed by sub-code. Variables are named, never positional, because Hindi puts them in a different order.

```typescript
// server/src/errors/messages.en.ts
export const errorMessages = {
  INVOICE_ALREADY_PAID: 'This invoice is already paid.',
  PLAN_STUDENT_LIMIT: 'Your {plan} plan allows {limit} students. You have {used}.',
  BATCH_CAPACITY_FULL: 'Batch {batch} is full ({used} of {capacity}).',
} as const;
```

```typescript
// server/src/errors/AppError.ts - thrown by services, caught by one handler
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,   // one of the eleven canon codes
    readonly subCode: SubCode,  // a name from this appendix
    readonly status: number,
    readonly vars: Record<string, string | number> = {},
    readonly details: { field: string; issue: string }[] = [],
  ) { super(subCode); }
}

// inside the payment service
if (invoice.balanceAmount.isZero()) {
  throw new AppError('BUSINESS_RULE_VIOLATION', 'INVOICE_ALREADY_PAID', 422);
}
```

The Express 5 handler builds the envelope: message for `Accept-Language`, variables filled, `requestId` added, fault logged with Pino, only safe fields sent. Anything that is not an `AppError` becomes a flat `INTERNAL_ERROR` and goes to Sentry.

## Adding a New Code

1. Reuse a code when the cause and fix are the same.
2. Pick the parent code: `422` rule, `409` clash, `403` permission or plan.
3. Add the name, the English and the Hindi message in one commit.
4. Add the row here and in the module chapter.
5. Assert the `subCode` in a test, not the message.
6. Never change a live code's meaning. Retire it, add a new one.
