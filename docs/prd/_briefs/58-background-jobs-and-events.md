# Brief for 58-background-jobs-and-events.md

Title: Background Jobs and Events
Minimum words: 3000
Web research needed: no

## What this chapter must cover (every item, fully)

The internal event bus and job system. Domain event naming and envelope (JSON example with organizationId, actor, entity, payload, occurredAt). Complete domain event catalog table across all modules (collect the 'Events emitted' lines from all four registry files in `_api/`): event, producer module, consumers, typical reaction. Queues table (name, purpose, concurrency, retry policy, backoff, dead-letter handling, per-tenant fairness): notifications, whatsapp, sms, email, pdf, imports, exports, invoices, reminders, snapshots, webhooks, ai. Scheduled jobs table (cron time in organization timezone, job, what it does): monthly invoice generation, fee reminders, late fee application, attendance absent alerts, daily metric snapshots, subscription billing and dunning, document expiry alerts, birthday greetings, backups check, data retention purge, report schedules, AI risk scoring. Transactional outbox pattern so events are never lost (with Prisma transaction code example). Idempotent job handlers, job payload rules (IDs only, tenant inside), monitoring (BullMQ dashboard, alerts on failures and queue depth), graceful shutdown, and how to run workers locally and in production. Mermaid flow from API transaction to outbox to queue to provider to status update.
