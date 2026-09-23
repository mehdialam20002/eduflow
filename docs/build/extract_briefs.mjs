// One-off helper: pulls the chapter briefs out of the first BRD / Blueprint workflow scripts and stores them on disk
// as docs/<doc>/_briefs/<chapter-file>.md plus docs/build/manifest.<doc>.json, so later runs only need file names.
import fs from 'node:fs';
import path from 'node:path';

const [, , doc, scriptPath] = process.argv;
const src = fs.readFileSync(scriptPath, 'utf8');
const start = src.indexOf('const chapters = [');
const end = src.indexOf('const titles');
const RESEARCH = 'RESEARCH';
const ROOT = 'E:/mysaasschool/docs';
const DIR = `${ROOT}/${doc}`;
// eslint-disable-next-line no-new-func
const chapters = new Function('RESEARCH', 'ROOT', 'DIR', `${src.slice(start, end)}; return chapters;`)(RESEARCH, ROOT, DIR);
const outDir = path.join('E:/mysaasschool/docs/src', doc, '_briefs');
fs.mkdirSync(outDir, { recursive: true });
const manifest = [];
for (const c of chapters) {
  fs.writeFileSync(path.join(outDir, c.f), `# Brief for ${c.f}\n\nTitle: ${c.t}\nMinimum words: ${c.w}\nWeb research needed: ${c.research ? 'yes' : 'no'}\n\n## What this chapter must cover (every item, fully)\n\n${c.b}\n`, 'utf8');
  manifest.push({ file: c.f, title: c.t, words: c.w, research: !!c.research });
}
fs.writeFileSync(path.join('E:/mysaasschool/docs/build', `manifest.${doc}.json`), JSON.stringify(manifest, null, 1), 'utf8');
console.log(doc, chapters.length, 'briefs written');
