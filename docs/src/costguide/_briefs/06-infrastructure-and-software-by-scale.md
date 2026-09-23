# Brief for 06-infrastructure-and-software-by-scale.md

Title: Infrastructure and Software Costs by Scale
Minimum words: 3200
Research files to read: _research/software-infra-ai.md

## What this chapter must cover (every item, fully)

Unit economics first: hosting cost per organization and per active student (BRD target Rs 0.47 per student a month in Year 1). The monthly infrastructure bill at 10, 100, 500, 1,000 and 10,000 paying customers — Minimum / Recommended / Maximum — consistent with the BRD stage model (Rs 28,000; Rs 90,000; Rs 1,70,000; Rs 12,00,000). Researched price details: Vercel Pro and usage, Railway Pro usage pricing, AWS Mumbai (ap-south-1) prices for ECS Fargate, RDS PostgreSQL instance sizes, ElastiCache, S3 storage and requests, CloudFront, NAT gateway, data transfer, backups, CloudWatch logs. Tools that grow with the team (GitHub Team, Sentry paid tiers, Better Stack, PostHog paid usage, Figma, Linear or Jira, Slack). AI costs: Claude API per-million-token prices for the models AI Insights would use, a worked monthly cost for 12, 100 and 1,000 AI Insights customers, and the 17% of price target from the BRD. Cost traps with real rupee examples (NAT gateway, idle staging, log retention, egress, over-sized databases, forgotten trials, unbounded S3). Billing alerts to set on day one.

## Budget conventions for this guide

Use the three budget levels everywhere: **Minimum** (bare bootstrap: free tiers, founder does it himself, only what is legally or technically unavoidable), **Recommended** (equals the BRD plan in _anchors.md), **Maximum** (the sensible upper end; above it is waste). The standard cost table is: | Item | When to pay | Minimum | Recommended | Maximum | Can you avoid or reduce it? | (6 columns). Always say whether a price includes GST, whether it is one-time, monthly or yearly, and whether GST input tax credit can be claimed once the company is GST-registered.
