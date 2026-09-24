#!/usr/bin/env bash
# Prepares an Ubuntu (WSL 2) machine to develop EduFlow.
#
# Windows Smart App Control on the founder's laptop refuses unsigned binaries, which blocks
# esbuild, Next's SWC, Tailwind's oxide and psql. Inside WSL those binaries are Linux builds,
# so the whole toolchain works normally. Run as root:
#
#   wsl -d Ubuntu -u root -- bash /mnt/e/mysaasschool/scripts/wsl-setup.sh
#
# It is safe to run again: every step checks before it changes anything.
set -euo pipefail

DEV_USER="${DEV_USER:-mehdi}"
DB_USER="eduflow"
DB_PASSWORD="eduflow"
DB_NAME="eduflow"
TEST_DB_NAME="eduflow_test"

say() { printf '\n== %s\n' "$1"; }

say "Services"
service postgresql start >/dev/null 2>&1 || true
service redis-server start >/dev/null 2>&1 || true
sleep 2
pg_isready -q && echo "PostgreSQL is up" || { echo "PostgreSQL did not start"; exit 1; }
redis-cli ping >/dev/null && echo "Redis is up"

say "Database role and databases"
run_sql() { su - postgres -c "psql -v ON_ERROR_STOP=1 -tAc \"$1\""; }
if [ "$(run_sql "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'")" != "1" ]; then
  run_sql "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}' CREATEDB"
  echo "created role ${DB_USER}"
else
  echo "role ${DB_USER} already exists"
fi
for database in "${DB_NAME}" "${TEST_DB_NAME}"; do
  if [ "$(run_sql "SELECT 1 FROM pg_database WHERE datname='${database}'")" != "1" ]; then
    su - postgres -c "createdb -O ${DB_USER} ${database}"
    echo "created database ${database}"
  else
    echo "database ${database} already exists"
  fi
done

say "Developer account"
if ! id -u "${DEV_USER}" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "${DEV_USER}"
  usermod -aG sudo "${DEV_USER}"
  # A laptop that only this person uses; sudo without a password keeps setup scripts unattended.
  echo "${DEV_USER} ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/90-${DEV_USER}"
  chmod 440 "/etc/sudoers.d/90-${DEV_USER}"
  echo "created ${DEV_USER}"
else
  echo "${DEV_USER} already exists"
fi

say "WSL configuration"
# systemd keeps PostgreSQL and Redis running after a restart; the default user skips 'su'.
cat > /etc/wsl.conf <<EOF
[boot]
systemd=true

[user]
default=${DEV_USER}

[interop]
appendWindowsPath=false
EOF
echo "wrote /etc/wsl.conf"

# Start both services on every boot, whichever init is in charge.
systemctl enable postgresql redis-server >/dev/null 2>&1 || true

say "Result"
echo "DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}?schema=public"
echo "TEST DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${TEST_DB_NAME}?schema=public"
echo "REDIS_URL=redis://127.0.0.1:6379"
echo "node $(node --version), npm $(npm --version)"
echo "Next: wsl --shutdown (from Windows), then reopen Ubuntu as ${DEV_USER}."
