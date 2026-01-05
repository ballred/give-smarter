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
Notes: Expanded schema to cover ticketing, auctions, live giving, growth modules, messaging, and integrations.

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

## WS-AUC - Auction management
Owner: codex
Scope: `apps/web/src/app/admin/auctions`, `apps/web/src/app/api/admin/auctions`, `packages/core/src/auction.ts`
Status: in progress
Notes: Admin auction list + create flow + CRUD endpoints and bid increment helpers.

## WS-LIVE - Paddle raise
Owner: codex
Scope: `apps/web/src/app/admin/live-giving`, `apps/web/src/app/api/admin/paddle-raise-levels`
Status: in progress
Notes: Admin paddle raise level list + create flow + CRUD endpoints.

## WS-PORTAL - Donor portal shell
Owner: codex
Scope: `apps/web/src/app/portal`
Status: in progress
Notes: Portal layout + placeholder sections for tickets, bids, receipts, recurring, profile.

## WS-AUC-ITEMS - Auction items + procurement
Owner: codex
Scope: `apps/web/src/app/admin/auctions`, `apps/web/src/app/api/admin/auctions`, `apps/web/src/app/api/admin/procurement`
Status: in progress
Notes: Auction item list + create flow, procurement submissions UI + API.

## WS-CHECKIN - Event check-in
Owner: codex
Scope: `apps/web/src/app/admin/check-in`, `apps/web/src/app/api/admin/checkin`
Status: in progress
Notes: Search + bulk check-in, QR placeholder, import flow, and check-in APIs.

## WS-GROW - Raffles, voting, store
Owner: codex
Scope: `apps/web/src/app/admin/raffles`, `apps/web/src/app/admin/voting`, `apps/web/src/app/admin/store`, `apps/web/src/app/api/admin/*`
Status: in progress
Notes: Admin shells + CRUD endpoints for raffles, contests, store products, candidates, variants, and draws.

## WS-RPT - Reporting
Owner: codex
Scope: `apps/web/src/app/admin/reports`, `apps/web/src/app/api/admin/reports`
Status: in progress
Notes: Finance + attendance report pages and CSV export endpoints stubbed.

## WS-AUC-CAT - Auction categories
Owner: codex
Scope: `apps/web/src/app/admin/auctions/[auctionId]/categories`, `apps/web/src/app/api/admin/auctions/[auctionId]/categories`
Status: in progress
Notes: Category management UI and CRUD endpoints added.

## WS-QA - Testing + perf
Owner: codex
Scope: `packages/tests`
Status: in progress
Notes: Playwright config and smoke tests added with Clerk-aware skip.

## WS-TIX - Ticketing + check-in
Owner: codex
Scope: `apps/web/src/app/admin/ticketing`, `apps/web/src/app/api/admin/ticket-types`
Status: in progress
Notes: Admin ticketing list + create form and CRUD API routes added.

## WS-MSG - Messaging templates
Owner: codex
Scope: `apps/web/src/app/admin/messaging`, `apps/web/src/app/api/admin/email-templates`, `apps/web/src/app/api/admin/sms-templates`
Status: in progress
Notes: Email/SMS template UI, send history, and template CRUD APIs added.
