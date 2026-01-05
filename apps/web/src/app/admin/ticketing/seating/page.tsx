import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function SeatingPage() {
  const tables = await prisma.table.findMany({
    include: {
      campaign: { select: { name: true } },
      _count: { select: { seats: true, attendees: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Seating</h1>
          <p className="text-sm text-zinc-600">
            Configure tables and seat capacity for each campaign.
          </p>
        </div>
        <Link
          href="/admin/ticketing/seating/new"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          New table
        </Link>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Table</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">
                Capacity
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Seats</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">
                Assigned
              </th>
            </tr>
          </thead>
          <tbody>
            {tables.length ? (
              tables.map((table) => (
                <tr key={table.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    {table.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {table.campaign?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {table.capacity}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {table._count.seats}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {table._count.attendees}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500"
                  colSpan={5}
                >
                  No tables configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
