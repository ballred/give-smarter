# Workstream Status

Use this file to coordinate parallel agents. Add a short entry for each workstream you claim.

Template:
```
## WS-XYZ - <workstream name>
Owner: <name or handle>
Scope: <folders or components>
Status: <not started | in progress | blocked | complete>
Notes: <short updates or blockers>
```

## WS-DB - Schema + ledger
Owner: codex
Scope: `packages/db`
Status: in progress
Notes: Initial Prisma schema added (orgs, donors, campaigns, ledger, orders).

## WS-AUTH - Clerk + RBAC
Owner: codex
Scope: `apps/web/src` auth + middleware
Status: in progress
Notes: Clerk provider, auth routes, middleware, and RBAC helpers added.

## WS-PAY - Stripe + receipts
Owner: codex
Scope: `apps/web/src/app/api`, `packages/core`
Status: complete
Notes: Payment intent creation persists orders/payments + metadata; webhooks update ledger/refunds/receipts; receipt email/PDF pipeline wired.

## WS-CAM - Campaign model + CMS
Owner: codex
Scope: `apps/web/src/app/(public)`, `packages/ui`
Status: in progress
Notes: Scaffolding public campaign routes, block schema, and renderer.

## WS-QA - Testing + perf
Owner: codex
Scope: `packages/tests`
Status: in progress
Notes: Playwright config and smoke tests added with Clerk-aware skip.
