import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/receipt-template";
import { getPortalDonors } from "../portal-data";

export default async function DonorBidsPage() {
  const portal = await getPortalDonors();
  const donorIds = portal?.donors.map((donor) => donor.id) ?? [];

  const bids = donorIds.length
    ? await prisma.bid.findMany({
        where: { donorId: { in: donorIds } },
        include: {
          auctionItem: {
            select: {
              title: true,
              auction: {
                select: {
                  name: true,
                  campaign: {
                    select: {
                      name: true,
                      slug: true,
                      organization: { select: { defaultCurrency: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-900">Bids</h1>
        <p className="text-sm text-stone-600">
          Track your latest bids and auction activity.
        </p>
      </header>

      {!bids.length ? (
        <div className="rounded-2xl border border-dashed border-amber-200/60 bg-white p-6 text-sm text-stone-500">
          Winning bids and invoices will appear here once you start bidding.
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => {
            const currency =
              bid.auctionItem.auction.campaign.organization.defaultCurrency ??
              "USD";

            return (
              <div
                key={bid.id}
                className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-stone-900">
                      {bid.auctionItem.title}
                    </h2>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      {bid.auctionItem.auction.name} |{" "}
                      {bid.auctionItem.auction.campaign.name}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatDate(bid.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-stone-900">
                      {formatCurrency(bid.amount, currency)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {bid.maxBidAmount
                        ? `Max ${formatCurrency(bid.maxBidAmount, currency)}`
                        : "Standard bid"}
                    </p>
                    <span className="mt-2 inline-flex rounded-full border border-amber-200/60 bg-amber-50/40 px-3 py-1 text-xs font-semibold text-stone-600">
                      {bid.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
