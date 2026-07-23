# ClearPath production hardening patch

## Summary
This patch addresses the highest-risk blockers identified in the source audit:

- removes public role assignment and forced verification from registration
- introduces real password-reset and email-verification persistence
- hashes rotating refresh tokens and detects token-family reuse
- aligns authentication around an httpOnly refresh cookie
- adds tenant/institution primitives and FK/hot-path indexes
- replaces global officer fan-out with step-scoped clearance approvals
- adds ownership-scoped clearance and notification access
- fixes bootstrap middleware imports and API prefix drift
- adds signed QR verification and privacy-safe public certificate validation
- externalizes Docker secrets and gates the missing frontend workspace in CI
- includes a Next.js 15 frontend replacement scaffold

## Scope
This is a patch bundle, not an applied GitHub PR. Apply the files from `artifacts/` into a clean clone of `leonix-code/CLEAR-PATH`, review the schema migration, then run the release gate in `docs/RELEASE_GATE.md`.

## Non-negotiable review items
1. Generate and review the real Prisma SQL migration. The placeholder migration must not ship.
2. Register every new provider/controller in the corresponding Nest modules.
3. Replace the queue boundary with Bull/BullMQ plus Redis before production.
4. Verify the frontend submodule is removed and the replacement is committed under `apps/frontend`.
5. Rotate every secret exposed in repository history.
