"""Sets up the 4th document: EduFlow Founder Cost & Spending Guide.
Writes docs/costguide/_meta.json, _anchors.md (numbers copied from the BRD so the guide stays consistent),
_briefs/<file>.md and docs/build/manifest.costguide.json.
"""
import json
import re
from pathlib import Path

BUILD = Path(__file__).resolve().parent
SRC = BUILD.parent
DOC = SRC / "costguide"
(DOC / "_briefs").mkdir(parents=True, exist_ok=True)
(DOC / "_research").mkdir(parents=True, exist_ok=True)


def section(path: Path, heading: str) -> str:
    """Return the text of a ## or ### section (heading included) up to the next heading of the same or higher level."""
    text = path.read_text(encoding="utf-8")
    m = re.search(rf"^(#{{2,3}})\s+{re.escape(heading)}\s*$", text, flags=re.M)
    if not m:
        raise SystemExit(f"section not found: {heading} in {path.name}")
    level = len(m.group(1))
    rest = text[m.end():]
    nxt = re.search(rf"^#{{2,{level}}}\s+", rest, flags=re.M)
    return text[m.start(): m.end() + (nxt.start() if nxt else len(rest))].strip()


fin = SRC / "brd" / "21-financial-plan-and-projections.md"
hire = SRC / "brd" / "20-organization-and-hiring-plan.md"
anchors = ["# Anchor numbers from the BRD (the Cost Guide must agree with these)",
           "",
           "These sections are copied word for word from the BRD chapters *Financial Plan and Projections* and *Organization and Hiring Plan*. "
           "In the Cost Guide, the **Recommended** budget level must equal these numbers. The Minimum and Maximum levels are new ranges around them. "
           "If current market prices (from the price list) differ from a BRD assumption, keep the BRD number as the plan, show the current price, "
           "and explain the difference in one line.",
           ""]
for h in ["Cost assumptions", "People assumptions", "All costs by line", "Profit and loss projection", "Operating costs by function",
          "Headcount and payroll", "Cash view for five years", "Infrastructure cost model by scaling stage",
          "One-time setup costs", "Monthly tools and hosting", "Other running costs", "Six-month summary",
          "Bootstrap rules", "When to raise and when not to", "Dilution example", "Use of funds"]:
    anchors += [section(fin, h), ""]
anchors += [section(hire, "Total payroll by year"), ""]
(DOC / "_anchors.md").write_text("\n".join(anchors), encoding="utf-8", newline="\n")

