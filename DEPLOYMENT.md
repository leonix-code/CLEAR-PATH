# ClearPath Deployment Guide

## Prerequisites

- Docker & Docker Compose v2
- Node.js 20+
- GitHub account (for CI/CD)

## Quick Start (Local Development)

```bash
# 1. Clone and install
git clone https://github.com/your-org/clearpath.git
cd clearpath
npm install

# 2. Start infrastructure
npm run docker:up  # starts PostgreSQL + Redis

# 3. Run database migrations
npm run db:migrate
npm run db:seed

# 4. Start development servers
npm run dev  # starts both frontend (:3000) and backend (:4000)
```

## Docker Deployment

### Full Stack with Docker Compose

```bash
npm run docker:build   # Build all images
docker compose -f docker/docker-compose.yml up -d --wait
```

This starts:
1. **PostgreSQL 16** - Database (port 5432)
2. **Redis 7** - Cache (port 6379)
3. **Backend** - NestJS API (port 4000)
4. **Frontend** - Next.js PWA (port 3000)
5. **Caddy** - Reverse proxy (port 8080)

### Service Architecture

```
Browser -> :8080 -> Caddy -> /api/* -> Backend (:4000)
                         -> /*    -> Frontend (:3000)
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://clearpath:clearpath@postgres:5432/clearpath

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret

# QR Security
QR_SECRET=your-qr-secret

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password

# External
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

## CI/CD Pipeline

### GitHub Actions Workflows

1. **CI** (.github/workflows/ci.yml)
   - On push/PR to main
   - Lint, build, test
   - Runs unit tests

2. **E2E** (.github/workflows/e2e.yml)
   - On push/PR to main
   - Builds Docker images
   - Runs Playwright tests on Chromium, Firefox, Mobile Chrome, Mobile Safari

3. **Deploy** (manual)
   - `workflow_dispatch` trigger
   - Deploys to Railway or Vercel

### Deployment Options

#### Option 1: Railway (Recommended for full stack)
All services (Postgres, Redis, Backend, Frontend) deploy as a single Docker Compose stack.

#### Option 2: Vercel + Railway
- **Frontend** on Vercel (serverless Next.js)
- **Backend + Database + Redis** on Railway

## Health Checks

- Backend: `GET /health` -> `{"status":"ok","uptime":123}`
- Frontend: `GET /api/health` -> `{"status":"healthy"}`
- Caddy: Built-in health endpoint

## Monitoring

- Backend logs via `morgan`
- Application logs with NestJS Logger
- Audit logs stored in database
- Docker health checks restart unhealthy containers
