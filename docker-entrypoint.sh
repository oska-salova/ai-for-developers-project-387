#!/bin/sh
# Starts both processes inside one container. Next.js owns the only public port
# (`PORT`); Express listens on the internal port referenced by the rewrites in
# `frontend/next.config.ts`.
set -eu

: "${PORT:=3000}"
export PORT
export HOSTNAME=0.0.0.0

PORT=3001 node /app/backend/dist/index.js &
backend_pid=$!

node /app/frontend/server.js &
frontend_pid=$!

shutdown() {
  kill -TERM "$frontend_pid" "$backend_pid" 2>/dev/null || true
}
trap shutdown TERM INT

status=0
wait "$frontend_pid" || status=$?

shutdown
wait "$backend_pid" 2>/dev/null || true

exit "$status"
