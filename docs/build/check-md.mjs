// Chapter linter for EduFlow docs. Usage: node check-md.mjs <file.md> [more files...] [--no-mermaid]
// Exit code 0 = no errors (warnings allowed), 1 = errors found. Fix every ERROR; fix WARNs where reasonable.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ALLOWED = new Set(['text', 'mermaid', 'prisma', 'json', 'http', 'typescript', 'ts', 'tsx', 'javascript', 'js', 'bash', 'sh', 'sql', 'yaml', 'yml', 'dockerfile', 'env', 'ini', 'markdown', 'md', 'csv', 'nginx', 'powershell', 'diff', 'css', 'html', 'xml', 'toml', 'gitignore', 'plaintext']);
const MAX_WIRE = 78;
const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const noMermaid = process.argv.includes('--no-mermaid');
if (!files.length) { console.error('usage: node check-md.mjs <file.md> ...'); process.exit(1); }

let errorCount = 0, warnCount = 0;
const mermaidJobs = [];
const err = (f, line, msg) => { errorCount++; console.log(`ERROR ${path.basename(f)}:${line} ${msg}`); };
const warn = (f, line, msg) => { warnCount++; console.log(`WARN  ${path.basename(f)}:${line} ${msg}`); };

for (const file of files) {
  if (!fs.existsSync(file)) { err(file, 0, 'file not found'); continue; }
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const lines = raw.split(/\r?\n/);
  let inFence = false, fenceLang = '', fenceStart = 0, fenceMarker = '', buf = [];
  let h1 = 0, firstContentSeen = false, wires = 0, mermaids = 0, tables = 0;
  let tableCols = 0, inTable = false;
  const words = raw.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;

  lines.forEach((line, i) => {
    const n = i + 1;
    const fence = line.match(/^\s{0,3}(```+|~~~+)\s*([A-Za-z0-9_+-]*)\s*$/);
    if (fence && (!inFence || (fence[1].startsWith(fenceMarker[0]) && fence[1].length >= fenceMarker.length && !fence[2]))) {
      if (!inFence) {
        inFence = true; fenceLang = fence[2].toLowerCase(); fenceStart = n; fenceMarker = fence[1]; buf = [];
        if (!fenceLang) err(file, n, 'code fence without a language (use text, json, prisma, http, typescript, bash, sql, yaml, mermaid ...)');
        else if (!ALLOWED.has(fenceLang)) warn(file, n, `unusual code fence language "${fenceLang}"`);
      } else {
        if (fenceLang === 'text') {
          wires++;
          buf.forEach((l, j) => {
            if (l.length > MAX_WIRE) err(file, fenceStart + 1 + j, `text/wireframe line is ${l.length} chars wide (max ${MAX_WIRE}) — it will be cut off in the PDF`);
            if (/[^\x20-\x7E]/.test(l)) err(file, fenceStart + 1 + j, 'non-ASCII character inside a text/wireframe block (use only plain ASCII: + - | = [ ] ( ) < > * # etc.)');
          });
        }
        if (fenceLang === 'mermaid') { mermaids++; mermaidJobs.push({ file, line: fenceStart, code: buf.join('\n') }); }
        if (fenceLang !== 'text' && fenceLang !== 'mermaid') buf.forEach((l, j) => { if (l.length > 110) warn(file, fenceStart + 1 + j, `code line is ${l.length} chars (will wrap in the PDF; keep under 105)`); });
        inFence = false;
      }
      return;
    }
    if (inFence) { buf.push(line); return; }

    if (/^#\s+/.test(line)) { h1++; if (h1 > 1) err(file, n, 'more than one H1 (# ) heading — each file must have exactly one'); }
    if (!firstContentSeen && line.trim() && !/^<!--/.test(line.trim())) { firstContentSeen = true; if (!/^#\s+\S/.test(line)) err(file, n, 'first content line must be the single H1 chapter title: "# Title"'); }
    if (/^#{1,6}\s+(chapter\s+)?\d+(\.\d+)*[.):]?\s+/i.test(line)) err(file, n, 'heading starts with a number — remove it (the build numbers headings automatically)');
    if (/^#{5,6}\s/.test(line)) warn(file, n, 'heading deeper than ####');
    if (/<\/?(div|span|table|tr|td|th|br|img|p|ul|ol|li|details|summary|sup|sub|center|font|b|i|u)\b[^>]*>/i.test(line.replace(/`[^`]*`/g, ''))) err(file, n, 'raw HTML is not rendered — use Markdown only');
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(line) && !/[✓✗]/.test(line)) warn(file, n, 'emoji/symbol found — remove emojis');
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const cells = line.replace(/`[^`]*`/g, 'x').replace(/\\\|/g, 'x').trim().replace(/^\||\|$/g, '').split('|').length;
      if (!inTable) { inTable = true; tables++; tableCols = cells; if (cells > 9) warn(file, n, `table has ${cells} columns — more than 8 becomes hard to read on A4`); }
      else if (cells !== tableCols) err(file, n, `table row has ${cells} cells but header has ${tableCols} (escape literal pipes as \\| )`);
    } else inTable = false;
  });
  if (inFence) err(file, fenceStart, 'code fence opened here is never closed');
  if (h1 === 0) err(file, 1, 'no H1 (# ) chapter title found');
  console.log(`INFO  ${path.basename(file)}: ~${words} words, ${tables} tables, ${wires} text/wireframe blocks, ${mermaids} mermaid diagrams`);
}

if (mermaidJobs.length && !noMermaid) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body style="width:1200px"><div id="host"></div></body></html>');
  await page.addScriptTag({ path: path.join(__dirname, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js') });
  const results = await page.evaluate(async (jobs) => {
    const m = window.mermaid;
    m.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'base', flowchart: { htmlLabels: true } });
    const out = [];
    let i = 0;
    for (const j of jobs) {
      try {
        const { svg } = await m.render('chk' + i++, j.code);
        const vb = /viewBox="([^"]+)"/.exec(svg);
        const [, , w, h] = vb ? vb[1].split(/\s+/).map(Number) : [0, 0, 0, 0];
        out.push({ ok: true, w, h });
      } catch (e) {
        out.push({ ok: false, message: String(e && e.message ? e.message : e).slice(0, 500) });
        document.querySelectorAll('[id^="dchk"]').forEach((x) => x.remove());
      }
    }
    return out;
  }, mermaidJobs.map((j) => ({ code: j.code })));
  await browser.close();
  results.forEach((r, i) => {
    const j = mermaidJobs[i];
    if (!r.ok) err(j.file, j.line, `mermaid diagram does not parse/render: ${r.message.replace(/\s+/g, ' ')}`);
    else {
      if (r.w > 1150) warn(j.file, j.line, `mermaid diagram is ${Math.round(r.w)}px wide — text will be tiny on A4 (page fits ~700px). Use "flowchart TD", fewer nodes per row, or split it`);
      if (r.h > 1500 && r.h / Math.max(r.w, 1) > 2.2) warn(j.file, j.line, `mermaid diagram is very tall (${Math.round(r.h)}px) — it will be shrunk to fit one page; consider splitting`);
    }
  });
}

console.log(`RESULT: ${errorCount} error(s), ${warnCount} warning(s)`);
process.exit(errorCount ? 1 : 0);
