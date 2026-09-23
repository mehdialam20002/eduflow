# Brief for 92-appendix-error-codes.md

Title: Error Codes
Minimum words: 2000
Web research needed: no

## What this chapter must cover (every item, fully)

The complete error catalog. First the standard error codes from the canon with HTTP status, meaning, when to use, example JSON and what the UI should show. Then domain-specific sub-codes returned inside error.details or as specific codes under BUSINESS_RULE_VIOLATION / CONFLICT — a table per area (auth, tenancy and plans, students and admissions, attendance and leave, academics and exams, fees and payments, communication, operations, payroll, imports/exports) with Code | HTTP | Message shown to user | Typical cause | How to fix. Aim for 120+ sub-codes with stable UPPER_SNAKE names (for example INVOICE_ALREADY_PAID, RECEIPT_CANCELLED, ATTENDANCE_LOCKED, BATCH_CAPACITY_FULL, OTP_EXPIRED, WEBHOOK_SIGNATURE_INVALID, INSUFFICIENT_CREDITS). Guidelines for writing good error messages in simple English and Hindi-ready.
