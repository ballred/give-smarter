import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function AuctionDetailPage({
  params,
}: {
  params: { auctionId: string };
}) {
  const auction = await prisma.auction.findUnique({
    where: { id: params.auctionId },
    include: {
      campaign: { select: { name: true } },
      items: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!auction) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            {auction.campaign?.name ?? "Campaign"}
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {auction.name}
          </h1>
          <p className="text-sm text-zinc-600">
            Status: {auction.status} ·{" "}
            {auction.opensAt ? new Date(auction.opensAt).toLocaleString() : "No open date"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-300"
            href="/admin/auctions/procurement"
          >
            Procurement
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
            href={`/admin/auctions/${auction.id}/items/new`}
          >
            New item
          </Link>
        </div>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Item</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Start</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Buy now</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Qty</th>
            </tr>
          </thead>
          <tbody>
            {auction.items.length ? (
              auction.items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    {item.title}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{item.status}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {(item.startingBid / 100).toFixed(2)} USD
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {item.buyNowPrice
                      ? `${(item.buyNowPrice / 100).toFixed(2)} USD`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{item.quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500"
                  colSpan={5}
                >
                  No items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
