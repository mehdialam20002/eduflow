export const meta = {
  name: 'eduflow-costguide',
  description: 'Research real prices, build a master price list, write the Founder Cost and Spending Guide chapters, then audit every number',
  whenToUse: 'args = { workers: 3, skipResearch: false, files: [optional subset of chapter files] }',
  phases: [
    { title: 'Research', detail: '5 researchers verify current prices on the web, one area each' },
    { title: 'Price list', detail: 'merge research into one master price list (single source of truth)' },
    { title: 'Write', detail: 'one writer per chapter, worker pool' },
    { title: 'Audit', detail: 'recompute every total and check the guide against the BRD plan, then fix' },
  ],
}

const ROOT = 'E:/mysaasschool/docs'
const DIR = `${ROOT}/src/costguide`
const workers = args.workers || 3
const ALL = [
  '01-the-money-map.md', '02-before-day-1-one-time-setup.md', '03-build-sprint-day-1-to-60.md', '04-pilot-and-launch-costs.md',
  '05-months-7-to-12-first-hires.md', '06-infrastructure-and-software-by-scale.md', '07-messaging-and-payment-costs.md',
  '08-people-costs-and-salaries.md', '09-sales-and-marketing-costs.md', '10-legal-compliance-tax-and-accounting.md',
  '11-year-2-to-year-5-budgets.md', '12-international-expansion-costs.md', '13-free-credits-grants-and-startup-programs.md',
  '14-money-mistakes-to-avoid.md', '15-founder-personal-finance-and-runway.md', '16-funding-plan-and-cash-management.md',
  '17-budget-templates-and-tracking.md', '91-appendix-money-terms.md',
]
// write detail chapters first; the money map and later-year summary read them
const ORDER = ['02-', '03-', '04-', '05-', '06-', '07-', '08-', '09-', '10-', '12-', '13-', '15-', '16-', '11-', '14-', '17-', '01-', '91-']
const files = (args.files || ALL).slice().sort((a, b) => ORDER.findIndex(p => a.startsWith(p)) - ORDER.findIndex(p => b.startsWith(p)))

