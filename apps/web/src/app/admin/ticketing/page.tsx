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
          <h1 className="text-2xl font-semibold text-stone-900">Ticketing</h1>
          <p className="text-sm text-stone-600">
            Manage ticket types, add-ons, and seating setup.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full border border-amber-200/60 bg-white px-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:bg-amber-50"
            href="/admin/ticketing/attendees"
          >
            Manage attendees
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full border border-amber-200/60 bg-white px-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:bg-amber-50"
            href="/admin/ticketing/add-ons"
          >
            Manage add-ons
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full border border-amber-200/60 bg-white px-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:bg-amber-50"
            href="/admin/ticketing/promo-codes"
          >
            Promo codes
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full border border-amber-200/60 bg-white px-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:bg-amber-50"
            href="/admin/ticketing/seating"
          >
            Manage seating
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
            href="/admin/ticketing/new"
          >
            New ticket type
          </Link>
        </div>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Price</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Capacity</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {ticketTypes.length ? (
              ticketTypes.map((ticket) => (
                <tr key={ticket.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    {ticket.name}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {ticket.campaign?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {(ticket.price / 100).toFixed(2)} {ticket.currency}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {ticket.capacity ?? "Unlimited"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {ticket.visibility}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
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
