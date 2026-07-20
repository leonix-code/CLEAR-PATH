# ClearPath Backend (NestJS) — Dockerfile
#
# Build:
#   docker build -t clearpath-backend -f docker/backend/Dockerfile .
#
# Run (standalone):
#   docker run -p 4000:4000 --env-file .env clearpath-backend

# ── Stage 1: Install dependencies ──
FROM node:20-alpine AS deps

WORKDIR /app

# Copy ALL workspace package.json manifests — npm workspaces requires
# every workspace to be present for `npm ci` to succeed.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

# Install ALL workspace dependencies
RUN npm ci

# ── Stage 2: Build shared package ──
FROM node:20-alpine AS shared-builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/shared packages/shared
COPY tsconfig.json ./

RUN npm run build -w packages/shared

# ── Stage 3: Build backend ──
FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /app/packages/shared/package.json ./packages/shared/package.json

COPY package.json package-lock.json tsconfig.json ./
COPY apps/backend apps/backend

# Generate Prisma client
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Build the NestJS app
RUN npm run build -w apps/backend

# ── Stage 4: Production runtime ──
FROM node:20-alpine AS runner

WORKDIR /app

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /app/packages/shared/package.json ./packages/shared/package.json

# Copy built backend
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json

# Copy the start script
COPY docker/backend/start.sh /app/start.sh

# Set ownership
RUN chown -R nestjs:nodejs /app && chmod +x /app/start.sh

USER nestjs

EXPOSE 4000

CMD ["/app/start.sh"]
