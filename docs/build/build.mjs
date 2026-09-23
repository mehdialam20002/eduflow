// EduFlow docs builder: docs/<doc>/*.md  ->  styled HTML  ->  PDF (cover, doc control, TOC with page numbers, header/footer)
// Usage: node build.mjs <brd|prd|blueprint|all> [--html-only]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(__dirname, '..');
const SRC = DOCS;
const OUT = path.join(DOCS, 'out');
const FINAL = path.resolve(DOCS, '..');

hljs.registerLanguage('prisma', (h) => ({
  name: 'Prisma',
  keywords: {
    keyword: 'model enum generator datasource type view',
    type: 'String Int BigInt Float Decimal Boolean DateTime Json Bytes Unsupported',
    literal: 'true false null',
  },
  contains: [h.C_LINE_COMMENT_MODE, h.QUOTE_STRING_MODE, { className: 'meta', begin: /@@?[a-zA-Z_.]+/ }, h.NUMBER_MODE],
}));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'x';

function makeMd(fileKey, diagrams) {
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
  md.renderer.rules.fence = (tokens, idx) => {
    const t = tokens[idx];
    const lang = (t.info || '').trim().split(/\s+/)[0].toLowerCase();
    const code = t.content;
    if (lang === 'mermaid') {
      const n = diagrams.length;
      diagrams.push({ file: fileKey, line: (t.map ? t.map[0] + 1 : 0), code });
      return `<div class="diagram"><pre class="mmd-src" data-diagram="${n}">${esc(code)}</pre></div>\n`;
    }
    const lines = code.replace(/\n$/, '').split('\n').length;
    if (lang === 'text' || lang === 'wireframe' || lang === 'ascii') {
      return `<pre class="wire">${esc(code.replace(/\n$/, ''))}</pre>\n`;
    }
    let body = esc(code.replace(/\n$/, ''));
    const hl = { ts: 'typescript', js: 'javascript', sh: 'bash', shell: 'bash', yml: 'yaml', env: 'ini', tsx: 'typescript', jsx: 'javascript', docker: 'dockerfile' }[lang] || lang;
    if (hl && hljs.getLanguage(hl)) {
      try { body = hljs.highlight(code.replace(/\n$/, ''), { language: hl, ignoreIllegals: true }).value; } catch { /* keep escaped */ }
    }
    return `<pre class="${lines <= 42 ? 'keep' : 'long'}"><code>${body}</code></pre>\n`;
  };
  return md;
}

function readMeta(docKey) {
  return JSON.parse(fs.readFileSync(path.join(SRC, docKey, '_meta.json'), 'utf8'));
}

function tocDepthFor(meta, file, content) {
  const m = content.match(/<!--\s*toc-depth:\s*(\d)\s*-->/);
  if (m) return Number(m[1]);
  for (const r of meta.tocDepthRules || []) if (new RegExp(r.match).test(file)) return r.depth;
  return meta.tocDepth ?? 2;
}

