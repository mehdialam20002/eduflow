#!/usr/bin/env node
// Keeps docs/schema/ equal to server/prisma/schema/.
//
// The Claude Code prompts read docs/schema/. The Prisma CLI reads server/prisma/schema/.
// When the two drift apart, a prompt writes code against a table that no longer exists,
// so this script makes the docs copy follow the code, never the other way round.
// Node built-ins only.
//
//   npm run sync:schema          copy the .prisma files into docs/schema/
//   npm run check:schema-sync    compare only; exit 1 when they differ (used by CI)

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'server', 'prisma', 'schema');
const TARGET_DIR = path.join(ROOT, 'docs', 'schema');
const checkOnly = process.argv.includes('--check');

/** Line endings differ between a Windows checkout and a written copy: compare text only. */
function readNormalised(filePath) {
  return readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
}

function prismaFilesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.prisma'))
    .map((entry) => entry.name)
    .sort();
}

function compare() {
  const sourceFiles = prismaFilesIn(SOURCE_DIR);
  const targetFiles = prismaFilesIn(TARGET_DIR);
  const added = [];
  const changed = [];
  const stale = targetFiles.filter((name) => !sourceFiles.includes(name));

  for (const name of sourceFiles) {
    const target = path.join(TARGET_DIR, name);
    if (!existsSync(target)) {
      added.push(name);
      continue;
    }
    if (readNormalised(path.join(SOURCE_DIR, name)) !== readNormalised(target)) changed.push(name);
  }
  return { sourceFiles, added, changed, stale };
}

function copyAll(state) {
  mkdirSync(TARGET_DIR, { recursive: true });
  for (const name of [...state.added, ...state.changed]) {
    // Written with LF, so a Windows checkout never shows the whole file as changed.
    writeFileSync(path.join(TARGET_DIR, name), readNormalised(path.join(SOURCE_DIR, name)), 'utf8');
    console.log(`copied   ${name}`);
  }
  for (const name of state.stale) {
    rmSync(path.join(TARGET_DIR, name));
    console.log(`removed  ${name} (no longer in server/prisma/schema)`);
  }
}

function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.error(`Source folder is missing: ${path.relative(ROOT, SOURCE_DIR)}`);
    return 1;
  }

  const state = compare();
  if (state.sourceFiles.length === 0) {
    console.error('No .prisma files found in server/prisma/schema.');
    return 1;
  }

  const differences = state.added.length + state.changed.length + state.stale.length;
  if (differences === 0) {
    console.log(`docs/schema is in sync (${state.sourceFiles.length} files).`);
    return 0;
  }

  if (checkOnly) {
    console.error('docs/schema is out of date:');
    for (const name of state.added) console.error(`  missing  ${name}`);
    for (const name of state.changed) console.error(`  changed  ${name}`);
    for (const name of state.stale) console.error(`  stale    ${name}`);
    console.error('\nFix it with: npm run sync:schema');
    return 1;
  }

  copyAll(state);
  console.log(`docs/schema updated (${differences} file(s)).`);
  return 0;
}

process.exitCode = main();