const AREAS = [
  { key: 'company-legal-tax', topics: `India company and compliance costs for a bootstrapped SaaS startup in 2026: Private Limited incorporation via SPICe+ (MCA government fees for small authorised capital, DSC price per director, DIN, name reservation, stamp duty for Bihar, Uttar Pradesh and Delhi, typical professional fees of online services such as Vakilsearch, IndiaFilings, LegalWiz, and of a local CA), LLP and OPC costs for comparison, sole proprietorship; PAN/TAN; current account minimum balances and startup accounts (HDFC, ICICI, Kotak, Axis, IDFC First, RazorpayX); GST registration (free, thresholds, voluntary registration), GST return types (monthly vs QRMP), input tax credit rules, reverse charge / OIDAR for foreign software subscriptions bought by a registered business; trademark filing fees (individual/startup/small entity vs others, per class, e-filing), attorney fees, renewal every 10 years; Udyam and DPIIT recognition (free) and DPIIT benefits (80-IAC tax holiday, trademark and patent fee rebates, self-certification); corporate tax for new companies (115BAA rate incl. surcharge and cess), angel tax status after Budget 2024; ROC annual compliance (AOC-4, MGT-7/7A, DIR-3 KYC, ADT-1) fees and late fees per day, statutory audit fees for small companies, CA monthly retainer ranges in Tier 2 cities and metros, company secretary requirement thresholds; legal document costs (terms of service, privacy policy, DPA) via templates vs lawyers; VAPT/penetration test price ranges in India; ISO 27001 and SOC 2 costs (consultant, auditor, automation tools like Vanta/Drata/Sprinto); cyber insurance premium ranges; fundraising legal costs (term sheet, SHA/SSA, valuation report by merchant banker/registered valuer, share allotment filings PAS-3).` },
  { key: 'software-infra-ai', topics: `Current prices (September 2026) of every tool and cloud service a solo developer founder uses to build and run a Next.js + Express + PostgreSQL + Redis SaaS: Claude plans (Free, Pro, Max tiers — prices in USD, what Claude Code usage each includes, usage limits behaviour), Claude API per-million-token prices for current models (Opus, Sonnet, Haiku families), GitHub (Free, Team), Vercel (Hobby non-commercial rule, Pro per seat and included usage, overage), Railway (Hobby, Pro, usage pricing for vCPU, memory, volume storage, egress), Render and Fly.io as alternatives, Docker Desktop licence rules, AWS Mumbai ap-south-1 prices (ECS Fargate per vCPU-hour and GB-hour, RDS PostgreSQL db.t4g.micro/small/medium and db.m6g.large On-Demand hourly, storage per GB-month, ElastiCache smallest nodes, S3 standard per GB and requests, CloudFront per GB India, NAT gateway hourly + per GB, data transfer out, CloudWatch logs ingestion), Amazon SES per 1,000 emails, Sentry (Developer free, Team, Business), PostHog (free tier limits, paid usage), Better Stack free and paid, Grafana Cloud free, Google Workspace India prices per user (Business Starter/Standard), Zoho Mail and Zoho Workplace, Zoho Books, Zoho CRM free edition, password managers (Bitwarden, 1Password), Figma, Linear, Slack, Cloudflare free, domain prices for .app, .in, .com (registration and renewal) at common registrars, laptop prices in India for a developer (entry, recommended, high-end), Apple Developer Program and Google Play developer fees.` },
  { key: 'messaging-payments', topics: `Messaging and payment prices for India, UAE, USA and Australia in 2026: WhatsApp Business Platform (Cloud API) pricing model and current per-message rates by category (marketing, utility, authentication; service conversations) for India, UAE, USA and Australia; free customer service window rules; business verification requirements; MSG91 SMS price per SMS by volume for transactional/OTP in India; TRAI DLT: entity registration fees on each operator portal (Jio, Airtel, Vodafone Idea, BSNL, Tata), template registration, per-SMS scrubbing charges; Twilio SMS prices for USA and Australia, US A2P 10DLC brand and campaign registration fees; Amazon SES; Firebase Cloud Messaging (free); Razorpay standard pricing by method (UPI, RuPay debit, other debit, credit cards, netbanking, wallets, international cards, EMI), setup/AMC fees, settlement timeline, Razorpay Subscriptions and Payment Links pricing, GST on fees; Cashfree, PayU and PhonePe PG as comparisons; Stripe standard pricing in USA, Australia and UAE (domestic cards, international cards, ACH, BECS, currency conversion), Stripe Tax and Billing fees; Stripe availability for Indian-registered businesses (current rules); merchant-of-record services (Paddle, Lemon Squeezy) fees; UPI MDR rules for merchants.` },
  { key: 'people-marketing-living', topics: `India 2026 people, marketing and living costs: salary ranges (annual CTC) for customer success/onboarding executive, support executive, inside sales executive, field sales executive, sales manager, junior/mid/senior full-stack (Node/React) developer, QA engineer, UI/UX designer, DevOps engineer, engineering manager, product manager, accounts executive, HR executive — in Tier 2 cities (Patna, Lucknow, Indore, Jaipur) vs metros (Delhi NCR, Bengaluru, Pune), using sources like Naukri, AmbitionBox, Glassdoor, Instahyre, LinkedIn salary reports, Indeed; intern stipend ranges; freelancer hourly rates in India; employer statutory costs (EPF 12% and applicability at 20 employees and wage ceiling Rs 15,000, ESI 3.25% and wage limit Rs 21,000 and 10-employee threshold, gratuity, Payment of Bonus Act, professional tax in Bihar/UP/Delhi/Karnataka/Maharashtra, labour welfare fund); group health insurance premium per employee; job portal costs (Naukri recruiter plans, LinkedIn job posts, Internshala, Apna, Indeed free posting); co-working seat prices in Patna, Lucknow, Delhi NCR, Bengaluru; marketing: Google Ads cost per click in India for keywords like "school management software", "school ERP", "coaching institute software", "fee management software"; Meta ads CPM and cost per lead in India for B2B/education; Justdial, IndiaMART and Sulekha paid listing packages; education fairs / school expos stall costs in India; printing costs (brochures, standees, visiting cards); freelance content writer rates (English, Hindi); video editing freelancer rates; cloud telephony / dialer prices (Exotel, MyOperator, Knowlarity, Tata Tele), unlimited mobile plans; travel costs in Tier 2 cities (auto, cab per km, two-wheeler fuel allowance norms); founder living costs: 1BHK rent in Patna, Lucknow, Delhi NCR, Bengaluru, groceries and utilities, broadband plans, health insurance family floater premium for a 30-year-old, term insurance premium for Rs 1 crore cover.` },
  { key: 'international-and-programs', topics: `(1) International entity costs in 2026: UAE free zone company setup and yearly renewal (IFZA, Meydan, SHAMS, RAKEZ, DMCC — licence, establishment card, visa, flexi desk, VAT registration threshold AED 375,000, corporate tax 9% above AED 375,000 and small business relief, bank account), UAE PDPL basics; USA: Delaware C-corp formation through Stripe Atlas (fee), Firstbase or Clerky, registered agent yearly fee, Delaware franchise tax (assumed par value method minimum) and annual report fee, federal tax return costs, US bank (Mercury, Brex), sales tax on SaaS basics and Stripe Tax, FERPA/COPPA legal review cost ranges; Australia: Pty Ltd registration fee with ASIC, annual review fee, resident director requirement and nominee director service costs, ABN free, GST registration threshold A$75,000, accountant costs; India rules for an Indian company owning a foreign subsidiary (ODI via authorised dealer bank, Form FC, annual performance report) and export of services under LUT; realization of export proceeds timeline under FEMA. (2) Startup credits and programmes: AWS Activate (Founders and Portfolio tiers), Google for Startups Cloud Program (tiers), Microsoft for Startups Founders Hub (current credits), Anthropic startup programme / Claude for Startups credits, Vercel for Startups, Sentry for startups, PostHog for startups, Notion for startups, HubSpot for Startups discounts, Zoho for Startups, Freshworks for Startups, Razorpay Rize, Stripe Atlas partner perks, GitHub for Startups; Indian government: Startup India Seed Fund Scheme (grant up to Rs 20 lakh, debt/convertible up to Rs 50 lakh via incubators; current status), DPIIT recognition benefits, CGTMSE, Mudra (Tarun Plus limit), Bihar Startup Policy (seed fund amount, incubators), Uttar Pradesh Startup Policy, Delhi startup policy status, MeitY TIDE 2.0 and SAMRIDH, NASSCOM 10,000 Startups, incubators in Patna (IIT Patna, BIA), Lucknow (IIM Lucknow EIC) and what they charge or take.` },
]

