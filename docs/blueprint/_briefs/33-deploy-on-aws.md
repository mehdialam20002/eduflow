# Brief for 33-deploy-on-aws.md

Title: Deploy on AWS
Minimum words: 3000
Web research needed: no

## What this chapter must cover (every item, fully)

When to move to AWS (triggers: 300–500 customers, need for VPC/private DB, compliance asks, cost crossover, Mumbai region latency and data residency ap-south-1) and how. Target architecture (mermaid flowchart): Route 53 → CloudFront → (Vercel or S3/Next on ECS) ; ALB → ECS Fargate services (api, worker) in private subnets across 2 AZs → RDS PostgreSQL Multi-AZ + read replica later, ElastiCache Redis, S3, SES, Secrets Manager, CloudWatch, WAF, ECR. Step-by-step build order with a Terraform outline (module list and key resources; short HCL snippets for VPC, ECS service, RDS — keep correct and minimal), IAM least-privilege roles, security groups table, autoscaling policies (CPU and queue depth), RDS settings (instance sizes by stage, backups 7–35 days, PITR, parameter tweaks, connection pooling with PgBouncer or RDS Proxy and Prisma connection limits), zero-downtime migration plan from Railway Postgres to RDS (logical replication or dump/restore in a maintenance window — runbook with timings and rollback), blue/green or rolling deploys from GitHub Actions (OIDC role, build → ECR → update service), cost table by stage (500, 1,000, 10,000 customers — labelled estimates in $ and ₹), cost controls (Savings Plans, right-sizing, S3 lifecycle, log retention), multi-region plan for international tenants (separate regional stacks: me-central-1 or eu for UAE, us-east-1, ap-southeast-2; tenant → region routing), disaster recovery targets (RPO 15 min, RTO 1 hour at scale) and DR drill checklist.
