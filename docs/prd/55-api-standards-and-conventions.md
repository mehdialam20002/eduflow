# API Standards and Conventions

**In simple words:** This chapter is the rule book for every EduFlow API endpoint. It fixes the base URL, the resource names, the headers, the shape of every success and every error, how lists are paged and filtered, how big jobs and file uploads work, and how we version and retire endpoints. Follow it and all 1,250 endpoints behave the same way, so a developer who learns one endpoint already knows the other 1,249.

The endpoint list itself is in the *API Endpoint Catalog* chapter. What each module's endpoints do is in that module's chapter. How the tenant is resolved is in *Multi-Tenancy and Data Isolation*, and how permission keys are checked is in *RBAC and Permissions Matrix*.

## Base URL and Versioning

Every endpoint lives under one base URL with the major version in the path.

| Environment | Base URL | Who uses it |
|---|---|---|
| Production | `https://api.eduflow.app/api/v1` | Customers, mobile app, Enterprise keys |
| Staging | `https://api.staging.eduflow.app/api/v1` | Pilot testing, Razorpay test mode |
| Local | `http://localhost:4000/api/v1` | Developer machine, `npm run dev` |

> **Note:** The production URL is fixed by the canon. The staging host and the local port 4000 are assumptions of this chapter. They are not customer-facing, so they can change without a version bump.

The tenant is never part of the URL. `app.eduflow.app` and `{slug}.eduflow.app` are web app hosts only. The API always reads the tenant from the JWT `orgId` claim.

### Version rules

| Change | Breaking | What we do |
|---|---|---|
| New endpoint | No | Ship in `v1` |
| New optional request field | No | Ship in `v1` |
| New response field | No | Ship in `v1` |
| New enum value | No | Ship in `v1`, name it in the release notes |
| New optional query parameter | No | Ship in `v1` |
| Remove or rename a response field | Yes | Needs `v2` |
| Change a field type, `string` to `number` | Yes | Needs `v2` |
| Make an optional request field required | Yes | Needs `v2` |
| Change a success status code | Yes | Needs `v2` |
| Remove an enum value | Yes | Needs `v2` |
| Tighten validation, for example a shorter max length | Yes | Needs `v2` |

Three client rules make additive changes safe. First, clients ignore JSON fields they do not know. Second, clients send an unknown enum value to a default branch instead of crashing. Third, clients never depend on the order of keys in an object, or on the order of rows in a list when no `sort` was asked for.

EduFlow runs one major version at a time. There is no `Accept: application/vnd.eduflow.v2+json` header and no `?version=` parameter.

## Resource Naming

| Rule | Right | Wrong |
|---|---|---|
| Plural, kebab-case nouns | `/fee-invoices` | `/FeeInvoice`, `/invoice` |
| One nesting level only | `/students/:id/documents` | `/students/:id/documents/:docId/files` |
| Address a child row flat | `/student-documents/:id` | `/students/:id/documents/:docId` |
| UUID path parameters | `/students/9f1c8a02-...` | `/students/BF-2027-0142` |
| Non-CRUD action is a POST sub-resource | `POST /students/:id/change-status` | `POST /students/:id?action=status` |
| Static segment routed before `:id` | `/students/lookup` | `/students/:id` catching `lookup` |
| Filters live in the query string | `/students?status=ACTIVE` | `/students/active` |
| No file extensions | `/students/export` | `/students.xlsx` |

Business numbers such as the admission number `BF-2027-0142` are never path parameters, because they are unique only inside one organization. They are query filters: `GET /students?q=BF-2027-0142`.

Sub-resource verbs use the imperative with a hyphen: `change-status`, `bulk-update`, `assign-roll-numbers`, `revoke-sessions`. The same verb always means the same thing across modules, so `POST /report-cards/bulk-publish` and `POST /fee-invoices/bulk-issue` read alike.

## HTTP Methods and Status Codes

| Method | Use it for | Has body | Safe to retry | Normal success |
|---|---|---|---|---|
| `GET` | Read one row or a list | No | Yes | `200` |
| `POST` | Create a row, or run an action | Yes | Only with `Idempotency-Key` | `201`, `200`, `202` |
| `PATCH` | Change some fields of one row | Yes | Yes, same body gives same result | `200` |
| `PUT` | Replace a whole set | Yes | Yes | `200` |
| `DELETE` | Soft delete, sets `deletedAt` | No | Yes | `200` |

`PUT` is used only where a whole collection is replaced in one call: `PUT /users/:id/roles`, `PUT /roles/:id/permissions`, `PUT /students/:id/medical`. `PATCH` never replaces a set. `DELETE` is a soft delete unless the registry line says otherwise. `DELETE /student-guardians/:id` is one of the few hard deletes, because an unlink row carries no history worth keeping.

| Status | Name | When EduFlow returns it |
|---|---|---|
| `200` | OK | Read, update, replace, or an action that finished now |
| `201` | Created | A new row exists; `Location` header points to it |
| `202` | Accepted | Work moved to a queue; the body carries the job id |
| `204` | No Content | Never used; we always return an envelope |
| `304` | Not Modified | `If-None-Match` matched the current `ETag` |
| `400` | Bad Request | `VALIDATION_ERROR` only |
| `401` | Unauthorized | `UNAUTHENTICATED`, `TOKEN_EXPIRED` |
| `403` | Forbidden | `FORBIDDEN`, `PLAN_LIMIT_REACHED` |
| `404` | Not Found | Row missing, or the row is in another tenant |
| `409` | Conflict | Duplicate key, stale version, idempotency clash |
| `410` | Gone | Retired endpoint, after its sunset date |
| `422` | Unprocessable | `BUSINESS_RULE_VIOLATION` |
| `429` | Too Many Requests | `RATE_LIMITED` |
| `500` | Server Error | Unhandled fault, mapped to `INTERNAL_ERROR` |
| `503` | Unavailable | PostgreSQL, Redis or S3 down; maintenance window |