meta = {
    "key": "costguide", "product": "EduFlow", "title": "Founder Cost and Spending Guide", "shortTitle": "Cost Guide",
    "docType": "Founder Money Guide", "tagline": "Enterprise Multi-Tenant School & Coaching ERP",
    "coverNote": "When to spend, how much and on what — from Day 0 to Year 5. Minimum, recommended and maximum budgets, researched prices, free credits, and the money mistakes to avoid.",
    "version": "1.0", "date": "21 September 2026", "owner": "Mehdi Alam (Founder)", "preparedBy": "Mehdi Alam with Claude Code",
    "status": "Baseline v1.0", "markets": "India, then UAE, USA, Australia", "output": "EduFlow_Founder_Cost_Guide.pdf", "tocDepth": 2,
    "info": [
        ["Product", "EduFlow — multi-tenant SaaS ERP for schools and coaching institutes"],
        ["Document", "Founder Cost and Spending Guide"], ["Version", "1.0"], ["Date", "21 September 2026"],
        ["Document owner", "Mehdi Alam (Founder)"],
        ["Prepared by", "Mehdi Alam with Claude Code (Anthropic) as AI finance, product and documentation assistant"],
        ["Price research", "Public vendor price pages and government fee schedules, checked in September 2026"],
        ["Exchange rates (planning)", "US$1 = Rs 85, A$1 = Rs 56, AED 1 = Rs 23"],
        ["Classification", "Confidential — internal"],
    ],
    "revisions": [{"version": "1.0", "date": "21 Sep 2026", "author": "Mehdi Alam with Claude Code", "changes": "Initial complete Cost Guide"}],
    "approvals": [
        {"role": "Founder", "name": "Mehdi Alam", "responsibility": "Owns every spending decision", "signoff": "Pending"},
        {"role": "Chartered Accountant", "name": "To be appointed", "responsibility": "Confirms tax, GST, ROC and payroll figures", "signoff": "Pending"},
    ],
    "howToRead": [
        "This guide answers one question: as a developer founder, how much money do I need, when, and for what — from today to Year 5.",
        "Every cost has three levels. Minimum is the bare bootstrap (free tiers, founder does everything). Recommended is the plan used in the BRD financial model. Maximum is the upper end a sensible founder might spend; anything above it is waste.",
        "Start with the money map in Chapter 1. Then read the stage you are in now. Prices were checked on public pages in September 2026 and are listed with sources in the Master Price List appendix. Prices change — check the vendor page before you pay.",
    ],
    "companions": [
        {"name": "Business Requirements Document (BRD)", "file": "EduFlow_BRD.pdf", "answers": "The business plan and the financial model this guide follows"},
        {"name": "Product Requirements Document (PRD)", "file": "EduFlow_PRD.pdf", "answers": "What to build"},
        {"name": "Founder Blueprint", "file": "EduFlow_Founder_Blueprint.pdf", "answers": "How and when to build, sell and scale"},
        {"name": "Founder Cost and Spending Guide", "file": "EduFlow_Founder_Cost_Guide.pdf", "answers": "How much it costs, when, and how to spend less"},
    ],
    "notice": "Prices, taxes, government fees and salary ranges are taken from public sources in September 2026 and marked Verified or Estimate. They change often. Confirm tax, GST, company-law and payroll figures with a Chartered Accountant before acting. Budgets are plans and ranges, not guarantees.",
    "parts": [
        {"title": "Part I — The Big Picture", "startsAt": "01-", "blurb": "How much the whole journey costs, stage by stage, on one page."},
        {"title": "Part II — Year 1, Stage by Stage", "startsAt": "02-", "blurb": "Exactly what to pay for before Day 1, during the 60-day sprint, at pilot and launch, and when the first people join."},
        {"title": "Part III — Cost Areas in Depth", "startsAt": "06-", "blurb": "Infrastructure, messaging and payments, people, sales and marketing, and legal and compliance — with researched prices."},
        {"title": "Part IV — Years 2 to 5 and Going Global", "startsAt": "11-", "blurb": "Budgets for each later year and the real cost of entering the UAE, USA and Australia."},
        {"title": "Part V — Spend Less, Stay Safe", "startsAt": "13-", "blurb": "Free credits and grants, the money mistakes to avoid, the founder's personal runway, and where the money comes from."},
        {"title": "Part VI — Tools", "startsAt": "17-", "blurb": "Budget templates and the monthly tracking routine."},
        {"title": "Appendices", "startsAt": "90-", "blurb": "Master price list with sources, and money terms in simple words."},
    ],
}
(DOC / "_meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

LEVELS = ("Use the three budget levels everywhere: **Minimum** (bare bootstrap: free tiers, founder does it himself, only what is legally or technically unavoidable), "
          "**Recommended** (equals the BRD plan in _anchors.md), **Maximum** (the sensible upper end; above it is waste). "
          "The standard cost table is: | Item | When to pay | Minimum | Recommended | Maximum | Can you avoid or reduce it? | (6 columns). "
          "Always say whether a price includes GST, whether it is one-time, monthly or yearly, and whether GST input tax credit can be claimed once the company is GST-registered.")

CH = [
    ("01-the-money-map.md", "The Money Map: Day 0 to Year 5", 2400, [],
     "The whole journey on a few pages. The three budget levels explained with an example. The master money map table: rows = stages (Before Day 1 = now to 4 Oct 2026; Build sprint Day 1–60 = 5 Oct – 3 Dec 2026; Pilot and launch = Dec 2026 – Mar 2027; Months 7–12 = Apr – Sep 2027; Year 2; Year 3; Year 4; Year 5), columns = what happens, Minimum total, Recommended total, Maximum total, where the money comes from. The Recommended column must equal the BRD numbers (setup Rs 90,500; first six months Rs 5,91,100; Year 1 total cost Rs 23,77,500; Years 2–5 total cost = cost of service + operating costs from the BRD P&L). Cumulative cash needed before the business pays for itself (the real out-of-pocket number: BRD says Rs 2,40,000 before the first customer pays, Rs 6 lakh capital + Rs 4 lakh personal standby). A mermaid timeline of spending stages and a mermaid pie of Year 1 spend by category. The top 10 costs by size across five years. The 10 golden rules of spending for a developer founder. How to use the rest of this guide. How prices were researched (date, sources, exchange rates, GST treatment)."),
    ("02-before-day-1-one-time-setup.md", "Before Day 1: One-Time Setup Costs", 3000, ["company-legal-tax", "software-infra-ai"],
     "Everything to pay for between today (21 Sep 2026) and Day 1 (Mon 5 Oct 2026), with a day-by-day checklist for these two weeks. Company structure choice with a cost comparison (sole proprietorship vs LLP vs One Person Company vs Private Limited) and the recommendation (Private Limited, why: Razorpay, Meta verification, DLT, investors, ESOPs). Exact registration cost breakdown (SPICe+ government fees, DSC per director, DIN, stamp duty by state — Bihar, Uttar Pradesh, Delhi — professional fees; do-it-yourself vs online service vs CA), PAN/TAN, current account (minimum balance by bank, zero-balance startup accounts), GST registration (free; when mandatory; why register voluntarily — input tax credit on Claude, Vercel, laptop), Udyam and DPIIT (free), trademark (government fee per class for startups/small entities vs others, classes 9 and 42, search first; do-it-yourself vs attorney), domains (.app, .in, .com yearly prices and renewal traps), laptop and hardware (minimum/recommended/maximum specs and prices; buy through the company to claim GST credit), phone, internet, desk setup, accounts to open on day zero (GitHub, Google Workspace or Zoho Mail, Claude, Meta Business, Razorpay) and which are free. Total compared with the BRD Rs 90,500 plus laptop. What to skip before Day 1."),
    ("03-build-sprint-day-1-to-60.md", "The Build Sprint: Day 1 to Day 60", 2800, ["software-infra-ai"],
     "Monthly running costs during the 60-day sprint (5 Oct – 3 Dec 2026). Tool by tool with the researched current price, free tier and when the free tier stops being enough: Claude plans (Pro vs Max tiers — which one a solo developer founder building a 34-module SaaS with Claude Code really needs, usage limits in practice, when to upgrade or downgrade; note that heavy agentic use hits limits and how to plan around them), GitHub, Vercel (Hobby is for non-commercial use only — when Pro becomes necessary), Railway (plans and usage pricing), Docker Desktop licence rules, local PostgreSQL/Redis, Sentry, PostHog, Better Stack, Figma, password manager, API client, Google Workspace vs Zoho Mail. A week-by-week spend calendar for the 9 sprint weeks (Week 1 5–11 Oct ... Week 9 30 Nov – 3 Dec) showing on which day each paid item starts. Minimum / Recommended / Maximum monthly totals. Sprint total compared with the BRD (Oct–Nov share of the six-month budget). Things NOT to pay for during the sprint (staging servers before pilot, paid monitoring, paid design tools, premium themes, paid courses)."),
    ("04-pilot-and-launch-costs.md", "Pilot and Launch: Month 3 to Month 6", 3000, ["messaging-payments", "company-legal-tax", "people-marketing-living"],
     "Costs from the pilot (starts Day 45, 18 Nov 2026) through the paid launch (January 2027) to March 2027, month by month (Dec, Jan, Feb, Mar). Razorpay activation and pricing, WhatsApp Business verification and message costs for demos and OTPs, DLT registration fees by operator (which operator portal to use and why), MSG91 wallet, Amazon SES, legal documents (terms, privacy policy, DPA, parental consent) — do-it-yourself templates vs lawyer review, basic security test before launch (freelancer vs firm), pilot costs (travel to 5 pilot institutes, printing training sheets, a demo tablet or phone), launch costs (landing page, Google Business Profile free, Justdial/IndiaMART listing packages, brochures and standees, first small ad tests), CA retainer, accounting software, support tools (shared inbox, WhatsApp support number, status page). Month-by-month table (Minimum / Recommended / Maximum) that reconciles to the BRD six-month summary. When customer cash starts to cover costs (the BRD net cash flow). What to avoid (launch events, paid PR, big ad spends, printing thousands of brochures)."),
    ("05-months-7-to-12-first-hires.md", "Months 7 to 12: First Hires and Growth", 2800, ["people-marketing-living"],
     "April to September 2027. Founder salary triggers from the BRD (Rs 30,000 from April 2027 after MRR Rs 1 lakh; Rs 60,000 from July 2027 after MRR Rs 3 lakh). The three first hires (customer success executive, inside sales executive, full-stack engineer) with researched salary ranges for Patna, Lucknow, Delhi NCR and Bengaluru, and the cost-to-company build-up (PF, ESI applicability thresholds, professional tax by state, gratuity, bonus, laptop, tool seats, AI coding seat). Hiring costs by channel (Naukri, LinkedIn, Internshala, Apna, referrals, campus) — free and paid options. Remote vs co-working seat vs small office (prices in Patna/Lucknow/Delhi), payroll software. Marketing ramp and infra growth month by month. The Year 1 total reconciled line by line with the BRD Rs 23,77,500 and the BRD EBITDA and cash view. What to delay if MRR is behind plan (the hiring triggers)."),
    ("06-infrastructure-and-software-by-scale.md", "Infrastructure and Software Costs by Scale", 3200, ["software-infra-ai"],
     "Unit economics first: hosting cost per organization and per active student (BRD target Rs 0.47 per student a month in Year 1). The monthly infrastructure bill at 10, 100, 500, 1,000 and 10,000 paying customers — Minimum / Recommended / Maximum — consistent with the BRD stage model (Rs 28,000; Rs 90,000; Rs 1,70,000; Rs 12,00,000). Researched price details: Vercel Pro and usage, Railway Pro usage pricing, AWS Mumbai (ap-south-1) prices for ECS Fargate, RDS PostgreSQL instance sizes, ElastiCache, S3 storage and requests, CloudFront, NAT gateway, data transfer, backups, CloudWatch logs. Tools that grow with the team (GitHub Team, Sentry paid tiers, Better Stack, PostHog paid usage, Figma, Linear or Jira, Slack). AI costs: Claude API per-million-token prices for the models AI Insights would use, a worked monthly cost for 12, 100 and 1,000 AI Insights customers, and the 17% of price target from the BRD. Cost traps with real rupee examples (NAT gateway, idle staging, log retention, egress, over-sized databases, forgotten trials, unbounded S3). Billing alerts to set on day one."),
    ("07-messaging-and-payment-costs.md", "Messaging and Payment Costs", 2800, ["messaging-payments"],
     "Every per-message and per-transaction cost. WhatsApp Cloud API pricing for India (current per-message model and categories: marketing, utility, authentication; free service window rules) with rupee rates, and rates for UAE, USA, Australia; MSG91 SMS price by volume plus DLT charges; Twilio SMS for USA/Australia plus US A2P 10DLC registration fees; Amazon SES email; push notifications (free). Payments: Razorpay standard fees by method (UPI, RuPay debit, cards, netbanking, wallets, international cards), settlement timelines, no setup fee; Stripe fees for USA, Australia and UAE; GST on gateway fees. Who pays: the canon pass-through rule (customer credits at Meta cost + 15%; gateway fees passed through at cost in Year 1). Worked examples: a 300-student school's monthly message bill; EduFlow's own OTP and demo messages; EduFlow's own subscription collections (1.5% of invoice with GST from the BRD). How to keep these costs down (utility vs marketing templates, WhatsApp first then SMS fallback, email for long content, UPI first, yearly plans to cut transaction count)."),
    ("08-people-costs-and-salaries.md", "People Costs and Salary Benchmarks", 3200, ["people-marketing-living"],
     "Researched India 2026 salary ranges (annual CTC, minimum / typical / high) for every role in the BRD hiring plan, split by city tier (Tier 2 like Patna, Lucknow, Indore; metro like Delhi NCR, Bengaluru, Pune): customer success and onboarding, support, inside sales, field sales, sales lead, full-stack engineer (junior, mid, senior), QA, designer, DevOps/SRE, engineering manager, product manager, finance/accounts, HR, country leads. Freelancers and interns (stipend ranges, platforms, when they make sense). Employer statutory costs in simple words with thresholds (EPF 12% and when it becomes mandatory, ESI, gratuity after 5 years, Payment of Bonus Act, professional tax, labour welfare fund) and a worked cost-to-company example. Benefits (group health insurance per person), equipment per hire, AI tool seats. Overseas staff costs for UAE, USA and Australia roles. The payroll table by year matching the BRD (Rs 6.30 lakh; 72; 311; 952; 2,596 lakh) with Minimum and Maximum around it. ESOP costs (valuation report, legal set-up). Hiring mistakes that cost the most."),
    ("09-sales-and-marketing-costs.md", "Sales and Marketing Costs", 3000, ["people-marketing-living"],
     "Channel by channel, with researched prices and a Minimum / Recommended / Maximum monthly budget: cold calling (SIM and unlimited plans, cloud dialers, tele-caller cost), WhatsApp outreach (Business app free, when the API costs apply), field sales (travel cost per visit in a Tier 2 city, two-wheeler allowance, daily allowance), Google Ads (researched cost per click for school ERP and coaching software keywords in India), Meta ads (cost per lead ranges in India), SEO and content (freelance writer rates in English and Hindi), YouTube demo videos (DIY vs freelancer), listings (Justdial, IndiaMART, Sulekha packages), education fairs and principal conferences (stall costs), printing (brochures, standees, visiting cards), demo kits, referral rewards (1 month free), reseller commissions (20% first year, 10% recurring from the BRD). CAC build-up that reaches the BRD Rs 12,000 in Year 1, and the marketing budget by year consistent with the BRD (Year 1 Rs 6,10,000 marketing line; acquisition spend Rs 65, 272, 909, 2,312 lakh in Years 2–5). What to avoid before product-market fit."),
    ("10-legal-compliance-tax-and-accounting.md", "Legal, Compliance, Tax and Accounting Costs", 3000, ["company-legal-tax"],
     "A yearly compliance calendar with costs for a small Indian Private Limited company: ROC annual filings (AOC-4, MGT-7/7A, DIR-3 KYC, ADT-1) government fees and late penalties, statutory audit fees by revenue size, income tax return, GST returns (monthly vs QRMP), TDS returns, CA retainer ranges by stage, company secretary (when required), legal retainer and contract reviews, trademark renewal. Tax in simple words: GST 18% on EduFlow subscriptions (collected from customers, not a cost, but a cash-flow item), input tax credit, reverse charge/OIDAR on foreign software subscriptions, corporate tax rate for a new company (section 115BAA), section 80-IAC tax holiday for DPIIT startups, angel tax status, TDS on payments. Security and compliance costs by stage: VAPT/penetration test, DPDP compliance work, ISO 27001, SOC 2 (with automation tools), cyber insurance, D&O insurance, GDPR/FERPA/COPPA legal reviews before international sales. Table: Year 1 to Year 5 legal, compliance and accounting budget (Minimum / Recommended / Maximum) consistent with the BRD. Penalties that cost the most if missed."),
    ("11-year-2-to-year-5-budgets.md", "Year 2 to Year 5: Budgets by Year", 3200, [],
     "One section per year (Year 2 Oct 2027 – Sep 2028 through Year 5 ending Sep 2031): what changes that year, a budget table by line (people, infrastructure, tools, sales and marketing, legal/compliance/audit, office and travel, international entities, AI compute, message and gateway pass-through) with Minimum / Recommended / Maximum where Recommended equals the BRD P&L (total cost of service + operating costs: Year 2 Rs 31 + 147 lakh; Year 3 134 + 574; Year 4 449 + 1,826; Year 5 1,330 + 4,787), monthly burn at year end, new spending that appears and its trigger, what can be deferred, and the funding source (customer cash and advances, the optional seed round of Rs 3–5 crore around March 2028 with the BRD use of funds). Quarter-by-quarter view for Year 2. A mermaid chart of total spend by year. The warning from the BRD cash view about customer advance money."),
    ("12-international-expansion-costs.md", "International Expansion Costs", 2800, ["international-and-programs"],
     "The real cost of selling in the UAE (Year 2), USA and Australia (Year 3 pilots). Option A: sell from India first without a foreign entity (export of services under LUT with zero-rated GST, payment collection options — Stripe availability for Indian businesses, merchant-of-record services such as Paddle or Lemon Squeezy and their fees, wire transfers, FEMA rules on export proceeds). Option B: set up a local entity — UAE free zone company (licence, visa, flexi desk, VAT registration, bank account; researched price ranges by free zone), US Delaware C-corp (Stripe Atlas or similar, registered agent, franchise tax, federal and state filings, US bank, sales tax registration), Australian Pty Ltd (ASIC registration fee, resident director requirement and options, ABN, GST registration threshold, accountant). Indian rules for owning a foreign subsidiary (ODI filings, transfer pricing basics) and their compliance cost. Local compliance and legal review costs (FERPA/COPPA, Australian Privacy Act, UAE PDPL), local sales hires, travel. First-year and yearly cost table per country (Minimum / Recommended / Maximum) consistent with the BRD CAC abroad (Rs 80,000 UAE in Year 2; Rs 1,20,000 from Year 3). Recommendation on the cheapest safe path."),
    ("13-free-credits-grants-and-startup-programs.md", "Free Credits, Grants and Startup Programs", 2600, ["international-and-programs"],
     "Every realistic way to get money or credits without giving equity, with researched amounts, eligibility, how to apply and realistic chance: cloud and software credits (AWS Activate, Google for Startups Cloud Program, Microsoft for Startups, Anthropic/Claude startup offers, Vercel, Railway, Sentry, PostHog, Notion, HubSpot, Zoho, Freshworks, GitHub, Stripe Atlas perks, Razorpay Rize), Indian government schemes (DPIIT recognition benefits, Startup India Seed Fund Scheme grant and debt amounts through incubators, section 80-IAC, trademark and patent fee rebates, CGTMSE collateral-free loans, Mudra loans), state startup policies relevant to the founder (Bihar, Uttar Pradesh, Delhi) with amounts, MeitY programmes, incubators and accelerators (IIT/IIM incubators, NASSCOM, T-Hub) and what they take in return. A table of total possible savings in Year 1 and Year 2 (Minimum realistic / Likely / Best case). An application calendar for the next 6 months. Warnings about programmes that ask for fees or big equity."),
    ("14-money-mistakes-to-avoid.md", "What to Avoid: The Money Mistakes That Hurt Most", 2600, [],
     "At least 40 mistakes grouped by stage and area (before revenue, technology, legal and tax, people, sales, money handling, funding), each with: what the mistake is, what it costs in rupees (estimate), how to avoid it, what to do instead. Include: renting an office early, hiring before the trigger, paid ads before product-market fit, branding agency, premium domain, too many tool subscriptions, moving to AWS too early, NAT gateway surprise, no billing alerts, forgotten free trials, Kubernetes for a small app, skipping trademark then forced rebrand, missing ROC deadlines (daily penalties), mixing personal and company money, not claiming GST input credit, not reconciling gateway settlements, treating customer advance money as profit, lifetime deals and deep discounts, free custom work, salary above market, undocumented ESOP promises, raising too early or on bad terms, personal guarantees on loans. Then a short section on where NOT to cut costs (security, backups, CA, legal basics, the Claude subscription, founder health)."),
    ("15-founder-personal-finance-and-runway.md", "Founder Personal Finance and Runway", 2400, ["people-marketing-living"],
     "The founder's own money. Monthly living cost by city (Patna, Lucknow, Delhi NCR, Bengaluru) at Minimum / Recommended / Maximum with researched rent and basics. Personal runway: six months of living costs plus the BRD Rs 4 lakh personal standby plus the Rs 6 lakh company capital — how to calculate yours with a worked example. Health insurance and term insurance for the founder and family (premium ranges). Emergency fund. When the founder starts taking salary (BRD triggers) and how to pay yourself tax-efficiently (salary vs director remuneration vs dividends, simply explained, confirm with CA). How much personal savings it is safe to risk. Keeping personal and company money separate. Side income during the sprint (pros and cons). Talking to family about the plan. A personal runway tracking template."),
    ("16-funding-plan-and-cash-management.md", "Funding Plan and Cash Management", 2600, ["company-legal-tax"],
     "Where the money comes from at each stage: founder capital (Rs 6 lakh on 1 Oct 2026), customer advances from yearly plans, grants and soft loans, the optional seed round (BRD cases A/B/C, Rs 3–5 crore around March 2028) — and what raising money itself costs (legal fees for term sheet, SHA and SSA, valuation report, due diligence, ROC filings for share allotment, time cost). Cash management rules with bank-account structure (operating account, tax reserve for GST and TDS, customer-advance reserve), how to compute runway monthly with examples, early-warning triggers, the cut ladder (what to cut first, second, third if cash drops), paying vendors vs collecting from customers (timing), handling refunds. The monthly finance routine (link to the BRD routine). A mermaid flowchart of the monthly cash review decision."),
    ("17-budget-templates-and-tracking.md", "Budget Templates and Monthly Tracking", 1800, [],
     "Practical templates as tables: the budget spreadsheet layout (tabs, columns, formulas explained), monthly budget vs actual with a filled sample month (March 2027), the subscription and renewal tracker (every tool, plan, price, renewal date, owner, cancel-by date), the annual renewal calendar (domains, trademark, insurance, ROC, audit, licences), spending approval rules for a solo founder (for example: any new recurring cost above Rs 2,000 a month waits one week; any one-time cost above Rs 25,000 needs a written reason), cost per customer and hosting per student tracking, and the 30-minute monthly money review checklist."),
    ("91-appendix-money-terms.md", "Money Terms in Simple Words", 1200, [],
     "Alphabetical glossary (Term | Meaning in simple words | Example from this guide) of at least 60 money, tax, legal and SaaS finance terms used in this guide: burn, runway, MRR, ARR, CAC, LTV, gross margin, EBITDA, cash flow, customer advance, pass-through, MDR, settlement, GST, input tax credit, reverse charge, OIDAR, LUT, TDS, ROC, AOC-4, MGT-7, DSC, DIN, SPICe+, DPIIT, 80-IAC, CTC, PF, ESI, gratuity, ESOP, dilution, pre-money, post-money, SAFE, convertible note, seed round, VAPT, SOC 2, ISO 27001, free tier, credits, reserved instance, savings plan, egress, and so on."),
]

manifest = []
for f, title, words, research, body in CH:
    files = ", ".join(f"_research/{r}.md" for r in research) if research else "none (use the price list appendix and the anchors)"
    (DOC / "_briefs" / f).write_text(
        f"# Brief for {f}\n\nTitle: {title}\nMinimum words: {words}\nResearch files to read: {files}\n\n"
        f"## What this chapter must cover (every item, fully)\n\n{body}\n\n## Budget conventions for this guide\n\n{LEVELS}\n",
        encoding="utf-8")
    manifest.append({"file": f, "title": title, "words": words, "research": research})
manifest.append({"file": "90-appendix-master-price-list.md", "title": "Master Price List", "words": 2500, "research": ["all"]})
manifest.sort(key=lambda x: x["file"])
(BUILD / "manifest.costguide.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
print(f"costguide: {len(manifest)} chapters, anchors {len((DOC / '_anchors.md').read_text(encoding='utf-8')):,} chars")
