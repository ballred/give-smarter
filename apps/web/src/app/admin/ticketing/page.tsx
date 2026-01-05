import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function TicketingPage() {
  const ticketTypes = await prisma.ticketType.findMany({
    include: {
      campaign: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Ticketing</h1>
          <p className="text-sm text-zinc-600">
            Manage ticket types, add-ons, and seating setup.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
          href="/admin/ticketing/new"
        >
          New ticket type
        </Link>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Name</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Price</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Capacity</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {ticketTypes.length ? (
              ticketTypes.map((ticket) => (
                <tr key={ticket.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    {ticket.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {ticket.campaign?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {(ticket.price / 100).toFixed(2)} {ticket.currency}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {ticket.capacity ?? "Unlimited"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {ticket.visibility}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500"
                  colSpan={5}
                >
                  No ticket types yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
