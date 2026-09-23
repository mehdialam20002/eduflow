"""Generates PRD chapters that are derived mechanically from the validated sources:
  prd/90-appendix-full-prisma-schema.md   <- src/_schema/*.prisma
  prd/56-api-endpoint-catalog.md          <- src/_api/*.md (endpoint registry)
Run: python gen_generated.py
"""
import re
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "src"
PRD = SRC / "prd"

DOMAIN_TITLES = {
    "00-base": "Base: generator, datasource and shared enums",
    "01-platform": "Platform: plans, organizations, campuses, settings, files",
    "02-auth": "Auth: users, roles, permissions, sessions, audit, consent",
    "03-academics": "Academics: years, courses, batches, subjects, calendar",
    "04-people": "People: staff, students, guardians, admissions",
    "05-attendance-leave": "Attendance and leave",
    "06-timetable-homework": "Timetable and homework",
    "07-exams": "Exams and report cards",
    "08-fees": "Fees, discounts and scholarships",
    "09-payments": "Payments, receipts, refunds and reconciliation",
    "10-communication": "Communication: notifications, WhatsApp, email, SMS, credits",
    "11-operations": "Operations: library, inventory, transport, hostel",
    "12-payroll": "Payroll",
    "13-certificates-analytics-ai": "Certificates, analytics and AI insights",
}


def wrap_long_lines(text: str, limit: int = 118) -> str:
    return text  # Prisma lines stay intact; the PDF wraps them softly.


def gen_schema() -> None:
    files = sorted((SRC / "_schema").glob("*.prisma"))
    models = enums = 0
    parts = []
    for f in files:
        body = f.read_text(encoding="utf-8").strip()
        m = len(re.findall(r"^model\s+\w+", body, flags=re.M))
        e = len(re.findall(r"^enum\s+\w+", body, flags=re.M))
        models += m
        enums += e
        title = DOMAIN_TITLES.get(f.stem, f.stem)
        parts.append(f"## {title}\n\nFile `server/prisma/schema/{f.name}` — {m} models, {e} enums.\n\n```prisma\n{body}\n```\n")
    intro = (
        "# Full Prisma Schema\n\n"
        "**In simple words:** This appendix is the complete database definition of EduFlow, exactly as the code will use it. "
        "It is split into one file per domain. It was checked with the real Prisma tool (`prisma validate`), so it is ready to copy into `server/prisma/schema/`.\n\n"
        f"The schema has **{models} models** (database tables) and **{enums} enums** (fixed value lists) in {len(files)} files. "
        "Every tenant table carries `organization_id`, every table has a UUID primary key, money uses `Decimal(12, 2)` with a currency code, "
        "and all names map to snake_case tables and columns.\n\n"
        "> **Rule:** Module chapters show only the models they use. If a module chapter and this appendix ever disagree, this appendix wins.\n\n"
        "> **Tip:** Copy the `.prisma` files from `docs/schema/` in the repository instead of retyping them from this PDF.\n\n"
    )
    (PRD / "90-appendix-full-prisma-schema.md").write_text(intro + "\n".join(parts), encoding="utf-8", newline="\n")
    print(f"schema appendix: {len(files)} files, {models} models, {enums} enums")


def gen_catalog() -> None:
    files = sorted((SRC / "_api").glob("*.md"))
    sections = []  # (code, name, body)
    for f in files:
        text = f.read_text(encoding="utf-8")
        chunks = re.split(r"^##\s+", text, flags=re.M)[1:]
        for ch in chunks:
            head, _, body = ch.partition("\n")
            if re.match(r"permission keys", head.strip(), flags=re.I):
                continue
            m = re.match(r"([A-Z][A-Z0-9_-]*)\s+[—–-]\s+(.*)", head.strip())
            if not m:
                continue  # e.g. "Conventions used in this file"
            sections.append((m.group(1), m.group(2).strip(), body.strip()))
    rows = []
    total = 0
    for code, name, body in sections:
        n = len(re.findall(rf"^\|\s*`?{re.escape(code)}-API-\d+", body, flags=re.M))
        total += n
        rows.append(f"| {code} | {name} | {n} |")
    out = [
        "# API Endpoint Catalog\n",
        "**In simple words:** This chapter lists every REST endpoint of EduFlow in one place: its ID, method, path, the permission it needs and what it does. "
        "Module chapters explain requests and responses in detail; this catalog is the quick index.\n",
        f"All paths are relative to `/api/v1`. The catalog has **{total} endpoints** across {len(sections)} groups. "
        "Rules for headers, the response envelope, errors, pagination and rate limits are in the *API Standards and Conventions* chapter.\n",
        "## Endpoint Count by Module\n",
        "| Code | Module or group | Endpoints |\n|---|---|---|\n" + "\n".join(rows) + f"\n| | **Total** | **{total}** |\n",
    ]
    for code, name, body in sections:
        body = re.sub(r"^#{1,6}\s+", "#### ", body, flags=re.M)
        out.append(f"## {code}: {name}\n\n{body}\n")
    (PRD / "56-api-endpoint-catalog.md").write_text("\n".join(out), encoding="utf-8", newline="\n")
    print(f"api catalog: {len(sections)} groups, {total} endpoints")


if __name__ == "__main__":
    PRD.mkdir(parents=True, exist_ok=True)
    if any((SRC / "_schema").glob("*.prisma")):
        gen_schema()
    if any((SRC / "_api").glob("*.md")):
        gen_catalog()