function buildHtml(docKey) {
  const meta = readMeta(docKey);
  const dir = path.join(SRC, docKey);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_')).sort();
  const diagrams = [];
  const toc = [];       // {level, id, label, file}
  const chapters = [];  // {file, num, title, id}
  let chapterNo = 0;
  let appendixNo = 0;
  let bodyHtml = '';
  const usedIds = new Set();
  const partsByFile = new Map((meta.parts || []).map((p) => [p.startsAt, p]));
  const partSlots = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8').replace(/^﻿/, '');
    const depth = tocDepthFor(meta, file, raw);
    const isAppendix = /appendix/i.test(file);
    const md = makeMd(`${docKey}/${file}`, diagrams);
    const tokens = md.parse(raw, {});
    let h2 = 0, h3 = 0, chLabel = '';
    const part = [...partsByFile.entries()].find(([prefix]) => file.startsWith(prefix));
    if (part) { partSlots.push({ part: part[1], firstFile: file, index: partSlots.length }); bodyHtml += `<!--PART:${partSlots.length - 1}-->`; toc.push({ level: 0, id: `part-${partSlots.length - 1}`, label: part[1].title }); partsByFile.delete(part[0]); }

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.type !== 'heading_open') continue;
      const inline = tokens[i + 1];
      const text = inline.content.replace(/^\s*(chapter\s+)?\d+(\.\d+)*[.):]?\s+/i, '').trim();
      const level = Number(t.tag.slice(1));
      let num = '';
      if (level === 1) {
        if (isAppendix) { appendixNo++; chLabel = String.fromCharCode(64 + appendixNo); } else { chapterNo++; chLabel = String(chapterNo); }
        h2 = 0; h3 = 0; num = chLabel;
      } else if (level === 2) { h2++; h3 = 0; num = `${chLabel}.${h2}`; }
      else if (level === 3) { h3++; num = `${chLabel}.${h2}.${h3}`; }
      let id = `${slug(file.replace(/\.md$/, ''))}--${slug(text)}`;
      let k = 2; while (usedIds.has(id)) id = `${id}-${k++}`;
      usedIds.add(id);
      t.attrSet('id', id);
      // strip any hand-written number from the rendered heading
      if (inline.children && inline.children.length && inline.children[0].type === 'text') {
        inline.children[0].content = inline.children[0].content.replace(/^\s*(chapter\s+)?\d+(\.\d+)*[.):]?\s+/i, '');
      }
      if (level === 1) {
        t.attrSet('class', 'chapter');
        const label = isAppendix ? `Appendix ${chLabel}` : `Chapter ${chLabel}`;
        inline.children.unshift(Object.assign(new (tokens[i].constructor)('html_inline', '', 0), { content: `<span class="ch-label">${label}</span>` }));
        chapters.push({ file, num: chLabel, title: text, id, isAppendix });
        toc.push({ level: 1, id, label: `${isAppendix ? 'Appendix ' + chLabel + ' —' : chLabel + '.'} ${text}` });
      } else if (level <= 3) {
        inline.children.unshift(Object.assign(new (tokens[i].constructor)('html_inline', '', 0), { content: `<span class="num">${num}</span>` }));
        if (level <= depth) toc.push({ level, id, label: `${num} ${text}` });
      }
    }
    // html_inline tokens are only rendered when html:true; render them manually
    md.renderer.rules.html_inline = (toks, idx) => toks[idx].content;
    let html = md.renderer.render(tokens, md.options, {});
    bodyHtml += `\n<section class="file" data-file="${esc(file)}">\n${html}\n</section>\n`;
    if (chapters.length) chapters[chapters.length - 1].lastFile = file;
  }

  // Part divider pages
  partSlots.forEach((slot, i) => {
    const startIdx = files.indexOf(slot.firstFile);
    const next = partSlots[i + 1];
    const endIdx = next ? files.indexOf(next.firstFile) : files.length;
    const inPart = chapters.filter((c) => { const fi = files.indexOf(c.file); return fi >= startIdx && fi < endIdx; });
    const [label, ...rest] = slot.part.title.split(/\s+[—-]\s+/);
    const html = `<div class="part" id="part-${i}"><div class="part-label">${esc(label)}</div><div class="part-title">${esc(rest.join(' — ') || label)}</div>` +
      `<div class="part-blurb">${esc(slot.part.blurb || '')}</div><ul class="part-chapters">` +
      inPart.map((c) => `<li><span>${esc(c.isAppendix ? 'App. ' + c.num : c.num)}</span>${esc(c.title)}</li>`).join('') + `</ul></div>`;
    bodyHtml = bodyHtml.replace(`<!--PART:${i}-->`, html);
  });

  // Post-process: callouts, yes/no cells, wide tables
  bodyHtml = bodyHtml
    .replace(/<blockquote>\s*<p><strong>(Note|Tip|Warning|Best practice|Example|Founder note|Important|Rule)[:.]?<\/strong>/gi, (m, kind) => {
      const k = kind.toLowerCase();
      const cls = k.startsWith('tip') ? 'tip' : k.startsWith('best') ? 'best' : (k.startsWith('warn') || k.startsWith('important')) ? 'warning' : k.startsWith('example') ? 'example' : k.startsWith('founder') ? 'founder' : 'note';
      return m.replace('<blockquote>', `<blockquote class="${cls}">`);
    })
    .replace(/<td([^>]*)>(Yes|Y|✓|Full)<\/td>/g, '<td$1 class="yes">$2</td>')
    .replace(/<td([^>]*)>(No|N|✗|None)<\/td>/g, '<td$1 class="no">$2</td>')
    .replace(/<td([^>]*)>(Partial|Limited|Add-on|Basic|Own|Campus|View)<\/td>/g, '<td$1 class="partial">$2</td>')
    .replace(/<td([^>]*)>(-|—|–|N\/A)<\/td>/g, '<td$1 class="dash">$2</td>')
    .replace(/<table>\s*<thead>\s*<tr>((?:\s*<th[^>]*>[\s\S]*?<\/th>){8,})\s*<\/tr>/g, (m) => m.replace('<table>', '<table class="wide">'));

  // Front matter
  const cover = `<div class="cover">
  <div class="brand"><span class="logo">E</span><span>${esc(meta.product)}</span></div>
  <div class="doc-type">${esc(meta.docType || meta.shortTitle)}</div>
  <h1 class="cover-title">${esc(meta.title)}</h1>
  <div class="tagline">${esc(meta.tagline)}</div>
  <div class="rule"></div>
  <div class="tagline" style="font-size:10.5pt">${esc(meta.coverNote || '')}</div>
  <div class="meta-grid">
    <div><div class="k">Version</div><div class="v">${esc(meta.version)}</div></div>
    <div><div class="k">Date</div><div class="v">${esc(meta.date)}</div></div>
    <div><div class="k">Document owner</div><div class="v">${esc(meta.owner)}</div></div>
    <div><div class="k">Prepared by</div><div class="v">${esc(meta.preparedBy)}</div></div>
    <div><div class="k">Status</div><div class="v">${esc(meta.status)}</div></div>
    <div><div class="k">Markets</div><div class="v">${esc(meta.markets)}</div></div>
  </div>
  <div class="confidential">Confidential — for internal planning and execution. Do not share outside the founding team without permission.</div>
</div>`;

  const control = `<section class="front" id="doc-control">
  <h1 class="front-title">Document Control</h1>
  <h3>Document information</h3>
  <table class="kv"><tbody>
    ${(meta.info || []).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('\n')}
  </tbody></table>
  <h3>Revision history</h3>
  <table><thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Changes</th></tr></thead><tbody>
    ${(meta.revisions || []).map((r) => `<tr><td>${esc(r.version)}</td><td>${esc(r.date)}</td><td>${esc(r.author)}</td><td>${esc(r.changes)}</td></tr>`).join('\n')}
  </tbody></table>
  <h3>Review and approval</h3>
  <table><thead><tr><th>Role</th><th>Name</th><th>Responsibility</th><th>Sign-off</th></tr></thead><tbody>
    ${(meta.approvals || []).map((r) => `<tr><td>${esc(r.role)}</td><td>${esc(r.name)}</td><td>${esc(r.responsibility)}</td><td>${esc(r.signoff)}</td></tr>`).join('\n')}
  </tbody></table>
  <h3>How to read this document</h3>
  ${(meta.howToRead || []).map((p) => `<p>${esc(p)}</p>`).join('\n')}
  <h3>Companion documents</h3>
  <table><thead><tr><th>Document</th><th>File</th><th>What it answers</th></tr></thead><tbody>
    ${(meta.companions || []).map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.file)}</td><td>${esc(r.answers)}</td></tr>`).join('\n')}
  </tbody></table>
  <div class="notice">${esc(meta.notice || '')}</div>