const researchPrompt = (a) => `You are a meticulous startup finance researcher. Today is 21 September 2026. The founder is a solo developer building EduFlow, a multi-tenant SaaS ERP for schools and coaching institutes in India (later UAE, USA, Australia), bootstrapped, based in North India (Patna / Lucknow / Delhi NCR region).
Read ${ROOT}/src/_canon.md (product, stack, pricing, targets) and skim ${DIR}/_anchors.md (what the business plan assumed) so you know which prices matter.
Load the web tools first: ToolSearch with query "select:WebSearch,WebFetch". Then research CURRENT prices for this area: ${a.topics}
Rules:
- Prefer official vendor price pages and government fee schedules; open the page (WebFetch) for every price you mark Verified. Use reputable secondary sources only when no official page exists, and mark those Estimate.
- If you cannot find a current price, give your best estimate with the reasoning and mark it Estimate. Never invent a source or URL.
- Convert to rupees at US$1 = Rs 85, A$1 = Rs 56, AED 1 = Rs 23. Say whether a price includes GST/VAT.
- Where the business plan assumption in _anchors.md differs from what you find, note it.
RESUME RULE: if ${DIR}/_research/${a.key}.md already exists, read it, keep the verified rows, and only add what is missing. Write your findings to ${DIR}/_research/${a.key}.md as Markdown: an H1 title, then grouped tables with columns | Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status (Verified/Estimate) | Source |, then a "Differences from the business plan" list, then a "Sources" list (publisher, page title, URL you opened, date checked). Be exhaustive for the topics above but keep it factual and compact (tables, not essays). Write in several steps if long.
Return: number of price rows, how many Verified vs Estimate, and the 5 most important findings for a bootstrapped founder.`

