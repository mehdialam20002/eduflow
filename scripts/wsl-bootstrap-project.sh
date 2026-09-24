#!/usr/bin/env bash
# Takes a freshly cloned EduFlow checkout inside WSL from nothing to a running, seeded database
# with every quality gate green. Run as the normal user:
#
#   wsl -d Ubuntu -- bash ~/eduflow/scripts/wsl-bootstrap-project.sh
#
# Safe to run again: it never overwrites an existing .env and every database step is idempotent.
set -euo pipefail

REPO="${REPO:-$HOME/eduflow}"
DB_URL="postgresql://eduflow:eduflow@127.0.0.1:5432/eduflow?schema=public"
TEST_DB_URL="postgresql://eduflow:eduflow@127.0.0.1:5432/eduflow_test?schema=public"
REDIS="redis://127.0.0.1:6379"

step() { printf '\n========== %s\n' "$1"; }

cd "${REPO}"

step "Services"
pg_isready -q || sudo service postgresql start
redis-cli ping >/dev/null 2>&1 || sudo service redis-server start
pg_isready -q && echo "PostgreSQL ready"
redis-cli ping >/dev/null && echo "Redis ready"

step "Environment file"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "created .env from the template"
else
  echo ".env already exists, leaving it alone"
fi
python3 - "$DB_URL" "$TEST_DB_URL" "$REDIS" <<'PY'
import re, secrets, sys
db, test_db, redis = sys.argv[1:4]
text = open('.env', encoding='utf-8').read()

def put(key, value):
    global text
    line = f'{key}={value}'
    text = re.sub(rf'^{key}=.*$', line, text, flags=re.M) if re.search(rf'^{key}=', text, flags=re.M) else text + '\n' + line

put('DATABASE_URL', db)
put('TEST_DATABASE_URL', test_db)
put('REDIS_URL', redis)
# Replace sample secrets with real ones, once.
for key in ('JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'FIELD_ENCRYPTION_KEY'):
    current = re.search(rf'^{key}=(.*)$', text, flags=re.M)
    if current is None or current.group(1).strip() == '' or 'change' in current.group(1).lower() or 'sample' in current.group(1).lower() or 'replace' in current.group(1).lower():
        put(key, secrets.token_hex(32))
open('.env', 'w', encoding='utf-8', newline='\n').write(text)
print('environment written')
PY
grep -E '^(DATABASE_URL|REDIS_URL)=' .env

step "Dependencies"
npm install --no-audit --no-fund

step "Prisma client"
npx prisma generate --schema server/prisma/schema

step "Database migration"
if [ -z "$(ls -A server/prisma/migrations 2>/dev/null)" ]; then
  npx prisma migrate dev --schema server/prisma/schema --name init --skip-seed
else
  npx prisma migrate deploy --schema server/prisma/schema
fi

step "Seed"
npm run db:seed

step "Quality gates"
npm run typecheck
npm run lint
npm test

step "Client build"
npm run build -w client

step "Done"
echo "Everything is ready. Start both apps with: npm run dev"
