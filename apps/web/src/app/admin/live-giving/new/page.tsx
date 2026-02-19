import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createPaddleRaiseLevel } from "./paddle-raise-actions";

export default async function NewPaddleRaiseLevelPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">
          Create paddle raise level
        </h1>
        <p className="text-sm text-stone-600">
          Define giving levels and matching sponsor details.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createPaddleRaiseLevel(formData);
          redirect(`/admin/live-giving?created=${id}`);
        }}
      >
        <label className="block text-sm font-semibold text-stone-700">
          Campaign
          <select
            name="campaignId"
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
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

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Label
            <input
              name="label"
              type="text"
              required
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
              placeholder="Provides classroom supplies"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Amount (USD)
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-stone-700">
          Match sponsor name (optional)
          <input
            name="matchSponsorName"
            type="text"
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            placeholder="Acme Family Foundation"
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

        <label className="flex items-center gap-3 text-sm font-semibold text-stone-700">
          <input
            name="isActive"
            type="checkbox"
            className="h-4 w-4 rounded border-amber-300 text-teal-600"
            defaultChecked
          />
          Active level
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-teal-700 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Save level
        </button>
      </form>
    </div>
  );
}
