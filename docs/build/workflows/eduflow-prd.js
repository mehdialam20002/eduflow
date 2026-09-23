export const meta = {
  name: 'eduflow-prd',
  description: 'Write the permission matrix, then all PRD chapters (cross-cutting first, then the 34 module chapters) from briefs on disk — resumable worker pool',
  phases: [
    { title: 'Permissions', detail: 'permission keys x 7 roles matrix (module chapters need it)' },
    { title: 'Write', detail: 'one writer per PRD chapter, 4 workers, stops early when the usage limit is hit' },
  ],
}

const ROOT = 'E:/mysaasschool/docs'
const DIR = `${ROOT}/prd`
const files = args.files
const workers = args.workers || 4
const needPerms = (f) => /^(07|1\d|2\d|3\d|4[0-3])-/.test(f)

const permsPromise = args.skipPermissions ? Promise.resolve('skipped') : agent(`You are the security architect for EduFlow. Read ${ROOT}/canon.md (section Roles and the module list) and ${ROOT}/api/_permission-keys.txt — the complete list of 269 permission keys with their meaning and how many endpoints use each (extracted mechanically from the API registry; if a meaning is unclear, Grep the key in ${ROOT}/api/*.md to see the endpoints that use it).
Write ${ROOT}/permissions.md with:
1. "# EduFlow Permission Registry" and a short explanation of the model in simple words (roles, custom roles, the scope words Own and Campus, how the API enforces permissions and ownership, how SUPER_ADMIN reaches tenant data only through audited impersonation).
2. One section per permission prefix ("## <prefix> — <Module name>", in canon module order, then users, roles, billing, platform, files, imports, audit, parentportal, studentportal) with a table: | Permission | Meaning | SUPER_ADMIN | ORG_ADMIN | PRINCIPAL | TEACHER | ACCOUNTANT | PARENT | STUDENT | using exactly the cell words Yes, No, Own, Campus, View. EVERY one of the 269 keys must appear exactly once. Apply least privilege and real school logic: Teacher acts only on own batches and subjects (Own); Accountant handles finance for assigned campuses (Campus) and sees students read-only; Principal runs academics and approvals for assigned campuses (Campus) and sees finance summaries (View); ORG_ADMIN has Yes on everything inside the organization; PARENT and STUDENT have No everywhere except parentportal.access / studentportal.access and self endpoints; platform.* is SUPER_ADMIN only; money approvals respect separation of duties (the creator of a refund or write-off cannot be the approver — note this under the table).
3. "## Module summary matrix": 34 modules x 7 roles with one overall cell word per module.
4. "## Custom role presets": Librarian, Transport Manager, Hostel Warden, HR Manager, Front Desk, Exam Coordinator — each with its list of permission keys.
Write the file in several steps (Write, then append with Edit) so nothing is cut off. Finish by counting the keys in your file and confirming the count equals 269.
Return: number of keys written and any key whose meaning you had to guess.`, { label: 'permissions-matrix', phase: 'Permissions' })

const prompt = (f) => `You are a principal product manager and solution architect writing ONE chapter of the EduFlow Product Requirements Document (PRD).
FIRST read these files completely:
- ${ROOT}/canon.md  (fixed facts, conventions for database and API, roles, module codes — never contradict it)
- ${ROOT}/style-guide.md  (easy-language voice, strict Markdown rules for the PDF builder, and the mandatory module chapter template)
- ${ROOT}/shared-index.md  (exact PRD chapter file names and titles for cross-references)
- ${DIR}/_briefs/${f}  (YOUR CHAPTER BRIEF: title, minimum words, sources to read, and every item the chapter must cover)
Ground truth lives on disk — never invent tables, fields, endpoints or permission keys that are not there:
- schema index E:/mysaasschool/server/prisma/schema/README.md (every model, table, enum) and the .prisma files next to it. They are large: use Grep for "^model <Name>" / "^enum <Name>" and Read a window (offset/limit) instead of whole files.
- endpoint registry ${ROOT}/api/*.md (1,250 endpoints; read the section of your module: Grep "^## <CODE> " to find it).
- permission registry ${ROOT}/permissions.md (Grep your module's prefix to get its rows).
Then write the chapter to this exact path: ${DIR}/${f}
RESUME RULE: an earlier run may have been interrupted. If the file already exists, read it, keep what is good, continue from where it stops, and make sure every item of the brief is covered and the chapter is properly closed. Do not start over unless the existing text is unusable.
The H1 must be "# <Title from the brief>".
LENGTH: at least the minimum words in the brief, HARD MAXIMUM 1.6 times the minimum (a 4,500-word module chapter = 4,500 to 7,200 words; count before you finish and cut if over). The PRD is already over 800 pages, so longer is NOT better. Depth comes from precise tables, IDs, rules and examples — not from prose. No repeated explanations, no restating other chapters, no filler. Write the chapter in several steps (Write the first part, then append with Edit) so that nothing is cut off.
For modules with many endpoints: list ALL of the module's endpoints in the summary table (ID, method, path, permission, purpose), then give full request + success response + error table for the 8–10 most important ones.
TypeScript, SQL, JSON and Prisma examples must be correct for the canon stack (Node.js 24, Express 5, Prisma 6, PostgreSQL 16, Redis 7, BullMQ, Next.js App Router) and must use the canon response envelope and error codes.
Rules: follow the style guide exactly (one H1, no numbers in headings, "**In simple words:**" opener, callout labels, tables max 8 columns, text fences max 76 chars wide and plain ASCII, mermaid rules — quote every label that has punctuation). Refer to other chapters by title in italics. Do not create any other file and do not edit other chapters.
When finished run the linter and fix every ERROR (and reasonable WARNs), re-running until clean:
node ${ROOT}/build/check-md.mjs "${DIR}/${f}"
Return 2 lines: file name + approximate word count, and anything a reviewer should double-check.`

const queue = [...files]
const results = []
let consecutiveFails = 0
const attempts = {}
async function worker() {
  while (queue.length && consecutiveFails < 3) {
    const f = queue.shift()
    if (needPerms(f)) { try { await permsPromise } catch (e) { /* continue without it */ } }
    let r = null
    try { r = await agent(prompt(f), { label: `write:prd/${f}`, phase: 'Write' }) } catch (e) { r = null }
    attempts[f] = (attempts[f] || 0) + 1
    if (r === null) { consecutiveFails++; if (attempts[f] < 2) queue.push(f) } else { consecutiveFails = 0 }
    results.push({ file: f, ok: r !== null, note: r ? String(r).slice(0, 300) : null })
    log(`prd: ${results.filter(x => x.ok).length} written, ${results.filter(x => !x.ok).length} failed, ${queue.length} queued`)
  }
}
await Promise.all(Array.from({ length: workers }, () => worker()))
let perms = null
try { perms = await permsPromise } catch (e) { perms = null }
if (queue.length) log(`Stopped early with ${queue.length} chapters not started (repeated failures — usage limit or network): ${queue.join(', ')}`)
return { perms: perms ? String(perms).slice(0, 500) : null, written: results.filter(x => x.ok).map(x => x.file), failed: results.filter(x => !x.ok).map(x => x.file), notStarted: queue }