> **Rule:** A row that belongs to another organization returns `404`, never `403`. A `403` would tell an attacker that the id exists somewhere. This rule is tested in the isolation suite described in *Multi-Tenancy and Data Isolation*.

## Request and Response Headers

| Request header | Required | Meaning |
|---|---|---|
| `Authorization: Bearer <accessToken>` | Every signed-in call | 15-minute JWT from `/auth/login` |
| `X-Campus-Id` | Optional | Act inside one assigned campus |
| `X-Organization-Id` | `SUPER_ADMIN` only | Choose the tenant for a platform user |
| `Idempotency-Key` | Money-creating POSTs | Client-made key, 16 to 100 characters |
| `X-Request-Id` | Optional | Trace id, `req_` plus 12 hex characters |
| `Accept-Language` | Optional | `en-IN`, `hi-IN`, `en-AE`; message language |
| `X-Api-Key` | Enterprise integrations | Server-to-server key instead of a JWT |
| `If-None-Match` | Optional | Cache check against a known `ETag` |
| `Content-Type: application/json` | On bodies | Only JSON is accepted, up to 1 MB |

| Response header | When | Meaning |
|---|---|---|
| `X-Request-Id` | Always | The trace id of this call |
| `X-RateLimit-Limit` | Always | Calls allowed in the current window |
| `X-RateLimit-Remaining` | Always | Calls left in the window |
| `X-RateLimit-Reset` | Always | Unix seconds when the window resets |
| `Retry-After` | `429`, `503` | Seconds to wait before retrying |
| `ETag` | Cacheable `GET` | Version tag of the body |
| `Cache-Control` | Always | `no-store` unless the route says otherwise |
| `Location` | `201` | Path of the new row |
| `Deprecation` and `Sunset` | Deprecated route | `true`, and the date it starts returning `410` |

`X-Campus-Id` narrows, it never widens. A `PRINCIPAL` assigned to the Gomti Nagar campus who sends the id of the Aliganj campus gets `FORBIDDEN`, because the header is checked against the user's `user_campuses` rows. When the header is absent, a campus-scoped user sees all campuses assigned to them, and an `ORG_ADMIN` sees the whole organization.

`Accept-Language` chooses the language of `error.message` and of enum labels from `GET /reference-data/enums`. It never changes field names, enum values, number formats or date formats. Details are in *Internationalization and Localization*.

If the client sends `X-Request-Id`, the API reuses it, so one id runs from the browser console to the Pino log line to the Sentry event. If the sent value is not `req_` plus 12 hex characters, the API makes its own and ignores the sent one.

## Success Envelope

Every success body is an object with `success: true` and `data`. Lists add `meta`. Nothing is ever returned as a bare array, because a bare array leaves no room to add `meta` later.

```json
{
  "success": true,
  "data": {
    "id": "9f1c8a02-5d3b-4e71-9c2a-3b7f1d6e8a10",
    "admissionNo": "BF-2027-0142",
    "firstName": "Aarav",
    "lastName": "Sharma",
    "status": "ACTIVE",
    "dateOfBirth": "2011-08-14",
    "campusId": "3a6e1b90-77c4-4f2e-8d15-9c0b2a4d6e88",
    "createdAt": "2027-04-02T05:31:22.418Z"
  }
}
```

A list puts the rows in `data` and the counters in `meta`.

```json
{
  "success": true,
  "data": [
    { "id": "9f1c8a02-...", "admissionNo": "BF-2027-0142", "firstName": "Aarav" },
    { "id": "b2d4e6f8-...", "admissionNo": "BF-2027-0143", "firstName": "Isha" }
  ],
  "meta": { "page": 1, "limit": 20, "total": 134, "totalPages": 7 }
}
```

| Field | Type | Always present | Meaning |
|---|---|---|---|
| `success` | boolean | Yes | `true` on 2xx, `false` on 4xx and 5xx |
| `data` | object or array | Yes | The row, the list, or the action result |
| `meta.page` | number | Lists | Page asked for, starts at 1 |
| `meta.limit` | number | Lists | Rows per page, maximum 100 |
| `meta.total` | number | Lists | Rows that match the filters |
| `meta.totalPages` | number | Lists | `ceil(total / limit)` |

An action that changes state but creates no row still returns the row it changed, so the client can refresh its cache without a second `GET`. `POST /students/:id/change-status` returns the updated student.

