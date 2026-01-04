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
Owner: unassigned
Scope: `apps/web/src/app/api`, `packages/core`
Status: not started
Notes: Will scaffold Payment Intent + webhook handlers.

## WS-CAM - Campaign model + CMS
Owner: unassigned
Scope: `apps/web/src/app/(public)`, `packages/ui`
Status: not started
Notes: Public campaign routes and block renderer.

## WS-QA - Testing + perf
Owner: unassigned
Scope: `packages/tests`
Status: not started
Notes: Playwright config and journey tests.
