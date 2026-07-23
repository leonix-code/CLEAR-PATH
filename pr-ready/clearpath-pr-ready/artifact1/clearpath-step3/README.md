# ClearPath Step 3: API integration hardening

The controller and service replacements close the integration gaps found in the source:

- authenticated student ownership for clearance requests
- step-scoped officer approval contract
- institution context on admin queries
- notification reads always scoped to the authenticated user
- bounded, validated notification pagination
- no private-service property access from controllers

Before merging, align method names with the corrected Step 1 clearance service, run Prisma generate, then lint, typecheck, unit tests, and API e2e tests.
