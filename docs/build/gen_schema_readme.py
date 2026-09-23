"""Generates server/prisma/schema/README.md mechanically from the .prisma files:
model index (model, table, file, purpose from the // comment above the model, field count), enum list with values, totals.
Run after every schema change:  python gen_schema_readme.py
"""
import re
from pathlib import Path

SCHEMA = Path(__file__).resolve().parent.parent.parent / "server" / "prisma" / "schema"

MODULE_HINT = {
    "00-base": "shared",
    "01-platform": "ORG, CAMP, SET, DASH (platform, plans, campuses, settings, files, imports)",
    "02-auth": "AUTH, USR, SET (users, roles, permissions, sessions, audit, consent)",
    "03-academics": "BAT, SUB, TT (academic years, courses, batches, subjects, calendar)",
    "04-people": "STU, ADM, TCH, STF (students, guardians, admissions, staff)",
    "05-attendance-leave": "ATT, LEV",
    "06-timetable-homework": "TT, HW",
    "07-exams": "EXM, RPT",
    "08-fees": "FEE, DSC, SCH",
    "09-payments": "PAY",
    "10-communication": "NTF, WA, EML, SMS, PP, SP",
    "11-operations": "LIB, INV, TRN, HST",
    "12-payroll": "PRL",
    "13-certificates-analytics-ai": "CRT, ANL, AI, DASH",
}


def main() -> None:
    files = sorted(SCHEMA.glob("*.prisma"))
    out = ["# EduFlow Prisma Schema — Index\n",
           "Generated from the `.prisma` files in this folder (do not edit by hand). The schema is validated with `prisma validate` (Prisma ORM 6.x, PostgreSQL).\n",
           "Conventions: UUID primary keys, `organizationId` on every tenant model, camelCase fields mapped to snake_case columns, snake_case plural table names, money as `Decimal(12, 2)` + `currency`, UTC timestamps, soft delete with `deletedAt` on business records, per-tenant unique keys.\n"]
    total_models = total_enums = 0
    enum_rows = []
    for f in files:
        text = f.read_text(encoding="utf-8")
        models = list(re.finditer(r"((?:^[ \t]*//[^\n]*\n)*)^model\s+(\w+)\s*\{(.*?)^\}", text, flags=re.M | re.S))
        enums = list(re.finditer(r"^enum\s+(\w+)\s*\{(.*?)^\}", text, flags=re.M | re.S))
        total_models += len(models)
        total_enums += len(enums)
        out.append(f"\n## {f.name} — {len(models)} models, {len(enums)} enums\n")
        out.append(f"Modules served: {MODULE_HINT.get(f.stem, '')}\n")
        if models:
            out.append("| Model | Table | Tenant scoped | Fields | Purpose |\n|---|---|---|---|---|")
        for m in models:
            comment, name, body = m.group(1), m.group(2), m.group(3)
            table = re.search(r'@@map\("([^"]+)"\)', body)
            purpose = " ".join(line.strip().lstrip("/").strip() for line in comment.strip().splitlines())[:220]
            fields = [ln for ln in body.splitlines() if re.match(r"^\s+\w+\s+\w", ln) and not ln.strip().startswith(("//", "@@"))]
            scalar = [ln for ln in fields if not re.search(r"@relation|\[\]", ln)]
            tenant = "Yes" if re.search(r"^\s+organizationId\s", body, flags=re.M) else "No (platform)"
            out.append(f"| `{name}` | `{table.group(1) if table else '?'}` | {tenant} | {len(scalar)} | {purpose} |")
        for e in enums:
            values = [v.strip().split()[0] for v in e.group(2).splitlines() if v.strip() and not v.strip().startswith("//")]
            enum_rows.append(f"| `{e.group(1)}` | {f.name} | {', '.join(values)} |")
    out.append("\n## All enums\n")
    out.append("| Enum | File | Values |\n|---|---|---|")
    out.extend(enum_rows)
    out.insert(3, f"\n**Totals: {total_models} models, {total_enums} enums, {len(files)} files.**\n")
    (SCHEMA / "README.md").write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(f"README.md written: {total_models} models, {total_enums} enums")


if __name__ == "__main__":
    main()
