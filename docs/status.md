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

## WS-AUDIT - Audit log
Owner: codex
Scope: `apps/web/src/lib`, admin actions
Status: in progress
Notes: Added audit log helper, admin audit log page + export, and instrumented auction closes + ticket/add-on/promo creation.

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
Notes: Scaffolding public campaign routes, block schema, and renderer; admin campaign list + create/edit UI added.

## WS-AUC - Auction management
Owner: codex
Scope: `apps/web/src/app/admin/auctions`, `apps/web/src/app/api/admin/auctions`, `packages/core/src/auction.ts`
Status: in progress
Notes: Admin auction list + create flow + CRUD endpoints and bid increment helpers; public catalog + bid form added; item-level open/close + preview gating, anti-sniping extensions, buy-now checkout, close-item invoicing, proxy bidding logic, watchlist signup + bid alerts, no-bid reminder queueing, and outbid message queueing added.

## WS-LIVE - Paddle raise
Owner: codex
Scope: `apps/web/src/app/admin/live-giving`, `apps/web/src/app/api/admin/paddle-raise-levels`
Status: in progress
Notes: Admin paddle raise level list + create flow + pledge entry UI; live display page + API now include auction top bids and totals.

## WS-PORTAL - Donor portal shell
Owner: codex
Scope: `apps/web/src/app/portal`
Status: in progress
Notes: Portal now loads tickets, bids, receipts, and profile preferences from donor records, with edit flow for contact info and comms prefs.

## WS-AUC-ITEMS - Auction items + procurement
Owner: codex
Scope: `apps/web/src/app/admin/auctions`, `apps/web/src/app/api/admin/auctions`, `apps/web/src/app/api/admin/procurement`
Status: in progress
Notes: Auction item list + create flow, procurement submissions UI + API.

## WS-CHECKIN - Event check-in
Owner: codex
Scope: `apps/web/src/app/admin/check-in`, `apps/web/src/app/api/admin/checkin`
Status: in progress
Notes: Search + bulk check-in, manual QR entry flow, import flow, and check-in APIs.

## WS-GROW - Raffles, voting, store
Owner: codex
Scope: `apps/web/src/app/admin/raffles`, `apps/web/src/app/admin/voting`, `apps/web/src/app/admin/store`, `apps/web/src/app/api/admin/*`
Status: in progress
Notes: Admin shells + CRUD endpoints for raffles, contests, store products, candidates, variants, and draws; public store, raffle, and voting checkout flows added.

## WS-RPT - Reporting
Owner: codex
Scope: `apps/web/src/app/admin/reports`, `apps/web/src/app/api/admin/reports`
Status: complete
Notes: Finance report shows payment totals, fees, net revenue, refund rate + transaction table with status badges. Attendance report shows registered/checked-in/cancelled counts + attendee table with check-in timestamps. Both include CSV export.

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
Notes: Admin ticketing list + create form and CRUD API routes added; add-ons + promo code management, seating tables admin + auto seat generation + attendee table assignments added; public ticket checkout supports add-ons, promo codes, cover-fee opt-in, and attendee QR codes.

## WS-MSG - Messaging templates
Owner: codex
Scope: `apps/web/src/app/admin/messaging`, `apps/web/src/app/api/admin/email-templates`, `apps/web/src/app/api/admin/sms-templates`
Status: in progress
Notes: Email/SMS template UI, send history, and template CRUD APIs added.

## WS-DON - Donations + text-to-give
Owner: codex
Scope: `apps/web/src/app/admin/donations`, `apps/web/src/app/api/admin/keyword-routes`
Status: in progress
Notes: Keyword route management UI + API added; donation form config UI and public donate checkout flow added with UTM capture; inbound SMS webhook replies with campaign links + UTM tracking.

## WS-SPONSOR - Sponsor management
Owner: codex
Scope: `apps/web/src/app/admin/sponsors`, `apps/web/src/app/api/admin/sponsors`
Status: in progress
Notes: Sponsor CRUD UI + placements form and API endpoints added; public sponsor page renders campaign placements.

## WS-INT - Integrations + API
Owner: codex
Scope: `apps/web/src/app/admin/integrations`, `apps/web/src/app/api/admin/api-tokens`, `apps/web/src/app/api/admin/webhooks`
Status: in progress
Notes: API token and webhook management UI + CRUD APIs added.

## WS-VOL - Volunteer signups
Owner: codex
Scope: `apps/web/src/app/admin/volunteers`, `apps/web/src/app/(public)/campaigns/*`, `packages/db`
Status: in progress
Notes: Volunteer shifts + signups schema, admin shift management, public signup form, and CSV export endpoint added.

## WS-CRM - Donor profiles
Owner: codex
Scope: `apps/web/src/app/admin/donors`, `apps/web/src/app/api/admin/donors`
Status: in progress
Notes: Donor list + detail UI with update form and donor CRUD API added; household admin pages + membership endpoints added.

## WS-P2P - Peer-to-peer fundraising
Owner: codex
Scope: `apps/web/src/app/admin/peer-to-peer`, `apps/web/src/app/(public)/campaigns/*`, `packages/db`
Status: in progress
Notes: Added schema + seed, public peer-to-peer pages with donation attribution + share links, admin CRUD for fundraisers/teams/classrooms, and classroom CSV export.