</section>`;

  const tocHtml = `<nav class="toc" id="toc"><h1 class="toc-title">Table of Contents</h1>
<a class="toc-row lvl1" href="#doc-control"><span class="t">Document Control</span><span class="dots"></span><span class="p" data-for="doc-control">000</span></a>
${toc.map((e) => e.level === 0
    ? `<a class="toc-part-row" href="#${e.id}"><span class="t">${esc(e.label)}</span><span class="dots"></span><span class="p" data-for="${e.id}">000</span></a>`
    : `<a class="toc-row lvl${e.level}" href="#${e.id}"><span class="t">${esc(e.label)}</span><span class="dots"></span><span class="p" data-for="${e.id}">000</span></a>`).join('\n')}
</nav>`;

  const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  const mermaidUrl = pathToFileURL(path.join(__dirname, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js')).href;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(meta.product)} — ${esc(meta.title)}</title>
<style>${css}</style><script src="${mermaidUrl}"></script></head><body>
${cover}
${control}
${tocHtml}
${bodyHtml}
</body></html>`;
  fs.mkdirSync(OUT, { recursive: true });
  const htmlPath = path.join(OUT, `${docKey}.html`);
  fs.writeFileSync(htmlPath, html, 'utf8');
  return { meta, htmlPath, diagrams, chapters, tocCount: toc.length, files, toc };
}

