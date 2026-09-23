"""Writes docs/src/<doc>/_meta.json (cover, document control, parts) for the three EduFlow documents."""
import json
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "src"


def common_info(doc):
    return [
        ["Product", "EduFlow — multi-tenant SaaS ERP for schools and coaching institutes"],
        ["Document", doc],
        ["Version", "1.0"],
        ["Date", "20 September 2026"],
        ["Document owner", "Mehdi Alam (Founder)"],
        ["Prepared by", "Mehdi Alam with Claude Code (Anthropic) as AI product, architecture and documentation assistant"],
        ["Status", "Baseline for execution — review every quarter"],
        ["Target markets", "Phase 1: India. Phase 2: UAE, USA, Australia"],
        ["Classification", "Confidential — internal"],
    ]


APPROVALS = [
    {"role": "Founder and product owner", "name": "Mehdi Alam", "responsibility": "Owns vision, scope and final decisions", "signoff": "Pending"},
    {"role": "Technical reviewer", "name": "To be appointed (first senior engineer or advisor)", "responsibility": "Reviews architecture, security and data model", "signoff": "Pending"},
    {"role": "Domain reviewer", "name": "Pilot institute owner / principal", "responsibility": "Checks that workflows match real school and coaching operations", "signoff": "Pending"},
]
COMPANIONS = [
    {"name": "Business Requirements Document (BRD)", "file": "EduFlow_BRD.pdf", "answers": "Why we build EduFlow, for whom, how we make money, how we sell, and the 5-year plan"},
    {"name": "Product Requirements Document (PRD)", "file": "EduFlow_PRD.pdf", "answers": "Exactly what to build: architecture, 34 modules, screens, database, APIs, security"},
    {"name": "Founder Blueprint", "file": "EduFlow_Founder_Blueprint.pdf", "answers": "How to execute: 60-day plan, Claude Code prompts, engineering handbook, deployment, sales scripts, scaling"},
]
NOTICE = ("Market sizes, competitor details and legal notes in this document come from public sources and are marked as estimates where they "
          "could not be verified. Revenue numbers are targets and models, not guarantees. Verify legal, tax and compliance points with a "
          "qualified professional before acting on them.")

