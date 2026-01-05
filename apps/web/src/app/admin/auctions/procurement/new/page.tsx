import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createProcurementSubmission } from "./procurement-actions";

export default async function NewProcurementSubmissionPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">
          New procurement submission
        </h1>
        <p className="text-sm text-zinc-600">
          Capture item details and donor contact information.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createProcurementSubmission(formData);
          redirect(`/admin/auctions/procurement?created=${id}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Campaign
          <select
            name="campaignId"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="">Select a campaign (optional)</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            Donor name
            <input
              name="donorName"
              type="text"
              required
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              placeholder="Taylor Family"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Donor email
            <input
              name="donorEmail"
              type="email"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-zinc-700">
          Donor phone
          <input
            name="donorPhone"
            type="tel"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Item title
          <input
            name="itemTitle"
            type="text"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Item description
          <textarea
            name="itemDescription"
            rows={3}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            FMV (USD)
            <input
              name="fmvAmount"
              type="number"
              min="0"
              step="0.01"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Restrictions
            <input
              name="restrictions"
              type="text"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              placeholder="Blackout dates apply"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-zinc-700">
          Notes
          <textarea
            name="notes"
            rows={3}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Save submission
        </button>
      </form>
    </div>
  );
}
