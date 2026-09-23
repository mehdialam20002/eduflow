export const meta = {
  name: 'eduflow-write-chapters',
  description: 'Write (or finish) the listed chapters of one EduFlow document from the briefs stored on disk — resumable, limited concurrency',
  whenToUse: 'args = { doc: "brd"|"prd"|"blueprint", files: ["NN-name.md", ...], workers: 4 }',
  phases: [{ title: 'Write', detail: 'one writer per chapter, worker pool, stops early when the usage limit is hit' }],
}

const ROOT = 'E:/mysaasschool/docs'
const doc = args.doc
const files = args.files
const workers = args.workers || 4
const DIR = `${ROOT}/src/${doc}`

const CFG = {
  brd: {
    role: 'a senior business analyst and SaaS strategist writing ONE chapter of the EduFlow Business Requirements Document (BRD)',
    read: [`${ROOT}/src/_canon.md  (fixed facts: prices, dates, targets, roles, modules, competitors — never contradict it)`, `${ROOT}/src/_style-guide.md  (easy-language voice and strict Markdown rules for the PDF builder)`],
    extra: 'Use many tables, concrete numbers, worked examples and Indian context. End with "## Key takeaways".',
  },
  blueprint: {
    role: 'a hands-on startup CTO and SaaS founder-coach writing ONE chapter of the EduFlow Founder Blueprint — the solo founder\'s practical execution guide',
    read: [`${ROOT}/src/_canon.md  (fixed facts: stack, dates, pricing, targets, modules, roles — never contradict it)`, `${ROOT}/src/_style-guide.md  (easy-language voice and strict Markdown rules for the PDF builder)`, `${ROOT}/src/_shared-index.md  (PRD file names, the 60 Claude Code prompt IDs and titles, the 60-day weekly skeleton — use these exact names and IDs)`],
    extra: 'Concrete steps, real commands, complete files, word-for-word scripts, checklists, tables. Code and config must be correct and copy-paste ready for the canon stack (Node.js 24, Express 5, Prisma 6, PostgreSQL 16, Redis 7, BullMQ, Next.js App Router); never invent CLI flags, package names or GitHub Actions — if unsure, describe the step by intent. Hinglish lines are written in Latin script. End with "## Key takeaways" (except prompt-library chapters and appendices).',
  },
  prd: {
    role: 'a principal product manager and solution architect writing ONE chapter of the EduFlow Product Requirements Document (PRD)',
    read: [`${ROOT}/src/_canon.md  (fixed facts, conventions for database and API, roles, module codes — never contradict it)`, `${ROOT}/src/_style-guide.md  (easy-language voice, strict Markdown rules, and the mandatory module chapter template)`, `${ROOT}/src/_shared-index.md  (exact PRD chapter file names and titles for cross-references)`],
    extra: `Ground truth lives on disk: schema index ${ROOT}/src/_schema/README.md and the .prisma files next to it (large — use Grep for "^model <Name>" and Read a window instead of whole files), endpoint registry ${ROOT}/src/_api/*.md, permission registry ${ROOT}/src/_permissions.md. Never invent tables, fields, endpoints or permission keys that are not there. TypeScript/SQL examples must be correct for the canon stack.`,
  },
}[doc]

const prompt = (f) => `You are ${CFG.role}.
FIRST read these files completely:
${CFG.read.map(r => '- ' + r).join('\n')}
- ${DIR}/_briefs/${f}  (YOUR CHAPTER BRIEF: title, minimum words, whether web research is needed, and every item the chapter must cover)
Then write the chapter to this exact path: ${DIR}/${f}
RESUME RULE: an earlier run may have been interrupted. If the file already exists, read it, keep what is good, continue from where it stops, and make sure every item of the brief is covered and the chapter is properly closed. Do not start over unless the existing text is unusable.
The H1 must be "# <Title from the brief>".
LENGTH: at least the minimum words in the brief, HARD MAXIMUM 1.6 times the minimum (count before you finish and cut if over). The document is already several hundred pages, so longer is NOT better. Depth comes from precise steps, complete scripts, tables and examples — not from prose. No repeated explanations, no restating other chapters, no filler. If the chapter is long, write it in several steps (Write the first part, then append with Edit) so that nothing is cut off.
${CFG.extra}
If the brief says web research is needed: load the web tools with ToolSearch (query "select:WebSearch,WebFetch"), look up current figures (2024–2026 sources), and cite each source in a final "## Sources" list (publisher, title, year; URL only if you actually opened it). If something cannot be verified, label it "Estimate" and explain the reasoning. Never invent a citation. If the brief says no research is needed, rely on your expertise and label estimates.
Other chapters exist for the other topics of this document (see the file list in ${DIR}/_briefs/). Do not duplicate them; refer to them by title in italics.
Rules: follow the style guide exactly (one H1, no numbers in headings, "**In simple words:**" opener, callout labels, tables max 8 columns, text fences max 76 chars wide and plain ASCII, mermaid rules). Do not create any other file and do not edit other chapters.
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
    let r = null
    try { r = await agent(prompt(f), { label: `write:${doc}/${f}`, phase: 'Write' }) } catch (e) { r = null }
    attempts[f] = (attempts[f] || 0) + 1
    if (r === null) { consecutiveFails++; if (attempts[f] < 2) queue.push(f) } else { consecutiveFails = 0 }
    results.push({ file: f, ok: r !== null, note: r ? String(r).slice(0, 300) : null })
    log(`${doc}: ${results.filter(x => x.ok).length} written, ${results.filter(x => !x.ok).length} failed, ${queue.length} queued`)
  }
}
await Promise.all(Array.from({ length: workers }, () => worker()))
if (queue.length) log(`Stopped early with ${queue.length} chapters not started (repeated failures — probably the usage limit): ${queue.join(', ')}`)
return { doc, written: results.filter(x => x.ok).map(x => x.file), failed: results.filter(x => !x.ok).map(x => x.file), notStarted: queue, results }
