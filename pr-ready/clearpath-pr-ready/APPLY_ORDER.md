# Apply order

1. Replace the orphaned `apps/frontend` gitlink with the frontend scaffold.
2. Apply `schema.prisma` changes and generate a real Prisma migration.
3. Apply backend auth and bootstrap changes.
4. Apply clearance ownership/workflow changes.
5. Apply notifications and QR verification modules and register providers/controllers.
6. Replace Docker and CI configuration.
7. Run `docs/RELEASE_GATE.md`.
8. Open the PR only after the gate is green.

Do not merge the placeholder migration. Do not deploy until secrets are rotated.
