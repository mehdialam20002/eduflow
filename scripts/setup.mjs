#!/usr/bin/env node
// EduFlow first-run setup.
//
// Makes the files and folders that are never committed but always needed, then prints
// the next three commands. Safe to run again: it only creates what is missing, and it
// never touches a .env you have already edited.
// Node built-ins only, so it runs before "npm install".
//
//   npm run setup

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Each workspace reads its settings from its own folder, because npm runs a workspace
// script with that folder as the working directory. The first source that exists wins,
// so a workspace without its own example still starts from the full root list.
const ENV_FILES = [
  { target: '.env', sources: ['.env.example'] },
  { target: 'server/.env', sources: ['server/.env.example', '.env.example'], needs: 'server' },
  {
    target: 'client/.env.local',
    sources: ['client/.env.example', '.env.example'],
    needs: 'client',
  },
];

// One git-ignored home for everything the app writes while it runs. Keeping it under a
// single folder means a reset is one deletion, not a hunt through the repo.
const LOCAL_DIRS = ['.local', '.local/logs', '.local/tmp', '.local/uploads'];

const created = [];
const kept = [];

function copyEnvFiles() {
  for (const entry of ENV_FILES) {
    if (entry.needs !== undefined && !existsSync(path.join(ROOT, entry.needs))) continue;

    const target = path.join(ROOT, entry.target);
    if (existsSync(target)) {
      kept.push(entry.target);
      continue;
    }
    const source = entry.sources.map((name) => path.join(ROOT, name)).find(existsSync);
    if (source === undefined) continue;

    mkdirSync(path.dirname(target), { recursive: true });
    copyFileSync(source, target);
    created.push(`${entry.target}  (from ${path.relative(ROOT, source).replace(/\\/g, '/')})`);
  }
}

function makeLocalDirs() {
  for (const dir of LOCAL_DIRS) {
    const full = path.join(ROOT, dir);
    if (existsSync(full)) continue;
    mkdirSync(full, { recursive: true });
    created.push(`${dir}/`);
  }
  // The folder hides itself and this file from Git, so the root .gitignore needs no
  // entry and "git status" stays quiet about runtime rubbish.
  const ignore = path.join(ROOT, '.local', '.gitignore');
  if (!existsSync(ignore)) {
    writeFileSync(ignore, '*\n', 'utf8');
    created.push('.local/.gitignore');
  }
}

function report() {
  console.log('\nEduFlow setup');
  console.log('='.repeat(60));
  if (created.length === 0) console.log('Nothing to create. Everything was already in place.');
  for (const item of created) console.log(`created  ${item}`);
  for (const item of kept) console.log(`kept     ${item} (left exactly as it is)`);

  console.log('='.repeat(60));
  console.log('Next three commands:');
  console.log('  1. npm install      install every workspace from the root');
  console.log('  2. npm run doctor   check Node, .env, PostgreSQL and Redis');
  console.log('  3. npm run dev      start the API and the web app together');
  console.log('\nOpen .env and put in your local database password before step 3.');
}

copyEnvFiles();
makeLocalDirs();
report();
process.exitCode = 0;
