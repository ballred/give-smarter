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
          <h1 className="text-2xl font-semibold text-stone-900">Seating</h1>
          <p className="text-sm text-stone-600">
            Configure tables and seat capacity for each campaign.
          </p>
        </div>
        <Link
          href="/admin/ticketing/seating/new"
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          New table
        </Link>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Table</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-stone-700">
                Capacity
              </th>
              <th className="px-4 py-3 font-semibold text-stone-700">Seats</th>
              <th className="px-4 py-3 font-semibold text-stone-700">
                Assigned
              </th>
            </tr>
          </thead>
          <tbody>
            {tables.length ? (
              tables.map((table) => (
                <tr key={table.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    {table.name}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {table.campaign?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {table.capacity}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {table._count.seats}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {table._count.attendees}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
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
