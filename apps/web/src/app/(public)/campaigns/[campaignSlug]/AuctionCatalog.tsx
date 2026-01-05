import Link from "next/link";
import type { Campaign } from "@give-smarter/core";
import { prisma } from "@/lib/db";

function formatCurrency(amount: number, currency: string) {
  const hasCents = amount % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount / 100);
}

type AuctionCatalogProps = {
  campaign: Campaign;
};

export async function AuctionCatalog({ campaign }: AuctionCatalogProps) {
  if (!campaign.id) {
    return null;
  }

  const items = await prisma.auctionItem.findMany({
    where: {
      auction: { campaignId: campaign.id },
      status: "PUBLISHED",
    },
    include: {
      auction: { select: { timezone: true } },
      category: { select: { name: true } },
      bids: { orderBy: { amount: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const currency = campaign.currency ?? "USD";

  if (!items.length) {
    return (
      <section className="px-6 pb-16 pt-8 sm:px-10">
        <div className="mx-auto w-full max-w-5xl rounded-3xl border border-dashed border-[color:var(--campaign-border)] bg-white p-6 text-sm text-[color:var(--campaign-ink-muted)]">
          Auction items will appear here once published.
        </div>
      </section>
    );
  }

  return (
    <section id="auction" className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="space-y-2">
          <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)]">
            Auction catalog
          </h2>
          <p className="text-sm text-[color:var(--campaign-ink-soft)]">
            Browse items and place bids from any device.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const topBid = item.bids[0];
            const currentBid = topBid?.amount ?? item.startingBid;
            return (
              <Link
                key={item.id}
                href={`/campaigns/${campaign.slug}/auction/${item.id}`}
                className="group flex h-full flex-col justify-between rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] px-6 py-5 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(32,26,20,0.12)]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]">
                    <span>{item.category?.name ?? "Auction"}</span>
                    {item.isFeatured ? <span>Featured</span> : null}
                  </div>
                  <h3 className="text-xl font-semibold text-[color:var(--campaign-ink)]">
                    {item.title}
                  </h3>
                  {item.description ? (
                    <p className="text-sm text-[color:var(--campaign-ink-soft)] line-clamp-3">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <div className="mt-6 flex items-center justify-between text-sm">
                  <span className="text-[color:var(--campaign-ink-muted)]">
                    Current bid
                  </span>
                  <span className="text-lg font-semibold text-[color:var(--campaign-ink)]">
                    {formatCurrency(currentBid, currency)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