async function renderPdf(docKey, built) {
  const { meta, htmlPath, diagrams } = built;  // built.toc is used for the PDF outline
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(0);
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load', timeout: 0 });
  const errors = await page.evaluate(async () => {
    const errs = [];
    // eslint-disable-next-line no-undef
    const m = window.mermaid;
    m.initialize({
      startOnLoad: false, securityLevel: 'loose', theme: 'base',
      themeVariables: { fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '14px', primaryColor: '#eef2ff', primaryBorderColor: '#3730a3', primaryTextColor: '#111827', lineColor: '#4b5563', secondaryColor: '#f0fdfa', tertiaryColor: '#f9fafb', noteBkgColor: '#fffbeb', noteBorderColor: '#d97706' },
      flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' }, er: { useMaxWidth: true }, sequence: { useMaxWidth: true }, gantt: { useMaxWidth: true },
    });
    const nodes = Array.from(document.querySelectorAll('pre.mmd-src'));
    let i = 0;
    for (const el of nodes) {
      const code = el.textContent;
      const n = Number(el.getAttribute('data-diagram'));
      try {
        const { svg } = await m.render(`mmd-${i++}`, code);
        const div = document.createElement('div'); div.className = 'mermaid'; div.innerHTML = svg; el.replaceWith(div);
      } catch (e) {
        errs.push({ n, message: String(e && e.message ? e.message : e).slice(0, 400) });
        const div = document.createElement('div'); div.className = 'diagram-error'; div.textContent = 'Diagram failed to render:\n' + code; el.replaceWith(div);
        document.querySelectorAll('#dmmd-' + (i - 1) + ', [id^="dmmd-"]').forEach((x) => x.remove());
      }
    }
    return errs;
  });
  for (const e of errors) { const d = diagrams[e.n]; console.error(`MERMAID ERROR ${d.file}:${d.line} :: ${e.message.replace(/\s+/g, ' ')}`); }

  const hf = (l, r) => `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:7.4pt;color:#6b7280;width:100%;padding:0 17mm;display:flex;justify-content:space-between;"><span>${l}</span><span>${r}</span></div>`;
  const pdfOpts = {
    format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, outline: true, tagged: process.env.TAGGED === "1",
    headerTemplate: hf(`${esc(meta.product)} — ${esc(meta.title)}`, 'Confidential'),
    footerTemplate: hf(`Version ${esc(meta.version)} · ${esc(meta.date)}`, 'Page <span class="pageNumber"></span> of <span class="totalPages"></span>'),
    margin: { top: '20mm', bottom: '19mm', left: '17mm', right: '17mm' },
  };
  await page.evaluate(() => document.body.classList.add('no-cover'));
  const pass1 = path.join(OUT, `${docKey}.pass1.pdf`);
  await page.pdf({ ...pdfOpts, path: pass1 });
  const map = JSON.parse(execFileSync('python', [path.join(__dirname, 'toc_pages.py'), 'dests', pass1], { encoding: 'utf8', maxBuffer: 1 << 26 }));
  const missing = await page.evaluate((m) => {
    let miss = 0;
    document.querySelectorAll('.toc .p[data-for]').forEach((el) => { const p = m[el.getAttribute('data-for')]; if (p) el.textContent = String(p); else { el.textContent = ''; miss++; } });
    return miss;
  }, map);
  const outline = [
    { level: 1, label: 'Document Control', page: map['doc-control'] },
    ...built.toc.map((e) => ({ level: e.level, label: e.label, page: map[e.id] })),
  ].filter((e) => e.page);
  const outlinePath = path.join(OUT, `${docKey}.outline.json`);
  fs.writeFileSync(outlinePath, JSON.stringify(outline), 'utf8');
  const finalPath = path.join(FINAL, meta.output);
  const pass2 = path.join(OUT, `${docKey}.pass2.pdf`);
  await page.pdf({ ...pdfOpts, path: pass2 });
  // Cover is printed separately (full bleed, no header/footer) and inserted as the first page.
  await page.evaluate(() => { document.body.classList.remove('no-cover'); document.body.classList.add('only-cover'); });
  const coverPdf = path.join(OUT, `${docKey}.cover.pdf`);
  await page.pdf({ path: coverPdf, format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, pageRanges: '1', margin: { top: '0', bottom: '0', left: '0', right: '0' } });
  await browser.close();
  const info = execFileSync('python', [path.join(__dirname, 'toc_pages.py'), 'finish', pass2, finalPath, `${meta.product} — ${meta.title}`, meta.owner, meta.tagline, coverPdf, outlinePath], { encoding: 'utf8' });
  console.log(`[${docKey}] ${info.trim()} | toc entries without page: ${missing} | diagrams: ${diagrams.length} | diagram errors: ${errors.length}`);
  return { errors: errors.length };
}

const arg = process.argv[2] || 'all';
const htmlOnly = process.argv.includes('--html-only');
const docs = arg === 'all' ? ['brd', 'prd', 'blueprint', 'costguide'] : [arg];
let failed = 0;
for (const d of docs) {
  if (!fs.existsSync(path.join(SRC, d, '_meta.json'))) { console.error(`skip ${d}: no _meta.json`); continue; }
  const built = buildHtml(d);
  console.log(`[${d}] ${built.files.length} files, ${built.chapters.length} chapters, ${built.tocCount} toc rows, ${built.diagrams.length} diagrams -> ${built.htmlPath}`);
  if (!htmlOnly) { const r = await renderPdf(d, built); failed += r.errors; }
}
process.exit(failed ? 2 : 0);
