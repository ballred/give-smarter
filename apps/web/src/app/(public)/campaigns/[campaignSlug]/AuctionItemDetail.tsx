import { notFound } from "next/navigation";
import { getBidIncrement, type BidIncrementRule } from "@give-smarter/core";
import { prisma } from "@/lib/db";
import { addToWatchlist, buyNow, placeBid } from "./auction-actions";

function formatCurrency(amount: number, currency: string) {
  const hasCents = amount % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount / 100);
}

function parseRules(input: unknown): BidIncrementRule[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const rules: BidIncrementRule[] = [];

  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const increment = Number(record.increment);
    if (!Number.isFinite(increment) || increment <= 0) continue;
    const upToValue = record.upTo;
    const upTo =
      upToValue === undefined
        ? undefined
        : Number.isFinite(Number(upToValue))
          ? Number(upToValue)
          : undefined;
    rules.push({ upTo, increment });
  }

  return rules.length ? rules : undefined;
}

type AuctionItemDetailProps = {
  itemId: string;
  currency: string;
  showSuccess?: boolean;
  showCanceled?: boolean;
  showWatch?: boolean;
};

export async function AuctionItemDetail({
  itemId,
  currency,
  showSuccess,
  showCanceled,
  showWatch,
}: AuctionItemDetailProps) {
  const item = await prisma.auctionItem.findUnique({
    where: { id: itemId },
    include: {
      auction: true,
      category: { select: { name: true } },
      bids: { orderBy: [{ amount: "desc" }, { createdAt: "asc" }], take: 1 },
    },
  });

  if (!item) {
    notFound();
  }

  const topBid = item.bids[0];
  const currentBid = topBid?.amount ?? item.startingBid;
  const rules = parseRules(item.bidIncrementOverride) ??
    parseRules(item.auction.bidIncrementRules);
  const increment = getBidIncrement(currentBid / 100, rules);
  const minBid = Math.round((currentBid / 100 + increment) * 100);
  const now = new Date();
  const opensAt = item.opensAt ?? item.auction.opensAt;
  const closesAt = item.closesAt ?? item.auction.closesAt;
  const isClosed = item.status === "CLOSED" || (closesAt && now > closesAt);
  const isPreview = item.isPreviewOnly || (opensAt && now < opensAt);
  const bidDisabled = isClosed || isPreview;

  return (
    <section className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto w-full max-w-5xl space-y-6 rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] p-8 shadow-[0_20px_60px_rgba(18,15,12,0.08)]">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]">
            {item.category?.name ?? "Auction"}
          </p>
          <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)]">
            {item.title}
          </h2>
          {item.description ? (
            <p className="text-sm text-[color:var(--campaign-ink-soft)]">
              {item.description}
            </p>
          ) : null}
        </header>

        {showSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Thanks for your purchase! Your buy-now checkout is complete.
          </div>
        ) : null}

        {showCanceled ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Checkout was canceled. You can try again any time.
          </div>
        ) : null}

        {showWatch ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            You are now watching this item. We'll alert you if you get outbid.
          </div>
        ) : null}

        {isPreview ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900">
            This item is in preview. Bidding opens soon.
          </div>
        ) : null}

        {isClosed ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            Bidding is closed for this item.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-surface)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
              Current bid
            </p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--campaign-ink)]">
              {formatCurrency(currentBid, currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-surface)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
              Minimum bid
            </p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--campaign-ink)]">
              {formatCurrency(minBid, currency)}
            </p>
          </div>
          {item.buyNowPrice ? (
            <div className="rounded-2xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                Buy now
              </p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--campaign-ink)]">
                {formatCurrency(item.buyNowPrice, currency)}
              </p>
            </div>
          ) : null}
        </div>

        <form action={placeBid} className="space-y-6">
          <fieldset disabled={bidDisabled} className="space-y-6">
            <input type="hidden" name="itemId" value={item.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
                Bid amount ({currency})
                <input
                  name="bidAmount"
                  type="number"
                  min={(minBid / 100).toFixed(2)}
                  step="0.01"
                  required
                  className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
                />
              </label>
              {item.auction.allowMaxBid ? (
                <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
                  Max bid (optional)
                  <input
                    name="maxBidAmount"
                    type="number"
                    min={(minBid / 100).toFixed(2)}
                    step="0.01"
                    className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
                  />
                </label>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
                First name
                <input
                  name="firstName"
                  type="text"
                  className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
                />
              </label>
              <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
                Last name
                <input
                  name="lastName"
                  type="text"
                  className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
              Email
              <input
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
                placeholder="you@example.org"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[color:var(--campaign-accent)] px-6 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--campaign-accent-strong)]"
            >
              Place bid
            </button>
            {item.buyNowPrice ? (
              <button
                type="submit"
                formAction={buyNow}
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[color:var(--campaign-border)] bg-white px-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--campaign-ink)] transition hover:bg-[color:var(--campaign-surface)]"
              >
                Buy now
              </button>
            ) : null}
          </fieldset>
        </form>

        <form
          action={addToWatchlist}
          className="space-y-4 rounded-2xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-surface)] px-5 py-4"
        >
          <input type="hidden" name="itemId" value={item.id} />
          <div>
            <p className="text-sm font-semibold text-[color:var(--campaign-ink)]">
              Watch this item
            </p>
            <p className="text-xs text-[color:var(--campaign-ink-muted)]">
              Get SMS or email alerts when bids change.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
              First name
              <input
                name="firstName"
                type="text"
                className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
              />
            </label>
            <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
              Last name
              <input
                name="lastName"
                type="text"
                className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
              />
            </label>
          </div>
          <label className="block text-sm font-semibold text-[color:var(--campaign-ink)]">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-[color:var(--campaign-border)] bg-white px-3 py-2 text-sm text-[color:var(--campaign-ink)]"
              placeholder="you@example.org"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[color:var(--campaign-ink)] px-6 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--campaign-ink-soft)]"
          >
            Watch item
          </button>
        </form>
      </div>
    </section>
  );
}
