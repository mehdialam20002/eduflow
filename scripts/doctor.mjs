#!/usr/bin/env node
// EduFlow environment doctor.
//
// Answers one question: can I start work right now, and if not, what do I type?
// It only reads. Nothing here installs, migrates or writes a file.
// Node built-ins only, so it also runs on a clone with no node_modules folder.
//
//   npm run doctor
//
// Exit code 0 = ready to work. Exit code 1 = at least one required check failed.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN_NODE_MAJOR = 24;
const PROBE_TIMEOUT_MS = 1500;

// Windows consoles in the old code page turn box characters into noise, so fall back
// to plain ASCII unless the terminal is known to speak UTF-8.
const unicodeOk =
  process.platform !== 'win32' ||
  Boolean(process.env['WT_SESSION'] ?? process.env['TERM_PROGRAM'] ?? process.env['TERM']);

const MARK = {
  pass: unicodeOk ? '✔' : '[ok]',
  fail: unicodeOk ? '✘' : '[X ]',
  warn: unicodeOk ? '⚠' : '[! ]',
};

const results = [];

function record(level, title, detail, fix) {
  results.push({ level, title, detail, fix });
}

/** Reads a .env style file into a Map, keeping the [required] tags of the comments. */
function parseEnvFile(filePath) {
  const values = new Map();
  const required = new Set();
  if (!existsSync(filePath)) return { values, required, exists: false };

  let comment = '';
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('#')) {
      comment += ` ${line}`;
      continue;
    }
    if (line === '') {
      comment = '';
      continue;
    }
    const eq = line.indexOf('=');
    if (eq > 0) {
      const key = line.slice(0, eq).trim();
      values.set(key, line.slice(eq + 1).trim());
      if (comment.includes('[required]')) required.add(key);
    }
    comment = '';
  }
  return { values, required, exists: true };
}

/** Opens a TCP socket and gives up quickly: a missing service must not stall the report. */
function probeTcp(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const finish = (reachable) => {
      socket.destroy();
      resolve(reachable);
    };
    socket.setTimeout(PROBE_TIMEOUT_MS);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

function hostPortFrom(value, defaultPort) {
  try {
    const url = new URL(value);
    return { host: url.hostname || 'localhost', port: Number(url.port) || defaultPort };
  } catch {
    return null;
  }
}

function checkNode() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= MIN_NODE_MAJOR) {
    record('pass', 'Node.js', `v${process.versions.node}`);
    return;
  }
  record(
    'fail',
    'Node.js',
    `v${process.versions.node} is too old; EduFlow needs ${MIN_NODE_MAJOR} or newer`,
    'Install Node 24 LTS from https://nodejs.org, then reopen the terminal',
  );
}

function checkDependencies() {
  if (existsSync(path.join(ROOT, 'node_modules'))) {
    record('pass', 'Packages', 'node_modules is present at the repo root');
    return;
  }
  record('fail', 'Packages', 'node_modules is missing', 'npm install');
}