## Error Envelope and Error Codes

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "This student already has an active enrollment in batch 10-A",
    "details": [
      { "field": "batchId", "issue": "Enrollment EN-2027-0455 is still ACTIVE" }
    ]
  },
  "requestId": "req_8f3a2c71d94e"
}
```

`code` is for machines and never changes. `message` is for humans, is already translated for `Accept-Language`, and may change at any time. `details` is optional and is an array of `{ field, issue }` objects. `requestId` is always present and matches the `X-Request-Id` response header.

| Code | Status | Use it when | Retry helps |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Body, query or path failed the Zod schema | No |
| `UNAUTHENTICATED` | 401 | No token, bad token, bad signature, bad API key | No |
| `TOKEN_EXPIRED` | 401 | Access token is past 15 minutes; refresh and retry | Yes |
| `FORBIDDEN` | 403 | Signed in, but the permission key or scope is missing | No |
| `PLAN_LIMIT_REACHED` | 403 | Student, campus, user or feature limit of the plan | No |
| `NOT_FOUND` | 404 | Row missing, soft deleted, or in another tenant | No |
| `CONFLICT` | 409 | Unique key clash, stale `If-Match`, idempotency clash | Sometimes |
| `BUSINESS_RULE_VIOLATION` | 422 | Shape is valid, the domain rule says no | No |
| `RATE_LIMITED` | 429 | Too many calls; obey `Retry-After` | Yes |
| `INTERNAL_ERROR` | 500 | Unhandled fault; the real cause is only in the logs | Yes |
| `SERVICE_UNAVAILABLE` | 503 | Dependency down or maintenance window | Yes |

The client decides what to do from `code` alone. `TOKEN_EXPIRED` triggers one silent refresh and one retry. `RATE_LIMITED` triggers a wait of `Retry-After` seconds. `INTERNAL_ERROR` and `SERVICE_UNAVAILABLE` trigger up to three retries with exponential backoff of 1, 2 and 4 seconds plus random jitter, and only for `GET` or for a `POST` that carries an `Idempotency-Key`. Every other code is shown to the user.

> **Warning:** `message` never contains a database error, a SQL fragment, a stack trace, a file path, an internal id of another tenant, or personal data such as a phone number. A caught fault is logged with the full detail and answered with a flat `INTERNAL_ERROR` plus the `requestId`.

### Validation error details

A `VALIDATION_ERROR` always fills `details`, one entry per bad field, in the order the Zod schema declares them. `field` uses dot and bracket paths that match the request body exactly, so the web form can highlight the right input.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are not correct",
    "details": [
      { "field": "phone", "issue": "Enter a 10-digit Indian mobile number" },
      { "field": "dateOfBirth", "issue": "Date must be in the past" },
      { "field": "guardians[0].relation", "issue": "Choose one of FATHER, MOTHER, GUARDIAN" }
    ]
  },
  "requestId": "req_8f3a2c71d94e"
}
```

| Path style | Example | Points at |
|---|---|---|
| Plain field | `phone` | `body.phone` |
| Nested object | `address.city` | `body.address.city` |
| Array item | `guardians[0].relation` | First guardian in the array |
| Query parameter | `query.limit` | `?limit=500` |
| Path parameter | `params.id` | `/students/not-a-uuid` |

> **Rule:** `VALIDATION_ERROR` is only for shape: type, length, format, required, enum membership. "The invoice is already paid" is not a shape problem; it is `BUSINESS_RULE_VIOLATION` with status 422. This split lets the web app show field errors under inputs and rule errors in a toast.

## Lists: Pagination, Sorting, Filtering and Search

Every list endpoint accepts the same four query families. A client that can read `/students` can read `/fee-invoices` without new learning.

| Parameter | Default | Rules |
|---|---|---|
| `page` | `1` | Integer, 1 or more |
| `limit` | `20` | Integer, 1 to 100; over 100 gives `VALIDATION_ERROR` |
| `sort` | Per endpoint | Field name, `-` prefix for descending |
| `q` | none | Free text search, 2 to 100 characters |
| Field filters | none | Exact match on an allow-listed field |

```http
GET /api/v1/students?page=2&limit=20&sort=-admissionDate&status=ACTIVE
  &campusId=3a6e1b90-77c4-4f2e-8d15-9c0b2a4d6e88&q=aarav HTTP/1.1
Host: api.eduflow.app
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Accept-Language: en-IN
```

**Pagination.** EduFlow uses page numbers, not cursors, because every list screen shows "Page 2 of 7" and lets the user jump. The `total` count is a second `COUNT(*)` query on the same filters. When `page` is past the last page, the API answers `200` with an empty `data` array, not `404`.

**Sorting.** `sort=admissionDate` is ascending, `sort=-admissionDate` is descending. Only fields on the endpoint's allow-list are accepted; anything else is `VALIDATION_ERROR` with `field: "query.sort"`. Multi-field sort uses commas: `sort=-status,lastName`. Every list adds `id` as the last tie-breaker inside the service, so two pages never show the same row twice.

**Filtering.** Filters are exact matches on indexed columns, named exactly as the JSON field: `status=ACTIVE`, `batchId=<uuid>`, `academicYearId=<uuid>`. Three suffix forms cover the rest.

| Form | Example | Meaning |
|---|---|---|
| Repeat or comma | `status=ACTIVE,INACTIVE` | Value is in the list |
| `_from` and `_to` | `admissionDate_from=2027-04-01` | Range, both ends included |
| `_isNull` | `rfidCardNo_isNull=true` | Column is null |

**Search.** `q` is a trigram contains-search on the columns named by the module. For students those columns are `firstName`, `lastName` and `admissionNo`, backed by the GIN index `idx_students_search_trgm`. Search is case-insensitive and accent-insensitive. `q` and field filters are combined with AND. Typeahead boxes call the dedicated lookup route `GET /students/lookup` instead, which returns at most 10 slim rows and never a `meta` block.

