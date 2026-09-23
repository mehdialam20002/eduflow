# Software, infrastructure and AI tool prices for EduFlow (checked 21 September 2026)

Scope: every tool and cloud service a solo developer founder uses to build and run EduFlow (Next.js + Express + PostgreSQL + Redis, multi-tenant SaaS, India first).
Conversion: US$1 = ₹85, A$1 = ₹56, AED 1 = ₹23 (canon planning rates). "/mo" = per month; monthly figures for hourly cloud prices use 730 hours.
Tax: unless a row says otherwise, US-dollar SaaS and cloud list prices **exclude** Indian GST (18%). Indian-rupee prices are marked "excl. GST" or "incl. GST".
Status: **Verified** = read on the vendor's own page or official price file on 21 Sep 2026. **Estimate** = secondary source, search snippet or reasoning.
Source keys [S#] point to the Sources list at the end.

## 1. AI coding assistant: Claude subscription plans

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Claude Free | Anthropic, Free | US$0 | ₹0 | per month | No Claude Code. Baseline chat usage only | Verified | S1 |
| Claude Pro, monthly billing | Anthropic, Pro | US$20 | ₹1,700 | per month | Includes Claude Code. "At least 5x more usage per 5-hour session than Free" | Verified | S1 |
| Claude Pro, annual billing | Anthropic, Pro | US$17 (US$200 billed upfront) | ₹1,445 (₹17,000 a year) | per month | Same limits as Pro monthly | Verified | S1 |
| Claude Max 5x | Anthropic, Max 5x | US$100 | ₹8,500 | per month | Includes Claude Code; 5x Pro's per-session allowance | Verified | S1, S2 |
| Claude Max 20x | Anthropic, Max 20x | US$200 | ₹17,000 | per month | Includes Claude Code; 20x Pro's per-session allowance. Business plan assumes this tier | Verified | S2 |
| Claude Team, Standard seat | Anthropic, Team | US$25 monthly / US$20 annual | ₹2,125 / ₹1,700 | per seat per month | Includes Claude Code | Verified | S1 |
| Claude Team, Premium seat | Anthropic, Team | US$125 monthly / US$100 annual | ₹10,625 / ₹8,500 | per seat per month | 5x the usage of a Standard seat | Verified | S1 |
| Claude Enterprise | Anthropic, Enterprise | US$20 + usage | ₹1,700 + usage | per seat per month, billed annually | "Usage cost scales with model and task" | Verified | S1 |
| Usage limit behaviour | Anthropic, Pro and Max | n/a | n/a | n/a | Limits reset every 5 hours; Max also has a weekly limit across all models; Claude and Claude Code share the same limits | Verified | S2, S3 |
| Usage after hitting the limit | Anthropic, Pro and Max | Standard API rates | see section 2 | per token | Options: enable usage credits, switch to Console API credits, or wait for reset. Extra usage is billed at API rates | Verified | S3 |
| Claude Pro, India rupee price | Anthropic, Pro (INR) | ₹2,399 monthly / ₹2,000 annual | ₹2,399 / ₹2,000 (incl. GST) | per month | Rupee pricing rolled out from 13 Jul 2026 (staged). Ex-GST ≈ ₹2,033. Card or app store only, no UPI | Estimate | S5, S6, S64 |
| Claude Max 5x, India rupee price | Anthropic, Max (INR) | ₹11,999 | ₹11,999 (incl. GST) | per month | Ex-GST ≈ ₹10,169 (= US$120) | Estimate | S5, S6 |
| Claude Max 20x, India rupee price | Anthropic, Max (INR) | ₹23,999 | ₹23,999 (incl. GST) | per month | Ex-GST ≈ ₹20,338 (= US$239). Higher than US$200 × ₹85 | Estimate | S5 |
| Claude Team Standard, India rupee price | Anthropic, Team (INR) | ₹2,999 monthly / ₹2,399 annual | ₹2,999 / ₹2,399 (incl. GST) | per seat per month | Premium seat ₹14,999 monthly / ₹11,999 annual | Estimate | S6 |

## 2. Claude API (for the AI Insights module)

Prices per million tokens (MTok). Prompt caching: 5-minute write = 1.25x input, 1-hour write = 2x input, cache hit = 0.1x input (0.025x on Fable 5.1). Batch API = 50% off input and output.

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Claude Fable 5.1 input / output | Anthropic API | US$10 / US$50 | ₹850 / ₹4,250 | per MTok | Top model; cache hit US$0.25 (₹21) | Verified | S4 |
| Claude Opus 5 input / output | Anthropic API | US$5 / US$25 | ₹425 / ₹2,125 | per MTok | Cache hit US$0.50 (₹42.50); 5-min cache write US$6.25 | Verified | S4 |
| Claude Opus 5 batch input / output | Anthropic API | US$2.50 / US$12.50 | ₹212.50 / ₹1,062.50 | per MTok | For overnight report jobs | Verified | S4 |
| Claude Opus 4.8 / 4.7 / 4.6 / 4.5 | Anthropic API | US$5 / US$25 | ₹425 / ₹2,125 | per MTok | Same price as Opus 5 | Verified | S4 |
| Claude Opus 5 fast mode | Anthropic API | US$10 / US$50 | ₹850 / ₹4,250 | per MTok | Research preview, first-party API only | Verified | S4 |
| Claude Sonnet 5 input / output | Anthropic API | US$2 / US$10 | ₹170 / ₹850 | per MTok | Launch price is now permanent; planned rise to US$3/US$15 on 1 Sep 2026 cancelled. Cache hit US$0.20 (₹17) | Verified | S4 |
| Claude Sonnet 5 batch input / output | Anthropic API | US$1 / US$5 | ₹85 / ₹425 | per MTok | | Verified | S4 |
| Claude Sonnet 4.6 / 4.5 input / output | Anthropic API | US$3 / US$15 | ₹255 / ₹1,275 | per MTok | Older models cost more than Sonnet 5 | Verified | S4 |
| Claude Haiku 4.5 input / output | Anthropic API | US$1 / US$5 | ₹85 / ₹425 | per MTok | Cache hit US$0.10 (₹8.50); batch US$0.50 / US$2.50 | Verified | S4 |
| Web search tool | Anthropic API | US$10 | ₹850 | per 1,000 searches | Plus tokens. Web fetch has no extra charge | Verified | S4 |
| Code execution tool | Anthropic API | US$0.05 | ₹4.25 | per container-hour | 1,550 free hours per organization per month; free when used with web search/fetch | Verified | S4 |
| US-only inference | Anthropic API | 1.1x multiplier | +10% | on all tokens | Default global routing is standard price | Verified | S4 |
| Managed Agents session runtime | Anthropic API | US$0.08 | ₹6.80 | per session-hour | Plus tokens | Verified | S4 |
| Tokenizer note | Anthropic API | n/a | n/a | n/a | Claude 4.7 and later produce about 30% more tokens for the same text; budget for it | Verified | S4 |
| New-account credits | Anthropic API | small free credit | n/a | one-time | "New users receive a small amount of free credits" | Verified | S4 |

## 3. Code hosting, CI and containers

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| GitHub Free | GitHub, Free | US$0 | ₹0 | per month | 2,000 Actions minutes/month, 500 MB Packages storage | Verified | S7, S8 |
| GitHub Team | GitHub, Team | US$4 | ₹340 | per user per month | 3,000 Actions minutes, 2 GB storage. Page labels the price "for the first 12 months*"; later price not shown | Verified | S7 |
| GitHub Enterprise | GitHub, Enterprise | from US$21 | ₹1,785 | per user per month | 50,000 Actions minutes, 50 GB; also "for the first 12 months*" | Verified | S7 |
| Actions minutes beyond quota, Linux 2-core | GitHub Actions | US$0.006 | ₹0.51 | per minute | Linux 1-core US$0.002; arm64 2-core US$0.005 | Verified | S8 |
| Actions minutes, Windows / macOS | GitHub Actions | US$0.010 / US$0.062 | ₹0.85 / ₹5.27 | per minute | Avoid macOS runners unless building iOS apps | Verified | S8 |
| Actions self-hosted runners | GitHub Actions | US$0 | ₹0 | per minute | Free | Verified | S8 |
| Actions / Packages storage beyond quota | GitHub | US$0.25 | ₹21.25 | per GB-month | Cache storage US$0.07/GB-month | Verified | S8 |
| Git LFS data pack | GitHub | US$5 | ₹425 | per month (50 GB) | Not needed for EduFlow | Verified | S7 |
| Docker Personal (Docker Desktop) | Docker, Personal | US$0 | ₹0 | per user per month | Free for companies with fewer than 250 employees AND less than US$10 million yearly revenue | Verified | S17, S18 |
| Docker Pro | Docker, Pro | US$11 monthly / US$9 annual | ₹935 / ₹765 | per user per month | Only if more features are wanted | Verified | S17 |
| Docker Team | Docker, Team | US$16 monthly / US$15 annual | ₹1,360 / ₹1,275 | per user per month | | Verified | S17 |
| Docker Business | Docker, Business | US$24 | ₹2,040 | per user per month | Required once over 250 staff or US$10M revenue | Verified | S17 |

## 4. Web client hosting: Vercel

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Vercel Hobby | Vercel, Hobby | US$0 | ₹0 | per month | 100 GB Fast Data Transfer, 1M edge requests, 1M function invocations, 4 active CPU-hours. **Non-commercial personal use only**: any deployment for financial gain needs Pro. EduFlow cannot use Hobby for production | Verified | S9, S10, S11 |
| Vercel Pro | Vercel, Pro | US$20 | ₹1,700 | per developer seat per month | Includes US$20 usage credit; viewer seats free; commercial use allowed; one free first-year domain on an eligible TLD. Prices exclude GST | Verified | S9, S10 |
| Fast Data Transfer beyond included | Vercel, Pro | US$0.15 | ₹12.75 | per GB | 1 TB included per pricing page; docs describe a Flat Rate CDN for Pro teams | Verified | S9, S11 |
| Edge requests beyond included | Vercel, Pro | US$2 | ₹170 | per 1M requests | 10M included | Verified | S9 |
| Function invocations | Vercel, Pro | US$0.60 | ₹51 | per 1M invocations | After credit is used | Verified | S11 |
| Active CPU | Vercel, Pro | from US$0.128 | ₹10.88 | per CPU-hour | Regional | Verified | S11 |
| Provisioned memory | Vercel, Pro | from US$0.0106 | ₹0.90 | per GB-hour | | Verified | S11 |
| Image optimisation transformations | Vercel, Pro | US$0.05 | ₹4.25 | per 1,000 | Hobby includes 5,000/month | Verified | S11 |
| Password protection for previews | Vercel, Pro add-on | US$20 | ₹1,700 | per protected project per month | Avoid; use Vercel Authentication (free) | Verified | S10 |

## 5. Start-stage backend hosting: Railway, Render, Fly.io

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Railway Free Trial | Railway | US$0 | ₹0 | one-time | US$5 credit for 30 days | Verified | S12 |
| Railway Free | Railway, Free | US$0 | ₹0 | per month | US$1 usage credit per month | Verified | S12 |
| Railway Hobby | Railway, Hobby | US$5 | ₹425 | per month | Includes US$5 usage; max 5 GB volume per service | Verified | S12, S13 |
| Railway Pro | Railway, Pro | US$20 | ₹1,700 | per month (not per seat) | Includes US$20 usage; up to 1 TB volume, 42 replicas | Verified | S12, S13 |
| Railway CPU | Railway | US$20 (US$0.000463/min) | ₹1,700 | per vCPU-month | Billed per second on actual use | Verified | S12, S13 |
| Railway memory | Railway | US$10 (US$0.000231/min) | ₹850 | per GB-month | Billed per second | Verified | S12, S13 |
| Railway volume storage | Railway | US$0.15 | ₹12.75 | per GB-month | | Verified | S12, S13 |
| Railway egress | Railway | US$0.05 | ₹4.25 | per GB | | Verified | S12, S13 |
| Railway object storage | Railway | US$0.015 | ₹1.28 | per GB-month | Free egress | Verified | S12 |
| Railway region for India users | Railway | n/a | n/a | n/a | No Mumbai region; nearest is Singapore (about 60–90 ms from North India) | Estimate | reasoning |
| Render workspace Hobby | Render, Hobby | US$0 | ₹0 | per month | 1 seat, 25 services, 5 GB bandwidth, 7-day logs | Verified | S14 |
| Render workspace Pro | Render, Pro | US$25 | ₹2,125 | per workspace per month (unlimited seats) | 25 GB bandwidth; compute extra | Verified | S14 |
| Render workspace Scale | Render, Scale | US$499 | ₹42,415 | per month | 1 TB bandwidth, SSO, HIPAA | Verified | S14 |
| Render web service Starter | Render compute | US$7 | ₹595 | per month | 0.5 CPU, 512 MB RAM. Free instance exists with limits | Verified | S14 |
| Render web service Standard | Render compute | US$25 | ₹2,125 | per month | 1 CPU, 2 GB | Verified | S14 |
| Render web service Pro | Render compute | US$85 | ₹7,225 | per month | 2 CPU, 4 GB | Verified | S14 |
| Render Postgres 256 MB | Render Postgres | US$6 | ₹510 | per month | 1 GB storage included; free tier has limits | Verified | S14 |
| Render Postgres 1 GB | Render Postgres | US$19 | ₹1,615 | per month | 0.5 CPU | Verified | S14 |
| Render Postgres 4 GB / 8 GB | Render Postgres | US$55 / US$100 | ₹4,675 / ₹8,500 | per month | 1 CPU / 2 CPU | Verified | S14 |
| Render Postgres storage | Render Postgres | US$0.30 | ₹25.50 | per GB-month | | Verified | S14 |
| Render Key Value 256 MB / 1 GB | Render Key Value (Redis-compatible) | US$10 / US$32 | ₹850 / ₹2,720 | per month | Free 25 MB instance | Verified | S14 |
| Render bandwidth and disks | Render | US$0.15 / US$0.25 | ₹12.75 / ₹21.25 | per GB / per GB-month | | Verified | S14 |
| Fly.io shared-cpu-1x 256 MB / 512 MB | Fly.io Machines | US$2.02 / US$3.32 | ₹172 / ₹282 | per month | Amsterdam example; other regions differ slightly | Verified | S15 |
| Fly.io shared-cpu-1x 1 GB / 2 GB | Fly.io Machines | US$5.92 / US$11.11 | ₹503 / ₹944 | per month | | Verified | S15 |
| Fly.io performance-1x 2 GB | Fly.io Machines | US$32.19 | ₹2,736 | per month | | Verified | S15 |
| Fly.io volumes | Fly.io | US$0.15 | ₹12.75 | per GB-month | Snapshots US$0.08/GB, first 10 GB free | Verified | S15 |
| Fly.io egress, India region group | Fly.io | US$0.12 | ₹10.20 | per GB | Asia-Pacific group US$0.04/GB | Verified | S15 |
| Fly.io Managed Postgres Basic / Starter | Fly.io MPG | US$38 / US$72 | ₹3,230 / ₹6,120 | per month | 1 GB / 2 GB RAM; storage US$0.28/GB-month | Verified | S16 |
| Fly.io support Standard | Fly.io | US$29 | ₹2,465 | per month | Community support free | Verified | S15 |

## 6. AWS Mumbai (ap-south-1), On-Demand, Linux

Read from the official AWS Price List files published 11–17 Sep 2026. All prices exclude GST. Indian accounts are billed by Amazon Web Services India (AISPL) in rupees with 18% GST added (Estimate; GST is claimable as input tax credit by a registered company).

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| ECS Fargate vCPU, x86 | AWS Fargate | US$0.04256 | ₹3.62 (₹2,641 a month) | per vCPU-hour | | Verified | S19 |
| ECS Fargate memory, x86 | AWS Fargate | US$0.004655 | ₹0.40 (₹289 a month) | per GB-hour | | Verified | S19 |
| ECS Fargate vCPU, ARM (Graviton) | AWS Fargate | US$0.02383 | ₹2.03 (₹1,479 a month) | per vCPU-hour | 44% cheaper than x86 in Mumbai; Node.js runs on ARM | Verified | S19 |
| ECS Fargate memory, ARM | AWS Fargate | US$0.00261 | ₹0.22 (₹162 a month) | per GB-hour | | Verified | S19 |
| Fargate ephemeral storage above 20 GB | AWS Fargate | US$0.000127 | ₹0.011 | per GB-hour | | Verified | S19 |
| Example task 0.5 vCPU + 1 GB, always on | AWS Fargate | US$18.93 x86 / US$10.60 ARM | ₹1,609 / ₹901 | per task per month | Worked from the rates above | Verified | S19 |
| RDS PostgreSQL db.t4g.micro, Single-AZ | Amazon RDS | US$0.021 | ₹1.79 (₹1,303 a month) | per hour | 2 vCPU burstable, 1 GB | Verified | S20 |
| RDS PostgreSQL db.t4g.small, Single-AZ | Amazon RDS | US$0.042 | ₹3.57 (₹2,606 a month) | per hour | 2 GB | Verified | S20 |
| RDS PostgreSQL db.t4g.medium, Single-AZ | Amazon RDS | US$0.084 | ₹7.14 (₹5,212 a month) | per hour | 4 GB | Verified | S20 |
| RDS PostgreSQL db.t4g.large, Single-AZ | Amazon RDS | US$0.167 | ₹14.20 (₹10,362 a month) | per hour | 8 GB | Verified | S20 |
| RDS PostgreSQL db.m6g.large, Single-AZ | Amazon RDS | US$0.226 | ₹19.21 (₹14,023 a month) | per hour | 2 vCPU, 8 GB, not burstable | Verified | S20 |
| RDS PostgreSQL Multi-AZ (t4g.micro / small / medium) | Amazon RDS | US$0.042 / US$0.084 / US$0.167 | ₹2,606 / ₹5,212 / ₹10,362 a month | per hour | Multi-AZ doubles the instance price | Verified | S20 |
| RDS PostgreSQL db.m6g.large, Multi-AZ | Amazon RDS | US$0.452 | ₹38.42 (₹28,047 a month) | per hour | Production standby in a second zone | Verified | S20 |
| RDS gp3 storage, Single-AZ / Multi-AZ | Amazon RDS | US$0.131 / US$0.262 | ₹11.14 / ₹22.27 | per GB-month | | Verified | S20 |
| RDS backup storage beyond free allocation | Amazon RDS | US$0.095 | ₹8.08 | per GB-month | Backup equal to provisioned storage is free | Verified | S20 |
| T4g CPU credits (unlimited mode) | Amazon RDS | extra per vCPU-hour when bursting | n/a | n/a | Burstable instances can add a surplus-credit charge under sustained load | Estimate | reasoning |
| ElastiCache cache.t4g.micro (Valkey / Redis OSS) | Amazon ElastiCache | US$0.016 / US$0.020 | ₹993 / ₹1,241 a month | per node-hour | Valkey is Redis-compatible and 20% cheaper; test BullMQ on Valkey first | Verified | S21 |
| ElastiCache cache.t4g.small (Valkey / Redis OSS) | Amazon ElastiCache | US$0.0328 / US$0.041 | ₹2,035 / ₹2,544 a month | per node-hour | | Verified | S21 |
| ElastiCache cache.t4g.medium (Valkey / Redis OSS) | Amazon ElastiCache | US$0.0648 / US$0.081 | ₹4,021 / ₹5,026 a month | per node-hour | | Verified | S21 |
| ElastiCache cache.m7g.large (Valkey / Redis OSS) | Amazon ElastiCache | US$0.1312 / US$0.164 | ₹8,141 / ₹10,176 a month | per node-hour | | Verified | S21 |
| ElastiCache Serverless Valkey, data stored | Amazon ElastiCache | US$0.054 | ₹4.59 (₹3,351 per GB-month) | per GB-hour | Plus US$0.0015 per million ECPUs; Redis OSS serverless US$0.081/GB-hour | Verified | S21 |
| S3 Standard storage | Amazon S3 | US$0.025 | ₹2.13 | per GB-month | First 50 TB | Verified | S22 |
| S3 Standard-Infrequent Access | Amazon S3 | US$0.0138 | ₹1.17 | per GB-month | For files older than 2 years (plan rule 3) | Verified | S22 |
| S3 Glacier Instant Retrieval | Amazon S3 | US$0.005 | ₹0.43 | per GB-month | | Verified | S22 |
| S3 PUT, COPY, POST, LIST requests | Amazon S3 | US$0.005 | ₹0.43 | per 1,000 requests | | Verified | S22 |
| S3 GET and other requests | Amazon S3 | US$0.004 | ₹0.34 | per 10,000 requests | | Verified | S22 |
| CloudFront data transfer out, India | Amazon CloudFront | US$0.109 | ₹9.27 | per GB (first 10 TB) | Always free: 1 TB and 10M requests a month | Verified | S23, S32 |
| CloudFront HTTPS requests, India | Amazon CloudFront | US$0.012 | ₹1.02 | per 10,000 requests | | Verified | S23 |
| CloudFront flat-rate plan Free / Pro / Business | Amazon CloudFront | US$0 / US$15 / US$200 | ₹0 / ₹1,275 / ₹17,000 | per month | Free: 1M requests, 100 GB. Pro: 10M requests, 50 TB, WAF and DDoS included, no overage | Verified | S32 |
| Data transfer out to internet, Mumbai | AWS | US$0.1093 | ₹9.29 | per GB (first 10 TB) | After the account-wide 100 GB/month free allowance | Verified | S25 |
| Data transfer between Availability Zones | AWS | US$0.01 | ₹0.85 | per GB, each direction | | Verified | S25 |
| NAT gateway, hourly | Amazon VPC | US$0.056 | ₹4.76 (₹3,475 a month) | per NAT gateway-hour | One per zone doubles it; avoidable with public subnets or VPC endpoints | Verified | S24 |
| NAT gateway, data processed | Amazon VPC | US$0.056 | ₹4.76 | per GB | Charged on top of data transfer | Verified | S24 |
| Public IPv4 address in use | Amazon VPC | US$0.005 | ₹0.43 (₹310 a month) | per IP-hour | Every public IP (ALB, NAT, tasks) is charged | Verified | S31 |
| VPC endpoint data processed | Amazon VPC | US$0.01 | ₹0.85 | per GB | Cheaper than NAT for S3 or ECR traffic | Verified | S30 |
| Application Load Balancer | Elastic Load Balancing | US$0.0239 | ₹2.03 (₹1,483 a month) | per ALB-hour | | Verified | S28 |
| ALB capacity units | Elastic Load Balancing | US$0.008 | ₹0.68 | per LCU-hour | | Verified | S28 |
| Amazon SES outbound email | Amazon SES | US$0.10 | ₹8.50 | per 1,000 emails | Receiving also US$0.10 per 1,000 | Verified | S27 |
| SES attachments | Amazon SES | US$0.12 | ₹10.20 | per GB | Send PDF links, not attachments | Verified | S27 |
| SES dedicated IP (leased) | Amazon SES | US$24.95 | ₹2,121 | per month | Not needed below about 100k emails a day | Verified | S27 |
| CloudWatch Logs ingestion, Standard class | Amazon CloudWatch | US$0.67 | ₹56.95 | per GB | 5 GB free a month | Verified | S26 |
| CloudWatch Logs ingestion, Infrequent Access | Amazon CloudWatch | US$0.335 | ₹28.48 | per GB | | Verified | S26 |
| CloudWatch Logs storage | Amazon CloudWatch | US$0.03 | ₹2.55 | per GB-month | Set a retention period | Verified | S26 |
| CloudWatch custom metrics | Amazon CloudWatch | US$0.30 | ₹25.50 | per metric-month | First 10 metrics free | Verified | S26 |
| Secrets Manager | AWS Secrets Manager | US$0.40 | ₹34 | per secret per month | Plus US$0.05 per 10,000 API calls | Verified | S29 |
| AWS Free Tier for new accounts | AWS | US$100 credit + up to US$100 more | ₹8,500 – ₹17,000 | one-time, 6 months | Free-plan account closes after 6 months or when credits run out unless upgraded to a paid plan | Verified | S33 |

## 7. Monitoring, logs and product analytics

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Sentry Developer | Sentry, Developer | US$0 | ₹0 | per month | 1 user, 5k errors, 5M spans, 50 replays, 1 GB attachments, 1 cron and 1 uptime monitor | Verified | S34 |
| Sentry Team, annual billing | Sentry, Team | US$26 | ₹2,210 | per month | 50k errors, unlimited users; extra cron monitor US$0.78, uptime monitor US$1.00 | Verified | S34 |
| Sentry Team, monthly billing | Sentry, Team | US$29 | ₹2,465 | per month | About 10% above annual | Estimate | S63 |
| Sentry Business | Sentry, Business | US$80 | ₹6,800 | per month | | Verified | S34 |
| Sentry extra errors, Team pay-as-you-go | Sentry | US$0.0003625 | ₹0.031 (₹308 per 10k errors) | per error (50k–100k band) | Business rate US$0.0011125 | Verified | S35 |
| Sentry Seer (AI debugging) | Sentry add-on | US$40 | ₹3,400 | per active contributor per month | Optional; skip while Claude Code is in use | Verified | S35 |
| PostHog free allowance | PostHog | US$0 | ₹0 | per month | 1M analytics events, 5k session recordings, 1M feature-flag requests, 100k exceptions, 1,500 survey responses, 1M warehouse rows, 10 GB logs | Verified | S36 |
| PostHog analytics events beyond free | PostHog | US$0.00005 | ₹0.00425 (₹4,250 per extra 1M) | per event (1M–2M band) | Billing limit can be set | Verified | S37 |
| PostHog session recordings beyond free | PostHog | US$0.005 | ₹0.43 | per recording (5k–15k band) | Do not record child users (DPDP) | Verified | S38 |
| Better Stack free | Better Stack | US$0 | ₹0 | per month | 10 monitors and heartbeats, 1 status page, 3 GB logs kept 3 days | Verified | S39 |
| Better Stack responder licence | Better Stack | US$34 monthly / US$29 annual | ₹2,890 / ₹2,465 | per month | Needed for on-call alerts by phone/SMS | Verified | S39 |
| Better Stack extra monitors | Better Stack | US$25 | ₹2,125 | per 50 monitors per month | | Verified | S39 |
| Better Stack logs ingestion | Better Stack | US$0.10 EU / US$0.15 US / US$0.35 Singapore | ₹8.50 / ₹12.75 / ₹29.75 | per GB | Retention US$0.05 (EU) to US$0.18 (Singapore) per GB-month | Verified | S39 |
| Better Stack extra status page | Better Stack | US$15 | ₹1,275 | per page per month | | Verified | S39 |
| Grafana Cloud Free | Grafana Labs | US$0 | ₹0 | per month | 10k metric series, 50 GB logs, 50 GB traces, 50 GB profiles, 3 users, 14-day retention, 500 k6 VU-hours, 100k synthetic API checks | Verified | S40 |
| Grafana Cloud Pro | Grafana Labs | US$19 + usage | ₹1,615 + usage | per month | Metrics from US$6.50 per 1k series; logs US$0.05 process + US$0.40 write + US$0.10 retain per GB | Verified | S40 |

## 8. Office email, accounting and CRM

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Google Workspace Business Base | Google | ₹99 (intro ₹49.50 until 5 Jan 2027) | ₹99 (excl. GST) | per user per month, monthly billing | Up to 20 users, 20 GB pooled storage | Verified | S41 |
| Google Workspace Business Starter | Google | ₹270 | ₹270 (excl. GST) | per user per month, monthly billing | 30 GB pooled storage, up to 300 users | Verified | S41 |
| Google Workspace Business Standard | Google | ₹1,080 (intro ₹864, up to 20 users) | ₹1,080 (excl. GST) | per user per month, monthly billing | 2 TB pooled storage | Verified | S41 |
| Google Workspace one-year commitment | Google | "Save 16%" | about ₹227 for Starter | per user per month | Exact annual figure not shown; worked as 84% of ₹270 | Estimate | S41 |
| Zoho Mail Forever Free | Zoho | ₹0 | ₹0 | per month | Up to 5 users, 5 GB each, "available only in select data centers"; web access only (IMAP/POP not included, Estimate) | Verified | S42 |
| Zoho Mail Lite 5 GB / 10 GB | Zoho | ₹59 / ₹75 | ₹59 / ₹75 (excl. GST) | per user per month, billed annually | Reseller figures; one other reseller shows ₹90 | Estimate | S43, S44 |
| Zoho Mail Premium | Zoho | ₹360 | ₹360 (excl. GST) | per user per month | Reseller figure | Estimate | S44 |
| Zoho Workplace Standard | Zoho | ₹99 – ₹270 | ₹99 – ₹270 (excl. GST) | per user per month | Two resellers disagree; check zoho.com/in before buying | Estimate | S43, S44 |
| Zoho Workplace Professional | Zoho | ₹399 – ₹630 | ₹399 – ₹630 (excl. GST) | per user per month | Two resellers disagree | Estimate | S43, S44 |
| Zoho Books Free | Zoho Books India | ₹0 | ₹0 | per month | Only while yearly revenue stays at or below ₹25 lakh; 1,000 invoices and 1,000 bills a year; 1 user + 1 accountant | Verified | S45 |
| Zoho Books Standard | Zoho Books India | ₹749 annual / ₹899 monthly | ₹749 / ₹899 (excl. GST) | per organisation per month | 3 users | Verified | S45 |
| Zoho Books Professional | Zoho Books India | ₹1,499 annual / ₹1,799 monthly | ₹1,499 / ₹1,799 (excl. GST) | per organisation per month | 5 users | Verified | S45 |
| Zoho Books Premium | Zoho Books India | ₹2,999 annual / ₹3,599 monthly | ₹2,999 / ₹3,599 (excl. GST) | per organisation per month | 10 users | Verified | S45 |
| Zoho CRM Free | Zoho CRM | ₹0 | ₹0 | per month | Up to 3 users | Verified | S46 |
| Zoho CRM Standard | Zoho CRM | ₹800 | ₹800 (excl. GST) | per user per month (as shown; annual "save up to 34%") | | Verified | S46 |
| Zoho CRM Professional / Enterprise | Zoho CRM | ₹1,400 / ₹2,400 | ₹1,400 / ₹2,400 (excl. GST) | per user per month | | Verified | S46 |

## 9. Security, design, planning and chat tools

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Bitwarden Free | Bitwarden | US$0 | ₹0 | per month | Unlimited devices | Verified | S47 |
| Bitwarden Premium | Bitwarden | US$19.80 a year (US$1.65/mo) | ₹1,683 a year (₹140/mo) | per user | Authenticator, attachments, emergency access. Taxes excluded | Verified | S47 |
| Bitwarden Families | Bitwarden | US$47.88 a year | ₹4,070 a year | up to 6 users | | Verified | S47 |
| Bitwarden Teams / Enterprise | Bitwarden | US$4 / US$6 | ₹340 / ₹510 | per user per month, annual | For shared company vault once staff join | Verified | S47 |
| 1Password Individual | 1Password | US$2.99 annual / US$3.99 monthly | ₹254 / ₹339 | per month | First-year promo pricing may apply | Verified | S48 |
| 1Password Teams Starter Pack | 1Password | US$24.95 | ₹2,121 | per month, annual (team of up to 10, Estimate) | | Verified | S49 |
| 1Password Business | 1Password | US$8.99 | ₹764 | per user per month, annual | | Verified | S49 |
| Figma Starter | Figma | US$0 | ₹0 | per month | Unlimited drafts, 150 AI credits a day | Verified | S50 |
| Figma Professional Full / Dev / Collab seat | Figma | US$16 / US$12 / US$3 | ₹1,360 / ₹1,020 / ₹255 | per seat per month | | Verified | S50 |
| Figma Organization Full seat | Figma | US$55 | ₹4,675 | per seat per month, annual | | Verified | S50 |
| Linear Free | Linear | US$0 | ₹0 | per month | 250 issues, 2 teams, unlimited members | Verified | S51 |
| Linear Basic / Business | Linear | US$10 / US$16 | ₹850 / ₹1,360 | per user per month, annual | | Verified | S51 |
| Slack Free | Slack | ₹0 | ₹0 | per month | 90 days of message history, up to 10 apps, 1:1 huddles | Verified | S52 |
| Slack Pro | Slack | ₹245.25 annual / ₹294.75 monthly | ₹245.25 / ₹294.75 | per active user per month | Tax treatment not shown (assume excl. GST) | Verified | S52 |
| Slack Business+ | Slack | ₹557.10 annual / ₹668.25 monthly | ₹557.10 / ₹668.25 | per active user per month | | Verified | S52 |

## 10. DNS, CDN and domain names

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Cloudflare Free | Cloudflare | US$0 | ₹0 | per month | DNS, CDN, unmetered DDoS protection, Universal SSL, free managed WAF ruleset, 70 rules | Verified | S53 |
| Cloudflare Pro | Cloudflare | US$20 annual / US$25 monthly | ₹1,700 / ₹2,125 | per domain per month | | Verified | S53 |
| Cloudflare Business | Cloudflare | US$200 annual / US$250 monthly | ₹17,000 / ₹21,250 | per domain per month | | Verified | S53 |
| Cloudflare Registrar | Cloudflare | at registry cost, no markup | varies | per domain per year | .com at cost about US$10.5 (₹890) | Verified (policy) / Estimate (price) | S54 |
| .app domain, first year | Porkbun | US$8.75 | ₹744 | first year | .app is HTTPS-only (HSTS preload) by registry rule (Estimate) | Verified | S55 |
| .app domain, renewal and transfer | Porkbun | US$14.93 | ₹1,269 | per year | Renewal is the real yearly cost | Verified | S55 |
| .in domain, registration and renewal | Porkbun | US$7.83 | ₹666 | per year | Same price every year | Verified | S55 |
| .co.in domain | Porkbun | US$5.80 | ₹493 | per year | | Verified | S55 |
| .com domain, registration and renewal | Porkbun | US$11.08 | ₹942 | per year | | Verified | S55 |
| .in domain at an Indian registrar | GoDaddy India | ₹599 first year, ₹800 renewal | ₹599 / ₹800 (excl. GST) | per year | Rupee billing with GST invoice | Estimate | S56 |
| .in domain at an Indian registrar | BigRock | ₹749 | ₹749 (excl. GST) | per year after the first | First-year offers need multi-year terms | Estimate | S56 |
| Free first-year domain with Vercel Pro | Vercel | US$0 | ₹0 | first year | One eligible TLD per paid Pro team | Verified | S10 |

## 11. Laptops in India (retail, prices include GST)

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Entry Windows, 8 GB | Acer Aspire 3, Core i5-1334U, 8 GB, 512 GB | ₹51,000 | ₹51,000 | one-time | 8 GB is too little for Docker + Postgres + Redis + Next.js; fine for a non-developer | Estimate | S60 |
| Entry Windows, 16 GB | Samsung Galaxy Book4, Core i5-1335U, 16 GB, 512 GB | ₹62,800 | ₹62,800 | one-time | Minimum sensible developer machine | Estimate | S60 |
| Entry Windows, 16 GB | Dell Inspiron 3530, Core i5-1334U, 16 GB, 1 TB | ₹66,490 | ₹66,490 | one-time | | Estimate | S60 |
| Mid Windows, 16 GB | ASUS Vivobook S16, Core 5 210H, 16 GB, 512 GB | ₹68,990 | ₹68,990 | one-time | | Estimate | S60 |
| Mid Windows, 16 GB | Lenovo IdeaPad Slim 3, Ryzen 7 8840HS, 16 GB, 512 GB | ₹77,490 | ₹77,490 | one-time | Prices as of May 2026 | Estimate | S60 |
| Recommended Windows, 32 GB | Ryzen 7 / Core Ultra 7 class, 32 GB, 1 TB | ₹90,000 – ₹1,10,000 | ₹90,000 – ₹1,10,000 | one-time | Reasoning: 16 GB models above plus about ₹15,000–30,000 for 32 GB | Estimate | reasoning |
| Entry Mac | Apple MacBook Neo 13-inch, A18 Pro, 8 GB, 256 GB | ₹79,900 (top config ₹89,900) | ₹79,900 – ₹89,900 | one-time | MRP incl. taxes; 8 GB limits local containers | Verified | S58, S60 |
| Recommended Mac | Apple MacBook Air 13-inch M5, 16 GB, 512 GB | ₹1,49,900 | ₹1,49,900 | one-time | MRP incl. taxes; Air configs listed up to ₹1,79,900. Education store and card offers lower it | Verified | S57 |
| High-end Mac | Apple MacBook Pro (M5 family) | from ₹2,39,900 | ₹2,39,900+ | one-time | MRP incl. taxes | Verified | S59 |

## 12. App store developer fees (for white-label apps in Phase 4)

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Apple Developer Program | Apple | US$99 | ₹8,415 | per year | Local-currency price shown at enrolment. Organisations need a D-U-N-S number. Fee waiver only for nonprofits, accredited schools and government | Verified | S61 |
| Google Play Console registration | Google | US$25 | ₹2,125 | one-time | Personal and Organisation account types | Verified | S62 |

## 13. Tax and payment notes that change the real rupee cost

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| GST on foreign SaaS bought by a GST-registered company | All USD vendors | 18% under reverse charge | +18%, then claimed back as input tax credit | per invoice | Net cost ≈ list price once registered; before registration the 18% is a real cost. CA to confirm | Estimate | reasoning |
| GST inside Claude India rupee prices | Anthropic INR plans | 18% included | ₹23,999 = ₹20,338 + ₹3,661 GST (Max 20x) | per month | Recoverable only if the invoice carries EduFlow's GSTIN (check before choosing INR billing) | Estimate | S64 |
| Foreign-currency card markup | Indian bank cards | 2% – 3.5% + 18% GST on the markup | about +2.4% – 4.1% | per USD payment | Use a low-markup forex card; plan ₹85/US$ does not include it | Estimate | reasoning |
| AWS India billing | AISPL | INR invoice + 18% GST | +18% (claimable) | per invoice | | Estimate | reasoning |

## Differences from the business plan

1. **Claude Max 20x (plan: ₹17,000 a month).** The US-dollar price is unchanged at US$200 = ₹17,000 (Verified). But since July 2026 Indian accounts may be shown the rupee price of ₹23,999 including GST, which is ₹20,338 before GST (Estimate). If EduFlow pays the rupee price and cannot claim the GST back, the real cost is ₹23,999: ₹6,999 a month more, ₹41,994 more over the six-month budget. Paying in US dollars from the company (reverse-charge GST, claimed back) keeps it near ₹17,000 plus a 2–4% card markup. The plan's fallback "US$100 tier saves ₹8,500" holds in dollars; in rupees Max 5x is ₹11,999 incl. GST, saving ₹12,000.
2. **Claude API for AI Insights (plan: ₹250 per user a month).** Sonnet 5 at US$2 / US$10 per MTok is now the permanent price (the rise to US$3 / US$15 was cancelled). ₹250 buys about 1.2M input + 50k output tokens of Sonnet 5 a month per user, which is ample (Estimate). Newer models use about 30% more tokens for the same text, so keep the 17% cost ratio as the plan says.
3. **Vercel (plan: Pro, ₹1,700).** Matches: US$20 per developer seat. Hobby is not an option because any commercial use is banned on it.
4. **Railway (plan: ₹2,000 rising to ₹8,700).** Consistent. Pro is US$20 a month (₹1,700) with US$20 of usage included, not per seat; CPU US$20 per vCPU-month, memory US$10 per GB-month. A small production set (API, worker, Postgres, Redis) at typical idle load is about US$25–30 (₹2,100–2,550) and a staging copy roughly doubles it (Estimate). Railway has no India region; Singapore is nearest (Estimate).
5. **Sentry (plan: Team at ₹2,200 from December).** Matches annual billing (US$26 = ₹2,210). Monthly billing is about US$29 = ₹2,465 (Estimate). The free Developer plan allows only 1 user, which is enough until the first engineer joins.
6. **Google Workspace (plan: ₹300 for 1 user).** Business Starter is ₹270 a month on monthly billing, ₹319 with 18% GST (Verified). A new Business Base plan costs ₹99 (₹49.50 introductory until 5 Jan 2027) and would cut this line.
7. **Password manager (plan: ₹200).** Bitwarden Premium is now US$19.80 a year (₹140 a month) and Bitwarden Free costs ₹0. 1Password Individual is ₹254 a month on annual billing. The plan figure is fine.
8. **Zoho Books (plan: Standard ₹750 from January).** Matches (₹749 on annual billing, ₹899 monthly). The Free plan is allowed while yearly revenue stays at or below ₹25 lakh and invoices under 1,000 a year, so January–March 2027 could run on Free and save ₹2,250.
9. **CRM (plan: entry plan ₹250).** No Zoho CRM paid edition costs ₹250: Standard shows ₹800 per user. Zoho CRM Free (up to 3 users) costs ₹0 and covers Year 1 lead tracking. Choose Free (₹0) or budget ₹800.
10. **Domain names (plan: ₹2,500 a year).** eduflow.app renewal US$14.93 (₹1,269) + a .in at US$7.83 (₹666) = ₹1,935 a year at Porkbun; an Indian registrar charges ₹599–800 for .in. Within plan unless the name is premium or already taken (availability not checked).
11. **Founder laptop (plan: add ₹80,000 if needed).** ₹80,000 buys a 16 GB Windows laptop (₹62,800–77,490) or an 8 GB MacBook Neo (₹79,900). A 16 GB MacBook Air M5 now costs ₹1,49,900.
12. **Staff laptops (plan: ₹35,000 in April and July, ₹60,000 in August; ₹70,000 per new person from Year 2).** ₹35,000 is below the cheapest listed laptop (₹51,000 for an 8 GB model); budget about ₹50,000 per non-developer. ₹60,000 is just under the cheapest 16 GB developer laptop (₹62,800). ₹70,000 fits a Windows developer laptop but not a Mac.
13. **AWS stage at 1,000 customers (plan: ₹1,70,000 a month).** At current Mumbai prices a typical stack costs about US$1,262 = ₹1,07,000 a month: RDS db.m6g.large Multi-AZ + one read replica with 300 GB gp3 each, two cache.m7g.large Valkey nodes, five Fargate tasks of 1 vCPU / 2 GB, one ALB, two NAT gateways, 1 TB S3, 200k emails, 50 GB of logs. Staging adds about ₹10,000–15,000 (Estimate). The plan has about 30% headroom before GST, which AISPL adds at 18% and the company can claim back.
14. **AWS free tier.** The old 12-month free tier is replaced for new accounts by US$100–200 of credits for 6 months (Verified). This does not change the plan, because S3 and SES costs are small.
15. **Docker Desktop (not in plan).** Free while EduFlow has fewer than 250 employees and less than US$10 million revenue. Year 5 targets (220 people, revenue ₹75.3 crore ≈ US$8.9 million) come close to both limits. From Year 6 budget Docker Business at US$24 (₹2,040) per developer a month.
16. **Monitoring tools on free plans (plan: GitHub, PostHog, Better Stack, Figma, Cloudflare at ₹0).** All five still have usable free plans (Verified). Limits to watch: Better Stack free keeps logs for only 3 days (use Grafana Cloud Free with 50 GB and 14 days for logs); GitHub Free has 2,000 CI minutes a month (extra Linux minutes ₹0.51 each).
17. **Card markup (not in plan).** Each US-dollar bill carries a 2–3.5% forex markup plus GST on the markup (Estimate). On about US$270 a month of USD tools (Claude US$200, Vercel US$20, Railway about US$25, Sentry US$26 ≈ ₹23,000) this is ₹550–950 a month.

## Sources

All pages opened on 21 September 2026 unless marked otherwise.

- S1: Anthropic, "Plans & Pricing | Claude", https://claude.com/pricing
- S2: Anthropic Help Center, "What is the Max plan?", https://support.claude.com/en/articles/11049741-what-is-the-max-plan
- S3: Anthropic Help Center, "Using Claude Code with your Pro or Max plan", https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan
- S4: Anthropic, Claude Platform Docs "Pricing", https://platform.claude.com/docs/en/about-claude/pricing
- S5: Deccan Chronicle, "Anthropic launches India pricing for Claude AI plans" (14 Jul 2026), https://www.deccanchronicle.com/technology/anthropic-launches-india-pricing-for-claude-ai-plans-1970784
- S6: Open Magazine, "Claude AI gets India pricing in rupees: here's what Pro, Max, Team plans cost" (14 Jul 2026), https://openthemagazine.com/technology/claude-ai-gets-india-pricing-in-rupees-heres-what-pro-max-team-plans-cost
- S7: GitHub, "Pricing", https://github.com/pricing
- S8: GitHub Docs, "GitHub Actions billing", https://docs.github.com/en/billing/concepts/product-billing/github-actions
- S9: Vercel, "Pricing", https://vercel.com/pricing
- S10: Vercel Docs, "Vercel Hobby Plan" (updated 14 Sep 2026), https://vercel.com/docs/plans/hobby
- S11: Vercel Docs, "Fair Use Guidelines" (updated 14 Sep 2026), https://vercel.com/docs/limits/fair-use-guidelines
- S12: Railway, "Pricing", https://railway.com/pricing
- S13: Railway Docs, "Pricing plans", https://docs.railway.com/reference/pricing/plans
- S14: Render, "Pricing", https://render.com/pricing
- S15: Fly.io Docs, "Fly.io Resource Pricing", https://fly.io/docs/about/pricing/
- S16: Fly.io Docs, "Managed Postgres", https://fly.io/docs/mpg/
- S17: Docker, "Pricing", https://www.docker.com/pricing/
- S18: Docker Docs, "Docker Desktop license agreement", https://docs.docker.com/subscription/desktop-license/
- S19: AWS Price List API, AmazonECS, ap-south-1 (published 11 Sep 2026), https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonECS/current/ap-south-1/index.json
- S20: AWS Price List API, AmazonRDS, ap-south-1 (published 17 Sep 2026), https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonRDS/current/ap-south-1/index.json
- S21: AWS Price List API, AmazonElastiCache, ap-south-1 (published 14 Sep 2026), https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonElastiCache/current/ap-south-1/index.json
- S22: AWS Price List API, AmazonS3, ap-south-1, https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonS3/current/ap-south-1/index.json
- S23: AWS Price List API, AmazonCloudFront (published 16 Sep 2026), https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonCloudFront/current/index.json
- S24: AWS Price List API, AmazonEC2, ap-south-1 (NAT gateway entries), https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/ap-south-1/index.json
- S25: AWS Price List API, AWSDataTransfer, ap-south-1, https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AWSDataTransfer/current/ap-south-1/index.json
- S26: AWS Price List API, AmazonCloudWatch, ap-south-1, https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonCloudWatch/current/ap-south-1/index.json
- S27: AWS Price List API, AmazonSES, ap-south-1 (published 11 Sep 2026), https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonSES/current/ap-south-1/index.json
- S28: AWS Price List API, AWSELB, ap-south-1, https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AWSELB/current/ap-south-1/index.json
- S29: AWS Price List API, AWSSecretsManager, ap-south-1 (published 11 Sep 2026), https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AWSSecretsManager/current/ap-south-1/index.json
- S30: AWS Price List API, AmazonVPC, ap-south-1 (published 17 Sep 2026), https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonVPC/current/ap-south-1/index.json
- S31: AWS, "Amazon VPC pricing", https://aws.amazon.com/vpc/pricing/
- S32: AWS, "Amazon CloudFront pricing", https://aws.amazon.com/cloudfront/pricing/
- S33: AWS, "AWS Free Tier", https://aws.amazon.com/free/
- S34: Sentry, "Pricing", https://sentry.io/pricing/
- S35: Sentry Docs, "Pricing & Billing", https://docs.sentry.io/pricing/
- S36: PostHog, "Pricing", https://posthog.com/pricing
- S37: PostHog, "Product analytics pricing", https://posthog.com/product-analytics/pricing
- S38: PostHog, "Session replay pricing", https://posthog.com/session-replay/pricing
- S39: Better Stack, "Pricing", https://betterstack.com/pricing
- S40: Grafana Labs, "Grafana Cloud pricing", https://grafana.com/pricing/
- S41: Google, "Google Workspace pricing (India)", https://workspace.google.com/intl/en_in/pricing
- S42: Zoho, "Zoho Mail pricing", https://www.zoho.com/mail/zohomail-pricing.html (paid plan prices did not render; free plan details only)
- S43: Cloudfy Systems (Zoho partner), "Zoho Mail Lite India 2026" (1 Aug 2026), https://www.cloudfysystems.com/blog/zoho-mail-lite-india
- S44: ITforSME, "Zoho Mail Pricing India 2026", https://www.itforsme.in/pricing/zoho-mail-india
- S45: Zoho, "Zoho Books pricing (India)", https://www.zoho.com/in/books/pricing/
- S46: Zoho, "Zoho CRM editions and pricing", https://www.zoho.com/crm/zohocrm-pricing.html
- S47: Bitwarden, "Pricing", https://bitwarden.com/pricing/
- S48: 1Password, "Password manager pricing", https://1password.com/pricing/password-manager
- S49: 1Password, "Business pricing", https://1password.com/pricing/business
- S50: Figma, "Pricing", https://www.figma.com/pricing/
- S51: Linear, "Pricing", https://linear.app/pricing
- S52: Slack, "Pricing", https://slack.com/pricing (showed INR prices)
- S53: Cloudflare, "Network & CDN plans", https://www.cloudflare.com/plans/network-cdn/
- S54: Cloudflare, "Cloudflare Registrar", https://www.cloudflare.com/products/registrar/
- S55: Porkbun, "Domain pricing", https://porkbun.com/products/domains (also https://porkbun.com/tld/app, https://porkbun.com/tld/in, https://porkbun.com/tld/com)
- S56: Web search result summaries, not opened (GoDaddy and BigRock .in prices): https://themehunk.com/cheap-in-domain-registration/ and https://www.godaddy.com/resources/in/skills/the-best-domain-registrars-in-india (GoDaddy's own .in page returned HTTP 403)
- S57: Apple India, "Buy MacBook Air", https://www.apple.com/in/shop/buy-mac/macbook-air and the 13-inch M5 16 GB / 512 GB product page (prices read from the page's price data)
- S58: Apple India, "Buy MacBook Neo", https://www.apple.com/in/shop/buy-mac/macbook-neo (lowPrice ₹79,900, highPrice ₹89,900)
- S59: Apple India, "Buy MacBook Pro", https://www.apple.com/in/shop/buy-mac/macbook-pro (lowPrice ₹2,39,900)
- S60: LaptopInsights, "Best laptops for coding and programming under ₹70,000" (12 May 2026), https://laptopinsights.in/comparisons/best-laptops-for-coding-and-programming-under-70000/
- S61: Apple Developer, "Enrollment", https://developer.apple.com/programs/enroll/
- S62: Google Play Console Help, "Get started with Play Console" (registration fee), https://support.google.com/googleplay/android-developer/answer/6112435?hl=en
- S63: Web search result summary, not opened (Sentry Team US$29 monthly billing): https://markaicode.com/pricing/sentry-pricing/
- S64: Just Being Resourceful, "Claude finally gets India pricing: what changed, what didn't, and what it costs you" (19 Jul 2026), https://justbeingresourceful.com/2026/07/19/claude-finally-gets-india-pricing-what-changed-what-didnt-and-what-it-costs-you/
