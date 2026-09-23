# Brief for 55-api-standards-and-conventions.md

Title: API Standards and Conventions
Minimum words: 3600
Web research needed: no

## What this chapter must cover (every item, fully)

The rules every endpoint follows, from the canon, explained with examples: base URL and versioning, resource naming, HTTP methods and status codes table, headers (Authorization, X-Campus-Id, X-Organization-Id for SUPER_ADMIN, Idempotency-Key, X-Request-Id, Accept-Language), success and error envelopes with JSON examples, the complete standard error code list with when to use each, validation error details format, pagination, sorting, filtering, search, sparse fields and includes, date/time and money formats in JSON, enums, bulk endpoints pattern with partial success reporting, async jobs pattern (202 + job status endpoint) for imports, exports and PDFs, file upload with pre-signed URLs (sequence diagram), idempotency rules, rate limiting with response headers, caching headers and ETags, webhooks that EduFlow sends to customers (Enterprise) with signature scheme, API keys, OpenAPI documentation and the contract-first workflow, deprecation policy, a complete worked example of one resource (students) from route to response in TypeScript (Express 5 + Zod + service + Prisma), and an API review checklist.
