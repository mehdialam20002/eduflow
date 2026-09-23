"""Mechanical consistency check across every written chapter of the three documents.
Catches contradictions with docs/src/_canon.md that a human reader would miss in 1,500 pages.
Usage: python check_canon.py [brd|prd|blueprint]
Exit code 1 if any ERROR is found (WARN does not fail).
"""
import io
import re
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

SRC = Path(__file__).resolve().parent.parent / "src"
DOCS = sys.argv[1:] or ["brd", "prd", "blueprint", "costguide"]

# (regex that must NOT appear, explanation) — these are values that contradict the canon
FORBIDDEN = [
    (r"(?<!\d)₹\s?1,?999\s*(?:/|per\s)?\s*(?:mo|month)(?!.{0,40}(?:credit|pack|add-on))", "Growth plan price must be Rs 2,499/month"),
    (r"(?<!49,)(?<!9,)₹\s?4,?999\s*(?:/|per\s)?\s*(?:mo|month)(?!.{0,40}(?:add-on|white|training))", "Pro plan price must be Rs 5,999/month"),
    (r"(?:35|36)\s+modules", "EduFlow has 34 modules"),
    (r"(?:six|eight)\s+system\s+roles", "There are exactly seven system roles"),
    (r"(?<!into a )(?<!becomes a )(?<!into an )90[- ]day\s+sprint|(?<!into a )45[- ]day\s+sprint", "The sprint is 60 days"),
    (r"Day\s*1\s*=\s*(?:Tue|Wed|Thu|Fri|Sat|Sun)", "Day 1 is Monday 5 October 2026"),
    (r"Day\s*60\s*=\s*(?:Mon|Tue|Wed|Fri|Sat|Sun)", "Day 60 is Thursday 3 December 2026"),
    (r"Node\.js\s*(?:18|20|22)(?!.{0,60}(?:not|old|instead|upgrade|older))", "Stack uses Node.js 24 LTS"),
    (r"we\s+use\s+Express\s*4|on\s+Express\s*4", "Stack uses Express 5"),
    (r"Prisma\s*(?:4|5)\.\d", "Stack uses Prisma ORM 6.x"),
    (r"PostgreSQL\s*(?:12|13|14|15)(?!.{0,60}(?:or|not|older|upgrade|minimum))", "Stack uses PostgreSQL 16+"),
    (r"(?:store|stored|storing|using|use)\s+(?:data\s+)?in\s+MongoDB", "Database is PostgreSQL"),
    (r"split\s+into\s+microservices|as\s+microservices(?!.{0,60}(?:not|reject|later|avoid))", "Architecture is a modular monolith"),
    (r"Razorpay\s+(?:for|in|handles)\s+(?:the\s+)?(?:USA|Australia|United States|UAE)", "Razorpay is India only; Stripe is international"),
    (r"Stripe\s+(?:for|in|handles)\s+(?:the\s+)?India", "Stripe is international; Razorpay is India"),
    (r"(?:15|20|30)[- ]minute\s+refresh\s+token", "Access token is 15 min; refresh token is 30 days"),
]
# (regex, minimum count, explanation) — things that must appear somewhere in the document
REQUIRED = {
    "brd": [(r"Teachmint", 3, "competitor set"), (r"₹2,499", 2, "Growth price"), (r"DPDP", 2, "India data law")],
    "prd": [(r"organization_id|organizationId", 5, "multi-tenancy"), (r"success.*:.*true|\"success\"", 2, "response envelope")],
    "blueprint": [(r"Claude Code", 3, "the build tool")],
}
CANON_DATES = {"5 Oct 2026": "Monday", "3 Dec 2026": "Thursday", "18 Nov 2026": "Wednesday"}

errors = warns = 0
for doc in DOCS:
    d = SRC / doc
    if not d.exists():
        continue
    doc_text = []
    for f in sorted(d.glob("[0-9]*.md")):
        text = f.read_text(encoding="utf-8", errors="replace")
        doc_text.append(text)
        stripped = re.sub(r"```.*?```", " ", text, flags=re.S)  # ignore code blocks
        for pattern, why in FORBIDDEN:
            for m in re.finditer(pattern, stripped, flags=re.I):
                line = stripped[:m.start()].count("\n") + 1
                snippet = stripped[max(0, m.start() - 60):m.end() + 60].replace("\n", " ")
                print(f"ERROR {doc}/{f.name}: {why}\n      ...{snippet}...")
                errors += 1
        # every table row must have the same cell count as its header (reset between tables)
        cols = None
        in_fence = False
        for n, ln in enumerate(text.splitlines(), 1):
            if re.match(r"^\s{0,3}(```|~~~)", ln):
                in_fence = not in_fence
                cols = None
                continue
            if in_fence:
                continue
            if not ln.strip().startswith("|"):
                cols = None
                continue
            c = len(re.sub(r"`[^`]*`", "x", ln).replace(r"\|", "x").strip().strip("|").split("|"))
            if cols is None:
                cols = c
            elif c != cols:
                print(f"ERROR {doc}/{f.name}:{n}: table row has {c} cells, header has {cols}")
                errors += 1
                cols = c
        # placeholders left behind
        for m in re.finditer(r"\b(TBD|FIXME|\[placeholder\]|to be decided later|details to be decided|\.\.\.\s*rest omitted|content continues)\b", stripped, flags=re.I):
            line = stripped[:m.start()].count("\n") + 1
            print(f"WARN  {doc}/{f.name}:{line}: placeholder text '{m.group(0)}'")
            warns += 1
    joined = "\n".join(doc_text)
    for pattern, least, why in REQUIRED.get(doc, []):
        n = len(re.findall(pattern, joined))
        if n < least:
            print(f"ERROR {doc}: expected at least {least} mentions of {why} ({pattern}), found {n}")
            errors += 1
    for date, weekday in CANON_DATES.items():
        for m in re.finditer(rf"(\w+day),?\s+{re.escape(date)}|{re.escape(date)}\s*\((\w+day)\)", joined):
            said = m.group(1) or m.group(2)
            if said and said.lower() != weekday.lower():
                print(f"ERROR {doc}: {date} is a {weekday}, written as {said}")
                errors += 1

print(f"\ncanon check: {errors} error(s), {warns} warning(s) across {', '.join(DOCS)}")
sys.exit(1 if errors else 0)
