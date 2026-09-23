# Brief for 32-deploy-on-vercel-and-railway.md

Title: Deploy on Vercel and Railway
Minimum words: 2600
Web research needed: no

## What this chapter must cover (every item, fully)

The launch hosting (canon: Vercel for client; Railway for API, worker, PostgreSQL, Redis). Why this choice for the first 100 customers (speed, low ops, cost) and its limits. Step-by-step: Vercel project setup for a monorepo (root directory client, build settings, env vars, preview deployments, custom domain app.eduflow.app + wildcard subdomains note), Railway project (services: api, worker, postgres, redis; monorepo root/Dockerfile settings; env vars and reference variables; private networking; healthchecks; custom domain api.eduflow.app; scaling replicas; volumes and backups for Postgres; enabling daily backups and testing a restore), running prisma migrate deploy on release, staging vs production projects, logs and metrics, cron jobs on Railway or BullMQ repeatable jobs, S3 + SES setup on AWS (bucket policy, CORS for pre-signed uploads, IAM user with least privilege — policy JSON example; SES domain verification, DKIM, moving out of sandbox), Razorpay live activation checklist and webhook URL, WhatsApp Cloud API production checklist (business verification, display name, template approval, webhook verify token), MSG91 DLT checklist. Monthly cost table at 5 pilots, 50 customers and 100 customers (estimates in ₹ and $, labelled). Go-live smoke test list. Known pitfalls. Since platform UIs change, describe steps by intent and note that menu names may differ.
