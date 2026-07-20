# 🎓 ClearPath

**Digital Student Clearance and Exam Eligibility Verification System**

A comprehensive platform for managing student clearance workflows, exam eligibility verification, and academic process automation.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9

### Serve the Landing Page

View the project landing page immediately with zero setup:

```bash
# Option 1 — using npm (recommended)
npm run serve:landing

# Option 2 — using npx directly
npx serve . -l 8080 -n
```

Then open **http://localhost:8080** in your browser.

### Run with Reverse Proxy

Access the landing page, frontend app, and backend API all through a single port.

#### Option A — Caddy directly (local)

```bash
npm run serve:proxy
```

#### Option B — Caddy in Docker (infra only)

```bash
# Start infrastructure (PostgreSQL + Redis + Caddy proxy)
npm run docker:up:all

# The proxy expects frontend/backend running on your host:
npm run dev
```

#### Option C — Full stack in Docker

```bash
# Build all images and start every service
npm run docker:build && npm run docker:up:all
```

Then open **http://localhost:8080**:

| Path | Destination |
|------|-------------|
| `/` | Landing page (`index.html`) |
| `/login`, `/dashboard`, etc. | Next.js frontend (container) |
| `/api/*` | NestJS backend (container) |
| `/api/docs` | Swagger UI |
| `/health` | Backend health check |

### Run the Full Application (Development)

```bash
# 1. Install dependencies
npm install

# 2. Start infrastructure (PostgreSQL + Redis)
npm run docker:up

# 3. Run database migrations
npm run db:migrate

# 4. Seed the database
npm run db:seed

# 5. Start both backend and frontend in dev mode
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **API Docs (Swagger):** http://localhost:4000/api/docs

---

## 📦 Project Structure

```
clearpath/
├── apps/
│   ├── backend/          # NestJS API server
│   └── frontend/         # Next.js application
├── packages/
│   └── shared/           # Shared types, utils, validators
├── .dockerignore          # Docker build exclusions
├── Caddyfile             # Caddy reverse proxy config (local)
├── nginx.conf            # Nginx reverse proxy config
├── docker/
│   ├── caddy/
│   │   ├── Caddyfile     # Caddy config (Docker)
│   │   └── Dockerfile    # Caddy container image
│   ├── backend/
│   │   ├── Dockerfile    # NestJS backend container
│   │   └── start.sh      # Backend startup script
│   ├── frontend/
│   │   └── Dockerfile    # Next.js frontend container
│   └── docker-compose.yml
├── index.html            # Project landing page
└── package.json          # Monorepo root
```

## 🧰 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in dev mode |
| `npm run serve:landing` | Serve the project landing page on port 8080 |
| `npm run serve:proxy` | Run Caddy reverse proxy on port 8080 (requires Caddy) |
| `npm run dev:frontend` | Start only the Next.js frontend |
| `npm run dev:backend` | Start only the NestJS backend |
| `npm run build` | Build all packages and apps |
| `npm run test` | Run all tests |
| `npm run lint` | Lint all apps |
| `npm run format` | Format code with Prettier |
| `npm run docker:up` | Start PostgreSQL and Redis via Docker |
| `npm run docker:up:all` | Start all Docker services (full stack) |
| `npm run docker:down` | Stop all Docker services |
| `npm run docker:build` | Build all Docker images |
| `npm run docker:build:proxy` | Build only the Caddy proxy image |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database |

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, TypeScript
- **Backend:** NestJS, Prisma, PostgreSQL, Redis
- **Infrastructure:** Docker, Docker Compose

## 🔑 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@clearpath.edu | *(use seeded password)* |
| Student | student@clearpath.edu | *(use seeded password)* |
| Finance Officer | finance@clearpath.edu | *(use seeded password)* |

---

<p align="center">Built with ❤️ for academic institutions</p>
