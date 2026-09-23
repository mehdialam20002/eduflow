# Brief for 60-security-architecture.md

Title: Security Architecture
Minimum words: 4200
Web research needed: no

## What this chapter must cover (every item, fully)

Security in layers with concrete controls: threat model summary (assets, actors, top threats) and a STRIDE-style table; authentication and session security (pointer to the Authentication chapter); authorization (RBAC + tenant isolation); input validation and output encoding; OWASP Top 10 mapped to EduFlow controls (table); API protection (rate limiting tiers from the canon, bot and brute-force protection, CORS policy, security headers via Helmet with the exact header list, CSRF approach with cookies, request size limits); encryption in transit (TLS 1.2+, HSTS) and at rest (RDS/S3 encryption, field-level encryption for bank details, gateway keys, tokens using envelope encryption with a KMS or app key — TypeScript example), secrets management and rotation; file upload security (type and size checks, malware scan option, private buckets, short-lived URLs); payment security (no card data, PCI scope via Razorpay/Stripe checkout, webhook signatures); audit logging overview; dependency and supply-chain security (lockfiles, audit, Dependabot, pinned actions); secure SDLC (code review, the AI-code review checklist, secrets scanning, SAST, tests for authz); infrastructure security (least-privilege IAM, network isolation, WAF at scale, backups encrypted); admin and support access (MFA, just-in-time, impersonation audit); logging without sensitive data; vulnerability management and penetration test plan; incident response pointer; security roadmap by scaling stage (from basics to SOC 2 / ISO 27001); a security requirements table SEC-01 onwards with priority and phase.
