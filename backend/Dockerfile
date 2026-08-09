# syntax=docker/dockerfile:1

##### Stage 1: compile TypeScript + generate Prisma client #####
FROM node:22-alpine AS builder
WORKDIR /app

# Alpine ships musl + OpenSSL 3.x with no `openssl` binary by default; without it Prisma can't
# detect which engine binary to use and silently falls back to a mismatched one that fails at
# runtime with a non-JSON "Error loading shared library libssl..." response. schema.prisma also
# pins `binaryTargets` to `linux-musl-openssl-3.0.x` so the right engine gets fetched here.
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY scripts ./scripts
COPY src ./src
RUN npm run build

##### Stage 2: production-only node_modules + generated Prisma client #####
FROM node:22-alpine AS deps
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

##### Stage 3: runtime image #####
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Needed at runtime too: docker-entrypoint.sh runs `prisma migrate deploy` inside this container,
# and the migration engine binary needs libssl present on the actual running OS, not just at build time.
RUN apk add --no-cache openssl \
    && addgroup -S hop && adduser -S hop -G hop

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh \
    && mkdir -p uploads \
    && chown -R hop:hop /app

USER hop

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Entrypoint applies committed migrations to DATABASE_URL via `prisma migrate deploy`; if that
# fails (e.g. migration-history drift against this specific database) it falls back to forcing
# the live schema to match schema.prisma via `prisma db push --accept-data-loss` — see
# docker-entrypoint.sh. Either way, the entrypoint never *creates* new migrations: those are
# authored locally with `prisma migrate dev` and committed to prisma/migrations before deploying.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
