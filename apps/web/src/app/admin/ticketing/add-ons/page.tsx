import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function TicketAddOnsPage() {
  const addOns = await prisma.ticketAddOn.findMany({
    include: {
      campaign: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Ticket add-ons</h1>
          <p className="text-sm text-zinc-600">
            Offer extras like drink tickets or after-parties.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
          href="/admin/ticketing/add-ons/new"
        >
          New add-on
        </Link>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Name</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Scope</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Price</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {addOns.length ? (
              addOns.map((addOn) => (
                <tr key={addOn.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    {addOn.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {addOn.campaign?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{addOn.scope}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {(addOn.price / 100).toFixed(2)} USD
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {addOn.isActive ? "Active" : "Inactive"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500"
                  colSpan={5}
                >
                  No add-ons yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