## Sparse Fields and Includes

Two optional parameters keep payloads small on mobile networks, where a parent in Patna may be on a weak 4G signal.

| Parameter | Example | Effect |
|---|---|---|
| `fields` | `fields=id,firstName,admissionNo` | Only these keys are returned |
| `include` | `include=guardians,currentBatch` | Adds named related objects |

`id` is always returned even when `fields` leaves it out, because the client needs a key. `include` accepts only the relation names the endpoint documents; an unknown name is `VALIDATION_ERROR`. Includes never nest: `include=guardians.user` is rejected. Each include is a separate Prisma `include` branch, so no include ever turns into an N+1 query loop.

> **Best practice:** The list screen asks for `fields` and no includes. The detail screen asks for everything. This cuts the students list payload for Bright Future Public School from about 180 KB to about 28 KB for 20 rows.

## Data Formats in JSON

| Type | JSON form | Example | Notes |
|---|---|---|---|
| Id | string, UUID v4 | `"9f1c8a02-5d3b-4e71-..."` | Lower case, with hyphens |
| Timestamp | string, ISO 8601 UTC | `"2027-04-02T05:31:22.418Z"` | Always UTC, always `Z`, milliseconds |
| Calendar date | string, `YYYY-MM-DD` | `"2027-04-02"` | No time, no zone; `@db.Date` columns |
| Time of day | string, `HH:mm` | `"09:15"` | 24-hour, campus local time |
| Money | string, fixed decimals | `"12000.00"` | Never a JSON number |
| Currency | string, ISO 4217 | `"INR"` | Always beside the amount |
| Percent | number | `10.5` | Means 10.5 percent, not 0.105 |
| Boolean | boolean | `true` | Never `"true"`, never `1` |
| Enum | string, UPPER_SNAKE_CASE | `"ACTIVE"` | Exactly the Prisma enum value |
| Phone | string, E.164 | `"+919876543210"` | Country code always included |
| Empty value | `null` | `"lastName": null` | Never `""`, never a missing key |

Money is a string because `Decimal(12, 2)` does not survive a JavaScript number. `1099.15` stored as a float becomes `1099.1499999999999` in the browser, and a fee receipt that is one paisa wrong destroys trust. The API sends `"1099.15"`, the client formats it with `Intl.NumberFormat('en-IN')` for display, and any arithmetic uses `decimal.js`.

```json
{
  "invoiceNo": "INV-2027-0912",
  "currency": "INR",
  "totalAmount": "12000.00",
  "paidAmount": "5000.00",
  "balanceAmount": "7000.00",
  "dueDate": "2027-07-10",
  "issuedAt": "2027-06-25T09:12:04.007Z"
}
```

Timestamps are always UTC on the wire. The organization timezone, for example `Asia/Kolkata`, is applied by the client for display and by report queries on the server. Never send a local time without a zone. Pure calendar dates carry no zone at all, because a date of birth does not shift when a parent opens the app from Dubai.

Enum values are the Prisma enum values, never numbers and never display labels. `GET /reference-data/enums` returns the labels for dropdowns in the caller's language, so the API stays stable while the Hindi label changes. Adding a value to an enum is not a breaking change, so clients must have a default branch.

## Bulk Endpoints and Partial Success

A bulk endpoint changes many rows in one call. It is always a `POST` to a `bulk-<verb>` path, it takes at most 500 ids, and it reports every id it touched. Examples from the registry: `POST /students/bulk-update` (STU-API-38), `POST /enrollments/bulk-promote` (STU-API-39), `POST /attendance-sessions/bulk-lock` (ATT-API-09), `POST /report-cards/bulk-publish` (RPT-API-21).

Bulk calls do not use one giant transaction. One bad row would roll back 499 good rows, and a teacher would have to find the bad one by hand. Instead each row runs in its own short transaction, and the response reports each result.

```http
POST /api/v1/students/bulk-update HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "ids": ["9f1c8a02-...", "b2d4e6f8-...", "c7a9d1b3-..."],
  "changes": { "house": "Tagore", "category": "GENERAL" }
}
```

A bulk call always answers `200`, even when some rows failed, because the call itself succeeded. The caller reads `meta.failed` to decide what to show.

```json
{
  "success": true,
  "data": {
    "results": [
      { "id": "9f1c8a02-...", "status": "OK" },
      { "id": "b2d4e6f8-...", "status": "OK" },
      {
        "id": "c7a9d1b3-...",
        "status": "FAILED",
        "error": {
          "code": "BUSINESS_RULE_VIOLATION",
          "message": "Student left on 12 Mar 2027 and cannot be edited"
        }
      }
    ]
  },
  "meta": { "requested": 3, "succeeded": 2, "failed": 1 }
}
```

| Rule | Value |
|---|---|
| Maximum ids per call | 500, else `VALIDATION_ERROR` |
| Duplicate ids | Silently collapsed to one, counted once |
| Id from another tenant | Reported as `FAILED` with `NOT_FOUND`, never leaks |
| Transaction scope | One row, one transaction |
| Response order | Same order as the `ids` array |
| Status when all rows fail | Still `200` with `meta.succeeded` equal to 0 |
| Audit log | One entry per changed row, one `requestId` for all |