METAS = {
    "brd": {
        "title": "Business Requirements Document", "shortTitle": "BRD", "docType": "Business Requirements Document (BRD)",
        "coverNote": "Vision, market, customers, business model, pricing, go-to-market, KPIs, 5-year roadmap, financial plan and risks.",
        "output": "EduFlow_BRD.pdf", "tocDepth": 2,
        "howToRead": [
            "This BRD explains the business side of EduFlow in easy language: the problem, the market, the customers, how EduFlow earns money, how it will be sold, and the plan for the next five years.",
            "Read Part I first. If you are short on time, read the \"In simple words\" line at the top and the \"Key takeaways\" list at the end of every chapter. Tables hold the exact numbers; every number that is a target or an estimate is labelled so.",
            "Requirement IDs such as BR-014 in this document link to the modules described in the PRD.",
        ],
        "parts": [
            {"title": "Part I — Vision and Opportunity", "startsAt": "01-", "blurb": "What EduFlow is, the problem it solves, and what the business wants to achieve."},
            {"title": "Part II — Market and Competition", "startsAt": "04-", "blurb": "How big the market is in India and abroad, who else sells to it, and where EduFlow can win."},
            {"title": "Part III — Customers", "startsAt": "09-", "blurb": "The people who buy and use EduFlow: their goals, frustrations, daily work and buying process."},
            {"title": "Part IV — Business Model and Growth", "startsAt": "11-", "blurb": "How EduFlow makes money, what it charges, how it finds customers and how it keeps them."},
            {"title": "Part V — Requirements and Measurement", "startsAt": "16-", "blurb": "What the business needs from the product, the rules it must follow, and the numbers that show progress."},
            {"title": "Part VI — The Five-Year Plan", "startsAt": "19-", "blurb": "Roadmap, team, money and risks from Year 1 to Year 5."},
            {"title": "Appendices", "startsAt": "90-", "blurb": "Glossary, assumptions and sources."},
        ],
        "rev": "Initial complete BRD",
    },
    "prd": {
        "title": "Product Requirements Document", "shortTitle": "PRD", "docType": "Product Requirements Document (PRD)",
        "coverNote": "System architecture, RBAC, 34 modules with screens and wireframes, database design, 300+ REST APIs, security and internationalization.",
        "output": "EduFlow_PRD.pdf", "tocDepth": 2,
        "tocDepthRules": [{"match": "^(1\\d|2\\d|3\\d|4[0-3])-", "depth": 1}, {"match": "^9\\d-", "depth": 1}],
        "howToRead": [
            "This PRD describes exactly what to build. Parts I and II explain the product foundation and architecture. Parts III to VIII describe the 34 modules, one chapter per module, always in the same section order so you can find things fast.",
            "Every module chapter has: objective, user stories, workflow, screens with ASCII wireframes, validation and business rules, acceptance criteria, edge cases, database tables, Prisma models, API endpoints with request and response examples, permissions, notifications and test scenarios.",
            "IDs help you trace work: FEE-S02 is a screen, FEE-US-03 a user story, FEE-AC-05 an acceptance criterion, FEE-API-04 an endpoint. Use these IDs in Claude Code prompts, commits and test cases.",
            "The Prisma schema in the appendix was validated with the Prisma CLI. Treat it as the source of truth for the database.",
        ],
        "parts": [
            {"title": "Part I — Product Foundation", "startsAt": "01-", "blurb": "What the product is, who uses it, and what ships in which phase and plan."},
            {"title": "Part II — Architecture and Platform", "startsAt": "04-", "blurb": "How the system is built: components, multi-tenancy, login, permissions and the design system."},
            {"title": "Part III — Modules: Platform and People", "startsAt": "10-", "blurb": "Dashboard, Organizations, Multi Campus, Student Admission, Student Profile, Teachers and Staff."},
            {"title": "Part IV — Modules: Academics", "startsAt": "17-", "blurb": "Attendance, Leave, Batch, Timetable, Subjects, Homework, Exams and Report Cards."},
            {"title": "Part V — Modules: Finance", "startsAt": "25-", "blurb": "Fees, Payments, Discounts and Scholarships."},
            {"title": "Part VI — Modules: Portals and Communication", "startsAt": "29-", "blurb": "Parent Portal, Student Portal, Notifications, WhatsApp, Email and SMS."},
            {"title": "Part VII — Modules: Campus Operations", "startsAt": "35-", "blurb": "Library, Inventory, Transport, Hostel, Payroll and Certificates."},
            {"title": "Part VIII — Modules: Intelligence and Settings", "startsAt": "41-", "blurb": "Analytics, AI Insights and Settings."},
            {"title": "Part IX — Data and API", "startsAt": "50-", "blurb": "Database design, data dictionary, API standards, the full endpoint catalog, integrations and background jobs."},
            {"title": "Part X — Security, Quality and Global Readiness", "startsAt": "60-", "blurb": "Security, privacy, audit and backups, internationalization, non-functional requirements and testing."},
            {"title": "Appendices", "startsAt": "90-", "blurb": "Full Prisma schema, screen inventory, error codes, notification templates and glossary."},
        ],
        "rev": "Initial complete PRD covering all 34 modules",
    },
    "blueprint": {
        "title": "Founder Blueprint", "shortTitle": "Blueprint", "docType": "Founder Execution Guide",
        "coverNote": "60-day build plan, 60 Claude Code prompts, engineering handbook, deployment guides, sales scripts and the path from 100 to 10,000 customers.",
        "output": "EduFlow_Founder_Blueprint.pdf", "tocDepth": 2,
        "howToRead": [
            "This is your day-to-day execution guide. The BRD says why, the PRD says what, and this Blueprint says how and when.",
            "Follow Part II day by day during the 60-day sprint. Each day names the Claude Code prompts to use from Part III. Copy a prompt, paste it into Claude Code, review the result with the checklist given, commit, and move on.",
            "Parts IV and V are your engineering and deployment handbook. Part VI is your sales playbook with ready scripts in English and Hinglish. Part VII shows how the system, team and costs change as you grow from 100 to 10,000 customers.",
        ],
        "parts": [
            {"title": "Part I — Start Here", "startsAt": "01-", "blurb": "How to use this blueprint and how to work with Claude Code."},
            {"title": "Part II — The 60-Day Roadmap", "startsAt": "03-", "blurb": "Weekly milestones and a plan for every single day from Day 1 to Day 60, then the road to Day 120."},
            {"title": "Part III — Claude Code Prompt Library", "startsAt": "10-", "blurb": "Sixty copy-paste prompts that build EduFlow module by module."},
            {"title": "Part IV — Engineering Handbook", "startsAt": "20-", "blurb": "Folder structure, coding standards, Git workflow, local setup and testing."},
            {"title": "Part V — Deployment and Operations", "startsAt": "30-", "blurb": "Environments, Docker, CI/CD, Vercel, Railway, AWS, monitoring, backups and incidents."},
            {"title": "Part VI — Sales Playbook", "startsAt": "40-", "blurb": "Lead lists, cold calls, WhatsApp and email templates, demo script, objections, closing and onboarding."},
            {"title": "Part VII — Scaling from 100 to 10,000 Customers", "startsAt": "50-", "blurb": "How architecture, team, process and cost evolve at each stage."},
            {"title": "Part VIII — Founder Operating System", "startsAt": "60-", "blurb": "Weekly rhythm, budget, legal and company setup."},
            {"title": "Appendices", "startsAt": "90-", "blurb": "Environment variables, commands, checklists and the prompt index."},
        ],
        "rev": "Initial complete Founder Blueprint",
    },
}

for key, meta in METAS.items():
    rev = meta.pop("rev")
    meta.update({
        "key": key, "product": "EduFlow", "tagline": "Enterprise Multi-Tenant School & Coaching ERP", "version": "1.0",
        "date": "20 September 2026", "owner": "Mehdi Alam (Founder)", "preparedBy": "Mehdi Alam with Claude Code",
        "status": "Baseline v1.0", "markets": "India, then UAE, USA, Australia",
        "info": common_info(meta["title"]),
        "revisions": [{"version": "1.0", "date": "20 Sep 2026", "author": "Mehdi Alam with Claude Code", "changes": rev}],
        "approvals": APPROVALS, "companions": COMPANIONS, "notice": NOTICE,
    })
    out = SRC / key / "_meta.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print("wrote", out)
