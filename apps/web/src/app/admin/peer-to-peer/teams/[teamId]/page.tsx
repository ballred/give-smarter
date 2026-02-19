import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { updatePeerTeam } from "../team-actions";

type TeamDetailPageProps = {
  params: Promise<{ teamId: string }>;
};

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const resolvedParams = await params;
  const team = await prisma.peerFundraisingTeam.findUnique({
    where: { id: resolvedParams.teamId },
  });

  if (!team) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-200/60 bg-white p-6 text-sm text-stone-500">
        Team not found.
      </div>
    );
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: team.campaignId },
    select: { name: true },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">{team.name}</h1>
        <p className="text-sm text-stone-600">
          {campaign?.name ?? "Campaign"} | Team details
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await updatePeerTeam(resolvedParams.teamId, formData);
          redirect(`/admin/peer-to-peer/teams/${resolvedParams.teamId}`);
        }}
      >
        <label className="block text-sm font-semibold text-stone-700">
          Team name
          <input
            name="name"
            type="text"
            required
            defaultValue={team.name}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Slug
          <input
            name="slug"
            type="text"
            defaultValue={team.slug}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Story
          <textarea
            name="story"
            rows={3}
            defaultValue={team.story ?? ""}
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
            defaultValue={team.goalAmount ? team.goalAmount / 100 : ""}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
