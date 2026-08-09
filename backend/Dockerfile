# syntax=docker/dockerfile:1

##### Stage 1: compile TypeScript + generate Prisma client #####
FROM node:22-alpine AS builder
WORKDIR /app

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

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

##### Stage 3: runtime image #####
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S hop && adduser -S hop -G hop

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

# Entrypoint runs `prisma migrate deploy` (applies committed migrations to DATABASE_URL,
# never generates new ones) before handing off to the CMD below.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
