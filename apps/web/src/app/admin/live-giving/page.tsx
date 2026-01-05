import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function LiveGivingPage() {
  const levels = await prisma.paddleRaiseLevel.findMany({
    include: {
      campaign: { select: { name: true } },
    },
    orderBy: [{ campaignId: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Live Giving</h1>
          <p className="text-sm text-zinc-600">
            Configure paddle raise levels and live display scenes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:bg-zinc-100"
            href="/admin/live-giving/pledges"
          >
            Enter pledges
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
            href="/admin/live-giving/new"
          >
            New level
          </Link>
        </div>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Level</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Amount</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {levels.length ? (
              levels.map((level) => (
                <tr key={level.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    {level.label}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {level.campaign?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {(level.amount / 100).toFixed(2)} USD
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {level.isActive ? "Active" : "Paused"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500"
                  colSpan={4}
                >
                  No levels yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
