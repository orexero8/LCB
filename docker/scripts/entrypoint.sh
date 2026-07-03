#!/usr/bin/env bash
set -e

# ============================================================
#  MRGLA — App Container Entrypoint
#  Waits for PGlite, applies schema, seeds, then starts Next.js
# ============================================================

PGLITE_HOST="${PGLITE_HOST:-pglite}"
PGLITE_PORT="${PGLITE_PORT:-51214}"
DATABASE_URL="postgresql://postgres:postgres@${PGLITE_HOST}:${PGLITE_PORT}/postgres"

export DATABASE_URL

echo "==> Waiting for PGlite at ${PGLITE_HOST}:${PGLITE_PORT}..."
for i in $(seq 1 30); do
  if pg_isready -h "${PGLITE_HOST}" -p "${PGLITE_PORT}" -U postgres > /dev/null 2>&1; then
    echo "    PGlite ready after ${i}s"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "!! FATAL: PGlite not reachable after 30s"
    exit 1
  fi
  sleep 1
done

echo ""
echo "==> Applying Prisma schema via SQL..."
node data/apply-schema.mjs

echo ""
echo "==> Seeding database..."
node data/seed-raw.mjs

echo ""
echo "==> Starting Next.js on port 3000..."
echo "    Login: receptionist@hotel.com / admin123"
echo ""

exec node_modules/.bin/next start -p 3000