const writerPrompt = (f) => `You are a startup CFO and bootstrapped SaaS founder-coach writing ONE chapter of the EduFlow "Founder Cost and Spending Guide" — a practical guide for a solo developer founder in India that says when to spend, how much and on what, from Day 0 to Year 5, with minimum / recommended / maximum budgets and what to avoid.
FIRST read these files completely:
- ${ROOT}/src/_canon.md  (fixed facts: dates, pricing, targets, stack, roles — never contradict it)
- ${ROOT}/src/_style-guide.md  (easy-language voice and strict Markdown rules for the PDF builder)
- ${DIR}/_anchors.md  (the BRD financial plan: the Recommended budget level MUST equal these numbers)
- ${DIR}/90-appendix-master-price-list.md  (researched, dated vendor prices: use these numbers; do not invent other prices)
- ${DIR}/_briefs/${f}  (YOUR CHAPTER BRIEF: title, minimum words, which research files to read, and every item to cover)
- the research files named in your brief, in ${DIR}/_research/
If a chapter you depend on already exists in ${DIR} (for example the stage chapters, when you write the money map or the Year 2–5 budgets), read it and use the same totals.
Then write the chapter to this exact path: ${DIR}/${f}
RESUME RULE: if the file already exists, read it, keep what is good, continue from where it stops, and make sure every brief item is covered and the chapter is properly closed.
The H1 must be "# <Title from the brief>". Start with "**In simple words:**". End with "## Key takeaways" (4–7 bullets), except the appendix.
LENGTH: at least the minimum words in the brief, HARD MAXIMUM 1.6 times the minimum. Depth comes from exact numbers, tables, worked examples and clear rules — not prose.
MONEY RULES: show every total's arithmetic so the founder can change inputs; totals must add up exactly; write rupees in Indian format (Rs 1,20,000; Rs 3.6 crore); say one-time vs monthly vs yearly and whether GST is included; label anything not in the price list as "Estimate" with one-line reasoning; never promise savings or grants — say what is likely. Refer to prices as "(see Master Price List)" rather than repeating long source lists. You may use WebSearch for one or two missing facts only (load it with ToolSearch "select:WebSearch,WebFetch"); if you do, add a short "## Sources" list.
Rules: follow the style guide (one H1, no numbers in headings, callout labels such as > **Tip:** and > **Warning:**, tables max 8 columns, text fences max 76 chars wide and plain ASCII, mermaid rules). Do not create any other file and do not edit other chapters.
When finished run the linter and fix every ERROR, re-running until clean:
node ${ROOT}/build/check-md.mjs "${DIR}/${f}"
Return 2 lines: file + approximate word count, and any number a reviewer should double-check.`

let research = 'skipped'
if (!args.skipResearch) {
  phase('Research')
  const areas = args.researchAreas ? AREAS.filter(a => args.researchAreas.includes(a.key)) : AREAS
  research = await parallel(areas.map(a => () => agent(researchPrompt(a), { label: `research:${a.key}`, phase: 'Research' })))
  const failedAreas = areas.filter((a, i) => !research[i]).map(a => a.key)
  if (failedAreas.length) { log(`Research failed for ${failedAreas.join(', ')} — stopping so the next run resumes research first`); return { researchFailed: failedAreas } }
  phase('Price list')
  const priceList = await agent(`You are the editor of the EduFlow Founder Cost and Spending Guide. Read ${ROOT}/src/_style-guide.md, ${DIR}/_anchors.md and ALL five research files in ${DIR}/_research/ (company-legal-tax, software-infra-ai, messaging-payments, people-marketing-living, international-and-programs). Some may be missing if a researcher failed — work with what exists and say so.
RESUME RULE: ${DIR}/90-appendix-master-price-list.md may already exist and stop part-way (look for a literal @@CONTINUE@@ marker at the end). If so, read it, keep every group already written, delete the marker, and continue from the first missing group. Never restart it from scratch. Never leave a marker in the finished file.
Write ${DIR}/90-appendix-master-price-list.md — the single source of truth for prices that every chapter will use:
- H1 "# Master Price List", then "**In simple words:**" (what this is, checked in September 2026, prices change, confirm before paying), then how to read it (Verified vs Estimate, exchange rates US$1 = Rs 85, A$1 = Rs 56, AED 1 = Rs 23, GST treatment).
- One H2 per group (Company setup and registration; Ongoing legal, tax and accounting; Security and compliance; Development tools and AI; Hosting and cloud; Messaging; Payments; People and salaries; Hiring and HR; Sales and marketing; Office, travel and living; International entities; Startup credits and government schemes), each with a table | Item | Vendor and plan | Price | In Rs | Unit | Free tier or notes | Status | (7 columns; keep cells short).
- Resolve conflicts between research files (pick the best-sourced value, note the range).
- H2 "Business plan assumptions vs current prices": table | Item | BRD assumed | Current price | Difference and what to do |.
- H2 "Sources": numbered list of every source (publisher, page title, URL opened, date checked).
Follow the style guide (no numbers in headings, tables max 8 columns, no raw HTML). Write in several steps. Then run: node ${ROOT}/build/check-md.mjs "${DIR}/90-appendix-master-price-list.md" and fix all errors.
Return: number of price rows, and the list of BRD assumptions that are now wrong.`, { label: 'master-price-list', phase: 'Price list' })
  if (!priceList) { log('Master price list failed — stopping'); return { priceListFailed: true } }
}

