import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function StorePage() {
  const products = await prisma.storeProduct.findMany({
    include: {
      campaign: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Store</h1>
          <p className="text-sm text-stone-600">
            Sell merchandise and add-ons year-round.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
          href="/admin/store/new"
        >
          New product
        </Link>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Product</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Price</th>
            </tr>
          </thead>
          <tbody>
            {products.length ? (
              products.map((product) => (
                <tr key={product.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    <Link
                      className="text-stone-900 hover:text-stone-700"
                      href={`/admin/store/${product.id}`}
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {product.campaign?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {product.status}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {(product.price / 100).toFixed(2)} {product.currency}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
                  colSpan={4}
                >
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
