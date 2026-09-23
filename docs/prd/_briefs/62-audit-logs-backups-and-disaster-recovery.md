# Brief for 62-audit-logs-backups-and-disaster-recovery.md

Title: Audit Logs, Backups and Disaster Recovery
Minimum words: 3000
Web research needed: no

## What this chapter must cover (every item, fully)

Audit logging: what is logged (auth events, permission changes, money actions, marks and result changes, attendance edits after lock, data exports, impersonation, settings changes), the AuditLog model fields, before/after snapshots with sensitive-field masking, how to write audit entries (middleware plus explicit service calls, TypeScript example), immutability (append-only, no update/delete permissions, optional hash chain), retention and partitioning, the audit log viewer screen (ASCII wireframe) with filters and export, alerts on suspicious patterns. Backups: PostgreSQL automated backups and point-in-time recovery, daily logical dumps to a separate account/bucket, S3 versioning and lifecycle, Redis persistence stance (rebuildable), configuration backups, encryption, retention table, restore testing monthly with a runbook, single-tenant restore procedure (restore to a scratch database, export the tenant's rows, import) step by step. Disaster recovery: RPO/RTO targets by scaling stage, failure scenarios table (database loss, region outage, bad migration, accidental mass delete, ransomware/credential leak, provider outage) with detection, response and recovery steps, DR drill checklist, communication plan. Business continuity for customers (offline fallbacks such as printable attendance sheets and manual receipts to enter later).
