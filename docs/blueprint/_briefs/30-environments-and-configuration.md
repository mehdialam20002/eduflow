# Brief for 30-environments-and-configuration.md

Title: Environments and Configuration
Minimum words: 2200
Web research needed: no

## What this chapter must cover (every item, fully)

Three environments: local, staging, production — table comparing purpose, URL (staging.eduflow.app, app.eduflow.app, api.eduflow.app), data, who can access, deploy trigger, integrations mode (Razorpay test vs live, WhatsApp test number vs live, SES sandbox vs production). Environment variable catalog grouped by concern with which app uses it and per-environment notes. Secrets management (platform secret stores on Vercel/Railway, AWS Secrets Manager later; rotation schedule; never in Git; .env.example only). Domain, DNS and SSL setup (apex + app + api + wildcard *.eduflow.app for tenant subdomains; Cloudflare or registrar DNS; records table). CORS and cookie settings across subdomains (SameSite, Secure, domain=.eduflow.app). Feature flags and plan gating config. Database per environment and safe data policy (never copy production data to staging without anonymisation — script outline). Release flow between environments (mermaid flowchart: PR → CI → staging auto-deploy → smoke test → tag → production → post-deploy checks → rollback path). Deployment calendar rules (no Friday evening deploys; freeze during fee-season peak days and exam result days).
