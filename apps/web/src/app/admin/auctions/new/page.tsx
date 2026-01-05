import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createAuction } from "./auction-actions";

export default async function NewAuctionPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Create auction
        </h1>
        <p className="text-sm text-zinc-600">
          Set the auction window, bidding increments, and preview mode.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createAuction(formData);
          redirect(`/admin/auctions?created=${id}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Campaign
          <select
            name="campaignId"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            required
          >
            <option value="" disabled>
              Select a campaign
            </option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Auction name
          <input
            name="name"
            type="text"
            required
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            placeholder="Spring Gala Silent Auction"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Timezone
          <input
            name="timezone"
            type="text"
            required
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            placeholder="America/Los_Angeles"
            defaultValue="America/Los_Angeles"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            Opens at
            <input
              name="opensAt"
              type="datetime-local"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Closes at
            <input
              name="closesAt"
              type="datetime-local"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex items-center gap-3 text-sm font-semibold text-zinc-700">
            <input
              name="allowMaxBid"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
              defaultChecked
            />
            Allow max bid
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-zinc-700">
            <input
              name="allowBuyNow"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
            />
            Allow buy-now
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Anti-sniping (minutes)
            <input
              name="antiSnipingMinutes"
              type="number"
              min="0"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              placeholder="0"
            />
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Save auction
        </button>
      </form>
    </div>
  );
}
