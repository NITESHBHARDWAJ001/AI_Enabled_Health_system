#!/bin/sh
set -e

echo "[entrypoint] Applying database migrations (prisma migrate deploy)..."
npx prisma migrate deploy

echo "[entrypoint] Migrations applied. Starting server..."
exec "$@"
