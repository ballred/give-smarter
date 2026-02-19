import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createAuctionItem } from "./auction-item-actions";

export default async function NewAuctionItemPage({
  params,
}: {
  params: Promise<{ auctionId: string }>;
}) {
  const resolvedParams = await params;
  const auction = await prisma.auction.findUnique({
    where: { id: resolvedParams.auctionId },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!auction) {
    redirect("/admin/auctions");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">
          Add auction item
        </h1>
        <p className="text-sm text-stone-600">
          Add catalog details, pricing, and availability.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createAuctionItem(auction.id, formData);
          redirect(`/admin/auctions/${auction.id}?created=${id}`);
        }}
      >
        <label className="block text-sm font-semibold text-stone-700">
          Title
          <input
            name="title"
            type="text"
            required
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            placeholder="Weekend getaway package"
          />
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Description
          <textarea
            name="description"
            rows={4}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Starting bid (USD)
            <input
              name="startingBid"
              type="number"
              min="0"
              step="0.01"
              required
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Buy now (USD)
            <input
              name="buyNowPrice"
              type="number"
              min="0"
              step="0.01"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-semibold text-stone-700">
            Quantity
            <input
              name="quantity"
              type="number"
              min="1"
              defaultValue={1}
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            FMV (USD)
            <input
              name="fmvAmount"
              type="number"
              min="0"
              step="0.01"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Category
            <select
              name="categoryId"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            >
              <option value="">Uncategorized</option>
              {auction.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Status
            <select
              name="status"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Fulfillment method
            <input
              name="fulfillmentMethod"
              type="text"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
              placeholder="Pickup at event"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 text-sm font-semibold text-stone-700">
            <input
              name="isFeatured"
              type="checkbox"
              className="h-4 w-4 rounded border-amber-300 text-teal-600"
            />
            Featured item
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-stone-700">
            <input
              name="isPreviewOnly"
              type="checkbox"
              className="h-4 w-4 rounded border-amber-300 text-teal-600"
            />
            Preview only
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-teal-700 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Save item
        </button>
      </form>
    </div>
  );
}
