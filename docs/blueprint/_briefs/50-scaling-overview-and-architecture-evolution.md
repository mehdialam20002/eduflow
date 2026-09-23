# Brief for 50-scaling-overview-and-architecture-evolution.md

Title: Scaling Overview and Architecture Evolution
Minimum words: 3000
Web research needed: no

## What this chapter must cover (every item, fully)

The big picture of growing from 0 to 10,000 customers across the four canon stages. Principles (do not over-engineer early; measure, then scale the bottleneck; keep the monolith modular; tenant safety at every stage). Load model: translate customers into numbers at each stage (students, parents, staff users, daily attendance records, monthly invoices, payments, WhatsApp messages, peak requests per second at 9–10 am attendance time and fee due dates, database size growth per year, S3 storage) in a table with formulas and labelled assumptions. Architecture at each stage as four mermaid flowcharts: Stage 1 (Vercel + Railway single API, single worker, one Postgres, Redis), Stage 2 (multiple API replicas, separate workers by queue, read-heavy caching, connection pooling, CDN, managed backups, staging parity), Stage 3 (AWS, Multi-AZ RDS + read replica, autoscaling ECS, queue separation, table partitioning for attendance/audit/message logs, search service, reporting from replica, WAF), Stage 4 (regional deployments for international, tenant sharding or database-per-region with a tenant directory, dedicated DB for enterprise tenants, event streaming, data warehouse for analytics/AI, SRE practices, SOC 2/ISO 27001). Evolution table: component × stage (hosting, database, cache, queues, files, search, analytics, observability, security, CI/CD, support tooling). Migration triggers and metrics gates for moving to the next stage. Cost per customer by stage (labelled estimates). What stays the same (the codebase shape, API contracts, tenant model).