phase('Write')
const queue = [...files]
const results = []
let consecutiveFails = 0
const attempts = {}
async function worker() {
  while (queue.length && consecutiveFails < 3) {
    const f = queue.shift()
    let r = null
    try { r = await agent(writerPrompt(f), { label: `write:costguide/${f}`, phase: 'Write' }) } catch (e) { r = null }
    attempts[f] = (attempts[f] || 0) + 1
    if (r === null) { consecutiveFails++; if (attempts[f] < 2) queue.push(f) } else { consecutiveFails = 0 }
    results.push({ file: f, ok: r !== null, note: r ? String(r).slice(0, 300) : null })
    log(`costguide: ${results.filter(x => x.ok).length} written, ${results.filter(x => !x.ok).length} failed, ${queue.length} queued`)
  }
}
await Promise.all(Array.from({ length: workers }, () => worker()))
if (queue.length) { log(`Stopped early; not started: ${queue.join(', ')}`); return { research, results, notStarted: queue } }

phase('Audit')
const AUDIT_SCHEMA = { type: 'object', properties: { issues: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['file', 'problem', 'fix'] } } }, required: ['issues'] }
const audit = await agent(`You are the numbers auditor for the EduFlow Founder Cost and Spending Guide. Read ${DIR}/_anchors.md (the BRD plan), ${DIR}/90-appendix-master-price-list.md, then EVERY chapter file in ${DIR} (all .md files not starting with "_"). Check, with actual arithmetic:
1. Every table total, subtotal and percentage adds up (recompute them).
2. The Recommended level equals the BRD plan: setup Rs 90,500; six-month total Rs 5,91,100; Year 1 total cost Rs 23,77,500; Years 2–5 cost of service and operating costs from the P&L; payroll by year; infrastructure by stage.
3. The money map chapter (01) agrees with the stage chapters (02–05) and the Year 2–5 chapter (11) for every stage total, at all three levels.
4. The same vendor price is the same in every chapter and matches the master price list.
5. Minimum <= Recommended <= Maximum everywhere.
Report up to 50 concrete issues, each with the file and the exact fix (the correct number and where).`, { label: 'numbers-audit', phase: 'Audit', schema: AUDIT_SCHEMA, effort: 'high' })
const issues = (audit && audit.issues) || []
log(`Audit found ${issues.length} issues`)
const byFile = {}
for (const i of issues) { const k = i.file.split('/').pop(); (byFile[k] = byFile[k] || []).push(i) }
const fixes = await parallel(Object.entries(byFile).map(([file, list]) => () => agent(`Fix number issues in ${DIR}/${file} (EduFlow Founder Cost and Spending Guide). Read ${DIR}/_anchors.md and the chapter, then apply each fix with the Edit tool, recomputing any totals that depend on the changed numbers. The BRD anchors win every conflict. Keep the easy-language style. Issues:
${JSON.stringify(list, null, 1)}
Then run: node ${ROOT}/build/check-md.mjs "${DIR}/${file}" and fix all errors. Return one line per fix.`, { label: `fix:${file}`, phase: 'Audit' })))
return { research: Array.isArray(research) ? research.map(r => r ? String(r).slice(0, 300) : null) : research, written: results.filter(x => x.ok).map(x => x.file), failed: results.filter(x => !x.ok).map(x => x.file), issues: issues.length, fixed: fixes.filter(Boolean).length }
