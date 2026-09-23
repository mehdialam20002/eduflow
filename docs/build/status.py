"""Chapter status for the three EduFlow documents.
Usage: python status.py            -> human table
       python status.py --json     -> {"brd": {"todo": [...], "done": [...]}, ...}
A chapter is DONE when the file exists, has at least 70% of its minimum words and contains its closing section
(BRD/Blueprint: "## Key takeaways"; PRD modules: "## Test Scenarios"; other PRD chapters: word count only).
Reviewed chapters are tracked in docs/build/reviewed.json (written by the orchestrator).
"""
import json
import re
import sys
from pathlib import Path

BUILD = Path(__file__).resolve().parent
SRC = BUILD.parent


def words(text: str) -> int:
    return len(re.sub(r"```.*?```", " ", text, flags=re.S).split())


def check(doc: str, m: dict) -> tuple[str, int]:
    p = SRC / doc / m["file"]
    if not p.exists():
        return "missing", 0
    text = p.read_text(encoding="utf-8", errors="replace")
    n = words(text)
    closing_ok = True
    if doc in ("brd", "blueprint", "costguide") and m.get("kind") != "prompts" and not m["file"].startswith("9"):
        closing_ok = bool(re.search(r"^##\s+Key takeaways", text, flags=re.M | re.I))
    if m.get("kind") == "module":
        closing_ok = bool(re.search(r"^##\s+Test Scenarios", text, flags=re.M | re.I))
    if m.get("kind") == "prompts":
        # prompts live inside code fences, so the prose word count is not meaningful here
        ids = re.findall(r"^##\s+P-(\d+)", text, flags=re.M)
        want = {"10-": 10, "11-": 12, "12-": 10, "13-": 16, "14-": 12}.get(m["file"][:3], 10)
        return ("done" if len(set(ids)) >= want else "partial"), n
    if n >= 0.7 * m["words"] and closing_ok:
        return "done", n
    return "partial", n


def main() -> None:
    reviewed_path = BUILD / "reviewed.json"
    reviewed = json.loads(reviewed_path.read_text(encoding="utf-8")) if reviewed_path.exists() else {}
    out = {}
    for doc in ("brd", "prd", "blueprint", "costguide"):
        mp = BUILD / f"manifest.{doc}.json"
        if not mp.exists():
            continue
        manifest = json.loads(mp.read_text(encoding="utf-8"))
        rows = [(m, *check(doc, m)) for m in manifest]
        out[doc] = {
            "done": [m["file"] for m, s, _ in rows if s == "done"],
            "todo": [m["file"] for m, s, _ in rows if s != "done"],
            "unreviewed": [m["file"] for m, s, _ in rows if s == "done" and m["file"] not in reviewed.get(doc, [])],
            "words": sum(n for _, _, n in rows),
        }
        if "--json" not in sys.argv:
            print(f"== {doc}: {len(out[doc]['done'])}/{len(rows)} done, {out[doc]['words']:,} words")
            for m, s, n in rows:
                if s != "done":
                    print(f"   {s:8} {n:6} / {m['words']:5}  {m['file']}")
    if "--json" in sys.argv:
        print(json.dumps(out))


if __name__ == "__main__":
    main()
