#!/usr/bin/env bash
# Starts the API and the web app, checks that both answer, then stops them again.
# Run inside WSL:  bash ~/eduflow/scripts/wsl-smoke-test.sh
set -uo pipefail

REPO="${REPO:-$HOME/eduflow}"
cd "${REPO}"

pg_isready -q || sudo service postgresql start
redis-cli ping >/dev/null 2>&1 || sudo service redis-server start

echo "== starting the API"
npm run dev:server >/tmp/eduflow-api.log 2>&1 &
API_PID=$!
echo "== starting the web app"
npm run dev:client >/tmp/eduflow-web.log 2>&1 &
WEB_PID=$!

cleanup() {
  kill "${API_PID}" "${WEB_PID}" 2>/dev/null || true
  pkill -f "next dev" 2>/dev/null || true
  pkill -f "server/src/server.ts" 2>/dev/null || true
}
trap cleanup EXIT

wait_for() {
  local url="$1" name="$2"
  for _ in $(seq 1 45); do
    if curl -fsS -o /tmp/last-response.txt -w '%{http_code}' --max-time 4 "${url}" >/tmp/last-code.txt 2>/dev/null; then
      echo "${name}: $(cat /tmp/last-code.txt)"
      return 0
    fi
    sleep 2
  done
  echo "${name}: no answer"
  return 1
}

echo
echo "== checks"
wait_for "http://127.0.0.1:4000/api/v1/health" "API health" && head -c 200 /tmp/last-response.txt && echo
code=$(curl -s -o /tmp/ready.json -w '%{http_code}' --max-time 8 http://127.0.0.1:4000/api/v1/ready || true)
echo "API ready: ${code}"
head -c 300 /tmp/ready.json; echo
wait_for "http://127.0.0.1:3000/login" "Web login page" && grep -o '<title>[^<]*</title>' /tmp/last-response.txt | head -1

echo
echo "== logs (last lines)"
tail -4 /tmp/eduflow-api.log
tail -4 /tmp/eduflow-web.log
