import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function StoreProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const resolvedParams = await params;
  const product = await prisma.storeProduct.findUnique({
    where: { id: resolvedParams.productId },
    include: {
      campaign: { select: { name: true } },
      variants: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            {product.campaign?.name ?? "Campaign"}
          </p>
          <h1 className="text-2xl font-semibold text-stone-900">
            {product.name}
          </h1>
          <p className="text-sm text-stone-600">
            Status: {product.status} · {(product.price / 100).toFixed(2)}{" "}
            {product.currency}
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
          href={`/admin/store/${product.id}/variants/new`}
        >
          New variant
        </Link>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Variant</th>
              <th className="px-4 py-3 font-semibold text-stone-700">SKU</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Price</th>
              <th className="px-4 py-3 font-semibold text-stone-700">
                Inventory
              </th>
            </tr>
          </thead>
          <tbody>
            {product.variants.length ? (
              product.variants.map((variant) => (
                <tr key={variant.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    {variant.name}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {variant.sku ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {variant.price
                      ? `${(variant.price / 100).toFixed(2)} ${product.currency}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {variant.inventoryCount ?? "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
                  colSpan={4}
                >
                  No variants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
