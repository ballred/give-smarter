import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createAuctionCategory } from "./category-actions";

export default async function AuctionCategoriesPage({
  params,
}: {
  params: { auctionId: string };
}) {
  const auction = await prisma.auction.findUnique({
    where: { id: params.auctionId },
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
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          {auction.campaign?.name ?? "Campaign"}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Auction categories
        </h1>
        <p className="text-sm text-zinc-600">
          Organize items into themed categories for filtering.
        </p>
      </header>

      <form
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await createAuctionCategory(auction.id, formData);
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-semibold text-zinc-700">
            Name
            <input
              name="name"
              type="text"
              required
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              placeholder="Experiences"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Description
            <input
              name="description"
              type="text"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Sort order
            <input
              name="sortOrder"
              type="number"
              min="0"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              placeholder="0"
            />
          </label>
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Add category
        </button>
      </form>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Name</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">
                Description
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700">
                Sort order
              </th>
            </tr>
          </thead>
          <tbody>
            {auction.categories.length ? (
              auction.categories.map((category) => (
                <tr key={category.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    {category.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {category.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {category.sortOrder}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500"
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
