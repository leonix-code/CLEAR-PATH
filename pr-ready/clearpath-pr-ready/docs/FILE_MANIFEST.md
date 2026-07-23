# File manifest

## Backend security and auth
- apps/backend/src/auth/dto/register.dto.ts
- apps/backend/src/auth/auth.service.ts
- apps/backend/src/auth/auth.controller.ts
- apps/backend/src/auth/dto/change-password.dto.ts
- apps/backend/src/main.ts
- apps/backend/src/common/guards/login-throttle.guard.ts

## Backend domain hardening
- apps/backend/src/prisma/prisma.service.ts
- apps/backend/src/modules/clearance/controllers/clearance.controller.ts
- apps/backend/src/modules/clearance/services/clearance.service.ts
- apps/backend/src/modules/notifications/controllers/notifications.controller.ts
- apps/backend/src/modules/notifications/services/notifications.service.ts
- apps/backend/src/modules/notifications/notification-queue.service.ts
- apps/backend/src/modules/notifications/delivery.types.ts
- apps/backend/src/modules/qr/qr-signing.service.ts
- apps/backend/src/modules/qr/public-verification.service.ts
- apps/backend/src/modules/certificates/certificate-verification.controller.ts

## Data and infrastructure
- apps/backend/prisma/schema.prisma
- apps/backend/prisma/migrations/**
- .env.example
- docker/docker-compose.yml
- .github/workflows/ci.yml

## Frontend replacement
- apps/frontend/package.json
- apps/frontend/tsconfig.json
- apps/frontend/next.config.ts
- apps/frontend/tailwind.config.ts
- apps/frontend/app/**
- apps/frontend/components/**
- apps/frontend/lib/**
- apps/frontend/stores/**
- apps/frontend/types/**
- apps/frontend/middleware.ts