> **Tip:** The web app shows "2 of 3 students updated. 1 could not be updated." with a link that lists the failed rows and their reasons. Never show a green toast when `meta.failed` is above zero.

## Asynchronous Jobs

Some work is too slow for one HTTP request: importing 1,200 students from Excel, exporting the fee defaulter register, generating 350 report card PDFs. These endpoints accept the request, put a job on a BullMQ queue and answer `202` at once.

**Figure: The 202 job pattern**

```mermaid
sequenceDiagram
    participant C as Client
    participant API as API
    participant Q as Queue
    participant W as Worker
    C->>API: "POST /students/import"
    API->>Q: "enqueue importJobId"
    API-->>C: "202 QUEUED"
    loop "every 3 seconds"
        C->>API: "GET /import-jobs/:id"
        API-->>C: "status, row counts"
    end
    Q->>W: "job"
    W->>W: "rows, error file"
    W-->>API: "COMPLETED_WITH_ERRORS"
    C->>API: "GET error-file"
    API-->>C: "pre-signed URL"
```

The `202` body carries the job id and the URL the client should poll.

```json
{
  "success": true,
  "data": {
    "jobId": "5e2b7c41-8a09-4d66-b3f1-0c9e7a2d5b84",
    "jobType": "IMPORT",
    "status": "QUEUED",
    "statusUrl": "/api/v1/import-jobs/5e2b7c41-8a09-4d66-b3f1-0c9e7a2d5b84",
    "pollAfterSeconds": 3
  }
}
```

| Job kind | Start endpoint | Status endpoint | Result |
|---|---|---|---|
| Import | `POST /students/import` | `GET /import-jobs/:id` | Rows created, error workbook |
| Export | `POST /students/export` | `GET /export-jobs/:id` | File link from `/download-url` |
| PDF batch | `POST /report-cards/bulk-download` | `GET /export-jobs/:id` | Merged PDF or ZIP |
| ID cards | `POST /students/id-cards` | `GET /export-jobs/:id` | PDF sheet |
| Bulk remind | `POST /fee-invoices/bulk-remind` | `GET /import-jobs/:id` | Queued message count |

Job status uses the `JobStatus` enum: `QUEUED`, `PROCESSING`, `COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`, `CANCELLED`. The client stops polling on any of the last four. An export file link expires at `expiresAt`, normally 24 hours after the job finishes, and the worker then purges the S3 object.

Polling uses a fixed 3-second interval for the first minute, then 10 seconds. The client stops after 30 minutes and tells the user to open the Imports screen later. Every job row keeps `organizationId`, so a poll from another tenant gets `404`.

## File Upload with Pre-Signed URLs

Files never travel through the Express API. The API caps bodies at 1 MB; a student photo or a scanned Aadhaar card goes straight to the private S3 bucket in `ap-south-1` using a short-lived pre-signed URL. This keeps the API fast, keeps the file out of the application logs, and keeps the data in India.

**Figure: Upload of a student document**

```mermaid
sequenceDiagram
    participant B as Browser
    participant API as API
    participant S3 as S3
    participant AV as Scanner
    B->>API: "POST /files/presign-upload"
    API->>API: "check MIME and size"
    API-->>B: "fileId, pre-signed PUT URL"
    B->>S3: "PUT the bytes"
    S3-->>B: "200 OK"
    B->>API: "POST /files/:id/confirm"
    API->>AV: "queue virus scan"
    AV-->>API: "ACTIVE or QUARANTINED"
    B->>API: "POST /students/:id/documents"
    API-->>B: "201 StudentDocument"
```

| Step | Endpoint | What it checks |
|---|---|---|
| Ask for a URL | `POST /files/presign-upload` (CMN-API-02) | MIME allow-list, size cap, `files.create` |
| Upload | Pre-signed `PUT` to S3 | The signature and the 15-minute expiry |
| Confirm | `POST /files/:id/confirm` (CMN-API-05) | Real size, SHA-256 checksum, virus scan |
| Attach | Module endpoint, for example STU-API-25 | The caller may edit the owning record |
| Download | `GET /files/:id/download-url` (CMN-API-06) | Access to the owning record; logged |

Limits: images up to 5 MB (`image/jpeg`, `image/png`, `image/webp`), documents up to 10 MB (`application/pdf`), import sheets up to 25 MB (`.xlsx`, `.csv`). A file that is never confirmed stays `PENDING_UPLOAD` and is deleted by the purge worker after 24 hours. A file that fails the scan becomes `QUARANTINED` and can never be downloaded. Download URLs live 5 minutes and are generated per request, so a link copied out of the browser dies quickly.

## Idempotency

An idempotent call can be sent twice and still change the system once. This matters most for money. A parent on a weak connection taps Pay twice; the counter clerk double-clicks Collect. Without idempotency, Sharma Classes would issue two receipts of Rs 12,000 for one payment.

Every POST that creates money requires the `Idempotency-Key` header. The registry marks them `(IK)`.

