import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function PromoCodesPage() {
  const promoCodes = await prisma.promoCode.findMany({
    include: {
      campaign: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Promo codes</h1>
          <p className="text-sm text-zinc-600">
            Create discounts for tickets and add-ons.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
          href="/admin/ticketing/promo-codes/new"
        >
          New promo code
        </Link>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Code</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">
                Discount
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Redeemed</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {promoCodes.length ? (
              promoCodes.map((promo) => (
                <tr key={promo.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    {promo.code}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {promo.campaign?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {promo.discountType === "PERCENT"
                      ? `${promo.amount}%`
                      : `$${(promo.amount / 100).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {promo.redeemedCount}
                    {promo.maxRedemptions ? ` / ${promo.maxRedemptions}` : ""}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {promo.isActive ? "Active" : "Inactive"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500"
                  colSpan={5}
                >
                  No promo codes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
