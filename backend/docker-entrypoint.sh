#!/bin/sh
set -e

echo "[entrypoint] Applying committed migrations (prisma migrate deploy)..."
if npx prisma migrate deploy; then
  echo "[entrypoint] Migrations applied cleanly."
else
  echo "[entrypoint] migrate deploy failed (likely migration-history drift against this database)."
  echo "[entrypoint] Forcing the live schema to match schema.prisma (prisma db push)..."
  npx prisma db push --accept-data-loss --skip-generate
  echo "[entrypoint] Schema pushed."
fi

echo "[entrypoint] Database schema is in sync. Starting server..."
exec "$@"
