#!/bin/sh
set -e

# DATABASE_PATH is expected to point at a file inside the mounted volume
# (e.g. /data/metro.db). Ensure the directory exists before anything
# touches the DB.
mkdir -p "$(dirname "$DATABASE_PATH")"

echo "[entrypoint] Applying migrations to $DATABASE_PATH ..."
npx drizzle-kit migrate

# Seed is idempotent (INSERT OR IGNORE on natural keys). On first boot it
# populates the empty DB. On subsequent boots it's a no-op, so nothing
# gets overwritten even though the volume already has data.
echo "[entrypoint] Running seed (idempotent) ..."
npx tsx scripts/seed.ts

echo "[entrypoint] Starting Next.js on port ${PORT:-3000} ..."
exec node_modules/.bin/next start -p "${PORT:-3000}"