| Endpoint | ID | Why the key is required |
|---|---|---|
| `POST /payments` | PAY-API-02 | Counter payment plus receipt |
| `POST /payment-orders` | PAY-API-13 | Gateway order for online payment |
| `POST /refunds` | PAY-API-19 | Money leaving the institute |
| `POST /portal/parent/payment-orders` | PP-API-16 | Parent checkout |
| `POST /portal/student/payment-orders` | SP-API-20 | Student checkout |
| `POST /subscriptions/checkout` | ORG-API-17 | EduFlow subscription payment |
| `POST /subscription-invoices/:id/pay` | ORG-API-25 | EduFlow invoice payment |
| `POST /add-ons` | ORG-API-28 | Add-on purchase |
| `POST /whatsapp-wallet/top-ups` | WA-API-22 | WhatsApp credit pack |
| `POST /sms-wallet/top-ups` | SMS-API-17 | SMS pack |

The rules are short and strict.

1. The client generates the key, normally a UUID v4, once per user action. A retry of the same action reuses the same key. A new action always uses a new key.
2. The key is 16 to 100 characters. A missing or short key on an `(IK)` endpoint is `VALIDATION_ERROR`.
3. The key is stored on the created row: `payments.idempotency_key`, `payment_orders.idempotency_key`, `refunds.idempotency_key`, each with `@@unique([organizationId, idempotencyKey])`. The database, not the application, is the guard.
4. Same key plus same request body returns the first result again, with the original status code. Nothing new is created.
5. Same key plus a different body returns `409 CONFLICT` with the message "This key was already used for a different request".
6. Keys are scoped to the organization and are honoured for 24 hours. After that a repeat is treated as a new request, which is safe because gateway retries never take a day.
7. `GET`, `PUT`, `PATCH` and `DELETE` need no key. They are naturally idempotent: the same `PATCH` body twice leaves the same row.

```typescript
// server/src/middleware/idempotency.ts (shortened)
export const idempotency: RequestHandler = (req, _res, next) => {
  const key = req.header('Idempotency-Key');
  if (!key || key.length < 16 || key.length > 100) {
    throw new ApiError('VALIDATION_ERROR', 'Idempotency-Key header is required', [
      { field: 'Idempotency-Key', issue: 'Send 16 to 100 characters' },
    ]);
  }
  req.idempotencyKey = key;
  next();
};
```

The service writes the key inside the same transaction as the payment. When PostgreSQL raises the unique violation `P2002`, the service reads the first row and returns it, so the second click sees the same receipt number instead of an error.

## Rate Limiting

Rate limits protect the shared database from one noisy tenant and slow down credential stuffing. Counters live in Redis 7 as fixed windows, keyed per user, per organization, per IP or per API key.

| Scope | Limit | Window | Key |
|---|---|---|---|
| Signed-in user | 100 requests | 1 minute | `rl:user:<userId>` |
| Organization | 1,000 requests | 1 minute | `rl:org:<orgId>` |
| Login attempts | 5 attempts | 15 minutes | `rl:login:<accountId>:<ip>` |
| Public routes by IP | 30 requests | 1 minute | `rl:ip:<ip>` |
| OTP requests | 5 requests | 1 hour | `rl:otp:<phone>` |
| API key | `rateLimitPerMin`, default 100 | 1 minute | `rl:key:<apiKeyId>` |
| Import and export starts | 10 jobs | 1 hour | `rl:job:<orgId>` |

Every response, not only a rejected one, carries the three `X-RateLimit-*` headers, so a well-written integration can slow itself down before it is blocked.

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1806403260
Retry-After: 23
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again in 23 seconds."
  },
  "requestId": "req_1d90fe33ab4c"
}
```

Webhook receivers from Razorpay, Stripe, Meta, MSG91, Twilio and SES are limited by IP at a much higher ceiling and are never blocked by the per-user rule, because they carry no user. A `SUPER_ADMIN` acting inside a tenant is counted against the platform bucket, not against the customer's 1,000 per minute, so support work never uses up a school's quota.

## Caching and ETags

Most EduFlow data changes every minute, so the default is `Cache-Control: no-store`. Three kinds of responses are worth caching, and they use strong ETags.

| Response | Cache-Control | ETag source |
|---|---|---|
| `GET /reference-data/enums` | `public, max-age=3600` | Build version hash |
| `GET /countries`, `GET /currencies` | `public, max-age=86400` | Row count plus max `updatedAt` |
| `GET /students/:id` and other single rows | `private, no-cache` | SHA-256 of the response body |
| Lists and dashboards | `no-store` | None |
| Anything with money or marks | `no-store` | None |

An ETag is a quoted hash of the response body. The client stores it and sends it back on the next read.

```http
GET /api/v1/students/9f1c8a02-5d3b-4e71-9c2a-3b7f1d6e8a10 HTTP/1.1
If-None-Match: "8f3a2c71d94e6b05"

