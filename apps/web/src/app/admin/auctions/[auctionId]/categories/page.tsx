import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createAuctionCategory } from "./category-actions";

export default async function AuctionCategoriesPage({
  params,
}: {
  params: Promise<{ auctionId: string }>;
}) {
  const resolvedParams = await params;
  const auction = await prisma.auction.findUnique({
    where: { id: resolvedParams.auctionId },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      campaign: { select: { name: true } },
    },
  });

  if (!auction) {
    redirect("/admin/auctions");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
          {auction.campaign?.name ?? "Campaign"}
        </p>
        <h1 className="text-2xl font-semibold text-stone-900">
          Auction categories
        </h1>
        <p className="text-sm text-stone-600">
          Organize items into themed categories for filtering.
        </p>
      </header>

      <form
        className="space-y-4 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await createAuctionCategory(auction.id, formData);
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-semibold text-stone-700">
            Name
            <input
              name="name"
              type="text"
              required
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
              placeholder="Experiences"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Description
            <input
              name="description"
              type="text"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Sort order
            <input
              name="sortOrder"
              type="number"
              min="0"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
              placeholder="0"
            />
          </label>
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Add category
        </button>
      </form>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
              <th className="px-4 py-3 font-semibold text-stone-700">
                Description
              </th>
              <th className="px-4 py-3 font-semibold text-stone-700">
                Sort order
              </th>
            </tr>
          </thead>
          <tbody>
            {auction.categories.length ? (
              auction.categories.map((category) => (
                <tr key={category.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    {category.name}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {category.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {category.sortOrder}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
                  colSpan={3}
                >
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