function checkEnvFile(example, actual) {
  if (!actual.exists) {
    record('fail', 'Env file', '.env does not exist yet', 'npm run setup');
    return;
  }
  record('pass', 'Env file', `.env has ${actual.values.size} values`);

  const missing = [];
  const placeholders = [];
  for (const key of example.required) {
    const value = process.env[key] ?? actual.values.get(key) ?? '';
    if (value === '') missing.push(key);
    else if (/replace_me|change_me/i.test(value)) placeholders.push(key);
  }

  if (missing.length > 0) {
    record(
      'fail',
      'Required keys',
      `${missing.length} missing: ${missing.join(', ')}`,
      'Copy the missing lines from .env.example into .env',
    );
  } else {
    record('pass', 'Required keys', `all ${example.required.size} required keys have a value`);
  }

  if (placeholders.length > 0) {
    record(
      'warn',
      'Placeholder values',
      `still on the sample value: ${placeholders.join(', ')}`,
      'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
}

async function checkPostgres(actual) {
  const raw = process.env['DATABASE_URL'] ?? actual.values.get('DATABASE_URL') ?? '';
  if (raw === '') {
    record('fail', 'PostgreSQL', 'DATABASE_URL is not set', 'npm run setup');
    return;
  }
  const target = hostPortFrom(raw, 5432);
  if (target === null) {
    record('fail', 'PostgreSQL', 'DATABASE_URL is not a valid URL', 'Fix DATABASE_URL in .env');
    return;
  }
  const where = `${target.host}:${target.port}`;
  if (await probeTcp(target.host, target.port)) {
    record('pass', 'PostgreSQL', `answers on ${where}`);
    return;
  }
  record(
    'fail',
    'PostgreSQL',
    `nothing answers on ${where}`,
    'Start the installed service in PowerShell as admin: Start-Service postgresql-x64-18 ' +
      '(or run the Docker one with "npm run services:up" and set the port to 5433)',
  );
}

async function checkRedis(actual) {
  const raw = process.env['REDIS_URL'] ?? actual.values.get('REDIS_URL') ?? '';
  if (raw === '') {
    record(
      'warn',
      'Redis',
      'REDIS_URL is empty, so queues, cache and rate limits stay in memory',
      'Optional in development. To get the real thing: npm run services:up',
    );
    return;
  }
  const target = hostPortFrom(raw, 6379);
  if (target === null) {
    record('warn', 'Redis', 'REDIS_URL is not a valid URL', 'Fix REDIS_URL in .env, or empty it');
    return;
  }
  const where = `${target.host}:${target.port}`;
  if (await probeTcp(target.host, target.port)) {
    record('pass', 'Redis', `answers on ${where}`);
    return;
  }
  record(
    'warn',
    'Redis',
    `REDIS_URL points at ${where} but nothing answers`,
    'npm run services:up, or empty REDIS_URL to run without queues',
  );
}

function prismaFiles(dir) {
  if (!existsSync(dir)) return null;
  return readdirSync(dir)
    .filter((name) => name.endsWith('.prisma'))
    .sort();
}

/** Line endings differ between a Windows checkout and a copy, so compare the text only. */
function readNormalised(filePath) {
  return readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
}

function checkSchemaSync() {
  const source = path.join(ROOT, 'server', 'prisma', 'schema');
  const copy = path.join(ROOT, 'docs', 'schema');
  const sourceFiles = prismaFiles(source);
  const copyFiles = prismaFiles(copy);

  if (sourceFiles === null || sourceFiles.length === 0) {
    record('warn', 'Schema copy', 'server/prisma/schema has no .prisma files yet');
    return;
  }
  if (copyFiles === null) {
    record('warn', 'Schema copy', 'docs/schema does not exist', 'npm run sync:schema');
    return;
  }

  const drifted = sourceFiles.filter((name) => {
    const target = path.join(copy, name);
    if (!existsSync(target)) return true;
    return readNormalised(path.join(source, name)) !== readNormalised(target);
  });
  const orphans = copyFiles.filter((name) => !sourceFiles.includes(name));

  if (drifted.length === 0 && orphans.length === 0) {
    record('pass', 'Schema copy', `docs/schema matches all ${sourceFiles.length} schema files`);
    return;
  }
  const parts = [];
  if (drifted.length > 0) parts.push(`${drifted.length} changed (${drifted.join(', ')})`);
  if (orphans.length > 0) parts.push(`${orphans.length} stale (${orphans.join(', ')})`);
  record('warn', 'Schema copy', parts.join('; '), 'npm run sync:schema');
}

function report() {
  const width = Math.max(...results.map((item) => item.title.length));
  console.log('\nEduFlow doctor');
  console.log('='.repeat(60));
  for (const item of results) {
    const mark = MARK[item.level];
    console.log(`${mark} ${item.title.padEnd(width)}  ${item.detail}`);
    if (item.fix !== undefined) {
      console.log(`${' '.repeat(mark.length + width + 3)}fix: ${item.fix}`);
    }
  }

  const failed = results.filter((item) => item.level === 'fail').length;
  const warned = results.filter((item) => item.level === 'warn').length;
  console.log('='.repeat(60));
  if (failed > 0) {
    console.log(`${failed} check(s) failed, ${warned} warning(s). Fix the lines marked above.`);
    return 1;
  }
  console.log(`All required checks passed, ${warned} warning(s). Start with: npm run dev`);
  return 0;
}

async function main() {
  const example = parseEnvFile(path.join(ROOT, '.env.example'));
  const actual = parseEnvFile(path.join(ROOT, '.env'));

  checkNode();
  checkDependencies();
  checkEnvFile(example, actual);
  await checkPostgres(actual);
  await checkRedis(actual);
  checkSchemaSync();

  process.exitCode = report();
}

await main();
