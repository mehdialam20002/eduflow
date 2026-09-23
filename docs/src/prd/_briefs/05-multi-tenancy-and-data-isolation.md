# Brief for 05-multi-tenancy-and-data-isolation.md

Title: Multi-Tenancy and Data Isolation
Minimum words: 3400
Web research needed: no

## What this chapter must cover (every item, fully)

Why shared database with organization_id (comparison table against schema-per-tenant and database-per-tenant, with the migration path for very large or regulated tenants). Tenant resolution (JWT orgId claim, subdomain, X-Organization-Id for SUPER_ADMIN only). The tenant context implementation with AsyncLocalStorage and a Prisma client extension (TypeScript code example that injects organizationId into where/create and blocks unscoped queries). PostgreSQL Row-Level Security as the second layer: SQL for enabling RLS, policies using current_setting('app.current_org'), how the API sets it per transaction, the migration-role bypass, and the performance notes. Campus scoping rules. Per-tenant unique keys and indexes. Tenant-safe caching, queues (jobs carry organizationId), file paths in S3 (org/<id>/...), logs and analytics. Cross-tenant operations allowed only in the platform console with audit. Noisy-neighbour protection (per-tenant rate limits, job concurrency, query timeouts). Tenant lifecycle: create, suspend, export, delete (retention schedule). The mandatory tenant-isolation test suite. A threat table: how data could leak and the control that stops it.
