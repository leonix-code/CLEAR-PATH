# Release gate

Run from repository root against one coherent tree:

```bash
npm ci
npm run db:generate -w apps/backend
npx prisma validate --schema apps/backend/prisma/schema.prisma
npx prisma migrate dev --name production-hardening --schema apps/backend/prisma/schema.prisma
npm run build -w packages/shared
npm run lint -w apps/backend -- --no-fix
npm run build -w apps/backend
npm run test -w apps/backend
npm audit --omit=dev --audit-level=high
npm run build -w apps/frontend
npm run docker:build
```

Security checks:

- register rejects a role field and creates only STUDENT accounts
- unverified accounts cannot log in
- reset tokens are single-use, hashed, expiring, and invalidate sessions
- refresh token replay revokes the token family
- students cannot read another student's clearance
- officers can only act on matching workflow steps
- notification reads cannot cross users
- QR tampering and expired certificates return invalid
- every tenant-scoped query carries institution context
- no production secret remains in tracked files or Git history
