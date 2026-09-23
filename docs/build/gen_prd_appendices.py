"""Compiles two PRD appendices mechanically from the written chapters:
  91-appendix-screen-inventory.md               <- every "**Screen XXX-S01 — Name (users, device)**" caption
  93-appendix-notification-template-catalog.md  <- the first table of each module's "## Notifications and Events" section
Run after the module chapters are written:  python gen_prd_appendices.py
"""
import re
from pathlib import Path

PRD = Path(__file__).resolve().parent.parent / "prd"
CAPTION = re.compile(r"^\*\*Screen\s+([A-Z]+-S\d+[a-z]?)\s*[—–-]+\s*(.+?)\*\*\s*$", flags=re.M)


def chapter_title(text: str) -> str:
    m = re.search(r"^#\s+(.+)$", text, flags=re.M)
    return m.group(1).strip() if m else "?"


def cell(s: str) -> str:
    return s.replace("|", "\\|").strip()


def screens() -> None:
    sections, total = [], 0
    for f in sorted(PRD.glob("[0-9]*.md")):
        if f.name.startswith("9"):
            continue
        text = f.read_text(encoding="utf-8")
        found = CAPTION.findall(text)
        if not found:
            continue
        rows = []
        for sid, rest in found:
            m = re.match(r"(.+?)\s*\(([^()]*)\)\s*$", rest)
            name, who = (m.group(1), m.group(2)) if m else (rest, "")
            rows.append(f"| {sid} | {cell(name)} | {cell(who)} |")
        total += len(rows)
        sections.append(f"## {chapter_title(text)}\n\n| Screen ID | Screen | Users and device |\n|---|---|---|\n" + "\n".join(rows) + "\n")
    intro = ("# Screen Inventory\n\n**In simple words:** This appendix lists every screen that has a wireframe in this PRD, grouped by chapter. "
             "Use it as the checklist of pages to build and to test.\n\n"
             f"The PRD contains **{total} wireframed screens**. The screen ID (for example `FEE-S02`) is the same ID used in the module chapter, "
             "in the Claude Code prompts of the Founder Blueprint and in test cases.\n\n")
    (PRD / "91-appendix-screen-inventory.md").write_text(intro + "\n".join(sections), encoding="utf-8", newline="\n")
    print("screen inventory:", total, "screens")


def notifications() -> None:
    sections, total = [], 0
    for f in sorted(PRD.glob("[1-4][0-9]-*-module.md")):
        text = f.read_text(encoding="utf-8")
        m = re.search(r"^##\s+Notifications and Events\s*$(.*?)(?=^##\s)", text, flags=re.M | re.S)
        if not m:
            continue
        table = re.search(r"((?:^\|.*\|\s*$\n?)+)", m.group(1), flags=re.M)
        if not table:
            continue
        rows = table.group(1).strip()
        total += max(0, len(rows.splitlines()) - 2)
        sections.append(f"## {chapter_title(text)}\n\n{rows}\n")
    intro = ("# Notification Template Catalog\n\n**In simple words:** This appendix collects, in one place, every message EduFlow can send — "
             "which event triggers it, on which channel, to whom, and the template text. The Notifications module delivers all of them.\n\n"
             f"The catalog has **{total} notification rules**. Template variables are written like `{{{{student_name}}}}`. WhatsApp and SMS templates "
             "must be approved by Meta and registered on DLT before use; see the *WhatsApp Module* and *SMS Module* chapters.\n\n")
    (PRD / "93-appendix-notification-template-catalog.md").write_text(intro + "\n".join(sections), encoding="utf-8", newline="\n")
    print("notification catalog:", total, "rules")


if __name__ == "__main__":
    screens()
    notifications()
