import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createStoreVariant } from "./variant-actions";

export default async function NewStoreVariantPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const resolvedParams = await params;
  const product = await prisma.storeProduct.findUnique({
    where: { id: resolvedParams.productId },
    select: { id: true, name: true, currency: true },
  });

  if (!product) {
    redirect("/admin/store");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">
          Add variant to {product.name}
        </h1>
        <p className="text-sm text-stone-600">
          Define sizes, colors, or other variants.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createStoreVariant(product.id, formData);
          redirect(`/admin/store/${product.id}?created=${id}`);
        }}
      >
        <label className="block text-sm font-semibold text-stone-700">
          Variant name
          <input
            name="name"
            type="text"
            required
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            placeholder="Adult Small"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            SKU
            <input
              name="sku"
              type="text"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Price ({product.currency})
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-stone-700">
          Inventory count
          <input
            name="inventoryCount"
            type="number"
            min="0"
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-teal-700 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Save variant
        </button>
      </form>
    </div>
  );
}