HTTP/1.1 304 Not Modified
ETag: "8f3a2c71d94e6b05"
```

A `304` has no body, so the parent app on a slow connection spends about 200 bytes instead of 4 KB. `private` means a shared proxy must never store the response, because it holds one tenant's data. Nothing that contains personal data is ever `public`.

The same ETag also powers optimistic concurrency on edits. A `PATCH` may carry `If-Match` with the ETag the user's screen was built from. If the row changed in between, the API answers `409 CONFLICT` with the message "Someone else changed this record. Reload and try again." This stops two clerks from overwriting each other on the same student profile.

## Outbound Webhooks for Enterprise Customers

Enterprise customers can receive EduFlow events on their own server, for example to push every new admission into a legacy accounting system. Inbound webhooks that EduFlow receives from Razorpay, Meta and MSG91 are a different thing and are covered in *Integrations and Webhooks*.

> **Note:** Assumption. The endpoint registry has no self-service subscription routes yet. In Year 1 an EduFlow engineer registers the customer's URL, and self-service screens arrive with the Enterprise pack. The contract below is fixed now so that customers built against it never have to change.

The payload reuses the domain event envelope from *Background Jobs and Events*, so one event shape serves the internal queue and the customer.

```json
{
  "id": "evt_7c41d5e2b809",
  "type": "student.admitted",
  "occurredAt": "2027-04-02T05:31:22.418Z",
  "organizationId": "1b7e0f44-2c8d-4a13-9f6b-5d0e3c8a71f2",
  "campusId": "3a6e1b90-77c4-4f2e-8d15-9c0b2a4d6e88",
  "actor": { "type": "USER", "id": "a90c...", "name": "Suresh Gupta" },
  "data": { "studentId": "9f1c8a02-...", "admissionNo": "BF-2027-0142" }
}
```

| Header | Example | Meaning |
|---|---|---|
| `X-EduFlow-Event` | `student.admitted` | Event type, same as `type` |
| `X-EduFlow-Delivery` | `dlv_3f81a0c7` | Unique id of this delivery attempt |
| `X-EduFlow-Timestamp` | `1806403260` | Unix seconds when we signed it |
| `X-EduFlow-Signature` | `v1=9a7f...` | HMAC-SHA256 hex, per-endpoint secret |

The signed string is `timestamp + "." + rawBody`. The receiver recomputes the HMAC with its secret, compares with a constant-time compare, and rejects anything older than five minutes to stop replay.

```typescript
// Example the customer runs (Express 5, raw body required)
import crypto from 'node:crypto';

export function verify(raw: Buffer, ts: string, sig: string, secret: string): boolean {
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const expected = 'v1=' + crypto.createHmac('sha256', secret)
    .update(`${ts}.${raw.toString('utf8')}`).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}
```

Delivery rules: we expect `2xx` within 5 seconds; anything else is retried 6 times at 1 minute, 5, 30, 2 hours, 6 hours and 24 hours. The same `X-EduFlow-Delivery` id is reused on every retry, so the receiver can drop duplicates. Two secrets can be active at once during rotation. After 6 failed attempts the endpoint is paused and EduFlow emails the customer's technical contact.

## API Keys

Enterprise plans get server-to-server keys instead of a user login. A key is a row in `api_keys`: the full secret is shown once at creation and only the SHA-256 `keyHash` is stored, next to `keyPrefix` such as `ef_live_8f3a` for the screen.

| Rule | Value |
|---|---|
| Header | `X-Api-Key: ef_live_8f3a...` |
| Managed by | SET-API-44 to SET-API-48, key `settings.manage_api_keys` |
| Power | Only the permission keys in `scopes`, never more |
| Network | Optional CIDR allow-list in `allowedIps` |
| Rate limit | `rateLimitPerMin`, default 100 |
| Expiry | Optional `expiresAt`; rotation issues a new secret |
| Audit | Every call is logged with the key id as the actor |

A key never reaches parent, student or portal routes, and it can never call `/auth/...` or `/platform/...`. A revoked or expired key answers `UNAUTHENTICATED`. Keys are shown in the UI as the prefix plus `lastUsedAt` and `lastUsedIp`, so an unused key is easy to spot and revoke.

## OpenAPI and the Contract-First Workflow

The OpenAPI document is generated, never hand-written. Zod schemas in `shared/` are the single definition of every request and response, and `zod-to-openapi` turns them into the specification. If the code and the document disagree, the build fails.

| Step | What happens |
|---|---|
| 1 | Add the endpoint row to `docs/api/<group>.md` with its ID, path and permission key |
| 2 | Write the Zod request and response schemas in `shared/src/schemas/` |
| 3 | Register the route with `describeRoute` so it joins the specification |
| 4 | Write the service, the repository and the tests |
| 5 | CI regenerates `openapi.json` and fails on an undocumented route |
| 6 | Swagger UI at `/api/v1/docs` serves the document; Redoc builds the PDF reference |

CI also runs a contract diff between the branch's `openapi.json` and the one on `main`. Any change in the breaking list from the version rules above fails the pipeline unless the pull request carries the label `api-breaking`, which forces a human decision. The generated client types are published to the Next.js app from the same document, so the web app cannot call a field that does not exist.

## Deprecation Policy

| Stage | Duration | What customers see |
|---|---|---|
| Announce | Day 0 | Release notes, email to Enterprise API users, `deprecated: true` in OpenAPI |
| Warn | 90 days | `Deprecation: true` and `Sunset: <date>` headers on every response |
| Nag | Last 30 days | Weekly email listing the calls their key still makes |
| Retire | After the sunset date | `410 Gone` with the replacement path in the message |

Nothing is ever removed without a working replacement that is live first. Both endpoints run side by side for the whole 90 days. Internal EduFlow clients are migrated in week one, so the only remaining callers are customers we can name from the `api_keys` usage log. A `410` body still uses the canon envelope, with `code: "NOT_FOUND"` and a message such as "This endpoint retired on 1 Mar 2028. Use POST /students/bulk-update."

## Worked Example: Admit a Student

STU-API-02, `POST /students`, permission `students.create`. Every rule above appears once: naming, Zod validation, permission and plan check, envelope, `201` with `Location`, and the error table.

```typescript
// shared/src/schemas/student.schema.ts
import { z } from 'zod';

