"""Generates the four PRD data-dictionary chapters mechanically from the validated Prisma schema.
Every column, type, default, key and comment comes straight from docs/src/_schema/*.prisma, so the
dictionary can never drift from the schema. Re-run after any schema change:  python gen_data_dictionary.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "src" / "_schema"
PRD = ROOT / "src" / "prd"

CHAPTERS = [
    ("51-data-dictionary-platform-and-people.md", "Data Dictionary: Platform and People",
     ["00-base", "01-platform", "02-auth", "04-people"],
     "the platform tables (plans, organizations, campuses, settings, files), authentication and permissions, and the people tables (staff, students, guardians, admissions)"),
    ("52-data-dictionary-academics.md", "Data Dictionary: Academics",
     ["03-academics", "05-attendance-leave", "06-timetable-homework", "07-exams"],
     "academic years, courses, batches and subjects, attendance and leave, timetable and homework, and exams and report cards"),
    ("53-data-dictionary-finance-and-communication.md", "Data Dictionary: Finance and Communication",
     ["08-fees", "09-payments", "10-communication"],
     "fees, discounts and scholarships, payments, receipts, refunds and reconciliation, and every notification, WhatsApp, email and SMS table"),
    ("54-data-dictionary-operations-and-hr.md", "Data Dictionary: Operations, HR and Intelligence",
     ["11-operations", "12-payroll", "13-certificates-analytics-ai"],
     "library, inventory, transport and hostel, payroll, certificates, analytics snapshots and AI insights"),
]
DOMAIN = {
    "00-base": "Shared enums", "01-platform": "Platform and tenancy", "02-auth": "Authentication, RBAC, audit and consent",
    "03-academics": "Academic structure", "04-people": "People and admissions", "05-attendance-leave": "Attendance and leave",
    "06-timetable-homework": "Timetable and homework", "07-exams": "Exams and report cards", "08-fees": "Fees, discounts and scholarships",
    "09-payments": "Payments and reconciliation", "10-communication": "Communication", "11-operations": "Library, inventory, transport and hostel",
    "12-payroll": "Payroll", "13-certificates-analytics-ai": "Certificates, analytics and AI",
}
SCALARS = {"String", "Int", "BigInt", "Float", "Decimal", "Boolean", "DateTime", "Json", "Bytes"}
MODEL_RE = re.compile(r"((?:^[ \t]*//[^\n]*\n)*)^model\s+(\w+)\s*\{(.*?)^\}", re.M | re.S)
ENUM_RE = re.compile(r"((?:^[ \t]*//[^\n]*\n)*)^enum\s+(\w+)\s*\{(.*?)^\}", re.M | re.S)


def esc(s: str) -> str:
    return s.replace("|", "\\|").strip()


def snake(name: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


def load():
    models, enums, table_of = {}, {}, {}
    for f in sorted(SCHEMA.glob("*.prisma")):
        text = f.read_text(encoding="utf-8")
        for m in MODEL_RE.finditer(text):
            body = m.group(3)
            t = re.search(r'@@map\("([^"]+)"\)', body)
            table_of[m.group(2)] = t.group(1) if t else snake(m.group(2))
            models[m.group(2)] = (f.stem, m.group(1), body)
        for e in ENUM_RE.finditer(text):
            vals = [v.strip().split()[0] for v in e.group(3).splitlines() if v.strip() and not v.strip().startswith("//")]
            enums[e.group(2)] = (f.stem, " ".join(ln.strip().lstrip("/").strip() for ln in e.group(1).strip().splitlines()), vals)
    return models, enums, table_of


def pg_type(ptype: str, attrs: str, enums: dict) -> str:
    db = re.search(r"@db\.(\w+)(?:\(([^)]*)\))?", attrs)
    if db:
        kind, arg = db.group(1), db.group(2)
        mapping = {"Uuid": "uuid", "Timestamptz": "timestamptz", "Date": "date", "Text": "text", "Inet": "inet",
                   "SmallInt": "smallint", "Time": "time", "Timetz": "timetz", "Citext": "citext", "JsonB": "jsonb"}
        if kind in ("VarChar", "Char", "Decimal"):
            return f"{kind.lower()}({arg.replace(' ', '')})"
        return mapping.get(kind, kind.lower())
    return {"String": "text", "Int": "integer", "BigInt": "bigint", "Float": "double precision", "Decimal": "numeric(65,30)",
            "Boolean": "boolean", "DateTime": "timestamp(3)", "Json": "jsonb", "Bytes": "bytea"}.get(ptype, f"enum `{ptype}`" if ptype in enums else ptype)


def field_rows(body: str, enums: dict, table_of: dict, models: dict):
    fks = {}
    for m in re.finditer(r"^\s+(\w+)\s+(\w+)\??\s+@relation\(([^)]*)\)", body, re.M):
        fields = re.search(r"fields:\s*\[([^\]]+)\]", m.group(3))
        if fields and m.group(2) in table_of:
            on_delete = re.search(r"onDelete:\s*(\w+)", m.group(3))
            for fld in [x.strip() for x in fields.group(1).split(",")]:
                if fld != "organizationId" or len(fields.group(1).split(",")) == 1:
                    fks.setdefault(fld, (table_of[m.group(2)], on_delete.group(1) if on_delete else ""))
    rows, relations = [], []
    for line in body.splitlines():
        s = line.strip()
        if not s or s.startswith(("//", "@@")):
            continue
        m = re.match(r"^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$", s)
        if not m:
            continue
        name, ptype, is_list, optional, rest = m.groups()
        attrs, _, comment = rest.partition("//")
        if ptype not in SCALARS and ptype not in enums:  # relation field
            if ptype in table_of:
                relations.append((name, ptype, bool(is_list)))
            continue
        col = re.search(r'@map\("([^"]+)"\)', attrs)
        column = col.group(1) if col else name
        typ = pg_type(ptype, attrs, enums) + ("[]" if is_list else "")
        dflt = re.search(r"@default\((.*?)\)(?=\s|$)", attrs)
        default = dflt.group(1) if dflt else ("auto on update" if "@updatedAt" in attrs else "")
        default = {"uuid()": "gen uuid", "now()": "now()", "cuid()": "gen cuid", "autoincrement()": "auto increment"}.get(default, default)
        notes = []
        if "@id" in attrs:
            notes.append("PK")
        if "@unique" in attrs:
            notes.append("UK")
        if name in fks:
            tbl, od = fks[name]
            notes.append(f"FK to `{tbl}`" + (f" ({od.lower()} on delete)" if od else ""))
        if comment.strip():
            notes.append(comment.strip())
        rows.append(f"| `{column}` | {esc(typ)} | {'nullable' if optional else 'not null'} | {esc(default) if default else ''} | {esc('. '.join(notes))} |")
    return rows, relations


def index_lines(body: str) -> list[str]:
    out = []
    for m in re.finditer(r"^\s*@@(unique|index|id)\(\[([^\]]+)\](?:,\s*([^)]*))?\)", body, re.M):
        kind, cols, extra = m.group(1), m.group(2), m.group(3) or ""
        name = re.search(r'(?:name|map):\s*"([^"]+)"', extra)
        label = {"unique": "Unique", "index": "Index", "id": "Composite PK"}[kind]
        out.append(f"{label} ({', '.join(snake(c.strip().split('(')[0]) for c in cols.split(','))})" + (f" `{name.group(1)}`" if name else ""))
    return out


def chapter(fname, title, stems, blurb, models, enums, table_of):
    parts = [f"# {title}\n",
             f"**In simple words:** This chapter lists every table and column for {blurb}. "
             "It is generated directly from the validated Prisma schema, so it always matches the database exactly. "
             "Use it when you write a query, build a report, answer a support question or review a migration.\n",
             "How to read each table entry:\n",
             "- **Column** is the real PostgreSQL column name (snake_case). The Prisma field name is the camelCase version of it.",
             "- **Type** is the PostgreSQL type. `numeric(12,2)` is money, always stored together with a `currency` column. `timestamptz` values are stored in UTC.",
             "- **Null** says whether the column may be empty. **Default** is the value the database or Prisma fills in.",
             "- **Notes** marks keys (PK primary key, UK unique, FK foreign key with its delete rule) and repeats the comment from the schema.\n",
             "> **Rule:** Every tenant table has `organization_id`. Every query must filter by it; the Prisma tenant extension does this for you (see *Multi-Tenancy and Data Isolation*).\n"]
    counts = []
    for stem in stems:
        ms = [(n, v) for n, v in models.items() if v[0] == stem]
        es = [(n, v) for n, v in enums.items() if v[0] == stem]
        counts.append(f"| `{stem}.prisma` | {DOMAIN.get(stem, stem)} | {len(ms)} | {len(es)} |")
    parts.append("## Tables in This Chapter\n\n| Schema file | Domain | Tables | Enums |\n|---|---|---|---|\n" + "\n".join(counts) + "\n")
    for stem in stems:
        ms = [(n, v) for n, v in models.items() if v[0] == stem]
        es = [(n, v) for n, v in enums.items() if v[0] == stem]
        parts.append(f"## {DOMAIN.get(stem, stem)}\n\nSchema file `server/prisma/schema/{stem}.prisma` — {len(ms)} tables and {len(es)} enums.\n")
        for name, (_, comment, body) in ms:
            purpose = " ".join(ln.strip().lstrip("/").strip() for ln in comment.strip().splitlines())
            rows, rels = field_rows(body, enums, table_of, models)
            tenant = "Tenant table (filtered by `organization_id`)." if re.search(r"^\s+organizationId\s", body, re.M) else "Platform table (shared by all tenants, no `organization_id`)."
            block = [f"### {table_of[name]}\n", f"Prisma model `{name}`. {tenant}" + (f" {purpose}" if purpose else "") + "\n",
                     "| Column | Type | Null | Default | Notes |", "|---|---|---|---|---|", *rows, ""]
            idx = index_lines(body)
            if idx:
                block.append("**Indexes and constraints:** " + "; ".join(idx) + ".\n")
            belongs = [f"`{table_of[t]}`" for f, t, lst in rels if not lst]
            has = [f"`{table_of[t]}`" for f, t, lst in rels if lst]
            if belongs or has:
                rel = []
                if belongs:
                    rel.append("belongs to " + ", ".join(dict.fromkeys(belongs)))
                if has:
                    rel.append("has many " + ", ".join(dict.fromkeys(has)))
                block.append("**Relations:** " + "; ".join(rel) + ".\n")
            parts.append("\n".join(block))
        if es:
            parts.append(f"### Enums in {stem}.prisma\n\n| Enum | Values | Meaning |\n|---|---|---|")
            parts.append("\n".join(f"| `{n}` | {esc(', '.join(v[2]))} | {esc(v[1])} |" for n, v in es) + "\n")
    (PRD / fname).write_text("\n".join(parts), encoding="utf-8", newline="\n")
    return sum(1 for n, v in models.items() if v[0] in stems)


if __name__ == "__main__":
    models, enums, table_of = load()
    for fname, title, stems, blurb in CHAPTERS:
        n = chapter(fname, title, stems, blurb, models, enums, table_of)
        print(f"{fname}: {n} tables")
