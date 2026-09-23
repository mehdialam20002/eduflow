# Brief for 50-database-design-overview.md

Title: Database Design Overview
Minimum words: 3800
Web research needed: no

## What this chapter must cover (every item, fully)

How the database is organised, reading from `E:/mysaasschool/docs/src/_schema/README.md` and the schema files. Conventions from the canon with examples. Domain map table (schema file, domain, number of models, modules served). One mermaid erDiagram per domain (at most 8 entities each, key fields only): platform and tenancy, auth and RBAC, academics, people and admissions, attendance and leave, timetable and homework, exams and report cards, fees/discounts/scholarships, payments, communication, library and inventory, transport and hostel, payroll, certificates/analytics/AI. Key cross-domain relationships explained in words. Indexing strategy with examples of real list queries and the index that serves them. Constraints and data integrity rules (per-tenant unique keys, check constraints to add by SQL migration, immutable financial records). Soft delete rules. Enum strategy. JSON column usage rules. Migrations workflow with Prisma (expand and contract, zero downtime), seeding (reference data, permissions, system roles, demo tenants), RLS policies summary, partitioning and archival plan for large tables (attendance_records, audit_logs, message_logs, notifications), data retention table, backup pointer, estimated row counts and storage at 100, 1,000 and 10,000 customers.