export const createStudentSchema = z.object({
  campusId: z.string().uuid(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).nullish(),
  dateOfBirth: z.string().date(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']),
  admissionDate: z.string().date(),
  batchId: z.string().uuid(),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/).optional(),
  guardians: z.array(z.object({
    fullName: z.string().min(1).max(120),
    phone: z.string().regex(/^\+91[6-9]\d{9}$/),
    relation: z.enum(['FATHER', 'MOTHER', 'GUARDIAN']),
    isPrimary: z.boolean().default(false),
  })).min(1),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
```

```typescript
// server/src/modules/students/students.routes.ts
studentsRouter.post(
  '/',
  requirePermission('students.create'),
  validate({ body: createStudentSchema }),
  controller.createStudent,
);

// server/src/modules/students/students.controller.ts
export const createStudent: RequestHandler = async (req, res) => {
  const student = await service.createStudent(req.tenant, req.body as CreateStudentInput);
  res.status(201)
    .location(`/api/v1/students/${student.id}`)
    .json({ success: true, data: toStudentDto(student) });
};
```

```typescript
// server/src/modules/students/students.service.ts
export async function createStudent(tenant: TenantContext, input: CreateStudentInput) {
  await assertCampusAllowed(tenant, input.campusId);
  await assertPlanLimit(tenant, 'students');           // throws PLAN_LIMIT_REACHED

  const batch = await repo.findBatch(input.batchId);
  if (!batch) throw new ApiError('NOT_FOUND', 'Batch not found');
  if (batch.enrolledCount >= batch.capacity) {
    throw new ApiError('BUSINESS_RULE_VIOLATION', 'This batch is full');
  }

  return prisma.$transaction(async (tx) => {
    const admissionNo = await nextNumber(tx, tenant, 'STUDENT_ADMISSION');
    const student = await tx.student.create({
      data: {
        campusId: input.campusId,
        admissionNo,
        firstName: input.firstName,
        lastName: input.lastName ?? null,
        dateOfBirth: new Date(input.dateOfBirth),
        gender: input.gender,
        admissionDate: new Date(input.admissionDate),
        currentBatchId: batch.id,
        phone: input.phone ?? null,
        createdById: tenant.userId,
      },
    });
    await linkGuardians(tx, student.id, input.guardians);
    await tx.enrollment.create({ data: enrollmentFor(student, batch) });
    await outbox(tx, 'student.admitted', { studentId: student.id, admissionNo });
    return student;
  });
}
```

The Prisma client extension adds `organizationId` to every write, so the service never sets it by hand and can never write into the wrong tenant. The event goes to the outbox inside the transaction and is published only after commit.

```json
{
  "success": true,
  "data": {
    "id": "9f1c8a02-5d3b-4e71-9c2a-3b7f1d6e8a10",
    "admissionNo": "BF-2027-0142",
    "firstName": "Aarav",
    "lastName": "Sharma",
    "status": "ACTIVE",
    "dateOfBirth": "2011-08-14",
    "admissionDate": "2027-04-02",
    "currentBatchId": "7d2f5b18-...",
    "createdAt": "2027-04-02T05:31:22.418Z"
  }
}
```

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad phone, future date of birth, no guardian |
| 401 | `UNAUTHENTICATED` | Missing or bad access token |
| 401 | `TOKEN_EXPIRED` | Token older than 15 minutes |
| 403 | `FORBIDDEN` | No `students.create`, or campus not assigned |
| 403 | `PLAN_LIMIT_REACHED` | Starter plan already has 50 active students |
| 404 | `NOT_FOUND` | `batchId` or `campusId` not in this organization |
| 409 | `CONFLICT` | Admission number already used, retry issues the next |
| 422 | `BUSINESS_RULE_VIOLATION` | Batch is full, or the academic year is closed |
| 429 | `RATE_LIMITED` | Over 100 calls in a minute |
| 500 | `INTERNAL_ERROR` | Unhandled fault; `requestId` is in the logs |

## API Review Checklist

Run this list in every pull request that touches a route. A No anywhere blocks the merge.

| # | Check |
|---|---|
| 1 | Path is plural kebab-case, one nesting level, and matches the registry row |
| 2 | Endpoint ID and permission key are exactly the ones in `docs/api/` |
| 3 | Method fits the action; `PUT` only replaces a whole set |
| 4 | Zod schema covers body, query and params; unknown keys are stripped |
| 5 | Success status is right; `201` sends a `Location` header |
| 6 | Response uses the envelope; a list has `meta` with all four counters |
| 7 | Errors use canon codes only; no custom code, no leaked internals |
| 8 | Cross-tenant and soft-deleted rows return `404`, not `403` |
| 9 | Campus scope and `X-Campus-Id` are checked against `user_campuses` |
| 10 | Plan limits and plan features are checked before writing |
| 11 | Money is a string with a currency; dates are UTC or plain dates |
| 12 | List has `page`, `limit`, `sort`, `q`, an allow-list, and an index behind it |
| 13 | Money-creating POST requires `Idempotency-Key` and a unique key on the table |
| 14 | Writes run in one transaction; events go through the outbox |
| 15 | Audit log entry is written for create, update, delete and sensitive reads |
| 16 | OpenAPI regenerates cleanly; the contract diff shows no breaking change |
| 17 | Tests cover happy path, validation, permission denied and tenant isolation |
