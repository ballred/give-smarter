# GiveSmarter Build Plan (Vercel + Stripe + Clerk + Playwright)

This plan translates the requirements doc into buildable workstreams and a phased delivery path. It is written to support multiple concurrent agents working in parallel.

## Goals and non-negotiables
- Donor-first performance (fast mobile pages, minimal JS, real-time updates).
- Unified donor identity and portal across campaigns.
- Ledger-first money model and reconciliation-grade reporting.
- Mobile-first event tooling (check-in, bidding, paddle raise, checkout).
- Composable campaigns (tickets + auction + donations + raffles + P2P).

## Stack decisions (fixed + recommended)
- Hosting: Vercel (Next.js App Router).
- Payments: Stripe (Connect for org-level merchant accounts).
- Auth: Clerk (passwordless for donors, SSO optional for admins).
- Testing: Playwright for E2E; Vitest for unit/integration.

Recommended defaults:
- Web: Next.js 14+ (App Router), TypeScript, React 18.
- UI: Tailwind CSS + Radix UI (shadcn pattern) for accessible components.
- DB: Postgres (Neon or Supabase) + Prisma.
- Realtime: Ably (recommended) or Pusher for WebSocket fanout.
  - Rationale: Vercel serverless is not ideal for long-lived sockets.
- Jobs/queue: Upstash Redis + QStash + Vercel Cron.
- Email: Resend (recommended) or SendGrid.
- SMS: Twilio.
- File storage: Cloudflare R2 (recommended) or S3.
- Analytics: Google Analytics + Vercel Web Analytics.
- Observability: Sentry + OpenTelemetry tracing.

## Proposed repo layout
- apps/web (Next.js app)
  - app/(public)    public campaign pages
  - app/(donor)     donor portal
  - app/(admin)     admin console
  - app/api         REST endpoints + webhooks
- packages/db       Prisma schema, migrations, seed, DB utilities
- packages/core     domain types, validation, money, ledger, policies
- packages/ui       shared design system + tokens
- packages/workflows background jobs, notifications, scheduled tasks
- packages/tests    Playwright helpers and fixtures
- docs              specs, ADRs, plan

## Architecture decisions
- Multi-tenancy: org_id on all tenant tables; enforce in API + policies.
- Auth and RBAC:
  - Clerk user for admins and donors.
  - Internal role assignments stored in DB; enforced at API.
- Realtime:
  - Publish bid, pledge, and leaderboard events via Ably/Pusher.
  - Server publishes after DB commit; clients subscribe per campaign.
- Payments:
  - Stripe Payment Intents for all checkouts.
  - Stripe webhooks finalize orders and write ledger entries.
- Ledger:
  - Every payment/refund produces immutable ledger entries.
  - Reports read from ledger + line items only.
- Performance:
  - Public pages SSR/SSG with edge cache and revalidation.
  - Catalog pages cached; bidding and checkout are dynamic.

## Delivery phases
Phase 0 - Foundation
- Repo scaffold, CI, linting, baseline Next.js app.
- Clerk auth integration and RBAC layer.
- Core schema: orgs, users, donors, campaigns, ledger.
- Stripe integration (test mode), webhooks, receipt generation.
- Design system tokens and shared UI components.

Phase 1 - School Gala replacement (target first release)
- Campaign pages + donation flow + receipt email.
- Ticketing + registration form builder + seating basics.
- Auction: silent bidding, max bid, buy-it-now, outbid SMS.
- Live giving: paddle raise entry + live display.
- Check-in/out tooling + self-checkout.
- Basic reporting + CSV exports.

Phase 2 - Year-round fundraising
- Unlimited campaigns + templates + embeddables.
- Peer-to-peer with classroom leaderboards.
- Raffles + voting + storefront.
- Automation messaging (email + SMS).

Phase 3 - Full suite parity
- Donor CRM module (households, pledges, soft credits).
- CRM connectors + matching gifts.
- Advanced finance exports + reconciliation automation.
- PWA enhancements and optional native app shell.

## Workstreams for parallel agents
WS-DB: Schema + ledger
- Prisma schema for orgs, donors, campaigns, orders, ledger.
- Migrations + seed data.
- Money utilities, tax-deductible calculations.

WS-AUTH: Clerk + RBAC
- Clerk setup, session handling, org context.
- Role assignments + policy middleware.
- Donor portal identity mapping and merge tooling.

WS-PAY: Stripe + receipts
- Payment Intent flows for donations, tickets, auctions.
- Webhooks for payment_succeeded/refund/payout.
- Receipt PDF/email pipeline.

WS-CAM: Campaign model + CMS
- Campaign entity + module toggles.
- Page types + block editor JSON schema.
- Theme tokens and page rendering.

WS-TIX: Ticketing + check-in
- Ticket types, add-ons, promo codes.
- Registration form builder + attendee answers.
- QR ticket generation + check-in UX.

WS-AUC: Auction engine + realtime
- Item model, categories, procurement tracking.
- Bidding rules, max bid, anti-sniping.
- Ably/Pusher events and outbid notifications.

WS-LIVE: Paddle raise + live display
- Levels, pledges, operator mode.
- Realtime display scenes and screens.

WS-MSG: Messaging
- Template builder data model.
- Email/SMS sending and delivery logs.
- Segment builder and throttling rules.

WS-RPT: Reporting
- Dashboard widgets and operational reports.
- Ledger-based finance reports + exports.

WS-GROW: Raffles, voting, store
- Raffle config + draw tool.
- Voting contest and leaderboards.
- Store products and fulfillment.

WS-P2P: Peer-to-peer
- Fundraiser/team/classroom pages.
- Attribution rollups and exports.

WS-INT: Integrations
- Webhooks framework + signing.
- CRM sync framework and field mapping.
- Matching gift widget integration.

WS-QA: Testing + perf
- Playwright journeys A-E.
- Load and performance budgets.
- Observability dashboards.

## Data model plan (high level)
- Base columns: id, org_id, created_at, updated_at, deleted_at.
- Money fields: amount_cents + currency.
- Line items: type enum + FMV + benefit_value.
- Ledger: accounts + entries + transaction grouping.
- Donors: emails/phones/addresses with dedupe keys.

## Bidding engine plan
- All bids in a DB transaction.
- Lock the auction_item row for update.
- Apply increment rules and proxy bid resolution.
- Persist bid history with millisecond timestamps.
- Emit realtime events after commit.

## Realtime plan
- Channels:
  - campaign:{id}:live
  - auction:{id}:items
  - auction_item:{id}
- Events: bid_placed, outbid, item_closed, pledge_added, totals_updated.
- Fallback polling if realtime unavailable.

## Security and compliance
- PCI via Stripe only; no card data stored.
- Encrypted PII at rest.
- 2FA for admins via Clerk.
- Rate limits for auth, bidding, and SMS.
- Signed webhooks and audit logs for admin actions.

## Testing plan
- Playwright for Journeys A-E with seeded data.
- Unit tests for ledger math and bidding rules.
- API contract tests for public endpoints.

## Agent coordination tips
- Claim a workstream and stick to its directory scope.
- Add an ADR in docs/ for any major design change.
- Avoid cross-cutting refactors without coordination.

## Next actions
- Scaffold monorepo and baseline Next.js app.
- Create Prisma schema and core domain types.
- Integrate Clerk and Stripe in test mode.
