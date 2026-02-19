import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createPeerTeam } from "../team-actions";

export default async function NewTeamPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">Create team</h1>
        <p className="text-sm text-stone-600">
          Add a new fundraising team.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createPeerTeam(formData);
          redirect(`/admin/peer-to-peer/teams/${id}`);
        }}
      >
        <label className="block text-sm font-semibold text-stone-700">
          Campaign
          <select
            name="campaignId"
            required
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
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

        <label className="block text-sm font-semibold text-stone-700">
          Team name
          <input
            name="name"
            type="text"
            required
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Slug
          <input
            name="slug"
            type="text"
            placeholder="auto-generated if blank"
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Story
          <textarea
            name="story"
            rows={3}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Goal (USD)
          <input
            name="goalAmount"
            type="number"
            min="0"
            step="0.01"
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Create team
        </button>
      </form>
    </div>
  );
}
