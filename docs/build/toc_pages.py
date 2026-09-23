"""Helper for build.mjs.
  dests  <pdf>                      -> JSON {anchor_id: 1-based page number} from the PDF's named destinations
  finish <in.pdf> <out.pdf> <title> <author> <subject> -> writes final PDF with metadata, prints page count
"""
import json
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter


def dests(pdf_path: str) -> None:
    reader = PdfReader(pdf_path)
    out = {}
    for name, dest in reader.named_destinations.items():
        try:
            page_no = reader.get_destination_page_number(dest)
        except Exception:
            continue
        if page_no is not None and page_no >= 0:
            out[str(name).lstrip("/")] = page_no + 1
    print(json.dumps(out))


def finish(src: str, dst: str, title: str, author: str, subject: str, cover: str = "", outline: str = "") -> None:
    reader = PdfReader(src)
    writer = PdfWriter(clone_from=reader)
    if cover:
        writer.insert_page(PdfReader(cover).pages[0], 0)
    if outline:
        # Chrome only emits its own bookmarks for tagged PDFs, which triples the file size,
        # so the outline is rebuilt here from the table of contents instead.
        entries = json.loads(Path(outline).read_text(encoding="utf-8"))
        parents: dict[int, object] = {}
        last = len(writer.pages) - 1
        for e in entries:
            page = min(int(e["page"]) if cover else int(e["page"]) - 1, last)
            level = int(e["level"])
            parent = next((parents[lv] for lv in range(level - 1, -1, -1) if lv in parents), None)
            item = writer.add_outline_item(str(e["label"])[:180], page, parent=parent)
            parents[level] = item
            for lv in [lv for lv in parents if lv > level]:
                del parents[lv]
    writer.add_metadata({"/Title": title, "/Author": author, "/Subject": subject, "/Creator": "EduFlow docs builder"})
    with open(dst, "wb") as fh:
        writer.write(fh)
    print(f"{dst}: {len(writer.pages)} pages (cover + {len(reader.pages)} numbered), {len(writer.outline)} bookmarks")


if __name__ == "__main__":
    if sys.argv[1] == "dests":
        dests(sys.argv[2])
    elif sys.argv[1] == "finish":
        finish(*sys.argv[2:9])
