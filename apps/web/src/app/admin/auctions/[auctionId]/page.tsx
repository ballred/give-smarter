import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sendNoBidReminders } from "./no-bid-actions";

export default async function AuctionDetailPage({
  params,
  searchParams,
}: {
  params: { auctionId: string };
  searchParams?: { reminder?: string };
}) {
  const [auction, noBidItems] = await Promise.all([
    prisma.auction.findUnique({
      where: { id: params.auctionId },
      include: {
        campaign: { select: { name: true } },
        items: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.auctionItem.findMany({
      where: {
        auctionId: params.auctionId,
        status: "PUBLISHED",
        bids: { none: {} },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!auction) {
    notFound();
  }

  const showReminderSent = searchParams?.reminder === "1";

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
            className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-300"
            href={`/admin/auctions/${auction.id}/categories`}
          >
            Categories
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

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              No-bid reminders
            </h2>
            <p className="text-sm text-zinc-600">
              {noBidItems.length} items are still waiting for a first bid.
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await sendNoBidReminders(auction.id);
              redirect(`/admin/auctions/${auction.id}?reminder=1`);
            }}
          >
            <button
              type="submit"
              disabled={!noBidItems.length}
              className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              Send reminder
            </button>
          </form>
        </div>
        {showReminderSent ? (
          <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-3 text-sm text-emerald-900">
            Reminder queued.
          </div>
        ) : null}
        <div className="px-6 py-4">
          {noBidItems.length ? (
            <ul className="grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
              {noBidItems.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-zinc-200 px-3 py-2"
                >
                  {item.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">
              All items have bids. Nice work!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
