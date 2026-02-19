import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AuctionsPage() {
  const auctions = await prisma.auction.findMany({
    include: {
      campaign: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-stone-900">Auctions</h1>
          <p className="text-sm text-stone-600">
            Configure auction catalogs, bidding rules, and live closeouts.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
          href="/admin/auctions/new"
        >
          New auction
        </Link>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Opens</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Closes</th>
            </tr>
          </thead>
          <tbody>
            {auctions.length ? (
              auctions.map((auction) => (
                <tr key={auction.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    <Link
                      className="text-stone-900 hover:text-stone-700"
                      href={`/admin/auctions/${auction.id}`}
                    >
                      {auction.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {auction.campaign?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{auction.status}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {auction.opensAt
                      ? new Date(auction.opensAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {auction.closesAt
                      ? new Date(auction.closesAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
                  colSpan={5}
                >
                  No auctions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
