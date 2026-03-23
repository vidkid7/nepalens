# ────────────────────────────────────────────────────────────
# Multi-stage Dockerfile for NepaLens Next.js app
# ────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ──
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/queue/package.json ./packages/queue/package.json
COPY packages/search/package.json ./packages/search/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/storage/package.json ./packages/storage/package.json

# Skip postinstall scripts (redis-memory-server tries to compile Redis)
RUN npm ci --ignore-scripts

# ── Stage 2: Build ──
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (invoke directly via node — avoids symlink issues)
RUN node node_modules/prisma/build/index.js generate --schema=packages/database/prisma/schema.prisma

# Build all packages then the web app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=1
RUN node node_modules/turbo/bin/turbo build --filter=@nepalens/web

# ── Stage 3: Production runner ──
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

CMD ["node", "apps/web/server.js"]
