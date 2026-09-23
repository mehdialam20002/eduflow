"""Removes duplicate method+path rows from the API registry (keeps the owning module's row), renumbers endpoint IDs
so every module stays sequential, rewrites every reference to the old IDs, and drops permission keys no endpoint uses.
Owner rules: /portal/parent/* -> PP, /portal/student/* -> SP, /payment-gateway-accounts* -> PAY, /countries -> CMN,
/enrollments* -> BAT, /batch-subject-teachers* -> SUB.
"""
import collections
import glob
import re

FILES = sorted(glob.glob(r"E:\mysaasschool\docs\src\_api\0*.md"))
ROW = re.compile(r"^\|\s*`?([A-Z]+)-API-(\d+)`?\s*\|")


def owner(path: str) -> str | None:
    for prefix, code in (("/portal/parent/", "PP"), ("/portal/student/", "SP"), ("/payment-gateway-accounts", "PAY"),
                         ("/countries", "CMN"), ("/enrollments", "BAT"), ("/batch-subject-teachers", "SUB")):
        if path.startswith(prefix):
            return code
    return None


def cells(line: str) -> list[str]:
    return [c.strip().strip("`") for c in line.strip().strip("|").split("|")]


texts = {f: open(f, encoding="utf-8").read().splitlines() for f in FILES}
seen = collections.defaultdict(list)
for f, lines in texts.items():
    for i, line in enumerate(lines):
        if ROW.match(line):
            c = cells(line)
            seen[(c[1], c[2])].append((f, i, c[0]))

drop = {}      # (file, line index) -> kept id
for (method, path), occ in seen.items():
    if len(occ) < 2:
        continue
    own = owner(path)
    keep = next((o for o in occ if o[2].split("-")[0] == own), occ[0])
    for o in occ:
        if o is not keep:
            drop[(o[0], o[1])] = keep[2]

id_map = {}
for f, lines in texts.items():
    counters = collections.Counter()
    for i, line in enumerate(lines):
        m = ROW.match(line)
        if not m:
            continue
        old = f"{m.group(1)}-API-{m.group(2)}"
        if (f, i) in drop:
            id_map[old] = ("DROP", drop[(f, i)])
            continue
        counters[m.group(1)] += 1
        id_map[old] = ("KEEP", f"{m.group(1)}-API-{counters[m.group(1)]:02d}")

# a dropped id points at the (renumbered) id of the row that was kept
final = {}
for old, (kind, val) in id_map.items():
    final[old] = val if kind == "KEEP" else id_map[val][1]

pattern = re.compile(r"\b([A-Z]+-API-\d+)\b")
used_perms = collections.Counter()
for f, lines in texts.items():
    out = []
    for i, line in enumerate(lines):
        if (f, i) in drop:
            continue
        line = pattern.sub(lambda m: final.get(m.group(1), m.group(1)), line)
        if ROW.match(line):
            used_perms[cells(line)[3]] += 1
        out.append(line)
    texts[f] = out

removed_keys = []
for f, lines in texts.items():
    out, in_keys = [], False
    for line in lines:
        if line.startswith("## "):
            in_keys = line.lower().startswith("## permission keys")
        m = re.match(r"^\|\s*`?([a-z_]+\.[a-z_]+)`?\s*\|", line) if in_keys else None
        if m and used_perms[m.group(1)] == 0:
            removed_keys.append(m.group(1))
            continue
        out.append(line)
    open(f, "w", encoding="utf-8", newline="\n").write("\n".join(out) + "\n")

print(f"dropped {len(drop)} duplicate rows; renumbered {sum(1 for o, n in final.items() if o != n)} ids; removed unused permission keys: {removed_keys}")
