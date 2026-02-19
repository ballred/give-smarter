import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createVotingContest } from "./voting-actions";

export default async function NewVotingContestPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">
          Create voting contest
        </h1>
        <p className="text-sm text-stone-600">
          Create a donation-driven voting competition.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createVotingContest(formData);
          redirect(`/admin/voting?created=${id}`);
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
          Contest name
          <input
            name="name"
            type="text"
            required
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Starts at
            <input
              name="startsAt"
              type="datetime-local"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Ends at
            <input
              name="endsAt"
              type="datetime-local"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-teal-700 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Save contest
        </button>
      </form>
    </div>
  );
}
