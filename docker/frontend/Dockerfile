# ClearPath Frontend (Next.js) — Dockerfile
#
# Build:
#   docker build -t clearpath-frontend -f docker/frontend/Dockerfile .
#
# Run:
#   docker run -p 3000:3000 clearpath-frontend

# ── Stage 1: Install dependencies ──
FROM node:20-alpine AS deps

WORKDIR /app

# Copy ALL workspace package.json manifests — npm workspaces requires
# every workspace to be present for `npm ci` to succeed.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json

# Install ALL workspace dependencies
RUN npm ci

# ── Stage 2: Build shared package ──
FROM node:20-alpine AS shared-builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY packages/shared packages/shared

RUN npm run build -w packages/shared

# ── Stage 3: Build frontend ──
FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /app/packages/shared/package.json ./packages/shared/package.json

COPY package.json package-lock.json tsconfig.json ./
COPY apps/frontend apps/frontend

# Ensure NODE_ENV is set so next.config.ts enables standalone output
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js app (output: standalone)
RUN npm run build -w apps/frontend

# ── Stage 4: Production runtime ──
FROM node:20-alpine AS runner

WORKDIR /app

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the standalone output — this creates server.js at /app/server.js
# and a minimal node_modules and .next alongside it.
COPY --from=builder /app/apps/frontend/.next/standalone ./

# Copy static assets to the correct location relative to server.js
COPY --from=builder /app/apps/frontend/.next/static ./.next/static
COPY --from=builder /app/apps/frontend/public ./public

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
